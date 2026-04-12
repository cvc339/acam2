/**
 * Avaliação de Critérios — Compensação Mata Atlântica
 * Art. 49, II, Decreto 47.749/2019
 *
 * 6 critérios para destinação em UC:
 * 1. Compensação 2:1 em vegetação natural (obrigatório)
 * 2. Localização no bioma Mata Atlântica (obrigatório)
 * 3. Mesma bacia hidrográfica federal (obrigatório)
 * 4. Mesma sub-bacia hidrográfica (preferencial)
 * 5. Características ecológicas similares (obrigatório)
 * 6. Área em UC de Proteção Integral (obrigatório)
 */

import type { ResultadoCoberturaDetalhada } from "./analise-geoespacial"

// ============================================
// TIPOS
// ============================================

export interface CriterioMA {
  id: number
  nome: string
  obrigatorio: boolean
  atendido: boolean
  parcial?: boolean
  detalhe: string
  percentualAtendimento?: number
}

export interface CompensacaoCalculo {
  areaSuprimida: number
  areaNecessaria: number
  areaVegetacaoNaturalProposta: number
  percentualNaturalProposta: number
  percentualAtendimento: number
  areaFaltante: number
}

export interface ResultadoCriteriosMA {
  criterios: CriterioMA[]
  compensacao: CompensacaoCalculo
  viabilidade: "ALTA" | "MÉDIA" | "BAIXA"
  recomendacao: string
  alertas: string[]
}

interface DadosBacia {
  sigla: string | null
  nome: string | null
  bacia_federal: string | null
}

interface DadosCobertura {
  sucesso: boolean
  totaisPorTipo?: {
    natural: { percentual: number; areaHa: number }
    antropico: { percentual: number; areaHa: number }
  }
  classes?: Array<{ classe: string; tipo: string; percentual: number; areaEstimadaHa: number }>
}

interface DadosUC {
  nome: string
  categoria: string
  protecao_integral: boolean
  percentual_sobreposicao: number | null
}

// ============================================
// AVALIAÇÃO
// ============================================

export function avaliarCriteriosMA(dados: {
  areaSuprimidaHa: number
  areaPropostaHa: number
  maSuprimida: boolean | null
  maProposta: boolean | null
  baciaSuprimida: DadosBacia | null
  baciaProposta: DadosBacia | null
  coberturaSuprimida: DadosCobertura | null
  coberturaProposta: DadosCobertura | null
  ucPrincipal: DadosUC | null
}): ResultadoCriteriosMA {
  const criterios: CriterioMA[] = []
  const alertas: string[] = []

  // ── CRITÉRIO 1: Compensação 2:1 em vegetação natural ──

  const areaNecessaria = dados.areaSuprimidaHa * 2
  const percentualNaturalProposta = dados.coberturaProposta?.totaisPorTipo?.natural?.percentual ?? 0
  const areaVegetNatural = (percentualNaturalProposta / 100) * dados.areaPropostaHa
  const percentualAtendimento = areaNecessaria > 0 ? (areaVegetNatural / areaNecessaria) * 100 : 0
  const areaFaltante = Math.max(0, areaNecessaria - areaVegetNatural)

  const compensacao: CompensacaoCalculo = {
    areaSuprimida: dados.areaSuprimidaHa,
    areaNecessaria,
    areaVegetacaoNaturalProposta: parseFloat(areaVegetNatural.toFixed(1)),
    percentualNaturalProposta: parseFloat(percentualNaturalProposta.toFixed(1)),
    percentualAtendimento: parseFloat(percentualAtendimento.toFixed(1)),
    areaFaltante: parseFloat(areaFaltante.toFixed(1)),
  }

  criterios.push({
    id: 1,
    nome: "Compensação 2:1 em vegetação natural",
    obrigatorio: true,
    atendido: percentualAtendimento >= 100,
    detalhe: `Necessário: ${areaNecessaria.toFixed(2)} ha | Disponível: ${areaVegetNatural.toFixed(1)} ha (${percentualNaturalProposta.toFixed(1)}% da área) | Atendimento: ${percentualAtendimento.toFixed(1)}%`,
    percentualAtendimento: parseFloat(percentualAtendimento.toFixed(1)),
  })

  // ── CRITÉRIO 2: Localização no bioma Mata Atlântica ──

  const biomaSuprimida = dados.maSuprimida === true
  const biomaProposta = dados.maProposta === true
  const bioma = biomaSuprimida && biomaProposta

  criterios.push({
    id: 2,
    nome: "Localização no bioma",
    obrigatorio: true,
    atendido: bioma,
    detalhe: `Suprimida: ${biomaSuprimida ? "Sim" : "Não"} | Proposta: ${biomaProposta ? "Sim" : "Não"}`,
  })

  if (!biomaSuprimida) alertas.push("A área de supressão não foi identificada no bioma Mata Atlântica.")
  if (!biomaProposta) alertas.push("A área proposta não foi identificada no bioma Mata Atlântica.")

  // ── CRITÉRIO 3: Mesma bacia hidrográfica federal ──

  const baciaFedSuprimida = dados.baciaSuprimida?.bacia_federal || null
  const baciaFedProposta = dados.baciaProposta?.bacia_federal || null
  const mesmaBacia = !!(baciaFedSuprimida && baciaFedProposta && baciaFedSuprimida === baciaFedProposta)

  criterios.push({
    id: 3,
    nome: "Mesma bacia hidrográfica",
    obrigatorio: true,
    atendido: mesmaBacia,
    detalhe: `Suprimida: ${baciaFedSuprimida || "não identificada"} | Proposta: ${baciaFedProposta || "não identificada"}`,
  })

  // ── CRITÉRIO 4: Mesma sub-bacia (preferencial) ──

  const siglaSuprimida = dados.baciaSuprimida?.sigla || null
  const siglaProposta = dados.baciaProposta?.sigla || null
  const mesmaSubBacia = !!(siglaSuprimida && siglaProposta && siglaSuprimida === siglaProposta)

  criterios.push({
    id: 4,
    nome: "Mesma sub-bacia hidrográfica",
    obrigatorio: false,
    atendido: mesmaSubBacia,
    parcial: mesmaBacia && !mesmaSubBacia,
    detalhe: `Suprimida: ${siglaSuprimida || "não identificada"} (${dados.baciaSuprimida?.nome || "?"}) | Proposta: ${siglaProposta || "não identificada"} (${dados.baciaProposta?.nome || "?"})`,
  })

  // ── CRITÉRIO 5: Vegetação nativa do bioma MA na área proposta ──
  // Art. 49, II: "independente de possuir as mesmas características ecológicas,
  // (...) observando-se a obrigatoriedade da área possuir vegetação nativa
  // característica do Bioma Mata Atlântica, independentemente de seu estágio de regeneração."

  const classesProposta = dados.coberturaProposta?.classes || []
  const percentualNativaProposta = dados.coberturaProposta?.totaisPorTipo?.natural?.percentual ?? 0
  const descProposta = classesProposta.filter((c) => c.tipo === "natural" && c.percentual >= 2).map((c) => c.classe).join(", ") || "N/I"

  // Vegetação nativa do bioma = percentual natural significativo (>= 50%)
  const temVegetacaoNativa = percentualNativaProposta >= 50

  criterios.push({
    id: 5,
    nome: "Vegetação nativa do bioma",
    obrigatorio: true,
    atendido: temVegetacaoNativa,
    detalhe: `Vegetação nativa: ${percentualNativaProposta.toFixed(1)}% da área proposta (${descProposta}). Independente do estágio de regeneração.`,
  })

  // ── CRITÉRIO 6: Área em UC de Proteção Integral ──

  const emUCPI = dados.ucPrincipal?.protecao_integral === true

  criterios.push({
    id: 6,
    nome: "Área em UC de Proteção Integral",
    obrigatorio: true,
    atendido: emUCPI,
    detalhe: emUCPI
      ? `${dados.ucPrincipal!.nome} (${dados.ucPrincipal!.percentual_sobreposicao ?? "?"}%) - Proteção Integral`
      : dados.ucPrincipal
        ? `${dados.ucPrincipal.nome} - ${dados.ucPrincipal.protecao_integral ? "Proteção Integral" : "Uso Sustentável"}`
        : "Nenhuma UC identificada na área proposta",
  })

  // ── VIABILIDADE ──

  const obrigatoriosAtendidos = criterios.filter((c) => c.obrigatorio).every((c) => c.atendido)

  let viabilidade: "ALTA" | "MÉDIA" | "BAIXA"
  let recomendacao: string

  if (!obrigatoriosAtendidos) {
    viabilidade = "BAIXA"
    const falhas = criterios.filter((c) => c.obrigatorio && !c.atendido).map((c) => c.nome)
    recomendacao = `A área proposta não atende a critérios obrigatórios: ${falhas.join("; ")}. Viabilidade baixa para compensação de Mata Atlântica.`
  } else if (percentualAtendimento >= 100 && mesmaSubBacia) {
    viabilidade = "ALTA"
    recomendacao = "A área proposta atende a todos os critérios obrigatórios e preferenciais. Viabilidade alta para compensação de Mata Atlântica por destinação em UC."
  } else if (percentualAtendimento >= 100) {
    viabilidade = "ALTA"
    recomendacao = `A área proposta atende a todos os critérios obrigatórios. Sub-bacia diferente (preferencial). Viabilidade alta para compensação de Mata Atlântica.`
  } else if (percentualAtendimento >= 50) {
    viabilidade = "MÉDIA"
    recomendacao = `A área proposta atende aos critérios obrigatórios, mas a compensação 2:1 está parcialmente atendida (${percentualAtendimento.toFixed(1)}%). Faltam ${areaFaltante.toFixed(1)} ha de vegetação natural.`
  } else {
    viabilidade = "BAIXA"
    recomendacao = `A área proposta tem vegetação natural insuficiente para compensação 2:1 (${percentualAtendimento.toFixed(1)}%). Faltam ${areaFaltante.toFixed(1)} ha.`
  }

  return { criterios, compensacao, viabilidade, recomendacao, alertas }
}

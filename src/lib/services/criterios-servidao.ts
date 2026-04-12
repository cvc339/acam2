/**
 * Avaliação de Critérios — Servidão Ambiental / RPPN
 * Art. 50, Decreto 47.749/2019
 *
 * Critérios obrigatórios:
 * 1. Mesma bacia hidrográfica
 * 2. Vegetação nativa do bioma MA
 * 3. Similaridade de fitofisionomia (Art. 50)
 *
 * Ganho ambiental (§1º do Art. 50) — complementar:
 * 4. Área em zona prioritária para conservação
 * 5. Área em corredor ecológico
 * 6. Prioridade por biodiversidade (flora/fauna)
 * 7. Conectividade com UCs
 *
 * §1º: "podendo ser considerado o ganho ambiental no estabelecimento
 * da área como protegida, quando for inviável o atendimento de algumas
 * destas características."
 */

import type { ResultadoCoberturaDetalhada } from "./analise-geoespacial"
import type { ResultadoFitofisionomia, ResultadoAreaPrioritaria, ResultadoCorredorEcologico, ResultadoPrioridadeBiodiversidade } from "./analise-geoespacial"

// ============================================
// TIPOS
// ============================================

export interface CriterioServidao {
  id: number
  nome: string
  obrigatorio: boolean
  ganhoAmbiental?: boolean
  atendido: boolean
  parcial?: boolean
  detalhe: string
}

export interface CompensacaoCalculo {
  areaSuprimida: number
  areaNecessaria: number
  areaVegetacaoNaturalProposta: number
  percentualNaturalProposta: number
  percentualAtendimento: number
  areaFaltante: number
}

export interface GanhoAmbientalResumo {
  temGanho: boolean
  indicadores: string[]
  fundamentacao: string
}

export interface ResultadoCriteriosServidao {
  criterios: CriterioServidao[]
  compensacao: CompensacaoCalculo
  ganhoAmbiental: GanhoAmbientalResumo
  viabilidade: "ALTA" | "MÉDIA" | "BAIXA"
  recomendacao: string
  alertas: string[]
}

interface DadosBacia {
  sigla: string | null
  nome: string | null
  bacia_federal: string | null
}

// ============================================
// AVALIAÇÃO
// ============================================

export function avaliarCriteriosServidao(dados: {
  areaSuprimidaHa: number
  areaPropostaHa: number
  maSuprimida: boolean | null
  maProposta: boolean | null
  baciaSuprimida: DadosBacia | null
  baciaProposta: DadosBacia | null
  coberturaSuprimida: ResultadoCoberturaDetalhada | null
  coberturaProposta: ResultadoCoberturaDetalhada | null
  fitofisionomiaSuprimida: ResultadoFitofisionomia | null
  fitofisionomaProposta: ResultadoFitofisionomia | null
  areaPrioritaria: ResultadoAreaPrioritaria | null
  corredor: ResultadoCorredorEcologico | null
  biodiversidade: ResultadoPrioridadeBiodiversidade | null
  temUCProxima: boolean
}): ResultadoCriteriosServidao {
  const criterios: CriterioServidao[] = []
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
  })

  // ── CRITÉRIO 2: Mesma bacia hidrográfica ──

  const baciaFedSuprimida = dados.baciaSuprimida?.bacia_federal || null
  const baciaFedProposta = dados.baciaProposta?.bacia_federal || null
  const mesmaBacia = !!(baciaFedSuprimida && baciaFedProposta && baciaFedSuprimida === baciaFedProposta)

  criterios.push({
    id: 2,
    nome: "Mesma bacia hidrográfica",
    obrigatorio: true,
    atendido: mesmaBacia,
    detalhe: `Suprimida: ${baciaFedSuprimida || "não identificada"} | Proposta: ${baciaFedProposta || "não identificada"}`,
  })

  // ── CRITÉRIO 3: Vegetação nativa do bioma MA ──

  const biomaSuprimida = dados.maSuprimida === true
  const biomaProposta = dados.maProposta === true

  criterios.push({
    id: 3,
    nome: "Vegetação nativa do bioma Mata Atlântica",
    obrigatorio: true,
    atendido: biomaSuprimida && biomaProposta,
    detalhe: `Suprimida: ${biomaSuprimida ? "Sim" : "Não"} | Proposta: ${biomaProposta ? "Sim" : "Não"}`,
  })

  // ── CRITÉRIO 4: Similaridade de fitofisionomia (Art. 50) ──

  const classesSuprimida = dados.coberturaSuprimida?.classes || []
  const classesProposta = dados.coberturaProposta?.classes || []
  const naturaisSuprimida = classesSuprimida.filter((c) => c.tipo === "natural").map((c) => c.classe)
  const naturaisProposta = classesProposta.filter((c) => c.tipo === "natural").map((c) => c.classe)

  // Comparar classes MapBiomas
  const classesComuns = naturaisSuprimida.filter((c) => naturaisProposta.includes(c))
  const temSimilaridadeMapBiomas = classesComuns.length > 0

  // Comparar fitofisionomia IDE-Sisema (mais detalhada)
  const fitoSup = dados.fitofisionomiaSuprimida?.fitofisionomia || null
  const fitoProp = dados.fitofisionomaProposta?.fitofisionomia || null
  const temSimilaridadeFito = !!(fitoSup && fitoProp && fitoSup === fitoProp)

  const similaridadeAtendida = temSimilaridadeMapBiomas || temSimilaridadeFito

  const descSuprimida = naturaisSuprimida.join(", ") || "N/I"
  const descProposta = naturaisProposta.join(", ") || "N/I"
  let detalheFito = `MapBiomas — Suprimida: ${descSuprimida} | Proposta: ${descProposta}`
  if (fitoSup || fitoProp) {
    detalheFito += ` | IDE-Sisema — Suprimida: ${fitoSup || "N/I"} | Proposta: ${fitoProp || "N/I"}`
  }
  if (classesComuns.length > 0) {
    detalheFito += ` | Classes em comum: ${classesComuns.join(", ")}`
  }

  criterios.push({
    id: 4,
    nome: "Similaridade de fitofisionomia",
    obrigatorio: true,
    atendido: similaridadeAtendida,
    parcial: !similaridadeAtendida && (naturaisProposta.length > 0),
    detalhe: detalheFito,
  })

  if (!similaridadeAtendida && naturaisProposta.length > 0) {
    alertas.push("Similaridade fitofisionômica não confirmada por dados remotos. A avaliação de ganho ambiental (§1º do Art. 50) pode suprir esta exigência. Recomenda-se inventário florístico de campo.")
  }

  // ── GANHO AMBIENTAL (§1º do Art. 50) ──

  const indicadoresGanho: string[] = []

  // 5. Área prioritária para conservação
  const emAreaPrioritaria = dados.areaPrioritaria?.emAreaPrioritaria === true
  criterios.push({
    id: 5,
    nome: "Área prioritária para conservação",
    obrigatorio: false,
    ganhoAmbiental: true,
    atendido: emAreaPrioritaria,
    detalhe: emAreaPrioritaria
      ? `${dados.areaPrioritaria!.categoria || "Área prioritária"} — ${dados.areaPrioritaria!.importancia || "importância não classificada"}`
      : "Área não identificada em zona prioritária para conservação (IDE-Sisema)",
  })
  if (emAreaPrioritaria) indicadoresGanho.push(`Área prioritária para conservação: ${dados.areaPrioritaria!.categoria}`)

  // 6. Corredor ecológico
  const emCorredor = dados.corredor?.emCorredor === true
  criterios.push({
    id: 6,
    nome: "Corredor ecológico",
    obrigatorio: false,
    ganhoAmbiental: true,
    atendido: emCorredor,
    detalhe: emCorredor
      ? `Área inserida no corredor ecológico: ${dados.corredor!.nome}`
      : "Área não identificada em corredor ecológico mapeado (IDE-Sisema)",
  })
  if (emCorredor) indicadoresGanho.push(`Corredor ecológico: ${dados.corredor!.nome}`)

  // 7. Prioridade por biodiversidade
  const bioFlora = dados.biodiversidade?.flora?.prioritaria === true
  const bioFauna = dados.biodiversidade?.fauna?.prioritaria === true
  const bioAves = dados.biodiversidade?.avifauna?.prioritaria === true
  const temPrioridadeBio = bioFlora || bioFauna || bioAves

  const detalhesBio: string[] = []
  if (bioFlora) detalhesBio.push(`Flora: ${dados.biodiversidade!.flora.categoria || "prioritária"}`)
  if (bioFauna) detalhesBio.push(`Mamíferos: ${dados.biodiversidade!.fauna.categoria || "prioritária"}`)
  if (bioAves) detalhesBio.push(`Avifauna: ${dados.biodiversidade!.avifauna.categoria || "prioritária"}`)

  criterios.push({
    id: 7,
    nome: "Prioridade para biodiversidade",
    obrigatorio: false,
    ganhoAmbiental: true,
    atendido: temPrioridadeBio,
    detalhe: temPrioridadeBio
      ? detalhesBio.join(" | ")
      : "Área não identificada em zona prioritária para biodiversidade (IDE-Sisema)",
  })
  if (temPrioridadeBio) indicadoresGanho.push(`Biodiversidade: ${detalhesBio.join(", ")}`)

  // 8. Conectividade com UCs
  criterios.push({
    id: 8,
    nome: "Conectividade com Unidades de Conservação",
    obrigatorio: false,
    ganhoAmbiental: true,
    atendido: dados.temUCProxima,
    detalhe: dados.temUCProxima
      ? "Área com sobreposição ou proximidade a Unidades de Conservação identificadas"
      : "Nenhuma UC identificada na área ou proximidade imediata",
  })
  if (dados.temUCProxima) indicadoresGanho.push("Conectividade com Unidade de Conservação")

  // Resumo do ganho ambiental
  const temGanho = indicadoresGanho.length > 0
  const ganhoAmbiental: GanhoAmbientalResumo = {
    temGanho,
    indicadores: indicadoresGanho,
    fundamentacao: temGanho
      ? `A área proposta apresenta ${indicadoresGanho.length} indicador(es) de ganho ambiental conforme §1º do Art. 50 do Decreto 47.749/2019: ${indicadoresGanho.join("; ")}. O ganho ambiental decorrente do estabelecimento da área como protegida (servidão ambiental ou RPPN) pode suprir eventuais lacunas na demonstração de similaridade ecológica exata.`
      : "Nenhum indicador de ganho ambiental identificado nas camadas geoespaciais consultadas (IDE-Sisema). Recomenda-se análise complementar de paisagem para avaliar potencial de conectividade e formação de corredores.",
  }

  // ── VIABILIDADE ──

  const obrigatoriosAtendidos = criterios.filter((c) => c.obrigatorio).every((c) => c.atendido)
  const similaridadeParcial = criterios.find((c) => c.id === 4)?.parcial === true

  let viabilidade: "ALTA" | "MÉDIA" | "BAIXA"
  let recomendacao: string

  if (!mesmaBacia || !(biomaSuprimida && biomaProposta)) {
    // Bacia ou bioma falhou — BAIXA
    viabilidade = "BAIXA"
    const falhas = criterios.filter((c) => c.obrigatorio && !c.atendido && c.id <= 3).map((c) => c.nome)
    recomendacao = `A área proposta não atende a critérios obrigatórios: ${falhas.join("; ")}. Viabilidade baixa para compensação de Mata Atlântica por servidão/RPPN.`
  } else if (obrigatoriosAtendidos && temGanho) {
    viabilidade = "ALTA"
    recomendacao = `A área proposta atende aos critérios obrigatórios (bacia, bioma, fitofisionomia) e apresenta indicadores de ganho ambiental (§1º do Art. 50). Viabilidade alta para compensação por servidão ambiental ou RPPN.`
  } else if (obrigatoriosAtendidos) {
    viabilidade = "ALTA"
    recomendacao = `A área proposta atende aos critérios obrigatórios. Sem indicadores adicionais de ganho ambiental identificados remotamente — análise de paisagem complementar recomendada.`
  } else if (similaridadeParcial && temGanho) {
    viabilidade = "MÉDIA"
    recomendacao = `A área proposta atende aos critérios de bacia e bioma, mas a similaridade fitofisionômica não foi plenamente confirmada por dados remotos. O ganho ambiental identificado (${indicadoresGanho.join("; ")}) pode suprir esta lacuna conforme §1º do Art. 50. Recomenda-se inventário florístico para confirmar.`
  } else if (percentualAtendimento < 100 && percentualAtendimento >= 50) {
    viabilidade = "MÉDIA"
    recomendacao = `A compensação 2:1 está parcialmente atendida (${percentualAtendimento.toFixed(1)}%). Faltam ${areaFaltante.toFixed(1)} ha de vegetação natural.`
  } else {
    viabilidade = "BAIXA"
    const falhas = criterios.filter((c) => c.obrigatorio && !c.atendido).map((c) => c.nome)
    recomendacao = `Critérios não atendidos: ${falhas.join("; ")}. Viabilidade baixa.`
  }

  return { criterios, compensacao, ganhoAmbiental, viabilidade, recomendacao, alertas }
}

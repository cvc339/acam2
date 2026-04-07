// Lógica de identificação de compensações — replicada do ACAM1
// Alteração aprovada pelo fundador: SNUC com status "verificar" para licenciados sem EIA/RIMA

import type { Compensacao } from "@/components/acam/compensacao-icon"

export type StatusCompensacao = "provavel" | "verificar"

export interface CompensacaoIdentificada {
  id: Compensacao
  nome: string
  motivo: string
  status: StatusCompensacao
  nota?: string
}

export function identificarCompensacoes(
  respostas: Record<string, string | string[]>
): CompensacaoIdentificada[] {
  const resultado: CompensacaoIdentificada[] = []

  // 1. Compensação Minerária MG
  if (
    respostas.tipo_empreendimento === "mineracao" &&
    respostas.estado === "mg" &&
    respostas.supressao === "sim"
  ) {
    resultado.push({
      id: "mineraria",
      nome: "Compensação Minerária",
      motivo: "Empreendimento minerário em MG com supressão de vegetação nativa",
      status: "provavel",
    })
  }

  // 2. Compensação Mata Atlântica
  if (
    (respostas.bioma_ma === "sim" || respostas.bioma_ma === "parcial") &&
    respostas.supressao === "sim"
  ) {
    resultado.push({
      id: "mata-atlantica",
      nome: "Compensação Mata Atlântica",
      motivo: "Supressão de vegetação nativa no Bioma Mata Atlântica",
      status: "provavel",
    })
  }

  // 3. Compensação SNUC
  if (
    respostas.licenciamento === "sim" &&
    respostas.impacto_significativo === "sim"
  ) {
    // Caso 1: EIA/RIMA exigido — lei é clara
    resultado.push({
      id: "snuc",
      nome: "Compensação SNUC",
      motivo: "Empreendimento de significativo impacto ambiental (EIA/RIMA exigido)",
      status: "provavel",
    })
  } else if (
    respostas.licenciamento === "sim" &&
    (respostas.impacto_significativo === "nao" || respostas.impacto_significativo === "analise")
  ) {
    // Caso 2: Licenciado mas sem EIA/RIMA — prática do Estado de MG diverge da lei
    resultado.push({
      id: "snuc",
      nome: "Compensação SNUC",
      motivo: "Empreendimento licenciado sem EIA/RIMA",
      status: "verificar",
      nota: "Pela legislação (Lei 9.985, Art. 36 e Lei 20.922, Art. 48), a compensação SNUC é exigida para empreendimentos com EIA/RIMA. No entanto, o Estado de MG tem cobrado essa compensação também de empreendimentos licenciados sem EIA/RIMA. Recomenda-se verificar com o órgão ambiental licenciador.",
    })
  }

  // 4. Compensação de Reserva Legal
  if (respostas.intervencao_rl === "sim") {
    resultado.push({
      id: "reserva-legal",
      nome: "Compensação de Reserva Legal",
      motivo: "Intervenção em Reserva Legal averbada ou declarada no CAR",
      status: "provavel",
    })
  }

  // 5. Compensação APP
  if (respostas.intervencao_app === "sim") {
    resultado.push({
      id: "app",
      nome: "Compensação APP",
      motivo: "Intervenção em Área de Preservação Permanente",
      status: "provavel",
    })
  }

  // 6. Compensação por Espécies Ameaçadas
  if (
    respostas.especies_ameacadas === "sim" &&
    respostas.supressao === "sim"
  ) {
    resultado.push({
      id: "ameacadas",
      nome: "Compensação de Espécies Ameaçadas",
      motivo: "Espécies ameaçadas de extinção identificadas na área de supressão",
      status: "provavel",
    })
  }

  // 7. Compensação por Espécies Imunes de Corte
  if (
    respostas.especies_imunes === "sim" &&
    respostas.supressao === "sim"
  ) {
    resultado.push({
      id: "imunes",
      nome: "Compensação de Espécies Imunes",
      motivo: "Espécies imunes de corte identificadas na área de supressão",
      status: "provavel",
    })
  }

  // 8. Reposição Florestal
  if (
    respostas.supressao === "sim" &&
    respostas.estado === "mg"
  ) {
    resultado.push({
      id: "reposicao-florestal",
      nome: "Reposição Florestal",
      motivo: "Supressão de vegetação nativa em Minas Gerais",
      status: "provavel",
    })
  }

  return resultado
}

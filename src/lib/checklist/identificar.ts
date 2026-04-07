// Lógica de identificação de compensações — replicada fielmente do ACAM1
// NÃO alterar sem consulta ao fundador

import type { Compensacao } from "@/components/acam/compensacao-icon"

interface CompensacaoIdentificada {
  id: Compensacao
  nome: string
  motivo: string
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
    })
  }

  // 3. Compensação SNUC
  if (
    respostas.licenciamento === "sim" &&
    respostas.impacto_significativo === "sim"
  ) {
    resultado.push({
      id: "snuc",
      nome: "Compensação SNUC",
      motivo: "Empreendimento de significativo impacto ambiental (EIA/RIMA exigido)",
    })
  }

  // 4. Compensação de Reserva Legal
  if (respostas.intervencao_rl === "sim") {
    resultado.push({
      id: "reserva-legal",
      nome: "Compensação de Reserva Legal",
      motivo: "Intervenção em Reserva Legal averbada ou declarada no CAR",
    })
  }

  // 5. Compensação APP
  if (respostas.intervencao_app === "sim") {
    resultado.push({
      id: "app",
      nome: "Compensação APP",
      motivo: "Intervenção em Área de Preservação Permanente",
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
    })
  }

  return resultado
}

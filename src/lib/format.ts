/**
 * Formatação de números para exibição — pt-BR
 *
 * Módulo centralizado. Não duplicar fmt/fmtNum nos arquivos.
 * Importar: import { formatBRL, formatNum } from "@/lib/format"
 */

/** Formata valor como moeda brasileira: R$ 1.234,56 */
export function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

/** Formata número decimal com 2 casas: 1.234,56 */
export function formatNum(v: number, decimais = 2): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: decimais, maximumFractionDigits: decimais })
}

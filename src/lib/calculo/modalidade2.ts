/**
 * Cálculo de Compensação Minerária — Modalidade 2
 * Implantação ou Manutenção de Unidade de Conservação de Proteção Integral
 *
 * Base legal: Lei 20.922/2013, Portaria IEF 27/2017
 * Última verificação: 2026-04-08
 *
 * Fórmula: Área (ha) × UFEMG/ha × Valor UFEMG (R$)
 */

export type TipoVegetacao = "campo_altitude" | "cerrado" | "campo_rupestre"

export const VALORES_UFEMG_POR_HA: Record<TipoVegetacao, number> = {
  campo_altitude: 5362.35,
  cerrado: 7364.74,
  campo_rupestre: 21588.23,
}

export const NOMES_VEGETACAO: Record<TipoVegetacao, string> = {
  campo_altitude: "Campo de Altitude / Campo Limpo",
  cerrado: "Cerrado",
  campo_rupestre: "Campo Rupestre",
}

export interface ResultadoModalidade2 {
  area: number
  tipoVegetacao: TipoVegetacao
  nomeVegetacao: string
  ufemgPorHa: number
  totalUFEMGs: number
  totalReais: number
  ufemgValor: number
  ufemgAno: number
}

export function calcularModalidade2(
  area: number,
  tipoVegetacao: TipoVegetacao,
  ufemgValor: number,
  ufemgAno: number
): ResultadoModalidade2 {
  const ufemgPorHa = VALORES_UFEMG_POR_HA[tipoVegetacao]
  const totalUFEMGs = area * ufemgPorHa
  const totalReais = totalUFEMGs * ufemgValor

  return {
    area,
    tipoVegetacao,
    nomeVegetacao: NOMES_VEGETACAO[tipoVegetacao],
    ufemgPorHa,
    totalUFEMGs,
    totalReais,
    ufemgValor,
    ufemgAno,
  }
}

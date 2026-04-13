/**
 * Testes para cálculo de Compensação SNUC
 *
 * Executar: npx vitest run src/lib/calculo/snuc.test.ts
 * (requer vitest configurado)
 */

import { describe, it, expect } from "vitest"
import {
  calcularTotalFR,
  calcularGI,
  calcularCA,
  calcularSNUC,
  FATORES_FR,
  OPCOES_FT,
  OPCOES_FA,
  GI_MAXIMO,
  type FatorSelecionado,
} from "./snuc"

// ============================================
// HELPERS
// ============================================

function fator(id: string): FatorSelecionado {
  const f = FATORES_FR.find((f) => f.id === id)!
  return { id: f.id, descricao: f.descricao, valor: f.valor }
}

// ============================================
// calcularTotalFR
// ============================================

describe("calcularTotalFR", () => {
  it("retorna 0 para array vazio", () => {
    expect(calcularTotalFR([])).toBe(0)
  })

  it("soma um único fator corretamente", () => {
    expect(calcularTotalFR([fator("fr1")])).toBe(0.075)
  })

  it("soma múltiplos fatores", () => {
    const fatores = [fator("fr1"), fator("fr5"), fator("fr3a")]
    expect(calcularTotalFR(fatores)).toBeCloseTo(0.075 + 0.1 + 0.05, 4)
  })

  it("soma todos os fatores checkbox + um de cada radio", () => {
    const checkboxes = FATORES_FR.filter((f) => f.tipo === "checkbox")
    const radios = [fator("fr3a"), fator("fr6a")] // maior de cada grupo
    const fatores = [...checkboxes.map((f) => fator(f.id)), ...radios]
    const total = fatores.reduce((s, f) => s + f.valor, 0)
    expect(calcularTotalFR(fatores)).toBeCloseTo(total, 4)
  })
})

// ============================================
// calcularGI
// ============================================

describe("calcularGI", () => {
  it("soma FR + FT + FA sem cap", () => {
    const result = calcularGI(0.1, 0.05, 0.03)
    expect(result.giCalculado).toBeCloseTo(0.18, 4)
    expect(result.giAplicado).toBeCloseTo(0.18, 4)
    expect(result.giCapAplicado).toBe(false)
  })

  it("aplica cap em 0.5", () => {
    const result = calcularGI(0.4, 0.1, 0.05)
    expect(result.giCalculado).toBeCloseTo(0.55, 4)
    expect(result.giAplicado).toBe(GI_MAXIMO)
    expect(result.giCapAplicado).toBe(true)
  })

  it("GI exatamente 0.5 não aplica cap", () => {
    const result = calcularGI(0.35, 0.1, 0.05)
    expect(result.giAplicado).toBe(GI_MAXIMO)
    expect(result.giCapAplicado).toBe(false)
  })

  it("GI zero é válido", () => {
    const result = calcularGI(0, 0, 0)
    expect(result.giAplicado).toBe(0)
    expect(result.giCapAplicado).toBe(false)
  })
})

// ============================================
// calcularCA
// ============================================

describe("calcularCA", () => {
  it("calcula CA = VR × (GI / 100)", () => {
    // VR = R$10.000.000, GI = 0.5 → CA = 10.000.000 × 0.005 = 50.000
    expect(calcularCA(10_000_000, 0.5)).toBe(50_000)
  })

  it("VR zero resulta em CA zero", () => {
    expect(calcularCA(0, 0.5)).toBe(0)
  })

  it("GI zero resulta em CA zero", () => {
    expect(calcularCA(10_000_000, 0)).toBe(0)
  })

  it("cenário realista: VR=50M, GI=0.325", () => {
    // 50.000.000 × (0.325 / 100) = 162.500
    expect(calcularCA(50_000_000, 0.325)).toBe(162_500)
  })
})

// ============================================
// calcularSNUC (integração)
// ============================================

describe("calcularSNUC", () => {
  it("cenário completo com cap", () => {
    const fatoresFR = [fator("fr1"), fator("fr3a"), fator("fr5"), fator("fr6a")]
    const ft = { id: "ft_longa", descricao: "Longa", valor: 0.1 }
    const fa = { id: "fa_aii", descricao: "AII", valor: 0.05 }
    const vr = 100_000_000

    const resultado = calcularSNUC(vr, fatoresFR, ft, fa)

    // FR = 0.075 + 0.05 + 0.1 + 0.05 = 0.275
    // GI = 0.275 + 0.1 + 0.05 = 0.425 (sem cap)
    expect(resultado.totalFR).toBeCloseTo(0.275, 4)
    expect(resultado.giCalculado).toBeCloseTo(0.425, 4)
    expect(resultado.giAplicado).toBeCloseTo(0.425, 4)
    expect(resultado.giCapAplicado).toBe(false)

    // CA = 100.000.000 × (0.425 / 100) = 425.000
    expect(resultado.compensacaoAmbiental).toBe(425_000)
  })

  it("cenário com GI que excede cap", () => {
    // Selecionar todos os checkboxes + maiores radios
    const checkboxes = FATORES_FR.filter((f) => f.tipo === "checkbox").map((f) => fator(f.id))
    const radios = [fator("fr3a"), fator("fr6a")]
    const fatoresFR = [...checkboxes, ...radios]
    const ft = { id: "ft_longa", descricao: "Longa", valor: 0.1 }
    const fa = { id: "fa_aii", descricao: "AII", valor: 0.05 }

    const resultado = calcularSNUC(10_000_000, fatoresFR, ft, fa)

    expect(resultado.giCapAplicado).toBe(true)
    expect(resultado.giAplicado).toBe(0.5)

    // CA = 10.000.000 × (0.5 / 100) = 50.000
    expect(resultado.compensacaoAmbiental).toBe(50_000)
  })

  it("cenário mínimo: um FR + FT + FA", () => {
    const fatoresFR = [fator("fr13")] // 0.01
    const ft = { id: "ft_imediata", descricao: "Imediata", valor: 0.05 }
    const fa = { id: "fa_aid", descricao: "AID", valor: 0.03 }

    const resultado = calcularSNUC(1_000_000, fatoresFR, ft, fa)

    // GI = 0.01 + 0.05 + 0.03 = 0.09
    expect(resultado.giAplicado).toBeCloseTo(0.09, 4)
    expect(resultado.giCapAplicado).toBe(false)

    // CA = 1.000.000 × (0.09 / 100) = 900
    expect(resultado.compensacaoAmbiental).toBe(900)
  })
})

// ============================================
// VALIDAÇÃO DE CONSTANTES
// ============================================

describe("constantes SNUC", () => {
  it("GI máximo é 0.5", () => {
    expect(GI_MAXIMO).toBe(0.5)
  })

  it("FATORES_FR tem 16 fatores", () => {
    expect(FATORES_FR).toHaveLength(16)
  })

  it("FR3 tem exatamente 2 opções mutuamente exclusivas", () => {
    const fr3 = FATORES_FR.filter((f) => f.grupo === "fr3")
    expect(fr3).toHaveLength(2)
    expect(fr3.every((f) => f.tipo === "radio")).toBe(true)
  })

  it("FR6 tem exatamente 4 opções mutuamente exclusivas", () => {
    const fr6 = FATORES_FR.filter((f) => f.grupo === "fr6")
    expect(fr6).toHaveLength(4)
    expect(fr6.every((f) => f.tipo === "radio")).toBe(true)
  })

  it("OPCOES_FT tem 4 opções", () => {
    expect(OPCOES_FT).toHaveLength(4)
  })

  it("OPCOES_FA tem 2 opções", () => {
    expect(OPCOES_FA).toHaveLength(2)
  })

  it("FR5 (UCs) tem o maior valor individual: 0.1", () => {
    const fr5 = FATORES_FR.find((f) => f.id === "fr5")!
    const maxFR = Math.max(...FATORES_FR.map((f) => f.valor))
    expect(fr5.valor).toBe(maxFR)
    expect(fr5.valor).toBe(0.1)
  })
})

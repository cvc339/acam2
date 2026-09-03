/**
 * Testes para a Calculadora de Intervenção Ambiental
 *
 * Executar: npx vitest run src/lib/calculo/intervencao.test.ts
 * (requer vitest configurado)
 *
 * Foco: acréscimo de 100% da Taxa Florestal na AIA corretiva
 * (art. 69 da Lei 4.747/1968), sem tocar Expediente nem Reposição.
 */

import { describe, it, expect } from "vitest"
import {
  ATIVIDADES,
  PRODUTOS,
  FATOR_CORRETIVA,
  calcularTaxaExpedienteItem,
  calcularTaxaFlorestalItem,
  calcularReposicaoItem,
  calcularIntervencao,
  calcularIntervencaoMista,
} from "./intervencao"

const UFEMG = 5.7899

const lenhaNativa = PRODUTOS.find((p) => p.id === "lenha_nativa")!
const madeiraNativa = PRODUTOS.find((p) => p.id === "madeira_nativa")!
const supressao = ATIVIDADES.nativa.find((a) => a.id === "supressao_nativa")!

describe("Taxa Florestal — AIA prévia × corretiva", () => {
  it("prévia calcula o valor simples", () => {
    const v = calcularTaxaFlorestalItem(lenhaNativa, 100, UFEMG, "previa")
    expect(v).toBeCloseTo(UFEMG * 100 * 1.4, 6)
  })

  it("omissão do tipo equivale à prévia (retrocompatibilidade)", () => {
    expect(calcularTaxaFlorestalItem(lenhaNativa, 100, UFEMG)).toBeCloseTo(
      calcularTaxaFlorestalItem(lenhaNativa, 100, UFEMG, "previa"), 10
    )
  })

  it("corretiva dobra a taxa florestal (art. 69 da Lei 4.747/1968)", () => {
    const previa = calcularTaxaFlorestalItem(madeiraNativa, 50, UFEMG, "previa")
    const corretiva = calcularTaxaFlorestalItem(madeiraNativa, 50, UFEMG, "corretiva")
    expect(corretiva).toBeCloseTo(previa * FATOR_CORRETIVA, 6)
  })
})

describe("Corretiva não alcança Expediente nem Reposição", () => {
  it("taxa de expediente independe do tipo de AIA", () => {
    const v = calcularTaxaExpedienteItem(supressao, 447.0322, UFEMG)
    expect(v).toBeCloseTo((124 + Math.ceil(447.0322)) * UFEMG, 6)
  })

  it("reposição florestal não dobra", () => {
    const v = calcularReposicaoItem(lenhaNativa, 100, UFEMG)
    expect(v).toBeCloseTo(UFEMG * 100 * 6, 6)
  })
})

describe("calcularIntervencao integrado", () => {
  const atividades = [{ atividade: supressao, quantidade: 161.0721 }]
  const produtos = [
    { produto: lenhaNativa, volume: 5570.9538 },
    { produto: madeiraNativa, volume: 346.8499 },
  ]

  it("corretiva dobra só o bloco florestal e registra o tipo", () => {
    const previa = calcularIntervencao(atividades, produtos, UFEMG, 2026, "previa")
    const corretiva = calcularIntervencao(atividades, produtos, UFEMG, 2026, "corretiva")

    expect(corretiva.tipoAia).toBe("corretiva")
    expect(corretiva.taxaFlorestal.total).toBeCloseTo(previa.taxaFlorestal.total * 2, 4)
    expect(corretiva.taxaExpediente.total).toBeCloseTo(previa.taxaExpediente.total, 6)
    expect(corretiva.reposicaoFlorestal.total).toBeCloseTo(previa.reposicaoFlorestal.total, 6)
    expect(corretiva.total).toBeCloseTo(
      previa.taxaExpediente.total + previa.taxaFlorestal.total * 2 + previa.reposicaoFlorestal.total, 4
    )
  })

  it("itens da corretiva declaram o acréscimo no detalhe", () => {
    const r = calcularIntervencao(atividades, produtos, UFEMG, 2026, "corretiva")
    for (const item of r.taxaFlorestal.itens) {
      expect(item.detalhe).toContain("acréscimo de 100%")
    }
  })

  it("omissão do tipo mantém o comportamento anterior", () => {
    const r = calcularIntervencao(atividades, produtos, UFEMG, 2026)
    expect(r.tipoAia).toBe("previa")
    expect(r.taxaFlorestal.itens[0].detalhe).not.toContain("acréscimo")
  })
})

describe("Rodada mista (prévia + corretiva no mesmo processo)", () => {
  const atividades = [{ atividade: supressao, quantidade: 161.0721 }]
  const produtosPrevia = [{ produto: lenhaNativa, volume: 5570.9538 }]
  const produtosCorretiva = [
    { produto: lenhaNativa, volume: 1200.5 },
    { produto: madeiraNativa, volume: 346.8499 },
  ]

  const mista = calcularIntervencaoMista(atividades, produtosPrevia, produtosCorretiva, UFEMG, 2026)

  it("é a soma exata de uma rodada prévia e uma corretiva", () => {
    const previa = calcularIntervencao(atividades, produtosPrevia, UFEMG, 2026, "previa")
    const corretiva = calcularIntervencao([], produtosCorretiva, UFEMG, 2026, "corretiva")
    expect(mista.previa.total).toBeCloseTo(previa.total, 6)
    expect(mista.corretiva.total).toBeCloseTo(corretiva.total, 6)
    expect(mista.totalGeral).toBeCloseTo(previa.total + corretiva.total, 6)
    expect(mista.totalGeral).toBeCloseTo(
      mista.previa.taxaExpediente.total + mista.previa.taxaFlorestal.total
      + mista.corretiva.taxaFlorestal.total + mista.reposicaoFlorestal.total, 6
    )
  })

  it("a taxa de expediente sai uma vez só, idêntica à de rodada única", () => {
    const unica = calcularIntervencao(atividades, produtosPrevia, UFEMG, 2026, "previa")
    expect(mista.previa.taxaExpediente.total).toBeCloseTo(unica.taxaExpediente.total, 6)
    expect(mista.corretiva.taxaExpediente.total).toBe(0)
    expect(mista.corretiva.taxaExpediente.itens).toHaveLength(0)
  })

  it("a frente corretiva dobra a taxa florestal, a prévia não", () => {
    const corretivaSemFator = calcularIntervencao([], produtosCorretiva, UFEMG, 2026, "previa")
    expect(mista.corretiva.taxaFlorestal.total).toBeCloseTo(
      corretivaSemFator.taxaFlorestal.total * FATOR_CORRETIVA, 4
    )
    const previaSimples = calcularIntervencao([], produtosPrevia, UFEMG, 2026, "previa")
    expect(mista.previa.taxaFlorestal.total).toBeCloseTo(previaSimples.taxaFlorestal.total, 6)
  })

  it("a reposição florestal é ÚNICA, sobre os volumes somados por produto, sem dobro", () => {
    const volumeLenha = 5570.9538 + 1200.5
    const esperado = calcularReposicaoItem(lenhaNativa, volumeLenha, UFEMG)
      + calcularReposicaoItem(madeiraNativa, 346.8499, UFEMG)
    expect(mista.reposicaoFlorestal.total).toBeCloseTo(esperado, 4)

    // produto presente nas duas frentes vira UM item só, com o volume somado
    const itensLenha = mista.reposicaoFlorestal.itens.filter((i) => i.codigo === lenhaNativa.codigo)
    expect(itensLenha).toHaveLength(1)
    expect(itensLenha[0].detalhe).toContain(String(volumeLenha))

    // arredondamento de árvores aplicado uma vez por produto, sobre o volume somado
    const arvoresEsperadas = Math.ceil(volumeLenha * lenhaNativa.arvores)
      + Math.ceil(346.8499 * madeiraNativa.arvores)
    expect(mista.reposicaoFlorestal.arvoresTotal).toBe(arvoresEsperadas)

    // equivale à reposição de uma rodada única com os volumes somados
    const unica = calcularIntervencao([], [
      { produto: lenhaNativa, volume: volumeLenha },
      { produto: madeiraNativa, volume: 346.8499 },
    ], UFEMG, 2026, "previa")
    expect(mista.reposicaoFlorestal.total).toBeCloseTo(unica.reposicaoFlorestal.total, 6)
    expect(mista.reposicaoFlorestal.arvoresTotal).toBe(unica.reposicaoFlorestal.arvoresTotal)
  })

  it("cada frente registra o próprio tipo e só a corretiva declara o acréscimo", () => {
    expect(mista.previa.tipoAia).toBe("previa")
    expect(mista.corretiva.tipoAia).toBe("corretiva")
    for (const item of mista.previa.taxaFlorestal.itens) {
      expect(item.detalhe).not.toContain("acréscimo")
    }
    for (const item of mista.corretiva.taxaFlorestal.itens) {
      expect(item.detalhe).toContain("acréscimo de 100%")
    }
  })
})

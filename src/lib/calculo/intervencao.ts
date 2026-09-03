/**
 * Calculadora de Intervenção Ambiental
 * Base legal: Lei 20.922/2013, Decreto 47.749/2019
 * Última verificação: 2026-09-02
 *
 * Calcula: Taxa de Expediente, Taxa Florestal e Reposição Florestal
 * UFEMG é valor dinâmico (configurações do banco)
 *
 * AIA prévia × AIA corretiva: na intervenção corretiva (regularização de
 * supressão realizada sem autorização), a Taxa Florestal é devida com
 * acréscimo de 100%, por força do art. 69 da Lei 4.747/1968 (texto atualizado
 * conferido na ALMG em 2026-09-02). O acréscimo alcança somente a Taxa
 * Florestal; a Taxa de Expediente e a Reposição Florestal não dobram.
 *
 * Rodada mista: um mesmo processo pode reunir frente prévia e frente
 * corretiva (RC SEMAD/IEF 3.102/2021, arts. 4º e 26). Prática adotada: uma
 * guia de Taxa de Expediente e duas guias de Taxa Florestal, a da frente
 * corretiva em dobro. Ver calcularIntervencaoMista.
 */

// ============================================
// TIPO DE AIA
// ============================================

/** Frente de cálculo: prévia (antes da intervenção) ou corretiva (regularização). */
export type FrenteAia = "previa" | "corretiva"

/**
 * Tipo do processo no assistente; "mista" reúne as duas frentes no mesmo
 * processo. Rótulo interno: não existe "AIA mista" como categoria legal (as
 * categorias são AIA prévia e AIA corretiva), e o termo não deve aparecer em
 * texto visível ao usuário nem em DAE/PDF.
 */
export type TipoAia = FrenteAia | "mista"

/** Fator do art. 69 da Lei 4.747/1968: taxa devida com 100% de acréscimo. */
export const FATOR_CORRETIVA = 2

// ============================================
// ATIVIDADES (Taxa de Expediente)
// ============================================

export interface Atividade {
  id: string
  nome: string
  codigo: string
  unidade: string
  ufemgBase: number
  ufemgPorUnidade: number
}

export const ATIVIDADES: Record<string, Atividade[]> = {
  nativa: [
    { id: "supressao_nativa", nome: "Supressão de cobertura vegetal nativa", codigo: "7.24.1", unidade: "hectare", ufemgBase: 124, ufemgPorUnidade: 1 },
    { id: "destoca", nome: "Destoca em área remanescente", codigo: "7.24.3", unidade: "hectare", ufemgBase: 124, ufemgPorUnidade: 1 },
    { id: "arvores_isoladas", nome: "Corte de árvores isoladas nativas vivas", codigo: "7.24.4", unidade: "hectare", ufemgBase: 124, ufemgPorUnidade: 1 },
  ],
  manejo: [
    { id: "manejo", nome: "Plano de manejo sustentável", codigo: "7.24.5", unidade: "hectare", ufemgBase: 124, ufemgPorUnidade: 1 },
  ],
  plantada: [
    { id: "plantado_subbosque", nome: "Supressão de maciço florestal plantado com sub-bosque nativo", codigo: "7.24.7", unidade: "hectare", ufemgBase: 124, ufemgPorUnidade: 1 },
  ],
  app_com_supressao: [
    { id: "supressao_app", nome: "Intervenção com supressão em APP", codigo: "7.24.2", unidade: "hectare", ufemgBase: 124, ufemgPorUnidade: 1 },
  ],
  app_sem_supressao: [
    { id: "app_sem_supressao", nome: "Intervenção em APP sem supressão", codigo: "7.24.6", unidade: "hectare", ufemgBase: 124, ufemgPorUnidade: 30 },
  ],
  app_plantada: [
    { id: "plantado_app", nome: "Supressão de maciço florestal plantado em APP", codigo: "7.24.8", unidade: "hectare", ufemgBase: 124, ufemgPorUnidade: 1 },
  ],
  aproveitamento: [
    { id: "aproveitamento", nome: "Aproveitamento de material lenhoso", codigo: "7.24.9", unidade: "m³", ufemgBase: 124, ufemgPorUnidade: 1 },
  ],
}

// ============================================
// PRODUTOS FLORESTAIS (Taxa Florestal + Reposição)
// ============================================

export interface Produto {
  id: string
  nome: string
  codigo: string
  unidade: string
  ufemg: number
  arvores: number
  grupo: string
}

export const PRODUTOS: Produto[] = [
  { id: "lenha_plantada", nome: "Lenha de floresta plantada", codigo: "1.00", unidade: "m³", ufemg: 0.28, arvores: 0, grupo: "Lenha" },
  { id: "lenha_manejo", nome: "Lenha de floresta nativa sob manejo sustentável", codigo: "1.01", unidade: "m³", ufemg: 0.28, arvores: 0, grupo: "Lenha" },
  { id: "lenha_nativa", nome: "Lenha de floresta nativa", codigo: "1.02", unidade: "m³", ufemg: 1.4, arvores: 6, grupo: "Lenha" },
  { id: "madeira_plantada", nome: "Madeira de floresta plantada", codigo: "2.00", unidade: "m³", ufemg: 0.54, arvores: 0, grupo: "Madeira" },
  { id: "madeira_manejo", nome: "Madeira de floresta nativa sob manejo sustentável", codigo: "2.01", unidade: "m³", ufemg: 0.54, arvores: 0, grupo: "Madeira" },
  { id: "madeira_nativa", nome: "Madeira de floresta nativa", codigo: "2.02", unidade: "m³", ufemg: 9.35, arvores: 6, grupo: "Madeira" },
  { id: "carvao_plantada", nome: "Carvão vegetal de floresta plantada", codigo: "3.00", unidade: "m³", ufemg: 0.56, arvores: 0, grupo: "Carvão" },
  { id: "carvao_manejo", nome: "Carvão vegetal de floresta nativa sob manejo sustentável", codigo: "3.01", unidade: "m³", ufemg: 0.56, arvores: 0, grupo: "Carvão" },
  { id: "carvao_nativa", nome: "Carvão vegetal de floresta nativa", codigo: "3.02", unidade: "m³", ufemg: 2.8, arvores: 12, grupo: "Carvão" },
  { id: "nao_madeireiro_plantada", nome: "Produtos não madeireiros de floresta plantada", codigo: "4.00", unidade: "kg", ufemg: 0.07, arvores: 0, grupo: "Não madeireiros" },
  { id: "nao_madeireiro_manejo", nome: "Produtos não madeireiros sob manejo sustentável", codigo: "4.01", unidade: "kg", ufemg: 0.07, arvores: 0, grupo: "Não madeireiros" },
  { id: "nao_madeireiro_nativa", nome: "Produtos não madeireiros de floresta nativa", codigo: "4.02", unidade: "kg", ufemg: 0.37, arvores: 0, grupo: "Não madeireiros" },
]

// ============================================
// CÁLCULOS
// ============================================

export interface ItemCalculado {
  nome: string
  codigo: string
  valor: number
  detalhe: string
}

export interface ResultadoIntervencao {
  taxaExpediente: { total: number; itens: ItemCalculado[] }
  taxaFlorestal: { total: number; itens: ItemCalculado[] }
  reposicaoFlorestal: { total: number; itens: ItemCalculado[]; arvoresTotal: number }
  total: number
  ufemgValor: number
  ufemgAno: number
  tipoAia: FrenteAia
}

/**
 * Calcula Taxa de Expediente para uma atividade
 * Fórmula: (ufemgBase × UFEMG) + (ceil(qtd) × ufemgPorUnidade × UFEMG)
 */
export function calcularTaxaExpedienteItem(
  atividade: Atividade,
  quantidade: number,
  ufemgValor: number
): number {
  return (atividade.ufemgBase * ufemgValor) + (Math.ceil(quantidade) * atividade.ufemgPorUnidade * ufemgValor)
}

/**
 * Calcula Taxa Florestal para um produto
 * Fórmula: UFEMG × volume × coeficiente do produto
 * Na AIA corretiva, aplica o acréscimo de 100% do art. 69 da Lei 4.747/1968.
 */
export function calcularTaxaFlorestalItem(
  produto: Produto,
  volume: number,
  ufemgValor: number,
  tipoAia: FrenteAia = "previa"
): number {
  const fator = tipoAia === "corretiva" ? FATOR_CORRETIVA : 1
  return ufemgValor * volume * produto.ufemg * fator
}

/**
 * Calcula Reposição Florestal para um produto (apenas nativa)
 * Fórmula: UFEMG × volume × árvores por unidade
 */
export function calcularReposicaoItem(
  produto: Produto,
  volume: number,
  ufemgValor: number
): number {
  if (produto.arvores === 0) return 0
  return ufemgValor * volume * produto.arvores
}

/**
 * Cálculo completo da intervenção ambiental
 */
export function calcularIntervencao(
  atividadesSelecionadas: { atividade: Atividade; quantidade: number }[],
  produtosSelecionados: { produto: Produto; volume: number }[],
  ufemgValor: number,
  ufemgAno: number,
  tipoAia: FrenteAia = "previa"
): ResultadoIntervencao {
  // Taxa de Expediente
  const itensExpediente: ItemCalculado[] = []
  let totalExpediente = 0

  for (const { atividade, quantidade } of atividadesSelecionadas) {
    if (quantidade > 0) {
      const valor = calcularTaxaExpedienteItem(atividade, quantidade, ufemgValor)
      totalExpediente += valor
      itensExpediente.push({
        nome: atividade.nome,
        codigo: atividade.codigo,
        valor,
        detalhe: `${quantidade} ${atividade.unidade}${quantidade > 1 ? "s" : ""}`,
      })
    }
  }

  // Taxa Florestal
  const itensFlorestal: ItemCalculado[] = []
  let totalFlorestal = 0

  for (const { produto, volume } of produtosSelecionados) {
    if (volume > 0) {
      const valor = calcularTaxaFlorestalItem(produto, volume, ufemgValor, tipoAia)
      totalFlorestal += valor
      itensFlorestal.push({
        nome: produto.nome,
        codigo: produto.codigo,
        valor,
        detalhe: `${volume} ${produto.unidade}` +
          (tipoAia === "corretiva" ? " · acréscimo de 100% (art. 69 da Lei 4.747/1968)" : ""),
      })
    }
  }

  // Reposição Florestal
  const itensReposicao: ItemCalculado[] = []
  let totalReposicao = 0
  let arvoresTotal = 0

  for (const { produto, volume } of produtosSelecionados) {
    if (volume > 0 && produto.arvores > 0) {
      const valor = calcularReposicaoItem(produto, volume, ufemgValor)
      const arvores = Math.ceil(volume * produto.arvores)
      totalReposicao += valor
      arvoresTotal += arvores
      itensReposicao.push({
        nome: produto.nome,
        codigo: produto.codigo,
        valor,
        detalhe: `${volume} ${produto.unidade} × ${produto.arvores} = ${arvores} árvores`,
      })
    }
  }

  return {
    taxaExpediente: { total: totalExpediente, itens: itensExpediente },
    taxaFlorestal: { total: totalFlorestal, itens: itensFlorestal },
    reposicaoFlorestal: { total: totalReposicao, itens: itensReposicao, arvoresTotal },
    total: totalExpediente + totalFlorestal + totalReposicao,
    ufemgValor,
    ufemgAno,
    tipoAia,
  }
}

export interface ResultadoIntervencaoMista {
  /** Frente prévia; carrega também a Taxa de Expediente única do processo. */
  previa: ResultadoIntervencao
  /** Frente corretiva, Taxa Florestal em dobro; sem Taxa de Expediente. */
  corretiva: ResultadoIntervencao
  /**
   * Reposição Florestal ÚNICA do processo, calculada sobre os volumes somados
   * por produto das duas frentes. A reposição não se divide por frente nem
   * dobra na corretiva; usar este bloco, e não o das frentes, em resultado,
   * DAE e PDF.
   */
  reposicaoFlorestal: { total: number; itens: ItemCalculado[]; arvoresTotal: number }
  totalGeral: number
}

/**
 * Rodada mista: AIA prévia e corretiva no mesmo processo.
 * A Taxa de Expediente é devida uma vez só, por atividade, sem divisão por
 * frente (guia única na prática adotada), e sai no resultado da frente prévia.
 * A Taxa Florestal é calculada por frente, com o acréscimo do art. 69 da
 * Lei 4.747/1968 apenas na corretiva. A Reposição Florestal é única, sobre os
 * volumes somados por produto, com o arredondamento de árvores aplicado uma
 * vez por produto.
 */
export function calcularIntervencaoMista(
  atividadesSelecionadas: { atividade: Atividade; quantidade: number }[],
  produtosPrevia: { produto: Produto; volume: number }[],
  produtosCorretiva: { produto: Produto; volume: number }[],
  ufemgValor: number,
  ufemgAno: number
): ResultadoIntervencaoMista {
  const previa = calcularIntervencao(atividadesSelecionadas, produtosPrevia, ufemgValor, ufemgAno, "previa")
  const corretiva = calcularIntervencao([], produtosCorretiva, ufemgValor, ufemgAno, "corretiva")

  const volumesPorProduto = new Map<string, { produto: Produto; volume: number }>()
  for (const lista of [produtosPrevia, produtosCorretiva]) {
    for (const { produto, volume } of lista) {
      const atual = volumesPorProduto.get(produto.id)
      volumesPorProduto.set(produto.id, { produto, volume: (atual?.volume ?? 0) + volume })
    }
  }

  const itensReposicao: ItemCalculado[] = []
  let totalReposicao = 0
  let arvoresTotal = 0
  for (const { produto, volume } of volumesPorProduto.values()) {
    if (volume > 0 && produto.arvores > 0) {
      const valor = calcularReposicaoItem(produto, volume, ufemgValor)
      const arvores = Math.ceil(volume * produto.arvores)
      totalReposicao += valor
      arvoresTotal += arvores
      itensReposicao.push({
        nome: produto.nome,
        codigo: produto.codigo,
        valor,
        detalhe: `${volume} ${produto.unidade} × ${produto.arvores} = ${arvores} árvores`,
      })
    }
  }

  const totalGeral = previa.taxaExpediente.total + previa.taxaFlorestal.total
    + corretiva.taxaFlorestal.total + totalReposicao

  return {
    previa,
    corretiva,
    reposicaoFlorestal: { total: totalReposicao, itens: itensReposicao, arvoresTotal },
    totalGeral,
  }
}

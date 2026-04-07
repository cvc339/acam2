/**
 * Calculadora de Intervenção Ambiental
 * Base legal: Lei 20.922/2013, Decreto 47.749/2019
 * Última verificação: 2026-04-07
 *
 * Calcula: Taxa de Expediente, Taxa Florestal e Reposição Florestal
 * UFEMG é valor dinâmico (configurações do banco)
 */

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
 */
export function calcularTaxaFlorestalItem(
  produto: Produto,
  volume: number,
  ufemgValor: number
): number {
  return ufemgValor * volume * produto.ufemg
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
  ufemgAno: number
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
      const valor = calcularTaxaFlorestalItem(produto, volume, ufemgValor)
      totalFlorestal += valor
      itensFlorestal.push({
        nome: produto.nome,
        codigo: produto.codigo,
        valor,
        detalhe: `${volume} ${produto.unidade}`,
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
  }
}

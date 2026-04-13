/**
 * Cálculo de Compensação Ambiental SNUC
 * Lei Federal 9.985/2000 + Decreto 4.340/2002 + Decreto 6.848/2009
 *
 * Fórmula: CA = VR × (GI / 100)
 * Onde GI = FR + FT + FA (máximo 0,5)
 *
 * Última verificação: 2026-04-13
 */

// ============================================
// FATOR DE RELEVÂNCIA (FR) — Checkboxes
// ============================================

export interface FatorFR {
  id: string
  valor: number
  descricao: string
  detalhamento: string
  tipo: "checkbox" | "radio"
  grupo?: string // para agrupamento de radio buttons
}

export const FATORES_FR: FatorFR[] = [
  // Checkboxes individuais
  {
    id: "fr1",
    valor: 0.075,
    descricao: "Espécies ameaçadas de extinção",
    detalhamento: "Interferência em espécies ameaçadas, raras ou endêmicas, ou rotas migratórias e de reprodução (MMA 443-445/2014, DN COPAM 147/2010)",
    tipo: "checkbox",
  },
  {
    id: "fr2",
    valor: 0.01,
    descricao: "Introdução de espécies exóticas invasoras",
    detalhamento: "Facilitação deliberada ou acidental de introdução de espécies exóticas (trânsito de veículos, dispersão por barramentos)",
    tipo: "checkbox",
  },
  // FR3 — Radio group (mutuamente exclusivos)
  {
    id: "fr3a",
    valor: 0.05,
    descricao: "Supressão em ecossistemas especialmente protegidos",
    detalhamento: "Mata Atlântica, Campos de Altitude ou outros ecossistemas protegidos pela Lei 14.309/2002",
    tipo: "radio",
    grupo: "fr3",
  },
  {
    id: "fr3b",
    valor: 0.045,
    descricao: "Supressão em outros biomas",
    detalhamento: "Cerrado, Caatinga ou outros biomas sem proteção especial",
    tipo: "radio",
    grupo: "fr3",
  },
  {
    id: "fr4",
    valor: 0.025,
    descricao: "Cavernas e patrimônio espeleológico",
    detalhamento: "Interferência em patrimônio espeleológico — cavernas na ADA ou raio de 250m, potencialidade CECAV, sítios paleontológicos",
    tipo: "checkbox",
  },
  {
    id: "fr5",
    valor: 0.1,
    descricao: "Unidades de Conservação de Proteção Integral",
    detalhamento: "ADA dentro de UC de Proteção Integral ou sua Zona de Amortecimento (Estação Ecológica, Reserva Biológica, Parque, Monumento Natural, Refúgio de Vida Silvestre)",
    tipo: "checkbox",
  },
  // FR6 — Radio group (mutuamente exclusivos)
  {
    id: "fr6a",
    valor: 0.05,
    descricao: "Importância Biológica Especial",
    detalhamento: "Área prioritária para conservação com importância biológica Especial (Atlas Biodiversidade MG)",
    tipo: "radio",
    grupo: "fr6",
  },
  {
    id: "fr6b",
    valor: 0.045,
    descricao: "Importância Biológica Extrema",
    detalhamento: "Área prioritária para conservação com importância biológica Extrema (Atlas Biodiversidade MG)",
    tipo: "radio",
    grupo: "fr6",
  },
  {
    id: "fr6c",
    valor: 0.04,
    descricao: "Importância Biológica Muito Alta",
    detalhamento: "Área prioritária para conservação com importância biológica Muito Alta (Atlas Biodiversidade MG)",
    tipo: "radio",
    grupo: "fr6",
  },
  {
    id: "fr6d",
    valor: 0.035,
    descricao: "Importância Biológica Alta",
    detalhamento: "Área prioritária para conservação com importância biológica Alta (Atlas Biodiversidade MG)",
    tipo: "radio",
    grupo: "fr6",
  },
  {
    id: "fr7",
    valor: 0.025,
    descricao: "Alteração físico-química de solo, água ou ar",
    detalhamento: "Alteração da qualidade da água, solo ou ar na área de influência",
    tipo: "checkbox",
  },
  {
    id: "fr8",
    valor: 0.025,
    descricao: "Rebaixamento ou soerguimento de aquíferos",
    detalhamento: "Modificação do regime de aquíferos subterrâneos",
    tipo: "checkbox",
  },
  {
    id: "fr9",
    valor: 0.045,
    descricao: "Transformação de ambiente lótico em lêntico",
    detalhamento: "Conversão de corpos d'água correntes em represados (barramentos)",
    tipo: "checkbox",
  },
  {
    id: "fr10",
    valor: 0.03,
    descricao: "Paisagens notáveis",
    detalhamento: "Interferência em paisagens de beleza cênica ou valor cultural",
    tipo: "checkbox",
  },
  {
    id: "fr11",
    valor: 0.025,
    descricao: "Emissão de gases de efeito estufa",
    detalhamento: "Emissões significativas de CO₂, CH₄ ou N₂O",
    tipo: "checkbox",
  },
  {
    id: "fr12",
    valor: 0.03,
    descricao: "Aumento da erodibilidade do solo",
    detalhamento: "Aumento da suscetibilidade do solo à erosão",
    tipo: "checkbox",
  },
  {
    id: "fr13",
    valor: 0.01,
    descricao: "Ruídos residuais",
    detalhamento: "Emissões de ruído acima dos padrões normativos",
    tipo: "checkbox",
  },
]

// ============================================
// FATOR DE TEMPORALIDADE (FT)
// ============================================

export interface OpcaoFT {
  id: string
  valor: number
  descricao: string
  detalhamento: string
}

export const OPCOES_FT: OpcaoFT[] = [
  { id: "ft_imediata", valor: 0.05, descricao: "Imediata (0-5 anos)", detalhamento: "Duração de até 5 anos (instalação + operação + descomissionamento + recuperação)" },
  { id: "ft_curta", valor: 0.065, descricao: "Curta (5-10 anos)", detalhamento: "Duração de 5 a 10 anos" },
  { id: "ft_media", valor: 0.085, descricao: "Média (10-20 anos)", detalhamento: "Duração de 10 a 20 anos" },
  { id: "ft_longa", valor: 0.1, descricao: "Longa (>20 anos)", detalhamento: "Duração superior a 20 anos" },
]

// ============================================
// FATOR DE ABRANGÊNCIA (FA)
// ============================================

export interface OpcaoFA {
  id: string
  valor: number
  descricao: string
  detalhamento: string
}

export const OPCOES_FA: OpcaoFA[] = [
  { id: "fa_aid", valor: 0.03, descricao: "AID — Área de Influência Direta", detalhamento: "Impactos restritos à área de influência direta (até 10 km)" },
  { id: "fa_aii", valor: 0.05, descricao: "AII — Área de Influência Indireta", detalhamento: "Impactos na área de influência indireta (escala regional/bacia)" },
]

// ============================================
// LIMITE DO GRAU DE IMPACTO
// ============================================

export const GI_MAXIMO = 0.5

// ============================================
// TIPOS DO RESULTADO
// ============================================

export interface FatorSelecionado {
  id: string
  descricao: string
  valor: number
  autoDetectado?: boolean
}

export interface ResultadoSNUC {
  // Entradas
  valorReferencia: number
  fatoresFR: FatorSelecionado[]
  fatorFT: FatorSelecionado
  fatorFA: FatorSelecionado

  // Totais parciais
  totalFR: number
  totalFT: number
  totalFA: number

  // Grau de impacto
  giCalculado: number   // FR + FT + FA (sem cap)
  giAplicado: number    // min(giCalculado, 0.5)
  giCapAplicado: boolean

  // Resultado final
  compensacaoAmbiental: number // VR × (GI / 100)
}

// ============================================
// FUNÇÕES DE CÁLCULO (puras, testáveis)
// ============================================

/** Soma os valores dos fatores FR selecionados */
export function calcularTotalFR(fatoresSelecionados: FatorSelecionado[]): number {
  return fatoresSelecionados.reduce((soma, f) => soma + f.valor, 0)
}

/** Calcula o Grau de Impacto: FR + FT + FA, com cap em 0.5 */
export function calcularGI(totalFR: number, totalFT: number, totalFA: number): {
  giCalculado: number
  giAplicado: number
  giCapAplicado: boolean
} {
  const giCalculado = totalFR + totalFT + totalFA
  const giAplicado = Math.min(giCalculado, GI_MAXIMO)
  return {
    giCalculado: parseFloat(giCalculado.toFixed(4)),
    giAplicado: parseFloat(giAplicado.toFixed(4)),
    giCapAplicado: giCalculado > GI_MAXIMO,
  }
}

/** Calcula a Compensação Ambiental: CA = VR × (GI / 100) */
export function calcularCA(valorReferencia: number, giAplicado: number): number {
  return valorReferencia * (giAplicado / 100)
}

/** Cálculo completo da Compensação SNUC */
export function calcularSNUC(
  valorReferencia: number,
  fatoresFR: FatorSelecionado[],
  fatorFT: FatorSelecionado,
  fatorFA: FatorSelecionado,
): ResultadoSNUC {
  const totalFR = calcularTotalFR(fatoresFR)
  const totalFT = fatorFT.valor
  const totalFA = fatorFA.valor

  const { giCalculado, giAplicado, giCapAplicado } = calcularGI(totalFR, totalFT, totalFA)
  const compensacaoAmbiental = calcularCA(valorReferencia, giAplicado)

  return {
    valorReferencia,
    fatoresFR,
    fatorFT,
    fatorFA,
    totalFR: parseFloat(totalFR.toFixed(4)),
    totalFT,
    totalFA,
    giCalculado,
    giAplicado,
    giCapAplicado,
    compensacaoAmbiental: parseFloat(compensacaoAmbiental.toFixed(2)),
  }
}

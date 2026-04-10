/**
 * Serviço MVAR — Matriz de Viabilidade de Aquisição Rural
 *
 * Portado do ACAM1 services/mvar.js
 * Metodologia de pontuação para análise de imóveis destinados à
 * compensação minerária em UC de Proteção Integral
 * Base Legal: Portaria IEF 27/2017, Lei 9.985/2000 (SNUC)
 */

import { readFileSync } from "fs"
import { join } from "path"
import type { DadosMatricula, DadosCND, ResultadoAnalise } from "./analise-documental"

// ============================================
// CONSTANTES E CONFIGURAÇÕES
// ============================================

export const PESOS = {
  JURIDICA: 40,
  FISCAL: 30,
  TITULARIDADE: 20,
  TECNICA: 10,
}

export const FAIXAS = {
  VERDE: { min: 90, max: 100, label: "Risco Baixo", acao: "Prosseguir", cor: "#16a34a" },
  AMARELO: { min: 60, max: 85, label: "Risco Médio", acao: "Prosseguir com ressalvas", cor: "#d97706" },
  VERMELHO: { min: 0, max: 55, label: "Risco Alto", acao: "Não prosseguir", cor: "#dc2626" },
}

export const ONUS_IMPACTO = {
  IMPEDE: [
    "hipoteca", "alienação fiduciária", "alienacao fiduciaria",
    "usufruto", "indisponibilidade", "penhora", "arresto",
    "inalienabilidade", "impenhorabilidade", "incomunicabilidade",
    "promessa de compra e venda", "compromisso de compra e venda",
    "fideicomisso", "cláusula resolutiva", "clausula resolutiva",
    "bem de família", "bem de familia", "arrolamento fiscal",
    "bloqueio judicial", "sequestro",
  ],
  DIFICULTA: [
    "servidão", "servidao", "tombamento", "reserva legal",
    "car", "cadastro ambiental rural", "utilidade pública",
    "utilidade publica", "interesse social", "averbação premonitória",
    "averbacao premonitoria", "aforamento", "enfiteuse",
    "concessão de uso", "concessao de uso", "direito de superfície",
    "direito de superficie", "cédula rural", "cedula rural",
  ],
  NAO_PREJUDICA: [
    "mudança de denominação", "mudanca de denominacao",
    "alteração de nome", "alteracao de nome", "retificação de área",
    "retificacao de area", "georreferenciamento", "desmembramento",
    "remembramento", "unificação", "unificacao", "averbação de construção",
    "averbacao de construcao", "cancelamento", "baixa", "quitação",
    "quitacao", "extinção", "extincao",
  ],
}

const TERMOS_CANCELAMENTO = [
  "cancelado", "cancelada", "cancelamento",
  "baixa", "baixado", "baixada",
  "extinção", "extinto", "extinta", "extincao",
  "quitado", "quitada", "quitação", "quitacao",
  "levantado", "levantada", "levantamento",
  "liberado", "liberada", "liberação", "liberacao",
  "cessado", "cessada",
  "arquivado", "arquivada",
]

const TITULARIDADE = {
  PROPRIETARIO_UNICO: { pontos: 20, label: "Proprietário Único" },
  CASAL: { pontos: 20, label: "Casal (Comunhão)" },
  PESSOA_JURIDICA: { pontos: 15, label: "Pessoa Jurídica" },
  CONDOMINIO: { pontos: 10, label: "Condomínio" },
  ESPOLIO: { pontos: 0, label: "Espólio Não Inventariado", veto: true },
  INCAPAZ: { pontos: 0, label: "Incapaz", veto: true },
  INDEFINIDO: { pontos: 5, label: "Não Identificado" },
}

const GEORREFERENCIAMENTO = {
  CERTIFICADO: { pontos: 10, label: "Certificado SIGEF/INCRA" },
  NAO_GEORREF_TRANSFERENCIA: { pontos: 5, label: "Não georreferenciado (transferência permitida até 21/10/2029)" },
  NAO_GEORREF_DESMEMBRAMENTO: { pontos: 0, label: "Não georreferenciado (desmembramento - obrigatório)" },
}

// ============================================
// TIPOS
// ============================================

export interface ItemDimensao {
  item: string
  status: string
  mensagem: string
  pontos: number
  numero?: string
  credor?: string
  valor?: string
  nota?: string
  proprietarios?: Array<{ nome: string; percentual: number; cpf_cnpj: string | null }>
  validade?: string | null
  cib?: string | null
}

export interface ResultadoDimensao {
  dimensao: string
  nome: string
  peso: number
  pontos: number
  percentual: number
  itens: ItemDimensao[]
  veto: boolean
  motivo_veto: string | null
}

export interface ResultadoLocalizacaoUC {
  dimensao: string
  nome: string
  dentroUC: boolean
  protecaoIntegral: boolean
  percentualDentro: number
  percentualFora: number
  uc: { nome: string; categoria: string; protecaoIntegral: boolean; areaSobreposicao: number } | null
  veto: boolean
  motivo_veto: string | null
  observacao?: string
}

export interface ResultadoVTN {
  encontrado: boolean
  erro?: string
  municipio?: string
  estado?: string
  valores?: Record<string, number>
  valor_referencia?: number
  categoria_referencia?: string
  fonte?: string
  exercicio?: string
  nota?: string
  valor_estimado?: number
  area_hectares?: number
  alternativas?: string[]
}

export interface ResultadoMVAR {
  versao: string
  data_analise: string
  tempo_processamento_ms: number
  pontuacao: { total: number; maximo: number; percentual: number }
  classificacao: { faixa: string; label: string; acao: string; cor: string }
  vetos: Array<{ origem: string; motivo: string }>
  tem_veto: boolean
  dimensoes: {
    juridica: ResultadoDimensao
    fiscal: ResultadoDimensao
    titularidade: ResultadoDimensao
    tecnica: ResultadoDimensao
  }
  localizacao_uc: ResultadoLocalizacaoUC
  vtn: ResultadoVTN | null
  resumo: string
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function normalizar(texto: string): string {
  if (!texto) return ""
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

function contemTermo(texto: string, termos: string[]): boolean {
  const textoNorm = normalizar(texto)
  return termos.some((termo) => textoNorm.includes(normalizar(termo)))
}

// ============================================
// VTN (Valor da Terra Nua)
// ============================================

let vtnCache: Record<string, unknown> | null = null

function carregarBaseVTN(): Record<string, unknown> | null {
  if (vtnCache) return vtnCache
  try {
    const caminhoVTN = join(process.cwd(), "src/lib/services/data/vtn-database.json")
    vtnCache = JSON.parse(readFileSync(caminhoVTN, "utf8"))
    return vtnCache
  } catch {
    console.error("Erro ao carregar base VTN")
    return null
  }
}

export function consultarVTN(municipio: string, estado = "MG"): ResultadoVTN {
  const baseVTN = carregarBaseVTN()
  if (!baseVTN) return { encontrado: false, erro: "Base VTN não disponível" }

  const estadoUpper = estado.toUpperCase()
  const municipioNorm = normalizar(municipio)

  const dadosEstado = (baseVTN as Record<string, unknown>).estados as Record<string, { municipios: Record<string, Record<string, number>> }> | undefined
  if (!dadosEstado?.[estadoUpper]?.municipios) {
    return { encontrado: false, erro: `Estado ${estado} não encontrado na base VTN` }
  }

  const municipios = dadosEstado[estadoUpper].municipios
  let vtnMunicipio: Record<string, number> | undefined
  let municipioEncontrado = ""

  // Busca exata
  const municipioUpper = municipio?.toUpperCase() || ""
  if (municipios[municipioUpper]) {
    vtnMunicipio = municipios[municipioUpper]
    municipioEncontrado = municipioUpper
  }

  // Busca parcial
  if (!vtnMunicipio) {
    const chaves = Object.keys(municipios)
    const chaveEncontrada = chaves.find(
      (k) =>
        normalizar(k) === municipioNorm ||
        normalizar(k).includes(municipioNorm) ||
        municipioNorm.includes(normalizar(k)),
    )
    if (chaveEncontrada) {
      vtnMunicipio = municipios[chaveEncontrada]
      municipioEncontrado = chaveEncontrada
    }
  }

  if (!vtnMunicipio) {
    return {
      encontrado: false,
      erro: `Município ${municipio} não encontrado na base VTN`,
      alternativas: ["Consultar SIMET/INCRA", "Consultar Prefeitura Municipal", "Consultar EMATER-MG"],
    }
  }

  const valorPreservacao = vtnMunicipio.preservacao || vtnMunicipio.preservacao_fauna_flora || vtnMunicipio.silvicultura

  return {
    encontrado: true,
    municipio: municipioEncontrado,
    estado,
    valores: vtnMunicipio,
    valor_referencia: valorPreservacao,
    categoria_referencia: "Preservação da Fauna e Flora",
    fonte: "Sistema de Preços de Terras (SIPT) - Secretaria Especial da Receita Federal do Brasil",
    exercicio: "2022",
    nota: "Valor referencial para análise preliminar. Avaliação definitiva requer laudo técnico (CONFEA/CREA).",
  }
}

// ============================================
// DIMENSÃO 1: JURÍDICA (40 pts)
// ============================================

export function analisarDimensaoJuridica(dadosMatricula: ResultadoAnalise<DadosMatricula> | null): ResultadoDimensao {
  const resultado: ResultadoDimensao = {
    dimensao: "juridica", nome: "Situação Jurídica Real", peso: PESOS.JURIDICA,
    pontos: 0, percentual: 0, itens: [], veto: false, motivo_veto: null,
  }

  if (!dadosMatricula?.dados) {
    resultado.itens.push({ item: "Matrícula", status: "erro", mensagem: "Matrícula não analisada ou dados indisponíveis", pontos: 0 })
    return resultado
  }

  const onusGravames = dadosMatricula.dados.onus_gravames || []

  if (onusGravames.length === 0) {
    resultado.pontos = PESOS.JURIDICA
    resultado.percentual = 100
    resultado.itens.push({ item: "Ônus e Gravames", status: "ok", mensagem: "Nenhum ônus ou gravame identificado na matrícula", pontos: PESOS.JURIDICA })
    return resultado
  }

  let temOnusImpeditivo = false
  let temOnusDificultador = false
  const onusAtivos: ItemDimensao[] = []

  for (const onus of onusGravames) {
    const tipoOnus = onus.tipo || onus.descricao || ""
    const descricao = onus.descricao || onus.tipo || ""

    if (contemTermo(descricao, TERMOS_CANCELAMENTO)) {
      resultado.itens.push({ item: tipoOnus, status: "cancelado", mensagem: "Ônus cancelado/baixado", pontos: 0, numero: onus.numero_averbacao })
      continue
    }

    if (contemTermo(tipoOnus, ONUS_IMPACTO.IMPEDE)) {
      temOnusImpeditivo = true
      onusAtivos.push({ item: tipoOnus, status: "impeditivo", mensagem: onus.impacto_compra_venda || "Impede a transação", pontos: 0, numero: onus.numero_averbacao, credor: onus.credor || undefined, valor: onus.valor || undefined })
    } else if (contemTermo(tipoOnus, ONUS_IMPACTO.DIFICULTA)) {
      temOnusDificultador = true
      onusAtivos.push({ item: tipoOnus, status: "dificultador", mensagem: "Dificulta mas não impede a transação", pontos: 10, numero: onus.numero_averbacao })
    } else {
      onusAtivos.push({ item: tipoOnus, status: "atencao", mensagem: "Requer análise jurídica específica", pontos: 10, numero: onus.numero_averbacao })
    }
  }

  if (temOnusImpeditivo) {
    const onusVeto = onusAtivos.find((o) =>
      o.status === "impeditivo" && contemTermo(o.item, ["indisponibilidade", "arresto", "penhora", "bloqueio"]),
    )
    if (onusVeto) {
      resultado.veto = true
      resultado.motivo_veto = `Bloqueio judicial: ${onusVeto.item}`
    }
    resultado.pontos = 0
    resultado.percentual = 0
  } else if (temOnusDificultador) {
    resultado.pontos = 10
    resultado.percentual = 25
  } else {
    resultado.pontos = PESOS.JURIDICA
    resultado.percentual = 100
  }

  resultado.itens = [...resultado.itens, ...onusAtivos]
  return resultado
}

// ============================================
// DIMENSÃO 2: FISCAL (30 pts)
// ============================================

export function analisarDimensaoFiscal(
  dadosCND: DadosCND | null,
  dadosMatricula: ResultadoAnalise<DadosMatricula> | null,
): ResultadoDimensao {
  const resultado: ResultadoDimensao = {
    dimensao: "fiscal", nome: "Situação Fiscal Federal", peso: PESOS.FISCAL,
    pontos: 0, percentual: 0, itens: [], veto: false, motivo_veto: null,
  }

  if (!dadosCND) {
    resultado.itens.push({ item: "CND-ITR", status: "ausente", mensagem: "Certidão não apresentada - análise fiscal prejudicada", pontos: 0 })
    return resultado
  }

  const tipo = normalizar(dadosCND.tipo || "")

  if (tipo.includes("negativa") && !tipo.includes("positiva")) {
    resultado.pontos = PESOS.FISCAL
    resultado.percentual = 100
    resultado.itens.push({ item: "CND-ITR", status: "ok", mensagem: "Certidão Negativa - situação fiscal regular", pontos: PESOS.FISCAL, validade: dadosCND.data_validade, cib: dadosCND.cib })
  } else if (tipo.includes("positiva") && tipo.includes("efeito")) {
    resultado.pontos = PESOS.FISCAL
    resultado.percentual = 100
    resultado.itens.push({ item: "CND-ITR", status: "ok", mensagem: "Certidão Positiva com Efeitos de Negativa - débitos suspensos/parcelados", pontos: PESOS.FISCAL, validade: dadosCND.data_validade, cib: dadosCND.cib })
  } else if (tipo.includes("positiva")) {
    resultado.veto = true
    resultado.motivo_veto = "Débitos fiscais exigíveis identificados"
    resultado.itens.push({ item: "CND-ITR", status: "impeditivo", mensagem: "Certidão Positiva - existem débitos exigíveis", pontos: 0, cib: dadosCND.cib })
  } else {
    resultado.itens.push({ item: "CND-ITR", status: "indefinido", mensagem: "Tipo de certidão não identificado - requer verificação manual", pontos: 0 })
  }

  // Validar área
  if (dadosCND.area_hectares && dadosMatricula?.dados?.area_hectares) {
    const areaCND = dadosCND.area_hectares
    const areaMatricula = dadosMatricula.dados.area_hectares
    if (areaMatricula > 0 && areaCND > 0) {
      const divergencia = Math.abs((areaCND - areaMatricula) / areaMatricula * 100)
      if (divergencia > 5) {
        resultado.itens.push({
          item: "Área", status: "divergencia",
          mensagem: `Divergência de área: CND ${areaCND.toFixed(2)} ha vs Matrícula ${areaMatricula.toFixed(2)} ha (${divergencia.toFixed(1)}%).`,
          pontos: 0,
        })
      }
    }
  }

  return resultado
}

// ============================================
// DIMENSÃO 3: TITULARIDADE (20 pts)
// ============================================

export function analisarDimensaoTitularidade(dadosMatricula: ResultadoAnalise<DadosMatricula> | null): ResultadoDimensao {
  const resultado: ResultadoDimensao = {
    dimensao: "titularidade", nome: "Titularidade", peso: PESOS.TITULARIDADE,
    pontos: 0, percentual: 0, itens: [], veto: false, motivo_veto: null,
  }

  if (!dadosMatricula?.dados) {
    resultado.itens.push({ item: "Proprietário", status: "erro", mensagem: "Dados de titularidade não disponíveis", pontos: 0 })
    return resultado
  }

  const proprietarios = dadosMatricula.dados.proprietarios || []

  if (proprietarios.length === 0) {
    resultado.pontos = TITULARIDADE.INDEFINIDO.pontos
    resultado.percentual = 25
    resultado.itens.push({ item: "Proprietário", status: "indefinido", mensagem: "Proprietário não identificado na matrícula", pontos: TITULARIDADE.INDEFINIDO.pontos })
    return resultado
  }

  // Espólio
  if (proprietarios.some((p) => normalizar(p.nome || "").includes("espolio") || normalizar(p.nome || "").includes("espólio"))) {
    resultado.veto = true
    resultado.motivo_veto = "Espólio não inventariado - vendedor sem capacidade"
    resultado.itens.push({ item: "Titularidade", status: "veto", mensagem: "Espólio identificado - requer conclusão do inventário", pontos: 0 })
    return resultado
  }

  // Incapaz
  if (proprietarios.some((p) => {
    const n = normalizar(p.nome || "")
    return n.includes("menor") || n.includes("incapaz") || n.includes("interditado")
  })) {
    resultado.veto = true
    resultado.motivo_veto = "Proprietário incapaz - requer autorização judicial"
    resultado.itens.push({ item: "Titularidade", status: "veto", mensagem: "Proprietário incapaz identificado", pontos: 0 })
    return resultado
  }

  // Classificar
  let tipoTitularidade: { pontos: number; label: string }

  if (proprietarios.length === 1) {
    const prop = proprietarios[0]
    if (prop.cpf_cnpj && prop.cpf_cnpj.length > 14 || normalizar(prop.nome || "").match(/(ltda|s\.a\.|s\/a|eireli|me|epp|sociedade|empresa)/)) {
      tipoTitularidade = TITULARIDADE.PESSOA_JURIDICA
    } else {
      tipoTitularidade = TITULARIDADE.PROPRIETARIO_UNICO
    }
  } else if (proprietarios.length === 2) {
    const regimes = proprietarios.map((p) => normalizar(p.regime_bens || ""))
    const temRegimeCasamento = regimes.some((r) => r.includes("comunhao") || r.includes("separacao") || r.includes("participacao"))
    if (temRegimeCasamento || proprietarios.some((p) => p.conjuge)) {
      tipoTitularidade = TITULARIDADE.CASAL
    } else {
      tipoTitularidade = TITULARIDADE.CONDOMINIO
    }
  } else {
    tipoTitularidade = TITULARIDADE.CONDOMINIO
  }

  resultado.pontos = tipoTitularidade.pontos
  resultado.percentual = (tipoTitularidade.pontos / PESOS.TITULARIDADE) * 100
  resultado.itens.push({
    item: "Tipo de Titularidade",
    status: tipoTitularidade.pontos >= 15 ? "ok" : "atencao",
    mensagem: tipoTitularidade.label,
    pontos: tipoTitularidade.pontos,
    proprietarios: proprietarios.map((p) => ({
      nome: p.nome,
      percentual: p.percentual,
      cpf_cnpj: p.cpf_cnpj ? "***" + p.cpf_cnpj.slice(-4) : null,
    })),
  })

  if (proprietarios.length > 2) {
    resultado.itens.push({ item: "Condomínio", status: "atencao", mensagem: `${proprietarios.length} proprietários - todos devem assinar`, pontos: 0 })
  }

  return resultado
}

// ============================================
// DIMENSÃO 4: TÉCNICA (10 pts)
// ============================================

export function analisarDimensaoTecnica(
  dadosMatricula: ResultadoAnalise<DadosMatricula> | null,
  tipoOperacao = "transferencia",
): ResultadoDimensao {
  const resultado: ResultadoDimensao = {
    dimensao: "tecnica", nome: "Situação Técnica", peso: PESOS.TECNICA,
    pontos: 0, percentual: 0, itens: [], veto: false, motivo_veto: null,
  }

  if (!dadosMatricula?.dados) {
    resultado.itens.push({ item: "Georreferenciamento", status: "indefinido", mensagem: "Dados técnicos não disponíveis", pontos: 0 })
    return resultado
  }

  const dados = dadosMatricula.dados as DadosMatricula & Record<string, unknown>

  // Verificar certificação
  const textosParaVerificar = [
    dados.alertas?.join(" ") || "",
  ].filter(Boolean)

  const temCertificacao =
    (dados as Record<string, unknown>).georreferenciamento_certificado === true ||
    (dados as Record<string, unknown>).sigef === true ||
    textosParaVerificar.some((t) => normalizar(String(t)).includes("certificad") && normalizar(String(t)).includes("georreferencia"))

  const temGeorref =
    (dados as Record<string, unknown>).georreferenciamento === true ||
    textosParaVerificar.some((t) => normalizar(String(t)).includes("georreferencia"))

  if (temCertificacao || temGeorref) {
    resultado.pontos = GEORREFERENCIAMENTO.CERTIFICADO.pontos
    resultado.percentual = 100
    resultado.itens.push({ item: "Georreferenciamento", status: "ok", mensagem: GEORREFERENCIAMENTO.CERTIFICADO.label, pontos: GEORREFERENCIAMENTO.CERTIFICADO.pontos })
  } else if (tipoOperacao === "desmembramento" || tipoOperacao === "parcelamento") {
    resultado.itens.push({ item: "Georreferenciamento", status: "impeditivo", mensagem: GEORREFERENCIAMENTO.NAO_GEORREF_DESMEMBRAMENTO.label, pontos: 0 })
  } else {
    resultado.pontos = GEORREFERENCIAMENTO.NAO_GEORREF_TRANSFERENCIA.pontos
    resultado.percentual = 50
    resultado.itens.push({ item: "Georreferenciamento", status: "atencao", mensagem: GEORREFERENCIAMENTO.NAO_GEORREF_TRANSFERENCIA.label, pontos: GEORREFERENCIAMENTO.NAO_GEORREF_TRANSFERENCIA.pontos, nota: "Decreto 12.689/2025 - Prazo prorrogado" })
  }

  if (dados.ccir || dados.codigo_imovel_incra) {
    resultado.itens.push({ item: "Código INCRA", status: "ok", mensagem: `Código identificado: ${dados.codigo_imovel_incra || dados.ccir}`, pontos: 0 })
  }

  return resultado
}

// ============================================
// LOCALIZAÇÃO UC
// ============================================

export function analisarLocalizacaoUC(
  ideSisema: { sucesso: boolean; ucs_encontradas?: Array<{ nome?: string; unidade?: string; categoria?: string; protecao_integral?: boolean; percentual_sobreposicao?: number; area_sobreposicao_ha?: number }> } | null,
): ResultadoLocalizacaoUC {
  const resultado: ResultadoLocalizacaoUC = {
    dimensao: "localizacao", nome: "Localização em UC",
    dentroUC: false, protecaoIntegral: false, percentualDentro: 0, percentualFora: 100,
    uc: null, veto: false, motivo_veto: null,
  }

  if (!ideSisema?.sucesso) {
    resultado.observacao = "Análise geoespacial indisponível"
    return resultado
  }

  const ucs = ideSisema.ucs_encontradas || []
  if (ucs.length === 0) {
    resultado.veto = true
    resultado.motivo_veto = "Imóvel 100% fora de Unidade de Conservação de Proteção Integral"
    return resultado
  }

  const ucPrincipal = ucs.reduce((max, uc) =>
    (uc.percentual_sobreposicao || 0) > (max.percentual_sobreposicao || 0) ? uc : max,
  ucs[0])

  resultado.dentroUC = true
  resultado.percentualDentro = ucPrincipal.percentual_sobreposicao || 100
  resultado.percentualFora = 100 - resultado.percentualDentro
  resultado.uc = {
    nome: ucPrincipal.nome || ucPrincipal.unidade || "",
    categoria: ucPrincipal.categoria || "",
    protecaoIntegral: ucPrincipal.protecao_integral || false,
    areaSobreposicao: ucPrincipal.area_sobreposicao_ha || 0,
  }

  if (!ucPrincipal.protecao_integral) {
    resultado.veto = true
    resultado.motivo_veto = "UC não é de Proteção Integral (exigência da Portaria IEF 27/2017)"
  }

  if (resultado.percentualDentro === 0) {
    resultado.veto = true
    resultado.motivo_veto = "Imóvel 100% fora de Unidade de Conservação de Proteção Integral"
  }

  resultado.protecaoIntegral = ucPrincipal.protecao_integral || false

  return resultado
}

// ============================================
// RESUMO EXECUTIVO
// ============================================

function gerarResumoExecutivo(
  faixa: string,
  vetos: Array<{ origem: string; motivo: string }>,
  dimensoes: ResultadoMVAR["dimensoes"],
  localizacaoUC: ResultadoLocalizacaoUC,
): string {
  const partes: string[] = []

  if (vetos.length > 0) {
    partes.push(`ANÁLISE VETADA: ${vetos.map((v) => v.motivo).join("; ")}`)
  } else if (faixa === "VERDE") {
    partes.push("Imóvel apresenta condições favoráveis para prosseguir com a aquisição.")
  } else if (faixa === "AMARELO") {
    partes.push("Imóvel apresenta pendências que devem ser sanadas antes da aquisição.")
  } else {
    partes.push("Imóvel apresenta impedimentos significativos. Não recomendado prosseguir.")
  }

  const atencao: string[] = []
  if (dimensoes.juridica.pontos < dimensoes.juridica.peso) {
    const onusAtivos = dimensoes.juridica.itens.filter((i) => i.status === "impeditivo" || i.status === "dificultador")
    if (onusAtivos.length > 0) atencao.push(`Ônus identificados: ${onusAtivos.map((o) => o.item).join(", ")}`)
  }
  if (dimensoes.fiscal.pontos === 0 && !dimensoes.fiscal.veto) atencao.push("CND-ITR não apresentada ou com pendências")
  if (dimensoes.titularidade.pontos < 15) atencao.push("Titularidade requer atenção especial")
  if (dimensoes.tecnica.pontos < 10) atencao.push("Imóvel não possui georreferenciamento certificado")
  if (!localizacaoUC.protecaoIntegral && localizacaoUC.dentroUC) atencao.push("UC não é de Proteção Integral")
  if (localizacaoUC.percentualFora > 0 && localizacaoUC.dentroUC) atencao.push(`${localizacaoUC.percentualFora.toFixed(1)}% do imóvel está fora da UC`)

  if (atencao.length > 0) partes.push("Pontos de atenção: " + atencao.join("; ") + ".")

  return partes.join(" ")
}

// ============================================
// FUNÇÃO PRINCIPAL: CALCULAR MVAR
// ============================================

export async function calcularMVAR(
  dadosMatricula: ResultadoAnalise<DadosMatricula> | null,
  dadosCND: DadosCND | null,
  ideSisema: { sucesso: boolean; ucs_encontradas?: Array<{ nome?: string; unidade?: string; categoria?: string; protecao_integral?: boolean; percentual_sobreposicao?: number; area_sobreposicao_ha?: number }> } | null,
  opcoes: { tipoOperacao?: string; municipio?: string } = {},
): Promise<ResultadoMVAR> {
  const inicio = Date.now()

  // 1. Analisar dimensões
  const dimensaoJuridica = analisarDimensaoJuridica(dadosMatricula)
  const dimensaoFiscal = analisarDimensaoFiscal(dadosCND, dadosMatricula)
  const dimensaoTitularidade = analisarDimensaoTitularidade(dadosMatricula)
  const dimensaoTecnica = analisarDimensaoTecnica(dadosMatricula, opcoes.tipoOperacao)
  const localizacaoUC = analisarLocalizacaoUC(ideSisema)

  // 2. VETOs
  const vetos: Array<{ origem: string; motivo: string }> = []
  if (dimensaoJuridica.veto) vetos.push({ origem: "Jurídica", motivo: dimensaoJuridica.motivo_veto! })
  if (dimensaoFiscal.veto) vetos.push({ origem: "Fiscal", motivo: dimensaoFiscal.motivo_veto! })
  if (dimensaoTitularidade.veto) vetos.push({ origem: "Titularidade", motivo: dimensaoTitularidade.motivo_veto! })
  if (localizacaoUC.veto) vetos.push({ origem: "Localização", motivo: localizacaoUC.motivo_veto! })

  // 3. Pontuação
  let pontuacaoTotal = vetos.length > 0
    ? 0
    : dimensaoJuridica.pontos + dimensaoFiscal.pontos + dimensaoTitularidade.pontos + dimensaoTecnica.pontos

  pontuacaoTotal = Math.round(pontuacaoTotal / 5) * 5

  // 4. Classificação
  const faixaFinal = vetos.length > 0 ? "VERMELHO" : pontuacaoTotal >= 90 ? "VERDE" : pontuacaoTotal >= 60 ? "AMARELO" : "VERMELHO"
  const classificacaoInfo = faixaFinal === "VERDE" ? FAIXAS.VERDE : faixaFinal === "AMARELO" ? FAIXAS.AMARELO : FAIXAS.VERMELHO

  // 5. VTN
  let vtn: ResultadoVTN | null = null
  const municipio = opcoes.municipio || dadosMatricula?.dados?.municipio
  const estado = dadosMatricula?.dados?.estado || "MG"
  if (municipio) {
    vtn = consultarVTN(municipio, estado)
    if (vtn.encontrado && vtn.valor_referencia && dadosMatricula?.dados?.area_hectares) {
      const areaHa = dadosMatricula.dados.area_hectares
      vtn.valor_estimado = Math.round(vtn.valor_referencia * areaHa * 100) / 100
      vtn.area_hectares = areaHa
    }
  }

  const dimensoes = {
    juridica: dimensaoJuridica,
    fiscal: dimensaoFiscal,
    titularidade: dimensaoTitularidade,
    tecnica: dimensaoTecnica,
  }

  return {
    versao: "1.0.0",
    data_analise: new Date().toISOString(),
    tempo_processamento_ms: Date.now() - inicio,
    pontuacao: { total: pontuacaoTotal, maximo: 100, percentual: pontuacaoTotal },
    classificacao: { faixa: faixaFinal, label: classificacaoInfo.label, acao: classificacaoInfo.acao, cor: classificacaoInfo.cor },
    vetos,
    tem_veto: vetos.length > 0,
    dimensoes,
    localizacao_uc: localizacaoUC,
    vtn,
    resumo: gerarResumoExecutivo(faixaFinal, vetos, dimensoes, localizacaoUC),
  }
}

/**
 * Pipeline de Análise de Matrícula — v3
 *
 * Arquitetura baseada no documento de referência pipeline-analise-matricula-v1.
 *
 * LLM (3 chamadas, A+B em paralelo):
 *   A. Dados do Imóvel — bloco de abertura, áreas, documentos
 *   B. Atos com Partes — cada ato com transmitentes, adquirentes, percentuais
 *   C. Análise de Transmissibilidade — recebe só JSON, sem PDF
 *
 * Código determinístico:
 *   - Pareamento de cancelamentos
 *   - Classificação de ônus (ativos vs extintos)
 *   - Cadeia de titularidade (com transmissão parcial)
 *   - Área vigente (retificação + desmembramento)
 *   - Outorga conjugal (art. 1.647 CC)
 *   - Georreferenciamento (Decreto 4.449/2002)
 *   - Restrições ambientais
 *   - Contexto UC (reclassificação se imóvel em UC de proteção integral)
 *   - Semáforo (regras binárias, sem LLM)
 */

// ============================================
// TIPOS
// ============================================

export interface TransmitenteExtraido {
  nome: string
  cpf: string | null
  qualificacao: string | null
  conjuge: string | null
  regime_bens: string | null
  percentual: number | null
}

export interface AdquirenteExtraido {
  nome: string
  cpf: string | null
  percentual: number | null
  qualificacao: string | null
  estado_civil: string | null
  conjuge: string | null
  regime_bens: string | null
}

export interface ValorAto {
  nominal: number | null
  moeda: string | null // BRL, CRZ, NCZ, CR$
  descricao: string | null
}

export interface RetificacaoAto {
  campo: string | null
  valor_anterior: string | null
  valor_novo: string | null
}

export interface GarantiaAto {
  tipo: string | null
  credor: string | null
  valor: number | null
  vencimento: string | null
}

export interface AtoRegistral {
  numero: string
  tipo_ato: "registro" | "averbacao"
  data: string | null
  natureza: string
  natureza_texto_original: string
  descricao_resumida: string
  partes: {
    transmitentes: TransmitenteExtraido[]
    adquirentes: AdquirenteExtraido[]
  }
  valor: ValorAto | null
  area_ha: number | null
  refere_totalidade: boolean
  referencia_ato_anterior: string | null
  retifica: RetificacaoAto | null
  condicoes: string[]
  garantias: GarantiaAto | null
  observacoes: string | null
}

export interface ParAtoCancelamento {
  ato_criacao: string
  ato_extinção: string
  tipo_onus: string
  motivo_extincao: string
  status: "cancelado"
}

export interface OnusAtivo {
  ato: string
  tipo: string
  nivel: 1 | 2 | 3 | 4
  nivel_descricao: string
  descricao: string
  credor: string | null
  valor: number | null
  data: string | null
  impacto_transmissao: string
}

export interface OnusExtinto {
  ato: string
  tipo: string
  descricao: string
  cancelado_por: string
  data_cancelamento: string | null
}

export interface ProprietarioAtual {
  nome: string
  cpf: string | null
  qualificacao: string | null
  estado_civil: string | null
  conjuge: string | null
  regime_bens: string | null
  percentual: number | null
  fracao: string | null
  ato_aquisitivo: string
  data_aquisicao: string | null
}

export interface OutorgaConjugal {
  nome: string
  casado: boolean
  conjuge: string | null
  regime_bens: string | null
  exige_outorga: boolean
  observacao: string | null
}

export interface GeorefStatus {
  exigivel: boolean
  prazo_legal: string
  existente: boolean
  certificacao: string | null
  situacao: "regular" | "pendente"
  impacto: string | null
}

export interface RestricaoAmbiental {
  tipo: string
  descricao: string
  ato_origem: string
  data: string | null
  area_ha: number | null
  condicoes: string[]
}

export interface RegimeUC {
  em_uc_protecao_integral: boolean
  nome_uc: string | null
  categoria_uc: string | null
  percentual_sobreposicao: number | null
  fundamentacao: string
  impacto_transmissao: string
}

export interface ContextoUC {
  restricoes_vigentes: RestricaoAmbiental[]
  contexto_historico: Array<RestricaoAmbiental & { motivo_reclassificacao: string }>
  regime_uc: RegimeUC | null
}

export interface OpcoesUC {
  imovelEmUC?: boolean
  nomeUC?: string | null
  categoriaUC?: string | null
  percentualSobreposicao?: number | null
}

export interface AnaliseTransmissibilidade {
  resumo: string
  impedimentos: Array<{
    descricao: string
    ato_origem: string | null
    fundamentacao: string
    recomendacao: string
  }>
  irregularidades_registrais: Array<{
    descricao: string
    recomendacao: string
  }>
  diligencias_recomendadas: string[]
  dados_para_escritura: Record<string, unknown>
  ressalvas: string[]
}

export interface DadosImovel {
  matricula: string | null
  livro: string | null
  cartorio: string | null
  municipio: string | null
  comarca: string | null
  uf: string | null
  data_abertura: string | null
  tipo_imovel: "rural" | "urbano" | null
  area_ha: number | null
  area_original_ha: number | null
  area_retificada_ha: number | null
  perimetro_m: number | null
  denominacao: string | null
  ccir: string | null
  nirf: string | null
  codigo_incra: string | null
  car: string | null
  georreferenciamento: boolean | null
  georef_certificacao: string | null
  fmp_ha: number | null
  modulo_rural_ha: number | null
  num_modulos_fiscais: number | null
  matricula_anterior: string | null
  confianca_ocr: "alta" | "media" | "baixa"
}

export interface ResultadoPipeline {
  imovel: DadosImovel
  atos: AtoRegistral[]
  cancelamentos: ParAtoCancelamento[]
  onus_ativos: OnusAtivo[]
  onus_extintos: OnusExtinto[]
  proprietarios_atuais: ProprietarioAtual[]
  outorga_conjugal: OutorgaConjugal[]
  georeferenciamento: GeorefStatus
  restricoes_ambientais: RestricaoAmbiental[]
  contexto_historico_ambiental: Array<RestricaoAmbiental & { motivo_reclassificacao: string }>
  regime_uc: RegimeUC | null
  analise_transmissibilidade: AnaliseTransmissibilidade | null
  semaforo: "verde" | "amarelo" | "vermelho"
  semaforo_justificativa: string
  recomendacoes: string[]
  documentos_faltantes: string[]
  alertas: string[]
  tokens_consumidos: { etapa: string; input: number; output: number }[]
}

// ============================================
// CONSTANTES
// ============================================

const NATUREZAS_TRANSMISSIVAS = [
  "compra_e_venda", "doacao", "permuta", "formal_de_partilha",
  "adjudicacao", "usucapiao", "divisao_amigavel", "extincao_condominio",
  "dacao_em_pagamento", "arrematacao", "legitimacao_posse",
  "legitimacao_fundiaria", "desapropriacao",
]

const NATUREZAS_ONUS = [
  "hipoteca", "alienacao_fiduciaria", "cedula_credito", "penhor_rural",
  "penhora", "arresto", "sequestro", "indisponibilidade",
  "servidao", "usufruto", "enfiteuse", "anticrese", "bem_de_familia",
]

const NATUREZAS_AMBIENTAIS = [
  "averbacao_car", "averbacao_reserva_legal", "averbacao_termo_florestal",
  "averbacao_servidao_ambiental", "contrato_servicos_ambientais", "tombamento",
]

const PALAVRAS_CHAVE_AMBIENTAL = [
  "servidão", "servidões", "servidao",
  "reserva legal", "reserva florestal",
  "preservação", "preservacao",
  "vegetação nativa", "vegetacao nativa",
  "APP", "área de preservação permanente",
  "nascente", "córrego", "curso d'água",
  "florestal", "floresta",
  "termo de responsabilidade",
]

// Ônus nível 1 — impedem transmissão
const ONUS_NIVEL_1 = [
  "penhora", "arresto", "sequestro", "indisponibilidade",
  "alienacao_fiduciaria",
]

// Ônus nível 2 — gravam mas não impedem
const ONUS_NIVEL_2 = [
  "hipoteca", "cedula_credito", "penhor_rural",
  "usufruto", "servidao", "enfiteuse", "anticrese", "bem_de_familia",
]

const LISTA_NATUREZAS_PROMPT = `TRANSMISSIVAS (afetam cadeia de titularidade):
  compra_e_venda, doacao, permuta, formal_de_partilha, adjudicacao,
  usucapiao, divisao_amigavel, extincao_condominio, dacao_em_pagamento,
  arrematacao, legitimacao_posse, legitimacao_fundiaria, desapropriacao

ÔNUS REAIS (gravam o imóvel):
  hipoteca, alienacao_fiduciaria, cedula_credito, penhor_rural,
  penhora, arresto, sequestro, indisponibilidade, servidao,
  usufruto, enfiteuse, anticrese, bem_de_familia

AVERBAÇÕES DE ALTERAÇÃO:
  retificacao_area, retificacao_nome, desmembramento, remembramento,
  cancelamento, quitacao

AVERBAÇÕES AMBIENTAIS:
  averbacao_car, averbacao_reserva_legal, averbacao_termo_florestal,
  averbacao_servidao_ambiental, contrato_servicos_ambientais, tombamento

AVERBAÇÕES PESSOAIS:
  convencao_antenupcial, regime_bens, casamento, divorcio, separacao

LOCAÇÃO:
  locacao_vigencia, locacao_preferencia

OUTROS:
  imissao_posse, certidao_regularizacao_fundiaria, outro`

// ============================================
// CONFIG + HELPERS
// ============================================

function getClaudeConfig() {
  return {
    apiKey: process.env.CLAUDE_API_KEY || "",
    apiUrl: process.env.CLAUDE_API_URL || "https://api.anthropic.com/v1/messages",
    model: process.env.CLAUDE_MODEL || "claude-opus-4-20250514",
  }
}

async function chamarClaude(
  pdfBuffer: Buffer,
  prompt: string,
  maxTokens = 4096,
): Promise<{ json: Record<string, unknown>; tokens: { input_tokens: number; output_tokens: number } }> {
  const { apiKey, apiUrl, model } = getClaudeConfig()
  const base64 = pdfBuffer.toString("base64")

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
          { type: "text", text: prompt },
        ],
      }],
    }),
  })

  return parsearRespostaClaude(response)
}

async function chamarClaudeTexto(
  prompt: string,
  maxTokens = 4096,
): Promise<{ json: Record<string, unknown>; tokens: { input_tokens: number; output_tokens: number } }> {
  const { apiKey, apiUrl, model } = getClaudeConfig()

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  })

  return parsearRespostaClaude(response)
}

async function parsearRespostaClaude(
  response: Response,
): Promise<{ json: Record<string, unknown>; tokens: { input_tokens: number; output_tokens: number } }> {
  if (!response.ok) {
    const text = await response.text()
    let errorMessage = ""
    try {
      const errorData = JSON.parse(text)
      errorMessage = errorData.error?.message || ""
    } catch {
      errorMessage = `HTTP ${response.status}`
    }
    throw new Error(`API Claude: ${errorMessage}`)
  }

  const data = await response.json() as {
    content: { text: string }[]
    usage: { input_tokens: number; output_tokens: number }
  }

  const resposta = data.content[0].text
  const jsonMatch = resposta.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error("Claude não retornou JSON válido")

  return { json: JSON.parse(jsonMatch[0]), tokens: data.usage }
}

// ============================================
// UTILITÁRIOS
// ============================================

function normalizarNumeroAto(numero: string): string {
  const match = numero.match(/^(R|AV|Av|av|r)\.?-?(\d+)/i)
  if (match) return `${match[1].toLowerCase()}-${match[2]}`
  return numero.toLowerCase().trim()
}

function normalizarNome(nome: string): string {
  return nome.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

// ============================================
// PROMPT A — DADOS DO IMÓVEL (LLM)
// Foco: bloco de abertura, sem atos
// ============================================

async function promptA_DadosImovel(pdfBuffer: Buffer): Promise<{
  imovel: DadosImovel
  proprietario_abertura: AdquirenteExtraido[]
  tokens: { input_tokens: number; output_tokens: number }
}> {
  const prompt = `Você é um especialista em registro de imóveis brasileiro. Sua ÚNICA tarefa é extrair os dados de identificação do imóvel a partir do bloco de abertura da matrícula anexa.

REGRAS ESTRITAS:
- Extraia SOMENTE do bloco de abertura da matrícula (antes do primeiro ato R.1 ou R-1).
- Se um dado não existir no documento, retorne null. NUNCA invente.
- Se houver RETIFICAÇÃO DE ÁREA em qualquer ato posterior (ex: "fica retificada a área para..."), informe AMBAS: area_original_ha e area_retificada_ha.
- Normalize TODAS as áreas para hectares:
  * "50h.82a.00c." = 50.8200 ha
  * "33ha.97as.61c" = 33.9761 ha
  * "14,0397 alqueires paulistas" = 33.9761 ha (1 alq. paulista = 2.42 ha)
  * "24,692 alqueires" em MG = considere alqueire mineiro (4.84 ha) salvo indicação contrária
  * "324,3614Ha" = 324.3614 ha
- CCIR é um número de ~11 dígitos (ex: 44554926220). Não confunda com:
  * CAR (começa com "MG-" seguido de código longo)
  * INCRA/código do imóvel (formato XXX.XXX.XXX.XXX-X)
  * NIRF (formato X.XXX.XXX-X)
- Extraia também o(s) PROPRIETÁRIO(S) nomeado(s) na abertura da matrícula (antes dos atos).

## FORMATO DE RESPOSTA:

{
  "imovel": {
    "matricula": "número da matrícula",
    "livro": "livro e folha se informados",
    "cartorio": "nome do cartório/ofício",
    "municipio": "município",
    "comarca": "comarca",
    "uf": "UF (ex: MG)",
    "data_abertura": "AAAA-MM-DD ou null",
    "tipo_imovel": "rural ou urbano",
    "denominacao": "nome da fazenda/sítio/lote",
    "area_original_ha": 0.0,
    "area_retificada_ha": null,
    "perimetro_m": null,
    "ccir": "número ou null",
    "nirf": "número ou null",
    "codigo_incra": "código ou null",
    "car": "código ou null",
    "georreferenciamento": true,
    "georef_certificacao": "código hash ou null",
    "fmp_ha": null,
    "modulo_rural_ha": null,
    "num_modulos_fiscais": null,
    "matricula_anterior": "referência ou null",
    "confianca_ocr": "alta | media | baixa"
  },
  "proprietario_abertura": [
    {
      "nome": "NOME COMPLETO EM MAIÚSCULAS",
      "cpf": "CPF ou null",
      "percentual": 100,
      "qualificacao": "brasileira, funcionária pública",
      "estado_civil": "casada",
      "conjuge": "NOME DO CÔNJUGE ou null",
      "regime_bens": "comunhão parcial de bens ou null"
    }
  ]
}

REGRA DE CONFIANÇA OCR:
- "alta": texto digital limpo, sem artefatos
- "media": texto legível mas com eventuais caracteres duvidosos
- "baixa": texto datilografado antigo, muitos caracteres degradados

RETORNE APENAS JSON VÁLIDO.`

  const { json, tokens } = await chamarClaude(pdfBuffer, prompt, 4096)
  console.log(`[PIPELINE] Prompt A (Dados Imóvel): ${tokens.input_tokens} input + ${tokens.output_tokens} output`)

  const imovelRaw = json.imovel as Record<string, unknown>

  const imovel: DadosImovel = {
    matricula: (imovelRaw.matricula as string) ?? null,
    livro: (imovelRaw.livro as string) ?? null,
    cartorio: (imovelRaw.cartorio as string) ?? null,
    municipio: (imovelRaw.municipio as string) ?? null,
    comarca: (imovelRaw.comarca as string) ?? null,
    uf: (imovelRaw.uf as string) ?? null,
    data_abertura: (imovelRaw.data_abertura as string) ?? null,
    tipo_imovel: (imovelRaw.tipo_imovel as "rural" | "urbano") ?? null,
    area_ha: (imovelRaw.area_retificada_ha as number) ?? (imovelRaw.area_original_ha as number) ?? null,
    area_original_ha: (imovelRaw.area_original_ha as number) ?? null,
    area_retificada_ha: (imovelRaw.area_retificada_ha as number) ?? null,
    perimetro_m: (imovelRaw.perimetro_m as number) ?? null,
    denominacao: (imovelRaw.denominacao as string) ?? null,
    ccir: (imovelRaw.ccir as string) ?? null,
    nirf: (imovelRaw.nirf as string) ?? null,
    codigo_incra: (imovelRaw.codigo_incra as string) ?? null,
    car: (imovelRaw.car as string) ?? null,
    georreferenciamento: (imovelRaw.georreferenciamento as boolean) ?? null,
    georef_certificacao: (imovelRaw.georef_certificacao as string) ?? null,
    fmp_ha: (imovelRaw.fmp_ha as number) ?? null,
    modulo_rural_ha: (imovelRaw.modulo_rural_ha as number) ?? null,
    num_modulos_fiscais: (imovelRaw.num_modulos_fiscais as number) ?? null,
    matricula_anterior: (imovelRaw.matricula_anterior as string) ?? null,
    confianca_ocr: (imovelRaw.confianca_ocr as "alta" | "media" | "baixa") ?? "media",
  }

  const proprietarioAbertura = (json.proprietario_abertura || []) as unknown as AdquirenteExtraido[]

  return { imovel, proprietario_abertura: proprietarioAbertura, tokens }
}

// ============================================
// PROMPT B — ATOS COM PARTES (LLM)
// Foco: cada ato, com partes e percentuais
// ============================================

async function promptB_Atos(pdfBuffer: Buffer): Promise<{
  atos: AtoRegistral[]
  tokens: { input_tokens: number; output_tokens: number }
}> {
  const prompt = `Você é um especialista em registro de imóveis brasileiro. Sua ÚNICA tarefa é identificar e extrair CADA ATO (registros R e averbações AV) da matrícula anexa.

REGRAS ESTRITAS:
- Leia o documento inteiro do início ao fim.
- Cada ato começa com um identificador como "R.1-652", "R-1-12669", "AV.4-652", "AV-2-M-11290" ou similar.
- NÃO extraia dados do bloco de abertura da matrícula (isso já foi feito em outra etapa).

## ATENÇÃO ESPECIAL A PERCENTUAIS

Esta é sua tarefa MAIS IMPORTANTE. Para cada adquirente, procure:
- "adquiri X%", "adquiriu X%", "adquire X%"
- "na proporção de X%", "fração ideal de X%"
- "sendo X% para", "os menores adquirem X%"
- "X% deste imóvel", "X% do presente imóvel"
- "totalidade" → percentual: 100
- Adquirente único sem percentual explícito → percentual: 100
- Múltiplos adquirentes sem percentual → partes iguais (100/N)
- Se NÃO conseguir determinar com certeza → null (NUNCA invente)

Cada adquirente pode ter percentual DIFERENTE. Leia com atenção máxima.

## TRANSMITENTE vs ADQUIRENTE

- TRANSMITENTE é quem vende/transfere/doa/permuta (outorgante, vendedor, doador)
- ADQUIRENTE é quem compra/recebe/adquire (outorgado comprador, comprador, donatário)
- Em permuta, ambos são transmitentes E adquirentes
- Em divisão amigável, os condôminos são outorgantes recíprocos

## CANCELAMENTOS

Se o ato CANCELAR ou EXTINGUIR um ato anterior, preencha cancela_ato.
Procure: "fica cancelada", "cancelamento do R.", "quitação", "exonerado do ônus", "fica extinta".

## NATUREZAS PADRONIZADAS

${LISTA_NATUREZAS_PROMPT}

## FORMATO DE RESPOSTA

{
  "atos": [
    {
      "numero": "R-1-12669",
      "tipo_ato": "registro",
      "data": "2022-06-22",
      "natureza": "compra_e_venda",
      "natureza_texto_original": "ESC.PÚB.C.VENDA de 17.12.2021",
      "descricao_resumida": "Venda do imóvel por Alana e Marcos a Maria Iolanda (80%) e Eunapio (20%)",
      "partes": {
        "transmitentes": [
          {
            "nome": "ALANA PINHEIRO BOTELHO VILELA",
            "cpf": "971.408.566-72",
            "qualificacao": "brasileira, funcionária pública",
            "conjuge": "MARCOS COSTA VILELA",
            "regime_bens": "comunhão parcial de bens",
            "percentual": 100
          }
        ],
        "adquirentes": [
          {
            "nome": "MARIA IOLANDA RODRIGUES DE SOUSA",
            "cpf": "644.852.696-04",
            "percentual": 80,
            "qualificacao": "brasileira, separada judicialmente",
            "estado_civil": "separada judicialmente",
            "conjuge": null,
            "regime_bens": null
          },
          {
            "nome": "EUNAPIO BOTELHO DE SOUSA",
            "cpf": "390.360.495-04",
            "percentual": 20,
            "qualificacao": "brasileiro, produtor rural",
            "estado_civil": "casado",
            "conjuge": "MARIANA CAIRES DE ANDRADE BOTELHO",
            "regime_bens": "comunhão parcial de bens"
          }
        ]
      },
      "valor": { "nominal": 350000, "moeda": "BRL", "descricao": "Valor venal R$350.000,00" },
      "area_ha": null,
      "refere_totalidade": true,
      "referencia_ato_anterior": null,
      "retifica": null,
      "condicoes": [],
      "garantias": null,
      "observacoes": null
    }
  ]
}

REGRAS FINAIS:
- Extraia TODOS os atos, sem exceção, em ORDEM cronológica
- NÃO invente atos que não existem
- Se um campo não for legível, use null
- refere_totalidade: true se o ato se refere à totalidade do imóvel, false se se refere a fração
- Para retificações, preencha o campo retifica com valor_anterior e valor_novo

RETORNE APENAS JSON VÁLIDO.`

  const { json, tokens } = await chamarClaude(pdfBuffer, prompt, 16384)
  console.log(`[PIPELINE] Prompt B (Atos): ${tokens.input_tokens} input + ${tokens.output_tokens} output`)

  const atos = (json.atos || []) as unknown as AtoRegistral[]

  // Normalizar campos que podem vir undefined
  for (const ato of atos) {
    ato.condicoes = ato.condicoes || []
    ato.refere_totalidade = ato.refere_totalidade ?? true
    ato.partes = ato.partes || { transmitentes: [], adquirentes: [] }
    ato.partes.transmitentes = ato.partes.transmitentes || []
    ato.partes.adquirentes = ato.partes.adquirentes || []
  }

  // Log para debug
  for (const ato of atos) {
    if (ato.partes.adquirentes.length > 0) {
      console.log(`[PIPELINE] ${ato.numero} adquirentes:`, JSON.stringify(ato.partes.adquirentes))
    }
  }

  return { atos, tokens }
}

// ============================================
// CÓDIGO DETERMINÍSTICO
// ============================================

// --- 1. Pareamento de cancelamentos ---

function resolverPareamento(atos: AtoRegistral[]): {
  cancelamentos: ParAtoCancelamento[]
  alertas: string[]
} {
  const cancelamentos: ParAtoCancelamento[] = []
  const alertas: string[] = []

  const atosPorNumero = new Map<string, AtoRegistral>()
  for (const ato of atos) {
    atosPorNumero.set(normalizarNumeroAto(ato.numero), ato)
  }

  // Atos com cancela_ato / referencia_ato_anterior preenchido
  const DESCRICOES_EXTINTIVAS = /cancelad[oa]|baixad[oa]|extint[oa]|quitad[oa]|exonerad[oa]/i
  const jaPareados = new Set<string>()

  for (const ato of atos) {
    const ref = ato.referencia_ato_anterior
    const ehCancelamento = ato.natureza === "cancelamento" || ato.natureza === "quitacao"

    if (ehCancelamento && ref) {
      const refNorm = normalizarNumeroAto(ref)
      const atoOrigem = atosPorNumero.get(refNorm)
      jaPareados.add(refNorm)

      cancelamentos.push({
        ato_criacao: ref,
        ato_extinção: ato.numero,
        tipo_onus: atoOrigem?.natureza || "desconhecido",
        motivo_extincao: ato.descricao_resumida,
        status: "cancelado",
      })
    } else if (ehCancelamento && !ref) {
      alertas.push(
        `Ato ${ato.numero} é cancelamento, mas não indica qual ato está sendo cancelado. Verificar manualmente.`,
      )
    } else if (ref && DESCRICOES_EXTINTIVAS.test(ato.descricao_resumida)) {
      const refNorm = normalizarNumeroAto(ref)
      if (!jaPareados.has(refNorm)) {
        const atoOrigem = atosPorNumero.get(refNorm)
        jaPareados.add(refNorm)
        cancelamentos.push({
          ato_criacao: ref,
          ato_extinção: ato.numero,
          tipo_onus: atoOrigem?.natureza || "desconhecido",
          motivo_extincao: ato.descricao_resumida,
          status: "cancelado",
        })
      }
    }
  }

  return { cancelamentos, alertas }
}

// --- 2. Classificação de ônus ---

function resolverOnus(atos: AtoRegistral[], cancelamentos: ParAtoCancelamento[]): {
  ativos: OnusAtivo[]
  extintos: OnusExtinto[]
} {
  const atosCancelados = new Set(cancelamentos.map((c) => normalizarNumeroAto(c.ato_criacao)))
  const cancelamentoPorAto = new Map<string, ParAtoCancelamento>()
  for (const c of cancelamentos) {
    cancelamentoPorAto.set(normalizarNumeroAto(c.ato_criacao), c)
  }

  const ativos: OnusAtivo[] = []
  const extintos: OnusExtinto[] = []

  for (const ato of atos) {
    if (!NATUREZAS_ONUS.includes(ato.natureza)) continue
    const numNorm = normalizarNumeroAto(ato.numero)

    if (atosCancelados.has(numNorm)) {
      const canc = cancelamentoPorAto.get(numNorm)!
      extintos.push({
        ato: ato.numero,
        tipo: ato.natureza,
        descricao: ato.descricao_resumida,
        cancelado_por: canc.ato_extinção,
        data_cancelamento: atos.find(
          (a) => normalizarNumeroAto(a.numero) === normalizarNumeroAto(canc.ato_extinção),
        )?.data ?? null,
      })
      continue
    }

    const ehNivel1 = ONUS_NIVEL_1.includes(ato.natureza)
    const credor = ato.garantias?.credor
      || (ato.partes.adquirentes.length > 0 ? ato.partes.adquirentes[0].nome : null)

    ativos.push({
      ato: ato.numero,
      tipo: ato.natureza,
      nivel: ehNivel1 ? 1 : 2,
      nivel_descricao: ehNivel1 ? "Impedimento absoluto" : "Ônus real que sobrevive à transmissão",
      descricao: ato.descricao_resumida,
      credor,
      valor: ato.valor?.nominal ?? null,
      data: ato.data,
      impacto_transmissao: ehNivel1
        ? impactoNivel1(ato.natureza)
        : impactoNivel2(ato.natureza),
    })
  }

  return { ativos, extintos }
}

function impactoNivel1(natureza: string): string {
  const impactos: Record<string, string> = {
    penhora: "Impede a transmissão enquanto persistir. Requer quitação ou levantamento judicial.",
    arresto: "Impede a transmissão. Medida cautelar — requer decisão judicial para levantamento.",
    sequestro: "Impede a transmissão. Medida cautelar — requer decisão judicial.",
    indisponibilidade: "Impede qualquer ato de disposição. Requer levantamento judicial.",
    alienacao_fiduciaria: "Impede a transmissão sem anuência do credor fiduciário ou quitação integral.",
  }
  return impactos[natureza] || "Impede a transmissão enquanto não resolvido."
}

function impactoNivel2(natureza: string): string {
  const impactos: Record<string, string> = {
    hipoteca: "Não impede a transmissão, mas o imóvel responde pela dívida perante o credor hipotecário.",
    cedula_credito: "Não impede a transmissão, mas o ônus acompanha o imóvel.",
    penhor_rural: "Grava bens móveis vinculados ao imóvel, não o imóvel em si.",
    usufruto: "Não impede a transmissão da nua-propriedade, mas o usufrutuário mantém direito de uso.",
    servidao: "Restrição permanente de uso. Acompanha o imóvel independente do proprietário.",
    enfiteuse: "Domínio útil pertence ao enfiteuta. Transmissão sujeita a laudêmio.",
    anticrese: "Credor recebe frutos do imóvel. Não impede transmissão.",
    bem_de_familia: "Imóvel impenhorável. Transmissão voluntária é possível.",
  }
  return impactos[natureza] || "Ônus que sobrevive à transmissão."
}

// --- 3. Cadeia de titularidade ---

function resolverCadeiaTitularidade(
  atos: AtoRegistral[],
  cancelamentos: ParAtoCancelamento[],
  proprietarioAbertura: AdquirenteExtraido[],
): ProprietarioAtual[] {
  const atosCancelados = new Set(cancelamentos.map((c) => normalizarNumeroAto(c.ato_criacao)))

  const transmissoes = atos.filter(
    (a) =>
      NATUREZAS_TRANSMISSIVAS.includes(a.natureza) &&
      !atosCancelados.has(normalizarNumeroAto(a.numero)),
  )

  let proprietarios: ProprietarioAtual[] = []

  // Inicializar com proprietário da abertura
  if (proprietarioAbertura.length > 0) {
    proprietarios = proprietarioAbertura.map((p) => ({
      nome: p.nome,
      cpf: p.cpf,
      qualificacao: p.qualificacao,
      estado_civil: p.estado_civil,
      conjuge: p.conjuge,
      regime_bens: p.regime_bens,
      percentual: p.percentual,
      fracao: null,
      ato_aquisitivo: "abertura",
      data_aquisicao: null,
    }))
  }

  // Percorrer transmissões em ordem cronológica
  for (const ato of transmissoes) {
    if (ato.refere_totalidade) {
      // Substitui TODOS os proprietários
      proprietarios = ato.partes.adquirentes.map((adq) => ({
        nome: adq.nome,
        cpf: adq.cpf,
        qualificacao: adq.qualificacao,
        estado_civil: adq.estado_civil,
        conjuge: adq.conjuge,
        regime_bens: adq.regime_bens,
        percentual: adq.percentual,
        fracao: null,
        ato_aquisitivo: ato.numero,
        data_aquisicao: ato.data,
      }))
    } else {
      // Transmissão parcial — remove transmitentes, adiciona adquirentes
      for (const transm of ato.partes.transmitentes) {
        proprietarios = proprietarios.filter(
          (p) => normalizarNome(p.nome) !== normalizarNome(transm.nome),
        )
      }
      for (const adq of ato.partes.adquirentes) {
        proprietarios.push({
          nome: adq.nome,
          cpf: adq.cpf,
          qualificacao: adq.qualificacao,
          estado_civil: adq.estado_civil,
          conjuge: adq.conjuge,
          regime_bens: adq.regime_bens,
          percentual: adq.percentual,
          fracao: null,
          ato_aquisitivo: ato.numero,
          data_aquisicao: ato.data,
        })
      }
    }
  }

  // Aplicar averbações pessoais posteriores à última transmissão
  const idxUltima = transmissoes.length > 0
    ? atos.indexOf(transmissoes[transmissoes.length - 1])
    : -1

  for (let i = idxUltima + 1; i < atos.length; i++) {
    const av = atos[i]
    if (["casamento", "divorcio", "separacao", "convencao_antenupcial", "regime_bens", "inclusao_conjuge", "alteracao_estado_civil"].includes(av.natureza)) {
      aplicarAverbacaoPessoal(proprietarios, av)
    }
  }

  inferirPercentuais(proprietarios)

  return proprietarios
}

function aplicarAverbacaoPessoal(proprietarios: ProprietarioAtual[], av: AtoRegistral): void {
  for (const adq of av.partes.adquirentes) {
    const prop = proprietarios.find(
      (p) => normalizarNome(p.nome) === normalizarNome(adq.nome),
    )
    if (prop) {
      if (adq.estado_civil) prop.estado_civil = adq.estado_civil
      if (adq.conjuge) prop.conjuge = adq.conjuge
      if (adq.regime_bens) prop.regime_bens = adq.regime_bens
      if (adq.qualificacao) prop.qualificacao = adq.qualificacao
    }
  }
}

function inferirPercentuais(proprietarios: ProprietarioAtual[]): void {
  if (proprietarios.length === 0) return
  if (proprietarios.every((p) => p.percentual != null)) return

  if (proprietarios.length === 1 && proprietarios[0].percentual == null) {
    proprietarios[0].percentual = 100
    return
  }

  if (proprietarios.every((p) => p.percentual == null)) {
    const pct = parseFloat((100 / proprietarios.length).toFixed(4))
    for (const p of proprietarios) p.percentual = pct
    return
  }

  const totalConhecido = proprietarios
    .filter((p) => p.percentual != null)
    .reduce((s, p) => s + p.percentual!, 0)
  const semPct = proprietarios.filter((p) => p.percentual == null)

  if (semPct.length > 0 && totalConhecido < 100) {
    const restante = 100 - totalConhecido
    const pctCada = parseFloat((restante / semPct.length).toFixed(4))
    for (const p of semPct) p.percentual = pctCada
  }
}

// --- 4. Área vigente ---

function resolverAreaVigente(
  imovel: DadosImovel,
  atos: AtoRegistral[],
): { area_ha: number | null; fonte: string; alertas: string[] } {
  const alertas: string[] = []
  let areaVigente = imovel.area_original_ha ?? imovel.area_ha

  // Retificações de área
  const retificacoes = atos.filter(
    (a) => a.natureza === "retificacao_area",
  )

  for (const ret of retificacoes) {
    if (ret.retifica?.valor_novo) {
      const novaArea = parseFloat(ret.retifica.valor_novo)
      if (!isNaN(novaArea) && novaArea > 0) {
        alertas.push(
          `Área retificada pelo ato ${ret.numero}: de ${areaVigente ?? "?"} ha para ${novaArea} ha.`,
        )
        areaVigente = novaArea
      }
    } else if (ret.area_ha != null && ret.area_ha > 0) {
      alertas.push(
        `Área retificada pelo ato ${ret.numero}: de ${areaVigente ?? "?"} ha para ${ret.area_ha} ha.`,
      )
      areaVigente = ret.area_ha
    }
  }

  // Validação cruzada com area_retificada_ha do Prompt A
  if (imovel.area_retificada_ha != null && areaVigente != null) {
    if (Math.abs(areaVigente - imovel.area_retificada_ha) > 0.01) {
      alertas.push(
        `Divergência de área: atos indicam ${areaVigente} ha, abertura da matrícula indica retificação para ${imovel.area_retificada_ha} ha.`,
      )
    }
  }

  // Desmembramentos
  const desmembramentos = atos.filter(
    (a) => a.natureza === "desmembramento" && a.area_ha != null && a.area_ha > 0,
  )

  if (desmembramentos.length > 0 && areaVigente != null) {
    const areaDesmembrada = desmembramentos.reduce((s, d) => s + (d.area_ha || 0), 0)
    const remanescente = areaVigente - areaDesmembrada

    if (remanescente > 0 && remanescente < areaVigente) {
      alertas.push(
        `${desmembramentos.length} desmembramento(s) totalizando ${areaDesmembrada.toFixed(4)} ha. Área remanescente: ${remanescente.toFixed(4)} ha.`,
      )
      return { area_ha: remanescente, fonte: "Cálculo pós-desmembramento", alertas }
    }
  }

  const fonte = retificacoes.length > 0
    ? `Retificação (${retificacoes[retificacoes.length - 1].numero})`
    : "Abertura da matrícula"

  return { area_ha: areaVigente, fonte, alertas }
}

// --- 5. Outorga conjugal ---

function verificarOutorgaConjugal(proprietarios: ProprietarioAtual[]): OutorgaConjugal[] {
  return proprietarios.map((prop) => {
    const qualif = (prop.qualificacao || "").toLowerCase()
    const estadoCivil = (prop.estado_civil || "").toLowerCase()
    const temConjuge = prop.conjuge != null

    const ehCasado = temConjuge
      || estadoCivil.includes("casad")
      || qualif.includes("casad")

    const ehSeparado = estadoCivil.includes("separad") || qualif.includes("separad")
    const ehDivorciado = estadoCivil.includes("divorciad") || qualif.includes("divorciad")
    const ehViuvo = estadoCivil.includes("viúv") || estadoCivil.includes("viuv")
      || qualif.includes("viúv") || qualif.includes("viuv")

    let exigeOutorga = false
    let observacao: string | null = null

    if (ehCasado && !ehSeparado && !ehDivorciado) {
      exigeOutorga = true
      const regime = (prop.regime_bens || "").toLowerCase()
      if (regime.includes("separação") || regime.includes("separacao")) {
        observacao = "Regime de separação convencional — há controvérsia sobre a dispensa de outorga (art. 1.647, I, CC). Recomenda-se incluir outorga por cautela."
      }
    } else if (ehSeparado) {
      observacao = "Separado judicialmente — verificar se partilha já transitou em julgado."
    } else if (ehViuvo) {
      observacao = "Viúvo(a) — verificar se inventário do cônjuge foi concluído e partilha registrada."
    }

    return {
      nome: prop.nome,
      casado: ehCasado && !ehSeparado && !ehDivorciado,
      conjuge: prop.conjuge,
      regime_bens: prop.regime_bens,
      exige_outorga: exigeOutorga,
      observacao,
    }
  })
}

// --- 6. Georreferenciamento ---

function verificarGeoreferenciamento(imovel: DadosImovel): GeorefStatus {
  const area = imovel.area_ha ?? 0
  const temGeoref = imovel.georreferenciamento === true

  // Decreto 4.449/2002 + Decreto 11.902/2024
  // >= 25 ha: obrigatório desde 20/11/2023
  // Qualquer tamanho: obrigatório a partir de 20/11/2025
  let prazo: string
  if (area >= 25) {
    prazo = "20/11/2023 (Decreto 4.449/2002, art. 10, §4º)"
  } else {
    prazo = "20/11/2025 (Decreto 11.902/2024)"
  }

  return {
    exigivel: true,
    prazo_legal: prazo,
    existente: temGeoref,
    certificacao: imovel.georef_certificacao,
    situacao: temGeoref ? "regular" : "pendente",
    impacto: !temGeoref
      ? "Georreferenciamento ausente — bloqueará registro de qualquer transmissão. Necessário contratar profissional habilitado e obter certificação do INCRA."
      : null,
  }
}

// --- 7. Restrições ambientais ---

function resolverRestricoesAmbientais(atos: AtoRegistral[]): RestricaoAmbiental[] {
  const restricoes: RestricaoAmbiental[] = []

  // Atos de natureza ambiental
  for (const ato of atos) {
    if (NATUREZAS_AMBIENTAIS.includes(ato.natureza)) {
      restricoes.push({
        tipo: ato.natureza,
        descricao: ato.natureza_texto_original || ato.descricao_resumida,
        ato_origem: ato.numero,
        data: ato.data,
        area_ha: ato.area_ha,
        condicoes: ato.condicoes,
      })
    }
  }

  // Condições com conteúdo ambiental em qualquer ato
  for (const ato of atos) {
    if (NATUREZAS_AMBIENTAIS.includes(ato.natureza)) continue
    for (const cond of ato.condicoes) {
      const condLower = cond.toLowerCase()
      if (PALAVRAS_CHAVE_AMBIENTAL.some((p) => condLower.includes(p.toLowerCase()))) {
        restricoes.push({
          tipo: "condicao_ambiental_em_ato",
          descricao: cond,
          ato_origem: ato.numero,
          data: ato.data,
          area_ha: null,
          condicoes: [cond],
        })
      }
    }

    // Também verificar observações e descrição
    const textos = [ato.observacoes, ato.descricao_resumida].filter(Boolean)
    for (const texto of textos) {
      if (!texto) continue
      const textoLower = texto.toLowerCase()
      if (PALAVRAS_CHAVE_AMBIENTAL.some((p) => textoLower.includes(p.toLowerCase()))) {
        // Evitar duplicata se já foi capturado via condições
        const jaCaptured = restricoes.some(
          (r) => r.ato_origem === ato.numero && r.tipo === "condicao_ambiental_em_ato",
        )
        if (!jaCaptured) {
          restricoes.push({
            tipo: "condicao_ambiental_em_ato",
            descricao: texto,
            ato_origem: ato.numero,
            data: ato.data,
            area_ha: null,
            condicoes: [],
          })
        }
        break
      }
    }
  }

  return restricoes
}

// --- 8. Contexto UC (proteção integral) ---

const TIPOS_ABSORVIDOS_POR_UC = [
  "averbacao_reserva_legal",
  "averbacao_termo_florestal",
  "averbacao_servidao_ambiental",
  "contrato_servicos_ambientais",
]

const PALAVRAS_ABSORVIDAS_POR_UC = [
  "reserva legal", "reserva florestal",
  "preservação de florestas", "preservacao de florestas",
  "termo de responsabilidade",
  "área de preservação permanente", "area de preservacao permanente",
  "APP",
]

function classificarContextoUC(
  restricoes: RestricaoAmbiental[],
  opcoes: OpcoesUC,
): ContextoUC {
  if (!opcoes.imovelEmUC) {
    return {
      restricoes_vigentes: restricoes,
      contexto_historico: [],
      regime_uc: null,
    }
  }

  const restricoesVigentes: RestricaoAmbiental[] = []
  const contextoHistorico: Array<RestricaoAmbiental & { motivo_reclassificacao: string }> = []

  for (const restricao of restricoes) {
    const tipoAbsorvido = TIPOS_ABSORVIDOS_POR_UC.includes(restricao.tipo)
    const textoAbsorvido = PALAVRAS_ABSORVIDAS_POR_UC.some((p) =>
      restricao.descricao.toLowerCase().includes(p.toLowerCase()) ||
      restricao.condicoes.some((c) => c.toLowerCase().includes(p.toLowerCase())),
    )

    if (tipoAbsorvido || textoAbsorvido) {
      contextoHistorico.push({
        ...restricao,
        motivo_reclassificacao:
          `Restrição absorvida pelo regime da UC de proteção integral${opcoes.nomeUC ? ` (${opcoes.nomeUC})` : ""}. ` +
          "A proteção integral da UC prevalece sobre restrições individuais de RL, APP e Termos Florestais. " +
          "Art. 12, §1º da Lei 12.651/2012 dispensa RL em UC de proteção integral.",
      })
    } else {
      restricoesVigentes.push(restricao)
    }
  }

  return {
    restricoes_vigentes: restricoesVigentes,
    contexto_historico: contextoHistorico,
    regime_uc: {
      em_uc_protecao_integral: true,
      nome_uc: opcoes.nomeUC ?? null,
      categoria_uc: opcoes.categoriaUC ?? null,
      percentual_sobreposicao: opcoes.percentualSobreposicao ?? null,
      fundamentacao:
        "Lei 9.985/2000, art. 8º (categorias de proteção integral). " +
        "Lei 12.651/2012, art. 12, §1º (dispensa de RL em UC de proteção integral). " +
        "A restrição de uso é total e decorre do regime da UC, não de averbações individuais.",
      impacto_transmissao: opcoes.percentualSobreposicao != null && opcoes.percentualSobreposicao < 100
        ? `${opcoes.percentualSobreposicao}% do imóvel está inserido em UC de proteção integral${opcoes.nomeUC ? ` (${opcoes.nomeUC})` : ""} — restrição de uso na área sobreposta. ` +
          "Possível direito à desapropriação indireta ou regularização fundiária pelo órgão gestor. " +
          "Transmissão entre particulares é juridicamente possível, mas o adquirente assume as limitações do regime da UC."
        : `Imóvel inserido em UC de proteção integral${opcoes.nomeUC ? ` (${opcoes.nomeUC})` : ""} — restrição de uso total. ` +
          "Possível direito à desapropriação indireta ou regularização fundiária pelo órgão gestor. " +
          "Transmissão entre particulares é juridicamente possível, mas o adquirente assume as limitações do regime da UC.",
    },
  }
}

// --- 9. Semáforo determinístico ---

function resolverSemaforo(
  onusAtivos: OnusAtivo[],
  georef: GeorefStatus,
  imovel: DadosImovel,
  proprietarios: ProprietarioAtual[],
  outorga: OutorgaConjugal[],
  restricoes: RestricaoAmbiental[],
): {
  semaforo: "verde" | "amarelo" | "vermelho"
  justificativa: string
  recomendacoes: string[]
  documentos_faltantes: string[]
} {
  const recomendacoes: string[] = []
  const documentos_faltantes: string[] = []
  const motivos_vermelho: string[] = []
  const motivos_amarelo: string[] = []

  // VERMELHO: ônus nível 1
  const nivel1 = onusAtivos.filter((o) => o.nivel === 1)
  if (nivel1.length > 0) {
    motivos_vermelho.push(`${nivel1.length} impedimento(s) absoluto(s): ${nivel1.map((o) => o.tipo).join(", ")}`)
    for (const o of nivel1) {
      recomendacoes.push(`Resolver ${o.tipo}: ${o.impacto_transmissao}`)
    }
  }

  // VERMELHO: georef ausente em imóvel > 25 ha
  if (!georef.existente && (imovel.area_ha ?? 0) >= 25) {
    motivos_vermelho.push("Georreferenciamento ausente em imóvel acima de 25 ha — bloqueia registro")
    recomendacoes.push(georef.impacto!)
  }

  // AMARELO: copropriedade
  if (proprietarios.length > 1) {
    motivos_amarelo.push(`Copropriedade com ${proprietarios.length} proprietários`)
    recomendacoes.push(`Todos os ${proprietarios.length} proprietários devem assinar a escritura. Verificar direito de preferência dos condôminos (art. 504, CC).`)
  }

  // AMARELO: OCR baixo
  if (imovel.confianca_ocr === "baixa") {
    motivos_amarelo.push("Confiança OCR baixa — dados podem estar imprecisos")
    recomendacoes.push("Documento escaneado com baixa legibilidade. Conferir todos os dados numéricos com o original.")
  }

  // AMARELO: documentos faltantes
  if (!imovel.ccir) documentos_faltantes.push("CCIR não identificado na matrícula")
  if (!imovel.nirf) documentos_faltantes.push("NIRF não identificado na matrícula")
  if (!imovel.car) documentos_faltantes.push("CAR não identificado na matrícula")
  if (documentos_faltantes.length > 0) {
    motivos_amarelo.push("Documentação incompleta")
  }

  // Outorga conjugal — ressalva operacional, não impedimento
  // A outorga é suprível: basta incluir o cônjuge na escritura
  const precisamOutorga = outorga.filter((o) => o.exige_outorga)
  if (precisamOutorga.length > 0) {
    for (const o of precisamOutorga) {
      recomendacoes.push(`Outorga conjugal: ${o.nome} — incluir cônjuge ${o.conjuge || "(nome não identificado)"} na escritura. ${o.observacao || ""}`.trim())
    }
  }

  // AMARELO: ônus nível 2
  const nivel2 = onusAtivos.filter((o) => o.nivel === 2)
  if (nivel2.length > 0) {
    motivos_amarelo.push(`Ônus ativo(s): ${nivel2.map((o) => o.tipo).join(", ")}`)
    for (const o of nivel2) {
      recomendacoes.push(`Atenção: ${o.tipo} — ${o.impacto_transmissao}`)
    }
  }

  // AMARELO: restrições ambientais significativas
  const restricoesSig = restricoes.filter((r) =>
    ["averbacao_reserva_legal", "averbacao_termo_florestal", "averbacao_servidao_ambiental"].includes(r.tipo),
  )
  if (restricoesSig.length > 0) {
    motivos_amarelo.push("Restrições ambientais significativas registradas")
  }

  // AMARELO: georef ausente em imóvel < 25 ha (pendente até 2025)
  if (!georef.existente && (imovel.area_ha ?? 0) < 25) {
    motivos_amarelo.push("Georreferenciamento ausente — obrigatório a partir de 20/11/2025")
    recomendacoes.push("Verificar exigibilidade do georreferenciamento conforme Decreto 11.902/2024.")
  }

  // Determinar semáforo
  let semaforo: "verde" | "amarelo" | "vermelho"
  let justificativa: string

  if (motivos_vermelho.length > 0) {
    semaforo = "vermelho"
    justificativa = motivos_vermelho.join(". ") + "."
  } else if (motivos_amarelo.length > 0) {
    semaforo = "amarelo"
    justificativa = motivos_amarelo.join(". ") + "."
  } else {
    semaforo = "verde"
    justificativa = "Nenhum impedimento ou ônus ativo identificado. Imóvel em condições favoráveis para transmissão."
    recomendacoes.push("Sem ônus ou gravames ativos — situação registral favorável.")
  }

  return { semaforo, justificativa, recomendacoes, documentos_faltantes }
}

// ============================================
// PROMPT C — ANÁLISE DE TRANSMISSIBILIDADE
// Recebe só JSON, sem PDF
// ============================================

async function promptC_Transmissibilidade(
  imovel: DadosImovel,
  proprietarios: ProprietarioAtual[],
  onusAtivos: OnusAtivo[],
  onusExtintos: OnusExtinto[],
  restricoes: RestricaoAmbiental[],
  outorga: OutorgaConjugal[],
  georef: GeorefStatus,
  regimeUC: RegimeUC | null,
  contextoHistoricoAmbiental: Array<RestricaoAmbiental & { motivo_reclassificacao: string }>,
): Promise<{
  analise: AnaliseTransmissibilidade
  tokens: { input_tokens: number; output_tokens: number }
}> {
  // Bloco condicional de UC
  const blocoUC = regimeUC
    ? `
REGIME DE UC (imóvel em Unidade de Conservação de proteção integral):
${JSON.stringify(regimeUC, null, 2)}

CONTEXTO HISTÓRICO AMBIENTAL (restrições absorvidas pela UC):
${JSON.stringify(contextoHistoricoAmbiental, null, 2)}
`
    : ""

  const regrasUC = regimeUC
    ? `
REGRAS PARA IMÓVEL EM UC DE PROTEÇÃO INTEGRAL:
- NÃO trate Reserva Legal, APP ou Termos Florestais como restrições autônomas — foram absorvidas pelo regime da UC.
- Reporte essas averbações como "contexto histórico", explicando que a proteção agora decorre do regime integral da UC.
- A restrição vigente é ÚNICA: o regime da UC de proteção integral, com restrição de uso total.
- Em diligências, inclua: verificar situação fundiária junto ao órgão gestor da UC; avaliar desapropriação indireta; consultar plano de manejo.
- A transmissão entre particulares é possível, mas o adquirente assume restrição de uso total — ALERTA de nível alto.
- No resumo, use o PERCENTUAL EXATO de sobreposição informado nos dados. Se 97,7%, diga "97,7% do imóvel está inserido na UC". NUNCA diga "integralmente" se a sobreposição for inferior a 100%.
`
    : ""

  const prompt = `Você é um advogado especialista em direito imobiliário e ambiental brasileiro. Receberá dados estruturados já extraídos e processados de uma matrícula de imóvel rural. Sua tarefa é produzir uma ANÁLISE DE TRANSMISSIBILIDADE.

DADOS DO IMÓVEL:
${JSON.stringify(imovel, null, 2)}

PROPRIETÁRIOS ATUAIS:
${JSON.stringify(proprietarios, null, 2)}

ÔNUS ATIVOS:
${JSON.stringify(onusAtivos, null, 2)}

ÔNUS EXTINTOS:
${JSON.stringify(onusExtintos, null, 2)}

RESTRIÇÕES AMBIENTAIS VIGENTES:
${JSON.stringify(restricoes, null, 2)}

OUTORGA CONJUGAL:
${JSON.stringify(outorga, null, 2)}

GEORREFERENCIAMENTO:
${JSON.stringify(georef, null, 2)}

CONFIANÇA OCR: ${imovel.confianca_ocr}
${blocoUC}
## FORMATO DE RESPOSTA:

{
  "resumo": "2-3 frases sobre a situação geral do imóvel para transmissão",
  "impedimentos": [
    {
      "descricao": "string",
      "ato_origem": "string ou null",
      "fundamentacao": "artigo de lei ou norma aplicável",
      "recomendacao": "o que fazer para resolver"
    }
  ],
  "irregularidades_registrais": [
    {
      "descricao": "string",
      "recomendacao": "string"
    }
  ],
  "diligencias_recomendadas": ["string"],
  "dados_para_escritura": {
    "matricula": "número",
    "comarca": "string",
    "area_ha": 0,
    "ccir": "string ou null",
    "car": "string ou null",
    "nirf": "string ou null",
    "georeferenciamento_exigivel": true,
    "georeferenciamento_existente": true
  },
  "ressalvas": ["string"]
}

REGRAS:
- OUTORGA CONJUGAL NÃO É IMPEDIMENTO. É uma providência operacional suprível — basta incluir o cônjuge na escritura. Trate como ressalva, não como impedimento. Nunca diga que a outorga "impede" a transmissão.
- SOBREPOSIÇÃO COM UC: se o percentual de sobreposição for inferior a 100%, NÃO use a palavra "integralmente". Diga "X% do imóvel está inserido na UC" com o percentual exato. Só use "integralmente" se a sobreposição for de 100%.
- Se confianca_ocr == "baixa", SEMPRE inclua ressalva sobre conferência manual dos dados numéricos.
- Se há copropriedade, alerte sobre necessidade de consentimento de todos os condôminos e direito de preferência (art. 504, CC).
- Para imóvel rural, sempre verifique georeferenciamento.
- Sempre inclua a ressalva final: "Esta análise automatizada não substitui parecer jurídico. Recomenda-se validação por profissional habilitado."
- Fundamentação legal: cite artigos do Código Civil, Lei 6.015/73, Decreto 4.449/2002, quando aplicável.
- Seja objetivo e prático — o usuário é profissional da área.
${regrasUC}
RETORNE APENAS JSON VÁLIDO.`

  const { json, tokens } = await chamarClaudeTexto(prompt, 8192)
  console.log(`[PIPELINE] Prompt C (Transmissibilidade): ${tokens.input_tokens} input + ${tokens.output_tokens} output`)

  return {
    analise: json as unknown as AnaliseTransmissibilidade,
    tokens,
  }
}

// ============================================
// PIPELINE PRINCIPAL
// ============================================

export async function analisarMatriculaPipeline(
  pdfBuffer: Buffer,
  opcoesUC: OpcoesUC = {},
): Promise<ResultadoPipeline> {
  const tokensLog: ResultadoPipeline["tokens_consumidos"] = []
  const alertas: string[] = []

  // Detectar OCR (heurística rápida)
  const pdfHeader = pdfBuffer.toString("utf8", 0, Math.min(pdfBuffer.length, 1000))
  const temTextoEditavel = pdfHeader.includes("/Type/Font") || pdfHeader.includes("/Subtype/Type1")
  if (!temTextoEditavel || pdfBuffer.length / 1024 > 500) {
    alertas.push("Documento parece ser escaneado (imagem). A extração por OCR pode ter precisão reduzida.")
  }

  // ── PROMPT A + B em paralelo ──
  const [resultadoA, resultadoB] = await Promise.all([
    promptA_DadosImovel(pdfBuffer),
    promptB_Atos(pdfBuffer),
  ])

  tokensLog.push({ etapa: "A-DadosImovel", input: resultadoA.tokens.input_tokens, output: resultadoA.tokens.output_tokens })
  tokensLog.push({ etapa: "B-Atos", input: resultadoB.tokens.input_tokens, output: resultadoB.tokens.output_tokens })

  const atos = resultadoB.atos

  // ── CÓDIGO DETERMINÍSTICO ──

  // 1. Pareamento
  const pareamento = resolverPareamento(atos)
  alertas.push(...pareamento.alertas)

  // 2. Ônus
  const { ativos: onusAtivos, extintos: onusExtintos } = resolverOnus(atos, pareamento.cancelamentos)

  // 3. Titularidade
  const proprietarios = resolverCadeiaTitularidade(atos, pareamento.cancelamentos, resultadoA.proprietario_abertura)

  // 4. Área vigente
  const areaVigente = resolverAreaVigente(resultadoA.imovel, atos)
  alertas.push(...areaVigente.alertas)
  const imovelAtualizado: DadosImovel = {
    ...resultadoA.imovel,
    area_ha: areaVigente.area_ha,
  }

  // 5. Outorga conjugal
  const outorga = verificarOutorgaConjugal(proprietarios)

  // 6. Georreferenciamento
  const georef = verificarGeoreferenciamento(imovelAtualizado)

  // 7. Restrições ambientais
  const restricoesRaw = resolverRestricoesAmbientais(atos)

  // 8. Contexto UC (reclassificar restrições se imóvel em UC de proteção integral)
  const contextoUC = classificarContextoUC(restricoesRaw, opcoesUC)
  const restricoes = contextoUC.restricoes_vigentes

  // 9. Semáforo (determinístico — não depende do LLM)
  const semaforoResult = resolverSemaforo(
    onusAtivos, georef, imovelAtualizado, proprietarios, outorga, restricoes,
  )

  // Alerta adicional se imóvel em UC
  if (contextoUC.regime_uc) {
    semaforoResult.recomendacoes.push(contextoUC.regime_uc.impacto_transmissao)
  }

  // ── PROMPT C — Análise qualitativa (sem PDF) ──
  let analiseTransmissibilidade: AnaliseTransmissibilidade | null = null
  try {
    const resultadoC = await promptC_Transmissibilidade(
      imovelAtualizado, proprietarios, onusAtivos, onusExtintos,
      restricoes, outorga, georef,
      contextoUC.regime_uc, contextoUC.contexto_historico,
    )
    analiseTransmissibilidade = resultadoC.analise
    tokensLog.push({ etapa: "C-Transmissibilidade", input: resultadoC.tokens.input_tokens, output: resultadoC.tokens.output_tokens })
  } catch (err) {
    console.error("[PIPELINE] Prompt C falhou, continuando com análise determinística:", err)
    alertas.push("Análise qualitativa de transmissibilidade não disponível. Resultado baseado em regras determinísticas.")
  }

  // Log de totais
  const totalInput = tokensLog.reduce((s, t) => s + t.input, 0)
  const totalOutput = tokensLog.reduce((s, t) => s + t.output, 0)
  console.log(`[PIPELINE] Total: ${totalInput} input + ${totalOutput} output = ${totalInput + totalOutput} tokens (${tokensLog.length} chamadas LLM, A+B paralelas)`)

  return {
    imovel: imovelAtualizado,
    atos,
    cancelamentos: pareamento.cancelamentos,
    onus_ativos: onusAtivos,
    onus_extintos: onusExtintos,
    proprietarios_atuais: proprietarios,
    outorga_conjugal: outorga,
    georeferenciamento: georef,
    restricoes_ambientais: restricoes,
    contexto_historico_ambiental: contextoUC.contexto_historico,
    regime_uc: contextoUC.regime_uc,
    analise_transmissibilidade: analiseTransmissibilidade,
    semaforo: semaforoResult.semaforo,
    semaforo_justificativa: semaforoResult.justificativa,
    recomendacoes: semaforoResult.recomendacoes,
    documentos_faltantes: semaforoResult.documentos_faltantes,
    alertas,
    tokens_consumidos: tokensLog,
  }
}

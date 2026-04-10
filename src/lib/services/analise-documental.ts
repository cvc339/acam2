/**
 * Serviço de Análise Documental — Claude API
 *
 * Portado do ACAM1 services/analise.js
 * Mudanças: require→import, module.exports→export, caminhoArquivo→Buffer,
 * console.log→apenas erros, tipagem TypeScript
 */

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || ""
const CLAUDE_API_URL = process.env.CLAUDE_API_URL || "https://api.anthropic.com/v1/messages"
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514"

// ============================================
// TIPOS
// ============================================

export interface Proprietario {
  nome: string
  percentual: number
  cpf_cnpj: string | null
  estado_civil: string | null
  conjuge: string | null
  regime_bens: string | null
}

export interface OnusGravame {
  tipo: string
  numero_averbacao: string
  descricao: string
  valor: string | null
  credor: string | null
  data: string | null
  impacto_compra_venda: string
}

export interface DadosMatricula {
  matricula: string | null
  cartorio: string | null
  data_emissao: string | null
  dias_desde_emissao: number | null
  proprietarios: Proprietario[]
  onus_gravames: OnusGravame[]
  area_hectares: number | null
  ccir: string | null
  codigo_imovel_incra: string | null
  nirf: string | null
  municipio: string | null
  estado: string | null
  alertas: string[]
}

export interface DadosCCIR {
  codigo_imovel_rural: string | null
  numero_ccir: string | null
  numero_matricula: string | null
  area_hectares: number | null
  nome_declarante: string | null
  municipio: string | null
  data_emissao: string | null
  ano_exercicio: number | null
}

export interface DadosITR {
  cib: string | null
  codigo_imovel_incra: string | null
  area_hectares: number | null
  nome_contribuinte: string | null
  nome_imovel: string | null
  municipio: string | null
  ano_exercicio: string | null
}

export interface DadosCND {
  tipo: "negativa" | "positiva_com_efeito" | "positiva" | string
  cib: string | null
  data_emissao: string | null
  data_validade: string | null
  area_hectares: number | null
  nome_contribuinte: string | null
  nome_imovel: string | null
  municipio: string | null
  estado: string | null
}

export interface ResultadoAnalise<T> {
  sucesso: boolean
  dados?: T
  erro?: string
  tokens?: { input_tokens: number; output_tokens: number }
}

// ============================================
// HELPER: chamar Claude API com PDF
// ============================================

async function chamarClaudeComPDF(
  pdfBuffer: Buffer,
  prompt: string,
  maxTokens = 4096,
): Promise<{ json: Record<string, unknown>; tokens: { input_tokens: number; output_tokens: number } }> {
  const base64 = pdfBuffer.toString("base64")

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
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

  if (!response.ok) {
    const errorData = await response.json() as { error?: { type?: string; message?: string } }
    const errorType = errorData.error?.type
    const errorMessage = errorData.error?.message

    if (errorType === "insufficient_quota" || errorMessage?.includes("credit balance")) {
      throw new Error(`Saldo insuficiente na API Claude: ${errorMessage}`)
    } else if (errorType === "rate_limit_error" || response.status === 429) {
      throw new Error(`Limite de taxa excedido. Aguarde e tente novamente.`)
    } else {
      throw new Error(`Erro na API Claude: ${errorMessage || response.statusText}`)
    }
  }

  const data = await response.json() as {
    content: { text: string }[]
    usage: { input_tokens: number; output_tokens: number }
  }

  const resposta = data.content[0].text
  const jsonMatch = resposta.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("Claude não retornou JSON válido")
  }

  return {
    json: JSON.parse(jsonMatch[0]),
    tokens: data.usage,
  }
}

// ============================================
// ANALISAR MATRÍCULA
// ============================================

export async function analisarMatricula(pdfBuffer: Buffer): Promise<ResultadoAnalise<DadosMatricula>> {
  try {
    const hoje = new Date().toISOString().split("T")[0]

    const prompt = `Você é um especialista em análise de matrículas de imóveis rurais. Analise esta matrícula e retorne APENAS JSON.

🚨🚨🚨 REGRAS ABSOLUTAS - LEIA COM ATENÇÃO 🚨🚨🚨

1. EXTRAIA APENAS O QUE ESTÁ EXPLICITAMENTE ESCRITO NO DOCUMENTO
2. NUNCA INVENTE, PRESUMA, DEDUZA OU ADICIONE INFORMAÇÕES
3. SE NÃO ENCONTRAR ALGO, USE null OU ARRAY VAZIO []
4. NÃO USE EXEMPLOS OU INFORMAÇÕES DE OUTROS DOCUMENTOS
5. CADA INFORMAÇÃO DEVE TER CORRESPONDÊNCIA EXATA NO TEXTO DA MATRÍCULA

⚠️ ÔNUS E GRAVAMES - ATENÇÃO MÁXIMA:
- SÓ inclua se houver TEXTO EXPLÍCITO na matrícula
- SÓ inclua se houver NÚMERO DE AVERBAÇÃO/REGISTRO visível no documento
- Se NÃO HOUVER NENHUM ônus → use array vazio: []
- NÃO INVENTE averbações como "Av-2", "Av-5", "Av-12", etc.
- NÃO PRESUMA que existe ônus se não estiver escrito
- Se a matrícula diz "nada consta" ou não menciona ônus → []

## DADOS ESSENCIAIS A EXTRAIR:

### 1. IDENTIFICAÇÃO BÁSICA
- matricula: número base (ex: "12669" se for R-1-12669)
- cartorio: nome completo EXATO conforme documento
- data_emissao: data DESTA certidão no formato YYYY-MM-DD
- dias_desde_emissao: calcular dias desde emissão até hoje (${hoje})

### 2. PROPRIETÁRIO(S) ATUAIS - CRÍTICO!

🚨 ATENÇÃO: MÚLTIPLOS PROPRIETÁRIOS!
IMPORTANTE: Leia TODOS os registros R-1, R-2, R-3, etc. O ÚLTIMO registro válido define o proprietário ATUAL.
⚠️ SE HOUVER 2 OU MAIS PROPRIETÁRIOS, INCLUIR TODOS!
⚠️ Percentuais DEVEM somar 100%

Para CADA proprietário atual, extrair EXATAMENTE como está escrito:
- nome: NOME COMPLETO EM MAIÚSCULAS (conforme documento)
- percentual: % de propriedade (DEVE somar 100%)
- cpf_cnpj: somente se EXPLICITAMENTE constar
- estado_civil: somente se EXPLICITAMENTE constar
- conjuge: somente se EXPLICITAMENTE constar
- regime_bens: somente se EXPLICITAMENTE constar

### 3. ÔNUS E GRAVAMES - LEIA COM MÁXIMA ATENÇÃO!

A) ANTES DE INCLUIR QUALQUER ÔNUS, PERGUNTE-SE:
   ✓ Está escrito EXPLICITAMENTE na matrícula?
   ✓ Tem número de averbação/registro VISÍVEL no documento?
   ✓ NÃO foi cancelado posteriormente?

B) SE ENCONTRAR ALGUM ÔNUS REAL, extrair:
   - tipo: nome EXATO conforme documento
   - numero_averbacao: número EXATO que está no documento
   - descricao: COPIE o texto exato do documento
   - valor: somente se constar valor monetário
   - credor: somente se constar nome do credor
   - data: somente se constar data
   - impacto_compra_venda: frase adequada ao tipo

C) SE A MATRÍCULA ESTIVER LIMPA: "onus_gravames": []

### 4. DADOS DO IMÓVEL
- area_hectares: SEMPRE em hectares (converter se necessário)
- municipio: nome EXATO do município conforme documento
- estado: sigla EXATA conforme documento

### 5. CÓDIGOS DO IMÓVEL - 3 CÓDIGOS DIFERENTES!
- ccir: CCIR (11 dígitos ou XX.XXX-X). NÃO confunda com CNS!
- codigo_imovel_incra: Código INCRA (XXX.XXX.XXX.XXX-X)
- nirf: NIRF/CIB (X.XXX.XXX-X)

### 6. ALERTAS
Adicionar alerta SOMENTE se: matrícula >30 dias, ônus críticos encontrados, dados importantes não localizados.

## FORMATO DE RESPOSTA (APENAS JSON):

{
  "matricula": "número" ou null,
  "cartorio": "nome completo" ou null,
  "data_emissao": "YYYY-MM-DD" ou null,
  "dias_desde_emissao": número ou null,
  "proprietarios": [{"nome":"","percentual":0,"cpf_cnpj":null,"estado_civil":null,"conjuge":null,"regime_bens":null}],
  "onus_gravames": [],
  "area_hectares": número ou null,
  "ccir": "XX.XXX-X" ou null,
  "codigo_imovel_incra": "XXX.XXX.XXX.XXX-X" ou null,
  "nirf": "X.XXX.XXX-X" ou null,
  "municipio": "município" ou null,
  "estado": "UF" ou null,
  "alertas": []
}

RETORNE APENAS JSON VÁLIDO, SEM TEXTO ANTES OU DEPOIS.`

    const { json, tokens } = await chamarClaudeComPDF(pdfBuffer, prompt, 4096)
    const dados = json as unknown as DadosMatricula

    // Recalcular dias_desde_emissao com precisão
    if (dados.data_emissao) {
      const dataEmissao = new Date(dados.data_emissao)
      const hojeDate = new Date()
      const diffTime = Math.abs(hojeDate.getTime() - dataEmissao.getTime())
      dados.dias_desde_emissao = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    return { sucesso: true, dados, tokens }
  } catch (error) {
    console.error("Erro ao analisar matrícula:", error)
    throw error
  }
}

// ============================================
// ANALISAR CCIR
// ============================================

export async function analisarCCIR(pdfBuffer: Buffer): Promise<DadosCCIR | null> {
  try {
    const prompt = `Você é um especialista em análise de documentos CCIR (Certificado de Cadastro de Imóvel Rural).

🚨 ATENÇÃO: Este PDF pode estar ESCANEADO. Use toda sua capacidade de OCR.

### CÓDIGOS (3 NÚMEROS DIFERENTES!)

A) CÓDIGO DO IMÓVEL RURAL (Código INCRA): XXX.XXX.XXX.XXX-X → codigo_imovel_rural
B) NÚMERO DO CCIR (Certificado): 11-13 dígitos só números → numero_ccir
C) NÚMERO DA MATRÍCULA → numero_matricula

⚠️ NÃO CONFUNDA: Código INCRA ≠ Número CCIR!

### OUTROS CAMPOS
- area_hectares: em hectares (converter de m² se necessário)
- nome_declarante: MAIÚSCULAS
- municipio: MAIÚSCULAS
- data_emissao: YYYY-MM-DD
- ano_exercicio: número de 4 dígitos

{
  "codigo_imovel_rural": "XXX.XXX.XXX.XXX-X" ou null,
  "numero_ccir": "12345678901" ou null,
  "numero_matricula": "número" ou null,
  "area_hectares": número ou null,
  "nome_declarante": "NOME" ou null,
  "municipio": "NOME" ou null,
  "data_emissao": "YYYY-MM-DD" ou null,
  "ano_exercicio": número ou null
}

RETORNE APENAS JSON VÁLIDO.`

    const { json } = await chamarClaudeComPDF(pdfBuffer, prompt, 2000)
    return json as unknown as DadosCCIR
  } catch (error) {
    console.error("Erro ao analisar CCIR:", error)
    return null
  }
}

// ============================================
// ANALISAR ITR
// ============================================

export async function analisarITR(pdfBuffer: Buffer): Promise<DadosITR | null> {
  try {
    const prompt = `Você é um especialista em análise de documentos ITR (Imposto Territorial Rural).

🚨 ATENÇÃO: Este PDF pode estar ESCANEADO. Use toda sua capacidade de OCR.

### 1. CIB (CRÍTICO - NO CABEÇALHO!)
CIB/NIRF: X.XXX.XXX-X → cib

### 2. CÓDIGO DO IMÓVEL INCRA (DIFERENTE DO CIB!)
Formato: XXX.XXX.XXX.XXX-X → codigo_imovel_incra

⚠️ CIB (X.XXX.XXX-X) ≠ Código INCRA (XXX.XXX.XXX.XXX-X)!

### OUTROS CAMPOS
- area_hectares, nome_contribuinte, nome_imovel, municipio, ano_exercicio

{
  "cib": "X.XXX.XXX-X" ou null,
  "codigo_imovel_incra": "XXX.XXX.XXX.XXX-X" ou null,
  "area_hectares": número ou null,
  "nome_contribuinte": "NOME" ou null,
  "nome_imovel": "NOME" ou null,
  "municipio": "NOME" ou null,
  "ano_exercicio": "YYYY" ou null
}

RETORNE APENAS JSON VÁLIDO.`

    const { json } = await chamarClaudeComPDF(pdfBuffer, prompt, 2000)
    return json as unknown as DadosITR
  } catch (error) {
    console.error("Erro ao analisar ITR:", error)
    return null
  }
}

// ============================================
// ANALISAR CND
// ============================================

export async function analisarCND(pdfBuffer: Buffer): Promise<DadosCND | null> {
  try {
    const prompt = `Você é um especialista em análise de Certidões Negativas de Débitos (CND) de imóveis rurais.

### 1. TIPO DE CERTIDÃO (CRÍTICO!)
Leia o TÍTULO:
- "CERTIDÃO NEGATIVA DE DÉBITOS..." → "tipo": "negativa"
- "CERTIDÃO POSITIVA COM EFEITO DE NEGATIVA..." → "tipo": "positiva_com_efeito"

### 2. CIB/NIRF: X.XXX.XXX-X → cib
### 3. DATAS: data_emissao e data_validade no formato YYYY-MM-DD
### 4. ÁREA: area_hectares (número decimal)
### 5. OUTROS: nome_contribuinte, nome_imovel, municipio, estado

{
  "tipo": "negativa" ou "positiva_com_efeito",
  "cib": "X.XXX.XXX-X" ou null,
  "data_emissao": "YYYY-MM-DD" ou null,
  "data_validade": "YYYY-MM-DD" ou null,
  "area_hectares": número ou null,
  "nome_contribuinte": "nome" ou null,
  "nome_imovel": "nome" ou null,
  "municipio": "município" ou null,
  "estado": "UF" ou null
}

RETORNE APENAS JSON VÁLIDO.`

    const { json } = await chamarClaudeComPDF(pdfBuffer, prompt, 2000)
    return json as unknown as DadosCND
  } catch (error) {
    console.error("Erro ao analisar CND:", error)
    return null
  }
}

// ============================================
// ANALISAR DOCUMENTO GENÉRICO
// ============================================

export async function analisarDocumento(
  pdfBuffer: Buffer,
  tipoDocumento: "ccir" | "itr" | "cnd",
): Promise<ResultadoAnalise<Record<string, unknown>>> {
  try {
    const prompts: Record<string, string> = {
      ccir: `Analise este CCIR e extraia: codigo_imovel, numero_matricula, proprietario, cpf_cnpj, area_hectares, municipio, situacao, data_emissao, ano_exercicio. Retorne APENAS JSON.`,
      itr: `Analise este ITR e extraia: ano_exercicio, nirf, proprietario, cpf_cnpj, area_hectares, vtr, valor_itr, situacao, municipio. Retorne APENAS JSON.`,
      cnd: `Analise esta CND e extraia: tipo, cpf_cnpj, status, codigo_controle, data_emissao, data_validade, debitos_encontrados. Retorne APENAS JSON.`,
    }

    const prompt = prompts[tipoDocumento] || "Analise este documento e extraia todas as informações em JSON."
    const { json, tokens } = await chamarClaudeComPDF(pdfBuffer, prompt, 2048)

    return { sucesso: true, dados: json, tokens }
  } catch (error) {
    return { sucesso: false, erro: (error as Error).message }
  }
}

// ============================================
// CRUZAR DADOS ENTRE DOCUMENTOS
// ============================================

export interface ResultadoCruzamento {
  divergencias: Array<{
    tipo: string
    campo: string
    valores?: Record<string, number | null>
    matricula?: string
    ccir?: string
    variacao_percentual?: string
    severidade: "alta" | "media" | "baixa"
  }>
  alertas: Array<{
    tipo: string
    mensagem: string
    detalhes?: OnusGravame[]
    severidade: "alta" | "media" | "baixa"
    impede_doacao?: boolean
  }>
  areas_comparadas: Record<string, number | null>
}

export function cruzarDados(
  dadosMatricula: ResultadoAnalise<DadosMatricula>,
  dadosDocumentos: { ccir?: ResultadoAnalise<Record<string, unknown>>; itr?: ResultadoAnalise<Record<string, unknown>> },
): ResultadoCruzamento {
  const divergencias: ResultadoCruzamento["divergencias"] = []
  const alertas: ResultadoCruzamento["alertas"] = []

  const areas: Record<string, number | null> = {
    matricula: dadosMatricula.dados?.area_hectares ?? null,
  }

  if (dadosDocumentos.ccir?.dados?.area_total_ha) {
    areas.ccir = dadosDocumentos.ccir.dados.area_total_ha as number
  }
  if (dadosDocumentos.itr?.dados?.area_total_ha) {
    areas.itr = dadosDocumentos.itr.dados.area_total_ha as number
  }

  // Divergência de área
  const areasValores = Object.values(areas).filter((a): a is number => a != null)
  if (areasValores.length > 1) {
    const areaMedia = areasValores.reduce((a, b) => a + b, 0) / areasValores.length
    const variacaoMaxima = Math.max(...areasValores.map((a) => Math.abs(a - areaMedia)))
    const percentualVariacao = (variacaoMaxima / areaMedia) * 100

    if (percentualVariacao > 5) {
      divergencias.push({
        tipo: "area",
        campo: "Área",
        valores: areas,
        variacao_percentual: percentualVariacao.toFixed(2),
        severidade: percentualVariacao > 10 ? "alta" : "media",
      })
    }
  }

  // Ônus impeditivos
  const onus = dadosMatricula.dados?.onus_gravames || []
  if (onus.length > 0) {
    const onusAtivos = onus.filter(
      (o) =>
        o.tipo?.toLowerCase().includes("hipoteca") ||
        o.tipo?.toLowerCase().includes("penhora"),
    )
    if (onusAtivos.length > 0) {
      alertas.push({
        tipo: "onus",
        mensagem: `Imóvel possui ${onusAtivos.length} ônus/gravame(s) registrado(s)`,
        detalhes: onusAtivos,
        severidade: "alta",
        impede_doacao: true,
      })
    }
  }

  return { divergencias, alertas, areas_comparadas: areas }
}

// ============================================
// VALIDAR E CRUZAR DOCUMENTOS (COMPLETO)
// ============================================

export interface ResultadoValidacao {
  pendencias: string[]
  divergencias: string[]
  pontos_positivos: string[]
}

export function validarECruzarDocumentos(
  matricula: DadosMatricula | null,
  ccir: DadosCCIR | null,
  itr: DadosITR | null,
  cnd: DadosCND | null,
): ResultadoValidacao {
  const pendencias: string[] = []
  const divergencias: string[] = []
  const pontosPositivos: string[] = []
  const dataAtual = new Date()

  // Matrícula
  if (matricula?.dias_desde_emissao && matricula.dias_desde_emissao > 30) {
    pendencias.push(`Matrícula emitida há ${matricula.dias_desde_emissao} dias. Recomenda-se atualização.`)
  }

  if (matricula?.onus_gravames && matricula.onus_gravames.length > 0) {
    for (const onus of matricula.onus_gravames) {
      if (onus.tipo?.toLowerCase().includes("hipoteca")) {
        pendencias.push(`HIPOTECA: ${onus.impacto_compra_venda || "Impede venda"}`)
      } else if (onus.tipo?.toLowerCase().includes("penhora")) {
        pendencias.push(`PENHORA: ${onus.impacto_compra_venda || "Impede venda"}`)
      }
    }
  } else {
    pontosPositivos.push("Sem ônus registrados")
  }

  // CCIR
  if (ccir) {
    if (matricula?.ccir && ccir.codigo_imovel_rural !== matricula.ccir) {
      pendencias.push(`CCIR INVÁLIDO: ${ccir.codigo_imovel_rural} ≠ ${matricula.ccir}`)
    } else {
      pontosPositivos.push("CCIR válido")
    }
    if (ccir.area_hectares && matricula?.area_hectares) {
      const div = Math.abs((ccir.area_hectares - matricula.area_hectares) / matricula.area_hectares * 100)
      if (div > 3) {
        pendencias.push(`Divergência área CCIR: ${div.toFixed(2)}%`)
      }
    }
  }

  // ITR
  if (itr) {
    if (matricula?.nirf && itr.cib !== matricula.nirf) {
      pendencias.push(`ITR INVÁLIDO: CIB ${itr.cib} ≠ NIRF ${matricula.nirf}`)
    } else {
      pontosPositivos.push("ITR válido")
    }
  }

  // CND
  if (cnd) {
    if (matricula?.nirf && cnd.cib !== matricula.nirf) {
      pendencias.push(`CND INVÁLIDA: CIB ${cnd.cib} ≠ NIRF ${matricula.nirf}`)
    }
    if (cnd.data_validade) {
      const dataVal = new Date(cnd.data_validade)
      if (dataVal < dataAtual) {
        pendencias.push("CND VENCIDA")
      } else {
        pontosPositivos.push("CND válida")
      }
    }
  } else {
    pendencias.push("CND não apresentada")
  }

  return { pendencias, divergencias, pontos_positivos: pontosPositivos }
}

// ============================================
// GERAR STATUS FINAL
// ============================================

export interface StatusFinal {
  status: "1" | "2" | "3"
  justificativa: string
  impedimentos: string[]
  pendencias: string[]
  pontos_positivos: string[]
  prazo_estimado: string | null
}

export function gerarStatusFinal(
  cruzamento: ResultadoCruzamento,
  ideSisema: { sucesso: boolean; ucs_encontradas?: Array<{ protecao_integral?: boolean; percentual_sobreposicao?: number }> },
  dadosDocumentos: { ccir?: { sucesso: boolean }; itr?: { sucesso: boolean }; cnd?: { sucesso: boolean } },
): StatusFinal {
  const impedimentos: string[] = []
  const pendencias: string[] = []
  const pontos_positivos: string[] = []

  // UC
  if (!ideSisema.sucesso || !ideSisema.ucs_encontradas || ideSisema.ucs_encontradas.length === 0) {
    impedimentos.push("Imóvel não está dentro de Unidade de Conservação")
  } else {
    const uc = ideSisema.ucs_encontradas[0]
    if (!uc.protecao_integral) {
      impedimentos.push("UC não é de Proteção Integral")
    } else if ((uc.percentual_sobreposicao ?? 0) < 100) {
      pendencias.push(`Apenas ${uc.percentual_sobreposicao}% do imóvel está dentro da UC`)
    } else {
      pontos_positivos.push("100% do imóvel dentro de UC de Proteção Integral")
    }
  }

  // Ônus
  const onusImpeditivos = cruzamento.alertas.filter((a) => a.impede_doacao)
  if (onusImpeditivos.length > 0) {
    impedimentos.push("Imóvel possui ônus/gravames impeditivos")
  }

  // Documentação
  const docsObrigatorios = ["ccir", "itr", "cnd"] as const
  const docsFaltantes = docsObrigatorios.filter((doc) => !dadosDocumentos[doc]?.sucesso)
  if (docsFaltantes.length > 0) {
    pendencias.push(`Documentos ausentes: ${docsFaltantes.join(", ").toUpperCase()}`)
  } else {
    pontos_positivos.push("Documentação completa apresentada")
  }

  // Divergências críticas
  const divergenciasCriticas = cruzamento.divergencias.filter((d) => d.severidade === "alta")
  if (divergenciasCriticas.length > 0) {
    pendencias.push(`${divergenciasCriticas.length} divergência(s) crítica(s) encontrada(s)`)
  }

  // Status
  let status: StatusFinal["status"]
  let justificativa: string
  let prazo_estimado: string | null = null

  if (impedimentos.length > 0) {
    status = "1"
    justificativa = "Imóvel NÃO ATENDE aos requisitos mínimos para compensação ambiental."
  } else if (pendencias.length > 0) {
    status = "2"
    justificativa = "Imóvel ATENDE COM AJUSTES. Necessário regularizar pendências identificadas."
    prazo_estimado = "30-90 dias"
  } else {
    status = "3"
    justificativa = "Imóvel ADEQUADO para prosseguir à fase de negociação comercial."
  }

  return { status, justificativa, impedimentos, pendencias, pontos_positivos, prazo_estimado }
}

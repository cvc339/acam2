/**
 * Pipeline de Análise de Matrícula — 5 etapas especializadas
 *
 * Substitui o prompt único de analise-documental.ts por um pipeline
 * onde cada etapa faz UMA coisa e faz bem.
 *
 * Etapa 1: Parsing — extrair lista ordenada de atos (R-x, AV-x)
 * Etapa 2: Pareamento — cruzar cancelamentos com atos originários
 * Etapa 3: Classificação — 4 níveis de impacto na transmissão
 * Etapa 4: Titularidade — cadeia de transmissões → proprietário atual
 * Etapa 5: Relatório — semáforo + ônus ativos + recomendações
 */

// ============================================
// TIPOS
// ============================================

export interface AtoRegistral {
  numero: string           // Ex: "R-1-M-27897", "AV-12-M-27897"
  tipo_ato: "registro" | "averbacao"
  data: string | null      // YYYY-MM-DD
  natureza: string         // Ex: "compra_e_venda", "usufruto", "cancelamento", "inclusao_conjuge", etc.
  descricao_resumida: string
  partes: {
    transmitentes: string[]
    adquirentes: Array<{ nome: string; percentual: number | null; cpf: string | null }> | string[]
  }
  valor: number | null
  area_ha: number | null
  referencia_ato_anterior: string | null  // Ex: "R-5" se for cancelamento do R-5
  condicoes: string | null
}

export interface ParAtoCancelamento {
  ato_criacao: string      // Ex: "R-5"
  ato_extinção: string     // Ex: "AV-12"
  tipo_onus: string        // Ex: "usufruto_vitalicio"
  motivo_extincao: string  // Ex: "falecimento do usufrutuário"
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

export interface ProprietarioAtual {
  nome: string
  cpf: string | null
  estado_civil: string | null
  conjuge: string | null
  regime_bens: string | null
  percentual: number | null
  fracao: string | null    // Ex: "31,6730/45,2680"
  ato_aquisitivo: string   // Ex: "R-14"
}

export interface DadosImovel {
  matricula: string | null
  cartorio: string | null
  municipio: string | null
  comarca: string | null
  area_ha: number | null
  denominacao: string | null
  ccir: string | null
  nirf: string | null
  codigo_incra: string | null
  car: string | null
  georreferenciamento: boolean | null
}

export interface ResultadoPipeline {
  imovel: DadosImovel
  atos: AtoRegistral[]
  cancelamentos: ParAtoCancelamento[]
  onus_ativos: OnusAtivo[]
  proprietarios_atuais: ProprietarioAtual[]
  semaforo: "verde" | "amarelo" | "vermelho"
  semaforo_justificativa: string
  recomendacoes: string[]
  documentos_faltantes: string[]
  alertas: string[]
  tokens_consumidos: { etapa: string; input: number; output: number }[]
}

// ============================================
// CONFIG
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
// ETAPA 1: PARSING
// ============================================

async function etapa1Parsing(pdfBuffer: Buffer): Promise<{
  imovel: DadosImovel
  atos: AtoRegistral[]
  tokens: { input_tokens: number; output_tokens: number }
}> {
  const prompt = `Você é um especialista em registro de imóveis. Analise esta matrícula e extraia TODOS os atos registrados, em ordem cronológica.

## TAREFA: LISTAR TODOS OS ATOS

Para cada ato (R-1, R-2, AV-3, AV-4, R-5, etc.), extraia:

- numero: identificador exato (ex: "R-1-M-27897", "AV-12-M-27897")
- tipo_ato: "registro" ou "averbacao"
- data: data do ato no formato YYYY-MM-DD (ou null)
- natureza: uma das seguintes:
  "compra_e_venda", "doacao", "heranca_cessao", "divisao_amigavel", "formal_partilha",
  "usufruto", "hipoteca", "alienacao_fiduciaria", "penhora", "penhor_rural",
  "cancelamento", "inclusao_conjuge", "alteracao_estado_civil", "retificacao_area",
  "car", "georreferenciamento", "desmembramento", "pacto_antenupcial",
  "inclusao_qualificacao", "reserva_legal", "servidao", "outro"
- descricao_resumida: resumo em 1 frase
- partes.transmitentes: nomes em MAIÚSCULAS de quem transmite/vende/doa
- partes.adquirentes: para cada adquirente, extraia um OBJETO com:
  * nome: MAIÚSCULAS
  * percentual: número (se "adquiri 80%" → 80; se "totalidade" → 100; se "partes iguais" entre N → 100/N)
  * cpf: se explícito no ato
  EXEMPLO: se o texto diz "MARIA adquiri 80%" e "JOÃO adquiri 20%":
  adquirentes: [{"nome": "MARIA", "percentual": 80, "cpf": null}, {"nome": "JOAO", "percentual": 20, "cpf": null}]
- valor: valor em reais (número) ou null
- area_ha: área em hectares mencionada no ato (número) ou null
- referencia_ato_anterior: se o ato CANCELA ou MODIFICA outro, informar qual (ex: "R-5")
- condicoes: restrições ou condições mencionadas

## DADOS DO IMÓVEL (extrair da abertura da matrícula):

- matricula, cartorio, municipio, comarca
- area_ha (em hectares — converter de ares/centiares/alqueires se necessário)
- denominacao (nome da fazenda/sítio)
- ccir, nirf, codigo_incra, car
- georreferenciamento (true/false/null)

## FORMATO DE RESPOSTA:

{
  "imovel": { ... },
  "atos": [ { ... }, { ... }, ... ]
}

IMPORTANTE:
- Extraia TODOS os atos, sem exceção
- Mantenha a ORDEM cronológica
- NÃO invente atos que não existem
- Se um campo não for legível, use null
- Para cancelamentos, SEMPRE preencha referencia_ato_anterior

RETORNE APENAS JSON VÁLIDO.`

  const { json, tokens } = await chamarClaude(pdfBuffer, prompt, 8192)
  console.log(`[PIPELINE] Etapa 1 (Parsing): ${tokens.input_tokens} input + ${tokens.output_tokens} output`)

  return {
    imovel: json.imovel as unknown as DadosImovel,
    atos: json.atos as unknown as AtoRegistral[],
    tokens,
  }
}

// ============================================
// ETAPA 2: PAREAMENTO
// ============================================

async function etapa2Pareamento(pdfBuffer: Buffer, atos: AtoRegistral[]): Promise<{
  cancelamentos: ParAtoCancelamento[]
  tokens: { input_tokens: number; output_tokens: number }
}> {
  const prompt = `Você é um especialista em registro de imóveis. Recebi a seguinte lista de atos de uma matrícula.
Sua tarefa é identificar quais atos foram CANCELADOS, BAIXADOS ou EXTINTOS por atos posteriores.

## ATOS REGISTRADOS:
${JSON.stringify(atos, null, 2)}

## TAREFA: PAREAMENTO DE CANCELAMENTOS

Para cada ato que CANCELA, BAIXA ou EXTINGUE outro, identifique:

- ato_criacao: número do ato que criou o ônus/situação (ex: "R-5")
- ato_extincao: número do ato que cancelou/extinguiu (ex: "AV-12")
- tipo_onus: tipo do ônus original (ex: "usufruto_vitalicio", "hipoteca", "penhora")
- motivo_extincao: motivo (ex: "falecimento do usufrutuário", "quitação", "cancelamento judicial")
- status: sempre "cancelado"

## REGRAS:
- Um cancelamento pode referir-se a um ato pelo número (ex: "fica cancelada a hipoteca do R-5")
- Pode referir-se de forma indireta (ex: "cancelamento do ônus constante do registro nº 5")
- Pode ser por evento (ex: falecimento do usufrutuário extingue o usufruto)
- Se uma AV menciona "cancelado", "baixado", "extinto", "quitado" → é cancelamento
- Se NÃO há cancelamentos, retorne array vazio

## FORMATO:
{
  "cancelamentos": [ { ... } ]
}

RETORNE APENAS JSON VÁLIDO.`

  const { json, tokens } = await chamarClaude(pdfBuffer, prompt, 2048)
  console.log(`[PIPELINE] Etapa 2 (Pareamento): ${tokens.input_tokens} input + ${tokens.output_tokens} output`)

  return {
    cancelamentos: json.cancelamentos as unknown as ParAtoCancelamento[],
    tokens,
  }
}

// ============================================
// ETAPA 3: CLASSIFICAÇÃO
// ============================================

function etapa3Classificacao(atos: AtoRegistral[], cancelamentos: ParAtoCancelamento[]): OnusAtivo[] {
  // Atos cancelados (já extintos)
  const atosCancelados = new Set(cancelamentos.map((c) => c.ato_criacao))

  const NIVEL_1 = ["hipoteca", "alienacao_fiduciaria", "penhora", "penhor_rural", "usufruto", "servidao"]
  const NIVEL_2_NATUREZAS = ["reserva_legal", "car", "servidao"]

  const onusAtivos: OnusAtivo[] = []

  for (const ato of atos) {
    // Pular atos cancelados
    if (atosCancelados.has(ato.numero)) continue

    // Classificar por natureza
    const nat = ato.natureza.toLowerCase()

    if (nat === "penhora" || nat === "penhor_rural") {
      onusAtivos.push({
        ato: ato.numero,
        tipo: nat,
        nivel: 1,
        nivel_descricao: "Impedimento absoluto",
        descricao: ato.descricao_resumida,
        credor: null,
        valor: ato.valor,
        data: ato.data,
        impacto_transmissao: "Impede a transmissão enquanto persistir. Requer quitação ou levantamento judicial.",
      })
    } else if (nat === "hipoteca" || nat === "alienacao_fiduciaria") {
      onusAtivos.push({
        ato: ato.numero,
        tipo: nat,
        nivel: 1,
        nivel_descricao: "Impedimento absoluto",
        descricao: ato.descricao_resumida,
        credor: null,
        valor: ato.valor,
        data: ato.data,
        impacto_transmissao: "Impede a transmissão sem anuência do credor ou quitação.",
      })
    } else if (nat === "usufruto") {
      onusAtivos.push({
        ato: ato.numero,
        tipo: "usufruto",
        nivel: 2,
        nivel_descricao: "Ônus real que sobrevive à transmissão",
        descricao: ato.descricao_resumida,
        credor: null,
        valor: null,
        data: ato.data,
        impacto_transmissao: "Não impede a transmissão, mas o direito de uso permanece com o usufrutuário.",
      })
    } else if (nat === "servidao") {
      onusAtivos.push({
        ato: ato.numero,
        tipo: "servidao",
        nivel: 2,
        nivel_descricao: "Ônus real que sobrevive à transmissão",
        descricao: ato.descricao_resumida,
        credor: null,
        valor: null,
        data: ato.data,
        impacto_transmissao: "Restrição permanente de uso. Acompanha o imóvel independente do proprietário.",
      })
    }
  }

  return onusAtivos
}

// ============================================
// ETAPA 4: TITULARIDADE
// ============================================

async function etapa4Titularidade(pdfBuffer: Buffer, atos: AtoRegistral[]): Promise<{
  proprietarios: ProprietarioAtual[]
  tokens: { input_tokens: number; output_tokens: number }
}> {
  const prompt = `Você é um especialista em registro de imóveis. Com base nos atos abaixo e relendo o documento original, identifique o(s) PROPRIETÁRIO(S) ATUAL(IS) do imóvel.

## ATOS REGISTRADOS (com adquirentes e percentuais já extraídos):
${JSON.stringify(atos, null, 2)}

## TAREFA: IDENTIFICAR O PROPRIETÁRIO ATUAL

A cadeia de titularidade se reconstrói assim:
1. Identifique TODOS os registros de transmissão (compra_e_venda, doacao, heranca_cessao, divisao_amigavel, formal_partilha)
2. O ÚLTIMO registro de transmissão define o proprietário atual
3. Os ADQUIRENTES do último registro são os proprietários — NÃO os transmitentes
4. Os percentuais já foram extraídos nos atos acima — USE-OS. Não recalcule.

Para CADA proprietário atual, extraia:
- nome: EXATAMENTE como no ato de aquisição, em MAIÚSCULAS
- cpf: do ato ou do documento original
- estado_civil: considerar averbações de casamento/divórcio
- conjuge: considerar inclusões de cônjuge por averbação
- regime_bens: regime de bens do casamento
- percentual: USE O PERCENTUAL JÁ EXTRAÍDO NO ATO. Se o ato diz percentual 80, use 80.
- fracao: fração de propriedade se informada
- ato_aquisitivo: número do registro em que adquiriu

## FORMATO:
{
  "proprietarios": [ { ... } ]
}

🚨 REGRAS ABSOLUTAS:
- TRANSMITENTE ≠ PROPRIETÁRIO. NUNCA liste o transmitente como proprietário.
- ADQUIRENTE/COMPRADOR/OUTORGADO COMPRADOR = PROPRIETÁRIO
- O texto "adquiri X% deste imóvel" indica o PERCENTUAL do adquirente. Extraia esse número.
- Se houve múltiplas transmissões, o proprietário é quem adquiriu na ÚLTIMA
- Se parte do imóvel foi vendida e parte não, listar ambos os proprietários

## EXEMPLO DE EXTRAÇÃO CORRETA:

Texto do registro: "OUTORGADO COMPRADOR: MARIA SILVA, brasileira, adquiri 80% do presente imóvel; JOÃO SANTOS, brasileiro, adquiri 20% do presente imóvel. TRANSMITENTES: PEDRO SOUZA e ANA SOUZA."

Extração correta:
- MARIA SILVA → percentual: 80, ato_aquisitivo: "R-1-12345"
- JOÃO SANTOS → percentual: 20, ato_aquisitivo: "R-1-12345"
- PEDRO SOUZA e ANA SOUZA são TRANSMITENTES, NÃO proprietários

RETORNE APENAS JSON VÁLIDO.`

  const { json, tokens } = await chamarClaude(pdfBuffer, prompt, 4096)
  console.log(`[PIPELINE] Etapa 4 (Titularidade): ${tokens.input_tokens} input + ${tokens.output_tokens} output`)

  return {
    proprietarios: json.proprietarios as unknown as ProprietarioAtual[],
    tokens,
  }
}

// ============================================
// ETAPA 5: RELATÓRIO
// ============================================

function etapa5Relatorio(
  imovel: DadosImovel,
  proprietarios: ProprietarioAtual[],
  onusAtivos: OnusAtivo[],
  cancelamentos: ParAtoCancelamento[],
): {
  semaforo: "verde" | "amarelo" | "vermelho"
  semaforo_justificativa: string
  recomendacoes: string[]
  documentos_faltantes: string[]
} {
  const recomendacoes: string[] = []
  const documentos_faltantes: string[] = []

  // Semáforo baseado nos ônus ativos
  const temNivel1 = onusAtivos.some((o) => o.nivel === 1)
  const temNivel2 = onusAtivos.some((o) => o.nivel === 2)

  let semaforo: "verde" | "amarelo" | "vermelho"
  let semaforo_justificativa: string

  if (temNivel1) {
    semaforo = "vermelho"
    semaforo_justificativa = `Imóvel possui ${onusAtivos.filter((o) => o.nivel === 1).length} impedimento(s) absoluto(s) que bloqueiam a transmissão.`
    for (const o of onusAtivos.filter((o) => o.nivel === 1)) {
      recomendacoes.push(`Resolver ${o.tipo}: ${o.impacto_transmissao}`)
    }
  } else if (temNivel2) {
    semaforo = "amarelo"
    semaforo_justificativa = `Imóvel possui ônus reais que sobrevivem à transmissão. Não impedem, mas afetam valor e atratividade.`
    for (const o of onusAtivos.filter((o) => o.nivel === 2)) {
      recomendacoes.push(`Atenção: ${o.tipo} — ${o.impacto_transmissao}`)
    }
  } else {
    semaforo = "verde"
    semaforo_justificativa = "Nenhum impedimento ou ônus ativo identificado. Imóvel em condições favoráveis para transmissão."
    recomendacoes.push("Sem ônus ou gravames ativos — situação registral favorável.")
  }

  // Verificações de documentos
  if (!imovel.ccir) documentos_faltantes.push("CCIR não identificado na matrícula")
  if (!imovel.nirf) documentos_faltantes.push("NIRF não identificado na matrícula")
  if (!imovel.car) documentos_faltantes.push("CAR não identificado na matrícula")
  if (imovel.georreferenciamento === false || imovel.georreferenciamento === null) {
    recomendacoes.push("Verificar exigibilidade do georreferenciamento conforme Decreto 4.449/2002")
  }

  // Cancelamentos como pontos positivos
  if (cancelamentos.length > 0) {
    recomendacoes.push(`${cancelamentos.length} ônus/restrição(ões) anteriormente registrado(s) foram cancelado(s)/extinto(s).`)
  }

  // Proprietários
  if (proprietarios.length > 3) {
    recomendacoes.push(`Condomínio com ${proprietarios.length} proprietários — todos devem assinar a escritura.`)
  }

  if (documentos_faltantes.length > 0) {
    if (semaforo === "verde") {
      semaforo = "amarelo"
      semaforo_justificativa += " Documentação incompleta identificada."
    }
  }

  return { semaforo, semaforo_justificativa, recomendacoes, documentos_faltantes }
}

// ============================================
// PIPELINE PRINCIPAL
// ============================================

export async function analisarMatriculaPipeline(pdfBuffer: Buffer): Promise<ResultadoPipeline> {
  const tokensLog: ResultadoPipeline["tokens_consumidos"] = []
  const alertas: string[] = []

  // Detectar OCR
  const tamanhoPorPagina = pdfBuffer.length / 1024
  const pdfHeader = pdfBuffer.toString("utf8", 0, Math.min(pdfBuffer.length, 1000))
  const temTextoEditavel = pdfHeader.includes("/Type/Font") || pdfHeader.includes("/Subtype/Type1")
  const provavelmenteEscaneado = !temTextoEditavel || tamanhoPorPagina > 500

  if (provavelmenteEscaneado) {
    alertas.push("Documento parece ser escaneado (imagem). A extração por OCR pode ter precisão reduzida. Recomenda-se conferir os dados com o documento original.")
  }

  // ETAPA 1: Parsing
  const etapa1 = await etapa1Parsing(pdfBuffer)
  tokensLog.push({ etapa: "1-Parsing", input: etapa1.tokens.input_tokens, output: etapa1.tokens.output_tokens })

  // ETAPA 2: Pareamento (usa os atos da etapa 1 + relê o PDF)
  const etapa2 = await etapa2Pareamento(pdfBuffer, etapa1.atos)
  tokensLog.push({ etapa: "2-Pareamento", input: etapa2.tokens.input_tokens, output: etapa2.tokens.output_tokens })

  // ETAPA 3: Classificação (determinística, sem IA)
  const onusAtivos = etapa3Classificacao(etapa1.atos, etapa2.cancelamentos)

  // ETAPA 4: Titularidade (usa os atos + relê o PDF)
  const etapa4 = await etapa4Titularidade(pdfBuffer, etapa1.atos)
  tokensLog.push({ etapa: "4-Titularidade", input: etapa4.tokens.input_tokens, output: etapa4.tokens.output_tokens })

  // ETAPA 5: Relatório (determinístico, sem IA)
  const etapa5 = etapa5Relatorio(etapa1.imovel, etapa4.proprietarios, onusAtivos, etapa2.cancelamentos)

  // Calcular totais
  const totalInput = tokensLog.reduce((s, t) => s + t.input, 0)
  const totalOutput = tokensLog.reduce((s, t) => s + t.output, 0)
  console.log(`[PIPELINE] Total: ${totalInput} input + ${totalOutput} output = ${totalInput + totalOutput} tokens`)

  return {
    imovel: etapa1.imovel,
    atos: etapa1.atos,
    cancelamentos: etapa2.cancelamentos,
    onus_ativos: onusAtivos,
    proprietarios_atuais: etapa4.proprietarios,
    semaforo: etapa5.semaforo,
    semaforo_justificativa: etapa5.semaforo_justificativa,
    recomendacoes: etapa5.recomendacoes,
    documentos_faltantes: etapa5.documentos_faltantes,
    alertas,
    tokens_consumidos: tokensLog,
  }
}

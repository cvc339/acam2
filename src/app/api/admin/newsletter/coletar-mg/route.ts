import { NextResponse } from "next/server"
import { verificarAdminOuCron } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import puppeteer from "puppeteer"

/**
 * POST /api/admin/newsletter/coletar-mg
 * Coleta normas ambientais de MG via Puppeteer (Pesquisa Legislativa).
 * Portado de: radar-ambiental/web/src/app/api/coletar-mg/route.ts
 *
 * Body opcional: { dataInicio?: "01/04/2026", dataFim?: "14/04/2026" }
 * Sem body: coleta últimos 7 dias.
 */

export const maxDuration = 300 // 5 minutos

// ============================================================
// Configuração
// ============================================================

const URL_BASE = "https://www.pesquisalegislativa.mg.gov.br/Legislacao.aspx"

const ORGAOS = [
  { value: "37", nome: "COPAM" },
  { value: "144", nome: "SEMAD" },
  { value: "81", nome: "FEAM" },
  { value: "105", nome: "IEF" },
  { value: "108", nome: "IGAM" },
  { value: "267", nome: "AGE" },
  { value: "106", nome: "IEPHA" },
]

const TIPOS_NORMATIVOS = [
  "lei", "decreto", "resolução", "resolucao",
  "instrução normativa", "instrucao normativa",
  "deliberação normativa", "deliberacao normativa",
  "deliberação", "deliberacao",
  "portaria",
]

const TERMOS_INTERNOS = /comitê gestor interno|nomeação|nomeacao|designa servidores|exonera|férias|ferias|diária|diaria|viagem a serviço|remoção|remocao|gratificação|gratificacao|substituição|substituicao|cessão|cessao|requisição|requisicao|progressão|progressao|processo seletivo interno|composição de|composicao de/i

const TERMOS_AMBIENTAIS = [
  "licenciamento", "licença ambiental", "licenca ambiental",
  "condicionante", "supressão", "supressao",
  "compensação ambiental", "compensacao ambiental",
  "auto de infração", "auto de infracao",
  "embargo", "multa ambiental",
  "deliberação normativa", "deliberacao normativa",
  "outorga", "unidade de conservação", "unidade de conservacao",
  "estudo de impacto", "eia", "rima",
  "patrimônio", "patrimonio", "tombamento",
  "terra indígena", "terra indigena",
  "barragem", "desmatamento",
  "área de preservação", "area de preservacao",
  "reserva legal", "zona de amortecimento",
  "plano de manejo", "recurso hídrico", "recurso hidrico",
  "poluição", "poluicao", "saneamento",
  "fauna", "flora", "mineração", "mineracao",
  "meio ambiente", "ambiental", "florestal",
  "câmara técnica", "camara tecnica",
  "regularização ambiental", "regularizacao ambiental",
]

const ORGAOS_AMBIENTAIS = ["COPAM", "SEMAD", "FEAM", "IEF", "IGAM"]
const ORGAOS_INTERSECCAO_MG = ["AGE", "IEPHA"]

// ============================================================
// Filtros
// ============================================================

function ehRelevante(orgaoNome: string, tipo: string, ementa: string): boolean {
  const tipoLower = tipo.toLowerCase()
  const ementaLower = ementa.toLowerCase()

  const ehNormativo = TIPOS_NORMATIVOS.some(t => tipoLower.includes(t) || ementaLower.includes(t))
  if (!ehNormativo) return false

  if (TERMOS_INTERNOS.test(ementaLower)) return false

  if (ORGAOS_AMBIENTAIS.includes(orgaoNome)) return true

  if (ORGAOS_INTERSECCAO_MG.includes(orgaoNome)) {
    return TERMOS_AMBIENTAIS.some(t => ementaLower.includes(t))
  }

  return false
}

function categorizar(tipo: string, ementa: string): string {
  const t = `${tipo} ${ementa}`.toLowerCase()
  if (/auto de infração|auto de infracao|embargo|multa|fiscalização|fiscalizacao/.test(t)) return "fiscalizacao"
  if (/licenciamento|licença|licenca|condicionante|eia|rima|estudo.?impacto/.test(t)) return "licenciamento"
  if (/patrimônio|patrimonio|iphan|iepha|tombamento/.test(t)) return "patrimonio"
  if (/outorga|recurso hídrico|recurso hidrico|bacia|água|agua/.test(t)) return "recursos_hidricos"
  if (/desmatamento|supressão|supressao|fauna|flora|unidade.?conservação|unidade.?conservacao/.test(t)) return "desmatamento"
  if (/mineração|mineracao|barragem|anm/.test(t)) return "mineracao"
  return "legislacao"
}

function dataParaISO(dataBR: string): string | null {
  const match = dataBR.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (!match) return null
  return `${match[3]}-${match[2]}-${match[1]}`
}

// ============================================================
// Consulta por órgão via Puppeteer
// ============================================================

interface ItemMG {
  tipo: string
  numero: string
  data: string
  ementa: string
  url: string
  btnId: string
  orgao?: string
}

type PuppeteerPage = Awaited<ReturnType<Awaited<ReturnType<typeof puppeteer.launch>>["newPage"]>>

async function consultarOrgao(
  page: PuppeteerPage,
  orgao: { value: string; nome: string },
  dataInicio: string,
  dataFim: string,
): Promise<ItemMG[]> {
  await page.goto(URL_BASE, { waitUntil: "networkidle2", timeout: 30000 })

  await page.select(
    'select[name="ctl00$ContentPlaceHolder1$pnlresolucao_content$ddlOrgao"]',
    orgao.value,
  )
  await page.$eval(
    'input[name="ctl00$ContentPlaceHolder1$pnlresolucao_content$txtPeriodoDe"]',
    (el: HTMLInputElement, val: string) => { el.value = val },
    dataInicio,
  )
  await page.$eval(
    'input[name="ctl00$ContentPlaceHolder1$pnlresolucao_content$txtPeriodoAte"]',
    (el: HTMLInputElement, val: string) => { el.value = val },
    dataFim,
  )

  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
    page.click('input[name="ctl00$ContentPlaceHolder1$pnlresolucao_content$btnBuscaLegislacao"]'),
  ])

  // Extrair dados do GridView ASP.NET
  const resultadosBrutos: ItemMG[] = await page.evaluate(() => {
    const items: { tipo: string; numero: string; data: string; ementa: string; url: string; btnId: string }[] = []
    let idx = 2
    while (true) {
      const prefix = `ctl00_ContentPlaceHolder1_GridView1_ctl${String(idx).padStart(2, "0")}`
      const tipoEl = document.getElementById(`${prefix}_lblTipoList`)
      if (!tipoEl) break
      const tipo = tipoEl.textContent?.trim() || ""
      const numero = (document.getElementById(`${prefix}_txtNumero`)?.textContent?.trim() || "").replace(/,$/, "")
      const dataRaw = document.getElementById(`${prefix}_lblDataAssinaturaList`)?.textContent?.trim() || ""
      const data = dataRaw.replace(/^de\s+/, "")
      const ementa = document.getElementById(`${prefix}_lblEmenta`)?.textContent?.trim() || ""
      items.push({ tipo, numero, data, ementa, url: "", btnId: `${prefix}_btnVisualizar` })
      idx++
    }
    return items
  })

  const semResultado = await page.evaluate(() => {
    const texto = document.body.innerText.toLowerCase()
    return texto.includes("nenhum registro") || texto.includes("não foram encontrad")
  })

  if (semResultado || resultadosBrutos.length === 0) return []

  // Filtrar relevância
  const relevantes = resultadosBrutos.filter(r => ehRelevante(orgao.nome, r.tipo, r.ementa))

  // Capturar URLs clicando em Visualizar
  for (let i = 0; i < relevantes.length; i++) {
    try {
      const btn = await page.$(`#${relevantes[i].btnId}`)
      if (!btn) continue
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }),
        btn.click(),
      ])
      relevantes[i].url = page.url()

      // Re-pesquisar para restaurar o GridView
      await page.goto(URL_BASE, { waitUntil: "networkidle2", timeout: 30000 })
      await page.select('select[name="ctl00$ContentPlaceHolder1$pnlresolucao_content$ddlOrgao"]', orgao.value)
      await page.$eval('input[name="ctl00$ContentPlaceHolder1$pnlresolucao_content$txtPeriodoDe"]', (el: HTMLInputElement, val: string) => { el.value = val }, dataInicio)
      await page.$eval('input[name="ctl00$ContentPlaceHolder1$pnlresolucao_content$txtPeriodoAte"]', (el: HTMLInputElement, val: string) => { el.value = val }, dataFim)
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }),
        page.click('input[name="ctl00$ContentPlaceHolder1$pnlresolucao_content$btnBuscaLegislacao"]'),
      ])
    } catch {
      relevantes[i].url = ""
    }
  }

  return relevantes.map(r => ({ ...r, orgao: orgao.nome }))
}

// ============================================================
// API Route
// ============================================================

export async function POST(request: Request) {
  const auth = await verificarAdminOuCron(request)
  if (!auth.authorized) return auth.response

  try {
    const admin = createAdminClient()

    // Período: body pode enviar dataInicio/dataFim, senão usa últimos 7 dias
    const body = await request.json().catch(() => ({})) as { dataInicio?: string; dataFim?: string }
    let dataInicio: string
    let dataFim: string

    if (body.dataInicio && body.dataFim) {
      dataInicio = body.dataInicio
      dataFim = body.dataFim
    } else {
      const hoje = new Date()
      const seteDias = new Date()
      seteDias.setDate(hoje.getDate() - 7)
      dataFim = hoje.toLocaleDateString("pt-BR")
      dataInicio = seteDias.toLocaleDateString("pt-BR")
    }

    console.log(`[MG] Iniciando coleta: ${dataInicio} a ${dataFim}`)

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    )

    let todosResultados: ItemMG[] = []
    const erros: string[] = []

    for (const orgao of ORGAOS) {
      try {
        console.log(`[MG] Consultando ${orgao.nome}...`)
        const resultados = await consultarOrgao(page, orgao, dataInicio, dataFim)
        todosResultados = todosResultados.concat(resultados)
        console.log(`[MG] ${orgao.nome}: ${resultados.length} relevante(s)`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        erros.push(`${orgao.nome}: ${msg}`)
        console.error(`[MG] ERRO ${orgao.nome}: ${msg}`)
      }
    }

    await browser.close()

    // Inserir no Supabase
    let inseridas = 0
    let duplicatas = 0

    for (const r of todosResultados) {
      const titulo = `${r.tipo} ${r.orgao} n. ${r.numero} — ${r.ementa.slice(0, 200)}`.replace(/\s+/g, " ").trim().slice(0, 500)
      const dataISO = dataParaISO(r.data)
      const categoria = categorizar(r.tipo, r.ementa)

      const { error } = await admin.from("radar_itens").insert({
        titulo,
        resumo: r.ementa.slice(0, 300),
        url: r.url || null,
        fonte: "MG",
        fonte_nome: r.orgao,
        orgao: r.orgao,
        tipo: r.tipo,
        numero: r.numero,
        categoria,
        relevancia: 50,
        data_publicacao: dataISO,
        incluir_email: false,
      })

      if (!error) inseridas++
      else if (error.code === "23505") duplicatas++
      else erros.push(`Insert: ${error.message}`)
    }

    console.log(`[MG] Concluído: ${todosResultados.length} relevantes, ${inseridas} inseridas, ${duplicatas} duplicatas`)

    return NextResponse.json({
      sucesso: true,
      periodo: `${dataInicio} a ${dataFim}`,
      relevantes: todosResultados.length,
      inseridas,
      duplicatas,
      erros: erros.length > 0 ? erros : undefined,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[MG] Erro:", msg)
    return NextResponse.json(
      { sucesso: false, erro: msg },
      { status: 500 },
    )
  }
}

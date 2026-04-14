import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/cron/newsletter?key=CRON_SECRET
 *
 * Executa coleta automática de RSS e DOU.
 * Chamada diariamente por serviço externo (cron-job.org, Railway cron, etc.)
 *
 * MG não roda no cron — requer Puppeteer (execução manual via admin).
 *
 * Protegida por CRON_SECRET — não requer auth de usuário.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || key !== cronSecret) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  }

  const resultados: Record<string, unknown> = {}

  // 1. Coletar RSS (direto, sem passar pela API protegida)
  try {
    resultados.rss = await coletarRSSDireto()
  } catch (err) {
    resultados.rss = { erro: (err as Error).message }
  }

  // 2. Coletar DOU (direto)
  try {
    resultados.dou = await coletarDOUDireto()
  } catch (err) {
    resultados.dou = { erro: (err as Error).message }
  }

  // 3. Limpar itens velhos (>9 dias, não selecionados, não enviados)
  try {
    const admin = createAdminClient()
    const limite = new Date()
    limite.setDate(limite.getDate() - 9)
    const { count } = await admin
      .from("radar_itens")
      .delete({ count: "exact" })
      .eq("incluir_email", false)
      .is("enviado_em", null)
      .lt("coletado_em", limite.toISOString())
    resultados.limpeza = { removidos: count ?? 0 }
  } catch (err) {
    resultados.limpeza = { erro: (err as Error).message }
  }

  console.log("[cron/newsletter] Coleta automática concluída:", JSON.stringify(resultados))

  return NextResponse.json({
    sucesso: true,
    timestamp: new Date().toISOString(),
    resultados,
  })
}

// ============================================================
// Coleta RSS direta
// ============================================================

const FONTES_RSS = [
  { nome: "O Eco", url: "https://oeco.org.br/feed/", tipo: "prioritaria" },
  { nome: "Mongabay Brasil", url: "https://brasil.mongabay.com/feed/", tipo: "especializada" },
  { nome: "G1 Natureza", url: "https://g1.globo.com/rss/g1/natureza/", tipo: "geral" },
  { nome: "Agência Brasil", url: "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml", tipo: "geral" },
  { nome: "IBAMA", url: "https://www.gov.br/ibama/pt-br/RSS", tipo: "prioritaria" },
  { nome: "MapBiomas Alertas", url: "https://alerta.mapbiomas.org/", tipo: "especializada" },
]

const TERMOS_ALTA = [
  "licenciamento", "condicionante", "eia", "rima",
  "estudo de impacto", "compensação ambiental", "auto de infração", "embargo",
  "deliberação normativa", "supressão de vegetação", "termo de ajustamento", "tac",
]

const TERMOS_MEDIA = [
  "meio ambiente", "ambiental", "desmatamento", "fauna", "flora",
  "poluição", "saneamento", "mineração", "unidade de conservação", "barragem",
  "recurso hídrico", "outorga", "ibama", "icmbio", "conama",
  "reserva legal", "área de preservação", "patrimônio", "tombamento",
]

function calcRelevancia(titulo: string, desc: string, tipo: string) {
  const c = `${titulo} ${desc}`.toLowerCase()
  const palavras: string[] = []
  let p = tipo === "prioritaria" ? 20 : tipo === "especializada" ? 15 : 10
  for (const t of TERMOS_ALTA) { if (c.includes(t)) { p += 15; palavras.push(t) } }
  for (const t of TERMOS_MEDIA) { if (c.includes(t)) { p += 10; palavras.push(t) } }
  if (/minas gerais|copam|semad|feam|ief|igam/.test(c)) { p += 10; palavras.push("minas gerais") }
  return { pontuacao: Math.min(100, p), palavras: [...new Set(palavras)] }
}

function parseRSS(xml: string) {
  const itens: Array<{ titulo: string; descricao: string; url: string; data: string | null }> = []
  const re = /<item[\s>]([\s\S]*?)<\/item>/gi
  let m
  while ((m = re.exec(xml)) !== null) {
    const b = m[1]
    const tag = (t: string) => {
      const cd = b.match(new RegExp(`<${t}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${t}>`, "i"))
      if (cd) return cd[1].replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim()
      const n = b.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`, "i"))
      return n ? n[1].replace(/<[^>]*>/g, "").trim() : ""
    }
    const titulo = tag("title"), url = tag("link")
    if (titulo && url) itens.push({ titulo, descricao: tag("description"), url, data: tag("pubDate") || tag("dc:date") || null })
  }
  return itens
}

function categorizar(titulo: string, descricao: string): string {
  const t = `${titulo} ${descricao}`.toLowerCase()
  if (/auto de infração|embargo|multa|fiscalização/.test(t)) return "fiscalizacao"
  if (/licenciamento|licença|condicionante|eia|rima/.test(t)) return "licenciamento"
  if (/patrimônio|tombamento/.test(t)) return "patrimonio"
  if (/outorga|recurso hídrico|bacia|água/.test(t)) return "recursos_hidricos"
  if (/desmatamento|supressão|fauna|flora|unidade.?conservação/.test(t)) return "desmatamento"
  if (/mineração|barragem/.test(t)) return "mineracao"
  return "geral"
}

async function coletarRSSDireto() {
  const admin = createAdminClient()
  const limite = new Date()
  limite.setDate(limite.getDate() - 7)
  let inseridas = 0, duplicatas = 0, relevantes = 0
  const erros: string[] = []

  for (const fonte of FONTES_RSS) {
    try {
      const resp = await fetch(fonte.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; RadarAmbiental/1.0)", "Accept": "application/rss+xml, application/xml, text/xml, */*" },
        signal: AbortSignal.timeout(15000),
      })
      if (!resp.ok) { erros.push(`${fonte.nome}: HTTP ${resp.status}`); continue }
      const itens = parseRSS(await resp.text())

      for (const item of itens) {
        if (item.data) { const d = new Date(item.data); if (!isNaN(d.getTime()) && d < limite) continue }
        const { pontuacao, palavras } = calcRelevancia(item.titulo, item.descricao, fonte.tipo)
        if (pontuacao < 30) continue
        relevantes++

        let dataPub: string | null = null
        if (item.data) { const d = new Date(item.data); if (!isNaN(d.getTime())) dataPub = d.toISOString().split("T")[0] }

        const { error } = await admin.from("radar_itens").insert({
          titulo: item.titulo.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 500),
          resumo: item.descricao?.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 300) || null,
          url: item.url, fonte: "RSS", fonte_nome: fonte.nome,
          categoria: categorizar(item.titulo, item.descricao),
          relevancia: pontuacao, palavras_chave: palavras,
          data_publicacao: dataPub, incluir_email: false,
        })

        if (!error) inseridas++
        else if (error.code === "23505") duplicatas++
      }
    } catch (err) { erros.push(`${fonte.nome}: ${(err as Error).message}`) }
  }

  return { sucesso: true, inseridas, duplicatas, relevantes, erros: erros.length > 0 ? erros : undefined }
}

// ============================================================
// Coleta DOU direta
// ============================================================

async function coletarDOUDireto() {
  const INLABS_EMAIL = process.env.INLABS_EMAIL
  const INLABS_PASSWORD = process.env.INLABS_PASSWORD
  if (!INLABS_EMAIL || !INLABS_PASSWORD) return { erro: "INLABS não configurado" }

  try {
    const { unzipSync } = await import("fflate")
    const admin = createAdminClient()

    // Últimos 3 dias com DOU (seg-sex)
    const datas: string[] = []
    const d = new Date()
    let count = 0
    while (count < 3) {
      d.setDate(d.getDate() - 1)
      if (d.getDay() !== 0 && d.getDay() !== 6) { datas.push(d.toISOString().split("T")[0]); count++ }
    }

    // Login
    const extractCookies = (resp: Response): string[] => {
      const result: string[] = []
      resp.headers.forEach((v, k) => {
        if (k.toLowerCase() === "set-cookie") {
          for (const part of v.split(/,(?=\s*\w+=)/)) {
            const cookie = part.split(";")[0].trim()
            if (cookie.includes("=")) result.push(cookie)
          }
        }
      })
      return result
    }

    const initResp = await fetch("https://inlabs.in.gov.br/", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      redirect: "manual",
    })
    const cookies = extractCookies(initResp)

    const loginForm = new URLSearchParams()
    loginForm.set("email", INLABS_EMAIL)
    loginForm.set("password", INLABS_PASSWORD)

    let loginResp: Response | null = null
    for (let t = 1; t <= 3; t++) {
      loginResp = await fetch("https://inlabs.in.gov.br/logar.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", "Cookie": cookies.join("; "), "Referer": "https://inlabs.in.gov.br/", "Origin": "https://inlabs.in.gov.br" },
        body: loginForm.toString(), redirect: "manual",
      })
      if (loginResp.status === 302 || loginResp.status === 301) break
      if (t < 3) await new Promise((r) => setTimeout(r, 3000))
    }

    if (!loginResp || (loginResp.status !== 302 && loginResp.status !== 301)) return { erro: "Login INLABS falhou" }
    cookies.push(...extractCookies(loginResp))

    const loc = loginResp.headers.get("location") || ""
    if (loc) {
      const fr = await fetch(loc.startsWith("http") ? loc : `https://inlabs.in.gov.br/${loc}`, { headers: { "Cookie": cookies.join("; ") }, redirect: "manual" })
      cookies.push(...extractCookies(fr))
    }

    let inseridas = 0, duplicatas = 0, relevantes = 0
    const ORGAOS_AMB = ["meio ambiente", "ibama", "icmbio", "conama", "mma", "recursos hídricos", "recursos hidricos"]
    const ORGAOS_INT = ["iphan", "funai", "ana", "anm", "mineração", "mineracao"]
    const TERMOS = ["licenciamento", "compensação ambiental", "supressão", "embargo", "auto de infração", "deliberação normativa", "outorga", "unidade de conservação", "desmatamento", "mineração", "barragem", "fauna", "flora", "patrimônio"]
    const TIPOS_NORM = ["lei", "decreto", "resolução", "instrução normativa", "deliberação normativa", "portaria normativa", "medida provisória"]
    const ATOS_INTERNOS = /comitê gestor|letramento|gênero|diversidade laboral|nomeação|designa|exonera|férias|diária|viagem|remoção|gratificação|substituição|cessão|requisição|progressão/

    for (const dia of datas) {
      try {
        const zr = await fetch(`https://inlabs.in.gov.br/index.php?p=${dia}&dl=${dia}-DO1.zip`, {
          headers: { "Cookie": cookies.join("; "), "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(30000),
        })
        if (!zr.ok || (zr.headers.get("content-type") || "").includes("text/html")) continue

        const unzipped = unzipSync(new Uint8Array(await zr.arrayBuffer()))
        for (const fn of Object.keys(unzipped).filter((f) => f.endsWith(".xml"))) {
          const xml = new TextDecoder("utf-8").decode(unzipped[fn])
          const am = xml.match(/<article\s([^>]+)>/)
          if (!am) continue
          const attrs = am[1]
          const ga = (n: string) => (attrs.match(new RegExp(`${n}="([^"]*)"`))?.[1] || "")
          const gt = (tag: string) => {
            const cdata = xml.match(new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i"))
            if (cdata) return cdata[1].trim()
            const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"))
            return m ? m[1].trim() : ""
          }

          const orgao = ga("artCategory")
          const orgaoLower = orgao.toLowerCase()
          const tipoTexto = ga("artType").toLowerCase()
          const ehAmbiental = ORGAOS_AMB.some((o) => orgaoLower.includes(o))
          const ehInterseccao = ORGAOS_INT.some((o) => orgaoLower.includes(o))
          if (!ehAmbiental && !ehInterseccao) continue

          const titulo = gt("Identifica").replace(/<[^>]*>/g, "").trim()
          const ementa = gt("Ementa").replace(/<[^>]*>/g, "").trim()
          if (!titulo && !ementa) continue

          const tituloEmenta = `${titulo} ${ementa}`.toLowerCase()
          const ehNormativo = TIPOS_NORM.some((t) => tipoTexto.includes(t) || tituloEmenta.includes(t))
          const ehPortaria = tipoTexto.includes("portaria") || tituloEmenta.includes("portaria")
          if (!ehNormativo && !(ehPortaria && ementa.trim().length > 0)) continue
          if (ATOS_INTERNOS.test(ementa.toLowerCase())) continue

          if (ehInterseccao) {
            const texto = gt("Texto").replace(/<[^>]*>/g, " ").slice(0, 1000).toLowerCase()
            const conteudo = `${tituloEmenta} ${texto}`
            const temMG = /minas gerais|semad|copam|feam|ief|igam/.test(conteudo)
            const temAmbiental = TERMOS.some((t) => conteudo.includes(t))
            if (!temMG && !temAmbiental) continue
          }

          relevantes++

          // Relevância
          const conteudo = `${orgaoLower} ${titulo} ${ementa}`.toLowerCase()
          let pontuacao = 20
          const palavras: string[] = []
          for (const t of TERMOS) { if (conteudo.includes(t)) { pontuacao += 10; palavras.push(t) } }
          if (/minas gerais|semad|copam|feam|ief|igam/.test(conteudo)) { pontuacao += 10; palavras.push("minas gerais") }

          const dm = ga("pubDate").match(/(\d{2})\/(\d{2})\/(\d{4})/)
          const { error } = await admin.from("radar_itens").insert({
            titulo: (ementa ? `[DOU] ${titulo}: ${ementa}` : `[DOU] ${titulo}`).slice(0, 500),
            resumo: (ementa || "").slice(0, 300) || null,
            url: ga("pdfPage").replace(/&amp;/g, "&") || `https://www.in.gov.br/web/dou/-/${ga("idMateria")}`,
            fonte: "DOU", fonte_nome: `DOU ${ga("pubName")}`, orgao, tipo: ga("artType"),
            categoria: "legislacao", relevancia: Math.min(100, pontuacao), palavras_chave: [...new Set(palavras)],
            data_publicacao: dm ? `${dm[3]}-${dm[2]}-${dm[1]}` : dia, incluir_email: false,
          })

          if (!error) inseridas++
          else if (error.code === "23505") duplicatas++
        }
      } catch { /* continua */ }
    }

    return { sucesso: true, dias: datas.length, inseridas, duplicatas, relevantes }
  } catch (err) {
    return { erro: (err as Error).message }
  }
}

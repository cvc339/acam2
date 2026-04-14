import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/cron/newsletter?key=CRON_SECRET
 *
 * Executa coleta automática de RSS e DOU.
 * Chamada diariamente por serviço externo (cron-job.org, Railway cron, etc.)
 *
 * Protegida por CRON_SECRET — não requer auth de usuário.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")

  // Verificar secret
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || key !== cronSecret) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.acam.com.br"
  const resultados: Record<string, unknown> = {}

  // 1. Coletar RSS
  try {
    const res = await fetch(`${appUrl}/api/admin/newsletter/coletar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Bypass auth: chamar via service internamente
        "Cookie": "",
      },
    })

    // Se retornar 401/403 (auth), coletar direto via função interna
    if (!res.ok) {
      resultados.rss = await coletarRSSDireto()
    } else {
      resultados.rss = await res.json()
    }
  } catch (err) {
    resultados.rss = { erro: (err as Error).message }
  }

  // 2. Coletar DOU
  try {
    resultados.dou = await coletarDOUDireto()
  } catch (err) {
    resultados.dou = { erro: (err as Error).message }
  }

  console.log("[cron/newsletter] Coleta automática concluída:", JSON.stringify(resultados))

  return NextResponse.json({
    sucesso: true,
    timestamp: new Date().toISOString(),
    resultados,
  })
}

// ============================================
// Coleta RSS direta (sem passar pela API protegida)
// ============================================

const FONTES_RSS = [
  { nome: "O Eco", url: "https://oeco.org.br/feed/", tipo: "prioritaria" },
  { nome: "Mongabay Brasil", url: "https://brasil.mongabay.com/feed/", tipo: "especializada" },
  { nome: "G1 Natureza", url: "https://g1.globo.com/rss/g1/natureza/", tipo: "geral" },
  { nome: "Agência Brasil", url: "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml", tipo: "geral" },
  { nome: "IBAMA", url: "https://www.gov.br/ibama/pt-br/RSS", tipo: "prioritaria" },
]

const TERMOS_ALTA = ["licenciamento", "condicionante", "eia", "rima", "estudo de impacto", "compensação ambiental", "auto de infração", "embargo", "deliberação normativa", "supressão de vegetação", "termo de ajustamento"]
const TERMOS_MEDIA = ["meio ambiente", "ambiental", "desmatamento", "fauna", "flora", "poluição", "saneamento", "mineração", "unidade de conservação", "barragem", "recurso hídrico", "outorga", "ibama", "icmbio", "conama", "reserva legal", "área de preservação"]

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

async function coletarRSSDireto() {
  const admin = createAdminClient()
  const limite = new Date(); limite.setDate(limite.getDate() - 7)
  let inseridas = 0, duplicatas = 0, relevantes = 0
  const erros: string[] = []

  for (const fonte of FONTES_RSS) {
    try {
      const resp = await fetch(fonte.url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; RadarAmbiental/1.0)" }, signal: AbortSignal.timeout(15000) })
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
          titulo: item.titulo.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 500),
          resumo: item.descricao?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300) || null,
          url: item.url, fonte: "RSS", fonte_nome: fonte.nome,
          categoria: "geral", relevancia: pontuacao, palavras_chave: palavras,
          data_publicacao: dataPub, incluir_email: false,
        })

        if (!error) inseridas++
        else if (error.code === "23505") duplicatas++
      }
    } catch (err) { erros.push(`${fonte.nome}: ${(err as Error).message}`) }
  }

  return { sucesso: true, inseridas, duplicatas, relevantes, erros: erros.length > 0 ? erros : undefined }
}

// ============================================
// Coleta DOU direta
// ============================================

async function coletarDOUDireto() {
  const INLABS_EMAIL = process.env.INLABS_EMAIL
  const INLABS_PASSWORD = process.env.INLABS_PASSWORD
  if (!INLABS_EMAIL || !INLABS_PASSWORD) return { erro: "INLABS não configurado" }

  try {
    // Importar fflate dinamicamente
    const { unzipSync } = await import("fflate")
    const admin = createAdminClient()

    // Últimos 3 dias úteis
    const datas: string[] = []
    const d = new Date()
    let count = 0
    while (count < 3) {
      d.setDate(d.getDate() - 1)
      if (d.getDay() !== 0 && d.getDay() !== 6) { datas.push(d.toISOString().split("T")[0]); count++ }
    }

    // Login
    const initResp = await fetch("https://inlabs.in.gov.br/", { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "manual" })
    const cookies: string[] = []
    initResp.headers.forEach((v, k) => { if (k.toLowerCase() === "set-cookie") cookies.push(v.split(";")[0].trim()) })

    const loginForm = new URLSearchParams(); loginForm.set("email", INLABS_EMAIL); loginForm.set("password", INLABS_PASSWORD)
    const loginResp = await fetch("https://inlabs.in.gov.br/logar.php", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "Cookie": cookies.join("; "), "Referer": "https://inlabs.in.gov.br/" },
      body: loginForm.toString(), redirect: "manual",
    })

    if (loginResp.status !== 302 && loginResp.status !== 301) return { erro: "Login INLABS falhou" }
    loginResp.headers.forEach((v, k) => { if (k.toLowerCase() === "set-cookie") cookies.push(v.split(";")[0].trim()) })

    const loc = loginResp.headers.get("location") || ""
    if (loc) {
      const fr = await fetch(loc.startsWith("http") ? loc : `https://inlabs.in.gov.br/${loc}`, { headers: { "Cookie": cookies.join("; ") }, redirect: "manual" })
      fr.headers.forEach((v, k) => { if (k.toLowerCase() === "set-cookie") cookies.push(v.split(";")[0].trim()) })
    }

    let inseridas = 0, duplicatas = 0, relevantes = 0
    const TERMOS = ["licenciamento", "compensação ambiental", "supressão", "embargo", "auto de infração", "deliberação normativa", "outorga", "unidade de conservação", "desmatamento", "mineração", "barragem"]
    const ORGAOS = ["meio ambiente", "ibama", "icmbio", "conama", "mma", "recursos hídricos"]

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
          const gt = (t: string) => { const m = xml.match(new RegExp(`<${t}>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${t}>`, "i")); return m ? m[1].replace(/<[^>]*>/g, "").trim() : "" }

          const orgao = ga("artCategory").toLowerCase()
          if (!ORGAOS.some((o) => orgao.includes(o))) continue
          const titulo = gt("Identifica"), ementa = gt("Ementa")
          if (!titulo && !ementa) continue
          const conteudo = `${orgao} ${titulo} ${ementa}`.toLowerCase()
          if (!TERMOS.some((t) => conteudo.includes(t)) && !orgao.includes("meio ambiente")) continue
          relevantes++

          const dm = ga("pubDate").match(/(\d{2})\/(\d{2})\/(\d{4})/)
          const { error } = await admin.from("radar_itens").insert({
            titulo: (ementa ? `[DOU] ${titulo}: ${ementa}` : `[DOU] ${titulo}`).slice(0, 500),
            resumo: (ementa || "").slice(0, 300) || null,
            url: ga("pdfPage").replace(/&amp;/g, "&") || null,
            fonte: "DOU", fonte_nome: `DOU ${ga("pubName")}`, orgao: ga("artCategory"), tipo: ga("artType"),
            categoria: "legislacao", relevancia: 50, palavras_chave: [],
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

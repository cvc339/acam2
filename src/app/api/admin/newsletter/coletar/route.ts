import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/admin/newsletter/coletar
 * Executa coleta de notícias (RSS). Roda direto no servidor.
 * Body: { fonte: "rss" }
 *
 * MG e DOU não rodam aqui (MG precisa Puppeteer, DOU precisa login INLABS).
 */

// Fontes RSS
const FONTES = [
  { nome: "O Eco", url: "https://oeco.org.br/feed/", tipo: "prioritaria" as const },
  { nome: "Mongabay Brasil", url: "https://brasil.mongabay.com/feed/", tipo: "especializada" as const },
  { nome: "G1 Natureza", url: "https://g1.globo.com/rss/g1/natureza/", tipo: "geral" as const },
  { nome: "Agência Brasil", url: "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml", tipo: "geral" as const },
  { nome: "IBAMA", url: "https://www.gov.br/ibama/pt-br/RSS", tipo: "prioritaria" as const },
]

const TERMOS_ALTA = [
  "licenciamento", "condicionante", "eia", "rima",
  "estudo de impacto", "compensação ambiental", "compensacao ambiental",
  "auto de infração", "auto de infracao", "embargo",
  "deliberação normativa", "deliberacao normativa",
  "supressão de vegetação", "supressao de vegetacao",
  "termo de ajustamento", "tac",
]

const TERMOS_MEDIA = [
  "meio ambiente", "ambiental", "desmatamento", "fauna", "flora",
  "poluição", "poluicao", "saneamento", "mineração", "mineracao",
  "unidade de conservação", "unidade de conservacao", "barragem",
  "recurso hídrico", "recurso hidrico", "outorga",
  "ibama", "icmbio", "conama", "mma",
  "reserva legal", "área de preservação", "area de preservacao",
]

function calcularRelevancia(titulo: string, descricao: string, tipoFonte: string) {
  const conteudo = `${titulo} ${descricao}`.toLowerCase()
  const palavras: string[] = []
  let pontuacao = tipoFonte === "prioritaria" ? 20 : tipoFonte === "especializada" ? 15 : 10

  for (const termo of TERMOS_ALTA) {
    if (conteudo.includes(termo)) { pontuacao += 15; palavras.push(termo) }
  }
  for (const termo of TERMOS_MEDIA) {
    if (conteudo.includes(termo)) { pontuacao += 10; palavras.push(termo) }
  }
  if (/minas gerais|copam|semad|feam|ief|igam/.test(conteudo)) {
    pontuacao += 10; palavras.push("minas gerais")
  }

  return { pontuacao: Math.min(100, pontuacao), palavras: [...new Set(palavras)] }
}

function parsearRSS(xml: string): Array<{ titulo: string; descricao: string; url: string; data: string | null }> {
  const itens: Array<{ titulo: string; descricao: string; url: string; data: string | null }> = []
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const bloco = match[1]
    const getTag = (tag: string): string => {
      const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i")
      const cdataMatch = bloco.match(cdataRe)
      if (cdataMatch) return cdataMatch[1].replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim()
      const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i")
      const m = bloco.match(re)
      return m ? m[1].replace(/<[^>]*>/g, "").trim() : ""
    }

    const titulo = getTag("title")
    const url = getTag("link")
    if (titulo && url) {
      itens.push({ titulo, descricao: getTag("description"), url, data: getTag("pubDate") || getTag("dc:date") || null })
    }
  }

  // Atom
  if (itens.length === 0) {
    const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi
    while ((match = entryRegex.exec(xml)) !== null) {
      const bloco = match[1]
      const titulo = (bloco.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i) || [])[1]?.replace(/<[^>]*>/g, "").trim() || ""
      const url = (bloco.match(/<link[^>]*href="([^"]*)"[^>]*\/?\s*>/i) || [])[1] || ""
      const descricao = (bloco.match(/<(?:summary|content)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:summary|content)>/i) || [])[1]?.replace(/<[^>]*>/g, "").trim().slice(0, 500) || ""
      const data = (bloco.match(/<(?:published|updated)[^>]*>([\s\S]*?)<\/(?:published|updated)>/i) || [])[1]?.trim() || null
      if (titulo && url) itens.push({ titulo, descricao, url, data })
    }
  }

  return itens
}

function categorizar(titulo: string, descricao: string): string {
  const t = `${titulo} ${descricao}`.toLowerCase()
  if (/auto de infração|embargo|multa|fiscalização/.test(t)) return "fiscalizacao"
  if (/licenciamento|licença|condicionante|eia|rima/.test(t)) return "licenciamento"
  if (/outorga|recurso hídrico|bacia|água/.test(t)) return "recursos_hidricos"
  if (/desmatamento|supressão|fauna|flora|unidade.?conservação/.test(t)) return "desmatamento"
  if (/mineração|barragem/.test(t)) return "mineracao"
  return "geral"
}

export async function POST(request: Request) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const body = await request.json().catch(() => ({}))
  const fonte = (body as { fonte?: string }).fonte || "rss"

  if (fonte !== "rss") {
    return NextResponse.json({
      erro: `Coleta "${fonte}" não disponível via API. Use o script local.`,
      instrucoes: fonte === "mg"
        ? "Execute: cd radar-ambiental && node coletar-mg.js"
        : "Coleta DOU requer script com login INLABS.",
    }, { status: 400 })
  }

  const admin = createAdminClient()
  const seteDiasAtras = new Date()
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

  let inseridas = 0
  let duplicatas = 0
  let relevantes = 0
  const erros: string[] = []

  for (const fonteRSS of FONTES) {
    try {
      const resp = await fetch(fonteRSS.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; RadarAmbiental/1.0)" },
        signal: AbortSignal.timeout(15000),
      })

      if (!resp.ok) { erros.push(`${fonteRSS.nome}: HTTP ${resp.status}`); continue }

      const xml = await resp.text()
      const itens = parsearRSS(xml)

      for (const item of itens) {
        if (item.data) {
          const d = new Date(item.data)
          if (!isNaN(d.getTime()) && d < seteDiasAtras) continue
        }

        const { pontuacao, palavras } = calcularRelevancia(item.titulo, item.descricao, fonteRSS.tipo)
        if (pontuacao < 30) continue
        relevantes++

        let dataPublicacao: string | null = null
        if (item.data) {
          const d = new Date(item.data)
          if (!isNaN(d.getTime())) dataPublicacao = d.toISOString().split("T")[0]
        }

        const { error } = await admin.from("radar_itens").insert({
          titulo: item.titulo.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 500),
          resumo: item.descricao?.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 300) || null,
          url: item.url,
          fonte: "RSS",
          fonte_nome: fonteRSS.nome,
          categoria: categorizar(item.titulo, item.descricao),
          relevancia: pontuacao,
          palavras_chave: palavras,
          data_publicacao: dataPublicacao,
          incluir_email: false,
        })

        if (!error) inseridas++
        else if (error.code === "23505") duplicatas++
        else erros.push(`${fonteRSS.nome}: ${error.message}`)
      }
    } catch (err) {
      erros.push(`${fonteRSS.nome}: ${(err as Error).message}`)
    }
  }

  return NextResponse.json({ sucesso: true, relevantes, inseridas, duplicatas, erros: erros.length > 0 ? erros : undefined })
}

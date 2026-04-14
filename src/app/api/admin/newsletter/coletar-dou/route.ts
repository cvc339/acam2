import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { unzipSync } from "fflate"

/**
 * POST /api/admin/newsletter/coletar-dou
 * Coleta normas do DOU via INLABS. Roda no servidor.
 * Body opcional: { data?: "2026-04-13", data_fim?: "2026-04-13" }
 */

const ORGAOS_AMBIENTAIS = [
  "meio ambiente", "ibama", "icmbio", "conama", "mma",
  "recursos hídricos", "recursos hidricos",
]
const ORGAOS_INTERSECCAO = ["iphan", "funai", "ana", "anm", "mineração", "mineracao"]

const TERMOS_AMBIENTAIS = [
  "licenciamento", "licença ambiental", "licenca ambiental", "condicionante",
  "supressão", "supressao", "compensação ambiental", "compensacao ambiental",
  "auto de infração", "auto de infracao", "embargo", "multa ambiental",
  "deliberação normativa", "deliberacao normativa", "resolução conama", "resolucao conama",
  "outorga", "unidade de conservação", "unidade de conservacao",
  "área protegida", "area protegida", "estudo de impacto", "eia rima",
  "patrimônio histórico", "patrimonio historico", "terra indígena", "terra indigena",
  "desmatamento", "fauna", "flora", "poluição", "poluicao", "saneamento",
  "recurso hídrico", "recurso hidrico", "barragem", "mineração", "mineracao",
]

const TIPOS_NORMATIVOS = [
  "lei", "decreto", "resolução", "resolucao", "instrução normativa", "instrucao normativa",
  "deliberação normativa", "deliberacao normativa", "portaria normativa",
  "medida provisória", "medida provisoria",
]

interface ArtigoDOU {
  id: string; orgao: string; tipo: string; titulo: string;
  ementa: string; texto: string; data: string; urlPdf: string; secao: string
}

function parsearXML(xml: string): ArtigoDOU | null {
  const articleMatch = xml.match(/<article\s([^>]+)>/)
  if (!articleMatch) return null
  const attrs = articleMatch[1]

  const getId = (name: string) => (attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1] || "")
  const getTag = (tag: string) => {
    const cdata = xml.match(new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i"))
    if (cdata) return cdata[1].trim()
    const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"))
    return m ? m[1].trim() : ""
  }

  const titulo = getTag("Identifica").replace(/<[^>]*>/g, "").trim()
  const ementa = getTag("Ementa").replace(/<[^>]*>/g, "").trim()
  if (!titulo && !ementa) return null

  return {
    id: getId("idMateria"), orgao: getId("artCategory"), tipo: getId("artType"),
    titulo, ementa, texto: getTag("Texto").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
    data: getId("pubDate"), urlPdf: getId("pdfPage").replace(/&amp;/g, "&"), secao: getId("pubName"),
  }
}

function ehRelevante(artigo: ArtigoDOU): boolean {
  const orgaoTexto = artigo.orgao.toLowerCase()
  const tipoTexto = artigo.tipo.toLowerCase()
  const tituloEmenta = `${artigo.titulo} ${artigo.ementa}`.toLowerCase()

  const ehOrgaoAmbiental = ORGAOS_AMBIENTAIS.some((o) => orgaoTexto.includes(o))
  const ehOrgaoInterseccao = ORGAOS_INTERSECCAO.some((o) => orgaoTexto.includes(o))
  if (!ehOrgaoAmbiental && !ehOrgaoInterseccao) return false

  const ehTipoNormativo = TIPOS_NORMATIVOS.some((t) => tipoTexto.includes(t) || tituloEmenta.includes(t))
  const ehPortaria = tipoTexto.includes("portaria") || tituloEmenta.includes("portaria")
  if (!ehTipoNormativo && !(ehPortaria && artigo.ementa.trim().length > 0)) return false

  const ementaTexto = artigo.ementa.toLowerCase()
  if (/comitê gestor|letramento|gênero|diversidade laboral|nomeação|designa|exonera|férias|diária|viagem|remoção|gratificação|substituição|cessão|requisição|progressão/.test(ementaTexto)) return false

  if (ehOrgaoInterseccao) {
    const conteudo = `${tituloEmenta} ${artigo.texto.slice(0, 1000)}`.toLowerCase()
    return /minas gerais|semad|copam|feam|ief|igam/.test(conteudo) || TERMOS_AMBIENTAIS.some((t) => conteudo.includes(t))
  }

  return true
}

function calcularRelevancia(orgao: string, titulo: string, texto: string) {
  const conteudo = `${orgao} ${titulo} ${texto}`.toLowerCase()
  const palavras: string[] = []
  let pontuacao = 20
  for (const termo of TERMOS_AMBIENTAIS) {
    if (conteudo.includes(termo)) { pontuacao += 10; palavras.push(termo) }
  }
  if (/minas gerais|semad|copam|feam|ief|igam/.test(conteudo)) { pontuacao += 10; palavras.push("minas gerais") }
  return { pontuacao: Math.min(100, pontuacao), palavras: [...new Set(palavras)] }
}

function categorizar(tipo: string, texto: string): string {
  const t = `${tipo} ${texto}`.toLowerCase()
  if (/portaria|resolução|deliberação|decreto|instrução normativa/.test(t)) return "legislacao"
  if (/auto de infração|embargo|multa|fiscalização/.test(t)) return "fiscalizacao"
  if (/licenciamento|licença|condicionante|eia|rima/.test(t)) return "licenciamento"
  if (/patrimônio|iphan|tombamento/.test(t)) return "patrimonio"
  if (/outorga|recurso hídrico|bacia|água/.test(t)) return "recursos_hidricos"
  if (/desmatamento|supressão|fauna|flora|unidade.?conservação/.test(t)) return "desmatamento"
  if (/mineração|barragem|anm/.test(t)) return "mineracao"
  return "geral"
}

function extractCookies(resp: Response): string[] {
  const result: string[] = []
  resp.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      for (const part of value.split(/,(?=\s*\w+=)/)) {
        const cookie = part.split(";")[0].trim()
        if (cookie.includes("=")) result.push(cookie)
      }
    }
  })
  return result
}

export async function POST(request: Request) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const INLABS_EMAIL = process.env.INLABS_EMAIL
  const INLABS_PASSWORD = process.env.INLABS_PASSWORD

  if (!INLABS_EMAIL || !INLABS_PASSWORD) {
    return NextResponse.json({ erro: "Credenciais INLABS não configuradas (INLABS_EMAIL, INLABS_PASSWORD)" }, { status: 500 })
  }

  try {
    const body = await request.json().catch(() => ({})) as { data?: string; data_fim?: string }

    // Montar lista de datas
    const datas: string[] = []
    const hoje = new Date().toISOString().split("T")[0]

    if (body.data && body.data_fim) {
      const inicio = new Date(body.data + "T12:00:00")
      const fim = new Date(body.data_fim + "T12:00:00")
      for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
        const dow = d.getDay()
        if (dow !== 0 && dow !== 6) datas.push(d.toISOString().split("T")[0])
      }
    } else {
      // Últimos 7 dias úteis
      const d = new Date()
      let count = 0
      while (count < 7) {
        d.setDate(d.getDate() - 1)
        if (d.getDay() !== 0 && d.getDay() !== 6) {
          datas.push(d.toISOString().split("T")[0])
          count++
        }
      }
      datas.reverse()
    }

    console.log(`[DOU] Coleta: ${datas.length} dia(s)`)

    // 1. Login INLABS
    const initResp = await fetch("https://inlabs.in.gov.br/", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      redirect: "manual",
    })

    const sessionCookies = extractCookies(initResp)

    const loginForm = new URLSearchParams()
    loginForm.set("email", INLABS_EMAIL)
    loginForm.set("password", INLABS_PASSWORD)

    let loginResp: Response | null = null
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      loginResp = await fetch("https://inlabs.in.gov.br/logar.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "Mozilla/5.0",
          "Cookie": sessionCookies.join("; "),
          "Referer": "https://inlabs.in.gov.br/",
        },
        body: loginForm.toString(),
        redirect: "manual",
      })
      if (loginResp.status === 302 || loginResp.status === 301) break
      if (tentativa < 3) await new Promise((r) => setTimeout(r, 3000))
    }

    if (!loginResp || (loginResp.status !== 302 && loginResp.status !== 301)) {
      return NextResponse.json({ erro: "Login INLABS falhou" }, { status: 500 })
    }

    const allCookies = [...sessionCookies, ...extractCookies(loginResp)]

    // Follow redirect
    const location = loginResp.headers.get("location") || ""
    if (location) {
      const followResp = await fetch(
        location.startsWith("http") ? location : `https://inlabs.in.gov.br/${location}`,
        { headers: { "User-Agent": "Mozilla/5.0", "Cookie": allCookies.join("; ") }, redirect: "manual" },
      )
      allCookies.push(...extractCookies(followResp))
    }

    // 2. Baixar ZIPs
    let totalXmls = 0, relevantes = 0, inseridas = 0, duplicatas = 0
    const erros: string[] = []
    const admin = createAdminClient()

    for (const dia of datas) {
      try {
        const zipUrl = `https://inlabs.in.gov.br/index.php?p=${dia}&dl=${dia}-DO1.zip`
        const zipResp = await fetch(zipUrl, {
          headers: { "Cookie": allCookies.join("; "), "User-Agent": "Mozilla/5.0", "Referer": `https://inlabs.in.gov.br/index.php?p=${dia}` },
          signal: AbortSignal.timeout(30000),
        })

        if (!zipResp.ok) { erros.push(`${dia}: HTTP ${zipResp.status}`); continue }

        const contentType = zipResp.headers.get("content-type") || ""
        if (contentType.includes("text/html")) { erros.push(`${dia}: retornou HTML`); continue }

        const zipBuffer = await zipResp.arrayBuffer()
        const unzipped = unzipSync(new Uint8Array(zipBuffer))
        const filenames = Object.keys(unzipped).filter((f) => f.endsWith(".xml"))
        totalXmls += filenames.length

        for (const filename of filenames) {
          try {
            const content = new TextDecoder("utf-8").decode(unzipped[filename])
            if (!content) continue
            const artigo = parsearXML(content)
            if (!artigo || !ehRelevante(artigo)) continue
            relevantes++

            const { pontuacao, palavras } = calcularRelevancia(artigo.orgao, artigo.titulo, artigo.ementa || artigo.texto.slice(0, 500))
            const categoria = categorizar(artigo.tipo, `${artigo.titulo} ${artigo.ementa}`)
            const tituloFinal = artigo.ementa ? `[DOU] ${artigo.titulo}: ${artigo.ementa}`.slice(0, 500) : `[DOU] ${artigo.titulo}`.slice(0, 500)

            const dataMatch = artigo.data.match(/(\d{2})\/(\d{2})\/(\d{4})/)
            const dataISO = dataMatch ? `${dataMatch[3]}-${dataMatch[2]}-${dataMatch[1]}` : dia

            const { error } = await admin.from("radar_itens").insert({
              titulo: tituloFinal, resumo: (artigo.ementa || artigo.texto.slice(0, 300)).slice(0, 300),
              url: artigo.id ? `https://www.in.gov.br/web/dou/-/${artigo.id}` : artigo.urlPdf || null,
              fonte: "DOU", fonte_nome: `DOU ${artigo.secao}`, orgao: artigo.orgao,
              tipo: artigo.tipo, categoria, relevancia: pontuacao,
              palavras_chave: palavras, data_publicacao: dataISO, incluir_email: false,
            })

            if (!error) inseridas++
            else if (error.code === "23505") duplicatas++
            else erros.push(`${artigo.id}: ${error.message}`)
          } catch { /* continua */ }
        }
      } catch (err) {
        erros.push(`${dia}: ${(err as Error).message}`)
      }
    }

    return NextResponse.json({ sucesso: true, dias: datas.length, xmls: totalXmls, relevantes, inseridas, duplicatas, erros: erros.length > 0 ? erros : undefined })
  } catch (error) {
    console.error("[DOU] Erro:", (error as Error).message)
    return NextResponse.json({ erro: (error as Error).message }, { status: 500 })
  }
}

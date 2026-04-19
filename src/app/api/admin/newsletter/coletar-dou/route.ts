import { NextResponse } from "next/server"
import { verificarAdminOuCron } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { unzipSync } from "fflate"

/**
 * POST /api/admin/newsletter/coletar-dou
 * Coleta normas do DOU via INLABS (login + download ZIP + parse XML).
 * Portado de: radar-ambiental/supabase/functions/radar-coletar-dou/index.ts
 *
 * Body opcional: { data?: "2026-04-13", data_fim?: "2026-04-13" }
 * Sem body: coleta últimos 7 dias úteis.
 */

// ============================================================
// Órgãos e termos de interesse ambiental
// ============================================================

// Órgãos essencialmente ambientais — todo conteúdo é relevante
const ORGAOS_AMBIENTAIS = [
  "meio ambiente",
  "ibama",
  "icmbio",
  "conama",
  "mma",
  "recursos hídricos",
  "recursos hidricos",
]

// Órgãos com intersecção ambiental — só relevante com filtro adicional
const ORGAOS_INTERSECCAO = [
  "iphan",
  "funai",
  "ana",
  "anm",
  "mineração",
  "mineracao",
]

const TERMOS_AMBIENTAIS = [
  "licenciamento",
  "licença ambiental",
  "licenca ambiental",
  "condicionante",
  "supressão",
  "supressao",
  "compensação ambiental",
  "compensacao ambiental",
  "auto de infração",
  "auto de infracao",
  "embargo",
  "multa ambiental",
  "deliberação normativa",
  "deliberacao normativa",
  "resolução conama",
  "resolucao conama",
  "outorga",
  "unidade de conservação",
  "unidade de conservacao",
  "área protegida",
  "area protegida",
  "estudo de impacto",
  "eia rima",
  "patrimônio histórico",
  "patrimonio historico",
  "terra indígena",
  "terra indigena",
  "desmatamento",
  "fauna",
  "flora",
  "poluição",
  "poluicao",
  "saneamento",
  "recurso hídrico",
  "recurso hidrico",
  "barragem",
  "mineração",
  "mineracao",
]

// ============================================================
// Categorização
// ============================================================

function categorizar(tipo: string, texto: string): string {
  const t = texto.toLowerCase()
  const tp = tipo.toLowerCase()

  if (/portaria|resolução|resolucao|deliberação|deliberacao|decreto|instrução normativa|instrucao normativa/.test(tp + " " + t))
    return "legislacao"
  if (/auto de infração|auto de infracao|embargo|multa|fiscalização|fiscalizacao/.test(t))
    return "fiscalizacao"
  if (/licenciamento|licença|licenca|condicionante|eia|rima|estudo.?impacto/.test(t))
    return "licenciamento"
  if (/patrimônio|patrimonio|iphan|tombamento/.test(t))
    return "patrimonio"
  if (/outorga|recurso hídrico|recurso hidrico|bacia|água|agua/.test(t))
    return "recursos_hidricos"
  if (/desmatamento|supressão|supressao|fauna|flora|unidade.?conservação|unidade.?conservacao/.test(t))
    return "desmatamento"
  if (/mineração|mineracao|barragem|anm/.test(t))
    return "mineracao"

  return "geral"
}

// ============================================================
// Pontuação de relevância
// ============================================================

function calcularRelevancia(orgao: string, titulo: string, texto: string): { pontuacao: number; palavras: string[] } {
  const conteudo = `${orgao} ${titulo} ${texto}`.toLowerCase()
  const palavras: string[] = []
  let pontuacao = 0

  // Fonte é DOU = +20 base
  pontuacao += 20

  for (const termo of TERMOS_AMBIENTAIS) {
    if (conteudo.includes(termo)) {
      pontuacao += 10
      palavras.push(termo)
    }
  }

  // Menção a MG
  if (/minas gerais|semad|copam|feam|ief|igam/.test(conteudo)) {
    pontuacao += 10
    palavras.push("minas gerais")
  }

  return {
    pontuacao: Math.min(100, pontuacao),
    palavras: [...new Set(palavras)],
  }
}

// ============================================================
// Parser de XML do DOU (regex — cada arquivo é um <article>)
// ============================================================

interface ArtigoDOU {
  id: string
  orgao: string
  tipo: string
  titulo: string
  ementa: string
  texto: string
  data: string
  urlPdf: string
  secao: string
}

function parsearXML(xml: string): ArtigoDOU | null {
  const articleMatch = xml.match(/<article\s([^>]+)>/)
  if (!articleMatch) return null

  const attrs = articleMatch[1]

  const getId = (name: string): string => {
    const m = attrs.match(new RegExp(`${name}="([^"]*)"`))
    return m ? m[1] : ""
  }

  const getTag = (tag: string): string => {
    // CDATA
    const cdataRe = new RegExp(`<${tag}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i")
    const cdataMatch = xml.match(cdataRe)
    if (cdataMatch) return cdataMatch[1].trim()
    // Tag vazia
    const emptyRe = new RegExp(`<${tag}\\s*/>`, "i")
    if (emptyRe.test(xml)) return ""
    // Tag com conteúdo
    const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i")
    const m = xml.match(re)
    return m ? m[1].trim() : ""
  }

  const orgao = getId("artCategory")
  const tipo = getId("artType")
  const data = getId("pubDate")
  const urlPdf = getId("pdfPage").replace(/&amp;/g, "&")
  const secao = getId("pubName")
  const idMateria = getId("idMateria")

  const titulo = getTag("Identifica").replace(/<[^>]*>/g, "").trim()
  const ementa = getTag("Ementa").replace(/<[^>]*>/g, "").trim()
  const texto = getTag("Texto").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()

  if (!titulo && !ementa) return null

  return { id: idMateria, orgao, tipo, titulo, ementa, texto, data, urlPdf, secao }
}

// ============================================================
// Verificar relevância ambiental
// ============================================================

// Tipos de ato normativo com impacto externo
const TIPOS_NORMATIVOS = [
  "lei",
  "decreto",
  "resolução",
  "resolucao",
  "instrução normativa",
  "instrucao normativa",
  "deliberação normativa",
  "deliberacao normativa",
  "portaria normativa",
  "medida provisória",
  "medida provisoria",
]

function ehRelevante(artigo: ArtigoDOU): boolean {
  const orgaoTexto = artigo.orgao.toLowerCase()
  const tipoTexto = artigo.tipo.toLowerCase()
  const tituloEmenta = `${artigo.titulo} ${artigo.ementa}`.toLowerCase()

  // 1. O órgão deve ser de interesse (ambiental ou intersecção)
  const ehOrgaoAmbiental = ORGAOS_AMBIENTAIS.some((o) => orgaoTexto.includes(o))
  const ehOrgaoInterseccao = ORGAOS_INTERSECCAO.some((o) => orgaoTexto.includes(o))
  if (!ehOrgaoAmbiental && !ehOrgaoInterseccao) return false

  // 2. O tipo de ato deve ser normativo (impacto externo)
  const ehTipoNormativo = TIPOS_NORMATIVOS.some((t) => tipoTexto.includes(t) || tituloEmenta.includes(t))

  // Portarias só entram se tiverem ementa com conteúdo de impacto externo
  const ehPortaria = tipoTexto.includes("portaria") || tituloEmenta.includes("portaria")
  const temEmenta = artigo.ementa.trim().length > 0

  if (!ehTipoNormativo && !(ehPortaria && temEmenta)) return false

  // Descartar atos administrativos internos (mesmo com ementa)
  const ementaTexto = artigo.ementa.toLowerCase()
  const ehAtoInterno = /comitê gestor|comite gestor|letramento|gênero|genero|diversidade laboral|nomeação|nomeacao|designa|exonera|férias|ferias|diária|diaria|viagem|remoção|remocao|gratificação|gratificacao|substituição|substituicao|cessão|cessao|requisição|requisicao|progressão|progressao/.test(ementaTexto)
  if (ehAtoInterno) return false

  // 3. Para órgãos de intersecção, exigir menção a MG ou termos ambientais
  if (ehOrgaoInterseccao) {
    const conteudo = `${tituloEmenta} ${artigo.texto.slice(0, 1000)}`.toLowerCase()
    const temMG = /minas gerais|semad|copam|feam|ief|igam/.test(conteudo)
    const temAmbiental = TERMOS_AMBIENTAIS.some((t) => conteudo.includes(t))
    return temMG || temAmbiental
  }

  return true
}

// ============================================================
// Extração de cookies
// ============================================================

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

// ============================================================
// API Route principal
// ============================================================

export async function POST(request: Request) {
  const auth = await verificarAdminOuCron(request)
  if (!auth.authorized) return auth.response

  const INLABS_EMAIL = process.env.INLABS_EMAIL
  const INLABS_PASSWORD = process.env.INLABS_PASSWORD

  if (!INLABS_EMAIL || !INLABS_PASSWORD) {
    return NextResponse.json(
      { erro: "Credenciais INLABS não configuradas (INLABS_EMAIL, INLABS_PASSWORD)" },
      { status: 500 },
    )
  }

  const inicio = Date.now()

  try {
    const admin = createAdminClient()

    // Datas alvo (suporta data única ou range)
    const body = await request.json().catch(() => ({})) as { data?: string; data_fim?: string }

    const datas: string[] = []
    if (body.data && body.data_fim) {
      // Range: gerar cada dia com DOU (seg-sex) entre data e data_fim
      const inicio_d = new Date(body.data + "T12:00:00")
      const fim_d = new Date(body.data_fim + "T12:00:00")
      for (let d = new Date(inicio_d); d <= fim_d; d.setDate(d.getDate() + 1)) {
        const dow = d.getDay()
        if (dow !== 0 && dow !== 6) { // DOU publica seg-sex
          datas.push(d.toISOString().split("T")[0])
        }
      }
    } else if (body.data) {
      datas.push(body.data)
    } else {
      // Últimos 7 dias com DOU (seg-sex)
      const d = new Date()
      let count = 0
      while (count < 7) {
        d.setDate(d.getDate() - 1)
        if (d.getDay() !== 0 && d.getDay() !== 6) { // DOU publica seg-sex
          datas.push(d.toISOString().split("T")[0])
          count++
        }
      }
      datas.reverse()
    }

    console.log(`[DOU] Iniciando coleta para ${datas.length} dia(s): ${datas[0]}${datas.length > 1 ? " a " + datas[datas.length - 1] : ""}`)

    // 1. Login no INLABS
    const initResp = await fetch("https://inlabs.in.gov.br/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "manual",
    })

    const sessionCookies = extractCookies(initResp)
    console.log(`[DOU] Página inicial: status=${initResp.status}, cookies=${sessionCookies.length}`)

    // Fazer login com retry (INLABS retorna 502 com frequência)
    const loginForm = new URLSearchParams()
    loginForm.set("email", INLABS_EMAIL)
    loginForm.set("password", INLABS_PASSWORD)

    let loginResp: Response | null = null
    const MAX_TENTATIVAS = 5
    // Backoff exponencial: 2s, 5s, 10s, 20s (soma ~37s antes de desistir)
    const BACKOFF_MS = [2000, 5000, 10000, 20000]

    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
      try {
        loginResp = await fetch("https://inlabs.in.gov.br/logar.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Cookie": sessionCookies.join("; "),
            "Referer": "https://inlabs.in.gov.br/",
            "Origin": "https://inlabs.in.gov.br",
          },
          body: loginForm.toString(),
          redirect: "manual",
          signal: AbortSignal.timeout(15_000),
        })

        console.log(`[DOU] Login tentativa ${tentativa}/${MAX_TENTATIVAS}: status=${loginResp.status}`)

        if (loginResp.status === 302 || loginResp.status === 301) break
      } catch (err) {
        console.log(`[DOU] Login tentativa ${tentativa}/${MAX_TENTATIVAS}: exceção ${(err as Error).message}`)
      }

      if (tentativa < MAX_TENTATIVAS) {
        const espera = BACKOFF_MS[tentativa - 1] ?? 20000
        console.log(`[DOU] Aguardando ${espera}ms antes de retry...`)
        await new Promise((r) => setTimeout(r, espera))
      }
    }

    if (!loginResp || (loginResp.status !== 302 && loginResp.status !== 301)) {
      const status = loginResp?.status ?? "timeout"
      const msg = status === 502 || status === 503 || status === 504
        ? `INLABS fora do ar (HTTP ${status}). Servidor do governo indisponível — tente novamente em alguns minutos.`
        : `Login INLABS falhou após ${MAX_TENTATIVAS} tentativas (status=${status})`
      return NextResponse.json({ erro: msg }, { status: 503 })
    }

    const loginCookies = extractCookies(loginResp)
    const allCookies = [...sessionCookies, ...loginCookies]
    const cookieHeader = allCookies.join("; ")

    console.log(`[DOU] Login OK`)

    // Seguir redirect para confirmar sessão
    if (loginResp.status === 302 || loginResp.status === 301) {
      const location = loginResp.headers.get("location") || ""
      console.log(`[DOU] Login redirect para: ${location}`)

      const followResp = await fetch(
        location.startsWith("http") ? location : `https://inlabs.in.gov.br/${location}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Cookie": cookieHeader,
          },
          redirect: "manual",
        },
      )
      const followCookies = extractCookies(followResp)
      for (const c of followCookies) allCookies.push(c)
      console.log(`[DOU] Follow redirect: status=${followResp.status}, cookies adicionais=${followCookies.length}`)
    }

    // 2. Baixar e processar ZIPs
    const secoes = ["DO1"]
    let totalXmls = 0
    let relevantes = 0
    let inseridas = 0
    let duplicatas = 0
    let diasProcessados = 0
    const erros: string[] = []

    for (const dia of datas) {
      for (const secao of secoes) {
        try {
          const zipUrl = `https://inlabs.in.gov.br/index.php?p=${dia}&dl=${dia}-${secao}.zip`

          console.log(`[DOU] Baixando ${dia} ${secao}...`)

          // Retry com backoff exponencial (2s, 5s, 10s) — INLABS frequentemente retorna 502
          let zipResp: Response | null = null
          const MAX_ZIP_RETRIES = 3
          const ZIP_BACKOFF = [2000, 5000, 10000]

          for (let t = 1; t <= MAX_ZIP_RETRIES; t++) {
            try {
              zipResp = await fetch(zipUrl, {
                headers: {
                  "Cookie": allCookies.join("; "),
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                  "Referer": `https://inlabs.in.gov.br/index.php?p=${dia}`,
                },
                signal: AbortSignal.timeout(30_000),
              })

              console.log(`[DOU] ${dia} ${secao} tentativa ${t}/${MAX_ZIP_RETRIES}: status=${zipResp.status}`)
              if (zipResp.ok) break
              // 5xx transitório → retry. 4xx ou 200 com HTML → não adianta retry
              if (zipResp.status < 500) break
            } catch (err) {
              console.log(`[DOU] ${dia} ${secao} tentativa ${t}: exceção ${(err as Error).message}`)
            }
            if (t < MAX_ZIP_RETRIES) await new Promise((r) => setTimeout(r, ZIP_BACKOFF[t - 1]))
          }

          if (!zipResp || !zipResp.ok) {
            erros.push(`${dia} ${secao}: HTTP ${zipResp?.status ?? "timeout"} após ${MAX_ZIP_RETRIES} tentativas`)
            continue
          }

          const contentType = zipResp.headers.get("content-type") || ""
          if (contentType.includes("text/html")) {
            const body = await zipResp.text()
            const preview = body.slice(0, 200)
            erros.push(`${secao}: retornou HTML — ${preview}`)
            continue
          }

          // 3. Descompactar e processar XMLs
          const zipBuffer = await zipResp.arrayBuffer()
          console.log(`[DOU] ${secao} ZIP size: ${zipBuffer.byteLength} bytes`)

          const unzipped = unzipSync(new Uint8Array(zipBuffer))
          const filenames = Object.keys(unzipped).filter((f) => f.endsWith(".xml"))

          console.log(`[DOU] ${secao}: ${filenames.length} XMLs no ZIP`)

          for (const filename of filenames) {
            try {
              totalXmls++
              const bytes = unzipped[filename]
              const content = new TextDecoder("utf-8").decode(bytes)
              if (!content) continue

              const artigo = parsearXML(content)
              if (!artigo) continue

              if (!ehRelevante(artigo)) continue
              relevantes++

              const { pontuacao, palavras } = calcularRelevancia(
                artigo.orgao,
                artigo.titulo,
                artigo.ementa || artigo.texto.slice(0, 500),
              )

              const categoria = categorizar(artigo.tipo, `${artigo.titulo} ${artigo.ementa}`)
              const tituloFinal = artigo.ementa
                ? `[DOU] ${artigo.titulo}: ${artigo.ementa}`.slice(0, 500)
                : `[DOU] ${artigo.titulo}`.slice(0, 500)

              // Converter data BR para ISO
              const dataMatch = artigo.data.match(/(\d{2})\/(\d{2})\/(\d{4})/)
              const dataISO = dataMatch
                ? `${dataMatch[3]}-${dataMatch[2]}-${dataMatch[1]}`
                : dia

              const { error: insertError } = await admin
                .from("radar_itens")
                .insert({
                  titulo: tituloFinal,
                  resumo: (artigo.ementa || artigo.texto.slice(0, 300)).slice(0, 300),
                  url: artigo.urlPdf || `https://www.in.gov.br/web/dou/-/${artigo.id}`,
                  fonte: "DOU",
                  fonte_nome: `DOU ${artigo.secao}`,
                  orgao: artigo.orgao,
                  tipo: artigo.tipo,
                  categoria,
                  relevancia: pontuacao,
                  palavras_chave: palavras,
                  data_publicacao: dataISO,
                  incluir_email: false,
                })

              if (!insertError) {
                inseridas++
              } else if (insertError.code === "23505") {
                duplicatas++
              } else {
                erros.push(`Insert ${artigo.id}: ${insertError.message}`)
              }
            } catch (entryErr: unknown) {
              const msg = entryErr instanceof Error ? entryErr.message : String(entryErr)
              console.error(`[DOU] Erro entry: ${msg}`)
            }
          }

          console.log(`[DOU] ${secao}: processado ${filenames.length} XMLs, ${relevantes} relevantes até agora`)
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err)
          erros.push(`${dia} ${secao}: ${msg}`)
          console.error(`[DOU] ERRO ${dia} ${secao}: ${msg}`)
        }
      }
      diasProcessados++
      console.log(`[DOU] ${dia}: concluído (${relevantes} relevantes acumulados)`)
    }

    const duracao = Date.now() - inicio
    console.log(
      `[DOU] Concluído em ${duracao}ms: ${diasProcessados} dias, ${totalXmls} XMLs, ${relevantes} relevantes, ${inseridas} inseridas, ${duplicatas} duplicatas`,
    )

    return NextResponse.json({
      sucesso: true,
      datas: datas.length === 1 ? datas[0] : `${datas[0]} a ${datas[datas.length - 1]}`,
      dias_processados: diasProcessados,
      duracao_ms: duracao,
      total_xmls: totalXmls,
      relevantes,
      inseridas,
      duplicatas,
      erros: erros.length > 0 ? erros : undefined,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[DOU] Erro:", errorMessage)

    return NextResponse.json(
      { erro: errorMessage },
      { status: 500 },
    )
  }
}

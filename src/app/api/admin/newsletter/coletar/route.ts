import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/admin/newsletter/coletar
 * Coleta notícias de fontes RSS ambientais.
 * Portado de: radar-ambiental/supabase/functions/radar-coletar-noticias/index.ts
 */

// ============================================================
// Fontes RSS
// ============================================================

interface FonteRSS {
  nome: string
  url: string
  tipo: "prioritaria" | "especializada" | "geral"
}

const FONTES: FonteRSS[] = [
  { nome: "O Eco", url: "https://oeco.org.br/feed/", tipo: "prioritaria" },
  { nome: "Mongabay Brasil", url: "https://brasil.mongabay.com/feed/", tipo: "especializada" },
  { nome: "G1 Natureza", url: "https://g1.globo.com/rss/g1/natureza/", tipo: "geral" },
  { nome: "Agência Brasil", url: "https://agenciabrasil.ebc.com.br/rss/ultimasnoticias/feed.xml", tipo: "geral" },
  { nome: "IBAMA", url: "https://www.gov.br/ibama/pt-br/RSS", tipo: "prioritaria" },
  { nome: "MapBiomas Alertas", url: "https://alerta.mapbiomas.org/", tipo: "especializada" },
]

// ============================================================
// Termos de relevância
// ============================================================

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
  "patrimônio", "patrimonio", "tombamento",
]

function calcularRelevancia(
  titulo: string,
  descricao: string,
  tipoFonte: FonteRSS["tipo"]
): { pontuacao: number; palavras: string[] } {
  const conteudo = `${titulo} ${descricao}`.toLowerCase()
  const palavras: string[] = []
  let pontuacao = 0

  // Pontuação base por tipo de fonte
  if (tipoFonte === "prioritaria") pontuacao += 20
  else if (tipoFonte === "especializada") pontuacao += 15
  else pontuacao += 10

  // Termos de alta relevância
  for (const termo of TERMOS_ALTA) {
    if (conteudo.includes(termo)) {
      pontuacao += 15
      palavras.push(termo)
    }
  }

  // Termos de média relevância
  for (const termo of TERMOS_MEDIA) {
    if (conteudo.includes(termo)) {
      pontuacao += 10
      palavras.push(termo)
    }
  }

  // Menção a MG
  if (/minas gerais|copam|semad|feam|ief|igam/.test(conteudo)) {
    pontuacao += 10
    palavras.push("minas gerais")
  }

  return {
    pontuacao: Math.min(100, pontuacao),
    palavras: [...new Set(palavras)],
  }
}

// ============================================================
// Parser RSS via regex
// ============================================================

interface ItemRSS {
  titulo: string
  descricao: string
  url: string
  data: string | null
}

function parsearRSS(xml: string): ItemRSS[] {
  const itens: ItemRSS[] = []

  // RSS 2.0 <item>
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const bloco = match[1]

    const getTag = (tag: string): string => {
      // CDATA
      const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i")
      const cdataMatch = bloco.match(cdataRe)
      if (cdataMatch) return cdataMatch[1].replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim()
      // Normal
      const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i")
      const m = bloco.match(re)
      return m ? m[1].replace(/<[^>]*>/g, "").trim() : ""
    }

    const titulo = getTag("title")
    const descricao = getTag("description")
    const url = getTag("link")
    const data = getTag("pubDate") || getTag("dc:date") || null

    if (titulo && url) {
      itens.push({ titulo, descricao, url, data })
    }
  }

  // Atom <entry>
  if (itens.length === 0) {
    const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi
    while ((match = entryRegex.exec(xml)) !== null) {
      const bloco = match[1]

      const titulo = (() => {
        const m = bloco.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)
        return m ? m[1].replace(/<[^>]*>/g, "").trim() : ""
      })()

      const url = (() => {
        const m = bloco.match(/<link[^>]*href="([^"]*)"[^>]*\/?\s*>/i)
        return m ? m[1] : ""
      })()

      const descricao = (() => {
        const m = bloco.match(/<(?:summary|content)[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:summary|content)>/i)
        return m ? m[1].replace(/<[^>]*>/g, "").trim().slice(0, 500) : ""
      })()

      const data = (() => {
        const m = bloco.match(/<(?:published|updated)[^>]*>([\s\S]*?)<\/(?:published|updated)>/i)
        return m ? m[1].trim() : null
      })()

      if (titulo && url) {
        itens.push({ titulo, descricao, url, data })
      }
    }
  }

  return itens
}

// ============================================================
// Categorização
// ============================================================

function categorizar(titulo: string, descricao: string): string {
  const t = `${titulo} ${descricao}`.toLowerCase()

  if (/auto de infração|auto de infracao|embargo|multa|fiscalização|fiscalizacao/.test(t))
    return "fiscalizacao"
  if (/licenciamento|licença|licenca|condicionante|eia|rima|estudo.?impacto/.test(t))
    return "licenciamento"
  if (/patrimônio|patrimonio|tombamento/.test(t))
    return "patrimonio"
  if (/outorga|recurso hídrico|recurso hidrico|bacia|água|agua/.test(t))
    return "recursos_hidricos"
  if (/desmatamento|supressão|supressao|fauna|flora|unidade.?conservação|unidade.?conservacao/.test(t))
    return "desmatamento"
  if (/mineração|mineracao|barragem/.test(t))
    return "mineracao"

  return "geral"
}

// ============================================================
// API Route
// ============================================================

export async function POST() {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const inicio = Date.now()
  const admin = createAdminClient()

  // Buscar notícias dos últimos 7 dias
  const seteDiasAtras = new Date()
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

  let totalItens = 0
  let relevantes = 0
  let inseridas = 0
  let duplicatas = 0
  const erros: string[] = []

  for (const fonte of FONTES) {
    try {
      console.log(`[RSS] Buscando ${fonte.nome}...`)

      const resp = await fetch(fonte.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RadarAmbiental/1.0)",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
        signal: AbortSignal.timeout(15_000),
      })

      if (!resp.ok) {
        erros.push(`${fonte.nome}: HTTP ${resp.status}`)
        continue
      }

      const xml = await resp.text()
      const itens = parsearRSS(xml)

      console.log(`[RSS] ${fonte.nome}: ${itens.length} itens no feed`)
      totalItens += itens.length

      for (const item of itens) {
        // Filtrar por data (últimos 7 dias)
        if (item.data) {
          const dataItem = new Date(item.data)
          if (!isNaN(dataItem.getTime()) && dataItem < seteDiasAtras) continue
        }

        // Calcular relevância
        const { pontuacao, palavras } = calcularRelevancia(
          item.titulo,
          item.descricao,
          fonte.tipo
        )

        // Mínimo 30 para entrar
        if (pontuacao < 30) continue
        relevantes++

        const categoria = categorizar(item.titulo, item.descricao)

        // Converter data
        let dataPublicacao: string | null = null
        if (item.data) {
          const d = new Date(item.data)
          if (!isNaN(d.getTime())) {
            dataPublicacao = d.toISOString().split("T")[0]
          }
        }

        const { error: insertError } = await admin
          .from("radar_itens")
          .insert({
            titulo: item.titulo.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim().slice(0, 500),
            resumo: item.descricao
              ? item.descricao
                  .replace(/<[^>]*>/g, " ")
                  .replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/<[^>]*>/g, " ")
                  .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
                  .replace(/&[a-z]+;/gi, " ")
                  .replace(/\bhttps?:\/\/\S+/gi, "")
                  .replace(/\s+/g, " ")
                  .trim()
                  .slice(0, 300) || null
              : null,
            url: item.url,
            fonte: "RSS",
            fonte_nome: fonte.nome,
            categoria,
            relevancia: pontuacao,
            palavras_chave: palavras,
            data_publicacao: dataPublicacao,
            incluir_email: false,
          })

        if (!insertError) {
          inseridas++
        } else if (insertError.code === "23505") {
          duplicatas++
        } else {
          erros.push(`Insert ${fonte.nome}: ${insertError.message}`)
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      erros.push(`${fonte.nome}: ${msg}`)
      console.error(`[RSS] ERRO ${fonte.nome}: ${msg}`)
    }
  }

  const duracao = Date.now() - inicio
  console.log(
    `[RSS] Concluído em ${duracao}ms: ${totalItens} itens, ${relevantes} relevantes, ${inseridas} inseridas, ${duplicatas} duplicatas`
  )

  return NextResponse.json({
    sucesso: true,
    duracao_ms: duracao,
    total_itens_feed: totalItens,
    relevantes,
    inseridas,
    duplicatas,
    erros: erros.length > 0 ? erros : undefined,
  })
}

import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/admin/newsletter/radar-recentes
 *
 * Leitura das normas ja coletadas em radar_itens, para consumo por clientes
 * externos (ex.: o briefing diario que roda como routine do Claude Code).
 *
 * NAO coleta nada — apenas le o que os coletores (coletar-mg / coletar-dou /
 * coletar) ja gravaram. Assim o Puppeteer da CTL fica fora do caminho critico
 * de quem consome: se a coleta de um dia atrasar ou falhar, este endpoint ainda
 * devolve o que foi coletado nos dias anteriores (falha segura).
 *
 * Auth (menor privilegio): chave dedicada READ-ONLY RADAR_READ_KEY, via
 *   header  Authorization: Bearer <RADAR_READ_KEY>   ou   query ?key=<RADAR_READ_KEY>
 * OU sessao de admin logada. NAO aceita CRON_SECRET de proposito: quem so le
 * normas nao deve carregar a chave que dispara coleta/envio. Se a RADAR_READ_KEY
 * vazar do cliente, o dano maximo e ler citacoes de normas (informacao publica).
 *
 * Query params:
 *   - dias   (default 3, max 15) — janela por data de COLETA (coletado_em)
 *   - fontes (default "MG,DOU")  — lista separada por virgula: MG | DOU | RSS
 *   - limite (default 200, max 500)
 */

export const dynamic = "force-dynamic"
export const maxDuration = 30

const FONTES_VALIDAS = new Set(["MG", "DOU", "RSS"])

export async function GET(request: Request) {
  const url = new URL(request.url)

  // Auth: chave dedicada de leitura OU sessao admin.
  const readKey = process.env.RADAR_READ_KEY
  const cabecalho = request.headers.get("authorization") ?? ""
  const bearer = cabecalho.startsWith("Bearer ") ? cabecalho.slice(7).trim() : ""
  const chaveQuery = url.searchParams.get("key") ?? ""
  const temChaveValida = !!readKey && (bearer === readKey || chaveQuery === readKey)

  if (!temChaveValida) {
    const auth = await verificarAdmin()
    if (!auth.authorized) return auth.response
  }

  const dias = Math.min(Math.max(parseInt(url.searchParams.get("dias") || "3", 10) || 3, 1), 15)
  const limite = Math.min(Math.max(parseInt(url.searchParams.get("limite") || "200", 10) || 200, 1), 500)

  const fontes = (url.searchParams.get("fontes") || "MG,DOU")
    .split(",")
    .map((f) => f.trim().toUpperCase())
    .filter((f) => FONTES_VALIDAS.has(f))
  const fontesEfetivas = fontes.length > 0 ? fontes : ["MG", "DOU"]

  const corte = new Date()
  corte.setDate(corte.getDate() - dias)

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("radar_itens")
    .select(
      "id, titulo, resumo, url, fonte, fonte_nome, orgao, tipo, numero, categoria, relevancia, data_publicacao, coletado_em",
    )
    .in("fonte", fontesEfetivas)
    .gte("coletado_em", corte.toISOString())
    .order("data_publicacao", { ascending: false, nullsFirst: false })
    .order("relevancia", { ascending: false })
    .limit(limite)

  if (error) {
    console.error("[radar-recentes] Erro:", error.message)
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 })
  }

  return NextResponse.json({
    sucesso: true,
    gerado_em: new Date().toISOString(),
    janela_dias: dias,
    fontes: fontesEfetivas,
    total: data?.length ?? 0,
    itens: data ?? [],
  })
}

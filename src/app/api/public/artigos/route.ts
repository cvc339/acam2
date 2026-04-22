import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/public/artigos
 * Lista publica de artigos com status='publicado'.
 * Retorna apenas metadados (sem conteudo completo) para economia de banda.
 *
 * Query params:
 *   - limit     (default 20, max 200)     — quantidade por pagina
 *   - offset    (default 0)               — paginacao (pular N registros)
 *   - categoria (string)                  — filtrar por categoria
 *   - desde     (YYYY-MM-DD)              — filtrar por data de publicacao >= desde
 *   - ate       (YYYY-MM-DD)              — filtrar por data de publicacao <= ate
 *
 * Retorno:
 *   {
 *     artigos:  [{ slug, titulo, resumo, categoria, autor, capa_url, publicado_em }],
 *     total:    N (total matching sem limit/offset — util para UI "X de Y"),
 *     tem_mais: boolean (offset + artigos.length < total)
 *   }
 *
 * Compatibilidade: quem chamava antes (sem offset/desde/ate) continua funcionando.
 * Limite default mudou de 50 para 20 — melhor para fluxo "Ver mais".
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10) || 20, 200)
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10) || 0, 0)
  const categoria = url.searchParams.get("categoria")
  const desde = url.searchParams.get("desde")
  const ate = url.searchParams.get("ate")

  const dataRegex = /^\d{4}-\d{2}-\d{2}$/
  if (desde && !dataRegex.test(desde)) {
    return NextResponse.json({ erro: "Parametro 'desde' deve ser YYYY-MM-DD" }, { status: 400 })
  }
  if (ate && !dataRegex.test(ate)) {
    return NextResponse.json({ erro: "Parametro 'ate' deve ser YYYY-MM-DD" }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Count total (sem limit/offset) — aplica filtros mas nao retorna rows
  let countQuery = admin
    .from("artigos")
    .select("*", { count: "exact", head: true })
    .eq("status", "publicado")
  if (categoria) countQuery = countQuery.eq("categoria", categoria)
  if (desde) countQuery = countQuery.gte("publicado_em", `${desde}T00:00:00Z`)
  if (ate) countQuery = countQuery.lte("publicado_em", `${ate}T23:59:59.999Z`)

  const { count, error: erroCount } = await countQuery

  if (erroCount) {
    return NextResponse.json({ erro: erroCount.message }, { status: 500 })
  }

  const total = count ?? 0

  // 2. Pagina de artigos (mesmos filtros + limit/offset/order)
  let dataQuery = admin
    .from("artigos")
    .select("slug, titulo, resumo, categoria, autor, capa_url, publicado_em")
    .eq("status", "publicado")
  if (categoria) dataQuery = dataQuery.eq("categoria", categoria)
  if (desde) dataQuery = dataQuery.gte("publicado_em", `${desde}T00:00:00Z`)
  if (ate) dataQuery = dataQuery.lte("publicado_em", `${ate}T23:59:59.999Z`)

  const { data, error } = await dataQuery
    .order("publicado_em", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  const artigos = data ?? []
  const tem_mais = offset + artigos.length < total

  return NextResponse.json(
    { artigos, total, tem_mais },
    {
      headers: {
        // Cache 10 minutos no CDN, com revalidacao em background
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
      },
    }
  )
}

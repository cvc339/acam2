import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/public/artigos
 * Lista publica de artigos com status='publicado'.
 * Retorna apenas metadados (sem conteudo completo) para economia de banda.
 *
 * Query params:
 *   - limit (default 50, max 200)
 *   - categoria (filtro opcional)
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 200)
  const categoria = url.searchParams.get("categoria")

  const admin = createAdminClient()
  let query = admin
    .from("artigos")
    .select("slug, titulo, resumo, categoria, autor, capa_url, publicado_em")
    .eq("status", "publicado")
    .order("publicado_em", { ascending: false, nullsFirst: false })
    .limit(limit)

  if (categoria) query = query.eq("categoria", categoria)

  const { data, error } = await query

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

  return NextResponse.json({ artigos: data ?? [] }, {
    headers: {
      // Cache 10 minutos no CDN, com revalidacao em background
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
    },
  })
}

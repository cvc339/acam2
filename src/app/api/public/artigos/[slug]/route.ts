import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

type Ctx = { params: Promise<{ slug: string }> }

/**
 * GET /api/public/artigos/[slug]
 * Detalhe publico de um artigo (status='publicado').
 * Retorna inclusive o campo 'conteudo' (markdown).
 */
export async function GET(_request: Request, ctx: Ctx) {
  const { slug } = await ctx.params

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("artigos")
    .select("slug, titulo, resumo, conteudo, categoria, autor, capa_url, publicado_em")
    .eq("status", "publicado")
    .eq("slug", slug)
    .maybeSingle()

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ erro: "Artigo nao encontrado" }, { status: 404 })

  return NextResponse.json({ artigo: data }, {
    headers: {
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
    },
  })
}

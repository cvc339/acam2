import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/public/artigos/categorias
 * Lista as categorias distintas de artigos publicados com a contagem de cada uma.
 *
 * Usado pelo site Vieira Castro Advogados para popular dropdown de filtro.
 *
 * Retorno:
 *   { categorias: [{ valor: string, total: number }] }
 *
 * Ordenacao: por total desc, depois alfabetica.
 */
export async function GET() {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("artigos")
    .select("categoria")
    .eq("status", "publicado")

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  const contagem = new Map<string, number>()
  for (const row of data ?? []) {
    const cat = row.categoria || "geral"
    contagem.set(cat, (contagem.get(cat) ?? 0) + 1)
  }

  const categorias = Array.from(contagem.entries())
    .map(([valor, total]) => ({ valor, total }))
    .sort((a, b) => b.total - a.total || a.valor.localeCompare(b.valor))

  return NextResponse.json(
    { categorias },
    {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
      },
    }
  )
}

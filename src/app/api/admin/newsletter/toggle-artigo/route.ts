import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/admin/newsletter/toggle-artigo
 *
 * Marca/desmarca artigo para inclusão na próxima newsletter.
 * Só permite toggle em artigos com status='publicado' que ainda não foram enviados.
 *
 * Body: { id: string, incluir: boolean }
 */
export async function POST(request: Request) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const body = await request.json()
  const { id, incluir } = body as { id: string; incluir: boolean }

  if (!id || typeof incluir !== "boolean") {
    return NextResponse.json({ erro: "id e incluir são obrigatórios" }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from("artigos")
    .update({ incluir_newsletter: incluir })
    .eq("id", id)
    .eq("status", "publicado")
    .is("enviado_newsletter_em", null)

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  return NextResponse.json({ sucesso: true })
}

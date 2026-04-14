import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/admin/newsletter/toggle
 * Atualiza item do radar: incluir_email e/ou url.
 */
export async function POST(request: Request) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const body = await request.json()
  const { id, incluir_email, url } = body as { id: number; incluir_email?: boolean; url?: string }

  const admin = createAdminClient()
  const updates: Record<string, unknown> = {}
  if (incluir_email !== undefined) updates.incluir_email = incluir_email
  if (url !== undefined) updates.url = url

  const { error } = await admin
    .from("radar_itens")
    .update(updates)
    .eq("id", id)

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  return NextResponse.json({ sucesso: true })
}

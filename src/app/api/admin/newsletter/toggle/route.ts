import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/admin/newsletter/toggle
 * Alterna incluir_email de um item do radar.
 */
export async function POST(request: Request) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const { id, incluir_email } = await request.json()

  const admin = createAdminClient()
  const { error } = await admin
    .from("radar_itens")
    .update({ incluir_email })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  return NextResponse.json({ sucesso: true })
}

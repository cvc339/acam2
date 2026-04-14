import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/admin/newsletter/assinantes
 * Adiciona um assinante à newsletter.
 */
export async function POST(request: Request) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const { nome, email } = await request.json()

  if (!email || !email.includes("@")) {
    return NextResponse.json({ erro: "E-mail inválido" }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from("radar_destinatarios")
    .upsert(
      { nome: nome || "", email: email.trim().toLowerCase(), ativo: true, origem: "admin" },
      { onConflict: "email" },
    )

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  return NextResponse.json({ sucesso: true })
}

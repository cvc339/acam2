import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/leads
 *
 * Captura lead (público, sem auth).
 * Deduplicação por email (upsert).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, nome, aceita_marketing } = body as {
      email: string
      nome?: string
      aceita_marketing?: boolean
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ erro: "E-mail inválido" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { error } = await admin
      .from("leads")
      .upsert(
        {
          email: email.trim().toLowerCase(),
          nome: nome?.trim() || null,
          aceita_marketing: aceita_marketing ?? false,
          origem: "landing",
        },
        { onConflict: "email" },
      )

    if (error) {
      console.error("[leads] Erro:", error)
      return NextResponse.json({ erro: "Erro ao registrar" }, { status: 500 })
    }

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error("[leads] Erro:", (error as Error).message)
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 })
  }
}

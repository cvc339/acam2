import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * PUT /api/admin/configuracoes
 *
 * Atualiza uma configuração no banco.
 * Body: { chave: string, valor: object }
 */
export async function PUT(request: Request) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  try {
    const body = await request.json()
    const { chave, valor } = body as { chave: string; valor: unknown }

    if (!chave || !valor) {
      return NextResponse.json({ erro: "Chave e valor são obrigatórios" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { error } = await admin
      .from("configuracoes")
      .update({ valor, updated_at: new Date().toISOString() })
      .eq("chave", chave)

    if (error) {
      console.error("[admin/config] Erro update:", error)
      return NextResponse.json({ erro: "Erro ao atualizar configuração" }, { status: 500 })
    }

    return NextResponse.json({ sucesso: true, chave })
  } catch (error) {
    console.error("[admin/config] Erro:", (error as Error).message)
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 })
  }
}

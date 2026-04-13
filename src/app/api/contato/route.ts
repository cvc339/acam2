import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/contato
 *
 * Envia mensagem de contato (Fale Conosco).
 * Requer autenticação.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { tipo, mensagem } = body as { tipo: string; mensagem: string }

    if (!tipo || !["sugestao", "elogio", "reclamacao", "duvida"].includes(tipo)) {
      return NextResponse.json({ erro: "Tipo inválido" }, { status: 400 })
    }
    if (!mensagem || mensagem.trim().length < 10) {
      return NextResponse.json({ erro: "Mensagem deve ter ao menos 10 caracteres" }, { status: 400 })
    }

    // Buscar nome e email do perfil
    const admin = createAdminClient()
    const { data: perfil } = await admin
      .from("perfis")
      .select("nome, email")
      .eq("id", user.id)
      .single()

    const { error } = await admin.from("mensagens_contato").insert({
      usuario_id: user.id,
      nome: perfil?.nome || "",
      email: perfil?.email || user.email || "",
      tipo,
      mensagem: mensagem.trim(),
    })

    if (error) {
      console.error("[contato] Erro:", error)
      return NextResponse.json({ erro: "Erro ao enviar mensagem" }, { status: 500 })
    }

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error("[contato] Erro:", (error as Error).message)
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 })
  }
}

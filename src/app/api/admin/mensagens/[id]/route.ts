import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { enviarEmail, templateRespostaContato } from "@/lib/email/enviar"

/**
 * PUT /api/admin/mensagens/[id]
 *
 * Responde a uma mensagem de contato.
 * Body: { resposta: string }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const { id } = await params

  try {
    const body = await request.json()
    const { resposta } = body as { resposta: string }

    if (!resposta || resposta.trim().length < 3) {
      return NextResponse.json({ erro: "Resposta deve ter ao menos 3 caracteres" }, { status: 400 })
    }

    const admin = createAdminClient()

    const { error } = await admin
      .from("mensagens_contato")
      .update({
        resposta: resposta.trim(),
        respondido_em: new Date().toISOString(),
        lida: true,
      })
      .eq("id", id)

    if (error) {
      console.error("[admin/mensagens] Erro:", error)
      return NextResponse.json({ erro: "Erro ao salvar resposta" }, { status: 500 })
    }

    // Enviar email de notificação ao usuário (fire-and-forget)
    try {
      const { data: mensagem } = await admin
        .from("mensagens_contato")
        .select("nome, email, mensagem")
        .eq("id", id)
        .single()

      if (mensagem?.email) {
        enviarEmail(
          mensagem.email,
          "Respondemos sua mensagem — ACAM",
          templateRespostaContato({
            nome: mensagem.nome || "Usuário",
            mensagemOriginal: mensagem.mensagem,
            resposta: resposta.trim(),
          }),
        )
      }
    } catch (err) {
      console.error("[admin/mensagens] Erro ao enviar email:", err)
    }

    return NextResponse.json({ sucesso: true })
  } catch (error) {
    console.error("[admin/mensagens] Erro:", (error as Error).message)
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 })
  }
}

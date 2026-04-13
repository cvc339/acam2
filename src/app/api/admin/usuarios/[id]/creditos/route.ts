import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/admin/usuarios/[id]/creditos
 *
 * Ajuste manual de créditos (adicionar ou remover).
 * Body: { quantidade: number, motivo: string, operacao: "adicionar" | "remover" }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const { id: usuarioId } = await params

  try {
    const body = await request.json()
    const { quantidade, motivo, operacao } = body as {
      quantidade: number
      motivo: string
      operacao: "adicionar" | "remover"
    }

    if (!quantidade || quantidade <= 0) {
      return NextResponse.json({ erro: "Quantidade deve ser maior que zero" }, { status: 400 })
    }
    if (!motivo || motivo.trim().length < 3) {
      return NextResponse.json({ erro: "Informe o motivo do ajuste" }, { status: 400 })
    }
    if (!["adicionar", "remover"].includes(operacao)) {
      return NextResponse.json({ erro: "Operação inválida" }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verificar se o usuário existe
    const { data: perfil } = await admin
      .from("perfis")
      .select("id, nome, email")
      .eq("id", usuarioId)
      .single()

    if (!perfil) {
      return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404 })
    }

    // Se remover, verificar saldo suficiente
    if (operacao === "remover") {
      const { data: saldo } = await admin
        .from("saldo_creditos")
        .select("saldo")
        .eq("usuario_id", usuarioId)
        .single()

      const saldoAtual = Number(saldo?.saldo ?? 0)
      if (saldoAtual < quantidade) {
        return NextResponse.json({
          erro: `Saldo insuficiente. Saldo atual: ${saldoAtual} créditos.`,
        }, { status: 400 })
      }
    }

    // Inserir transação de ajuste
    const quantidadeFinal = operacao === "remover" ? -quantidade : quantidade
    const descricaoFinal = `Ajuste admin: ${motivo}`

    const { error } = await admin
      .from("transacoes_creditos")
      .insert({
        usuario_id: usuarioId,
        tipo: "ajuste",
        quantidade: quantidadeFinal,
        descricao: descricaoFinal,
      })

    if (error) {
      console.error("[admin/creditos] Erro insert:", error)
      return NextResponse.json({ erro: "Erro ao registrar ajuste" }, { status: 500 })
    }

    // Buscar saldo atualizado
    const { data: novoSaldo } = await admin
      .from("saldo_creditos")
      .select("saldo")
      .eq("usuario_id", usuarioId)
      .single()

    return NextResponse.json({
      sucesso: true,
      operacao,
      quantidade,
      saldo_atual: Number(novoSaldo?.saldo ?? 0),
    })
  } catch (error) {
    console.error("[admin/creditos] Erro:", (error as Error).message)
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { creditos } from "@/lib/creditos"

/**
 * POST /api/creditos/debitar
 * Debita créditos do usuário autenticado.
 * Delega para o módulo centralizado de créditos.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
    }

    const { quantidade, descricao, ferramenta_id, consulta_id } = await request.json()

    if (!quantidade || quantidade <= 0) {
      return NextResponse.json({ erro: "Quantidade inválida" }, { status: 400 })
    }

    const resultado = await creditos.debitar(user.id, quantidade, {
      descricao,
      ferramenta_id,
      consulta_id,
    })

    if (!resultado.sucesso) {
      const status = resultado.erro?.includes("Saldo insuficiente") ? 400 : 500
      return NextResponse.json({
        erro: resultado.erro || "Erro ao debitar créditos",
        saldo: resultado.saldo_restante,
      }, { status })
    }

    return NextResponse.json({
      sucesso: true,
      creditos_debitados: quantidade,
      saldo_restante: resultado.saldo_restante,
    })
  } catch (error) {
    console.error("[API /creditos/debitar] Erro:", error)
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 })
  }
}

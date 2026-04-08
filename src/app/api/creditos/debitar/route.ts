import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/creditos/debitar
 * Debita créditos do usuário autenticado.
 * Regra: debitar antes, reembolsar se falhar.
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

    const admin = createAdminClient()

    // Verificar saldo
    const { data: saldo } = await admin
      .from("saldo_creditos")
      .select("saldo")
      .eq("usuario_id", user.id)
      .single()

    const saldoAtual = saldo?.saldo ?? 0

    if (saldoAtual < quantidade) {
      return NextResponse.json({
        erro: `Saldo insuficiente. Você tem ${saldoAtual} créditos, mas precisa de ${quantidade}.`,
        saldo: saldoAtual,
      }, { status: 400 })
    }

    // Registrar transação de débito
    const { error } = await admin.from("transacoes_creditos").insert({
      usuario_id: user.id,
      tipo: "uso",
      quantidade,
      descricao: descricao || `Uso de ferramenta: ${ferramenta_id || "não especificada"}`,
      consulta_id: consulta_id || null,
    })

    if (error) {
      console.error("Erro ao debitar créditos:", error)
      return NextResponse.json({ erro: "Erro ao debitar créditos" }, { status: 500 })
    }

    return NextResponse.json({
      sucesso: true,
      creditos_debitados: quantidade,
      saldo_restante: saldoAtual - quantidade,
    })
  } catch (error) {
    console.error("Erro na API de débito:", error)
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 })
  }
}

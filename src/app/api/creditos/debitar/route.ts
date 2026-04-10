import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/creditos/debitar
 * Debita créditos do usuário autenticado via função atômica do Postgres.
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

    // Débito atômico via função Postgres (resolve race condition)
    const { data, error } = await admin.rpc("debitar_creditos", {
      p_usuario_id: user.id,
      p_quantidade: quantidade,
      p_descricao: descricao || `Uso de ferramenta: ${ferramenta_id || "não especificada"}`,
      p_ferramenta_id: ferramenta_id || null,
      p_consulta_id: consulta_id || null,
    })

    if (error) {
      console.error("Erro ao debitar créditos:", error)
      return NextResponse.json({ erro: "Erro ao debitar créditos" }, { status: 500 })
    }

    const resultado = Array.isArray(data) ? data[0] : data

    if (!resultado?.sucesso) {
      return NextResponse.json({
        erro: resultado?.erro || "Saldo insuficiente.",
        saldo: resultado?.saldo_restante ?? 0,
      }, { status: 400 })
    }

    return NextResponse.json({
      sucesso: true,
      creditos_debitados: quantidade,
      saldo_restante: resultado.saldo_restante,
    })
  } catch (error) {
    console.error("Erro na API de débito:", error)
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { consultoria } from "@/lib/consultoria"

/**
 * POST /api/consultoria/cancelar
 *
 * Body: { agendamentoId }
 * Cancelamento pelo próprio usuário (não reembolsa — ele escolheu desistir).
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  }

  let body: { agendamentoId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 })
  }

  if (!body.agendamentoId) {
    return NextResponse.json({ erro: "agendamentoId obrigatório" }, { status: 400 })
  }

  const resultado = await consultoria.cancelarPeloUsuario(body.agendamentoId, user.id)

  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 })
  }

  return NextResponse.json({ sucesso: true })
}

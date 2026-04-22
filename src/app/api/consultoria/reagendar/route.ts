import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { consultoria } from "@/lib/consultoria"

/**
 * POST /api/consultoria/reagendar
 *
 * Body: { agendamentoId, novoSlotId }
 * Regras: 4h de antecedência + limite de 1 uso.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  }

  let body: { agendamentoId?: string; novoSlotId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 })
  }

  if (!body.agendamentoId || !body.novoSlotId) {
    return NextResponse.json(
      { erro: "agendamentoId e novoSlotId são obrigatórios" },
      { status: 400 }
    )
  }

  const resultado = await consultoria.reagendar(
    body.agendamentoId,
    body.novoSlotId,
    user.id
  )

  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 })
  }

  return NextResponse.json({ sucesso: true })
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { consultoria } from "@/lib/consultoria"

/**
 * POST /api/consultoria/agendar
 *
 * Body: { slotId, emailReuniao, observacoes?, anexoUrl?, anexoNome? }
 *
 * Transação atômica (em consultoria.agendar):
 * 1. Reserva o slot
 * 2. Debita 15 créditos
 * 3. Cria o agendamento
 * 4. Cria evento no Google Calendar com Meet link
 *
 * Rollback em qualquer falha pós-débito.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ erro: "Não autenticado" }, { status: 401 })
  }

  let body: {
    slotId?: string
    emailReuniao?: string
    observacoes?: string
    anexoUrl?: string
    anexoNome?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 })
  }

  if (!body.slotId || !body.emailReuniao) {
    return NextResponse.json(
      { erro: "slotId e emailReuniao são obrigatórios" },
      { status: 400 }
    )
  }

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.emailReuniao)
  if (!emailValido) {
    return NextResponse.json({ erro: "E-mail inválido" }, { status: 400 })
  }

  const resultado = await consultoria.agendar({
    usuarioId: user.id,
    slotId: body.slotId,
    emailReuniao: body.emailReuniao,
    observacoes: body.observacoes,
    anexoUrl: body.anexoUrl,
    anexoNome: body.anexoNome,
  })

  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 })
  }

  return NextResponse.json({
    sucesso: true,
    agendamentoId: resultado.agendamento_id,
  })
}

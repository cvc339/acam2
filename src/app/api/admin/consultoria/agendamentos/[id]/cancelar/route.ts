import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { consultoria } from "@/lib/consultoria"

/**
 * POST /api/admin/consultoria/agendamentos/[id]/cancelar
 *
 * Cancelamento pelo admin COM reembolso automático dos 15 créditos.
 * Deleta o evento no Google Calendar.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const { id } = await params
  const resultado = await consultoria.cancelarPeloAdmin(id)

  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 })
  }

  return NextResponse.json({ sucesso: true, reembolsado: resultado.reembolsado })
}

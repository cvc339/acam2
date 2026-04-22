import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { consultoria } from "@/lib/consultoria"

/**
 * POST /api/admin/consultoria/agendamentos/[id]/concluir
 *
 * Marca como concluído após realização da reunião.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const { id } = await params
  const resultado = await consultoria.concluir(id)

  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 })
  }

  return NextResponse.json({ sucesso: true })
}

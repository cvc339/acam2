import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { consultoria } from "@/lib/consultoria"

/**
 * DELETE /api/admin/consultoria/slots/[id]
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const { id } = await params
  const resultado = await consultoria.deletarSlot(id)

  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 })
  }

  return NextResponse.json({ sucesso: true })
}

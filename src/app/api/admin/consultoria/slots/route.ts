import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { consultoria } from "@/lib/consultoria"

/**
 * POST /api/admin/consultoria/slots
 *
 * Cria um slot único.
 * Body: { data: "YYYY-MM-DD", horaInicio: "HH:MM", horaFim: "HH:MM" }
 */
export async function POST(request: Request) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  let body: { data?: string; horaInicio?: string; horaFim?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: "JSON inválido" }, { status: 400 })
  }

  if (!body.data || !body.horaInicio || !body.horaFim) {
    return NextResponse.json(
      { erro: "data, horaInicio e horaFim são obrigatórios" },
      { status: 400 }
    )
  }

  const resultado = await consultoria.criarSlot(body.data, body.horaInicio, body.horaFim)

  if (!resultado.sucesso) {
    return NextResponse.json({ erro: resultado.erro }, { status: 400 })
  }

  return NextResponse.json({ sucesso: true, id: resultado.id })
}

import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { desconectar } from "@/lib/services/google-calendar"

/**
 * POST /api/admin/google/desconectar
 *
 * Remove as credenciais salvas (o admin precisará re-autorizar para voltar a usar).
 */
export async function POST() {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  await desconectar()
  return NextResponse.json({ sucesso: true })
}

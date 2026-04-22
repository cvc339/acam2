import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { gerarUrlAuth } from "@/lib/services/google-calendar"

/**
 * GET /api/admin/google/auth
 *
 * Redireciona o admin para a tela de autorização do Google.
 * Após autorizar, o Google redireciona de volta para /api/admin/google/callback.
 */
export async function GET() {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  try {
    const url = gerarUrlAuth()
    return NextResponse.redirect(url)
  } catch (err) {
    console.error("[admin/google/auth]", err)
    return NextResponse.json(
      { erro: (err as Error).message },
      { status: 500 }
    )
  }
}

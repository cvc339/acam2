import { NextResponse } from "next/server"
import { verificarAdmin } from "@/lib/admin/auth"
import { trocarCodePorToken } from "@/lib/services/google-calendar"

/**
 * GET /api/admin/google/callback
 *
 * Recebe o `code` do Google após autorização, troca por tokens
 * e salva refresh_token em google_calendar_auth.
 */
export async function GET(request: Request) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const erroOAuth = url.searchParams.get("error")

  if (erroOAuth) {
    return NextResponse.redirect(
      new URL(`/admin/google?erro=${encodeURIComponent(erroOAuth)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/admin/google?erro=code_ausente`, request.url)
    )
  }

  const resultado = await trocarCodePorToken(code)

  if (!resultado.sucesso) {
    return NextResponse.redirect(
      new URL(`/admin/google?erro=${encodeURIComponent(resultado.erro ?? "falha")}`, request.url)
    )
  }

  return NextResponse.redirect(new URL("/admin/google?conectado=1", request.url))
}

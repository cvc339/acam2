import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { enviarEmail, templateBoasVindas } from "@/lib/email/enviar"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash") || searchParams.get("code")
  const type = searchParams.get("type") as "signup" | "recovery" | "magiclink" | "email" | null
  const next = searchParams.get("next") ?? "/dashboard"

  const supabase = await createClient()
  let authenticated = false

  // Fluxo 1: Token hash (email templates com {{ .TokenHash }})
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type === "signup" ? "email" : type === "recovery" ? "recovery" : "email",
    })
    if (!error) authenticated = true
  }
  // Fluxo 2: Code exchange (OAuth, PKCE)
  else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) authenticated = true
  }

  if (authenticated) {
    // Enviar email de boas-vindas (apenas na primeira confirmação de signup)
    if (type === "signup") {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const admin = createAdminClient()
          const { data: perfil } = await admin
            .from("perfis")
            .select("nome, email")
            .eq("id", user.id)
            .single()

          if (perfil?.email) {
            const criado = new Date(user.created_at)
            const agora = new Date()
            const minutos = (agora.getTime() - criado.getTime()) / 60000
            if (minutos < 30) {
              enviarEmail(
                perfil.email,
                "Bem-vindo ao ACAM!",
                templateBoasVindas(perfil.nome || "Usuário"),
              )
            }
          }
        }
      } catch (err) {
        console.error("[callback] Erro ao enviar boas-vindas:", err)
      }
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  // Redirecionar para login em caso de erro
  return NextResponse.redirect(`${origin}/login`)
}

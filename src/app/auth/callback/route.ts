import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { enviarEmail, templateBoasVindas } from "@/lib/email/enviar"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Enviar email de boas-vindas (apenas na primeira confirmação)
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
            // Verificar se é primeira vez (criado nos últimos 5 min = acabou de confirmar)
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

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Redirecionar para login em caso de erro
  return NextResponse.redirect(`${origin}/login`)
}

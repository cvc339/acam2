/**
 * Verificação de acesso administrativo — server-side only
 *
 * Usado por todas as API routes em /api/admin/* e pelo layout admin.
 * Verifica autenticação E flag is_admin na tabela perfis.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

type ResultadoAutorizado = { authorized: true; userId: string }
type ResultadoNegado = { authorized: false; response: NextResponse }

export async function verificarAdmin(): Promise<ResultadoAutorizado | ResultadoNegado> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json({ erro: "Não autenticado" }, { status: 401 }),
    }
  }

  const admin = createAdminClient()
  const { data: perfil } = await admin
    .from("perfis")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!perfil?.is_admin) {
    return {
      authorized: false,
      response: NextResponse.json({ erro: "Acesso negado" }, { status: 403 }),
    }
  }

  return { authorized: true, userId: user.id }
}

/**
 * Aceita acesso admin OU um token de cron (header: Authorization: Bearer <CRON_SECRET>).
 *
 * Usado por endpoints que sao acionados tanto manualmente pelo admin quanto
 * por jobs agendados externos (GitHub Actions, etc.).
 *
 * Requer a variavel de ambiente CRON_SECRET configurada no servidor.
 */
export async function verificarAdminOuCron(request: Request): Promise<ResultadoAutorizado | ResultadoNegado> {
  const cabecalho = request.headers.get("authorization") ?? ""
  if (cabecalho.startsWith("Bearer ")) {
    const token = cabecalho.slice(7).trim()
    const secret = process.env.CRON_SECRET
    if (secret && token && token === secret) {
      return { authorized: true, userId: "cron" }
    }
  }
  return verificarAdmin()
}

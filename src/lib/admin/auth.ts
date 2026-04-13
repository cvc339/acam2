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

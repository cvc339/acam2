import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/configuracoes?chave=ufemg
 *
 * Retorna configuração pública (leitura).
 * Não requer autenticação — dados não sensíveis (UFEMG, preços).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chave = searchParams.get("chave")

  if (!chave) {
    return NextResponse.json({ erro: "Parâmetro 'chave' obrigatório" }, { status: 400 })
  }

  // Chaves públicas permitidas (não expor limites internos)
  const chavesPermitidas = ["ufemg", "precos"]
  if (!chavesPermitidas.includes(chave)) {
    return NextResponse.json({ erro: "Chave não disponível" }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("configuracoes")
    .select("valor")
    .eq("chave", chave)
    .single()

  if (error || !data) {
    return NextResponse.json({ erro: "Configuração não encontrada" }, { status: 404 })
  }

  return NextResponse.json({ chave, valor: data.valor })
}

import { NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

const schema = z.object({
  nome: z.string().trim().max(200).optional(),
  email: z.string().trim().toLowerCase().email(),
  origem: z.string().max(50).optional(),
})

/**
 * POST /api/public/radar/inscrever
 *
 * Endpoint publico (sem auth) para inscrever emails na lista do Radar Ambiental.
 * Chamado pelo formulario do site vieiracastro-site.
 *
 * Insere em radar_destinatarios com origem='site-vieiracastro' por padrao.
 * Deduplicacao por email: se ja existe, atualiza nome e reativa.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ erro: "Dados invalidos" }, { status: 400 })
  }

  const { nome, email, origem } = parsed.data
  const admin = createAdminClient()

  const { error } = await admin
    .from("radar_destinatarios")
    .upsert(
      {
        nome: nome || "",
        email,
        ativo: true,
        origem: origem || "site-vieiracastro",
      },
      { onConflict: "email" }
    )

  if (error) {
    console.error("[radar/inscrever] Erro:", error)
    return NextResponse.json({ erro: "Erro ao inscrever" }, { status: 500 })
  }

  return NextResponse.json({ sucesso: true })
}

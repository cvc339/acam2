import { NextResponse } from "next/server"
import { z } from "zod"
import { verificarAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"

const atualizarSchema = z.object({
  titulo: z.string().min(1).max(500).optional(),
  slug: z.string().min(1).max(100).optional(),
  resumo: z.string().nullable().optional(),
  conteudo: z.string().nullable().optional(),
  categoria: z.string().optional(),
  autor: z.string().optional(),
  capa_url: z.string().url().nullable().optional().or(z.literal("")),
  status: z.enum(["rascunho", "publicado", "arquivado"]).optional(),
})

type Ctx = { params: Promise<{ id: string }> }

/**
 * PUT /api/admin/artigos/[id]
 * Atualiza um artigo. Se mudar status para 'publicado' e nao houver publicado_em, preenche agora.
 */
export async function PUT(request: Request, ctx: Ctx) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const { id } = await ctx.params
  const body = await request.json().catch(() => null)
  const parsed = atualizarSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados invalidos", detalhes: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { data: atual } = await admin
    .from("artigos")
    .select("status, publicado_em")
    .eq("id", id)
    .single()

  if (!atual) return NextResponse.json({ erro: "Artigo nao encontrado" }, { status: 404 })

  const updates: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined) continue
    updates[k] = v === "" ? null : v
  }

  // Se esta publicando pela primeira vez, registra publicado_em
  if (updates.status === "publicado" && !atual.publicado_em) {
    updates.publicado_em = new Date().toISOString()
  }

  const { data, error } = await admin
    .from("artigos")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    const mensagem = error.code === "23505" ? "Ja existe artigo com esse slug" : error.message
    return NextResponse.json({ erro: mensagem }, { status: 400 })
  }

  return NextResponse.json({ sucesso: true, artigo: data })
}

/**
 * DELETE /api/admin/artigos/[id]
 */
export async function DELETE(_request: Request, ctx: Ctx) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const { id } = await ctx.params
  const admin = createAdminClient()
  const { error } = await admin.from("artigos").delete().eq("id", id)

  if (error) return NextResponse.json({ erro: error.message }, { status: 400 })
  return NextResponse.json({ sucesso: true })
}

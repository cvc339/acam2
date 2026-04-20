import { NextResponse } from "next/server"
import { z } from "zod"
import { verificarAdmin } from "@/lib/admin/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { gerarSlug } from "@/lib/admin/slug"

const criarSchema = z.object({
  titulo: z.string().min(1).max(500),
  slug: z.string().max(100).nullable().optional(),
  resumo: z.string().nullable().optional(),
  conteudo: z.string().nullable().optional(),
  categoria: z.string().nullable().optional(),
  autor: z.string().nullable().optional(),
  capa_url: z.string().url().nullable().optional().or(z.literal("")),
  status: z.enum(["rascunho", "publicado", "arquivado"]).optional(),
})

/**
 * POST /api/admin/artigos
 * Cria um novo artigo (em rascunho por default).
 */
export async function POST(request: Request) {
  const auth = await verificarAdmin()
  if (!auth.authorized) return auth.response

  const body = await request.json().catch(() => null)
  const parsed = criarSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { erro: "Dados invalidos", detalhes: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const dados = parsed.data
  const slug = (dados.slug && dados.slug.trim()) || gerarSlug(dados.titulo)
  if (!slug) {
    return NextResponse.json({ erro: "Nao foi possivel gerar slug" }, { status: 400 })
  }

  const status = dados.status ?? "rascunho"
  const publicado_em = status === "publicado" ? new Date().toISOString() : null

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("artigos")
    .insert({
      titulo: dados.titulo,
      slug,
      resumo: dados.resumo ?? null,
      conteudo: dados.conteudo ?? null,
      categoria: dados.categoria ?? "geral",
      autor: dados.autor ?? "Cláudio Vieira Castro",
      capa_url: dados.capa_url || null,
      status,
      publicado_em,
    })
    .select()
    .single()

  if (error) {
    const mensagem = error.code === "23505" ? "Ja existe artigo com esse slug" : error.message
    return NextResponse.json({ erro: mensagem }, { status: 400 })
  }

  return NextResponse.json({ sucesso: true, artigo: data })
}

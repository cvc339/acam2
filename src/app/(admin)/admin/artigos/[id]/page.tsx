import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { ArtigoForm } from "@/components/admin/artigo-form"
import { ArtigoDeleteButton } from "@/components/admin/artigo-delete-button"

export const metadata: Metadata = { title: "Admin — Editar artigo" }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarArtigoPage({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()
  const { data: artigo } = await admin
    .from("artigos")
    .select("id, titulo, slug, resumo, conteudo, categoria, autor, capa_url, status, publicado_em, criado_em, atualizado_em")
    .eq("id", id)
    .maybeSingle()

  if (!artigo) notFound()

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <Link href="/admin/artigos" className="text-xs text-muted-foreground" style={{ display: "inline-block", marginBottom: "0.5rem" }}>
            ← Voltar para lista
          </Link>
          <h2 style={{ color: "var(--primary-600)" }}>Editar artigo</h2>
          <p className="text-sm text-muted-foreground">
            Criado em {new Date(artigo.criado_em).toLocaleDateString("pt-BR")}
            {artigo.status === "publicado" && artigo.publicado_em && (
              <> · Publicado em {new Date(artigo.publicado_em).toLocaleDateString("pt-BR")}</>
            )}
          </p>
        </div>
        <ArtigoDeleteButton id={artigo.id} titulo={artigo.titulo} />
      </div>

      <div className="acam-card">
        <ArtigoForm artigo={artigo} />
      </div>
    </div>
  )
}

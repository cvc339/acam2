import type { Metadata } from "next"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { StatusBadge } from "@/components/acam"

export const metadata: Metadata = { title: "Admin — Artigos" }

interface Props {
  searchParams: Promise<{ status?: string }>
}

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  arquivado: "Arquivado",
}

export default async function AdminArtigosPage({ searchParams }: Props) {
  const { status: statusFiltro } = await searchParams

  const admin = createAdminClient()
  let query = admin
    .from("artigos")
    .select("id, titulo, slug, categoria, autor, status, publicado_em, criado_em, atualizado_em")
    .order("atualizado_em", { ascending: false })
    .limit(200)

  if (statusFiltro && ["rascunho", "publicado", "arquivado"].includes(statusFiltro)) {
    query = query.eq("status", statusFiltro)
  }

  const { data: artigos } = await query

  // Contagens
  const { count: rascunhos } = await admin.from("artigos").select("*", { count: "exact", head: true }).eq("status", "rascunho")
  const { count: publicados } = await admin.from("artigos").select("*", { count: "exact", head: true }).eq("status", "publicado")
  const { count: arquivados } = await admin.from("artigos").select("*", { count: "exact", head: true }).eq("status", "arquivado")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ color: "var(--primary-600)" }}>Artigos</h2>
          <p className="text-sm text-muted-foreground">Conteúdo editorial publicado no site do escritório</p>
        </div>
        <Link href="/admin/artigos/novo" className="acam-btn acam-btn-primary acam-btn-sm">
          Novo artigo
        </Link>
      </div>

      {/* Filtros por status */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <Link
          href="/admin/artigos"
          className={`acam-btn acam-btn-sm ${!statusFiltro ? "acam-btn-primary" : "acam-btn-ghost"}`}
        >
          Todos
        </Link>
        <Link
          href="/admin/artigos?status=rascunho"
          className={`acam-btn acam-btn-sm ${statusFiltro === "rascunho" ? "acam-btn-primary" : "acam-btn-ghost"}`}
        >
          Rascunhos ({rascunhos ?? 0})
        </Link>
        <Link
          href="/admin/artigos?status=publicado"
          className={`acam-btn acam-btn-sm ${statusFiltro === "publicado" ? "acam-btn-primary" : "acam-btn-ghost"}`}
        >
          Publicados ({publicados ?? 0})
        </Link>
        <Link
          href="/admin/artigos?status=arquivado"
          className={`acam-btn acam-btn-sm ${statusFiltro === "arquivado" ? "acam-btn-primary" : "acam-btn-ghost"}`}
        >
          Arquivados ({arquivados ?? 0})
        </Link>
      </div>

      {/* Lista */}
      {artigos && artigos.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {artigos.map((a) => {
            const dataRef = a.status === "publicado" && a.publicado_em
              ? `Publicado em ${new Date(a.publicado_em).toLocaleDateString("pt-BR")}`
              : `Atualizado em ${new Date(a.atualizado_em).toLocaleDateString("pt-BR")}`
            const badgeVariant = a.status === "publicado" ? "success" : a.status === "rascunho" ? "info" : "primary"
            return (
              <Link
                key={a.id}
                href={`/admin/artigos/${a.id}`}
                className="acam-card"
                style={{ padding: "0.75rem 1rem", display: "block", textDecoration: "none", color: "inherit" }}
              >
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                  <StatusBadge variant={badgeVariant}>{STATUS_LABEL[a.status]}</StatusBadge>
                  <span className="text-xs text-muted-foreground">{a.categoria}</span>
                </div>
                <div className="text-sm font-medium" style={{ marginTop: "0.1rem" }}>{a.titulo}</div>
                <div className="text-xs text-muted-foreground" style={{ marginTop: "0.25rem" }}>
                  {dataRef} · /{a.slug}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="acam-card" style={{ textAlign: "center", padding: "3rem" }}>
          <p className="text-muted-foreground" style={{ marginBottom: "1rem" }}>
            {statusFiltro ? `Nenhum artigo com status "${statusFiltro}".` : "Nenhum artigo ainda."}
          </p>
          <Link href="/admin/artigos/novo" className="acam-btn acam-btn-primary acam-btn-sm">
            Criar primeiro artigo
          </Link>
        </div>
      )}
    </div>
  )
}

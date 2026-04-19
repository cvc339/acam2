import type { Metadata } from "next"
import Link from "next/link"
import { ArtigoForm } from "@/components/admin/artigo-form"

export const metadata: Metadata = { title: "Admin — Novo artigo" }

export default function NovoArtigoPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div>
        <Link href="/admin/artigos" className="text-xs text-muted-foreground" style={{ display: "inline-block", marginBottom: "0.5rem" }}>
          ← Voltar para lista
        </Link>
        <h2 style={{ color: "var(--primary-600)" }}>Novo artigo</h2>
        <p className="text-sm text-muted-foreground">Preencha título e conteúdo. Os demais campos têm padrão sensato.</p>
      </div>

      <div className="acam-card">
        <ArtigoForm />
      </div>
    </div>
  )
}

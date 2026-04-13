import type { Metadata } from "next"
import { createAdminClient } from "@/lib/supabase/admin"
import { ConfigEditor } from "@/components/admin/config-editor"

export const metadata: Metadata = { title: "Admin — Configurações" }

export default async function AdminConfiguracoesPage() {
  const admin = createAdminClient()

  const { data: configs } = await admin
    .from("configuracoes")
    .select("chave, valor, descricao, updated_at")
    .order("chave")

  const configMap: Record<string, { valor: unknown; descricao: string | null; updated_at: string }> = {}
  if (configs) {
    for (const c of configs) {
      configMap[c.chave] = { valor: c.valor, descricao: c.descricao, updated_at: c.updated_at }
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div>
        <h2 style={{ color: "var(--primary-600)" }}>Configurações</h2>
        <p className="text-sm text-muted-foreground">Gerenciar UFEMG, preços e custos das ferramentas</p>
      </div>

      <ConfigEditor configMap={configMap} />
    </div>
  )
}

import type { Metadata } from "next"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { StatusBadge } from "@/components/acam"
import { AssinanteForm } from "@/components/admin/assinante-form"

export const metadata: Metadata = { title: "Admin — Assinantes Newsletter" }

export default async function AdminAssinantesPage() {
  const admin = createAdminClient()

  const { data: assinantes } = await admin
    .from("radar_destinatarios")
    .select("*")
    .order("criado_em", { ascending: false })

  const ativos = assinantes?.filter((a) => a.ativo).length ?? 0
  const total = assinantes?.length ?? 0

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div>
        <Link href="/admin/newsletter" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-2" style={{ textDecoration: "none" }}>
          ← Voltar à Newsletter
        </Link>
        <h2 style={{ color: "var(--primary-600)" }}>Assinantes</h2>
        <p className="text-sm text-muted-foreground">{ativos} ativos de {total} cadastrados</p>
      </div>

      {/* Formulário para adicionar */}
      <div className="acam-card">
        <h3 className="font-semibold mb-3">Adicionar assinante</h3>
        <AssinanteForm />
      </div>

      {/* Lista */}
      <div className="acam-card" style={{ padding: 0, overflow: "auto" }}>
        <table className="acam-services-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Origem</th>
              <th>Status</th>
              <th>Desde</th>
            </tr>
          </thead>
          <tbody>
            {assinantes && assinantes.length > 0 ? assinantes.map((a) => (
              <tr key={a.id}>
                <td className="text-sm font-medium">{a.nome || "—"}</td>
                <td className="text-sm">{a.email}</td>
                <td className="text-xs text-muted-foreground">{a.origem || "manual"}</td>
                <td>
                  <StatusBadge variant={a.ativo ? "success" : "error"}>
                    {a.ativo ? "Ativo" : "Inativo"}
                  </StatusBadge>
                </td>
                <td className="text-sm text-muted-foreground">{new Date(a.criado_em).toLocaleDateString("pt-BR")}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground" style={{ padding: "2rem" }}>
                  Nenhum assinante cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

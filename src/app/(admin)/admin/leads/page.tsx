import type { Metadata } from "next"
import { createAdminClient } from "@/lib/supabase/admin"
import { ExportLeadsButton } from "@/components/admin/export-leads-button"

export const metadata: Metadata = { title: "Admin — Leads" }

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminLeadsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = parseInt(params.page || "1", 10)
  const porPagina = 30
  const offset = (page - 1) * porPagina

  const admin = createAdminClient()

  const { data: leads, count } = await admin
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + porPagina - 1)

  const totalPaginas = Math.ceil((count || 0) / porPagina)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ color: "var(--primary-600)" }}>Leads</h2>
          <p className="text-sm text-muted-foreground">{count ?? 0} leads capturados</p>
        </div>
        <ExportLeadsButton />
      </div>

      {/* Tabela */}
      <div className="acam-card" style={{ padding: 0, overflow: "auto" }}>
        <table className="acam-services-table">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Empresa</th>
              <th>Origem</th>
              <th>Marketing</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {leads && leads.length > 0 ? leads.map((l) => (
              <tr key={l.id}>
                <td className="text-sm font-medium">{l.email}</td>
                <td className="text-sm">{l.nome || "—"}</td>
                <td className="text-sm">{l.telefone || "—"}</td>
                <td className="text-sm">{l.empresa || "—"}</td>
                <td className="text-sm text-muted-foreground">{l.origem || "—"}</td>
                <td className="text-sm">{l.aceita_marketing ? "Sim" : "Não"}</td>
                <td className="text-sm text-muted-foreground">{new Date(l.created_at).toLocaleDateString("pt-BR")}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="text-center text-muted-foreground" style={{ padding: "2rem" }}>
                  Nenhum lead capturado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
          {page > 1 && (
            <a href={`/admin/leads?page=${page - 1}`} className="acam-btn acam-btn-ghost acam-btn-sm">← Anterior</a>
          )}
          <span className="text-sm text-muted-foreground" style={{ display: "flex", alignItems: "center" }}>
            Página {page} de {totalPaginas}
          </span>
          {page < totalPaginas && (
            <a href={`/admin/leads?page=${page + 1}`} className="acam-btn acam-btn-ghost acam-btn-sm">Próxima →</a>
          )}
        </div>
      )}
    </div>
  )
}

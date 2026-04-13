import type { Metadata } from "next"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { StatusBadge } from "@/components/acam"

export const metadata: Metadata = { title: "Admin — Usuários" }

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function AdminUsuariosPage({ searchParams }: Props) {
  const params = await searchParams
  const busca = params.q || ""
  const page = parseInt(params.page || "1", 10)
  const porPagina = 20
  const offset = (page - 1) * porPagina

  const admin = createAdminClient()

  // Query com busca opcional
  let query = admin
    .from("perfis")
    .select("id, nome, email, telefone, empresa, is_admin, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + porPagina - 1)

  if (busca) {
    query = query.or(`nome.ilike.%${busca}%,email.ilike.%${busca}%`)
  }

  const { data: usuarios, count } = await query

  // Buscar saldos
  const saldos: Record<string, number> = {}
  if (usuarios && usuarios.length > 0) {
    const { data: saldoData } = await admin
      .from("saldo_creditos")
      .select("usuario_id, saldo")
      .in("usuario_id", usuarios.map((u) => u.id))

    if (saldoData) {
      for (const s of saldoData) {
        saldos[s.usuario_id] = Number(s.saldo)
      }
    }
  }

  // Contar consultas por usuário
  const consultasCounts: Record<string, number> = {}
  if (usuarios && usuarios.length > 0) {
    const { data: consultasData } = await admin
      .from("consultas")
      .select("usuario_id")
      .in("usuario_id", usuarios.map((u) => u.id))

    if (consultasData) {
      for (const c of consultasData) {
        consultasCounts[c.usuario_id] = (consultasCounts[c.usuario_id] || 0) + 1
      }
    }
  }

  const totalPaginas = Math.ceil((count || 0) / porPagina)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div>
        <h2 style={{ color: "var(--primary-600)" }}>Usuários</h2>
        <p className="text-sm text-muted-foreground">{count ?? 0} usuários cadastrados</p>
      </div>

      {/* Busca */}
      <form method="GET" action="/admin/usuarios" style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          name="q"
          className="acam-form-input"
          placeholder="Buscar por nome ou e-mail..."
          defaultValue={busca}
          style={{ flex: 1 }}
        />
        <button type="submit" className="acam-btn acam-btn-primary">Buscar</button>
      </form>

      {/* Tabela */}
      <div className="acam-card" style={{ padding: 0, overflow: "auto" }}>
        <table className="acam-services-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Saldo</th>
              <th>Consultas</th>
              <th>Criado em</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios && usuarios.length > 0 ? usuarios.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="font-medium">{u.nome || "Sem nome"}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                  {u.is_admin && <StatusBadge variant="accent">Admin</StatusBadge>}
                </td>
                <td>
                  <span className="font-semibold">{saldos[u.id] ?? 0}</span>
                  <span className="text-xs text-muted-foreground"> cr</span>
                </td>
                <td>{consultasCounts[u.id] ?? 0}</td>
                <td className="text-sm text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td>
                  <Link href={`/admin/usuarios/${u.id}`} className="acam-btn acam-btn-ghost acam-btn-sm">
                    Detalhes
                  </Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground" style={{ padding: "2rem" }}>
                  {busca ? "Nenhum usuário encontrado." : "Nenhum usuário cadastrado."}
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
            <Link href={`/admin/usuarios?q=${busca}&page=${page - 1}`} className="acam-btn acam-btn-ghost acam-btn-sm">← Anterior</Link>
          )}
          <span className="text-sm text-muted-foreground" style={{ display: "flex", alignItems: "center" }}>
            Página {page} de {totalPaginas}
          </span>
          {page < totalPaginas && (
            <Link href={`/admin/usuarios?q=${busca}&page=${page + 1}`} className="acam-btn acam-btn-ghost acam-btn-sm">Próxima →</Link>
          )}
        </div>
      )}
    </div>
  )
}

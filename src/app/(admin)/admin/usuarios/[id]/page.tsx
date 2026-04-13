import type { Metadata } from "next"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { StatusBadge } from "@/components/acam"
import { formatBRL as fmt } from "@/lib/format"
import { notFound } from "next/navigation"
import { CreditAdjustmentForm } from "@/components/admin/credit-adjustment-form"

export const metadata: Metadata = { title: "Admin — Detalhe do Usuário" }

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminUsuarioDetalhePage({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()

  // Buscar perfil, saldo, transações e consultas em paralelo
  const [
    { data: perfil },
    { data: saldoData },
    { data: transacoes },
    { data: consultas },
  ] = await Promise.all([
    admin.from("perfis").select("*").eq("id", id).single(),
    admin.from("saldo_creditos").select("saldo").eq("usuario_id", id).single(),
    admin.from("transacoes_creditos").select("*").eq("usuario_id", id).order("created_at", { ascending: false }).limit(50),
    admin.from("consultas").select("*").eq("usuario_id", id).order("created_at", { ascending: false }).limit(20),
  ])

  if (!perfil) notFound()

  const saldo = Number(saldoData?.saldo ?? 0)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      {/* Header */}
      <div>
        <Link href="/admin/usuarios" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-2" style={{ textDecoration: "none" }}>
          ← Voltar à lista
        </Link>
        <h2 style={{ color: "var(--primary-600)" }}>{perfil.nome || "Sem nome"}</h2>
        <p className="text-sm text-muted-foreground">{perfil.email}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Perfil */}
        <div className="acam-card lg:col-span-2">
          <h3 className="font-semibold mb-4">Perfil</h3>
          <div className="acam-fg acam-fg-2">
            <div className="acam-field">
              <label className="text-xs text-muted-foreground">Nome</label>
              <div className="text-sm font-medium">{perfil.nome || "—"}</div>
            </div>
            <div className="acam-field">
              <label className="text-xs text-muted-foreground">E-mail</label>
              <div className="text-sm font-medium">{perfil.email}</div>
            </div>
            <div className="acam-field">
              <label className="text-xs text-muted-foreground">Telefone</label>
              <div className="text-sm font-medium">{perfil.telefone || "—"}</div>
            </div>
            <div className="acam-field">
              <label className="text-xs text-muted-foreground">Empresa</label>
              <div className="text-sm font-medium">{perfil.empresa || "—"}</div>
            </div>
            <div className="acam-field">
              <label className="text-xs text-muted-foreground">CPF/CNPJ</label>
              <div className="text-sm font-medium">{perfil.cpf_cnpj || "—"}</div>
            </div>
            <div className="acam-field">
              <label className="text-xs text-muted-foreground">Cadastro</label>
              <div className="text-sm font-medium">{new Date(perfil.created_at).toLocaleDateString("pt-BR")}</div>
            </div>
          </div>
          {perfil.is_admin && (
            <div style={{ marginTop: "var(--spacing-4)" }}>
              <StatusBadge variant="accent">Administrador</StatusBadge>
            </div>
          )}
        </div>

        {/* Saldo + Ajuste */}
        <div className="acam-card">
          <h3 className="font-semibold mb-4">Créditos</h3>
          <div className="acam-stat-card" style={{ padding: "1rem 0" }}>
            <div className="acam-stat-card-value">{saldo}</div>
            <div className="acam-stat-card-label">Saldo atual</div>
          </div>
          <CreditAdjustmentForm usuarioId={id} saldoAtual={saldo} />
        </div>
      </div>

      {/* Transações */}
      <div className="acam-card">
        <h3 className="font-semibold mb-4">Histórico de Transações</h3>
        {transacoes && transacoes.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="acam-services-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                {transacoes.map((t) => (
                  <tr key={t.id}>
                    <td className="text-sm">{new Date(t.created_at).toLocaleString("pt-BR")}</td>
                    <td>
                      <StatusBadge variant={
                        t.tipo === "compra" ? "success" :
                        t.tipo === "uso" ? "primary" :
                        t.tipo === "reembolso" ? "warning" : "info"
                      }>
                        {t.tipo}
                      </StatusBadge>
                    </td>
                    <td className="text-sm font-semibold">
                      {t.tipo === "uso" ? "-" : "+"}{Math.abs(Number(t.quantidade))} cr
                      {t.valor_pago ? <span className="text-xs text-muted-foreground ml-1">({fmt(Number(t.valor_pago))})</span> : null}
                    </td>
                    <td className="text-sm text-muted-foreground">{t.descricao || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma transação.</p>
        )}
      </div>

      {/* Consultas */}
      <div className="acam-card">
        <h3 className="font-semibold mb-4">Consultas</h3>
        {consultas && consultas.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="acam-services-table">
              <thead>
                <tr>
                  <th>Imóvel</th>
                  <th>Ferramenta</th>
                  <th>Status</th>
                  <th>Créditos</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {consultas.map((c) => (
                  <tr key={c.id}>
                    <td className="text-sm font-medium">{c.nome_imovel || "—"}</td>
                    <td className="text-sm">{c.ferramenta_id}</td>
                    <td>
                      <StatusBadge variant={
                        c.status === "concluida" ? "success" :
                        c.status === "erro" ? "error" :
                        c.status === "reembolsada" ? "warning" : "primary"
                      }>
                        {c.status}
                      </StatusBadge>
                    </td>
                    <td className="text-sm">{Number(c.creditos_usados)} cr</td>
                    <td className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma consulta.</p>
        )}
      </div>
    </div>
  )
}

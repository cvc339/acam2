import type { Metadata } from "next"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { StatusBadge } from "@/components/acam"
import { AssinanteForm } from "@/components/admin/assinante-form"

export const metadata: Metadata = { title: "Admin — Assinantes Newsletter" }

interface Destinatario {
  nome: string
  email: string
  origem: string
  ativo: boolean
  desde: string
}

export default async function AdminAssinantesPage() {
  const admin = createAdminClient()

  // Unificar 3 fontes sem duplicação
  const todosMap = new Map<string, Destinatario>()

  // Fonte 1: radar_destinatarios (manuais)
  const { data: manuais } = await admin
    .from("radar_destinatarios")
    .select("nome, email, ativo, origem, criado_em")
    .order("criado_em", { ascending: false })

  if (manuais) {
    for (const d of manuais) {
      todosMap.set(d.email.toLowerCase(), {
        nome: d.nome || "—",
        email: d.email,
        origem: d.origem || "manual",
        ativo: d.ativo,
        desde: d.criado_em,
      })
    }
  }

  // Fonte 2: leads (aceita_marketing)
  const { data: leads } = await admin
    .from("leads")
    .select("nome, email, aceita_marketing, created_at")

  if (leads) {
    for (const l of leads) {
      const email = l.email.toLowerCase()
      if (!todosMap.has(email)) {
        todosMap.set(email, {
          nome: l.nome || "—",
          email: l.email,
          origem: "lead",
          ativo: l.aceita_marketing,
          desde: l.created_at,
        })
      }
    }
  }

  // Fonte 3: perfis (usuários cadastrados)
  const { data: perfis } = await admin
    .from("perfis")
    .select("nome, email, created_at")

  if (perfis) {
    for (const p of perfis) {
      const email = p.email.toLowerCase()
      if (!todosMap.has(email)) {
        todosMap.set(email, {
          nome: p.nome || "—",
          email: p.email,
          origem: "usuário",
          ativo: true,
          desde: p.created_at,
        })
      }
    }
  }

  const todos = Array.from(todosMap.values()).sort((a, b) => b.desde.localeCompare(a.desde))
  const ativos = todos.filter((d) => d.ativo).length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div>
        <Link href="/admin/newsletter" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-2" style={{ textDecoration: "none" }}>
          ← Voltar à Newsletter
        </Link>
        <h2 style={{ color: "var(--primary-600)" }}>Destinatários da Newsletter</h2>
        <p className="text-sm text-muted-foreground">{ativos} ativos de {todos.length} no total (3 fontes unificadas)</p>
      </div>

      {/* Formulário para adicionar manualmente */}
      <div className="acam-card">
        <h3 className="font-semibold mb-3">Adicionar destinatário manualmente</h3>
        <AssinanteForm />
      </div>

      {/* Lista unificada */}
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
            {todos.length > 0 ? todos.map((d) => (
              <tr key={d.email}>
                <td className="text-sm font-medium">{d.nome}</td>
                <td className="text-sm">{d.email}</td>
                <td>
                  <StatusBadge variant={d.origem === "usuário" ? "primary" : d.origem === "lead" ? "info" : "accent"}>
                    {d.origem}
                  </StatusBadge>
                </td>
                <td>
                  <StatusBadge variant={d.ativo ? "success" : "error"}>
                    {d.ativo ? "Ativo" : "Inativo"}
                  </StatusBadge>
                </td>
                <td className="text-sm text-muted-foreground">{new Date(d.desde).toLocaleDateString("pt-BR")}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="text-center text-muted-foreground" style={{ padding: "2rem" }}>
                  Nenhum destinatário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

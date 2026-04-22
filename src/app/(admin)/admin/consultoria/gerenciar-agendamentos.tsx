"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { AgendamentoComSlot } from "@/lib/consultoria/types"

interface Props {
  agendamentos: AgendamentoComSlot[]
}

const STATUS_LABEL: Record<string, string> = {
  confirmado: "Confirmado",
  reagendado: "Reagendado",
  concluido: "Concluído",
  cancelado_usuario: "Cancelado pelo cliente",
  cancelado_admin: "Cancelado por você",
}

function formatarDataHora(data: string, hora: string): string {
  const [ano, mes, dia] = data.split("-").map(Number)
  return `${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano} às ${hora.slice(0, 5)}`
}

export function GerenciarAgendamentos({ agendamentos }: Props) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<string>("ativos")
  const [processandoId, setProcessandoId] = useState<string | null>(null)

  async function concluir(id: string) {
    if (!confirm("Marcar esta reunião como concluída?")) return
    setProcessandoId(id)
    const resp = await fetch(`/api/admin/consultoria/agendamentos/${id}/concluir`, { method: "POST" })
    const data = await resp.json()
    setProcessandoId(null)
    if (!resp.ok) {
      alert(data.erro || "Erro ao concluir")
      return
    }
    router.refresh()
  }

  async function cancelar(id: string) {
    if (!confirm("Cancelar esta reunião? O cliente será REEMBOLSADO em 15 créditos e o evento será removido do Google Calendar.")) {
      return
    }
    setProcessandoId(id)
    const resp = await fetch(`/api/admin/consultoria/agendamentos/${id}/cancelar`, { method: "POST" })
    const data = await resp.json()
    setProcessandoId(null)
    if (!resp.ok) {
      alert(data.erro || "Erro ao cancelar")
      return
    }
    router.refresh()
  }

  const filtrados = agendamentos.filter((a) => {
    if (filtro === "todos") return true
    if (filtro === "ativos") return a.status === "confirmado" || a.status === "reagendado"
    if (filtro === "concluidos") return a.status === "concluido"
    if (filtro === "cancelados") return a.status === "cancelado_usuario" || a.status === "cancelado_admin"
    return true
  })

  return (
    <div className="acam-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--spacing-3)" }}>
        <h3>Agendamentos</h3>
        <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
          {[
            { id: "ativos", label: "Ativos" },
            { id: "concluidos", label: "Concluídos" },
            { id: "cancelados", label: "Cancelados" },
            { id: "todos", label: "Todos" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`acam-btn acam-btn-sm ${filtro === f.id ? "acam-btn-primary" : "acam-btn-outline"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <p className="text-sm text-muted-foreground" style={{ marginTop: "var(--spacing-3)" }}>
          Nenhum agendamento nesse filtro.
        </p>
      ) : (
        <div style={{ marginTop: "var(--spacing-4)", display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
          {filtrados.map((a) => {
            const ativo = a.status === "confirmado" || a.status === "reagendado"
            return (
              <div
                key={a.id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "var(--spacing-3)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--spacing-3)", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {formatarDataHora(a.slot.data, a.slot.hora_inicio)}
                    </div>
                    <div className="text-sm text-muted-foreground" style={{ marginTop: "var(--spacing-1)" }}>
                      {a.email_reuniao}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: "var(--muted)",
                    }}
                  >
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                </div>

                {a.observacoes_usuario && (
                  <div style={{ marginTop: "var(--spacing-3)", fontSize: "0.875rem" }}>
                    <div className="text-sm text-muted-foreground">Observações do cliente:</div>
                    <div style={{ whiteSpace: "pre-wrap", marginTop: "var(--spacing-1)" }}>{a.observacoes_usuario}</div>
                  </div>
                )}

                {a.anexo_url && (
                  <div style={{ marginTop: "var(--spacing-2)", fontSize: "0.875rem" }}>
                    <a href={a.anexo_url} target="_blank" rel="noopener noreferrer" className="acam-link">
                      📎 Baixar relatório anexado ({a.anexo_nome ?? "arquivo"})
                    </a>
                  </div>
                )}

                {a.link_reuniao && ativo && (
                  <div style={{ marginTop: "var(--spacing-2)", fontSize: "0.875rem" }}>
                    <a href={a.link_reuniao} target="_blank" rel="noopener noreferrer" className="acam-link">
                      🎥 Link da reunião
                    </a>
                  </div>
                )}

                {ativo && (
                  <div style={{ display: "flex", gap: "var(--spacing-2)", marginTop: "var(--spacing-3)" }}>
                    <button
                      type="button"
                      onClick={() => concluir(a.id)}
                      disabled={processandoId === a.id}
                      className="acam-btn acam-btn-outline acam-btn-sm"
                    >
                      Marcar como concluído
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelar(a.id)}
                      disabled={processandoId === a.id}
                      className="acam-btn acam-btn-outline acam-btn-sm acam-btn-danger"
                    >
                      Cancelar e reembolsar
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

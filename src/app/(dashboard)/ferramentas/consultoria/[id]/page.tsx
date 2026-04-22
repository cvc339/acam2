import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader, StatusBadge } from "@/components/acam"
import { consultoria } from "@/lib/consultoria"
import { AcoesAgendamento } from "./acoes-agendamento"

export const metadata: Metadata = { title: "Consultoria — Agendamento" }

const STATUS_LABEL: Record<string, { label: string; variante: "success" | "warning" | "info" | "error" }> = {
  confirmado: { label: "Confirmado", variante: "success" },
  reagendado: { label: "Reagendado", variante: "success" },
  concluido: { label: "Concluído", variante: "info" },
  cancelado_usuario: { label: "Cancelado", variante: "error" },
  cancelado_admin: { label: "Cancelado pelo consultor", variante: "error" },
}

function formatarDataHora(data: string, hora: string): string {
  const [ano, mes, dia] = data.split("-").map(Number)
  const d = new Date(ano, mes - 1, dia)
  const diasSemana = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"]
  const meses = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
  ]
  return `${diasSemana[d.getDay()]}, ${dia} de ${meses[d.getMonth()]} de ${ano} às ${hora.slice(0, 5)}`
}

export default async function AgendamentoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const agendamento = await consultoria.buscarAgendamento(id, user.id)

  if (!agendamento) notFound()

  const slotsDisponiveis = await consultoria.listarSlotsDisponiveis()
  const verificacaoReagendar = consultoria.podeReagendar(agendamento)
  const statusInfo = STATUS_LABEL[agendamento.status] ?? { label: agendamento.status, variante: "info" as const }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--spacing-4)", flexWrap: "wrap" }}>
        <PageHeader
          title="Sua reunião de consultoria"
          description="Detalhes da reunião agendada."
        />
        <Link href="/ferramentas/consultoria" className="acam-btn acam-btn-ghost acam-btn-sm">
          ← Voltar
        </Link>
      </div>

      <div className="acam-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--spacing-4)", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: "1.125rem" }}>
              {formatarDataHora(agendamento.slot.data, agendamento.slot.hora_inicio)}
            </div>
            <div className="text-sm text-muted-foreground" style={{ marginTop: "var(--spacing-1)" }}>
              Duração: 30 minutos · horário de Brasília
            </div>
          </div>
          <StatusBadge variant={statusInfo.variante}>{statusInfo.label}</StatusBadge>
        </div>

        <div style={{ marginTop: "var(--spacing-5)", display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
          <div>
            <div className="text-sm text-muted-foreground">E-mail do convite</div>
            <div>{agendamento.email_reuniao}</div>
          </div>

          {agendamento.link_reuniao && (agendamento.status === "confirmado" || agendamento.status === "reagendado") && (
            <div>
              <div className="text-sm text-muted-foreground">Link da reunião</div>
              <a
                href={agendamento.link_reuniao}
                target="_blank"
                rel="noopener noreferrer"
                className="acam-link"
              >
                {agendamento.link_reuniao}
              </a>
            </div>
          )}

          {agendamento.anexo_nome && (
            <div>
              <div className="text-sm text-muted-foreground">Relatório anexado</div>
              <div>{agendamento.anexo_nome}</div>
            </div>
          )}

          {agendamento.observacoes_usuario && (
            <div>
              <div className="text-sm text-muted-foreground">Observações</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{agendamento.observacoes_usuario}</div>
            </div>
          )}
        </div>
      </div>

      <AcoesAgendamento
        agendamento={agendamento}
        slotsDisponiveis={slotsDisponiveis}
        podeReagendar={verificacaoReagendar.pode}
        motivoNaoReagendar={verificacaoReagendar.motivo}
      />
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { AgendamentoComSlot, Slot } from "@/lib/consultoria/types"
import { HORAS_ANTECEDENCIA_REAGENDAMENTO } from "@/lib/consultoria/types"

interface Props {
  agendamento: AgendamentoComSlot
  slotsDisponiveis: Slot[]
  podeReagendar: boolean
  motivoNaoReagendar?: string
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
]

function formatarDia(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number)
  const d = new Date(ano, mes - 1, dia)
  return `${DIAS_SEMANA[d.getDay()]} ${dia}/${MESES[d.getMonth()]}`
}

export function AcoesAgendamento({
  agendamento,
  slotsDisponiveis,
  podeReagendar,
  motivoNaoReagendar,
}: Props) {
  const router = useRouter()
  const [modo, setModo] = useState<"ver" | "reagendar">("ver")
  const [novoSlot, setNovoSlot] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function reagendar() {
    if (!novoSlot) return
    setProcessando(true)
    setErro(null)

    const resp = await fetch("/api/consultoria/reagendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agendamentoId: agendamento.id, novoSlotId: novoSlot }),
    })

    const data = await resp.json()
    setProcessando(false)

    if (!resp.ok) {
      setErro(data.erro || "Erro ao reagendar")
      return
    }

    router.refresh()
    setModo("ver")
  }

  async function cancelar() {
    if (!confirm("Cancelar a reunião? Esta ação não dá direito a reembolso dos créditos.")) {
      return
    }

    setProcessando(true)
    setErro(null)

    const resp = await fetch("/api/consultoria/cancelar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agendamentoId: agendamento.id }),
    })

    const data = await resp.json()
    setProcessando(false)

    if (!resp.ok) {
      setErro(data.erro || "Erro ao cancelar")
      return
    }

    router.refresh()
  }

  if (agendamento.status === "cancelado_usuario" || agendamento.status === "cancelado_admin") {
    return null
  }

  if (agendamento.status === "concluido") {
    return null
  }

  if (modo === "reagendar") {
    const slotsPorDia: Record<string, Slot[]> = {}
    for (const s of slotsDisponiveis) {
      if (s.id === agendamento.slot_id) continue
      if (!slotsPorDia[s.data]) slotsPorDia[s.data] = []
      slotsPorDia[s.data].push(s)
    }

    return (
      <div className="acam-card">
        <h3>Escolher novo horário</h3>
        <p className="text-sm text-muted-foreground" style={{ marginTop: "var(--spacing-2)" }}>
          Atenção: este é seu único reagendamento. Após confirmar, não será possível reagendar novamente.
        </p>

        {erro && (
          <div className="acam-alert acam-alert-error" style={{ marginTop: "var(--spacing-3)" }}>
            <strong>Erro:</strong> {erro}
          </div>
        )}

        <div style={{ marginTop: "var(--spacing-4)", display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
          {Object.keys(slotsPorDia).length === 0 && (
            <p>Não há outros horários disponíveis no momento.</p>
          )}
          {Object.entries(slotsPorDia).map(([data, slots]) => (
            <div key={data}>
              <div style={{ fontWeight: 600, marginBottom: "var(--spacing-2)" }}>{formatarDia(data)}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-2)" }}>
                {slots.map((s) => {
                  const selecionado = novoSlot === s.id
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setNovoSlot(s.id)}
                      className={`acam-btn acam-btn-sm ${selecionado ? "acam-btn-primary" : "acam-btn-outline"}`}
                    >
                      {s.hora_inicio.slice(0, 5)} – {s.hora_fim.slice(0, 5)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "var(--spacing-3)", marginTop: "var(--spacing-5)" }}>
          <button
            type="button"
            onClick={reagendar}
            disabled={!novoSlot || processando}
            className="acam-btn acam-btn-primary"
          >
            {processando ? "Confirmando..." : "Confirmar reagendamento"}
          </button>
          <button
            type="button"
            onClick={() => { setModo("ver"); setNovoSlot(null); setErro(null) }}
            disabled={processando}
            className="acam-btn acam-btn-ghost"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
      {erro && (
        <div className="acam-alert acam-alert-error">
          <strong>Erro:</strong> {erro}
        </div>
      )}

      <div style={{ display: "flex", gap: "var(--spacing-3)", flexWrap: "wrap" }}>
        {podeReagendar ? (
          <button
            type="button"
            onClick={() => setModo("reagendar")}
            className="acam-btn acam-btn-outline"
            disabled={processando}
          >
            Reagendar
          </button>
        ) : (
          <div className="text-sm text-muted-foreground" style={{ alignSelf: "center" }}>
            {motivoNaoReagendar ? `Reagendamento indisponível: ${motivoNaoReagendar}` : `Reagendamento deve ser feito com no mínimo ${HORAS_ANTECEDENCIA_REAGENDAMENTO}h de antecedência e só pode ser usado uma vez.`}
          </div>
        )}

        <button
          type="button"
          onClick={cancelar}
          className="acam-btn acam-btn-outline acam-btn-danger"
          disabled={processando}
        >
          {processando ? "Cancelando..." : "Cancelar reunião"}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Cancelamento pelo cliente não dá direito a reembolso. Se precisar, entre em contato pelo Fale Conosco.
      </p>
    </div>
  )
}

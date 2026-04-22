"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DatePicker } from "@/components/acam/date-picker"
import type { AgendamentoComSlot, Slot } from "@/lib/consultoria/types"
import { HORAS_ANTECEDENCIA_REAGENDAMENTO } from "@/lib/consultoria/types"

interface Props {
  agendamento: AgendamentoComSlot
  slotsDisponiveis: Slot[]
  podeReagendar: boolean
  motivoNaoReagendar?: string
}

const DIAS_SEMANA_LONGO = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
const MESES_LONGO = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

function formatarCabecalhoDia(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number)
  const d = new Date(ano, mes - 1, dia)
  return `${DIAS_SEMANA_LONGO[d.getDay()]}, ${dia} de ${MESES_LONGO[d.getMonth()]}`
}

function ddmmyyyyParaISO(data: string): string | null {
  const match = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  return `${match[3]}-${match[2]}-${match[1]}`
}

export function AcoesAgendamento({
  agendamento,
  slotsDisponiveis,
  podeReagendar,
  motivoNaoReagendar,
}: Props) {
  const router = useRouter()
  const [modo, setModo] = useState<"ver" | "reagendar">("ver")
  const [dataEscolhida, setDataEscolhida] = useState<string>("")
  const [novoSlot, setNovoSlot] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const slotsPorDia = useMemo(() => {
    const map: Record<string, Slot[]> = {}
    for (const s of slotsDisponiveis) {
      if (s.id === agendamento.slot_id) continue
      if (!map[s.data]) map[s.data] = []
      map[s.data].push(s)
    }
    return map
  }, [slotsDisponiveis, agendamento.slot_id])

  const dataISO = ddmmyyyyParaISO(dataEscolhida)
  const slotsDoDia = dataISO ? slotsPorDia[dataISO] ?? [] : []

  function handleDataChange(novaData: string) {
    setDataEscolhida(novaData)
    setNovoSlot(null)
  }

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

        <div className="acam-form-group" style={{ marginTop: "var(--spacing-4)", maxWidth: "16rem" }}>
          <label className="acam-form-label" htmlFor="data-reagendar">Data</label>
          <DatePicker value={dataEscolhida} onChange={handleDataChange} />
        </div>

        {dataISO && (
          <div style={{ marginTop: "var(--spacing-4)" }}>
            {slotsDoDia.length > 0 ? (
              <>
                <div style={{ fontWeight: 600, marginBottom: "var(--spacing-2)" }}>
                  Horários disponíveis — {formatarCabecalhoDia(dataISO)}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-2)" }}>
                  {slotsDoDia.map((s) => {
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
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Não há horários disponíveis nesta data. Por favor, escolha outra.
              </p>
            )}
          </div>
        )}

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
            onClick={() => { setModo("ver"); setNovoSlot(null); setDataEscolhida(""); setErro(null) }}
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

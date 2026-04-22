"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Slot } from "@/lib/consultoria/types"

interface Props {
  slots: Slot[]
}

const DIAS_SEMANA = [
  { id: 0, label: "Dom" },
  { id: 1, label: "Seg" },
  { id: 2, label: "Ter" },
  { id: 3, label: "Qua" },
  { id: 4, label: "Qui" },
  { id: 5, label: "Sex" },
  { id: 6, label: "Sáb" },
]

function formatarDia(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number)
  const d = new Date(ano, mes - 1, dia)
  const diasLabel = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
  return `${diasLabel[d.getDay()]} ${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}/${ano}`
}

export function GerenciarSlots({ slots }: Props) {
  const router = useRouter()

  // Avulso
  const [dataAvulsa, setDataAvulsa] = useState("")
  const [horaInicioAvulsa, setHoraInicioAvulsa] = useState("")
  const [horaFimAvulsa, setHoraFimAvulsa] = useState("")

  // Lote
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>([1, 3]) // Seg, Qua
  const [horariosLote, setHorariosLote] = useState<Array<{ inicio: string; fim: string }>>([
    { inicio: "14:00", fim: "14:30" },
    { inicio: "16:00", fim: "16:30" },
  ])
  const [semanas, setSemanas] = useState(2)

  // Estado comum
  const [processando, setProcessando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  function toggleDia(id: number) {
    setDiasSelecionados((atual) =>
      atual.includes(id) ? atual.filter((d) => d !== id) : [...atual, id].sort()
    )
  }

  function adicionarHorario() {
    setHorariosLote([...horariosLote, { inicio: "", fim: "" }])
  }

  function removerHorario(i: number) {
    setHorariosLote(horariosLote.filter((_, idx) => idx !== i))
  }

  function atualizarHorario(i: number, campo: "inicio" | "fim", valor: string) {
    const novo = [...horariosLote]
    novo[i] = { ...novo[i], [campo]: valor }
    setHorariosLote(novo)
  }

  async function criarAvulso(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setMensagem(null)
    setProcessando(true)

    const resp = await fetch("/api/admin/consultoria/slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: dataAvulsa,
        horaInicio: horaInicioAvulsa,
        horaFim: horaFimAvulsa,
      }),
    })
    const data = await resp.json()
    setProcessando(false)

    if (!resp.ok) {
      setErro(data.erro || "Erro ao criar slot")
      return
    }

    setMensagem("Slot criado com sucesso")
    setDataAvulsa("")
    setHoraInicioAvulsa("")
    setHoraFimAvulsa("")
    router.refresh()
  }

  async function criarLote() {
    if (diasSelecionados.length === 0) {
      setErro("Selecione ao menos um dia da semana")
      return
    }
    const horariosValidos = horariosLote.filter((h) => h.inicio && h.fim)
    if (horariosValidos.length === 0) {
      setErro("Informe ao menos um horário válido")
      return
    }

    setErro(null)
    setMensagem(null)
    setProcessando(true)

    const resp = await fetch("/api/admin/consultoria/slots/lote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diasSemana: diasSelecionados,
        horarios: horariosValidos,
        semanas,
      }),
    })
    const data = await resp.json()
    setProcessando(false)

    if (!resp.ok) {
      setErro(data.erro || "Erro ao criar slots")
      return
    }

    setMensagem(`${data.criados} slots criados · ${data.ignorados} já existiam`)
    router.refresh()
  }

  async function deletar(id: string) {
    if (!confirm("Remover este slot?")) return
    setProcessando(true)
    const resp = await fetch(`/api/admin/consultoria/slots/${id}`, { method: "DELETE" })
    const data = await resp.json()
    setProcessando(false)

    if (!resp.ok) {
      alert(data.erro || "Erro ao deletar")
      return
    }
    router.refresh()
  }

  // Agrupar por dia para exibição
  const slotsPorDia: Record<string, Slot[]> = {}
  for (const s of slots) {
    if (!slotsPorDia[s.data]) slotsPorDia[s.data] = []
    slotsPorDia[s.data].push(s)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      {erro && (
        <div className="acam-alert acam-alert-error">
          <strong>Erro:</strong> {erro}
        </div>
      )}
      {mensagem && (
        <div className="acam-alert acam-alert-success">{mensagem}</div>
      )}

      <div className="acam-card">
        <h3>Criar slots em lote</h3>
        <p className="text-sm text-muted-foreground" style={{ marginTop: "var(--spacing-1)" }}>
          Cria slots nas próximas semanas, nos dias e horários escolhidos. Slots já existentes são ignorados.
        </p>

        <div className="acam-form-group" style={{ marginTop: "var(--spacing-4)" }}>
          <label className="acam-form-label">Dias da semana</label>
          <div style={{ display: "flex", gap: "var(--spacing-2)", flexWrap: "wrap" }}>
            {DIAS_SEMANA.map((d) => {
              const ativo = diasSelecionados.includes(d.id)
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDia(d.id)}
                  className={`acam-btn acam-btn-sm ${ativo ? "acam-btn-primary" : "acam-btn-outline"}`}
                >
                  {d.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="acam-form-group">
          <label className="acam-form-label">Horários</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
            {horariosLote.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: "var(--spacing-2)", alignItems: "center" }}>
                <input
                  type="time"
                  className="acam-form-input"
                  value={h.inicio}
                  onChange={(e) => atualizarHorario(i, "inicio", e.target.value)}
                  style={{ maxWidth: "8rem" }}
                />
                <span>até</span>
                <input
                  type="time"
                  className="acam-form-input"
                  value={h.fim}
                  onChange={(e) => atualizarHorario(i, "fim", e.target.value)}
                  style={{ maxWidth: "8rem" }}
                />
                <button
                  type="button"
                  onClick={() => removerHorario(i)}
                  className="acam-btn acam-btn-ghost acam-btn-sm"
                >
                  Remover
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={adicionarHorario}
              className="acam-btn acam-btn-outline acam-btn-sm"
              style={{ alignSelf: "flex-start" }}
            >
              + Adicionar horário
            </button>
          </div>
        </div>

        <div className="acam-form-group">
          <label className="acam-form-label" htmlFor="semanas">Quantas semanas</label>
          <input
            id="semanas"
            type="number"
            min={1}
            max={12}
            className="acam-form-input"
            value={semanas}
            onChange={(e) => setSemanas(Number(e.target.value))}
            style={{ maxWidth: "6rem" }}
          />
          <p className="acam-form-help">De 1 a 12 semanas a partir de hoje.</p>
        </div>

        <button
          type="button"
          onClick={criarLote}
          disabled={processando}
          className="acam-btn acam-btn-primary"
        >
          {processando ? "Criando..." : "Criar slots em lote"}
        </button>
      </div>

      <div className="acam-card">
        <h3>Criar slot avulso</h3>
        <form onSubmit={criarAvulso} style={{ marginTop: "var(--spacing-3)" }}>
          <div style={{ display: "flex", gap: "var(--spacing-3)", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div className="acam-form-group" style={{ marginBottom: 0 }}>
              <label className="acam-form-label" htmlFor="data-avulsa">Data</label>
              <input
                id="data-avulsa"
                type="date"
                required
                className="acam-form-input"
                value={dataAvulsa}
                onChange={(e) => setDataAvulsa(e.target.value)}
              />
            </div>
            <div className="acam-form-group" style={{ marginBottom: 0 }}>
              <label className="acam-form-label" htmlFor="hora-inicio">Início</label>
              <input
                id="hora-inicio"
                type="time"
                required
                className="acam-form-input"
                value={horaInicioAvulsa}
                onChange={(e) => setHoraInicioAvulsa(e.target.value)}
              />
            </div>
            <div className="acam-form-group" style={{ marginBottom: 0 }}>
              <label className="acam-form-label" htmlFor="hora-fim">Fim</label>
              <input
                id="hora-fim"
                type="time"
                required
                className="acam-form-input"
                value={horaFimAvulsa}
                onChange={(e) => setHoraFimAvulsa(e.target.value)}
              />
            </div>
            <button type="submit" disabled={processando} className="acam-btn acam-btn-primary">
              Criar
            </button>
          </div>
        </form>
      </div>

      <div className="acam-card">
        <h3>Slots existentes</h3>
        {slots.length === 0 ? (
          <p className="text-sm text-muted-foreground" style={{ marginTop: "var(--spacing-2)" }}>
            Nenhum slot cadastrado.
          </p>
        ) : (
          <div style={{ marginTop: "var(--spacing-3)", display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
            {Object.entries(slotsPorDia).map(([data, slotsDoDia]) => (
              <div key={data}>
                <div style={{ fontWeight: 600, marginBottom: "var(--spacing-2)" }}>{formatarDia(data)}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-2)" }}>
                  {slotsDoDia.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--spacing-2)",
                        padding: "var(--spacing-1) var(--spacing-2)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <span>{s.hora_inicio.slice(0, 5)} – {s.hora_fim.slice(0, 5)}</span>
                      <span
                        className={s.status === "disponivel" ? "badge-success" : s.status === "reservado" ? "badge-warning" : "badge-info"}
                        style={{ fontSize: "0.7rem", padding: "2px 6px", borderRadius: "4px" }}
                      >
                        {s.status}
                      </span>
                      {s.status === "disponivel" && (
                        <button
                          type="button"
                          onClick={() => deletar(s.id)}
                          className="acam-btn acam-btn-ghost acam-btn-sm"
                          disabled={processando}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

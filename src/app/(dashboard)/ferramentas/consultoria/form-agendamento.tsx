"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { AlertResult } from "@/components/acam"
import type { Slot } from "@/lib/consultoria/types"
import { CUSTO_CONSULTORIA, MINUTOS_REUNIAO } from "@/lib/consultoria/types"

interface Props {
  slots: Slot[]
  saldo: number
  emailUsuario: string
}

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

function formatarCabecalhoDia(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number)
  const d = new Date(ano, mes - 1, dia)
  return `${DIAS_SEMANA[d.getDay()]}, ${dia} de ${MESES[d.getMonth()]}`
}

function formatarHora(horaISO: string): string {
  return horaISO.slice(0, 5)
}

export function FormAgendamento({ slots, saldo, emailUsuario }: Props) {
  const router = useRouter()

  const [slotSelecionado, setSlotSelecionado] = useState<string | null>(null)
  const [email, setEmail] = useState(emailUsuario)
  const [observacoes, setObservacoes] = useState("")
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<string | null>(null)

  const slotsPorDia = useMemo(() => {
    const map: Record<string, Slot[]> = {}
    for (const s of slots) {
      if (!map[s.data]) map[s.data] = []
      map[s.data].push(s)
    }
    return map
  }, [slots])

  const saldoInsuficiente = saldo < CUSTO_CONSULTORIA

  async function submeter(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    if (!slotSelecionado) {
      setErro("Selecione um horário")
      return
    }

    if (saldoInsuficiente) {
      setErro(`Saldo insuficiente. Você precisa de ${CUSTO_CONSULTORIA} créditos.`)
      return
    }

    setEnviando(true)

    try {
      let anexoUrl: string | undefined
      let anexoNome: string | undefined

      if (arquivo) {
        const formData = new FormData()
        formData.append("file", arquivo)
        const respUpload = await fetch("/api/consultoria/upload-anexo", {
          method: "POST",
          body: formData,
        })
        const dataUpload = await respUpload.json()
        if (!respUpload.ok) {
          setErro(dataUpload.erro || "Erro no upload do anexo")
          setEnviando(false)
          return
        }
        anexoUrl = dataUpload.url
        anexoNome = dataUpload.nome
      }

      const resp = await fetch("/api/consultoria/agendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slotSelecionado,
          emailReuniao: email,
          observacoes: observacoes || undefined,
          anexoUrl,
          anexoNome,
        }),
      })

      const data = await resp.json()

      if (!resp.ok) {
        setErro(data.erro || "Erro ao agendar")
        setEnviando(false)
        return
      }

      setSucesso(data.agendamentoId)
      router.refresh()
      setTimeout(() => {
        router.push(`/ferramentas/consultoria/${data.agendamentoId}`)
      }, 1200)
    } catch (err) {
      console.error(err)
      setErro("Erro de conexão. Tente novamente.")
      setEnviando(false)
    }
  }

  if (sucesso) {
    return (
      <AlertResult status="success" statusLabel="Agendamento confirmado">
        <h3>Reunião agendada</h3>
        <p>Você receberá um e-mail com o link da reunião e um convite no Google Calendar. Redirecionando para os detalhes...</p>
      </AlertResult>
    )
  }

  if (saldoInsuficiente) {
    return (
      <AlertResult status="warning" statusLabel="Saldo insuficiente">
        <h3>São necessários {CUSTO_CONSULTORIA} créditos</h3>
        <p>Você tem {saldo} créditos. Adquira mais créditos para agendar sua reunião.</p>
      </AlertResult>
    )
  }

  if (slots.length === 0) {
    return (
      <AlertResult status="warning" statusLabel="Sem horários disponíveis">
        <h3>Nenhum horário liberado para as próximas duas semanas</h3>
        <p>Volte em breve para conferir novos horários. Você também pode entrar em contato pelo Fale Conosco para solicitar um horário fora da grade.</p>
      </AlertResult>
    )
  }

  return (
    <form onSubmit={submeter} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      {erro && (
        <div className="acam-alert acam-alert-error">
          <strong>Erro:</strong> {erro}
        </div>
      )}

      <section>
        <h3>1. Escolha um horário</h3>
        <p className="text-sm text-muted-foreground" style={{ marginBottom: "var(--spacing-4)" }}>
          Reunião online de {MINUTOS_REUNIAO} minutos. Você recebe o link por e-mail após confirmar.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-5)" }}>
          {Object.entries(slotsPorDia).map(([data, slotsDoDia]) => (
            <div key={data}>
              <div style={{ fontWeight: 600, marginBottom: "var(--spacing-2)" }}>
                {formatarCabecalhoDia(data)}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--spacing-2)" }}>
                {slotsDoDia.map((slot) => {
                  const selecionado = slotSelecionado === slot.id
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSlotSelecionado(slot.id)}
                      className={`acam-btn acam-btn-sm ${selecionado ? "acam-btn-primary" : "acam-btn-outline"}`}
                    >
                      {formatarHora(slot.hora_inicio)} – {formatarHora(slot.hora_fim)}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3>2. Dados da reunião</h3>
        <div className="acam-form-group" style={{ marginTop: "var(--spacing-3)" }}>
          <label className="acam-form-label" htmlFor="email">E-mail para receber o convite</label>
          <input
            id="email"
            type="email"
            required
            className="acam-form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="acam-form-help">
            O Google enviará o convite com o link da reunião para esse endereço.
          </p>
        </div>

        <div className="acam-form-group">
          <label className="acam-form-label" htmlFor="obs">O que gostaria de conversar? (opcional)</label>
          <textarea
            id="obs"
            className="acam-form-input"
            rows={4}
            maxLength={1000}
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex.: preciso de orientação sobre compensação de servidão administrativa em área rural..."
          />
          <p className="acam-form-help">
            {observacoes.length}/1000 caracteres. Serve para contextualizar a conversa.
          </p>
        </div>

        <div className="acam-form-group">
          <label className="acam-form-label" htmlFor="anexo">Anexar relatório (opcional)</label>
          <input
            id="anexo"
            type="file"
            accept="application/pdf"
            className="acam-form-input"
            onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          />
          <p className="acam-form-help">
            PDF até 10MB. Pode ser um relatório gerado pelo ACAM ou qualquer documento que ajude a contextualizar.
          </p>
        </div>
      </section>

      <section>
        <h3>3. Confirmar</h3>
        <div className="acam-card acam-card-compact" style={{ marginTop: "var(--spacing-3)" }}>
          <p>
            Ao confirmar, <strong>{CUSTO_CONSULTORIA} créditos</strong> serão debitados do seu saldo.
          </p>
          <p className="text-sm text-muted-foreground" style={{ marginTop: "var(--spacing-2)" }}>
            Você pode reagendar <strong>uma única vez</strong>, desde que seja com pelo menos 4 horas de antecedência. Cancelamento pelo cliente não dá direito a reembolso.
          </p>
        </div>

        <button
          type="submit"
          className="acam-btn acam-btn-primary acam-btn-lg"
          style={{ marginTop: "var(--spacing-4)" }}
          disabled={enviando || !slotSelecionado}
        >
          {enviando ? "Agendando..." : `Confirmar e debitar ${CUSTO_CONSULTORIA} créditos`}
        </button>
      </section>
    </form>
  )
}

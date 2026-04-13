"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const TIPOS = [
  { id: "sugestao", label: "Sugestão", desc: "Ideias para melhorar o ACAM" },
  { id: "elogio", label: "Elogio", desc: "Algo que funcionou bem" },
  { id: "reclamacao", label: "Reclamação", desc: "Algo que não funcionou como esperado" },
  { id: "duvida", label: "Dúvida", desc: "Preciso de ajuda com alguma funcionalidade" },
]

export function FaleConoscoForm() {
  const router = useRouter()
  const [tipo, setTipo] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState("")

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")

    if (!tipo) { setErro("Selecione o tipo da mensagem."); return }
    if (!mensagem.trim() || mensagem.trim().length < 10) {
      setErro("Escreva ao menos 10 caracteres.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, mensagem: mensagem.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.erro || "Erro ao enviar.")
      } else {
        setEnviado(true)
        router.refresh()
      }
    } catch {
      setErro("Erro de comunicação com o servidor.")
    }

    setLoading(false)
  }

  if (enviado) {
    return (
      <div className="acam-card" style={{ textAlign: "center", padding: "2rem" }}>
        <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem", color: "var(--success)" }}>✓</div>
        <p className="font-semibold mb-1">Mensagem enviada</p>
        <p className="text-sm text-muted-foreground mb-4">Obrigado! Sua mensagem será analisada pela nossa equipe.</p>
        <button
          className="acam-btn acam-btn-ghost acam-btn-sm"
          onClick={() => { setEnviado(false); setTipo(""); setMensagem("") }}
        >
          Enviar outra mensagem
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleEnviar}>
      <div className="acam-card">
        <div className="acam-field" style={{ marginBottom: "var(--spacing-4)" }}>
          <label>Tipo de mensagem <span className="req">*</span></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {TIPOS.map((t) => (
              <label
                key={t.id}
                className={`acam-card-compact${tipo === t.id ? " acam-card-border-primary" : ""}`}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 0.75rem", cursor: "pointer" }}
              >
                <input
                  type="radio"
                  name="tipo"
                  value={t.id}
                  checked={tipo === t.id}
                  onChange={() => setTipo(t.id)}
                  style={{ accentColor: "var(--primary-600)" }}
                />
                <div>
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{t.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="acam-field" style={{ marginBottom: "var(--spacing-4)" }}>
          <label>Sua mensagem <span className="req">*</span></label>
          <textarea
            className="acam-form-input"
            rows={5}
            placeholder="Descreva com detalhes..."
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            style={{ resize: "vertical" }}
          />
          <div className="text-xs text-muted-foreground mt-1">
            {mensagem.trim().length}/10 caracteres (mínimo)
          </div>
        </div>

        {erro && <div className="acam-alert acam-alert-error mb-4">{erro}</div>}

        <button
          type="submit"
          className="acam-btn acam-btn-primary"
          style={{ width: "100%" }}
          disabled={loading}
        >
          {loading ? "Enviando..." : "Enviar mensagem"}
        </button>
      </div>
    </form>
  )
}

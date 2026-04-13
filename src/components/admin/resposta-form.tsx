"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  mensagemId: string
  respostaExistente?: string | null
}

export function RespostaForm({ mensagemId, respostaExistente }: Props) {
  const router = useRouter()
  const [resposta, setResposta] = useState(respostaExistente || "")
  const [aberto, setAberto] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState(false)

  // Se já tem resposta e não está editando, mostrar a resposta
  if (respostaExistente && !aberto) {
    return (
      <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "var(--primary-50)", borderRadius: "var(--radius)", borderLeft: "3px solid var(--primary-600)" }}>
        <div className="text-xs font-semibold" style={{ color: "var(--primary-600)", marginBottom: "0.25rem" }}>Resposta do ACAM</div>
        <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>{respostaExistente}</p>
        <button
          className="text-xs mt-2"
          style={{ color: "var(--primary-600)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
          onClick={() => setAberto(true)}
        >
          Editar resposta
        </button>
      </div>
    )
  }

  if (!aberto && !respostaExistente) {
    return (
      <button
        className="text-xs mt-2"
        style={{ color: "var(--primary-600)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
        onClick={() => setAberto(true)}
      >
        Responder
      </button>
    )
  }

  async function handleEnviar() {
    setErro("")
    setSucesso(false)

    if (!resposta.trim() || resposta.trim().length < 3) {
      setErro("Escreva ao menos 3 caracteres.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/admin/mensagens/${mensagemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resposta: resposta.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.erro || "Erro ao enviar resposta.")
      } else {
        setSucesso(true)
        setAberto(false)
        router.refresh()
      }
    } catch {
      setErro("Erro de comunicação.")
    }

    setLoading(false)
  }

  return (
    <div style={{ marginTop: "0.75rem" }}>
      <textarea
        className="acam-form-input"
        rows={3}
        placeholder="Escreva sua resposta ao usuário..."
        value={resposta}
        onChange={(e) => setResposta(e.target.value)}
        style={{ resize: "vertical", fontSize: "0.85rem" }}
      />
      {erro && <div className="text-xs mt-1" style={{ color: "var(--error)" }}>{erro}</div>}
      {sucesso && <div className="text-xs mt-1" style={{ color: "var(--success)" }}>Resposta salva.</div>}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <button
          className="acam-btn acam-btn-primary acam-btn-sm"
          onClick={handleEnviar}
          disabled={loading}
        >
          {loading ? "Enviando..." : "Enviar resposta"}
        </button>
        <button
          className="acam-btn acam-btn-ghost acam-btn-sm"
          onClick={() => { setAberto(false); setResposta(respostaExistente || "") }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

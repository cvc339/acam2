"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  usuarioId: string
  saldoAtual: number
}

export function CreditAdjustmentForm({ usuarioId, saldoAtual }: Props) {
  const router = useRouter()
  const [quantidade, setQuantidade] = useState("")
  const [motivo, setMotivo] = useState("")
  const [operacao, setOperacao] = useState<"adicionar" | "remover">("adicionar")
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState("")
  const [erro, setErro] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setMensagem("")

    const qtd = parseFloat(quantidade)
    if (!qtd || qtd <= 0) {
      setErro("Informe a quantidade.")
      return
    }
    if (!motivo.trim() || motivo.trim().length < 3) {
      setErro("Informe o motivo (mínimo 3 caracteres).")
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/admin/usuarios/${usuarioId}/creditos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantidade: qtd, motivo: motivo.trim(), operacao }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.erro || "Erro ao ajustar créditos.")
      } else {
        setMensagem(`${operacao === "adicionar" ? "Adicionados" : "Removidos"} ${qtd} créditos. Saldo: ${data.saldo_atual}`)
        setQuantidade("")
        setMotivo("")
        router.refresh()
      }
    } catch {
      setErro("Erro de comunicação com o servidor.")
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "var(--spacing-4)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <label style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
          <input
            type="radio"
            checked={operacao === "adicionar"}
            onChange={() => setOperacao("adicionar")}
            style={{ accentColor: "var(--primary-600)" }}
          />
          <span className="text-sm">Adicionar</span>
        </label>
        <label style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
          <input
            type="radio"
            checked={operacao === "remover"}
            onChange={() => setOperacao("remover")}
            style={{ accentColor: "var(--primary-600)" }}
          />
          <span className="text-sm">Remover</span>
        </label>
      </div>

      <input
        type="number"
        className="acam-form-input"
        placeholder="Quantidade"
        min="0.5"
        step="0.5"
        value={quantidade}
        onChange={(e) => setQuantidade(e.target.value)}
      />

      <textarea
        className="acam-form-input"
        placeholder="Motivo do ajuste..."
        rows={2}
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        style={{ resize: "vertical" }}
      />

      {erro && <div className="acam-alert acam-alert-error" style={{ fontSize: "0.8rem", padding: "0.5rem" }}>{erro}</div>}
      {mensagem && <div className="acam-alert acam-alert-success" style={{ fontSize: "0.8rem", padding: "0.5rem" }}>{mensagem}</div>}

      <button
        type="submit"
        className={`acam-btn ${operacao === "remover" ? "acam-btn-danger" : "acam-btn-primary"} acam-btn-sm`}
        disabled={loading}
        style={{ width: "100%" }}
      >
        {loading ? "Processando..." : `${operacao === "adicionar" ? "Adicionar" : "Remover"} créditos`}
      </button>
    </form>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function AssinanteForm() {
  const router = useRouter()
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [mensagem, setMensagem] = useState("")
  const [erro, setErro] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setMensagem("")

    if (!email.includes("@")) {
      setErro("E-mail inválido.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/admin/newsletter/assinantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), email: email.trim().toLowerCase() }),
      })

      const data = await res.json()

      if (res.ok) {
        setMensagem("Assinante adicionado.")
        setNome("")
        setEmail("")
        router.refresh()
      } else {
        setErro(data.erro || "Erro ao adicionar.")
      }
    } catch {
      setErro("Erro de comunicação.")
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
      <input
        type="text"
        className="acam-form-input"
        placeholder="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        style={{ flex: "1 1 150px" }}
      />
      <input
        type="email"
        className="acam-form-input"
        placeholder="E-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{ flex: "2 1 250px" }}
      />
      <button type="submit" className="acam-btn acam-btn-primary acam-btn-sm" disabled={loading}>
        {loading ? "Adicionando..." : "Adicionar"}
      </button>
      {erro && <div className="text-xs w-full" style={{ color: "var(--error)" }}>{erro}</div>}
      {mensagem && <div className="text-xs w-full" style={{ color: "var(--success)" }}>{mensagem}</div>}
    </form>
  )
}

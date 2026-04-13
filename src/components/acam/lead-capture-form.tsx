"use client"

import { useState } from "react"

export function LeadCaptureForm() {
  const [email, setEmail] = useState("")
  const [nome, setNome] = useState("")
  const [aceita, setAceita] = useState(true)
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")

    if (!email || !email.includes("@")) {
      setErro("Informe um e-mail válido.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          nome: nome.trim() || undefined,
          aceita_marketing: aceita,
        }),
      })

      if (res.ok) {
        setEnviado(true)
      } else {
        const data = await res.json()
        setErro(data.erro || "Erro ao registrar.")
      }
    } catch {
      setErro("Erro de comunicação.")
    }

    setLoading(false)
  }

  if (enviado) {
    return (
      <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
        <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1a3a2a", marginBottom: "0.5rem" }}>
          Cadastro realizado!
        </p>
        <p style={{ fontSize: "0.9rem", color: "#737373" }}>
          Você receberá novidades sobre o ACAM.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Seu nome (opcional)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{
            flex: "1 1 140px",
            padding: "0.7rem 1rem",
            borderRadius: "8px",
            border: "1px solid #d4d4d4",
            fontSize: "0.9rem",
            outline: "none",
          }}
        />
        <input
          type="email"
          placeholder="Seu melhor e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            flex: "2 1 200px",
            padding: "0.7rem 1rem",
            borderRadius: "8px",
            border: "1px solid #d4d4d4",
            fontSize: "0.9rem",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.7rem 1.5rem",
            borderRadius: "8px",
            border: "none",
            background: "#1a3a2a",
            color: "white",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Enviando..." : "Receber novidades"}
        </button>
      </div>

      {erro && <p style={{ color: "#dc2626", fontSize: "0.8rem", margin: 0 }}>{erro}</p>}

      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "#737373", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={aceita}
          onChange={(e) => setAceita(e.target.checked)}
          style={{ accentColor: "#1a3a2a" }}
        />
        Aceito receber novidades e atualizações do ACAM por e-mail
      </label>
    </form>
  )
}

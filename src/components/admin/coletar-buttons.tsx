"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function ColetarButtons() {
  const router = useRouter()
  const [loading, setLoading] = useState("")
  const [resultado, setResultado] = useState("")
  const [erro, setErro] = useState("")

  async function handleColetar(fonte: string) {
    setLoading(fonte)
    setResultado("")
    setErro("")

    try {
      const res = await fetch("/api/admin/newsletter/coletar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fonte }),
      })

      const data = await res.json()

      if (res.ok && data.sucesso) {
        setResultado(`${data.inseridas} nova(s), ${data.duplicatas} duplicata(s), ${data.relevantes} relevante(s)`)
        router.refresh()
      } else if (data.instrucoes) {
        setErro(data.instrucoes)
      } else {
        setErro(data.erro || "Erro na coleta.")
      }
    } catch {
      setErro("Erro de comunicação.")
    }

    setLoading("")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          className="acam-btn acam-btn-primary acam-btn-sm"
          onClick={() => handleColetar("rss")}
          disabled={!!loading}
        >
          {loading === "rss" ? "Coletando..." : "Coletar Notícias (RSS)"}
        </button>
        <button
          className="acam-btn acam-btn-secondary acam-btn-sm"
          onClick={() => handleColetar("mg")}
          disabled={!!loading}
        >
          MG (script local)
        </button>
        <button
          className="acam-btn acam-btn-secondary acam-btn-sm"
          onClick={() => handleColetar("dou")}
          disabled={!!loading}
        >
          DOU (script local)
        </button>
      </div>
      {resultado && <div className="text-xs" style={{ color: "var(--success)" }}>{resultado}</div>}
      {erro && <div className="text-xs" style={{ color: "var(--error)" }}>{erro}</div>}
    </div>
  )
}

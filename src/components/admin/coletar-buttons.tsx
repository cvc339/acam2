"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function ColetarButtons() {
  const router = useRouter()
  const [loading, setLoading] = useState("")
  const [resultado, setResultado] = useState("")
  const [erro, setErro] = useState("")

  async function handleColetar(fonte: "rss" | "dou" | "mg") {
    setLoading(fonte)
    setResultado("")
    setErro("")

    try {
      const endpoints = {
        rss: "/api/admin/newsletter/coletar",
        dou: "/api/admin/newsletter/coletar-dou",
        mg: "/api/admin/newsletter/coletar-mg",
      }

      const res = await fetch(endpoints[fonte], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const data = await res.json()

      if (res.ok && data.sucesso) {
        const partes = []
        if (data.inseridas !== undefined) partes.push(`${data.inseridas} nova(s)`)
        if (data.duplicatas !== undefined) partes.push(`${data.duplicatas} duplicata(s)`)
        if (data.relevantes !== undefined) partes.push(`${data.relevantes} relevante(s)`)
        setResultado(partes.join(", ") || "Coleta concluída")
        router.refresh()
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
          onClick={() => handleColetar("dou")}
          disabled={!!loading}
        >
          {loading === "dou" ? "Coletando DOU..." : "Coletar DOU (Inlabs)"}
        </button>
        <button
          className="acam-btn acam-btn-secondary acam-btn-sm"
          onClick={() => handleColetar("mg")}
          disabled={!!loading}
        >
          {loading === "mg" ? "Coletando MG..." : "Coletar MG (Puppeteer)"}
        </button>
      </div>
      {resultado && <div className="text-xs" style={{ color: "var(--success)" }}>{resultado}</div>}
      {erro && <div className="text-xs" style={{ color: "var(--error)" }}>{erro}</div>}
    </div>
  )
}

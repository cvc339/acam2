"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  itemId: number
  urlAtual: string | null
}

export function NewsletterEditUrl({ itemId, urlAtual }: Props) {
  const router = useRouter()
  const [editando, setEditando] = useState(false)
  const [url, setUrl] = useState(urlAtual || "")
  const [loading, setLoading] = useState(false)

  async function handleSalvar() {
    if (!url.trim()) return
    setLoading(true)

    try {
      const res = await fetch("/api/admin/newsletter/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, url: url.trim() }),
      })

      if (res.ok) {
        setEditando(false)
        router.refresh()
      }
    } catch {
      // silencioso
    }

    setLoading(false)
  }

  if (!editando) {
    return (
      <button
        onClick={() => setEditando(true)}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.7rem", color: "var(--primary-600)", textDecoration: "underline", padding: 0 }}
      >
        {urlAtual ? "editar link" : "adicionar link"}
      </button>
    )
  }

  return (
    <div style={{ display: "flex", gap: "0.25rem", marginTop: "0.25rem" }}>
      <input
        type="url"
        className="acam-form-input"
        style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", flex: 1 }}
        placeholder="https://..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        autoFocus
      />
      <button
        onClick={handleSalvar}
        disabled={loading}
        className="acam-btn acam-btn-primary acam-btn-sm"
        style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
      >
        {loading ? "..." : "OK"}
      </button>
      <button
        onClick={() => { setEditando(false); setUrl(urlAtual || "") }}
        className="acam-btn acam-btn-ghost acam-btn-sm"
        style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
      >
        ✕
      </button>
    </div>
  )
}

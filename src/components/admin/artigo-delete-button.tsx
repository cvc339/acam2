"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  id: string
  titulo: string
}

export function ArtigoDeleteButton({ id, titulo }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")

  async function handleDelete() {
    if (!confirm(`Excluir definitivamente o artigo "${titulo}"? Esta acao nao pode ser desfeita.`)) return
    setLoading(true)
    setErro("")
    try {
      const res = await fetch(`/api/admin/artigos/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErro(data.erro || "Erro ao excluir.")
        setLoading(false)
        return
      }
      router.push("/admin/artigos")
      router.refresh()
    } catch {
      setErro("Erro de comunicacao.")
      setLoading(false)
    }
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
      <button
        type="button"
        onClick={handleDelete}
        className="acam-btn acam-btn-ghost acam-btn-sm"
        disabled={loading}
        style={{ color: "var(--error)" }}
      >
        {loading ? "Excluindo..." : "Excluir"}
      </button>
      {erro && <span className="text-xs" style={{ color: "var(--error)" }}>{erro}</span>}
    </span>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  artigoId: string
  incluir: boolean
}

export function NewsletterArtigoActions({ artigoId, incluir }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(incluir)

  async function handleToggle() {
    setLoading(true)
    const novoValor = !checked

    try {
      const res = await fetch("/api/admin/newsletter/toggle-artigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: artigoId, incluir: novoValor }),
      })

      if (res.ok) {
        setChecked(novoValor)
        router.refresh()
      }
    } catch {
      // silencioso
    }

    setLoading(false)
  }

  return (
    <div style={{ paddingTop: "0.15rem" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleToggle}
        disabled={loading}
        style={{ accentColor: "var(--primary-600)", width: "1rem", height: "1rem", cursor: "pointer" }}
        title={checked ? "Remover da newsletter" : "Incluir na newsletter"}
      />
    </div>
  )
}

"use client"

import { useState } from "react"

export function ExportLeadsButton() {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/leads/exportar")
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `ACAM-Leads-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error("Erro ao exportar:", err)
    }
    setLoading(false)
  }

  return (
    <button
      className="acam-btn acam-btn-secondary acam-btn-sm"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? "Exportando..." : "Exportar CSV"}
    </button>
  )
}

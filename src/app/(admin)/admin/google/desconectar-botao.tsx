"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function DesconectarBotao() {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)

  async function desconectar() {
    if (!confirm("Desconectar o Google Calendar? Novos agendamentos deixarão de funcionar até você reconectar.")) {
      return
    }

    setCarregando(true)
    const resp = await fetch("/api/admin/google/desconectar", { method: "POST" })
    setCarregando(false)

    if (resp.ok) {
      router.refresh()
    } else {
      alert("Erro ao desconectar")
    }
  }

  return (
    <button
      type="button"
      onClick={desconectar}
      disabled={carregando}
      className="acam-btn acam-btn-outline acam-btn-sm acam-btn-danger"
    >
      {carregando ? "Desconectando..." : "Desconectar"}
    </button>
  )
}

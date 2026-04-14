"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  totalItens: number
  totalAssinantes: number
}

export function EnviarNewsletterButton({ totalItens, totalAssinantes }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<{ sucesso: boolean; mensagem: string } | null>(null)

  async function handleEnviar() {
    if (!confirm(`Confirma o envio de ${totalItens} itens para ${totalAssinantes} assinantes?`)) return

    setLoading(true)
    setResultado(null)

    try {
      const res = await fetch("/api/admin/newsletter/enviar", { method: "POST" })
      const data = await res.json()

      if (res.ok) {
        setResultado({ sucesso: true, mensagem: `Newsletter enviada para ${data.destinatarios} assinantes com ${data.itens} itens.` })
        router.refresh()
      } else {
        setResultado({ sucesso: false, mensagem: data.erro || "Erro ao enviar." })
      }
    } catch {
      setResultado({ sucesso: false, mensagem: "Erro de comunicação." })
    }

    setLoading(false)
  }

  return (
    <div>
      {resultado && (
        <div className={`acam-alert ${resultado.sucesso ? "acam-alert-success" : "acam-alert-error"} mb-4`}>
          {resultado.mensagem}
        </div>
      )}
      <button
        className="acam-btn acam-btn-primary"
        onClick={handleEnviar}
        disabled={loading || totalItens === 0 || totalAssinantes === 0}
      >
        {loading ? "Enviando..." : "Enviar Newsletter"}
      </button>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"

/**
 * Botão "Baixar Relatório PDF" das telas de resultado (14/10/2026).
 *
 * Antes, cada tela buscava o endereço do PDF no clique e chamava window.open depois de esperar a resposta. Os
 * navegadores bloqueiam janela aberta fora do clique direto: a aba aparecia e sumia, e o cliente ficava sem o
 * relatório (teste do titular em 14/10/2026). Aqui o endereço assinado é buscado assim que o resultado aparece e
 * o botão vira um link de verdade, que o navegador nunca bloqueia. O endereço vale por uma hora; se vencer, o
 * link busca um novo.
 */
export function BotaoRelatorioPDF({ consultaId }: { consultaId: string }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [estado, setEstado] = useState<"buscando" | "pronto" | "indisponivel" | "erro">("buscando")

  async function buscar() {
    setEstado("buscando")
    try {
      const res = await fetch(`/api/consultas/${consultaId}`)
      const data = await res.json()
      const url: string | null = data.consulta?.pdf_url ?? null
      setPdfUrl(url)
      setEstado(url ? "pronto" : "indisponivel")
    } catch {
      setEstado("erro")
    }
  }

  useEffect(() => {
    buscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultaId])

  if (estado === "pronto" && pdfUrl) {
    return (
      <a className="acam-btn acam-btn-primary" href={pdfUrl} target="_blank" rel="noopener noreferrer">
        Baixar Relatório PDF
      </a>
    )
  }
  if (estado === "buscando") {
    return (
      <button className="acam-btn acam-btn-primary" disabled>
        Preparando o relatório…
      </button>
    )
  }
  return (
    <button className="acam-btn acam-btn-primary" onClick={buscar}>
      {estado === "indisponivel" ? "PDF ainda não disponível. Tentar de novo" : "Erro ao buscar o PDF. Tentar de novo"}
    </button>
  )
}

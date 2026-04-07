"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { HeaderLogo, CompensacaoIcon, StatusBadge } from "@/components/acam"
import { identificarCompensacoes } from "@/lib/checklist/identificar"
import type { Compensacao } from "@/components/acam/compensacao-icon"

export default function ResultadoPage() {
  const [compensacoes, setCompensacoes] = useState<
    { id: Compensacao; nome: string; motivo: string }[]
  >([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("checklist_resultado")
    if (saved) {
      try {
        const respostas = JSON.parse(saved)
        const resultado = identificarCompensacoes(respostas)
        setCompensacoes(resultado)
      } catch {
        setCompensacoes([])
      }
    }
    setCarregando(false)
  }, [])

  if (carregando) return null

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--neutral-50)" }}>
      <header className="acam-header">
        <div className="acam-header-content">
          <HeaderLogo />
          <nav className="acam-header-nav">
            <Link href="/login" className="acam-btn acam-btn-ghost acam-btn-sm">Entrar</Link>
            <Link href="/registro" className="acam-btn acam-btn-primary acam-btn-sm">Criar conta</Link>
          </nav>
        </div>
      </header>

      <main style={{
        flex: 1, maxWidth: "var(--max-width-4xl)",
        margin: "0 auto", padding: "var(--spacing-8) var(--spacing-6)",
        width: "100%",
      }}>
        <div style={{ marginBottom: "var(--spacing-8)" }}>
          <h1 style={{
            fontFamily: "var(--font-family-heading)",
            fontSize: "var(--font-size-2xl)", fontWeight: 600,
            marginBottom: "var(--spacing-2)",
          }}>
            Resultado da Avaliação
          </h1>
          <p className="text-sm text-muted-foreground">
            {compensacoes.length > 0
              ? `${compensacoes.length} compensação${compensacoes.length > 1 ? "ões" : ""} identificada${compensacoes.length > 1 ? "s" : ""} para o seu empreendimento.`
              : "Nenhuma compensação identificada com base nas respostas fornecidas."
            }
          </p>
        </div>

        {compensacoes.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
            {compensacoes.map((c) => (
              <div key={c.id} className="acam-card" style={{
                padding: "var(--spacing-5)",
                display: "flex", alignItems: "flex-start", gap: "var(--spacing-4)",
              }}>
                <div style={{ color: "var(--primary-500)", flexShrink: 0, marginTop: "2px" }}>
                  <CompensacaoIcon compensacao={c.id} size={28} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 style={{ fontFamily: "var(--font-family-heading)", fontSize: "1.1rem", fontWeight: 600 }}>
                      {c.nome}
                    </h3>
                    <StatusBadge variant="warning">Provável</StatusBadge>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.motivo}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="acam-alert-result">
            <p>Com base nas respostas fornecidas, nenhuma compensação ambiental foi identificada.
            Isso pode ocorrer quando não há supressão de vegetação nativa ou quando o empreendimento
            não está sujeito a licenciamento ambiental.</p>
          </div>
        )}

        <div className="acam-alert-result" style={{ marginTop: "var(--spacing-8)" }}>
          <strong>Importante.</strong> Esta avaliação é preliminar e baseada nas respostas fornecidas.
          A confirmação das compensações aplicáveis depende de análise técnica aprofundada,
          que pode ser realizada com as ferramentas do ACAM.
        </div>

        <div className="flex gap-3" style={{ marginTop: "var(--spacing-6)" }}>
          <Link href="/registro" className="acam-btn acam-btn-primary">
            Criar conta e acessar ferramentas
          </Link>
          <Link href="/checklist" className="acam-btn acam-btn-secondary">
            Refazer avaliação
          </Link>
        </div>
      </main>
    </div>
  )
}

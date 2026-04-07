"use client"

import { useState } from "react"
import Link from "next/link"
import { HeaderLogo } from "@/components/acam"
import { PRODUTOS, calcularReposicaoItem, type Produto } from "@/lib/calculo/intervencao"

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
}

// Apenas produtos de floresta nativa (que geram reposição)
const produtosNativa = PRODUTOS.filter((p) => p.arvores > 0)

export default function ReposicaoFlorestalPage() {
  const [ufemg] = useState({ ano: 2026, valor: 5.7899 })
  const [volumes, setVolumes] = useState<Record<string, number>>({})
  const [calculado, setCalculado] = useState(false)

  function calcular() {
    setCalculado(true)
  }

  const itens = produtosNativa
    .filter((p) => (volumes[p.id] || 0) > 0)
    .map((p) => {
      const vol = volumes[p.id] || 0
      const valor = calcularReposicaoItem(p, vol, ufemg.valor)
      const arvores = Math.ceil(vol * p.arvores)
      return { produto: p, volume: vol, valor, arvores }
    })

  const totalValor = itens.reduce((s, i) => s + i.valor, 0)
  const totalArvores = itens.reduce((s, i) => s + i.arvores, 0)

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--neutral-50)" }}>
      <header className="acam-header">
        <div className="acam-header-content">
          <HeaderLogo />
          <div className="flex items-center gap-3">
            <span className="acam-badge acam-badge-primary" style={{ fontSize: "var(--font-size-xs)" }}>
              UFEMG {ufemg.ano}: R$ {ufemg.valor.toFixed(4)}
            </span>
            <Link href="/dashboard" className="acam-btn acam-btn-ghost acam-btn-sm">Dashboard</Link>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "var(--spacing-8) var(--spacing-6)", width: "100%" }}>
        <div className="mb-6">
          <Link href="/dashboard" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-4" style={{ textDecoration: "none" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Voltar ao dashboard
          </Link>
          <h1 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-2xl)", fontWeight: 600 }}>
            Cálculo de Reposição Florestal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Calcule a reposição florestal com base nos quantitativos de matéria-prima florestal nativa.
          </p>
        </div>

        <div className="acam-alert-result mb-6">
          <strong>Gratuita.</strong> Esta ferramenta não consome créditos. Base legal: Lei 20.922/2013, Art. 78.
        </div>

        <div className="acam-card mb-6" style={{ padding: "var(--spacing-6)" }}>
          <div className="acam-section-title">Quantitativos de matéria-prima florestal nativa</div>
          <div className="acam-section-desc">Informe o volume de cada produto extraído de floresta nativa.</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
            {produtosNativa.map((p) => (
              <div key={p.id} className="acam-field">
                <label>
                  {p.nome}
                  <span className="text-xs text-muted-foreground ml-1">({p.unidade}) — {p.arvores} árvores/{p.unidade}</span>
                </label>
                <input
                  type="number"
                  className="acam-form-input"
                  placeholder={`0 ${p.unidade}`}
                  min="0"
                  step="0.01"
                  style={{ maxWidth: "250px" }}
                  value={volumes[p.id] || ""}
                  onChange={(e) => setVolumes({ ...volumes, [p.id]: parseFloat(e.target.value) || 0 })}
                />
              </div>
            ))}
          </div>
        </div>

        <button onClick={calcular} className="acam-btn acam-btn-primary mb-8">
          Calcular reposição
        </button>

        {calculado && itens.length > 0 && (
          <div className="acam-card" style={{ padding: "var(--spacing-5)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Reposição Florestal</h3>
              <span style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-xl)", fontWeight: 700, color: "var(--primary-600)" }}>
                {formatarMoeda(totalValor)}
              </span>
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              Total de árvores a repor: <strong>{totalArvores}</strong>
            </div>
            {itens.map((item) => (
              <div key={item.produto.id} className="flex justify-between text-sm py-2" style={{ borderTop: "1px solid var(--neutral-100)" }}>
                <div>
                  <span className="font-medium">{item.produto.nome}</span>
                  <span className="text-muted-foreground ml-2">
                    ({item.volume} {item.produto.unidade} × {item.produto.arvores} = {item.arvores} árvores)
                  </span>
                </div>
                <span>{formatarMoeda(item.valor)}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-4">
              UFEMG {ufemg.ano}: R$ {ufemg.valor.toFixed(4)} — Valores estimados, sujeitos a atualização.
            </p>
          </div>
        )}

        {calculado && itens.length === 0 && (
          <div className="acam-alert-result">
            Informe ao menos um volume de produto florestal nativo para calcular a reposição.
          </div>
        )}
      </main>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { HeaderLogo } from "@/components/acam"
import {
  ATIVIDADES,
  PRODUTOS,
  calcularIntervencao,
  type Atividade,
  type Produto,
  type ResultadoIntervencao,
} from "@/lib/calculo/intervencao"

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor)
}

export default function CalculadoraPage() {
  // UFEMG
  const [ufemg, setUfemg] = useState({ ano: 2026, valor: 5.7899 })

  // Step 1: Tipo de vegetação
  const [tipoVegetacao, setTipoVegetacao] = useState<"nativa" | "plantada" | "ambas" | "">("")
  const [temManejo, setTemManejo] = useState(false)
  const [temAPP, setTemAPP] = useState(false)
  const [tiposAPP, setTiposAPP] = useState<string[]>([])
  const [temAproveitamento, setTemAproveitamento] = useState(false)
  const [temProdutos, setTemProdutos] = useState(false)

  // Quantidades e volumes
  const [quantidades, setQuantidades] = useState<Record<string, number>>({})
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([])
  const [volumes, setVolumes] = useState<Record<string, number>>({})

  // Resultado
  const [resultado, setResultado] = useState<ResultadoIntervencao | null>(null)

  // Buscar UFEMG do banco
  useEffect(() => {
    async function fetchUfemg() {
      try {
        const res = await fetch("/api/pagamento/pacotes") // usa a mesma rota que já existe
        if (res.ok) {
          // TODO: criar rota específica para UFEMG quando admin estiver pronto
        }
      } catch {
        // Usa fallback
      }
    }
    fetchUfemg()
  }, [])

  // Montar lista de atividades disponíveis
  function getAtividadesDisponiveis(): Atividade[] {
    const lista: Atividade[] = []
    if (tipoVegetacao === "nativa" || tipoVegetacao === "ambas") {
      lista.push(...ATIVIDADES.nativa)
      if (temManejo) lista.push(...ATIVIDADES.manejo)
    }
    if (tipoVegetacao === "plantada" || tipoVegetacao === "ambas") {
      lista.push(...ATIVIDADES.plantada)
    }
    if (temAPP) {
      for (const tipo of tiposAPP) {
        if (tipo === "com_supressao") lista.push(...ATIVIDADES.app_com_supressao)
        if (tipo === "sem_supressao") lista.push(...ATIVIDADES.app_sem_supressao)
        if (tipo === "plantada_app") lista.push(...ATIVIDADES.app_plantada)
      }
    }
    if (temAproveitamento) lista.push(...ATIVIDADES.aproveitamento)
    return lista
  }

  function calcular() {
    const atividades = getAtividadesDisponiveis().map((a) => ({
      atividade: a,
      quantidade: quantidades[a.id] || 0,
    }))

    const produtos = produtosSelecionados.map((id) => ({
      produto: PRODUTOS.find((p) => p.id === id)!,
      volume: volumes[id] || 0,
    }))

    const res = calcularIntervencao(atividades, produtos, ufemg.valor, ufemg.ano)
    setResultado(res)
  }

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
            Calculadora de Intervenção Ambiental
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Calcule a taxa de expediente, taxa florestal e reposição florestal.
          </p>
        </div>

        <div className="acam-alert-result mb-6">
          <strong>Gratuita.</strong> Esta ferramenta não consome créditos. Os valores calculados são estimativas baseadas na UFEMG vigente.
        </div>

        {/* Step 1: Tipo de vegetação */}
        <div className="acam-card mb-6" style={{ padding: "var(--spacing-6)" }}>
          <div className="acam-section-title">Tipo de vegetação</div>
          <div className="acam-section-desc">Selecione o tipo de vegetação envolvida na intervenção.</div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { valor: "nativa", texto: "Vegetação nativa" },
              { valor: "plantada", texto: "Floresta plantada" },
              { valor: "ambas", texto: "Ambas (nativa e plantada)" },
            ].map((op) => (
              <button
                key={op.valor}
                onClick={() => setTipoVegetacao(op.valor as typeof tipoVegetacao)}
                className="acam-card acam-card-hover"
                style={{
                  padding: "12px 16px", cursor: "pointer", textAlign: "left",
                  fontSize: "var(--font-size-sm)", fontWeight: 500,
                  border: tipoVegetacao === op.valor ? "2px solid var(--primary-500)" : undefined,
                }}
              >
                {op.texto}
              </button>
            ))}
          </div>
        </div>

        {/* Opções condicionais */}
        {tipoVegetacao && (
          <div className="acam-card mb-6" style={{ padding: "var(--spacing-6)" }}>
            <div className="acam-section-title">Opções adicionais</div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "var(--spacing-4)" }}>
              {(tipoVegetacao === "nativa" || tipoVegetacao === "ambas") && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="acam-form-checkbox" checked={temManejo} onChange={(e) => setTemManejo(e.target.checked)} />
                  Plano de manejo sustentável
                </label>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="acam-form-checkbox" checked={temAPP} onChange={(e) => setTemAPP(e.target.checked)} />
                Intervenção em APP
              </label>
              {temAPP && (
                <div style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { valor: "com_supressao", texto: "Com supressão em APP" },
                    { valor: "sem_supressao", texto: "Sem supressão em APP" },
                    { valor: "plantada_app", texto: "Maciço plantado em APP" },
                  ].map((op) => (
                    <label key={op.valor} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="acam-form-checkbox"
                        checked={tiposAPP.includes(op.valor)}
                        onChange={(e) => {
                          if (e.target.checked) setTiposAPP([...tiposAPP, op.valor])
                          else setTiposAPP(tiposAPP.filter((t) => t !== op.valor))
                        }}
                      />
                      {op.texto}
                    </label>
                  ))}
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="acam-form-checkbox" checked={temAproveitamento} onChange={(e) => setTemAproveitamento(e.target.checked)} />
                Aproveitamento de material lenhoso
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="acam-form-checkbox" checked={temProdutos} onChange={(e) => setTemProdutos(e.target.checked)} />
                Produtos florestais (taxa florestal)
              </label>
            </div>
          </div>
        )}

        {/* Quantidades das atividades */}
        {tipoVegetacao && getAtividadesDisponiveis().length > 0 && (
          <div className="acam-card mb-6" style={{ padding: "var(--spacing-6)" }}>
            <div className="acam-section-title">Quantidades</div>
            <div className="acam-section-desc">Informe a quantidade para cada atividade.</div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
              {getAtividadesDisponiveis().map((a) => (
                <div key={a.id} className="acam-field">
                  <label>{a.nome} <span className="text-xs text-muted-foreground">({a.unidade})</span></label>
                  <input
                    type="number"
                    className="acam-form-input"
                    placeholder={`0 ${a.unidade}${a.unidade !== "m³" ? "s" : ""}`}
                    min="0"
                    step="0.01"
                    value={quantidades[a.id] || ""}
                    onChange={(e) => setQuantidades({ ...quantidades, [a.id]: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Produtos florestais */}
        {temProdutos && (
          <div className="acam-card mb-6" style={{ padding: "var(--spacing-6)" }}>
            <div className="acam-section-title">Produtos florestais</div>
            <div className="acam-section-desc">Selecione os produtos e informe os volumes.</div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
              {PRODUTOS.map((p) => (
                <div key={p.id}>
                  <label className="flex items-center gap-2 text-sm mb-1">
                    <input
                      type="checkbox"
                      className="acam-form-checkbox"
                      checked={produtosSelecionados.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) setProdutosSelecionados([...produtosSelecionados, p.id])
                        else setProdutosSelecionados(produtosSelecionados.filter((id) => id !== p.id))
                      }}
                    />
                    {p.nome}
                  </label>
                  {produtosSelecionados.includes(p.id) && (
                    <div style={{ paddingLeft: "24px", marginTop: "4px" }}>
                      <input
                        type="number"
                        className="acam-form-input"
                        placeholder={`Volume em ${p.unidade}`}
                        min="0"
                        step="0.01"
                        style={{ maxWidth: "200px" }}
                        value={volumes[p.id] || ""}
                        onChange={(e) => setVolumes({ ...volumes, [p.id]: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão calcular */}
        {tipoVegetacao && (
          <button onClick={calcular} className="acam-btn acam-btn-primary mb-8">
            Calcular
          </button>
        )}

        {/* Resultado */}
        {resultado && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
            <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-xl)", fontWeight: 600 }}>
              Resultado
            </h2>

            {/* Taxa de Expediente */}
            {resultado.taxaExpediente.total > 0 && (
              <div className="acam-card" style={{ padding: "var(--spacing-5)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Taxa de Expediente</h3>
                  <span style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-xl)", fontWeight: 700, color: "var(--primary-600)" }}>
                    {formatarMoeda(resultado.taxaExpediente.total)}
                  </span>
                </div>
                {resultado.taxaExpediente.itens.map((item) => (
                  <div key={item.codigo} className="flex justify-between text-sm py-2" style={{ borderTop: "1px solid var(--neutral-100)" }}>
                    <div>
                      <span className="font-medium">{item.nome}</span>
                      <span className="text-muted-foreground ml-2">({item.detalhe})</span>
                    </div>
                    <span>{formatarMoeda(item.valor)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Taxa Florestal */}
            {resultado.taxaFlorestal.total > 0 && (
              <div className="acam-card" style={{ padding: "var(--spacing-5)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Taxa Florestal</h3>
                  <span style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-xl)", fontWeight: 700, color: "var(--primary-600)" }}>
                    {formatarMoeda(resultado.taxaFlorestal.total)}
                  </span>
                </div>
                {resultado.taxaFlorestal.itens.map((item) => (
                  <div key={item.codigo} className="flex justify-between text-sm py-2" style={{ borderTop: "1px solid var(--neutral-100)" }}>
                    <div>
                      <span className="font-medium">{item.nome}</span>
                      <span className="text-muted-foreground ml-2">({item.detalhe})</span>
                    </div>
                    <span>{formatarMoeda(item.valor)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Reposição Florestal */}
            {resultado.reposicaoFlorestal.total > 0 && (
              <div className="acam-card" style={{ padding: "var(--spacing-5)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Reposição Florestal</h3>
                  <span style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-xl)", fontWeight: 700, color: "var(--primary-600)" }}>
                    {formatarMoeda(resultado.reposicaoFlorestal.total)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  Total de árvores a repor: <strong>{resultado.reposicaoFlorestal.arvoresTotal}</strong>
                </div>
                {resultado.reposicaoFlorestal.itens.map((item) => (
                  <div key={item.codigo} className="flex justify-between text-sm py-2" style={{ borderTop: "1px solid var(--neutral-100)" }}>
                    <div>
                      <span className="font-medium">{item.nome}</span>
                      <span className="text-muted-foreground ml-2">({item.detalhe})</span>
                    </div>
                    <span>{formatarMoeda(item.valor)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Total geral */}
            <div className="acam-card acam-card-primary" style={{ padding: "var(--spacing-5)" }}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Total Geral</h3>
                <span style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-2xl)", fontWeight: 700, color: "var(--primary-600)" }}>
                  {formatarMoeda(resultado.total)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                UFEMG {resultado.ufemgAno}: R$ {resultado.ufemgValor.toFixed(4)} — Valores estimados, sujeitos a atualização.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

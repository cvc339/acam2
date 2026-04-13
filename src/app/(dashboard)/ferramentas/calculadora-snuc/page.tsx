"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { StatusBadge } from "@/components/acam"
import {
  FATORES_FR,
  OPCOES_FT,
  OPCOES_FA,
  calcularSNUC,
  type FatorSelecionado,
  type ResultadoSNUC,
} from "@/lib/calculo/snuc"
import { formatBRL as fmt, formatNum as fmtNum } from "@/lib/format"
import { downloadPDF } from "@/lib/pdf/download"
import { debitarCreditos } from "@/lib/creditos/client"
import { maskBRL, unmaskBRL } from "@/lib/masks"

const CUSTO_CREDITOS = 7
const FERRAMENTA_ID = "calc-snuc"

// ============================================
// TIPOS DA ANÁLISE GEOESPACIAL
// ============================================

interface ResultadoGeo {
  fatores: {
    fr3a: boolean
    fr3b: boolean
    fr4: boolean
    fr5: boolean
    areaPrioritaria: { nivel: string; fatorId: string; nome?: string } | null
  }
  detalhes: {
    ucs: Array<{ nome: string; categoria: string; motivo: string }>
    ecossistemas: Array<{ tipo: string; nome: string }>
    cavidades: number
  }
  geometria: {
    areaHa?: number
  }
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function CalculadoraSNUCPage() {
  const router = useRouter()

  // Estado geral
  const [etapa, setEtapa] = useState(1)
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  const [saldo, setSaldo] = useState<number | null>(null)
  const [resultado, setResultado] = useState<ResultadoSNUC | null>(null)

  // Etapa 1 — Upload ADA (opcional)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [analisando, setAnalisando] = useState(false)
  const [resultadoGeo, setResultadoGeo] = useState<ResultadoGeo | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Etapa 2 — VR + FR
  const [valorReferencia, setValorReferencia] = useState("")
  const [frSelecionados, setFrSelecionados] = useState<Record<string, boolean>>({})
  const [frBloqueados, setFrBloqueados] = useState<Record<string, boolean>>({})

  // Etapa 3 — FT + FA
  const [ftSelecionado, setFtSelecionado] = useState("")
  const [faSelecionado, setFaSelecionado] = useState("")

  // Dados para PDF (análise geo)
  const [analiseGeoespacial, setAnaliseGeoespacial] = useState(false)
  const [detalhesGeo, setDetalhesGeo] = useState<ResultadoGeo["detalhes"] | null>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("saldo_creditos")
          .select("saldo")
          .eq("usuario_id", user.id)
          .single()
        setSaldo(data?.saldo ?? 0)
      }
    }
    init()
  }, [])

  // ============================================
  // ETAPA 1 — ANÁLISE GEOESPACIAL
  // ============================================

  async function handleAnalisar() {
    if (!arquivo) return
    setErro("")
    setAnalisando(true)

    try {
      const formData = new FormData()
      formData.append("arquivo", arquivo)

      const res = await fetch("/api/consultas/calc-snuc", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.sucesso) {
        setErro(data.erro || "Erro na análise geoespacial")
        setAnalisando(false)
        return
      }

      const geo = data as ResultadoGeo
      setResultadoGeo(geo)
      setAnaliseGeoespacial(true)
      setDetalhesGeo(geo.detalhes)

      // Auto-selecionar e bloquear fatores detectados
      const novosFR = { ...frSelecionados }
      const novosBloqueados = { ...frBloqueados }

      if (geo.fatores.fr3a) {
        novosFR["fr3a"] = true
        novosBloqueados["fr3a"] = true
        // Desmarcar fr3b se estava selecionado
        delete novosFR["fr3b"]
        novosBloqueados["fr3b"] = true // bloquear grupo inteiro
      } else if (geo.fatores.fr3b) {
        novosFR["fr3b"] = true
        novosBloqueados["fr3b"] = true
        novosBloqueados["fr3a"] = true
      }

      if (geo.fatores.fr4) {
        novosFR["fr4"] = true
        novosBloqueados["fr4"] = true
      }

      if (geo.fatores.fr5) {
        novosFR["fr5"] = true
        novosBloqueados["fr5"] = true
      }

      if (geo.fatores.areaPrioritaria) {
        const fatorId = geo.fatores.areaPrioritaria.fatorId
        novosFR[fatorId] = true
        novosBloqueados[fatorId] = true
        // Bloquear todo o grupo FR6
        for (const f of FATORES_FR.filter((f) => f.grupo === "fr6")) {
          novosBloqueados[f.id] = true
        }
      }

      setFrSelecionados(novosFR)
      setFrBloqueados(novosBloqueados)
    } catch {
      setErro("Erro ao comunicar com o servidor")
    }

    setAnalisando(false)
  }

  // ============================================
  // SELEÇÃO DE FATORES FR
  // ============================================

  function toggleFR(id: string) {
    if (frBloqueados[id]) return

    const fator = FATORES_FR.find((f) => f.id === id)
    if (!fator) return

    setFrSelecionados((prev) => {
      const novo = { ...prev }

      if (fator.tipo === "radio" && fator.grupo) {
        // Desmarcar outros do mesmo grupo
        for (const f of FATORES_FR.filter((f) => f.grupo === fator.grupo)) {
          delete novo[f.id]
        }
        // Se já estava selecionado, apenas desmarca (toggle off)
        if (prev[id]) return novo
        novo[id] = true
      } else {
        // Checkbox — toggle
        if (novo[id]) {
          delete novo[id]
        } else {
          novo[id] = true
        }
      }

      return novo
    })
  }

  // ============================================
  // CÁLCULO DO TOTAL FR (tempo real)
  // ============================================

  const totalFR = Object.keys(frSelecionados)
    .filter((id) => frSelecionados[id])
    .reduce((soma, id) => {
      const fator = FATORES_FR.find((f) => f.id === id)
      return soma + (fator?.valor || 0)
    }, 0)

  // ============================================
  // ETAPA FINAL — CALCULAR
  // ============================================

  async function handleCalcular() {
    setErro("")

    const vr = unmaskBRL(valorReferencia)
    if (!vr || vr <= 0) {
      setErro("Informe o Valor de Referência (VR).")
      return
    }

    if (totalFR <= 0) {
      setErro("Selecione ao menos um Fator de Relevância (FR).")
      return
    }

    if (!ftSelecionado) {
      setErro("Selecione o Fator de Temporalidade (FT).")
      return
    }

    if (!faSelecionado) {
      setErro("Selecione o Fator de Abrangência (FA).")
      return
    }

    if (saldo !== null && saldo < CUSTO_CREDITOS) {
      setErro(`Saldo insuficiente. Você tem ${saldo} créditos, mas esta ferramenta custa ${CUSTO_CREDITOS}.`)
      return
    }

    setLoading(true)

    try {
      // Debitar créditos
      const debito = await debitarCreditos(
        CUSTO_CREDITOS,
        FERRAMENTA_ID,
        `Calculadora SNUC — VR ${fmt(vr)}`,
      )
      if (!debito.ok) {
        setErro(debito.erro)
        setLoading(false)
        return
      }

      // Montar fatores FR selecionados
      const fatoresFR: FatorSelecionado[] = Object.keys(frSelecionados)
        .filter((id) => frSelecionados[id])
        .map((id) => {
          const fator = FATORES_FR.find((f) => f.id === id)!
          return {
            id: fator.id,
            descricao: fator.descricao,
            valor: fator.valor,
            autoDetectado: frBloqueados[id] || false,
          }
        })

      const ft = OPCOES_FT.find((o) => o.id === ftSelecionado)!
      const fa = OPCOES_FA.find((o) => o.id === faSelecionado)!

      const calc = calcularSNUC(
        vr,
        fatoresFR,
        { id: ft.id, descricao: ft.descricao, valor: ft.valor },
        { id: fa.id, descricao: fa.descricao, valor: fa.valor },
      )

      setResultado(calc)
      setSaldo((prev) => (prev !== null ? prev - CUSTO_CREDITOS : null))
      router.refresh()
    } catch {
      setErro("Erro ao processar. Tente novamente.")
    }

    setLoading(false)
  }

  // ============================================
  // DOWNLOAD PDF
  // ============================================

  async function handleDownloadPDF() {
    if (!resultado) return

    try {
      const body = {
        ...resultado,
        analiseGeoespacial,
        detalhesGeo: detalhesGeo ? {
          ucs: detalhesGeo.ucs,
          ecossistemas: detalhesGeo.ecossistemas,
          cavidades: detalhesGeo.cavidades,
          areaPrioritaria: resultadoGeo?.fatores.areaPrioritaria || undefined,
        } : undefined,
      }

      const res = await fetch("/api/pdf/snuc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        await downloadPDF(res, `ACAM-Calculadora-SNUC-${new Date().toISOString().slice(0, 10)}.pdf`)
      }
    } catch (err) {
      console.error("Erro ao gerar PDF:", err)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div>
      <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "var(--spacing-4) var(--spacing-6) 0" }}>
        <Link href="/dashboard" className="text-sm text-muted-foreground inline-flex items-center gap-1" style={{ textDecoration: "none" }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Voltar ao dashboard
        </Link>
      </div>

      {/* Service Header */}
      <div className="acam-service-header acam-service-header-primary">
        <div className="acam-service-header-content">
          <div className="acam-service-header-info">
            <div className="acam-service-header-icon">§</div>
            <div className="acam-service-header-text">
              <h1>Calculadora de Compensação SNUC</h1>
              <p>Estimativa do valor de compensação para empreendimentos de significativo impacto ambiental</p>
            </div>
          </div>
          <div className="acam-service-header-cost">
            <div className="acam-service-header-cost-label">Custo</div>
            <div className="acam-service-header-cost-value">{CUSTO_CREDITOS} créditos</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "var(--spacing-8) var(--spacing-6)", width: "100%" }}>

      {/* ========== RESULTADO ========== */}
      {resultado ? (
        <ResultadoView
          resultado={resultado}
          analiseGeoespacial={analiseGeoespacial}
          detalhesGeo={detalhesGeo}
          resultadoGeo={resultadoGeo}
          onDownloadPDF={handleDownloadPDF}
        />
      ) : (
        <>
          {/* Wizard steps indicator */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "var(--spacing-6)" }}>
            {[
              { n: 1, label: "Área (opcional)" },
              { n: 2, label: "VR + Relevância" },
              { n: 3, label: "Temporalidade" },
            ].map(({ n, label }) => (
              <div
                key={n}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "0.5rem",
                  borderRadius: "var(--radius)",
                  fontSize: "0.8rem",
                  fontWeight: etapa === n ? 700 : 400,
                  background: etapa === n ? "var(--primary-600)" : etapa > n ? "var(--primary-100)" : "var(--grey-100)",
                  color: etapa === n ? "white" : etapa > n ? "var(--primary-700)" : "var(--grey-500)",
                  transition: "all 0.2s",
                }}
              >
                {n}. {label}
              </div>
            ))}
          </div>

          {/* ========== ETAPA 1 — Upload ADA ========== */}
          {etapa === 1 && (
            <div>
              <div className="acam-card">
                <div className="acam-section-title">Análise Geoespacial da ADA</div>
                <div className="acam-section-desc">
                  Envie o arquivo KML ou GeoJSON da Área Diretamente Afetada (ADA) do empreendimento
                  para detectar automaticamente fatores de relevância. <strong>Este passo é opcional</strong> —
                  você pode pular e selecionar os fatores manualmente.
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".kml,.geojson,.json"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    setArquivo(e.target.files?.[0] || null)
                    setResultadoGeo(null)
                  }}
                />

                <div
                  className={`acam-upload-zone${arquivo ? " acam-upload-zone-success" : ""}`}
                  onClick={() => fileRef.current?.click()}
                  style={{ cursor: "pointer" }}
                >
                  {arquivo ? (
                    <div>
                      <p className="font-medium">{arquivo.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(arquivo.size / 1024).toFixed(1)} KB — Clique para trocar
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Clique para selecionar arquivo</p>
                      <p className="text-sm text-muted-foreground">Formatos aceitos: .kml, .geojson</p>
                    </div>
                  )}
                </div>

                {arquivo && !resultadoGeo && (
                  <button
                    className="acam-btn acam-btn-secondary mt-4"
                    style={{ width: "100%" }}
                    onClick={handleAnalisar}
                    disabled={analisando}
                  >
                    {analisando ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="acam-spinner acam-spinner-sm" />
                        Analisando com IDE-Sisema...
                      </span>
                    ) : (
                      "Analisar com IDE-Sisema"
                    )}
                  </button>
                )}

                {/* Resultado da análise geoespacial */}
                {resultadoGeo && (
                  <div style={{ marginTop: "var(--spacing-4)" }}>
                    <div className="acam-section-title" style={{ fontSize: "0.9rem" }}>Fatores detectados</div>

                    {resultadoGeo.fatores.fr5 && (
                      <div className="acam-alert-result" style={{ marginBottom: "0.5rem" }}>
                        <StatusBadge variant="warning">FR5</StatusBadge>
                        {" "}UC de Proteção Integral — {resultadoGeo.detalhes.ucs.map((u) => u.nome).join(", ")}
                      </div>
                    )}

                    {resultadoGeo.fatores.fr3a && (
                      <div className="acam-alert-result" style={{ marginBottom: "0.5rem" }}>
                        <StatusBadge variant="info">FR3a</StatusBadge>
                        {" "}Ecossistema protegido — {resultadoGeo.detalhes.ecossistemas.map((e) => e.nome).join(", ")}
                      </div>
                    )}

                    {resultadoGeo.fatores.fr3b && !resultadoGeo.fatores.fr3a && (
                      <div className="acam-alert-result" style={{ marginBottom: "0.5rem" }}>
                        <StatusBadge variant="primary">FR3b</StatusBadge>
                        {" "}Outros biomas (sem ecossistema especialmente protegido detectado)
                      </div>
                    )}

                    {resultadoGeo.fatores.fr4 && (
                      <div className="acam-alert-result" style={{ marginBottom: "0.5rem" }}>
                        <StatusBadge variant="warning">FR4</StatusBadge>
                        {" "}Patrimônio espeleológico — {resultadoGeo.detalhes.cavidades} cavidade(s) na área
                      </div>
                    )}

                    {resultadoGeo.fatores.areaPrioritaria && (
                      <div className="acam-alert-result" style={{ marginBottom: "0.5rem" }}>
                        <StatusBadge variant="info">{resultadoGeo.fatores.areaPrioritaria.fatorId.toUpperCase()}</StatusBadge>
                        {" "}Área prioritária — Importância {resultadoGeo.fatores.areaPrioritaria.nivel}
                      </div>
                    )}

                    {!resultadoGeo.fatores.fr5 && !resultadoGeo.fatores.fr4 && !resultadoGeo.fatores.areaPrioritaria && !resultadoGeo.fatores.fr3a && (
                      <div className="acam-alert-result">
                        Nenhum fator geoespacial detectado na área. Selecione manualmente na próxima etapa.
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      Fatores detectados serão pré-selecionados e travados na próxima etapa.
                    </p>
                  </div>
                )}
              </div>

              {erro && <div className="acam-alert acam-alert-error">{erro}</div>}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "var(--spacing-4)" }}>
                <button
                  className="acam-btn acam-btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => { setErro(""); setEtapa(2) }}
                >
                  {resultadoGeo || !arquivo ? "Continuar" : "Pular análise e continuar"}
                </button>
              </div>
            </div>
          )}

          {/* ========== ETAPA 2 — VR + FR ========== */}
          {etapa === 2 && (
            <div>
              <div className="acam-card">
                <div className="acam-section-title">Valor de Referência (VR)</div>
                <div className="acam-section-desc">
                  Somatório dos investimentos inerentes à implantação do empreendimento, sem incluir:
                </div>
                <ul className="text-sm text-muted-foreground" style={{ paddingLeft: "1.25rem", marginBottom: "var(--spacing-4)", lineHeight: 1.7 }}>
                  <li>Planos, projetos, programas e condicionantes de mitigação exigidos no licenciamento</li>
                  <li>Custos de análise do licenciamento ambiental</li>
                  <li>Investimentos para atingir qualidade ambiental superior à exigida</li>
                  <li>Encargos e custos de financiamento (incluindo garantias)</li>
                  <li>Apólices e prêmios de seguros pessoais e reais</li>
                </ul>
                <div className="acam-section-desc" style={{ marginBottom: "var(--spacing-2)" }}>
                  Deve ser declarado por profissional habilitado, com responsabilidade técnica (ART/RRT).
                </div>

                <div className="acam-field" style={{ marginBottom: "var(--spacing-6)" }}>
                  <label>Valor de Referência em Reais (R$) <span className="req">*</span></label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--grey-500)", fontWeight: 600, fontSize: "0.9rem", pointerEvents: "none" }}>R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="acam-form-input"
                      style={{ paddingLeft: "2.5rem" }}
                      placeholder="0,00"
                      value={valorReferencia}
                      onChange={(e) => setValorReferencia(maskBRL(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="acam-card">
                <div className="acam-section-title">
                  Fator de Relevância (FR)
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    Total: {fmtNum(totalFR, 4)}
                  </span>
                </div>
                <div className="acam-section-desc">
                  Selecione os fatores aplicáveis ao empreendimento com base no EIA/RIMA.
                  {Object.keys(frBloqueados).length > 0 && (
                    <> Fatores com <StatusBadge variant="accent">Detectado</StatusBadge> foram identificados pela análise geoespacial e estão travados.</>
                  )}
                </div>

                {/* Agrupar fatores: checkboxes primeiro, depois radio groups */}
                {renderFatoresFR()}
              </div>

              {erro && <div className="acam-alert acam-alert-error">{erro}</div>}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "var(--spacing-4)" }}>
                <button
                  className="acam-btn acam-btn-ghost"
                  onClick={() => { setErro(""); setEtapa(1) }}
                >
                  Voltar
                </button>
                <button
                  className="acam-btn acam-btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setErro("")
                    const vr = unmaskBRL(valorReferencia)
                    if (!vr || vr <= 0) {
                      setErro("Informe o Valor de Referência.")
                      return
                    }
                    if (totalFR <= 0) {
                      setErro("Selecione ao menos um Fator de Relevância.")
                      return
                    }
                    setEtapa(3)
                  }}
                >
                  Próximo
                </button>
              </div>
            </div>
          )}

          {/* ========== ETAPA 3 — FT + FA ========== */}
          {etapa === 3 && (
            <div>
              <div className="acam-card">
                <div className="acam-section-title">Fator de Temporalidade (FT)</div>
                <div className="acam-section-desc">
                  Duração total do empreendimento: instalação + operação + descomissionamento + recuperação ambiental.
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {OPCOES_FT.map((opcao) => (
                    <label
                      key={opcao.id}
                      className={`acam-card-compact${ftSelecionado === opcao.id ? " acam-card-border-primary" : ""}`}
                      style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", cursor: "pointer" }}
                    >
                      <input
                        type="radio"
                        name="ft"
                        checked={ftSelecionado === opcao.id}
                        onChange={() => setFtSelecionado(opcao.id)}
                        style={{ accentColor: "var(--primary-600)" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div className="font-medium text-sm">{opcao.descricao}</div>
                        <div className="text-xs text-muted-foreground">{opcao.detalhamento}</div>
                      </div>
                      <StatusBadge variant="primary">{fmtNum(opcao.valor, 3)}</StatusBadge>
                    </label>
                  ))}
                </div>
              </div>

              <div className="acam-card">
                <div className="acam-section-title">Fator de Abrangência (FA)</div>
                <div className="acam-section-desc">
                  Alcance espacial dos impactos ambientais do empreendimento.
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {OPCOES_FA.map((opcao) => (
                    <label
                      key={opcao.id}
                      className={`acam-card-compact${faSelecionado === opcao.id ? " acam-card-border-primary" : ""}`}
                      style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", cursor: "pointer" }}
                    >
                      <input
                        type="radio"
                        name="fa"
                        checked={faSelecionado === opcao.id}
                        onChange={() => setFaSelecionado(opcao.id)}
                        style={{ accentColor: "var(--primary-600)" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div className="font-medium text-sm">{opcao.descricao}</div>
                        <div className="text-xs text-muted-foreground">{opcao.detalhamento}</div>
                      </div>
                      <StatusBadge variant="primary">{fmtNum(opcao.valor, 3)}</StatusBadge>
                    </label>
                  ))}
                </div>
              </div>

              {/* Resumo antes de calcular */}
              <div className="acam-card">
                <div className="acam-section-title">Resumo</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", textAlign: "center" }}>
                  <div>
                    <div className="text-xs text-muted-foreground">FR</div>
                    <div className="text-lg font-bold">{fmtNum(totalFR, 4)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">FT</div>
                    <div className="text-lg font-bold">{ftSelecionado ? fmtNum(OPCOES_FT.find((o) => o.id === ftSelecionado)!.valor, 3) : "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">FA</div>
                    <div className="text-lg font-bold">{faSelecionado ? fmtNum(OPCOES_FA.find((o) => o.id === faSelecionado)!.valor, 3) : "—"}</div>
                  </div>
                </div>
                {ftSelecionado && faSelecionado && (
                  <div style={{ textAlign: "center", marginTop: "var(--spacing-4)", paddingTop: "var(--spacing-4)", borderTop: "1px solid var(--grey-200)" }}>
                    <div className="text-xs text-muted-foreground">GI estimado (FR + FT + FA)</div>
                    <div className="text-xl font-bold" style={{ color: "var(--primary-600)" }}>
                      {fmtNum(
                        Math.min(
                          totalFR + OPCOES_FT.find((o) => o.id === ftSelecionado)!.valor + OPCOES_FA.find((o) => o.id === faSelecionado)!.valor,
                          0.5,
                        ),
                        4,
                      )}
                      {totalFR + OPCOES_FT.find((o) => o.id === ftSelecionado)!.valor + OPCOES_FA.find((o) => o.id === faSelecionado)!.valor > 0.5 && (
                        <span className="text-xs text-muted-foreground ml-2">(limitado a 0,5)</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {erro && <div className="acam-alert acam-alert-error">{erro}</div>}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "var(--spacing-4)" }}>
                <button
                  className="acam-btn acam-btn-ghost"
                  onClick={() => { setErro(""); setEtapa(2) }}
                >
                  Voltar
                </button>
                <button
                  className="acam-btn acam-btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleCalcular}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="acam-spinner acam-spinner-sm" />
                      Calculando...
                    </span>
                  ) : (
                    `Calcular (${CUSTO_CREDITOS} créditos)`
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="acam-alert-result" style={{ marginTop: "var(--spacing-4)" }}>
            <strong>Importante.</strong> Esta é uma estimativa para provisionamento. O valor definitivo será apurado
            pela Câmara de Compensação Ambiental com base nos parâmetros vigentes na data da licença.
          </div>
        </>
      )}

      </div>
    </div>
  )

  // ============================================
  // RENDER: FATORES FR (checkboxes + radio groups)
  // ============================================

  function renderFatoresFR() {
    // Separar checkboxes e radio groups
    const checkboxes = FATORES_FR.filter((f) => f.tipo === "checkbox")
    const grupos: Record<string, typeof FATORES_FR> = {}
    for (const f of FATORES_FR.filter((f) => f.tipo === "radio" && f.grupo)) {
      if (!grupos[f.grupo!]) grupos[f.grupo!] = []
      grupos[f.grupo!].push(f)
    }

    const grupoLabels: Record<string, string> = {
      fr3: "FR3 — Supressão de vegetação",
      fr6: "FR6 — Áreas prioritárias para conservação",
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {/* Checkboxes */}
        {checkboxes.map((fator) => (
          <label
            key={fator.id}
            className={`acam-card-compact${frSelecionados[fator.id] ? " acam-card-border-primary" : ""}`}
            style={{
              display: "flex", alignItems: "flex-start", gap: "0.75rem",
              padding: "0.75rem 1rem", cursor: frBloqueados[fator.id] ? "not-allowed" : "pointer",
              opacity: frBloqueados[fator.id] && !frSelecionados[fator.id] ? 0.5 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={!!frSelecionados[fator.id]}
              onChange={() => toggleFR(fator.id)}
              disabled={!!frBloqueados[fator.id]}
              style={{ marginTop: "0.15rem", accentColor: "var(--primary-600)" }}
            />
            <div style={{ flex: 1 }}>
              <div className="font-medium text-sm">
                <span style={{ fontWeight: 700, marginRight: "0.5rem" }}>{fator.id.toUpperCase()}</span>
                {fator.descricao}
                {frBloqueados[fator.id] && frSelecionados[fator.id] && (
                  <StatusBadge variant="accent" className="ml-2">Detectado</StatusBadge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{fator.detalhamento}</div>
            </div>
            <StatusBadge variant="primary">{fmtNum(fator.valor, 3)}</StatusBadge>
          </label>
        ))}

        {/* Radio groups */}
        {Object.entries(grupos).map(([grupo, fatores]) => (
          <div key={grupo} style={{ marginTop: "var(--spacing-2)" }}>
            <div className="text-sm font-semibold mb-2" style={{ color: "var(--primary-600)" }}>
              {grupoLabels[grupo] || grupo.toUpperCase()}
              <span className="text-xs font-normal text-muted-foreground ml-2">(selecione um)</span>
            </div>
            {fatores.map((fator) => (
              <label
                key={fator.id}
                className={`acam-card-compact${frSelecionados[fator.id] ? " acam-card-border-primary" : ""}`}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "0.75rem",
                  padding: "0.75rem 1rem", marginBottom: "0.5rem",
                  cursor: frBloqueados[fator.id] ? "not-allowed" : "pointer",
                  opacity: frBloqueados[fator.id] && !frSelecionados[fator.id] ? 0.5 : 1,
                }}
              >
                <input
                  type="radio"
                  name={`fr_${grupo}`}
                  checked={!!frSelecionados[fator.id]}
                  onChange={() => toggleFR(fator.id)}
                  disabled={!!frBloqueados[fator.id]}
                  style={{ marginTop: "0.15rem", accentColor: "var(--primary-600)" }}
                />
                <div style={{ flex: 1 }}>
                  <div className="font-medium text-sm">
                    <span style={{ fontWeight: 700, marginRight: "0.5rem" }}>{fator.id.toUpperCase()}</span>
                    {fator.descricao}
                    {frBloqueados[fator.id] && frSelecionados[fator.id] && (
                      <StatusBadge variant="accent" className="ml-2">Detectado</StatusBadge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{fator.detalhamento}</div>
                </div>
                <StatusBadge variant="primary">{fmtNum(fator.valor, 3)}</StatusBadge>
              </label>
            ))}
          </div>
        ))}
      </div>
    )
  }
}

// ============================================
// COMPONENTE: RESULTADO
// ============================================

function ResultadoView({
  resultado,
  analiseGeoespacial,
  detalhesGeo,
  resultadoGeo,
  onDownloadPDF,
}: {
  resultado: ResultadoSNUC
  analiseGeoespacial: boolean
  detalhesGeo: ResultadoGeo["detalhes"] | null
  resultadoGeo: ResultadoGeo | null
  onDownloadPDF: () => void
}) {
  return (
    <>
      {/* Card principal com resultado */}
      <div style={{ background: "linear-gradient(135deg, #1a3a2a 0%, #2d5a3f 100%)", color: "white", borderRadius: "var(--radius-xl)", padding: "2rem", textAlign: "center" }}>
        <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.5rem" }}>Compensação Ambiental Estimada</p>
        <p style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "0.5rem" }}>{fmt(resultado.compensacaoAmbiental)}</p>
        <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>
          GI: {fmtNum(resultado.giAplicado, 4)}{resultado.giCapAplicado ? " (limitado a 0,5)" : ""} — VR: {fmt(resultado.valorReferencia)}
        </p>
      </div>

      {resultado.giCapAplicado && (
        <div className="acam-alert acam-alert-warning">
          O Grau de Impacto calculado ({fmtNum(resultado.giCalculado, 4)}) excede o limite legal de 0,5%.
          O valor foi limitado a 0,5% conforme Decreto 6.848/2009.
        </div>
      )}

      {/* Fórmula */}
      <div className="acam-card" style={{ textAlign: "center" }}>
        <div className="text-xs text-muted-foreground mb-2">Fórmula: CA = VR × (GI / 100)</div>
        <div className="text-lg font-bold" style={{ color: "var(--primary-600)" }}>
          {fmt(resultado.valorReferencia)} × ({fmtNum(resultado.giAplicado, 4)} / 100) = {fmt(resultado.compensacaoAmbiental)}
        </div>
      </div>

      {/* Composição do GI */}
      <div className="acam-card">
        <div className="acam-section-title">Composição do Grau de Impacto</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", textAlign: "center", marginBottom: "var(--spacing-4)" }}>
          <div>
            <div className="text-xs text-muted-foreground">FR</div>
            <div className="text-xl font-bold">{fmtNum(resultado.totalFR, 4)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">FT</div>
            <div className="text-xl font-bold">{fmtNum(resultado.totalFT, 3)}</div>
            <div className="text-xs text-muted-foreground">{resultado.fatorFT.descricao}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">FA</div>
            <div className="text-xl font-bold">{fmtNum(resultado.totalFA, 3)}</div>
            <div className="text-xs text-muted-foreground">{resultado.fatorFA.descricao}</div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--grey-200)", paddingTop: "var(--spacing-4)", textAlign: "center" }}>
          <div className="text-xs text-muted-foreground">GI = FR + FT + FA</div>
          <div className="text-2xl font-bold" style={{ color: "var(--primary-600)" }}>
            {fmtNum(resultado.giAplicado, 4)}
          </div>
        </div>
      </div>

      {/* Fatores FR detalhados */}
      <div className="acam-card">
        <div className="acam-section-title">Fatores de Relevância Selecionados</div>
        {resultado.fatoresFR.map((f) => (
          <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid var(--grey-100)" }}>
            <div>
              <span className="text-sm font-bold mr-2">{f.id.toUpperCase()}</span>
              <span className="text-sm">{f.descricao}</span>
              {f.autoDetectado && <StatusBadge variant="accent" className="ml-2">Detectado</StatusBadge>}
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--primary-600)" }}>{fmtNum(f.valor, 3)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.75rem", fontWeight: 700 }}>
          <span>Total FR</span>
          <span style={{ color: "var(--primary-600)" }}>{fmtNum(resultado.totalFR, 4)}</span>
        </div>
      </div>

      {/* Detalhes geo (se houver) */}
      {analiseGeoespacial && detalhesGeo && (
        <div className="acam-card">
          <div className="acam-section-title">Análise Geoespacial (IDE-Sisema)</div>
          {detalhesGeo.ucs.length > 0 && (
            <div style={{ marginBottom: "var(--spacing-3)" }}>
              <div className="text-sm font-semibold mb-1">Unidades de Conservação</div>
              {detalhesGeo.ucs.map((uc, i) => (
                <div key={i} className="text-sm text-muted-foreground">
                  • {uc.nome} — {uc.categoria} — {uc.motivo}
                </div>
              ))}
            </div>
          )}
          {detalhesGeo.ecossistemas.length > 0 && (
            <div style={{ marginBottom: "var(--spacing-3)" }}>
              <div className="text-sm font-semibold mb-1">Ecossistemas protegidos</div>
              {detalhesGeo.ecossistemas.map((eco, i) => (
                <div key={i} className="text-sm text-muted-foreground">• {eco.nome}</div>
              ))}
            </div>
          )}
          {resultadoGeo?.fatores.areaPrioritaria && (
            <div style={{ marginBottom: "var(--spacing-3)" }}>
              <div className="text-sm font-semibold mb-1">Área prioritária</div>
              <div className="text-sm text-muted-foreground">
                Importância biológica: {resultadoGeo.fatores.areaPrioritaria.nivel}
              </div>
            </div>
          )}
          {detalhesGeo.cavidades > 0 && (
            <div>
              <div className="text-sm font-semibold mb-1">Patrimônio espeleológico</div>
              <div className="text-sm text-muted-foreground">{detalhesGeo.cavidades} registro(s) na área</div>
            </div>
          )}
        </div>
      )}

      {/* Botões */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <button className="acam-btn acam-btn-primary" style={{ width: "100%" }} onClick={onDownloadPDF}>
          Salvar PDF
        </button>
        <Link href="/dashboard" className="acam-btn acam-btn-ghost text-center" style={{ width: "100%" }}>
          Ir para Dashboard
        </Link>
      </div>
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { StatusBadge } from "@/components/acam"
import {
  calcularModalidade2,
  NOMES_VEGETACAO,
  type TipoVegetacao,
  type ResultadoModalidade2,
} from "@/lib/calculo/modalidade2"
import { formatBRL as fmt, formatNum as fmtNum } from "@/lib/format"
import { downloadPDF } from "@/lib/pdf/download"
import { debitarCreditos } from "@/lib/creditos/client"

const FLUXO_ADMINISTRATIVO = [
  { titulo: "Escolha da Unidade de Conservação", prazo: "1-2 semanas", desc: "Identificação e seleção da UC de Proteção Integral a ser beneficiada." },
  { titulo: "Contato com Órgão Gestor", prazo: "2-4 semanas", desc: "Articulação com o órgão gestor da UC para definição das ações." },
  { titulo: "Elaboração do Projeto", prazo: "4-8 semanas", desc: "Elaboração do projeto de implantação ou manutenção da UC." },
  { titulo: "Submissão e Análise", prazo: "4-8 semanas", desc: "Submissão ao órgão ambiental e análise técnica." },
  { titulo: "Termo de Compromisso", prazo: "3-4 semanas", desc: "Assinatura do termo de compromisso entre empreendedor e órgão." },
  { titulo: "Execução e Prestação de Contas", prazo: "12-36 meses", desc: "Execução das ações previstas e prestação de contas periódica." },
]

export default function CalculoModalidade2Page() {
  const router = useRouter()
  const [ufemg, setUfemg] = useState({ ano: 2026, valor: 5.7899 })
  const [custoCreditos, setCustoCreditos] = useState(2)

  useEffect(() => {
    fetch("/api/configuracoes?chave=ufemg")
      .then((r) => r.json())
      .then((data) => {
        if (data.valor?.ano && data.valor?.valor) {
          setUfemg({ ano: data.valor.ano, valor: data.valor.valor })
        }
      })
      .catch(() => { /* mantém fallback */ })
    fetch("/api/configuracoes?chave=precos")
      .then((r) => r.json())
      .then((data) => {
        const v = data.valor?.ferramentas?.["calc-impl-uc"]?.creditos
        if (v != null) setCustoCreditos(v)
      })
      .catch(() => { /* mantém fallback */ })
  }, [])
  const [area, setArea] = useState("")
  const [tipoVegetacao, setTipoVegetacao] = useState<TipoVegetacao | "">("")
  const [resultado, setResultado] = useState<ResultadoModalidade2 | null>(null)
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  const [saldo, setSaldo] = useState<number | null>(null)

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

  async function handleCalcular() {
    setErro("")

    const areaNum = parseFloat(area)
    if (!areaNum || areaNum <= 0) {
      setErro("Informe a área em hectares.")
      return
    }
    if (!tipoVegetacao) {
      setErro("Selecione o tipo de vegetação.")
      return
    }
    if (saldo !== null && saldo < custoCreditos) {
      setErro(`Saldo insuficiente. Você tem ${saldo} créditos, mas esta ferramenta custa ${custoCreditos}.`)
      return
    }

    setLoading(true)

    // Debitar créditos via API
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setErro("Sessão expirada. Faça login novamente.")
        setLoading(false)
        return
      }

      // Debitar créditos
      const debito = await debitarCreditos(custoCreditos, "calc-impl-uc", `Cálculo Modalidade 2 — ${fmtNum(areaNum)} ha de ${NOMES_VEGETACAO[tipoVegetacao]}`)
      if (!debito.ok) { setErro(debito.erro); setLoading(false); return }

      // Calcular
      const calc = calcularModalidade2(areaNum, tipoVegetacao, ufemg.valor, ufemg.ano)
      setResultado(calc)
      setSaldo((prev) => (prev !== null ? prev - custoCreditos : null))
      router.refresh() // atualiza saldo no header
    } catch {
      setErro("Erro ao processar. Tente novamente.")
    }

    setLoading(false)
  }

  return (
    <div>
      <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "var(--spacing-4) var(--spacing-6) 0" }}>
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
            <div className="acam-service-header-icon">UC</div>
            <div className="acam-service-header-text">
              <h1>Cálculo de Implantação/Manutenção de UC</h1>
              <p>Compensação Minerária — Modalidade 2</p>
            </div>
          </div>
          <div className="acam-service-header-cost">
            <div className="acam-service-header-cost-label">Custo</div>
            <div className="acam-service-header-cost-value">{custoCreditos} créditos</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "var(--spacing-8) var(--spacing-6)", width: "100%" }}>
      {!resultado ? (
        <>
          {/* Formulário */}
          <div className="acam-card">
            <div className="acam-section-title">Dados da intervenção</div>
            <div className="acam-section-desc">Informe a área e o tipo de vegetação para calcular o valor da compensação.</div>

            <div className="acam-field" style={{ marginBottom: "var(--spacing-4)" }}>
              <label>Área de vegetação a suprimir (hectares) <span className="req">*</span></label>
              <input
                type="number"
                className="acam-form-input"
                placeholder="Ex: 1.50"
                min="0.01"
                step="0.01"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <div className="acam-field" style={{ marginBottom: "var(--spacing-4)" }}>
              <label>Tipo de vegetação <span className="req">*</span></label>
              <select
                className="acam-form-input acam-form-select"
                value={tipoVegetacao}
                onChange={(e) => setTipoVegetacao(e.target.value as TipoVegetacao)}
              >
                <option value="">Selecione o tipo de vegetação</option>
                <option value="campo_altitude">Campo de Altitude / Campo Limpo</option>
                <option value="cerrado">Cerrado</option>
                <option value="campo_rupestre">Campo Rupestre</option>
              </select>
            </div>

            {erro && <div className="acam-alert acam-alert-error mb-4">{erro}</div>}

            <button
              className="acam-btn acam-btn-primary"
              onClick={handleCalcular}
              disabled={loading}
            >
              {loading ? "Calculando..." : `Calcular (${custoCreditos} créditos)`}
            </button>
          </div>


          <div className="acam-alert-result">
            <strong>Importante.</strong> Esta é uma estimativa preliminar. O valor definitivo será apurado pelo órgão ambiental com base nos parâmetros vigentes na data da análise.
          </div>
        </>
      ) : (
        <>
          {/* Resultado */}
          <div style={{ background: "linear-gradient(135deg, #1a3a2a 0%, #2d5a3f 100%)", color: "white", borderRadius: "var(--radius-xl)", padding: "2rem", textAlign: "center" }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.5rem" }}>Área a Suprimir</p>
                <p style={{ fontSize: "1.8rem", fontWeight: 800 }}>{fmtNum(resultado.area)} ha</p>
              </div>
              <div>
                <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.5rem" }}>Valor em UFEMGs</p>
                <p style={{ fontSize: "1.8rem", fontWeight: 800 }}>{fmtNum(resultado.totalUFEMGs)}</p>
                <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>{fmtNum(resultado.ufemgPorHa)} UFEMGs/ha</p>
              </div>
              <div>
                <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.5rem" }}>Valor em Reais</p>
                <p style={{ fontSize: "1.8rem", fontWeight: 800 }}>{fmt(resultado.totalReais)}</p>
                <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>UFEMG {resultado.ufemgAno}: R$ {resultado.ufemgValor.toFixed(4).replace(".", ",")}</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground text-center">
            Vegetação: <strong>{resultado.nomeVegetacao}</strong>
          </div>

          {/* Fluxo administrativo */}
          <div className="acam-card">
            <h3 className="font-semibold mb-4">Fluxo Administrativo Estimado</h3>
            <p className="text-sm text-muted-foreground mb-6">Etapas típicas para cumprimento da compensação na modalidade 2. Prazo total estimado: 18-60 meses.</p>
            {FLUXO_ADMINISTRATIVO.map((etapa, i) => (
              <div key={i} style={{ display: "flex", gap: "var(--spacing-4)", marginBottom: "var(--spacing-4)" }}>
                <div style={{
                  width: "2rem", height: "2rem", borderRadius: "50%",
                  background: "var(--primary-600)", color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.85rem", fontWeight: 700, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div>
                  <div className="font-medium text-sm">{etapa.titulo}</div>
                  <div className="text-xs text-muted-foreground">{etapa.desc}</div>
                  <StatusBadge variant="primary" className="mt-1">{etapa.prazo}</StatusBadge>
                </div>
              </div>
            ))}
          </div>

          {/* Legislação */}
          <div className="acam-card">
            <h3 className="font-semibold mb-4">Legislação de Referência</h3>
            <div className="acam-legislacao-item acam-legislacao-item-clickable">
              <a href="https://www.almg.gov.br/legislacao-mineira/texto/LEI/20922/2013/?cons=1" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <p className="acam-legislacao-titulo">Lei Estadual nº 20.922/2013</p>
                <p className="acam-legislacao-desc">Dispõe sobre as políticas florestal e de proteção à biodiversidade em MG</p>
              </a>
            </div>
            <div className="acam-legislacao-item acam-legislacao-item-clickable">
              <a href="https://www.pesquisalegislativa.mg.gov.br/LegislacaoCompleta.aspx?cod=178267&marc=" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <p className="acam-legislacao-titulo">Portaria IEF nº 27/2017</p>
                <p className="acam-legislacao-desc">Estabelece procedimentos para compensação ambiental de mineração</p>
              </a>
            </div>
          </div>

          {/* Botões */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <button className="acam-btn acam-btn-primary" style={{ width: "100%" }} onClick={async () => {
              try {
                const res = await fetch("/api/pdf/modalidade2", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(resultado),
                })
                if (res.ok) {
                  await downloadPDF(res, "ACAM-Calculo-Modalidade2-" + new Date().toISOString().slice(0, 10) + ".pdf")
                }
              } catch (err) {
                console.error("Erro ao gerar PDF:", err)
              }
            }}>Salvar PDF</button>
            <Link href="/dashboard" className="acam-btn acam-btn-ghost text-center" style={{ width: "100%" }}>
              Ir para Dashboard
            </Link>
          </div>
        </>
      )}
      </div>
    </div>
  )
}

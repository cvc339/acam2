"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { StatusBadge, UploadZone } from "@/components/acam"
import { MapaImovel } from "@/components/acam/mapa-imovel"

const CUSTO_CREDITOS = 5

interface Parecer {
  imovel: {
    nome: string
    municipio: string
    estado: string
    area_hectares: number
    matricula: string
    cartorio: string
  }
  proprietarios: Array<{ nome: string; percentual: number; cpf_cnpj: string | null }>
  documentacao: Record<string, { sucesso: boolean }>
  ide_sisema: {
    sucesso: boolean
    ucs: Array<{
      nome: string
      categoria: string
      protecao_integral: boolean
      percentual_sobreposicao: number | null
    }>
    bbox: { minLon: number; maxLon: number; minLat: number; maxLat: number } | null
    centroide: { lon: number; lat: number } | null
  }
  mvar: {
    pontuacao: { total: number; maximo: number }
    classificacao: { faixa: string; label: string; acao: string; cor: string }
    vetos: Array<{ origem: string; motivo: string }>
    dimensoes: Record<string, { nome: string; pontos: number; peso: number; percentual: number }>
    vtn: { encontrado: boolean; valor_estimado?: number; municipio?: string } | null
    resumo: string
  }
  validacao: {
    pendencias: string[]
    pontos_positivos: string[]
  }
  status_final: {
    status: string
    justificativa: string
    impedimentos: string[]
    pendencias: string[]
    pontos_positivos: string[]
  }
}

export default function DestinacaoUCBasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [resultado, setResultado] = useState<{ consultaId: string; parecer: Parecer } | null>(null)

  // Formulário
  const [nomeImovel, setNomeImovel] = useState("")
  const [municipio, setMunicipio] = useState("")
  const [matriculaFile, setMatriculaFile] = useState<File | null>(null)
  const [kmlFile, setKmlFile] = useState<File | null>(null)
  const [ccirFile, setCcirFile] = useState<File | null>(null)
  const [itrFile, setItrFile] = useState<File | null>(null)
  const [cndFile, setCndFile] = useState<File | null>(null)

  async function handleSubmit() {
    setErro("")

    if (!matriculaFile) return setErro("Envie a matrícula do imóvel (PDF).")
    if (!kmlFile) return setErro("Envie o arquivo geoespacial (KML ou GeoJSON).")

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("ferramenta_id", "dest-uc-base")
      formData.append("nome_imovel", nomeImovel)
      formData.append("municipio", municipio)
      formData.append("matricula", matriculaFile)
      formData.append("kml", kmlFile)
      if (ccirFile) formData.append("ccir", ccirFile)
      if (itrFile) formData.append("itr", itrFile)
      if (cndFile) formData.append("cnd", cndFile)

      const res = await fetch("/api/consultas", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.erro || "Erro ao processar consulta.")
        setLoading(false)
        return
      }

      setResultado({ consultaId: data.consulta_id, parecer: data.parecer })
      router.refresh()
    } catch {
      setErro("Erro de conexão. Tente novamente.")
    }

    setLoading(false)
  }

  // ============================================
  // TELA DE RESULTADO
  // ============================================

  if (resultado) {
    const { parecer, consultaId } = resultado
    const corFaixa = parecer.mvar.classificacao.cor

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

        <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "var(--spacing-6)", display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
          {/* Score card */}
          <div style={{ background: `linear-gradient(135deg, ${corFaixa} 0%, ${corFaixa}cc 100%)`, color: "white", borderRadius: "var(--radius-xl)", padding: "2rem", textAlign: "center" }}>
            <p style={{ fontSize: "0.85rem", opacity: 0.8, marginBottom: "0.5rem" }}>Pontuação MVAR</p>
            <p style={{ fontSize: "3rem", fontWeight: 800, lineHeight: 1 }}>{parecer.mvar.pontuacao.total}</p>
            <p style={{ fontSize: "1rem", opacity: 0.9, marginTop: "0.5rem" }}>{parecer.mvar.classificacao.label} — {parecer.mvar.classificacao.acao}</p>
          </div>

          {/* Vetos */}
          {parecer.mvar.vetos.length > 0 && (
            <div className="acam-alert acam-alert-error">
              <strong>Impedimentos identificados:</strong>
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                {parecer.mvar.vetos.map((v, i) => <li key={i}><strong>{v.origem}:</strong> {v.motivo}</li>)}
              </ul>
            </div>
          )}

          {/* Dados do imóvel */}
          <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
            <h3 className="font-semibold mb-4">Dados do Imóvel</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Nome:</span> <strong>{parecer.imovel.nome || "—"}</strong></div>
              <div><span className="text-muted-foreground">Município:</span> <strong>{parecer.imovel.municipio}/{parecer.imovel.estado}</strong></div>
              <div><span className="text-muted-foreground">Área:</span> <strong>{parecer.imovel.area_hectares?.toFixed(2)} ha</strong></div>
              <div><span className="text-muted-foreground">Matrícula:</span> <strong>{parecer.imovel.matricula || "—"}</strong></div>
            </div>
          </div>

          {/* Dimensões MVAR */}
          <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
            <h3 className="font-semibold mb-4">Dimensões de Análise</h3>
            {Object.entries(parecer.mvar.dimensoes).map(([key, dim]) => (
              <div key={key} style={{ marginBottom: "0.75rem" }}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{dim.nome}</span>
                  <span className="font-semibold">{dim.pontos}/{dim.peso}</span>
                </div>
                <div style={{ height: "8px", background: "var(--neutral-200)", borderRadius: "4px" }}>
                  <div style={{
                    height: "8px",
                    width: `${Math.min(dim.percentual, 100)}%`,
                    background: dim.percentual >= 80 ? "var(--success)" : dim.percentual >= 50 ? "var(--warning)" : "var(--error)",
                    borderRadius: "4px",
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* UCs */}
          {parecer.ide_sisema.ucs.length > 0 && (
            <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
              <h3 className="font-semibold mb-4">Unidades de Conservação</h3>
              {parecer.ide_sisema.ucs.map((uc, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b text-sm">
                  <div>
                    <div className="font-medium">{uc.nome}</div>
                    <div className="text-xs text-muted-foreground">{uc.categoria}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {uc.percentual_sobreposicao != null && (
                      <span className="font-semibold">{uc.percentual_sobreposicao}%</span>
                    )}
                    <StatusBadge variant={uc.protecao_integral ? "success" : "warning"}>
                      {uc.protecao_integral ? "Proteção Integral" : "Uso Sustentável"}
                    </StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Mapa */}
          {parecer.ide_sisema.bbox && parecer.ide_sisema.centroide && (
            <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
              <h3 className="font-semibold mb-4">Localização</h3>
              <MapaImovel
                bbox={parecer.ide_sisema.bbox}
                centroide={parecer.ide_sisema.centroide}
              />
            </div>
          )}

          {/* Resumo */}
          <div className="acam-alert-result">
            <strong>Conclusão:</strong> {parecer.mvar.resumo}
          </div>

          {/* Botões */}
          <div style={{ display: "flex", gap: "var(--spacing-3)", flexWrap: "wrap" }}>
            <button className="acam-btn acam-btn-primary" onClick={async () => {
              const res = await fetch(`/api/consultas/${consultaId}`)
              const data = await res.json()
              if (data.consulta?.pdf_url) {
                window.open(data.consulta.pdf_url, "_blank")
              }
            }}>Baixar Parecer PDF</button>
            <Link href="/dashboard" className="acam-btn acam-btn-secondary">Voltar ao dashboard</Link>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // TELA DE UPLOAD (FORMULÁRIO)
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

      <div className="acam-service-header acam-service-header-primary">
        <div className="acam-service-header-content">
          <div className="acam-service-header-info">
            <div className="acam-service-header-icon">UC</div>
            <div className="acam-service-header-text">
              <h1>Destinação em UC — Base</h1>
              <p>Compensação Minerária (2.1) e Reserva Legal (6.3)</p>
            </div>
          </div>
          <div className="acam-service-header-cost">
            <div className="acam-service-header-cost-label">Custo</div>
            <div className="acam-service-header-cost-value">{CUSTO_CREDITOS} créditos</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "var(--spacing-6)", display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
        {/* Dados do imóvel */}
        <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
          <div className="acam-section-title">Dados do Imóvel</div>
          <div className="acam-section-desc">Informações básicas para identificação.</div>

          <div className="acam-fg acam-fg-2">
            <div className="acam-field">
              <label>Nome do Imóvel</label>
              <input className="acam-form-input" placeholder="Ex: Fazenda Boa Vista" value={nomeImovel} onChange={(e) => setNomeImovel(e.target.value)} />
            </div>
            <div className="acam-field">
              <label>Município</label>
              <input className="acam-form-input" placeholder="Ex: Três Marias" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Documentos obrigatórios */}
        <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
          <div className="acam-section-title">Documentos Obrigatórios</div>
          <div className="acam-section-desc">Matrícula atualizada e arquivo geoespacial do imóvel.</div>

          <div className="acam-fg acam-fg-2">
            <div className="acam-field">
              <label>Matrícula do Imóvel <span className="req">*</span></label>
              <input type="file" className="acam-form-input" accept=".pdf" onChange={(e) => setMatriculaFile(e.target.files?.[0] || null)} />
              <span className="hint">PDF da matrícula atualizada (máx. 10MB)</span>
            </div>
            <div className="acam-field">
              <label>Arquivo Geoespacial <span className="req">*</span></label>
              <input type="file" className="acam-form-input" accept=".kml,.kmz,.geojson,.json" onChange={(e) => setKmlFile(e.target.files?.[0] || null)} />
              <span className="hint">KML, KMZ ou GeoJSON do imóvel</span>
            </div>
          </div>
        </div>

        {/* Documentos opcionais */}
        <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
          <div className="acam-section-title">Documentos Complementares</div>
          <div className="acam-section-desc">Quanto mais documentos, mais precisa a análise.</div>

          <div className="acam-fg acam-fg-3">
            <div className="acam-field">
              <label>CCIR</label>
              <input type="file" className="acam-form-input" accept=".pdf" onChange={(e) => setCcirFile(e.target.files?.[0] || null)} />
            </div>
            <div className="acam-field">
              <label>ITR</label>
              <input type="file" className="acam-form-input" accept=".pdf" onChange={(e) => setItrFile(e.target.files?.[0] || null)} />
            </div>
            <div className="acam-field">
              <label>CND-ITR</label>
              <input type="file" className="acam-form-input" accept=".pdf" onChange={(e) => setCndFile(e.target.files?.[0] || null)} />
            </div>
          </div>
        </div>

        {erro && <div className="acam-alert acam-alert-error">{erro}</div>}

        <div className="acam-alert-result">
          <strong>Como funciona:</strong> Seus documentos serão analisados automaticamente por IA (matrícula) e cruzados com dados geoespaciais do IDE-Sisema (UCs, bacias, MapBiomas). Você receberá um parecer técnico com pontuação de viabilidade.
        </div>

        <button
          className="acam-btn acam-btn-primary"
          style={{ width: "100%" }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Processando análise..." : `Analisar Imóvel (${CUSTO_CREDITOS} créditos)`}
        </button>
      </div>
    </div>
  )
}

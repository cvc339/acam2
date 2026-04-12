"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertResult, DocumentoItem } from "@/components/acam"
import { ComboboxMunicipio } from "@/components/acam/combobox-municipio"
import { ProgressBar } from "@/components/acam/progress-bar"
import { formatBRL, formatNum } from "@/lib/format"

const CUSTO_CREDITOS = 5

// Tipos

interface Proprietario { nome: string; percentual: number | null; cpf: string | null; estado_civil: string | null; conjuge: string | null; regime_bens: string | null; ato_aquisitivo: string }
interface OutorgaConjugal { nome: string; exige_outorga: boolean; conjuge: string | null; observacao: string | null }
interface GeorefStatus { situacao: string; prazo_legal: string; impacto: string | null }
interface OnusGravame { tipo: string; nivel: number; nivel_descricao: string; numero_averbacao: string; descricao: string; impacto: string }
interface OnusExtinto { ato: string; tipo: string; cancelado_por: string }
interface AnaliseTransmissibilidade { resumo: string; impedimentos: Array<{ descricao: string; fundamentacao: string; recomendacao: string }>; diligencias_recomendadas: string[]; ressalvas: string[] }
interface DimensaoMVAR { pontos: number; peso: number; percentual: number }

interface Parecer {
  tipo: string
  imovel: { nome: string; municipio: string; area_hectares: number | null; matricula: string | null; cartorio: string | null; comarca: string | null; ccir: string | null; nirf: string | null; codigo_incra: string | null; car: string | null; georreferenciamento: boolean | null; georef_certificacao: string | null }
  proprietarios: Proprietario[]
  outorga_conjugal: OutorgaConjugal[]
  georeferenciamento: GeorefStatus
  onus_gravames: OnusGravame[]
  onus_extintos: OnusExtinto[]
  analise_transmissibilidade: AnaliseTransmissibilidade | null
  semaforo: "verde" | "amarelo" | "vermelho"
  semaforo_justificativa: string
  recomendacoes: string[]
  documentos_faltantes: string[]
  alertas: string[]
  confianca_ocr: string
  cnd: { tipo: string; cib: string | null; data_emissao: string | null; data_validade: string | null; area_hectares: number | null; nome_contribuinte: string | null } | null
  mvar: { pontuacao?: { total: number; maximo: number }; classificacao?: { label: string; acao: string }; resumo?: string; dimensoes?: Record<string, DimensaoMVAR>; vetos?: Array<{ origem: string; motivo: string }> } | null
  vtn: { encontrado: boolean; municipio?: string; valor_referencia?: number; valor_estimado?: number } | null
}

// Etapas

const ETAPAS = [
  { label: "Enviando documentos", descricao: "Upload dos arquivos para processamento seguro", duracao: 3 },
  { label: "Extraindo dados do imóvel", descricao: "Leitura do cabeçalho da matrícula: área, cartório, CCIR, CAR", duracao: 8 },
  { label: "Identificando atos e partes", descricao: "Cada ato registral: transmitentes, adquirentes, percentuais", duracao: 15 },
  { label: "Resolvendo titularidade", descricao: "Cadeia de transmissões, pareamento de cancelamentos, ônus", duracao: 3 },
  { label: "Analisando transmissibilidade", descricao: "Outorga conjugal, georreferenciamento, restrições", duracao: 8 },
  { label: "Calculando MVAR", descricao: "Pontuação de viabilidade (jurídica, fiscal, titularidade, técnica)", duracao: 3 },
  { label: "Gerando relatório", descricao: "Montagem do parecer PDF", duracao: 3 },
]

function EtapasProgresso() {
  const [etapaAtual, setEtapaAtual] = useState(0)
  const [fadeIn, setFadeIn] = useState(true)
  useEffect(() => {
    let t = 0
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 1; i < ETAPAS.length; i++) {
      t += ETAPAS[i - 1].duracao * 1000
      timers.push(setTimeout(() => setFadeIn(false), t - 300))
      timers.push(setTimeout(() => { setEtapaAtual(i); setFadeIn(true) }, t))
    }
    return () => timers.forEach(clearTimeout)
  }, [])
  const etapa = ETAPAS[etapaAtual]
  const progresso = ((etapaAtual + 1) / ETAPAS.length) * 100
  return (
    <div className="acam-card text-center py-8 px-6">
      <div className="acam-spinner acam-spinner-lg mx-auto mb-6" />
      <div className="acam-fade-in" style={{ opacity: fadeIn ? 1 : 0, minHeight: "3.5rem" }}>
        <div className="font-semibold mb-2 text-primary">{etapa.label}</div>
        <p className="text-sm text-muted-foreground">{etapa.descricao}</p>
      </div>
      <div className="mt-6 mx-auto" style={{ maxWidth: "16rem" }}>
        <div className="acam-progress" style={{ height: "3px" }}>
          <div className="acam-progress-bar acam-progress-bar-primary" style={{ width: `${progresso}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">Etapa {etapaAtual + 1} de {ETAPAS.length}</p>
      </div>
    </div>
  )
}

// Página

export default function AnaliseMatriculaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [resultado, setResultado] = useState<{ consultaId: string; parecer: Parecer } | null>(null)
  const [nomeImovel, setNomeImovel] = useState("")
  const [municipio, setMunicipio] = useState("")
  const [matriculaFile, setMatriculaFile] = useState<File | null>(null)
  const [cndFile, setCndFile] = useState<File | null>(null)
  const [kmlFile, setKmlFile] = useState<File | null>(null)
  const matriculaRef = useRef<HTMLInputElement>(null)
  const cndRef = useRef<HTMLInputElement>(null)
  const kmlRef = useRef<HTMLInputElement>(null)

  async function handleSubmit() {
    setErro("")
    if (!matriculaFile) return setErro("Envie a matrícula do imóvel (PDF).")
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("nome_imovel", nomeImovel)
      formData.append("municipio", municipio)
      formData.append("matricula", matriculaFile)
      if (cndFile) formData.append("cnd", cndFile)
      if (kmlFile) formData.append("kml", kmlFile)
      const res = await fetch("/api/consultas/analise-matricula", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) { setErro(data.erro || "Erro ao processar consulta."); setLoading(false); return }
      setResultado({ consultaId: data.consulta_id, parecer: data.parecer })
      router.refresh()
    } catch { setErro("Erro de conexão. Tente novamente.") }
    setLoading(false)
  }

  // RESULTADO

  if (resultado) {
    const { parecer, consultaId } = resultado
    const p = parecer
    const nomesMVAR: Record<string, string> = { juridica: "Jurídica", fiscal: "Fiscal", titularidade: "Titularidade", tecnica: "Técnica" }
    const temVeto = p.onus_gravames.some((o) => o.nivel === 1)
    const cndVencida = p.cnd?.data_validade ? new Date(p.cnd.data_validade) < new Date() : false

    return (
      <div className="acam-container">
        <Link href="/dashboard" className="acam-back-link">← Voltar ao dashboard</Link>

        {/* MVAR */}
        {p.mvar && (
          <AlertResult
            status={p.mvar.pontuacao && p.mvar.pontuacao.total >= 90 ? "success" : p.mvar.pontuacao && p.mvar.pontuacao.total >= 60 ? "warning" : "error"}
            statusLabel={p.mvar.classificacao?.label || `${p.mvar.pontuacao?.total ?? 0}/100`}
          >
            <strong>Análise de Matrícula — {p.imovel.nome || p.imovel.municipio || "Imóvel"}.</strong> {p.mvar.classificacao?.acao || ""} {p.mvar.resumo && <div className="text-sm mt-1">{p.mvar.resumo}</div>}
          </AlertResult>
        )}

        <AlertResult>
          <strong>Análise preliminar.</strong> Este relatório é uma pré-avaliação automatizada e não substitui parecer jurídico ou técnico. {p.confianca_ocr === "baixa" && <><br /><strong>ATENÇÃO:</strong> documento com baixa legibilidade.</>}
        </AlertResult>

        {/* VETOS */}
        {temVeto && (
          <div className="acam-card acam-card-border-error">
            <div className="acam-section-title acam-text-error">Impedimentos Identificados</div>
            {p.onus_gravames.filter((o) => o.nivel === 1).map((o, i) => (
              <AlertResult key={i} status="error" statusLabel="VETO">
                <strong>{o.tipo}.</strong> {o.impacto || o.descricao}
              </AlertResult>
            ))}
          </div>
        )}

        {/* MVAR DIMENSÕES */}
        {p.mvar?.dimensoes && (
          <div className="acam-card">
            <div className="acam-section-title">Avaliação de Viabilidade (MVAR)</div>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-2xl font-bold">{p.mvar.pontuacao?.total ?? 0}<span className="text-sm font-normal text-muted-foreground">/{p.mvar.pontuacao?.maximo ?? 100}</span></div>
              <div><strong>{p.mvar.classificacao?.label}</strong></div>
            </div>
            {Object.entries(p.mvar.dimensoes).map(([key, dim]) => (
              <ProgressBar key={key} label={`${nomesMVAR[key] || key} (${dim.peso} pts)`} value={`${dim.pontos}/${dim.peso}`} percent={dim.percentual} />
            ))}
          </div>
        )}

        {/* DADOS DO IMÓVEL */}
        <div className="acam-card">
          <div className="acam-section-title">Dados do Imóvel</div>
          <div className="acam-card acam-card-compact">
            <div className="acam-fg acam-fg-2">
              {p.imovel.matricula && <div className="acam-field"><label>Matrícula</label><span>{p.imovel.matricula}</span></div>}
              {p.imovel.cartorio && <div className="acam-field"><label>Cartório</label><span>{p.imovel.cartorio}</span></div>}
              {p.imovel.comarca && <div className="acam-field"><label>Comarca</label><span>{p.imovel.comarca}</span></div>}
              {p.imovel.area_hectares != null && <div className="acam-field"><label>Área</label><span>{formatNum(p.imovel.area_hectares)} ha</span></div>}
              {p.imovel.ccir && <div className="acam-field"><label>CCIR</label><span>{p.imovel.ccir}</span></div>}
              {p.imovel.nirf && <div className="acam-field"><label>NIRF/CIB</label><span>{p.imovel.nirf}</span></div>}
              {p.imovel.car && <div className="acam-field"><label>CAR</label><span>{p.imovel.car}</span></div>}
              {p.imovel.codigo_incra && <div className="acam-field"><label>INCRA</label><span>{p.imovel.codigo_incra}</span></div>}
            </div>
          </div>

          {/* Proprietários */}
          <h4 className="acam-subsection-title">Proprietários</h4>
          {p.proprietarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum proprietário identificado.</p>
          ) : p.proprietarios.map((prop, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b text-sm">
              <div>
                <strong>{prop.nome}</strong>
                {prop.cpf && <span className="text-muted-foreground"> — {prop.cpf}</span>}
                {prop.estado_civil && <span className="text-muted-foreground"> — {prop.estado_civil}</span>}
                {prop.conjuge && <span className="text-muted-foreground"> (cônjuge: {prop.conjuge})</span>}
              </div>
              <span className="font-semibold">{prop.percentual ?? "?"}%</span>
            </div>
          ))}

          {/* Outorga */}
          {p.outorga_conjugal?.some((o) => o.exige_outorga || o.observacao) && (
            <>
              <h4 className="acam-subsection-title">Outorga Conjugal</h4>
              {p.outorga_conjugal.filter((o) => o.exige_outorga || o.observacao).map((o, i) => (
                <AlertResult key={i} status={o.exige_outorga ? "warning" : undefined} statusLabel={o.exige_outorga ? "Pendências" : undefined}>
                  <strong>{o.nome}:</strong> {o.exige_outorga ? `exige outorga do cônjuge ${o.conjuge || "(não identificado)"}` : ""} {o.observacao || ""}
                </AlertResult>
              ))}
            </>
          )}

          {/* Ônus */}
          <h4 className="acam-subsection-title">Ônus e Gravames</h4>
          {p.onus_gravames.length === 0 ? (
            <AlertResult status="success" statusLabel="Adequado"><strong>Sem ônus.</strong> Situação registral favorável.</AlertResult>
          ) : p.onus_gravames.map((o, i) => (
            <AlertResult key={i} status={o.nivel === 1 ? "error" : "warning"} statusLabel={o.nivel === 1 ? "VETO" : "Pendências"}>
              <strong>{o.tipo}</strong> {o.numero_averbacao && <span className="text-xs text-muted-foreground">({o.numero_averbacao})</span>}
              <div className="text-sm mt-1">{o.impacto || o.descricao}</div>
            </AlertResult>
          ))}

          {/* Ônus extintos */}
          {p.onus_extintos.length > 0 && (
            <div className="mt-2">
              {p.onus_extintos.map((o, i) => (
                <p key={i} className="text-xs text-muted-foreground">✓ {o.tipo} ({o.ato}) — cancelado por {o.cancelado_por}</p>
              ))}
            </div>
          )}

          {/* Georef */}
          <h4 className="acam-subsection-title">Georreferenciamento</h4>
          <AlertResult status={p.georeferenciamento.situacao === "regular" ? "success" : "warning"} statusLabel={p.georeferenciamento.situacao === "regular" ? "Adequado" : "Pendências"}>
            <strong>{p.georeferenciamento.situacao === "regular" ? "Regular" : "Pendente"}</strong> — Prazo: {p.georeferenciamento.prazo_legal}
            {p.georeferenciamento.impacto && <div className="text-sm mt-1">{p.georeferenciamento.impacto}</div>}
          </AlertResult>

          <p className="text-xs text-muted-foreground mt-4 italic">Dados extraídos por IA. Conferir com o documento original.</p>
        </div>

        {/* CND */}
        <div className="acam-card">
          <div className="acam-section-title">Análise Fiscal — CND-ITR</div>
          {!p.cnd ? (
            <AlertResult>CND-ITR não apresentada. Incluir para avaliação mais completa.</AlertResult>
          ) : (
            <>
              <div className="acam-card acam-card-compact">
                <div className="acam-fg acam-fg-2">
                  <div className="acam-field"><label>Tipo</label><span>{p.cnd.tipo === "negativa" ? "Certidão Negativa" : p.cnd.tipo?.includes("efeito") ? "Positiva com Efeitos de Negativa" : p.cnd.tipo}</span></div>
                  {p.cnd.cib && <div className="acam-field"><label>CIB/NIRF</label><span>{p.cnd.cib}</span></div>}
                  {p.cnd.data_validade && <div className="acam-field"><label>Validade</label><span className={cndVencida ? "acam-text-error" : "acam-text-success"}>{new Date(p.cnd.data_validade).toLocaleDateString("pt-BR")} {cndVencida && "(VENCIDA)"}</span></div>}
                  {p.cnd.area_hectares && <div className="acam-field"><label>Área</label><span>{formatNum(p.cnd.area_hectares)} ha</span></div>}
                </div>
              </div>
            </>
          )}
        </div>

        {/* TRANSMISSIBILIDADE */}
        {p.analise_transmissibilidade && (
          <div className="acam-card">
            <div className="acam-section-title">Análise de Transmissibilidade</div>
            <p className="text-sm mb-4">{p.analise_transmissibilidade.resumo}</p>
            {p.analise_transmissibilidade.impedimentos.length > 0 && (
              <>
                <h4 className="acam-subsection-title acam-text-error">Impedimentos</h4>
                {p.analise_transmissibilidade.impedimentos.map((imp, i) => (
                  <AlertResult key={i} status="error" statusLabel="VETO">
                    <strong>{imp.descricao}</strong>
                    <div className="text-xs mt-1">Fundamentação: {imp.fundamentacao}</div>
                    <div className="text-xs">Recomendação: {imp.recomendacao}</div>
                  </AlertResult>
                ))}
              </>
            )}
            {p.analise_transmissibilidade.diligencias_recomendadas.length > 0 && (
              <>
                <h4 className="acam-subsection-title">Diligências Recomendadas</h4>
                {p.analise_transmissibilidade.diligencias_recomendadas.map((d, i) => (
                  <p key={i} className="text-sm mb-2">• {d}</p>
                ))}
              </>
            )}
          </div>
        )}

        {/* VTN */}
        {p.vtn?.encontrado && (
          <div className="acam-card">
            <div className="acam-section-title">Valor de Referência (VTN)</div>
            <div className="acam-fg acam-fg-2">
              <div className="acam-field"><label>Município</label><span>{p.vtn.municipio}</span></div>
              <div className="acam-field"><label>R$/ha</label><span>{p.vtn.valor_referencia ? formatBRL(p.vtn.valor_referencia) : "—"}</span></div>
              {p.vtn.valor_estimado && (
                <div className="acam-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Valor estimado</label>
                  <span className="text-lg font-semibold">{formatBRL(p.vtn.valor_estimado)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <AlertResult status="warning" statusLabel="Importante">
          Esta é uma análise preliminar automatizada. Não constitui parecer jurídico ou técnico. Os dados extraídos por IA devem ser conferidos com os documentos originais.
        </AlertResult>

        <div className="flex flex-wrap gap-3">
          <button className="acam-btn acam-btn-primary" onClick={async () => {
            try {
              const res = await fetch(`/api/consultas/${consultaId}`)
              const data = await res.json()
              if (data.consulta?.pdf_url) window.open(data.consulta.pdf_url, "_blank")
              else alert("PDF ainda não disponível.")
            } catch { alert("Erro ao buscar o PDF.") }
          }}>Baixar Relatório PDF</button>
          <Link href="/dashboard" className="acam-btn acam-btn-secondary">Voltar ao dashboard</Link>
        </div>
      </div>
    )
  }

  // FORMULÁRIO

  return (
    <div>
      <div className="acam-container pb-0">
        <Link href="/dashboard" className="acam-back-link">← Voltar ao dashboard</Link>
      </div>

      <div className="acam-service-header acam-service-header-primary">
        <div className="acam-service-header-content">
          <div className="acam-service-header-info">
            <div className="acam-service-header-icon">AM</div>
            <div className="acam-service-header-text">
              <h1>Análise de Matrícula</h1>
              <p>Avaliação de viabilidade registral e documental do imóvel</p>
            </div>
          </div>
          <div className="acam-service-header-cost">
            <div className="acam-service-header-cost-label">Custo</div>
            <div className="acam-service-header-cost-value">{CUSTO_CREDITOS} créditos</div>
          </div>
        </div>
      </div>

      <div className="acam-container">
        <div className="acam-card">
          <div className="acam-section-title">Dados do Imóvel</div>
          <div className="acam-section-desc">Informações básicas para identificação.</div>
          <div className="acam-fg acam-fg-2">
            <div className="acam-field">
              <label>Nome do Imóvel</label>
              <input className="acam-form-input" placeholder="Ex: Fazenda Boa Vista" value={nomeImovel} onChange={(e) => setNomeImovel(e.target.value)} />
            </div>
            <div className="acam-field">
              <label>Município</label>
              <ComboboxMunicipio value={municipio} onChange={setMunicipio} placeholder="Ex: Jequitinhonha" />
            </div>
          </div>
        </div>

        <div className="acam-card">
          <div className="acam-section-title">Documentação</div>
          <div className="acam-section-desc">A matrícula é obrigatória. A CND-ITR é recomendada para avaliação fiscal completa.</div>

          <input ref={matriculaRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => setMatriculaFile(e.target.files?.[0] || null)} />
          <input ref={cndRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => setCndFile(e.target.files?.[0] || null)} />

          <DocumentoItem nome="Matrícula do Imóvel" obrigatorio arquivo={matriculaFile?.name} onSelect={() => matriculaRef.current?.click()} onClear={() => { setMatriculaFile(null); if (matriculaRef.current) matriculaRef.current.value = "" }} />
          <DocumentoItem nome="CND-ITR" arquivo={cndFile?.name} onSelect={() => cndRef.current?.click()} onClear={() => { setCndFile(null); if (cndRef.current) cndRef.current.value = "" }} />

          <AlertResult>Para melhores resultados, utilize documentos em PDF com <strong>texto selecionável</strong>.</AlertResult>
        </div>

        <div className="acam-card">
          <div className="acam-section-title">Arquivo Geoespacial (opcional)</div>
          <div className="acam-section-desc">Se disponível, envie o perímetro do imóvel para verificar sobreposição com Unidades de Conservação (federais, estaduais e municipais).</div>

          <input ref={kmlRef} type="file" accept=".kml,.kmz,.geojson,.json" style={{ display: "none" }} onChange={(e) => setKmlFile(e.target.files?.[0] || null)} />

          <div className="acam-upload-card" onClick={() => kmlRef.current?.click()}>
            <h2>Perímetro do Imóvel</h2>
            <p>KML, KMZ ou GeoJSON — para verificação de UCs</p>
            <div className={`acam-upload-zone ${kmlFile ? "acam-upload-zone-success" : ""}`}>
              <p>{kmlFile ? `✓ ${kmlFile.name}` : "Clique para selecionar (opcional)"}</p>
            </div>
          </div>
        </div>

        {erro && <div className="acam-alert acam-alert-error">{erro}</div>}

        {loading && <EtapasProgresso />}

        {!loading && <AlertResult>
          <strong>O que será analisado:</strong> A matrícula será processada por IA para extrair proprietários, ônus, gravames e dados registrais. A cadeia de titularidade será resolvida e a transmissibilidade avaliada. Se a CND-ITR for incluída, os dados fiscais serão cruzados. Se o arquivo geoespacial for incluído, será verificada sobreposição com Unidades de Conservação (federais, estaduais e municipais). O resultado incluirá pontuação MVAR e valor de referência (VTN).
        </AlertResult>}

        <button className="acam-btn acam-btn-primary w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? "Processando análise..." : `Analisar Matrícula (${CUSTO_CREDITOS} créditos)`}
        </button>
      </div>
    </div>
  )
}

"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { StatusBadge, AlertResult, CTAConsultoria, DocumentoItem } from "@/components/acam"
import { MapaImovel } from "@/components/acam/mapa-imovel"
import { ComboboxMunicipio } from "@/components/acam/combobox-municipio"

// ============================================
// TIPOS DO PARECER (espelha API /api/consultas)
// ============================================

interface Proprietario {
  nome: string
  percentual: number | null
  fracao: string | null
  cpf_cnpj: string | null
  qualificacao: string | null
  estado_civil: string | null
  conjuge: string | null
  regime_bens: string | null
  ato_aquisitivo: string | null
  data_aquisicao: string | null
}

interface OnusGravame {
  tipo: string
  nivel: number
  nivel_descricao: string
  numero_averbacao: string
  descricao: string
  impacto_compra_venda: string
}

interface OnusExtinto {
  ato: string
  tipo: string
  descricao: string
  cancelado_por: string
}

interface OutorgaConjugal {
  nome: string
  casado: boolean
  conjuge: string | null
  regime_bens: string | null
  exige_outorga: boolean
  observacao: string | null
}

interface GeorefStatus {
  exigivel: boolean
  prazo_legal: string
  existente: boolean
  situacao: string
  impacto: string | null
}

interface RegimeUC {
  em_uc_protecao_integral: boolean
  nome_uc: string | null
  categoria_uc: string | null
  fundamentacao: string
  impacto_transmissao: string
}

interface RestricaoAmbiental {
  tipo: string
  descricao: string
  ato_origem: string
  area_ha: number | null
}

interface RestricaoHistorica extends RestricaoAmbiental {
  motivo_reclassificacao: string
}

interface AnaliseTransmissibilidade {
  resumo: string
  impedimentos: Array<{ descricao: string; ato_origem: string | null; fundamentacao: string; recomendacao: string }>
  diligencias_recomendadas: string[]
  ressalvas: string[]
}

interface UC {
  nome: string
  categoria: string
  protecao_integral: boolean
  percentual_sobreposicao: number | null
  area_sobreposicao_ha?: number
  area_fora_uc_ha?: number
}

interface Parecer {
  imovel: {
    nome: string
    municipio: string
    estado: string
    area_hectares: number | null
    area_fonte: string | null
    area_fontes: { kml: number | null; matricula: number | null; cnd: number | null } | null
    matricula: string | null
    cartorio: string | null
    ccir: string | null
    nirf: string | null
    codigo_incra: string | null
    car: string | null
    georreferenciamento: boolean | null
  }
  proprietarios: Proprietario[]
  outorga_conjugal: OutorgaConjugal[]
  georeferenciamento: GeorefStatus
  onus_gravames: OnusGravame[]
  onus_extintos: OnusExtinto[]
  restricoes_ambientais: RestricaoAmbiental[]
  contexto_historico_ambiental: RestricaoHistorica[]
  regime_uc: RegimeUC | null
  analise_transmissibilidade: AnaliseTransmissibilidade | null
  cancelamentos: Array<{ tipo_onus?: string; motivo_extincao?: string }>
  alertas_matricula: string[]
  semaforo: "verde" | "amarelo" | "vermelho"
  semaforo_justificativa: string
  recomendacoes: string[]
  documentos_faltantes: string[]
  confianca_ocr: string
  cnd: {
    tipo: string
    cib: string | null
    data_emissao: string | null
    data_validade: string | null
    area_hectares: number | null
    nome_contribuinte: string | null
  } | null
  ide_sisema: {
    sucesso: boolean
    ucs: UC[]
    bbox: { minLon: number; maxLon: number; minLat: number; maxLat: number } | null
    centroide: { lon: number; lat: number } | null
    geojson_imovel: GeoJSON.FeatureCollection | null
  }
  vtn: {
    encontrado: boolean
    municipio?: string
    valor_referencia?: number
    valor_estimado?: number
    exercicio?: string
  } | null
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

// ============================================
// ETAPAS DO PROCESSAMENTO (feedback visual)
// ============================================

const ETAPAS_ANALISE = [
  { label: "Enviando documentos", descricao: "Upload dos arquivos para processamento seguro", duracao: 3 },
  { label: "Extraindo dados do imóvel", descricao: "Leitura do cabeçalho da matrícula: área, cartório, CCIR, CAR", duracao: 8 },
  { label: "Identificando atos e partes", descricao: "Parsing de cada ato registral: transmitentes, adquirentes, percentuais", duracao: 15 },
  { label: "Consultando IDE-Sisema", descricao: "Verificando sobreposição com Unidades de Conservação via WFS", duracao: 5 },
  { label: "Resolvendo titularidade", descricao: "Cadeia de transmissões, pareamento de cancelamentos, ônus ativos", duracao: 3 },
  { label: "Analisando transmissibilidade", descricao: "Outorga conjugal, georreferenciamento, restrições ambientais", duracao: 8 },
  { label: "Gerando relatório", descricao: "Montagem do parecer PDF com template ACAM", duracao: 3 },
]

function EtapasProgresso() {
  const [etapaAtual, setEtapaAtual] = useState(0)
  const [fadeIn, setFadeIn] = useState(true)

  useEffect(() => {
    let tempoAcumulado = 0
    const timers: ReturnType<typeof setTimeout>[] = []

    for (let i = 1; i < ETAPAS_ANALISE.length; i++) {
      tempoAcumulado += ETAPAS_ANALISE[i - 1].duracao * 1000
      // Fade-out 300ms antes da troca
      timers.push(setTimeout(() => setFadeIn(false), tempoAcumulado - 300))
      // Troca de etapa + fade-in
      timers.push(setTimeout(() => {
        setEtapaAtual(i)
        setFadeIn(true)
      }, tempoAcumulado))
    }

    return () => timers.forEach(clearTimeout)
  }, [])

  const etapa = ETAPAS_ANALISE[etapaAtual]
  const progresso = ((etapaAtual + 1) / ETAPAS_ANALISE.length) * 100

  return (
    <div className="acam-card" style={{ textAlign: "center", padding: "var(--spacing-8) var(--spacing-6)" }}>
      {/* Spinner */}
      <div className="acam-spinner-lg" style={{ margin: "0 auto var(--spacing-6)" }} />

      {/* Frase da etapa com fade */}
      <div style={{
        transition: "opacity 0.3s ease",
        opacity: fadeIn ? 1 : 0,
        minHeight: "3.5rem",
      }}>
        <div style={{
          fontSize: "var(--font-size-base)",
          fontWeight: 600,
          color: "var(--primary-600)",
          marginBottom: "var(--spacing-2)",
        }}>
          {etapa.label}
        </div>
        <p className="text-sm text-muted-foreground">
          {etapa.descricao}
        </p>
      </div>

      {/* Barra de progresso */}
      <div style={{
        marginTop: "var(--spacing-6)",
        maxWidth: "16rem",
        marginLeft: "auto",
        marginRight: "auto",
      }}>
        <div style={{
          height: "3px",
          borderRadius: "2px",
          background: "var(--neutral-200)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${progresso}%`,
            background: "var(--primary-500)",
            borderRadius: "2px",
            transition: "width 0.5s ease",
          }} />
        </div>
        <p className="text-xs text-muted-foreground" style={{ marginTop: "var(--spacing-2)" }}>
          Etapa {etapaAtual + 1} de {ETAPAS_ANALISE.length}
        </p>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function DestinacaoUCBasePage() {
  const router = useRouter()
  const [custoCreditos, setCustoCreditos] = useState(5)

  useEffect(() => {
    fetch("/api/configuracoes?chave=precos")
      .then((r) => r.json())
      .then((data) => {
        const v = data.valor?.ferramentas?.["dest-uc-base"]?.creditos
        if (v != null) setCustoCreditos(v)
      })
      .catch(() => { /* mantém fallback */ })
  }, [])

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [resultado, setResultado] = useState<{ consultaId: string; parecer: Parecer } | null>(null)

  const [nomeImovel, setNomeImovel] = useState("")
  const [municipio, setMunicipio] = useState("")
  const [matriculaFile, setMatriculaFile] = useState<File | null>(null)
  const [kmlFile, setKmlFile] = useState<File | null>(null)
  const [cndFile, setCndFile] = useState<File | null>(null)

  const matriculaRef = useRef<HTMLInputElement>(null)
  const kmlRef = useRef<HTMLInputElement>(null)
  const cndRef = useRef<HTMLInputElement>(null)

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
      if (cndFile) formData.append("cnd", cndFile)

      const res = await fetch("/api/consultas", { method: "POST", body: formData })
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
    const p = parecer
    const temVeto = (p.onus_gravames || []).some((o) => o.nivel === 1)

    // CND vencida?
    const cndVencida = p.cnd?.data_validade ? new Date(p.cnd.data_validade) < new Date() : false

    // Divergência de área matrícula vs CND
    const areaMat = p.imovel.area_hectares
    const areaCND = p.cnd?.area_hectares
    const temDivergenciaArea = areaMat && areaCND && Math.abs((areaCND - areaMat) / areaMat * 100) > 5

    return (
      <div className="acam-container">
        <Link href="/dashboard" className="acam-back-link">
          ← Voltar ao dashboard
        </Link>

        {/* Semáforo */}
        <div className={`acam-card acam-card-dark acam-semaforo-${p.semaforo}`}>
          <p className="text-xs" style={{ opacity: 0.8 }}>Análise Preliminar de Viabilidade</p>
          <h2 className="text-xl font-semibold">{p.imovel.nome || p.imovel.municipio || "Imóvel Analisado"}</h2>
          <p className="text-sm" style={{ opacity: 0.9 }}>
            {p.imovel.municipio}/{p.imovel.estado} — {p.imovel.area_hectares?.toFixed(2)} ha
          </p>
          <div className="acam-semaforo-label">
            <strong>{temVeto ? "Impedimentos identificados" : p.semaforo === "verde" ? "Risco Baixo" : p.semaforo === "amarelo" ? "Risco Médio" : "Risco Alto"}</strong> — {p.semaforo_justificativa}
          </div>
        </div>

        {/* Disclaimer principal */}
        <div className="acam-alert acam-alert-warning">
          <strong>Análise preliminar.</strong> Este relatório é uma pré-avaliação automatizada e não substitui parecer técnico ou jurídico. {p.confianca_ocr === "baixa" && <><br /><strong>ATENÇÃO:</strong> documento com baixa legibilidade — conferir dados numéricos.</>}
        </div>

        {/* VETOS */}
        {temVeto && (
          <div className="acam-card" style={{ borderLeft: "4px solid var(--error)" }}>
            <div className="acam-section-title" style={{ color: "var(--error)" }}>Impedimentos Identificados</div>
            <div className="acam-section-desc">Situações que, se confirmadas, impedem a destinação do imóvel.</div>
            {p.onus_gravames.filter((o) => o.nivel === 1).map((o, i) => (
              <div key={i} className="acam-alert acam-alert-error">
                <strong>{o.tipo}:</strong> {o.impacto_compra_venda || o.descricao}
              </div>
            ))}
          </div>
        )}

        {/* SEÇÃO 1: LOCALIZAÇÃO EM UC */}
        <div className="acam-card">
          <div className="acam-section-title">Localização em Unidade de Conservação</div>
          <div className="acam-section-desc">
            Para compensação minerária, o imóvel deve estar inserido em UC de Proteção Integral pendente de regularização fundiária (Lei Estadual 20.922/2013).
          </div>

          {p.ide_sisema.ucs.length === 0 ? (
            <div className="acam-alert acam-alert-error">
              Nenhuma Unidade de Conservação identificada na área do imóvel. O imóvel não atende ao requisito básico de localização.
            </div>
          ) : (
            p.ide_sisema.ucs.map((uc, i) => (
              <div key={i} className="acam-card acam-card-compact">
                <div className="flex items-center justify-between mb-2">
                  <strong className="text-sm">{uc.nome}</strong>
                  <StatusBadge variant={uc.protecao_integral ? "success" : "warning"}>
                    {uc.protecao_integral ? "Proteção Integral" : "Uso Sustentável"}
                  </StatusBadge>
                </div>
                <p className="text-sm text-muted-foreground">{uc.categoria}</p>
                {uc.percentual_sobreposicao != null && (
                  <p className="text-sm mt-2">
                    <strong>{uc.percentual_sobreposicao}%</strong> do imóvel está no interior da UC
                    {uc.area_sobreposicao_ha != null && <> ({uc.area_sobreposicao_ha} ha)</>}
                  </p>
                )}
                {!uc.protecao_integral && (
                  <p className="text-sm mt-2" style={{ color: "var(--warning)" }}>
                    A UC não é de Proteção Integral. A Portaria IEF 27/2017 exige que o imóvel esteja em UC de Proteção Integral.
                  </p>
                )}
              </div>
            ))
          )}

          {/* Regime UC */}
          {p.regime_uc && (
            <div className="acam-alert acam-alert-result">
              <strong>Regime de UC de Proteção Integral</strong><br />
              {p.regime_uc.impacto_transmissao}
            </div>
          )}

          {/* Mapa */}
          {p.ide_sisema.bbox && p.ide_sisema.centroide && (
            <div style={{ marginTop: "var(--spacing-4)" }}>
              <MapaImovel
                bbox={p.ide_sisema.bbox}
                centroide={p.ide_sisema.centroide}
                geojsonImovel={p.ide_sisema.geojson_imovel || undefined}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Localização aproximada baseada no arquivo geoespacial enviado.
              </p>
            </div>
          )}
        </div>

        {/* SEÇÃO 2: ANÁLISE DA MATRÍCULA */}
        <div className="acam-card">
          <div className="acam-section-title">Análise da Matrícula</div>
          <div className="acam-section-desc">
            Extração automática dos dados registrais por inteligência artificial.
          </div>

          {/* Dados básicos */}
          <div className="acam-card acam-card-compact">
            <div className="acam-fg acam-fg-2">
              {p.imovel.matricula && <div className="acam-field"><label>Matrícula</label><span>{p.imovel.matricula}</span></div>}
              {p.imovel.cartorio && <div className="acam-field"><label>Cartório</label><span>{p.imovel.cartorio}</span></div>}
              {p.imovel.area_hectares != null && (
                <div className="acam-field">
                  <label>Área</label>
                  <span>{p.imovel.area_hectares.toFixed(2)} ha {p.imovel.area_fonte && <span className="text-xs text-muted-foreground">({p.imovel.area_fonte})</span>}</span>
                </div>
              )}
              {p.imovel.ccir && <div className="acam-field"><label>CCIR</label><span>{p.imovel.ccir}</span></div>}
              {p.imovel.nirf && <div className="acam-field"><label>NIRF/CIB</label><span>{p.imovel.nirf}</span></div>}
              {p.imovel.car && <div className="acam-field"><label>CAR</label><span>{p.imovel.car}</span></div>}
            </div>
          </div>

          {/* Proprietários */}
          <h4 className="acam-section-title" style={{ fontSize: "0.875rem", borderBottom: "none", paddingBottom: 0, marginTop: "var(--spacing-4)" }}>Proprietários identificados</h4>
          {p.proprietarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum proprietário identificado na matrícula.</p>
          ) : (
            <>
              {p.proprietarios.map((prop, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b text-sm">
                  <div>
                    <strong>{prop.nome}</strong>
                    {prop.estado_civil && <span className="text-muted-foreground"> — {prop.estado_civil}</span>}
                    {prop.conjuge && <span className="text-muted-foreground"> (cônjuge: {prop.conjuge})</span>}
                  </div>
                  <span className="font-semibold">{prop.percentual ?? "?"}%</span>
                </div>
              ))}
            </>
          )}

          {/* Outorga conjugal */}
          {p.outorga_conjugal?.some((o) => o.exige_outorga || o.observacao) && (
            <div style={{ marginTop: "var(--spacing-4)" }}>
              <h4 className="acam-section-title" style={{ fontSize: "0.875rem", borderBottom: "none", paddingBottom: 0 }}>Outorga Conjugal</h4>
              {p.outorga_conjugal.filter((o) => o.exige_outorga || o.observacao).map((o, i) => (
                <div key={i} className={`acam-alert ${o.exige_outorga ? "acam-alert-warning" : "acam-alert-result"}`}>
                  <strong>{o.nome}:</strong> {o.exige_outorga ? `exige outorga do cônjuge ${o.conjuge || "(nome não identificado)"}` : ""} {o.observacao || ""}
                </div>
              ))}
            </div>
          )}

          {/* Ônus e Gravames */}
          <h4 className="acam-section-title" style={{ fontSize: "0.875rem", borderBottom: "none", paddingBottom: 0, marginTop: "var(--spacing-4)" }}>Ônus e Gravames</h4>
          {p.onus_gravames.length === 0 ? (
            <div className="acam-alert acam-alert-success">
              Nenhum ônus ou gravame identificado — situação registral favorável.
            </div>
          ) : (
            p.onus_gravames.map((onus, i) => (
              <div key={i} className={`acam-alert ${onus.nivel === 1 ? "acam-alert-error" : "acam-alert-warning"}`}>
                <strong>{onus.tipo}</strong>
                {onus.numero_averbacao && <span className="text-xs text-muted-foreground"> ({onus.numero_averbacao})</span>}
                <div className="text-sm mt-1">{onus.impacto_compra_venda || onus.descricao}</div>
              </div>
            ))
          )}

          {/* Ônus extintos */}
          {(p.onus_extintos || []).length > 0 && (
            <div style={{ marginTop: "var(--spacing-3)" }}>
              {p.onus_extintos.map((o, i) => (
                <p key={i} className="text-xs text-muted-foreground">✓ {o.tipo} ({o.ato}) — cancelado por {o.cancelado_por}</p>
              ))}
            </div>
          )}

          {/* Georreferenciamento */}
          {p.georeferenciamento && (
            <div style={{ marginTop: "var(--spacing-4)" }}>
              <h4 className="acam-section-title" style={{ fontSize: "0.875rem", borderBottom: "none", paddingBottom: 0 }}>Georreferenciamento</h4>
              <div className={`acam-alert ${p.georeferenciamento.situacao === "regular" ? "acam-alert-success" : "acam-alert-error"}`}>
                <strong>{p.georeferenciamento.situacao === "regular" ? "Regular" : "Pendente"}</strong> — Prazo: {p.georeferenciamento.prazo_legal}
                {p.georeferenciamento.impacto && <div className="text-sm mt-1">{p.georeferenciamento.impacto}</div>}
              </div>
            </div>
          )}

          {/* Alertas da matrícula */}
          {p.alertas_matricula.length > 0 && (
            <div style={{ marginTop: "var(--spacing-4)" }}>
              <h4 className="acam-section-title" style={{ fontSize: "0.875rem", borderBottom: "none", paddingBottom: 0 }}>Alertas</h4>
              {p.alertas_matricula.map((alerta, i) => (
                <div key={i} className="acam-alert acam-alert-warning">
                  {typeof alerta === "string" ? alerta : JSON.stringify(alerta)}
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-4" style={{ fontStyle: "italic" }}>
            Dados extraídos por IA. PDFs escaneados podem ter precisão reduzida. Confira com o documento original.
          </p>
        </div>

        {/* SEÇÃO 3: RESTRIÇÕES AMBIENTAIS */}
        {((p.restricoes_ambientais || []).length > 0 || (p.contexto_historico_ambiental || []).length > 0) && (
          <div className="acam-card">
            <div className="acam-section-title">Restrições Ambientais</div>
            {p.restricoes_ambientais.length > 0 ? (
              p.restricoes_ambientais.map((r, i) => (
                <div key={i} className="acam-alert acam-alert-warning">
                  <strong>{r.tipo}</strong> ({r.ato_origem})
                  <div className="text-sm mt-1">{r.descricao}</div>
                  {r.area_ha && <div className="text-xs text-muted-foreground">Área: {r.area_ha} ha</div>}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma restrição ambiental vigente.</p>
            )}

            {(p.contexto_historico_ambiental || []).length > 0 && (
              <div style={{ marginTop: "var(--spacing-4)" }}>
                <h4 className="acam-section-title" style={{ fontSize: "0.875rem", borderBottom: "none", paddingBottom: 0 }}>Contexto Histórico (absorvido pela UC)</h4>
                {p.contexto_historico_ambiental.map((r, i) => (
                  <div key={i} className="acam-card acam-card-compact">
                    <p className="text-xs text-muted-foreground">{r.tipo} ({r.ato_origem})</p>
                    <p className="text-xs text-muted-foreground" style={{ fontStyle: "italic" }}>{r.motivo_reclassificacao}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SEÇÃO 4: CND-ITR */}
        <div className="acam-card">
          <div className="acam-section-title">Análise Fiscal — CND-ITR</div>
          <div className="acam-section-desc">
            A CND-ITR comprova a regularidade fiscal do imóvel perante a Receita Federal.
          </div>

          {!p.cnd ? (
            <div className="acam-alert acam-alert-result">
              CND-ITR não apresentada. Recomenda-se incluir para avaliação mais completa.
            </div>
          ) : (
            <>
              <div className="acam-card acam-card-compact">
                <div className="acam-fg acam-fg-2">
                  <div className="acam-field">
                    <label>Tipo</label>
                    <StatusBadge variant={p.cnd.tipo === "negativa" || p.cnd.tipo?.includes("efeito") ? "success" : "error"}>
                      {p.cnd.tipo === "negativa" ? "Certidão Negativa" : p.cnd.tipo?.includes("efeito") ? "Positiva com Efeitos de Negativa" : p.cnd.tipo === "positiva" ? "Positiva (débitos)" : p.cnd.tipo}
                    </StatusBadge>
                  </div>
                  {p.cnd.cib && <div className="acam-field"><label>CIB/NIRF</label><span>{p.cnd.cib}</span></div>}
                  {p.cnd.data_validade && (
                    <div className="acam-field">
                      <label>Validade</label>
                      <span style={{ color: cndVencida ? "var(--error)" : "var(--success)" }}>
                        {new Date(p.cnd.data_validade).toLocaleDateString("pt-BR")} {cndVencida && "(VENCIDA)"}
                      </span>
                    </div>
                  )}
                  {p.cnd.area_hectares && <div className="acam-field"><label>Área CND</label><span>{p.cnd.area_hectares.toFixed(2)} ha</span></div>}
                </div>
              </div>

              {temDivergenciaArea && (
                <div className="acam-alert acam-alert-warning">
                  <strong>Divergência de área:</strong> Matrícula {areaMat?.toFixed(2)} ha, CND {areaCND?.toFixed(2)} ha ({areaMat && areaCND ? Math.abs((areaCND - areaMat) / areaMat * 100).toFixed(1) : 0}%).
                </div>
              )}

              {p.imovel.nirf && p.cnd.cib && p.imovel.nirf !== p.cnd.cib && (
                <div className="acam-alert acam-alert-warning">
                  <strong>Divergência de código:</strong> NIRF na matrícula ({p.imovel.nirf}) difere do CIB na CND ({p.cnd.cib}).
                </div>
              )}
            </>
          )}
        </div>

        {/* SEÇÃO 5: ANÁLISE DE TRANSMISSIBILIDADE */}
        {p.analise_transmissibilidade && (
          <div className="acam-card">
            <div className="acam-section-title">Análise de Transmissibilidade</div>
            <p className="text-sm mb-4">{p.analise_transmissibilidade.resumo}</p>

            {p.analise_transmissibilidade.impedimentos.length > 0 && (
              <>
                <h4 className="acam-section-title" style={{ fontSize: "0.875rem", borderBottom: "none", paddingBottom: 0, color: "var(--error)" }}>Impedimentos</h4>
                {p.analise_transmissibilidade.impedimentos.map((imp, i) => (
                  <div key={i} className="acam-alert acam-alert-error">
                    <strong>{imp.descricao}</strong>
                    <div className="text-xs mt-1">Fundamentação: {imp.fundamentacao}</div>
                    <div className="text-xs">Recomendação: {imp.recomendacao}</div>
                  </div>
                ))}
              </>
            )}

            {p.analise_transmissibilidade.diligencias_recomendadas.length > 0 && (
              <>
                <h4 className="acam-section-title" style={{ fontSize: "0.875rem", borderBottom: "none", paddingBottom: 0, marginTop: "var(--spacing-4)" }}>Diligências Recomendadas</h4>
                {p.analise_transmissibilidade.diligencias_recomendadas.map((d, i) => (
                  <p key={i} className="text-sm" style={{ marginBottom: "var(--spacing-2)" }}>• {d}</p>
                ))}
              </>
            )}

            {p.analise_transmissibilidade.ressalvas.length > 0 && (
              <div style={{ marginTop: "var(--spacing-4)" }}>
                {p.analise_transmissibilidade.ressalvas.map((r, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{r}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SEÇÃO 6: SÍNTESE */}
        <div className="acam-card">
          <div className="acam-section-title">Síntese da Análise</div>

          {(p.recomendacoes || []).length > 0 && (
            <div style={{ marginBottom: "var(--spacing-4)" }}>
              <h4 className="acam-section-title" style={{ fontSize: "0.875rem", borderBottom: "none", paddingBottom: 0 }}>Recomendações</h4>
              {p.recomendacoes.map((rec, i) => (
                <p key={i} className="text-sm" style={{ marginBottom: "var(--spacing-1)", color: "var(--warning)" }}>• {rec}</p>
              ))}
            </div>
          )}

          {(p.documentos_faltantes || []).length > 0 && (
            <div style={{ marginBottom: "var(--spacing-4)" }}>
              <h4 className="acam-section-title" style={{ fontSize: "0.875rem", borderBottom: "none", paddingBottom: 0, color: "var(--warning)" }}>Documentos Faltantes</h4>
              {p.documentos_faltantes.map((doc, i) => (
                <div key={i} className="acam-alert acam-alert-warning">{doc}</div>
              ))}
            </div>
          )}

          {(p.cancelamentos || []).length > 0 && (
            <div>
              <h4 className="acam-section-title" style={{ fontSize: "0.875rem", borderBottom: "none", paddingBottom: 0, color: "var(--success)" }}>Ônus Cancelados/Extintos</h4>
              {p.cancelamentos.map((c, i) => (
                <p key={i} className="text-sm" style={{ color: "var(--success)" }}>✓ {c.tipo_onus} — {c.motivo_extincao}</p>
              ))}
            </div>
          )}
        </div>

        {/* VTN */}
        {p.vtn?.encontrado && (
          <div className="acam-card">
            <div className="acam-section-title">Valor de Referência (VTN)</div>
            <div className="acam-section-desc">Valor da Terra Nua por hectare (SIPT/Receita Federal). Referência para estimativa.</div>
            <div className="acam-fg acam-fg-2">
              <div className="acam-field"><label>Município</label><span>{p.vtn.municipio}</span></div>
              <div className="acam-field"><label>R$/ha</label><span>R$ {p.vtn.valor_referencia?.toLocaleString("pt-BR")}</span></div>
              {p.vtn.valor_estimado && (
                <div className="acam-field" style={{ gridColumn: "1 / -1" }}>
                  <label>Valor estimado</label>
                  <span className="text-lg font-semibold">R$ {p.vtn.valor_estimado.toLocaleString("pt-BR")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disclaimer final */}
        <AlertResult status="warning" statusLabel="Importante">
          Esta é uma análise preliminar automatizada. Não constitui parecer jurídico ou técnico. Os dados extraídos por IA devem ser conferidos com os documentos originais. A viabilidade definitiva depende de análise por profissional qualificado.
        </AlertResult>

        {/* Botões */}
        <div style={{ display: "flex", gap: "var(--spacing-3)", flexWrap: "wrap" }}>
          <button className="acam-btn acam-btn-primary" onClick={async () => {
            const res = await fetch(`/api/consultas/${consultaId}`)
            const data = await res.json()
            if (data.consulta?.pdf_url) {
              window.open(data.consulta.pdf_url, "_blank")
            }
          }}>Baixar Relatório PDF</button>
          <Link href="/dashboard" className="acam-btn acam-btn-secondary">Voltar ao dashboard</Link>
        </div>

        <CTAConsultoria contexto="destinacao-uc" />
      </div>
    )
  }

  // ============================================
  // TELA DE UPLOAD (FORMULÁRIO)
  // ============================================

  return (
    <div>
      <div className="acam-container" style={{ paddingBottom: 0 }}>
        <Link href="/dashboard" className="acam-back-link">
          ← Voltar ao dashboard
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
            <div className="acam-service-header-cost-value">{custoCreditos} créditos</div>
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
              <ComboboxMunicipio value={municipio} onChange={setMunicipio} placeholder="Ex: Três Marias" />
            </div>
          </div>
        </div>

        <div className="acam-card">
          <div className="acam-section-title">Documentação do Imóvel</div>
          <div className="acam-section-desc">Documentos obrigatórios marcados com asterisco (*). Indicador muda de "?" para "✓" ao selecionar.</div>

          <input ref={matriculaRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => setMatriculaFile(e.target.files?.[0] || null)} />
          <input ref={cndRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => setCndFile(e.target.files?.[0] || null)} />

          <DocumentoItem
            nome="Matrícula do Imóvel"
            obrigatorio
            arquivo={matriculaFile?.name}
            onSelect={() => matriculaRef.current?.click()}
            onClear={() => { setMatriculaFile(null); if (matriculaRef.current) matriculaRef.current.value = "" }}
          />
          <DocumentoItem
            nome="CND-ITR"
            arquivo={cndFile?.name}
            onSelect={() => cndRef.current?.click()}
            onClear={() => { setCndFile(null); if (cndRef.current) cndRef.current.value = "" }}
          />

          <AlertResult>
            Para melhores resultados, utilize documentos em PDF com <strong>texto selecionável</strong>. PDFs escaneados são aceitos, mas a extração por OCR pode ter precisão reduzida.
          </AlertResult>
        </div>

        <div className="acam-card">
          <div className="acam-section-title">Arquivo Geoespacial</div>
          <div className="acam-section-desc">Perímetro do imóvel proposto para destinação.</div>

          <input ref={kmlRef} type="file" accept=".kml,.kmz,.geojson,.json" style={{ display: "none" }} onChange={(e) => setKmlFile(e.target.files?.[0] || null)} />

          <div className="acam-upload-card" onClick={() => kmlRef.current?.click()}>
            <h2>Imóvel Proposto <span className="req">*</span></h2>
            <p>Área proposta para destinação em UC</p>
            <div className={`acam-upload-zone ${kmlFile ? "acam-upload-zone-success" : ""}`}>
              <p>{kmlFile ? `✓ ${kmlFile.name}` : "Clique para selecionar KML, KMZ, GEOJSON, JSON"}</p>
            </div>
          </div>
        </div>

        {erro && <div className="acam-alert acam-alert-error">{erro}</div>}

        {loading && <EtapasProgresso />}

        {!loading && <AlertResult>
          <strong>O que será analisado:</strong> A matrícula será processada por IA para extrair proprietários, ônus e dados registrais.
          O arquivo geoespacial será cruzado com a base do IDE-Sisema para verificar sobreposição com UCs de Proteção Integral.
          Se a CND-ITR for incluída, os dados fiscais serão cruzados para identificar divergências.
        </AlertResult>}

        <button className="acam-btn acam-btn-primary" style={{ width: "100%" }} onClick={handleSubmit} disabled={loading}>
          {loading ? "Processando análise..." : `Analisar Imóvel (${custoCreditos} créditos)`}
        </button>
      </div>
    </div>
  )
}

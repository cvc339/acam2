"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { StatusBadge, AlertResult, CTAConsultoria, DocumentoItem } from "@/components/acam"
import { MapaImovel } from "@/components/acam/mapa-imovel"
import { ComboboxMunicipio } from "@/components/acam/combobox-municipio"
import { formatBRL, formatNum } from "@/lib/format"

// ============================================
// TIPOS DO PARECER
// ============================================

interface Bacia {
  sigla: string | null
  nome: string | null
  bacia_federal: string | null
  comite: string | null
  sede_comite: string | null
}

interface Criterio {
  nome: string
  obrigatorio: boolean
  atendido: boolean
  detalhe: string
}

interface UC {
  nome: string
  categoria: string
  protecao_integral: boolean
  percentual_sobreposicao: number | null
  area_sobreposicao_ha?: number
  area_fora_uc_ha?: number
}

interface Proprietario {
  nome: string
  percentual: number | null
  estado_civil: string | null
  conjuge: string | null
}

interface OnusGravame {
  tipo: string
  nivel: number
  nivel_descricao: string
  numero_averbacao: string
  descricao: string
  impacto_compra_venda: string
}

interface OutorgaConjugal {
  nome: string
  exige_outorga: boolean
  conjuge: string | null
  observacao: string | null
}

interface AnaliseTransmissibilidade {
  resumo: string
  impedimentos: Array<{ descricao: string; fundamentacao: string; recomendacao: string }>
  diligencias_recomendadas: string[]
  ressalvas: string[]
}

interface Parecer {
  tipo: string
  base_legal: string

  area_intervencao: {
    area_ha: number | null
    bacia: Bacia | null
    geojson: GeoJSON.FeatureCollection | null
    bbox: { minLon: number; maxLon: number; minLat: number; maxLat: number } | null
    centroide: { lon: number; lat: number } | null
  }
  area_proposta: {
    area_ha: number | null
    bacia: Bacia | null
    geojson: GeoJSON.FeatureCollection | null
    bbox: { minLon: number; maxLon: number; minLat: number; maxLat: number } | null
    centroide: { lon: number; lat: number } | null
    em_uc_pi: boolean
    uc: UC | null
    ucs_encontradas: UC[]
  }

  criterios: Criterio[]
  viabilidade: "ALTA" | "BAIXA"
  recomendacao: string

  imovel: {
    nome: string
    municipio: string
    estado: string
    matricula: string | null
    cartorio: string | null
    ccir: string | null
    nirf: string | null
    car: string | null
    georreferenciamento: boolean | null
  }
  proprietarios: Proprietario[]
  outorga_conjugal: OutorgaConjugal[]
  onus_gravames: OnusGravame[]
  onus_extintos: Array<{ ato: string; tipo: string; descricao: string; cancelado_por: string }>
  semaforo: "verde" | "amarelo" | "vermelho"
  semaforo_justificativa: string
  analise_transmissibilidade: AnaliseTransmissibilidade | null
  recomendacoes_matricula: string[]
  documentos_faltantes: string[]
  alertas_matricula: string[]
  confianca_ocr: string
  cnd: {
    tipo: string
    cib: string | null
    data_emissao: string | null
    data_validade: string | null
    area_hectares: number | null
    nome_contribuinte: string | null
  } | null
  vtn: {
    encontrado: boolean
    municipio?: string
    valor_referencia?: number
    valor_estimado?: number
    exercicio?: string
  } | null
}

// ============================================
// ETAPAS DO PROCESSAMENTO
// ============================================

const ETAPAS_ANALISE = [
  { label: "Enviando documentos", descricao: "Upload dos arquivos para processamento seguro", duracao: 3 },
  { label: "Processando geometrias", descricao: "Extraindo polígonos das duas áreas geoespaciais", duracao: 4 },
  { label: "Consultando bacias hidrográficas", descricao: "Identificando bacia federal e sub-bacia de cada área", duracao: 6 },
  { label: "Verificando Unidades de Conservação", descricao: "Checando sobreposição da área proposta com UCs via IDE-Sisema", duracao: 5 },
  { label: "Extraindo dados da matrícula", descricao: "Leitura do cabeçalho: proprietários, ônus, georreferenciamento", duracao: 12 },
  { label: "Analisando transmissibilidade", descricao: "Outorga conjugal, restrições, impedimentos", duracao: 8 },
  { label: "Avaliando critérios", descricao: "Comparando bacias e verificando viabilidade", duracao: 3 },
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
      timers.push(setTimeout(() => setFadeIn(false), tempoAcumulado - 300))
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
    <div className="acam-card text-center py-8 px-6">
      <div className="acam-spinner acam-spinner-lg mx-auto mb-6" />
      <div className="acam-fade-in" style={{ opacity: fadeIn ? 1 : 0, minHeight: "3.5rem" }}>
        <div className="font-semibold mb-2 text-primary">
          {etapa.label}
        </div>
        <p className="text-sm text-muted-foreground">{etapa.descricao}</p>
      </div>
      <div className="mt-6 mx-auto" style={{ maxWidth: "16rem" }}>
        <div className="acam-progress" style={{ height: "3px" }}>
          <div className="acam-progress-bar acam-progress-bar-primary" style={{ width: `${progresso}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Etapa {etapaAtual + 1} de {ETAPAS_ANALISE.length}
        </p>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function DestinacaoUCAppPage() {
  const router = useRouter()
  const [custoCreditos, setCustoCreditos] = useState(6)

  useEffect(() => {
    fetch("/api/configuracoes?chave=precos")
      .then((r) => r.json())
      .then((data) => {
        const v = data.valor?.ferramentas?.["dest-uc-app"]?.creditos
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
  const [cndFile, setCndFile] = useState<File | null>(null)
  const [kmlIntervencaoFile, setKmlIntervencaoFile] = useState<File | null>(null)
  const [kmlPropostaFile, setKmlPropostaFile] = useState<File | null>(null)

  const matriculaRef = useRef<HTMLInputElement>(null)
  const cndRef = useRef<HTMLInputElement>(null)
  const kmlIntervencaoRef = useRef<HTMLInputElement>(null)
  const kmlPropostaRef = useRef<HTMLInputElement>(null)

  async function handleSubmit() {
    setErro("")
    if (!matriculaFile) return setErro("Envie a matrícula do imóvel proposto (PDF).")
    if (!kmlIntervencaoFile) return setErro("Envie o arquivo geoespacial da área de intervenção em APP.")
    if (!kmlPropostaFile) return setErro("Envie o arquivo geoespacial da área proposta para doação.")

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("nome_imovel", nomeImovel)
      formData.append("municipio", municipio)
      formData.append("matricula", matriculaFile)
      if (cndFile) formData.append("cnd", cndFile)
      formData.append("kml_intervencao", kmlIntervencaoFile)
      formData.append("kml_proposta", kmlPropostaFile)

      const res = await fetch("/api/consultas/dest-uc-app", { method: "POST", body: formData })
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

    return (
      <div className="acam-container">
        <Link href="/dashboard" className="acam-back-link">
          ← Voltar ao dashboard
        </Link>

        {/* VIABILIDADE */}
        <AlertResult
          status={p.viabilidade === "ALTA" ? "success" : "error"}
          statusLabel={p.viabilidade === "ALTA" ? "Viabilidade Alta" : "Viabilidade Baixa"}
        >
          <strong>Compensação APP — Destinação em UC.</strong> {p.recomendacao}
        </AlertResult>

        {/* Disclaimer */}
        <AlertResult>
          <strong>Análise preliminar.</strong> Este relatório é uma pré-avaliação automatizada e não substitui parecer técnico ou jurídico. {p.confianca_ocr === "baixa" && <><br /><strong>ATENÇÃO:</strong> documento com baixa legibilidade — conferir dados numéricos.</>}
        </AlertResult>

        {/* CRITÉRIOS */}
        <div className="acam-card">
          <div className="acam-section-title">Critérios — {p.base_legal}</div>
          <div className="acam-section-desc">
            Verificação dos requisitos legais para compensação de APP por destinação em UC.
          </div>

          {p.criterios.map((c, i) => (
            <AlertResult
              key={i}
              status={c.atendido ? "success" : c.obrigatorio ? "error" : "warning"}
              statusLabel={c.atendido ? "Atendido" : c.obrigatorio ? "Não atendido" : "Preferencial"}
            >
              <strong>{c.nome}</strong>{!c.obrigatorio && " (preferencial)"}
              <div className="text-sm mt-1">{c.detalhe}</div>
            </AlertResult>
          ))}
        </div>

        {/* COMPARAÇÃO DE ÁREAS */}
        <div className="acam-card">
          <div className="acam-section-title">Comparação de Áreas</div>
          <div className="acam-section-desc">
            Áreas analisadas: intervenção em APP e proposta para doação em UC.
          </div>

          <div className="acam-fg acam-fg-2">
            {/* Área de Intervenção */}
            <AlertResult status="error" statusLabel="Intervenção">
              <strong>Área de Intervenção</strong>
              {p.area_intervencao.area_ha != null && (
                <div className="text-lg font-semibold mt-1">{formatNum(p.area_intervencao.area_ha)} ha</div>
              )}
              {p.area_intervencao.bacia && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {p.area_intervencao.bacia.bacia_federal && <div>Bacia federal: <strong>{p.area_intervencao.bacia.bacia_federal}</strong></div>}
                  {p.area_intervencao.bacia.sigla && <div>Sub-bacia: <strong>{p.area_intervencao.bacia.sigla}</strong> ({p.area_intervencao.bacia.nome})</div>}
                </div>
              )}
            </AlertResult>

            {/* Área Proposta */}
            <AlertResult status="success" statusLabel="Proposta">
              <strong>Área Proposta para Doação</strong>
              {p.area_proposta.area_ha != null && (
                <div className="text-lg font-semibold mt-1">{formatNum(p.area_proposta.area_ha)} ha</div>
              )}
              {p.area_proposta.bacia && (
                <div className="mt-2 text-xs text-muted-foreground">
                  {p.area_proposta.bacia.bacia_federal && <div>Bacia federal: <strong>{p.area_proposta.bacia.bacia_federal}</strong></div>}
                  {p.area_proposta.bacia.sigla && <div>Sub-bacia: <strong>{p.area_proposta.bacia.sigla}</strong> ({p.area_proposta.bacia.nome})</div>}
                </div>
              )}
              {p.area_proposta.em_uc_pi && p.area_proposta.uc && (
                <div className="mt-2">
                  <StatusBadge variant="success">UC Proteção Integral</StatusBadge>
                  <span className="text-xs text-muted-foreground ml-2">{p.area_proposta.uc.nome}</span>
                </div>
              )}
            </AlertResult>
          </div>
        </div>

        {/* MAPA */}
        {p.area_proposta.bbox && p.area_proposta.centroide && (
          <div className="acam-card">
            <div className="acam-section-title">Localização</div>
            <MapaImovel
              bbox={p.area_proposta.bbox}
              centroide={p.area_proposta.centroide}
              geojsonImovel={p.area_proposta.geojson || undefined}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Localização aproximada da área proposta para doação.
            </p>
          </div>
        )}

        {/* UCs encontradas */}
        {p.area_proposta.ucs_encontradas.length > 0 && (
          <div className="acam-card">
            <div className="acam-section-title">Unidades de Conservação na Área Proposta</div>
            {p.area_proposta.ucs_encontradas.map((uc, i) => (
              <div key={i} className="acam-card acam-card-compact">
                <div className="flex items-center justify-between mb-2">
                  <strong className="text-sm">{uc.nome}</strong>
                  <StatusBadge variant={uc.protecao_integral ? "success" : "warning"}>
                    {uc.protecao_integral ? "Proteção Integral" : "Uso Sustentável"}
                  </StatusBadge>
                </div>
                <p className="text-sm text-muted-foreground">{uc.categoria}</p>
                {uc.percentual_sobreposicao != null && (
                  <p className="text-sm mt-1">
                    <strong>{uc.percentual_sobreposicao}%</strong> de sobreposição
                    {uc.area_sobreposicao_ha != null && <> ({formatNum(uc.area_sobreposicao_ha)} ha)</>}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* VETOS (matrícula) */}
        {temVeto && (
          <div className="acam-card acam-card-border-error">
            <div className="acam-section-title acam-text-error">Impedimentos Registrais</div>
            {p.onus_gravames.filter((o) => o.nivel === 1).map((o, i) => (
              <AlertResult key={i} status="error" statusLabel="VETO">
                <strong>{o.tipo}.</strong> {o.impacto_compra_venda || o.descricao}
              </AlertResult>
            ))}
          </div>
        )}

        {/* DADOS DA MATRÍCULA (resumido) */}
        <div className="acam-card">
          <div className="acam-section-title">Dados do Imóvel Proposto (Matrícula)</div>
          <div className="acam-card acam-card-compact">
            <div className="acam-fg acam-fg-2">
              {p.imovel.matricula && <div className="acam-field"><label>Matrícula</label><span>{p.imovel.matricula}</span></div>}
              {p.imovel.cartorio && <div className="acam-field"><label>Cartório</label><span>{p.imovel.cartorio}</span></div>}
              {p.imovel.ccir && <div className="acam-field"><label>CCIR</label><span>{p.imovel.ccir}</span></div>}
              {p.imovel.nirf && <div className="acam-field"><label>NIRF/CIB</label><span>{p.imovel.nirf}</span></div>}
              {p.imovel.car && <div className="acam-field"><label>CAR</label><span>{p.imovel.car}</span></div>}
            </div>
          </div>

          {/* Proprietários */}
          {p.proprietarios.length > 0 && (
            <>
              <h4 className="acam-subsection-title">Proprietários</h4>
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

          {/* Ônus */}
          <h4 className="acam-subsection-title">Ônus e Gravames</h4>
          {p.onus_gravames.length === 0 ? (
            <AlertResult status="success" statusLabel="Adequado">
              <strong>Sem ônus.</strong> Nenhum ônus ou gravame identificado — situação registral favorável.
            </AlertResult>
          ) : (
            p.onus_gravames.map((onus, i) => (
              <AlertResult key={i} status={onus.nivel === 1 ? "error" : "warning"} statusLabel={onus.nivel === 1 ? "VETO" : "Pendências"}>
                <strong>{onus.tipo}</strong>
                {onus.numero_averbacao && <span className="text-xs text-muted-foreground"> ({onus.numero_averbacao})</span>}
                <div className="text-sm mt-1">{onus.impacto_compra_venda || onus.descricao}</div>
              </AlertResult>
            ))
          )}

          <p className="text-xs text-muted-foreground mt-4 italic">
            Dados extraídos por IA. PDFs escaneados podem ter precisão reduzida. Confira com o documento original.
          </p>
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
            <div className="acam-section-desc">Valor da Terra Nua por hectare (SIPT/Receita Federal).</div>
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

        {/* Disclaimer final */}
        <AlertResult status="warning" statusLabel="Importante">
          Esta é uma análise preliminar automatizada. Não constitui parecer jurídico ou técnico. Os dados extraídos por IA devem ser conferidos com os documentos originais. A viabilidade definitiva depende de análise por profissional qualificado e aprovação do órgão gestor da UC.
        </AlertResult>

        {/* Botões */}
        <div className="flex flex-wrap gap-3">
          <button className="acam-btn acam-btn-primary" onClick={async () => {
            const res = await fetch(`/api/consultas/${consultaId}`)
            const data = await res.json()
            if (data.consulta?.pdf_url) {
              window.open(data.consulta.pdf_url, "_blank")
            }
          }}>Baixar Relatório PDF</button>
          <Link href="/dashboard" className="acam-btn acam-btn-secondary">Voltar ao dashboard</Link>
        </div>

        <CTAConsultoria contexto="app" />
      </div>
    )
  }

  // ============================================
  // TELA DE UPLOAD (FORMULÁRIO)
  // ============================================

  return (
    <div>
      <div className="acam-container pb-0">
        <Link href="/dashboard" className="acam-back-link">
          ← Voltar ao dashboard
        </Link>
      </div>

      <div className="acam-service-header acam-service-header-primary">
        <div className="acam-service-header-content">
          <div className="acam-service-header-info">
            <div className="acam-service-header-icon">UC</div>
            <div className="acam-service-header-text">
              <h1>Destinação em UC — APP</h1>
              <p>Compensação APP — Intervenção em Área de Preservação Permanente</p>
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
          <div className="acam-section-title">Dados do Imóvel Proposto</div>
          <div className="acam-section-desc">Informações do imóvel que será doado para compensação.</div>
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
          <div className="acam-section-title">Documentação do Imóvel Proposto</div>
          <div className="acam-section-desc">Documentos do imóvel que será doado. Obrigatórios marcados com asterisco (*).</div>

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
          <div className="acam-section-title">Coordenadas Geográficas</div>
          <div className="acam-section-desc">
            Dois arquivos geoespaciais: a área onde ocorre a intervenção em APP e a área proposta para doação em UC. Ambos são obrigatórios.
          </div>

          <input ref={kmlIntervencaoRef} type="file" accept=".kml,.kmz,.geojson,.json" style={{ display: "none" }} onChange={(e) => setKmlIntervencaoFile(e.target.files?.[0] || null)} />
          <input ref={kmlPropostaRef} type="file" accept=".kml,.kmz,.geojson,.json" style={{ display: "none" }} onChange={(e) => setKmlPropostaFile(e.target.files?.[0] || null)} />

          <div className="acam-fg acam-fg-2">
            <div className="acam-upload-card" onClick={() => kmlIntervencaoRef.current?.click()}>
              <h2>Área de Intervenção em APP <span className="req">*</span></h2>
              <p>Área onde ocorre a supressão/intervenção</p>
              <div className={`acam-upload-zone ${kmlIntervencaoFile ? "acam-upload-zone-success" : ""}`}>
                <p>{kmlIntervencaoFile ? `✓ ${kmlIntervencaoFile.name}` : "Clique para selecionar"}</p>
              </div>
            </div>

            <div className="acam-upload-card" onClick={() => kmlPropostaRef.current?.click()}>
              <h2>Área Proposta para Doação <span className="req">*</span></h2>
              <p>Área em UC proposta para compensação</p>
              <div className={`acam-upload-zone ${kmlPropostaFile ? "acam-upload-zone-success" : ""}`}>
                <p>{kmlPropostaFile ? `✓ ${kmlPropostaFile.name}` : "Clique para selecionar"}</p>
              </div>
            </div>
          </div>
        </div>

        {erro && <div className="acam-alert acam-alert-error">{erro}</div>}

        {loading && <EtapasProgresso />}

        {!loading && <AlertResult>
          <strong>O que será analisado:</strong> A matrícula será processada por IA para extrair proprietários e dados registrais.
          Ambos os arquivos geoespaciais serão cruzados com o IDE-Sisema para identificar as bacias hidrográficas e verificar se a área proposta está em UC de Proteção Integral.
          O sistema comparará se ambas as áreas estão na mesma bacia de rio federal, conforme exigido pelo Decreto 47.749/2019.
        </AlertResult>}

        <button className="acam-btn acam-btn-primary w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? "Processando análise..." : `Analisar (${custoCreditos} créditos)`}
        </button>
      </div>
    </div>
  )
}

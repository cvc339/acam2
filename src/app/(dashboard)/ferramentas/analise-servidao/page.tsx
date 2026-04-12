"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { StatusBadge, AlertResult, DocumentoItem } from "@/components/acam"
import { MapaImovel } from "@/components/acam/mapa-imovel"
import { ComboboxMunicipio } from "@/components/acam/combobox-municipio"
import { ProgressBar } from "@/components/acam/progress-bar"
import { MapaCobertura } from "@/components/acam/mapa-cobertura"
import { formatBRL, formatNum } from "@/lib/format"

const CUSTO_CREDITOS = 7

// ============================================
// TIPOS (espelha API /api/consultas/dest-servidao)
// ============================================

interface Bacia { sigla: string | null; nome: string | null; bacia_federal: string | null; comite?: string | null }
interface ClasseCobertura { codigo: number; classe: string; tipo: string; percentual: number; areaEstimadaHa: number }
interface MapaClassificacao { width: number; height: number; bbox: number[]; dados: number[] }
interface CoberturaDetalhada { sucesso: boolean; classes?: ClasseCobertura[]; totaisPorTipo?: { natural: { percentual: number; areaHa: number }; antropico: { percentual: number; areaHa: number } }; mapaClassificacao?: MapaClassificacao }
interface Criterio { id: number; nome: string; obrigatorio: boolean; atendido: boolean; parcial?: boolean; detalhe: string; percentualAtendimento?: number }
interface Compensacao { areaSuprimida: number; areaNecessaria: number; areaVegetacaoNaturalProposta: number; percentualNaturalProposta: number; percentualAtendimento: number; areaFaltante: number }
interface UC { nome: string; categoria: string; protecao_integral: boolean; percentual_sobreposicao: number | null }
interface Proprietario { nome: string; percentual: number | null; estado_civil: string | null; conjuge: string | null }
interface OnusGravame { tipo: string; nivel: number; nivel_descricao: string; numero_averbacao: string; descricao: string; impacto_compra_venda: string }
interface DimensaoMVAR { pontos: number; peso: number; percentual: number }

interface Parecer {
  tipo: string
  base_legal: string
  area_supressao: { area_ha: number; bacia: Bacia | null; mata_atlantica: boolean | null; cobertura: CoberturaDetalhada | null; bbox: { minLon: number; maxLon: number; minLat: number; maxLat: number } | null; centroide: { lon: number; lat: number } | null }
  area_proposta: { area_ha: number; bacia: Bacia | null; mata_atlantica: boolean | null; cobertura: CoberturaDetalhada | null; em_uc_pi: boolean; uc: UC | null; ucs_encontradas: UC[]; bbox: { minLon: number; maxLon: number; minLat: number; maxLat: number } | null; centroide: { lon: number; lat: number } | null; geojson: GeoJSON.FeatureCollection | null }
  criterios: Criterio[]
  compensacao: Compensacao
  viabilidade: "ALTA" | "MÉDIA" | "BAIXA"
  recomendacao: string
  alertas: string[]
  ganho_ambiental: { temGanho: boolean; indicadores: string[]; fundamentacao: string } | null
  dinamica_vegetal: { periodoAnalisado: string; tendencia: string; interpretacao: string; transicoes: { coberturaEstavel: { ha: number; percentual: number }; perdaCobertura: { ha: number; percentual: number }; ganhoCobertura: { ha: number; percentual: number }; usoAntropicoEstavel: { ha: number; percentual: number } }; ressalva: string } | null
  sentinel2: { disponivel: boolean; cena?: { data: string; coberturaNuvens: number }; classificacao?: { status: string; ndviMedio: number; analiseSegmentada?: { avaliacao: string; interpretacao: string; fundamentacao: string }; cruzamentoMapBiomas?: { confianca: string } }; coberturaUtil?: { percentual: number; status: string } } | null
  mvar: { pontuacao?: { total: number; maximo: number }; classificacao?: { label: string }; resumo?: string; dimensoes?: Record<string, DimensaoMVAR> } | null
  imovel: { nome: string; municipio: string; matricula: string | null; cartorio: string | null; ccir: string | null; nirf: string | null; car: string | null; georreferenciamento: boolean | null }
  proprietarios: Proprietario[]
  onus_gravames: OnusGravame[]
  confianca_ocr: string
  vtn: { encontrado: boolean; municipio?: string; valor_referencia?: number; valor_estimado?: number } | null
}

// ============================================
// ETAPAS DO PROCESSAMENTO
// ============================================

const ETAPAS_ANALISE = [
  { label: "Enviando documentos", descricao: "Upload dos arquivos para processamento seguro", duracao: 3 },
  { label: "Processando geometrias", descricao: "Extraindo polígonos das duas áreas geoespaciais", duracao: 4 },
  { label: "Verificando bioma Mata Atlântica", descricao: "Consultando camada de Mata Atlântica no IDE-Sisema", duracao: 4 },
  { label: "Consultando bacias hidrográficas", descricao: "Identificando bacia federal e sub-bacia de cada área", duracao: 5 },
  { label: "Analisando cobertura vegetal", descricao: "Grade de pontos MapBiomas — vegetação nativa vs antrópico", duracao: 20 },
  { label: "Verificando dinâmica temporal", descricao: "Comparação de cobertura entre períodos (MapBiomas)", duracao: 15 },
  { label: "Consultando Sentinel-2", descricao: "Análise NDVI por satélite (10m de resolução)", duracao: 10 },
  { label: "Extraindo dados da matrícula", descricao: "Leitura do cabeçalho: proprietários, ônus, georreferenciamento", duracao: 12 },
  { label: "Avaliando critérios", descricao: "Comparando áreas e verificando requisitos do Decreto 47.749/2019", duracao: 3 },
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
      timers.push(setTimeout(() => { setEtapaAtual(i); setFadeIn(true) }, tempoAcumulado))
    }
    return () => timers.forEach(clearTimeout)
  }, [])

  const etapa = ETAPAS_ANALISE[etapaAtual]
  const progresso = ((etapaAtual + 1) / ETAPAS_ANALISE.length) * 100

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
        <p className="text-xs text-muted-foreground mt-2">Etapa {etapaAtual + 1} de {ETAPAS_ANALISE.length}</p>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function AnaliseServidaoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [resultado, setResultado] = useState<{ consultaId: string; parecer: Parecer } | null>(null)

  const [nomeImovel, setNomeImovel] = useState("")
  const [municipio, setMunicipio] = useState("")
  const [matriculaFile, setMatriculaFile] = useState<File | null>(null)
  const [cndFile, setCndFile] = useState<File | null>(null)
  const [kmlSupressaoFile, setKmlSupressaoFile] = useState<File | null>(null)
  const [kmlPropostaFile, setKmlPropostaFile] = useState<File | null>(null)

  const matriculaRef = useRef<HTMLInputElement>(null)
  const cndRef = useRef<HTMLInputElement>(null)
  const kmlSupressaoRef = useRef<HTMLInputElement>(null)
  const kmlPropostaRef = useRef<HTMLInputElement>(null)

  async function handleSubmit() {
    setErro("")
    if (!matriculaFile) return setErro("Envie a matrícula do imóvel proposto (PDF).")
    if (!kmlSupressaoFile) return setErro("Envie o arquivo geoespacial da área de supressão.")
    if (!kmlPropostaFile) return setErro("Envie o arquivo geoespacial da área proposta.")

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("nome_imovel", nomeImovel)
      formData.append("municipio", municipio)
      formData.append("matricula", matriculaFile)
      if (cndFile) formData.append("cnd", cndFile)
      formData.append("kml_supressao", kmlSupressaoFile)
      formData.append("kml_proposta", kmlPropostaFile)

      const res = await fetch("/api/consultas/dest-servidao", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok) { setErro(data.erro || "Erro ao processar consulta."); setLoading(false); return }

      setResultado({ consultaId: data.consulta_id, parecer: data.parecer })
      router.refresh()
    } catch { setErro("Erro de conexão. Tente novamente.") }
    setLoading(false)
  }

  // ============================================
  // TELA DE RESULTADO
  // ============================================

  if (resultado) {
    const { parecer, consultaId } = resultado
    const p = parecer
    const nomesMVAR: Record<string, string> = { juridica: "Jurídica", fiscal: "Fiscal", titularidade: "Titularidade", tecnica: "Técnica" }

    return (
      <div className="acam-container">
        <Link href="/dashboard" className="acam-back-link">← Voltar ao dashboard</Link>

        {/* VIABILIDADE */}
        <AlertResult
          status={p.viabilidade === "ALTA" ? "success" : p.viabilidade === "BAIXA" ? "error" : "warning"}
          statusLabel={`Viabilidade ${p.viabilidade}`}
        >
          <strong>Mata Atlântica — Servidão Ambiental / RPPN.</strong> {p.recomendacao}
        </AlertResult>

        {/* Disclaimer */}
        <AlertResult>
          <strong>Análise preliminar.</strong> Este relatório é uma pré-avaliação automatizada e não substitui vistoria de campo, inventário florístico ou parecer técnico. {p.confianca_ocr === "baixa" && <><br /><strong>ATENÇÃO:</strong> documento com baixa legibilidade.</>}
        </AlertResult>

        {/* CRITÉRIOS */}
        <div className="acam-card">
          <div className="acam-section-title">Critérios — {p.base_legal}</div>
          <div className="acam-section-desc">Verificação dos requisitos legais para compensação de Mata Atlântica por destinação em UC.</div>

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

        {/* GANHO AMBIENTAL (§1º) */}
        {p.ganho_ambiental && (
          <div className="acam-card">
            <div className="acam-section-title">Ganho Ambiental (§1º do Art. 50)</div>
            <div className="acam-section-desc">Quando for inviável o atendimento de todas as características de similaridade ecológica, pode ser considerado o ganho ambiental no estabelecimento da área como protegida.</div>

            {p.criterios.filter((c: Criterio) => c.id >= 5).map((c: Criterio, i: number) => (
              <AlertResult
                key={i}
                status={c.atendido ? "success" : undefined}
                statusLabel={c.atendido ? "Identificado" : "Não identificado"}
              >
                <strong>{c.nome}</strong>
                <div className="text-sm mt-1">{c.detalhe}</div>
              </AlertResult>
            ))}

            {p.ganho_ambiental.temGanho ? (
              <AlertResult status="success" statusLabel="Ganho ambiental">
                {p.ganho_ambiental.fundamentacao}
              </AlertResult>
            ) : (
              <AlertResult>
                {p.ganho_ambiental.fundamentacao}
              </AlertResult>
            )}
          </div>
        )}

        {/* CÁLCULO 2:1 */}
        <div className="acam-card">
          <div className="acam-section-title">Cálculo da Compensação (2:1)</div>
          <div className="acam-fg acam-fg-3">
            <div className="acam-field"><label>Área Suprimida</label><span className="text-lg font-semibold">{formatNum(p.compensacao.areaSuprimida)} ha</span></div>
            <div className="acam-field"><label>Necessário (2×)</label><span className="text-lg font-semibold">{formatNum(p.compensacao.areaNecessaria)} ha</span></div>
            <div className="acam-field"><label>Disponível</label><span className="text-lg font-semibold">{formatNum(p.compensacao.areaVegetacaoNaturalProposta)} ha</span></div>
          </div>
          <ProgressBar label="Atendimento" value={`${formatNum(p.compensacao.percentualAtendimento, 1)}%`} percent={Math.min(p.compensacao.percentualAtendimento, 100)} />
        </div>

        {/* COMPARAÇÃO DE ÁREAS */}
        <div className="acam-card">
          <div className="acam-section-title">Comparação de Áreas</div>
          <div className="acam-fg acam-fg-2">
            <AlertResult status="error" statusLabel="Supressão">
              <strong>Área de Supressão</strong>
              <div className="text-lg font-semibold mt-1">{formatNum(p.area_supressao.area_ha)} ha</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {p.area_supressao.bacia?.bacia_federal && <div>Bacia: <strong>{p.area_supressao.bacia.bacia_federal}</strong></div>}
                {p.area_supressao.bacia?.sigla && <div>Sub-bacia: <strong>{p.area_supressao.bacia.sigla}</strong></div>}
                <div>Mata Atlântica: <strong>{p.area_supressao.mata_atlantica ? "Sim" : "Não"}</strong></div>
              </div>
            </AlertResult>
            <AlertResult status="success" statusLabel="Proposta">
              <strong>Área Proposta para Doação</strong>
              <div className="text-lg font-semibold mt-1">{formatNum(p.area_proposta.area_ha)} ha</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {p.area_proposta.bacia?.bacia_federal && <div>Bacia: <strong>{p.area_proposta.bacia.bacia_federal}</strong></div>}
                {p.area_proposta.bacia?.sigla && <div>Sub-bacia: <strong>{p.area_proposta.bacia.sigla}</strong></div>}
                <div>Mata Atlântica: <strong>{p.area_proposta.mata_atlantica ? "Sim" : "Não"}</strong></div>
              </div>
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
            <MapaImovel bbox={p.area_proposta.bbox} centroide={p.area_proposta.centroide} geojsonImovel={p.area_proposta.geojson || undefined} />
            <p className="text-xs text-muted-foreground mt-2">Localização aproximada da área proposta.</p>
          </div>
        )}

        {/* COBERTURA VEGETAL */}
        {p.area_proposta.cobertura?.sucesso && (
          <div className="acam-card">
            <div className="acam-section-title">Cobertura Vegetal (MapBiomas)</div>

            {/* Mapa visual (se WCS disponível) */}
            {p.area_proposta.cobertura.mapaClassificacao && p.area_proposta.cobertura.classes && (
              <div className="mb-4">
                <MapaCobertura
                  mapa={p.area_proposta.cobertura.mapaClassificacao}
                  classes={p.area_proposta.cobertura.classes}
                />
              </div>
            )}

            <div className="acam-fg acam-fg-2">
              <div>
                <h4 className="acam-subsection-title">Área de Supressão</h4>
                <div className="acam-field"><label>Vegetação Nativa</label><span>{p.area_supressao.cobertura?.totaisPorTipo?.natural?.percentual ?? 0}% ({formatNum(p.area_supressao.cobertura?.totaisPorTipo?.natural?.areaHa ?? 0)} ha)</span></div>
                <div className="acam-field"><label>Uso Antrópico</label><span>{p.area_supressao.cobertura?.totaisPorTipo?.antropico?.percentual ?? 0}% ({formatNum(p.area_supressao.cobertura?.totaisPorTipo?.antropico?.areaHa ?? 0)} ha)</span></div>
                {p.area_supressao.cobertura?.classes?.filter((c) => c.percentual >= 2).map((c, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{c.tipo === "natural" ? "•" : "—"} {c.classe}: {formatNum(c.percentual, 1)}% ({formatNum(c.areaEstimadaHa)} ha)</p>
                ))}
              </div>
              <div>
                <h4 className="acam-subsection-title">Área Proposta</h4>
                <div className="acam-field"><label>Vegetação Nativa</label><span>{p.area_proposta.cobertura?.totaisPorTipo?.natural?.percentual ?? 0}% ({formatNum(p.area_proposta.cobertura?.totaisPorTipo?.natural?.areaHa ?? 0)} ha)</span></div>
                <div className="acam-field"><label>Uso Antrópico</label><span>{p.area_proposta.cobertura?.totaisPorTipo?.antropico?.percentual ?? 0}% ({formatNum(p.area_proposta.cobertura?.totaisPorTipo?.antropico?.areaHa ?? 0)} ha)</span></div>
                {p.area_proposta.cobertura?.classes?.filter((c) => c.percentual >= 2).map((c, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{c.tipo === "natural" ? "•" : "—"} {c.classe}: {formatNum(c.percentual, 1)}% ({formatNum(c.areaEstimadaHa)} ha)</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DINÂMICA VEGETAL */}
        {p.dinamica_vegetal && (
          <div className="acam-card">
            <div className="acam-section-title">Dinâmica de Cobertura Vegetal</div>
            <div className="acam-section-desc">Período: {p.dinamica_vegetal.periodoAnalisado} | Tendência: <strong>{p.dinamica_vegetal.tendencia}</strong></div>
            <p className="text-sm mt-2">{p.dinamica_vegetal.interpretacao}</p>
            <div className="acam-fg acam-fg-2 mt-4">
              <div className="acam-field"><label>Nativa estável</label><span>{formatNum(p.dinamica_vegetal.transicoes.coberturaEstavel.percentual, 1)}% ({formatNum(p.dinamica_vegetal.transicoes.coberturaEstavel.ha)} ha)</span></div>
              <div className="acam-field"><label>Ganho</label><span>{formatNum(p.dinamica_vegetal.transicoes.ganhoCobertura.percentual, 1)}% ({formatNum(p.dinamica_vegetal.transicoes.ganhoCobertura.ha)} ha)</span></div>
              <div className="acam-field"><label>Perda</label><span>{formatNum(p.dinamica_vegetal.transicoes.perdaCobertura.percentual, 1)}% ({formatNum(p.dinamica_vegetal.transicoes.perdaCobertura.ha)} ha)</span></div>
              <div className="acam-field"><label>Antrópico estável</label><span>{formatNum(p.dinamica_vegetal.transicoes.usoAntropicoEstavel.percentual, 1)}% ({formatNum(p.dinamica_vegetal.transicoes.usoAntropicoEstavel.ha)} ha)</span></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">{p.dinamica_vegetal.ressalva}</p>
          </div>
        )}

        {/* SENTINEL-2 */}
        {p.sentinel2?.disponivel && (
          <div className="acam-card">
            <div className="acam-section-title">Verificação por Satélite — Sentinel-2</div>
            <div className="acam-fg acam-fg-2">
              <div className="acam-field"><label>Data</label><span>{p.sentinel2.cena?.data?.substring(0, 10)}</span></div>
              <div className="acam-field"><label>NDVI médio</label><span>{p.sentinel2.classificacao?.ndviMedio?.toFixed(3)}</span></div>
              <div className="acam-field"><label>Avaliação</label><span>{p.sentinel2.classificacao?.analiseSegmentada?.avaliacao || p.sentinel2.classificacao?.status}</span></div>
              <div className="acam-field"><label>Confiança</label><span>{p.sentinel2.classificacao?.cruzamentoMapBiomas?.confianca}</span></div>
            </div>
            {p.sentinel2.classificacao?.analiseSegmentada?.interpretacao && (
              <p className="text-sm mt-2">{p.sentinel2.classificacao.analiseSegmentada.interpretacao}</p>
            )}
          </div>
        )}

        {/* MVAR */}
        {p.mvar && (
          <div className="acam-card">
            <div className="acam-section-title">Análise Documental (MVAR)</div>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-2xl font-bold">{p.mvar.pontuacao?.total ?? 0}<span className="text-sm font-normal text-muted-foreground">/{p.mvar.pontuacao?.maximo ?? 100}</span></div>
              <div><strong>{p.mvar.classificacao?.label}</strong></div>
            </div>
            {p.mvar.resumo && <p className="text-sm mb-4">{p.mvar.resumo}</p>}
            {p.mvar.dimensoes && Object.entries(p.mvar.dimensoes).map(([key, dim]) => (
              <ProgressBar key={key} label={`${nomesMVAR[key] || key} (${dim.peso} pts)`} value={`${dim.pontos}/${dim.peso}`} percent={dim.percentual} />
            ))}
          </div>
        )}

        {/* DADOS MATRÍCULA */}
        <div className="acam-card">
          <div className="acam-section-title">Dados do Imóvel Proposto</div>
          <div className="acam-card acam-card-compact">
            <div className="acam-fg acam-fg-2">
              {p.imovel.matricula && <div className="acam-field"><label>Matrícula</label><span>{p.imovel.matricula}</span></div>}
              {p.imovel.cartorio && <div className="acam-field"><label>Cartório</label><span>{p.imovel.cartorio}</span></div>}
              {p.imovel.ccir && <div className="acam-field"><label>CCIR</label><span>{p.imovel.ccir}</span></div>}
              {p.imovel.nirf && <div className="acam-field"><label>NIRF/CIB</label><span>{p.imovel.nirf}</span></div>}
              {p.imovel.car && <div className="acam-field"><label>CAR</label><span>{p.imovel.car}</span></div>}
            </div>
          </div>

          {p.proprietarios.length > 0 && (
            <>
              <h4 className="acam-subsection-title">Proprietários</h4>
              {p.proprietarios.map((prop, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b text-sm">
                  <div>
                    <strong>{prop.nome}</strong>
                    {prop.estado_civil && <span className="text-muted-foreground"> — {prop.estado_civil}</span>}
                  </div>
                  <span className="font-semibold">{prop.percentual ?? "?"}%</span>
                </div>
              ))}
            </>
          )}

          <h4 className="acam-subsection-title">Ônus e Gravames</h4>
          {p.onus_gravames.length === 0 ? (
            <AlertResult status="success" statusLabel="Adequado">
              <strong>Sem ônus.</strong> Nenhum ônus ou gravame identificado — situação registral favorável.
            </AlertResult>
          ) : (
            p.onus_gravames.map((onus, i) => (
              <AlertResult key={i} status={onus.nivel === 1 ? "error" : "warning"} statusLabel={onus.nivel === 1 ? "VETO" : "Pendências"}>
                <strong>{onus.tipo}</strong> {onus.numero_averbacao && <span className="text-xs text-muted-foreground">({onus.numero_averbacao})</span>}
                <div className="text-sm mt-1">{onus.impacto_compra_venda || onus.descricao}</div>
              </AlertResult>
            ))
          )}
        </div>

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

        {/* NOTA SOBRE ESTA ANÁLISE */}
        <div className="acam-card">
          <div className="acam-section-title">Nota sobre esta análise</div>
          <p className="text-sm mb-3">
            Este relatório constitui análise preliminar automatizada e não substitui vistoria de campo, inventário florístico ou parecer técnico especializado.
          </p>
          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>Similaridade ecológica (Art. 50):</strong> A avaliação de similaridade ecológica é baseada em dados secundários (MapBiomas, IDE-Sisema) e não substitui inventário florístico conforme Resolução CONAMA 388/2007. A classificação de estágios sucessionais (inicial, médio, avançado) e a avaliação de riqueza de espécies e endemismo requerem levantamento de campo por profissional habilitado.</p>
            <p><strong>Ganho ambiental (§1º do Art. 50):</strong> A análise de ganho ambiental é baseada em camadas geoespaciais oficiais (IDE-Sisema) de áreas prioritárias para conservação e corredores ecológicos. A confirmação do potencial de conectividade e formação de corredores requer análise de paisagem em escala local.</p>
            <p><strong>Fitofisionomia:</strong> A comparação fitofisionômica utiliza classificação MapBiomas Coleção 9 (Nível 3) complementada por camadas de relevância fitofisionômica do IDE-Sisema (SEMAD/IEF). O MapBiomas não distingue entre subtipos (ex: Floresta Ombrófila Densa vs. Estacional Semidecidual dentro de &quot;Formação Florestal&quot;). Para detalhamento, consultar Mapa de Vegetação IBGE ou mapeamento Promata II.</p>
            <p><strong>Critérios do Decreto 47.749/2019:</strong> A verificação de bioma, bacia hidrográfica e sub-bacia foi realizada por consulta geoespacial às bases do IDE-Sisema (SEMAD/IEF/IGAM). Inconsistências nas bases oficiais podem afetar o resultado.</p>
            <p><strong>Análise documental (MVAR):</strong> A análise de ônus, gravames, situação fiscal e titularidade é baseada em dados declarados e não substitui diligência jurídica completa ou parecer elaborado por advogado com responsabilidade técnica.</p>
            <p><strong>Cobertura vegetal:</strong> Classificação baseada em MapBiomas Coleção 9 (2023), via IDE-Sisema. A classificação de estágios sucessionais (inicial, médio, avançado) requer inventário florístico conforme Resolução CONAMA 388/2007.</p>
            <p><strong>Dinâmica temporal:</strong> Comparação MapBiomas 2018–2023. Mudanças na cobertura vegetal podem decorrer de múltiplas causas (atividade antrópica, incêndios, queimas prescritas, eventos climáticos). A identificação da causa requer investigação de campo.</p>
            {p.sentinel2?.disponivel && (
              <p><strong>Verificação por satélite:</strong> Análise NDVI baseada em Sentinel-2 L2A (10m), Copernicus Data Space Ecosystem. Os limiares de NDVI por formação vegetal são baseados na literatura de sensoriamento remoto para o bioma Mata Atlântica e estão sujeitos a calibração com dados de campo.</p>
            )}
            <p><strong>Sobreposição com UC:</strong> Calculada por interseção geométrica entre o polígono da área proposta e os limites da Unidade de Conservação (IDE-Sisema). Imprecisões nos limites oficiais podem afetar o percentual calculado.</p>
            <p><strong>Fontes de dados:</strong> MapBiomas Coleção 9 (2023) via IDE-Sisema/GeoServer — Sentinel-2 L2A, Copernicus Data Space Ecosystem — IDE-Sisema (SEMAD/IEF/IGAM) — ICMBio (INDE) — Dados declarados pelo solicitante.</p>
            <p className="mt-3"><strong>ACAM — Análise de Compensação Ambiental</strong><br />Vieira Castro Advogados — acam.com.br</p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex flex-wrap gap-3">
          <button className="acam-btn acam-btn-primary" onClick={async () => {
            try {
              const res = await fetch(`/api/consultas/${consultaId}`)
              const data = await res.json()
              if (data.consulta?.pdf_url) {
                window.open(data.consulta.pdf_url, "_blank")
              } else {
                alert("PDF ainda não disponível. O relatório pode estar sendo gerado.")
              }
            } catch {
              alert("Erro ao buscar o PDF. Tente novamente.")
            }
          }}>Baixar Relatório PDF</button>
          <Link href="/dashboard" className="acam-btn acam-btn-secondary">Voltar ao dashboard</Link>
        </div>
      </div>
    )
  }

  // ============================================
  // TELA DE UPLOAD (FORMULÁRIO)
  // ============================================

  return (
    <div>
      <div className="acam-container pb-0">
        <Link href="/dashboard" className="acam-back-link">← Voltar ao dashboard</Link>
      </div>

      <div className="acam-service-header acam-service-header-primary">
        <div className="acam-service-header-content">
          <div className="acam-service-header-info">
            <div className="acam-service-header-icon">UC</div>
            <div className="acam-service-header-text">
              <h1>Análise de Servidão/RPPN — Mata Atlântica</h1>
              <p>Compensação Mata Atlântica — Servidão Ambiental ou RPPN</p>
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
          <div className="acam-section-title">Dados do Imóvel Proposto</div>
          <div className="acam-section-desc">Informações do imóvel que será doado para compensação.</div>
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
          <div className="acam-section-title">Documentação do Imóvel Proposto</div>
          <div className="acam-section-desc">Documentos do imóvel que será doado. Obrigatórios marcados com asterisco (*).</div>

          <input ref={matriculaRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => setMatriculaFile(e.target.files?.[0] || null)} />
          <input ref={cndRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => setCndFile(e.target.files?.[0] || null)} />

          <DocumentoItem nome="Matrícula do Imóvel" obrigatorio arquivo={matriculaFile?.name} onSelect={() => matriculaRef.current?.click()} onClear={() => { setMatriculaFile(null); if (matriculaRef.current) matriculaRef.current.value = "" }} />
          <DocumentoItem nome="CND-ITR" arquivo={cndFile?.name} onSelect={() => cndRef.current?.click()} onClear={() => { setCndFile(null); if (cndRef.current) cndRef.current.value = "" }} />

          <AlertResult>Para melhores resultados, utilize documentos em PDF com <strong>texto selecionável</strong>.</AlertResult>
        </div>

        <div className="acam-card">
          <div className="acam-section-title">Coordenadas Geográficas</div>
          <div className="acam-section-desc">Dois arquivos geoespaciais: a área de supressão e a área proposta para doação. Ambos são obrigatórios.</div>

          <input ref={kmlSupressaoRef} type="file" accept=".kml,.kmz,.geojson,.json" style={{ display: "none" }} onChange={(e) => setKmlSupressaoFile(e.target.files?.[0] || null)} />
          <input ref={kmlPropostaRef} type="file" accept=".kml,.kmz,.geojson,.json" style={{ display: "none" }} onChange={(e) => setKmlPropostaFile(e.target.files?.[0] || null)} />

          <div className="acam-fg acam-fg-2">
            <div className="acam-upload-card" onClick={() => kmlSupressaoRef.current?.click()}>
              <h2>Área de Supressão <span className="req">*</span></h2>
              <p>Área onde ocorre a supressão de vegetação</p>
              <div className={`acam-upload-zone ${kmlSupressaoFile ? "acam-upload-zone-success" : ""}`}>
                <p>{kmlSupressaoFile ? `✓ ${kmlSupressaoFile.name}` : "Clique para selecionar"}</p>
              </div>
            </div>
            <div className="acam-upload-card" onClick={() => kmlPropostaRef.current?.click()}>
              <h2>Imóvel Proposto <span className="req">*</span></h2>
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
          <strong>O que será analisado:</strong> Ambas as áreas serão verificadas quanto ao bioma Mata Atlântica, bacia hidrográfica, similaridade fitofisionômica e cobertura vegetal (MapBiomas + Sentinel-2 NDVI). Serão consultadas camadas de áreas prioritárias para conservação, corredores ecológicos e prioridade por biodiversidade (IDE-Sisema) para avaliação de ganho ambiental (§1º do Art. 50). A matrícula será processada por IA.
        </AlertResult>}

        <button className="acam-btn acam-btn-primary w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? "Processando análise..." : `Analisar (${CUSTO_CREDITOS} créditos)`}
        </button>
      </div>
    </div>
  )
}

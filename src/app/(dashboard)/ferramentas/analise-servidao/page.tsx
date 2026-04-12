"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertResult } from "@/components/acam"
import { MapaImovel } from "@/components/acam/mapa-imovel"
import { ComboboxMunicipio } from "@/components/acam/combobox-municipio"
import { ProgressBar } from "@/components/acam/progress-bar"
import { MapaCobertura } from "@/components/acam/mapa-cobertura"
import { formatNum } from "@/lib/format"

const CUSTO_CREDITOS = 6

// Tipos

interface Bacia { sigla: string | null; nome: string | null; bacia_federal: string | null }
interface MapaClassificacao { width: number; height: number; bbox: number[]; dados: number[] }
interface ClasseCobertura { codigo: number; classe: string; tipo: string; percentual: number; areaEstimadaHa: number }
interface CoberturaDetalhada { sucesso: boolean; classes?: ClasseCobertura[]; totaisPorTipo?: { natural: { percentual: number; areaHa: number }; antropico: { percentual: number; areaHa: number } }; mapaClassificacao?: MapaClassificacao }
interface Criterio { id: number; nome: string; obrigatorio: boolean; ganhoAmbiental?: boolean; atendido: boolean; parcial?: boolean; detalhe: string }
interface Compensacao { areaSuprimida: number; areaNecessaria: number; areaVegetacaoNaturalProposta: number; percentualNaturalProposta: number; percentualAtendimento: number; areaFaltante: number }
interface UC { nome: string; categoria: string; protecao_integral: boolean; percentual_sobreposicao: number | null }

interface Parecer {
  tipo: string
  base_legal: string
  area_supressao: { area_ha: number; bacia: Bacia | null; mata_atlantica: boolean | null; cobertura: CoberturaDetalhada | null; bbox: { minLon: number; maxLon: number; minLat: number; maxLat: number } | null; centroide: { lon: number; lat: number } | null }
  area_proposta: { area_ha: number; bacia: Bacia | null; mata_atlantica: boolean | null; cobertura: CoberturaDetalhada | null; ucs_encontradas: UC[]; bbox: { minLon: number; maxLon: number; minLat: number; maxLat: number } | null; centroide: { lon: number; lat: number } | null; geojson: GeoJSON.FeatureCollection | null }
  criterios: Criterio[]
  compensacao: Compensacao
  ganho_ambiental: { temGanho: boolean; indicadores: string[]; fundamentacao: string }
  viabilidade: "ALTA" | "MÉDIA" | "BAIXA"
  recomendacao: string
  alertas: string[]
  dinamica_vegetal: { periodoAnalisado: string; tendencia: string; interpretacao: string; transicoes: { coberturaEstavel: { ha: number; percentual: number }; perdaCobertura: { ha: number; percentual: number }; ganhoCobertura: { ha: number; percentual: number }; usoAntropicoEstavel: { ha: number; percentual: number } }; ressalva: string } | null
  sentinel2: { disponivel: boolean; cena?: { data: string; coberturaNuvens: number }; classificacao?: { status: string; ndviMedio: number; analiseSegmentada?: { avaliacao: string; interpretacao: string }; cruzamentoMapBiomas?: { confianca: string } } } | null
}

// Etapas

const ETAPAS = [
  { label: "Enviando arquivos", descricao: "Upload dos dados geoespaciais", duracao: 3 },
  { label: "Processando geometrias", descricao: "Extraindo polígonos das duas áreas", duracao: 4 },
  { label: "Verificando bioma e bacia", descricao: "Consultando IDE-Sisema para bioma MA e bacia hidrográfica", duracao: 6 },
  { label: "Analisando cobertura vegetal", descricao: "Grade MapBiomas — vegetação nativa vs antrópico", duracao: 20 },
  { label: "Consultando similaridade ecológica", descricao: "Fitofisionomia, áreas prioritárias, corredores, biodiversidade", duracao: 8 },
  { label: "Verificando dinâmica temporal", descricao: "Comparação de cobertura 2018-2023", duracao: 15 },
  { label: "Consultando Sentinel-2", descricao: "Análise NDVI por satélite (10m)", duracao: 10 },
  { label: "Avaliando critérios Art. 50", descricao: "Similaridade ecológica + ganho ambiental (§1º)", duracao: 3 },
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

export default function AnaliseServidaoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [resultado, setResultado] = useState<{ consultaId: string; parecer: Parecer } | null>(null)

  const [nomeImovel, setNomeImovel] = useState("")
  const [municipio, setMunicipio] = useState("")
  const [kmlSupressaoFile, setKmlSupressaoFile] = useState<File | null>(null)
  const [kmlPropostaFile, setKmlPropostaFile] = useState<File | null>(null)

  const kmlSupressaoRef = useRef<HTMLInputElement>(null)
  const kmlPropostaRef = useRef<HTMLInputElement>(null)

  async function handleSubmit() {
    setErro("")
    if (!kmlSupressaoFile) return setErro("Envie o arquivo geoespacial da área de supressão.")
    if (!kmlPropostaFile) return setErro("Envie o arquivo geoespacial da área proposta.")

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("nome_imovel", nomeImovel)
      formData.append("municipio", municipio)
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

  // RESULTADO

  if (resultado) {
    const { parecer, consultaId } = resultado
    const p = parecer

    return (
      <div className="acam-container">
        <Link href="/dashboard" className="acam-back-link">← Voltar ao dashboard</Link>

        <AlertResult status={p.viabilidade === "ALTA" ? "success" : p.viabilidade === "BAIXA" ? "error" : "warning"} statusLabel={`Viabilidade ${p.viabilidade}`}>
          <strong>Mata Atlântica — Servidão Ambiental / RPPN.</strong> {p.recomendacao}
        </AlertResult>

        <AlertResult>
          <strong>Análise preliminar.</strong> Este relatório é uma pré-avaliação baseada em dados secundários (sensoriamento remoto e camadas oficiais). Não substitui vistoria de campo, inventário florístico ou parecer técnico.
        </AlertResult>

        {/* CRITÉRIOS OBRIGATÓRIOS */}
        <div className="acam-card">
          <div className="acam-section-title">Critérios — {p.base_legal}</div>
          <div className="acam-section-desc">Requisitos legais para compensação via servidão ambiental ou RPPN.</div>
          {p.criterios.filter((c) => c.obrigatorio).map((c, i) => (
            <AlertResult key={i} status={c.atendido ? "success" : "error"} statusLabel={c.atendido ? "Atendido" : "Não atendido"}>
              <strong>{c.nome}</strong>
              <div className="text-sm mt-1">{c.detalhe}</div>
            </AlertResult>
          ))}
        </div>

        {/* GANHO AMBIENTAL */}
        <div className="acam-card">
          <div className="acam-section-title">Ganho Ambiental (§1º do Art. 50)</div>
          <div className="acam-section-desc">Quando for inviável o atendimento de todas as características de similaridade ecológica, pode ser considerado o ganho ambiental no estabelecimento da área como protegida.</div>
          {p.criterios.filter((c) => !c.obrigatorio).map((c, i) => (
            <AlertResult key={i} status={c.atendido ? "success" : undefined} statusLabel={c.atendido ? "Identificado" : "Não identificado"}>
              <strong>{c.nome}</strong>
              <div className="text-sm mt-1">{c.detalhe}</div>
            </AlertResult>
          ))}
          {p.ganho_ambiental.temGanho ? (
            <AlertResult status="success" statusLabel="Ganho ambiental">{p.ganho_ambiental.fundamentacao}</AlertResult>
          ) : (
            <AlertResult>{p.ganho_ambiental.fundamentacao}</AlertResult>
          )}
        </div>

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

        {/* COMPARAÇÃO */}
        <div className="acam-card">
          <div className="acam-section-title">Comparação de Áreas</div>
          <div className="acam-fg acam-fg-2">
            <AlertResult status="error" statusLabel="Supressão">
              <strong>Área de Supressão</strong>
              <div className="text-lg font-semibold mt-1">{formatNum(p.area_supressao.area_ha)} ha</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {p.area_supressao.bacia?.bacia_federal && <div>Bacia: <strong>{p.area_supressao.bacia.bacia_federal}</strong></div>}
                <div>Mata Atlântica: <strong>{p.area_supressao.mata_atlantica ? "Sim" : "Não"}</strong></div>
              </div>
            </AlertResult>
            <AlertResult status="success" statusLabel="Proposta">
              <strong>Área Proposta</strong>
              <div className="text-lg font-semibold mt-1">{formatNum(p.area_proposta.area_ha)} ha</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {p.area_proposta.bacia?.bacia_federal && <div>Bacia: <strong>{p.area_proposta.bacia.bacia_federal}</strong></div>}
                <div>Mata Atlântica: <strong>{p.area_proposta.mata_atlantica ? "Sim" : "Não"}</strong></div>
              </div>
            </AlertResult>
          </div>
        </div>

        {/* MAPA */}
        {p.area_proposta.bbox && p.area_proposta.centroide && (
          <div className="acam-card">
            <div className="acam-section-title">Localização</div>
            <MapaImovel bbox={p.area_proposta.bbox} centroide={p.area_proposta.centroide} geojsonImovel={p.area_proposta.geojson || undefined} />
          </div>
        )}

        {/* COBERTURA */}
        {p.area_proposta.cobertura?.sucesso && (
          <div className="acam-card">
            <div className="acam-section-title">Cobertura Vegetal (MapBiomas)</div>
            {p.area_proposta.cobertura.mapaClassificacao && p.area_proposta.cobertura.classes && (
              <div className="mb-4">
                <MapaCobertura mapa={p.area_proposta.cobertura.mapaClassificacao} classes={p.area_proposta.cobertura.classes} />
              </div>
            )}
            <div className="acam-fg acam-fg-2">
              <div>
                <h4 className="acam-subsection-title">Área de Supressão</h4>
                <div className="acam-field"><label>Vegetação Nativa</label><span>{p.area_supressao.cobertura?.totaisPorTipo?.natural?.percentual ?? 0}% ({formatNum(p.area_supressao.cobertura?.totaisPorTipo?.natural?.areaHa ?? 0)} ha)</span></div>
                {p.area_supressao.cobertura?.classes?.filter((c) => c.percentual >= 2).map((c, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{c.tipo === "natural" ? "•" : "—"} {c.classe}: {formatNum(c.percentual, 1)}% ({formatNum(c.areaEstimadaHa)} ha)</p>
                ))}
              </div>
              <div>
                <h4 className="acam-subsection-title">Área Proposta</h4>
                <div className="acam-field"><label>Vegetação Nativa</label><span>{p.area_proposta.cobertura?.totaisPorTipo?.natural?.percentual ?? 0}% ({formatNum(p.area_proposta.cobertura?.totaisPorTipo?.natural?.areaHa ?? 0)} ha)</span></div>
                {p.area_proposta.cobertura?.classes?.filter((c) => c.percentual >= 2).map((c, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{c.tipo === "natural" ? "•" : "—"} {c.classe}: {formatNum(c.percentual, 1)}% ({formatNum(c.areaEstimadaHa)} ha)</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DINÂMICA */}
        {p.dinamica_vegetal && (
          <div className="acam-card">
            <div className="acam-section-title">Dinâmica de Cobertura Vegetal</div>
            <div className="acam-section-desc">Período: {p.dinamica_vegetal.periodoAnalisado} | Tendência: <strong>{p.dinamica_vegetal.tendencia}</strong></div>
            <p className="text-sm mt-2">{p.dinamica_vegetal.interpretacao}</p>
            <div className="acam-fg acam-fg-2 mt-4">
              <div className="acam-field"><label>Nativa estável</label><span>{formatNum(p.dinamica_vegetal.transicoes.coberturaEstavel.percentual, 1)}%</span></div>
              <div className="acam-field"><label>Ganho</label><span>{formatNum(p.dinamica_vegetal.transicoes.ganhoCobertura.percentual, 1)}%</span></div>
              <div className="acam-field"><label>Perda</label><span>{formatNum(p.dinamica_vegetal.transicoes.perdaCobertura.percentual, 1)}%</span></div>
              <div className="acam-field"><label>Antrópico estável</label><span>{formatNum(p.dinamica_vegetal.transicoes.usoAntropicoEstavel.percentual, 1)}%</span></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">{p.dinamica_vegetal.ressalva}</p>
          </div>
        )}

        {/* SENTINEL */}
        {p.sentinel2?.disponivel && (
          <div className="acam-card">
            <div className="acam-section-title">Verificação por Satélite — Sentinel-2</div>
            <div className="acam-fg acam-fg-2">
              <div className="acam-field"><label>Data</label><span>{p.sentinel2.cena?.data?.substring(0, 10)}</span></div>
              <div className="acam-field"><label>NDVI médio</label><span>{p.sentinel2.classificacao?.ndviMedio?.toFixed(3)}</span></div>
              <div className="acam-field"><label>Avaliação</label><span>{p.sentinel2.classificacao?.analiseSegmentada?.avaliacao || p.sentinel2.classificacao?.status}</span></div>
              <div className="acam-field"><label>Confiança</label><span>{p.sentinel2.classificacao?.cruzamentoMapBiomas?.confianca}</span></div>
            </div>
          </div>
        )}

        {/* NOTA */}
        <div className="acam-card">
          <div className="acam-section-title">Nota sobre esta análise</div>
          <p className="text-sm mb-3">Este relatório constitui análise preliminar automatizada e não substitui vistoria de campo, inventário florístico ou parecer técnico especializado.</p>
          <div className="text-xs text-muted-foreground space-y-2">
            <p><strong>Similaridade ecológica (Art. 50):</strong> A avaliação é baseada em dados secundários (MapBiomas, IDE-Sisema) e não substitui inventário florístico conforme Resolução CONAMA 388/2007. A classificação de estágios sucessionais e a avaliação de riqueza de espécies e endemismo requerem levantamento de campo por profissional habilitado.</p>
            <p><strong>Ganho ambiental (§1º do Art. 50):</strong> A análise é baseada em camadas geoespaciais oficiais (IDE-Sisema) de áreas prioritárias para conservação e corredores ecológicos. A confirmação do potencial de conectividade requer análise de paisagem em escala local.</p>
            <p><strong>Fitofisionomia:</strong> Classificação MapBiomas Coleção 9 (Nível 3) complementada por camadas IDE-Sisema (SEMAD/IEF). O MapBiomas não distingue entre subtipos. Para detalhamento, consultar IBGE Vegetação ou Promata II.</p>
            <p><strong>Cobertura vegetal:</strong> MapBiomas Coleção 9 (2023). Classificação de estágios sucessionais requer inventário florístico conforme CONAMA 388/2007.</p>
            <p><strong>Dinâmica temporal:</strong> Comparação MapBiomas 2018–2023. Causas de mudança requerem investigação de campo.</p>
            {p.sentinel2?.disponivel && <p><strong>Verificação por satélite:</strong> Sentinel-2 L2A (10m), Copernicus Data Space Ecosystem. Limiares sujeitos a calibração com dados de campo.</p>}
            <p><strong>Fontes:</strong> MapBiomas Coleção 9 — Sentinel-2 L2A — IDE-Sisema (SEMAD/IEF/IGAM) — ICMBio (INDE).</p>
            <p className="mt-3"><strong>ACAM — Análise de Compensação Ambiental</strong><br />Vieira Castro Advogados — acam.com.br</p>
          </div>
        </div>

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
            <div className="acam-service-header-icon">SA</div>
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
          <div className="acam-section-title">Identificação</div>
          <div className="acam-section-desc">Informações para identificação da análise (opcionais).</div>
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
          <div className="acam-section-title">Coordenadas Geográficas</div>
          <div className="acam-section-desc">Dois arquivos geoespaciais: a área de supressão e a área proposta para servidão/RPPN. Ambos são obrigatórios.</div>

          <input ref={kmlSupressaoRef} type="file" accept=".kml,.kmz,.geojson,.json" style={{ display: "none" }} onChange={(e) => setKmlSupressaoFile(e.target.files?.[0] || null)} />
          <input ref={kmlPropostaRef} type="file" accept=".kml,.kmz,.geojson,.json" style={{ display: "none" }} onChange={(e) => setKmlPropostaFile(e.target.files?.[0] || null)} />

          <div className="acam-fg acam-fg-2">
            <div className="acam-upload-card" onClick={() => kmlSupressaoRef.current?.click()}>
              <h2>Área de Supressão <span className="req">*</span></h2>
              <p>Área onde ocorrerá a supressão de vegetação</p>
              <div className={`acam-upload-zone ${kmlSupressaoFile ? "acam-upload-zone-success" : ""}`}>
                <p>{kmlSupressaoFile ? `✓ ${kmlSupressaoFile.name}` : "Clique para selecionar"}</p>
              </div>
            </div>
            <div className="acam-upload-card" onClick={() => kmlPropostaRef.current?.click()}>
              <h2>Área Proposta <span className="req">*</span></h2>
              <p>Área proposta para servidão ambiental ou RPPN</p>
              <div className={`acam-upload-zone ${kmlPropostaFile ? "acam-upload-zone-success" : ""}`}>
                <p>{kmlPropostaFile ? `✓ ${kmlPropostaFile.name}` : "Clique para selecionar"}</p>
              </div>
            </div>
          </div>
        </div>

        {erro && <div className="acam-alert acam-alert-error">{erro}</div>}

        {loading && <EtapasProgresso />}

        {!loading && <AlertResult>
          <strong>O que será analisado:</strong> Ambas as áreas serão verificadas quanto ao bioma Mata Atlântica, bacia hidrográfica, similaridade fitofisionômica e cobertura vegetal (MapBiomas + Sentinel-2 NDVI). Serão consultadas camadas de áreas prioritárias para conservação, corredores ecológicos e prioridade por biodiversidade (IDE-Sisema) para avaliação de ganho ambiental (§1º do Art. 50).
        </AlertResult>}

        <button className="acam-btn acam-btn-primary w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? "Processando análise..." : `Analisar (${CUSTO_CREDITOS} créditos)`}
        </button>
      </div>
    </div>
  )
}

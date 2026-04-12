/**
 * Camada complementar Sentinel-2 NDVI para análise de Mata Atlântica.
 *
 * Portado do ACAM1 services/sentinel-ndvi.js para TypeScript.
 *
 * Agrega ao fluxo existente (analise-geoespacial.ts) três informações:
 * 1. Data da imagem mais recente disponível (atualidade)
 * 2. Estatísticas NDVI sobre todos os pixels 10m do polígono
 * 3. Imagem NDVI renderizada com paleta de vegetação
 *
 * API: Sentinel Hub / Copernicus Data Space Ecosystem (conta gratuita)
 * Requer: CDSE_CLIENT_ID + CDSE_CLIENT_SECRET no .env
 */

// ============================================
// TIPOS
// ============================================

interface CenaInfo {
  id: string
  data: string
  nuvens: number
}

interface RecuoTemporal {
  aplicado: boolean
  motivo?: string
  cenaOriginal?: { data: string; nuvens: number } | null
  cenaUtilizada?: { data: string; nuvens: number }
  diasRecuo?: number
  ressalva?: string
}

interface StatsNDVI {
  periodo: { from: string; to: string }
  media: number
  mediana: number | null
  minimo: number
  maximo: number
  desvPadrao: number
  percentil10: number | null
  percentil25: number | null
  percentil75: number | null
  percentil90: number | null
  pixelsValidos: number
  pixelsSemDado: number
  coberturaUtil: number
}

interface AnalisePercentis {
  zonaAlta: { percentil: string; valor: number; classeProvavel: string; faixaEsperada: { min: number; max: number }; coerente: boolean }
  zonaBaixa: { percentil: string; valor: number; classeProvavel: string; faixaEsperada: { min: number; max: number }; coerente: boolean }
  ambosCoerentes: boolean
}

interface AnaliseSegmentada {
  ndviEsperado: number
  ndviObservado: number
  razao: number
  avaliacao: string
  interpretacao: string
  percentualNativo: number
  percentualAntropico: number
  atendeCriterio: boolean | null
  fundamentacao: string
  analisePercentis: AnalisePercentis | null
}

interface ClassificacaoNDVI {
  status: string
  ndviMedio: number
  ndviMediana: number | null
  ndviDesvPadrao: number
  percentil10: number | null
  percentil90: number | null
  pixelsAnalisados: number
  descricao: string
  analiseSegmentada: AnaliseSegmentada | null
  cruzamentoMapBiomas: {
    classeMapBiomas: string
    tipoMapBiomas: string
    confianca: string
    alerta: string | null
  }
  disclaimer: string
}

export interface ResultadoSentinel2 {
  disponivel: boolean
  motivo?: string
  cena?: {
    data: string
    coberturaNuvens: number
    fonte: string
    resolucao: string
  }
  recuoTemporal?: RecuoTemporal
  coberturaUtil?: { percentual: number; status: string; nota: string | null } | null
  classificacao?: ClassificacaoNDVI
  imagem?: {
    base64: string
    mimeType: string
    bbox: number[]
    largura: number
    altura: number
  } | null
  legenda?: Array<{ cor: string; rotulo: string }>
}

interface DistribuicaoClasse {
  classe: string
  tipo: string
  percentual: number
}

// ============================================
// AUTENTICAÇÃO
// ============================================

const TOKEN_URL = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
let cachedToken: string | null = null
let tokenExpiry = 0

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.CDSE_CLIENT_ID || "",
    client_secret: process.env.CDSE_CLIENT_SECRET || "",
  })

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  })

  if (!res.ok) throw new Error(`CDSE Auth falhou: ${res.status}`)

  const data = await res.json() as { access_token: string; expires_in: number }
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return cachedToken
}

// ============================================
// BUSCAR CENAS (Catalog API)
// ============================================

const LIMITE_NUVENS = 80

async function buscarCenas(geojsonPolygon: GeoJSON.Polygon | GeoJSON.MultiPolygon, diasAtras: number, limit = 10): Promise<CenaInfo[]> {
  const token = await getToken()
  const agora = new Date()
  const inicio = new Date(agora.getTime() - diasAtras * 24 * 60 * 60 * 1000)

  try {
    const res = await fetch("https://sh.dataspace.copernicus.eu/api/v1/catalog/1.0.0/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        collections: ["sentinel-2-l2a"],
        datetime: `${inicio.toISOString()}/${agora.toISOString()}`,
        intersects: geojsonPolygon,
        limit,
      }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) return []

    const data = await res.json() as { features?: Array<{ id: string; properties: { datetime: string; "eo:cloud_cover": number } }> }
    if (!data.features?.length) return []

    return data.features
      .map((f) => ({ id: f.id, data: f.properties.datetime, nuvens: f.properties["eo:cloud_cover"] }))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  } catch (err) {
    console.error("Sentinel-2 Catalog erro:", (err as Error).message)
    return []
  }
}

async function selecionarCena(geojsonPolygon: GeoJSON.Polygon | GeoJSON.MultiPolygon): Promise<{ cena: CenaInfo; recuoTemporal: RecuoTemporal } | null> {
  const cenasRecentes = await buscarCenas(geojsonPolygon, 30)
  const cenaRecente = cenasRecentes.length > 0 ? cenasRecentes[0] : null

  if (!cenaRecente) {
    const cenasAntigas = await buscarCenas(geojsonPolygon, 365, 20)
    const cenaAceitavel = cenasAntigas.find((c) => c.nuvens <= LIMITE_NUVENS)
    if (!cenaAceitavel) return null

    const diasRecuo = Math.round((Date.now() - new Date(cenaAceitavel.data).getTime()) / (1000 * 60 * 60 * 24))
    return {
      cena: cenaAceitavel,
      recuoTemporal: {
        aplicado: true,
        motivo: `Nenhuma cena nos últimos 30 dias. Utilizada cena de ${cenaAceitavel.data.substring(0, 10)}.`,
        cenaOriginal: null,
        cenaUtilizada: { data: cenaAceitavel.data, nuvens: cenaAceitavel.nuvens },
        diasRecuo,
        ressalva: `Foi utilizada imagem de ${cenaAceitavel.data.substring(0, 10)} (${diasRecuo} dias atrás) por indisponibilidade de imagem recente.`,
      },
    }
  }

  if (cenaRecente.nuvens <= LIMITE_NUVENS) {
    return { cena: cenaRecente, recuoTemporal: { aplicado: false } }
  }

  const cenasAntigas = await buscarCenas(geojsonPolygon, 365, 20)
  const cenaAceitavel = cenasAntigas.find((c) => c.nuvens <= LIMITE_NUVENS)
  if (!cenaAceitavel) return null

  const diasRecuo = Math.round((Date.now() - new Date(cenaAceitavel.data).getTime()) / (1000 * 60 * 60 * 24))
  return {
    cena: cenaAceitavel,
    recuoTemporal: {
      aplicado: true,
      motivo: `Cena mais recente com ${cenaRecente.nuvens.toFixed(1)}% de nebulosidade.`,
      cenaOriginal: { data: cenaRecente.data, nuvens: cenaRecente.nuvens },
      cenaUtilizada: { data: cenaAceitavel.data, nuvens: cenaAceitavel.nuvens },
      diasRecuo,
      ressalva: `Foi utilizada imagem de ${cenaAceitavel.data.substring(0, 10)} (${diasRecuo} dias atrás) por nebulosidade excessiva na cena mais recente.`,
    },
  }
}

// ============================================
// ESTATÍSTICAS NDVI (Statistical API)
// ============================================

const EVALSCRIPT_NDVI = `
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "SCL", "dataMask"] }],
    output: [
      { id: "ndvi", bands: 1 },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  var scl = s.SCL;
  var isValid = s.dataMask && scl !== 0 && scl !== 1 && scl !== 3 && scl !== 8 && scl !== 9 && scl !== 10;
  var ndvi = isValid ? (s.B08 - s.B04) / (s.B08 + s.B04) : 0;
  return { ndvi: [ndvi], dataMask: [isValid ? 1 : 0] };
}
`

async function obterEstatisticasNDVI(geojsonPolygon: GeoJSON.Polygon | GeoJSON.MultiPolygon, dataInicio: string, dataFim: string): Promise<StatsNDVI | null> {
  const token = await getToken()

  try {
    const res = await fetch("https://sh.dataspace.copernicus.eu/api/v1/statistics", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        input: {
          data: [{ dataFilter: { mosaickingOrder: "leastCC" }, type: "sentinel-2-l2a" }],
          bounds: { geometry: geojsonPolygon, properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" } },
        },
        aggregation: {
          timeRange: { from: dataInicio, to: dataFim },
          aggregationInterval: { of: "P30D" },
          evalscript: EVALSCRIPT_NDVI,
          resx: 0.0001,
          resy: 0.0001,
        },
        calculations: {
          ndvi: { statistics: { default: { percentiles: { k: [10, 25, 50, 75, 90] } } } },
        },
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) return null

    const data = await res.json() as { data?: Array<{ interval: { from: string; to: string }; outputs?: { ndvi?: { bands?: { B0?: { stats?: { mean: number; min: number; max: number; stDev: number; sampleCount: number; noDataCount?: number; percentiles?: Record<string, number> } } } } } }> }
    const intervals = data.data
    if (!intervals?.length) return null

    for (let i = intervals.length - 1; i >= 0; i--) {
      const stats = intervals[i].outputs?.ndvi?.bands?.B0?.stats
      if (stats && stats.sampleCount > 0) {
        const totalPixels = stats.sampleCount + (stats.noDataCount || 0)
        const coberturaUtil = totalPixels > 0 ? stats.sampleCount / totalPixels : 0
        return {
          periodo: intervals[i].interval,
          media: Math.round(stats.mean * 1000) / 1000,
          mediana: stats.percentiles?.["50.0"] ? Math.round(stats.percentiles["50.0"] * 1000) / 1000 : null,
          minimo: Math.round(stats.min * 1000) / 1000,
          maximo: Math.round(stats.max * 1000) / 1000,
          desvPadrao: Math.round(stats.stDev * 1000) / 1000,
          percentil10: stats.percentiles?.["10.0"] ? Math.round(stats.percentiles["10.0"] * 1000) / 1000 : null,
          percentil25: stats.percentiles?.["25.0"] ? Math.round(stats.percentiles["25.0"] * 1000) / 1000 : null,
          percentil75: stats.percentiles?.["75.0"] ? Math.round(stats.percentiles["75.0"] * 1000) / 1000 : null,
          percentil90: stats.percentiles?.["90.0"] ? Math.round(stats.percentiles["90.0"] * 1000) / 1000 : null,
          pixelsValidos: stats.sampleCount,
          pixelsSemDado: stats.noDataCount || 0,
          coberturaUtil: Math.round(coberturaUtil * 1000) / 10,
        }
      }
    }
    return null
  } catch (err) {
    console.error("Sentinel-2 Stats erro:", (err as Error).message)
    return null
  }
}

// ============================================
// IMAGEM NDVI RENDERIZADA (Process API)
// ============================================

const EVALSCRIPT_VISUAL = `
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "SCL", "dataMask"] }],
    output: { bands: 4 }
  };
}
function evaluatePixel(s) {
  var scl = s.SCL;
  var isValid = s.dataMask && scl !== 0 && scl !== 1 && scl !== 3 && scl !== 8 && scl !== 9 && scl !== 10;
  if (!isValid) return [0.85, 0.85, 0.85, 1.0];
  var ndvi = (s.B08 - s.B04) / (s.B08 + s.B04);
  var r, g, b;
  if (ndvi < 0)         { r=0.05; g=0.05; b=0.30; }
  else if (ndvi < 0.15) { r=0.75; g=0.25; b=0.15; }
  else if (ndvi < 0.30) { r=0.85; g=0.65; b=0.15; }
  else if (ndvi < 0.50) { r=0.55; g=0.75; b=0.20; }
  else if (ndvi < 0.70) { r=0.20; g=0.65; b=0.15; }
  else                  { r=0.05; g=0.45; b=0.05; }
  return [r, g, b, 1];
}
`

async function obterImagemNDVI(geojsonPolygon: GeoJSON.Polygon | GeoJSON.MultiPolygon, dataInicio: string, dataFim: string, largura = 512): Promise<{ imagem: string; bbox: number[]; largura: number; altura: number; mimeType: string } | null> {
  const token = await getToken()

  const coords = geojsonPolygon.type === "MultiPolygon"
    ? geojsonPolygon.coordinates[0][0]
    : geojsonPolygon.coordinates[0]
  const lons = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])
  const bbox = [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)]

  const lonRange = bbox[2] - bbox[0]
  const latRange = bbox[3] - bbox[1]
  let altura = Math.round(largura * (latRange / lonRange))
  if (altura < 64) altura = 64
  if (altura > 2048) altura = 2048

  try {
    const res = await fetch("https://sh.dataspace.copernicus.eu/api/v1/process", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "image/png" },
      body: JSON.stringify({
        input: {
          data: [{ dataFilter: { timeRange: { from: dataInicio, to: dataFim }, mosaickingOrder: "leastCC" }, type: "sentinel-2-l2a" }],
          bounds: { bbox, properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" } },
        },
        output: { width: largura, height: altura, responses: [{ identifier: "default", format: { type: "image/png" } }] },
        evalscript: EVALSCRIPT_VISUAL,
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) return null

    const buffer = Buffer.from(await res.arrayBuffer())
    return { imagem: buffer.toString("base64"), bbox, largura, altura, mimeType: "image/png" }
  } catch (err) {
    console.error("Sentinel-2 Image erro:", (err as Error).message)
    return null
  }
}

// ============================================
// CLASSIFICAÇÃO COMPLEMENTAR
// ============================================

const NDVI_ESPERADO: Record<string, { min: number; max: number; tipo: string }> = {
  "Formação Florestal": { min: 0.50, max: 0.85, tipo: "natural" },
  "Formação Savânica": { min: 0.25, max: 0.55, tipo: "natural" },
  "Formação Campestre": { min: 0.15, max: 0.40, tipo: "natural" },
  "Campo Alagado": { min: 0.15, max: 0.45, tipo: "natural" },
  "Afloramento Rochoso": { min: 0.05, max: 0.25, tipo: "natural" },
  "Rio, Lago e Oceano": { min: -0.30, max: 0.10, tipo: "natural" },
  "Praia, Duna e Areal": { min: 0.00, max: 0.15, tipo: "natural" },
  "Pastagem": { min: 0.15, max: 0.45, tipo: "antrópico" },
  "Silvicultura": { min: 0.45, max: 0.80, tipo: "antrópico" },
  "Cana": { min: 0.20, max: 0.65, tipo: "antrópico" },
  "Soja": { min: 0.15, max: 0.70, tipo: "antrópico" },
  "Área urbanizada": { min: 0.00, max: 0.15, tipo: "antrópico" },
  "Mineração": { min: 0.00, max: 0.10, tipo: "antrópico" },
  "Mosaico de usos": { min: 0.15, max: 0.50, tipo: "antrópico" },
  "Outras lavouras temporárias": { min: 0.15, max: 0.60, tipo: "antrópico" },
  "Outras lavouras perenes": { min: 0.30, max: 0.70, tipo: "antrópico" },
  "Algodão": { min: 0.15, max: 0.65, tipo: "antrópico" },
  "Outras áreas não vegetadas": { min: 0.00, max: 0.15, tipo: "indefinido" },
}

function calcularAnaliseSegmentada(
  ndviObservado: number,
  distribuicaoClasses: DistribuicaoClasse[],
  nebulosidade: number,
  statsNDVI: StatsNDVI,
): AnaliseSegmentada | null {
  if (!distribuicaoClasses?.length) return null

  let ndviEsperado = 0
  let pesoTotal = 0
  let percentualNativo = 0
  let percentualAntropico = 0
  const composicaoTexto: string[] = []

  for (const c of distribuicaoClasses) {
    const ref = NDVI_ESPERADO[c.classe]
    const pct = c.percentual || 0
    if (pct <= 0) continue

    const pontoMedio = ref ? (ref.min + ref.max) / 2 : 0.35
    ndviEsperado += (pct / 100) * pontoMedio
    pesoTotal += pct

    const tipo = ref?.tipo || c.tipo || "indefinido"
    if (tipo === "natural") percentualNativo += pct
    else if (tipo === "antrópico") percentualAntropico += pct

    if (pct >= 2) composicaoTexto.push(`${c.classe} ${pct.toFixed(1)}%`)
  }

  if (pesoTotal < 50) return null

  const razao = ndviEsperado > 0 ? ndviObservado / ndviEsperado : 0
  const neb = nebulosidade || 0

  let avaliacao: string
  let interpretacaoBase: string

  if (razao >= 0.9) {
    avaliacao = "Coerente"
    interpretacaoBase = `O NDVI médio observado (${ndviObservado.toFixed(3)}) é compatível com o esperado (${ndviEsperado.toFixed(3)}) para a composição de formações vegetais da área (${composicaoTexto.join(", ")}). A cobertura vegetal está dentro do padrão esperado para estas formações.`
  } else if (razao >= 0.6) {
    avaliacao = "Parcialmente coerente"
    interpretacaoBase = `O NDVI médio observado (${ndviObservado.toFixed(3)}) é inferior ao esperado (${ndviEsperado.toFixed(3)}) para a composição de formações vegetais da área (${composicaoTexto.join(", ")}). A diferença pode ser explicada por: (a) nebulosidade residual na cena, (b) sazonalidade (período seco), ou (c) degradação parcial da cobertura. Recomenda-se vistoria de campo.`
  } else {
    if (neb > 60) {
      avaliacao = "Inconclusivo por nebulosidade"
      interpretacaoBase = `O NDVI médio observado (${ndviObservado.toFixed(3)}) é inferior ao esperado (${ndviEsperado.toFixed(3)}), porém a cena utilizada apresenta nebulosidade de ${neb.toFixed(1)}%, o que compromete a confiabilidade da análise NDVI. A classificação MapBiomas (${percentualNativo.toFixed(1)}% vegetação nativa) permanece como referência principal.`
    } else if (neb > 30 && razao >= 0.5) {
      avaliacao = "Parcialmente coerente"
      interpretacaoBase = `O NDVI médio observado (${ndviObservado.toFixed(3)}) é inferior ao esperado (${ndviEsperado.toFixed(3)}) para a composição de formações vegetais da área (${composicaoTexto.join(", ")}). A nebulosidade de ${neb.toFixed(1)}% pode afetar parcialmente os valores de NDVI.`
    } else {
      avaliacao = "Divergente"
      interpretacaoBase = `O NDVI médio observado (${ndviObservado.toFixed(3)}) é significativamente inferior ao esperado (${ndviEsperado.toFixed(3)}) para a composição de formações vegetais da área (${composicaoTexto.join(", ")}). Possível degradação significativa ou desmatamento recente. Recomenda-se vistoria de campo urgente.`
    }
  }

  // Análise por percentis
  let analisePercentis: AnalisePercentis | null = null
  if (statsNDVI?.percentil90 != null && statsNDVI?.percentil10 != null && distribuicaoClasses.length >= 2) {
    const classesOrdenadas = distribuicaoClasses
      .filter((c) => c.percentual >= 2)
      .map((c) => ({ ...c, ref: NDVI_ESPERADO[c.classe] }))
      .filter((c) => c.ref)
      .sort((a, b) => (a.ref!.min + a.ref!.max) / 2 - (b.ref!.min + b.ref!.max) / 2)

    if (classesOrdenadas.length >= 2) {
      const classeBaixa = classesOrdenadas[0]
      const classeAlta = classesOrdenadas[classesOrdenadas.length - 1]
      const p90 = statsNDVI.percentil90
      const p10 = statsNDVI.percentil10
      const p90Coerente = p90 >= classeAlta.ref!.min * 0.85
      const p10Coerente = p10 <= classeBaixa.ref!.max * 1.5

      analisePercentis = {
        zonaAlta: { percentil: "P90", valor: p90, classeProvavel: classeAlta.classe, faixaEsperada: { min: classeAlta.ref!.min, max: classeAlta.ref!.max }, coerente: p90Coerente },
        zonaBaixa: { percentil: "P10", valor: p10, classeProvavel: classeBaixa.classe, faixaEsperada: { min: classeBaixa.ref!.min, max: classeBaixa.ref!.max }, coerente: p10Coerente },
        ambosCoerentes: p90Coerente && p10Coerente,
      }

      if (analisePercentis.ambosCoerentes) {
        interpretacaoBase += ` A distribuição dos percentis NDVI é coerente com a composição: P90 (${p90.toFixed(3)}) compatível com ${classeAlta.classe} e P10 (${p10.toFixed(3)}) compatível com ${classeBaixa.classe}. A heterogeneidade reflete diversidade de fitofisionomias, não degradação.`
      }
    }
  }

  // Conclusão para o Decreto 47.749
  let atendeCriterio: boolean | null = null
  let fundamentacao: string
  if (percentualNativo >= 80) {
    atendeCriterio = true
    fundamentacao = `A área apresenta ${percentualNativo.toFixed(1)}% de cobertura por formações nativas do bioma Mata Atlântica (${composicaoTexto.join(", ")}), conforme classificação MapBiomas Col. 9 (2023). As formações de campo rupestre, afloramento rochoso e formação savânica são vegetação nativa legítima do bioma, ainda que apresentem NDVI naturalmente baixo. A área atende ao requisito de vegetação nativa do bioma para fins de compensação (Decreto 47.749/2019).`
  } else if (percentualNativo >= 50) {
    atendeCriterio = null
    fundamentacao = `A área apresenta ${percentualNativo.toFixed(1)}% de cobertura nativa e ${percentualAntropico.toFixed(1)}% antrópica. Verificar em campo se as áreas nativas atendem ao requisito de vegetação nativa do bioma.`
  } else {
    atendeCriterio = false
    fundamentacao = `A área apresenta apenas ${percentualNativo.toFixed(1)}% de cobertura nativa e ${percentualAntropico.toFixed(1)}% antrópica. A área provavelmente não atende ao requisito de vegetação nativa do bioma para compensação.`
  }

  return {
    ndviEsperado: Math.round(ndviEsperado * 1000) / 1000,
    ndviObservado: Math.round(ndviObservado * 1000) / 1000,
    razao: Math.round(razao * 100) / 100,
    avaliacao,
    interpretacao: interpretacaoBase,
    percentualNativo: Math.round(percentualNativo * 10) / 10,
    percentualAntropico: Math.round(percentualAntropico * 10) / 10,
    atendeCriterio,
    fundamentacao,
    analisePercentis,
  }
}

function classificarVegetacao(
  statsNDVI: StatsNDVI | null,
  classeMapBiomas: string,
  tipoMapBiomas: string,
  distribuicaoClasses: DistribuicaoClasse[] | null,
  nebulosidade: number,
): ClassificacaoNDVI {
  if (!statsNDVI) {
    return {
      status: "INDISPONÍVEL",
      ndviMedio: 0,
      ndviMediana: null,
      ndviDesvPadrao: 0,
      percentil10: null,
      percentil90: null,
      pixelsAnalisados: 0,
      descricao: "Análise Sentinel-2 indisponível. Considerar apenas resultado MapBiomas.",
      analiseSegmentada: null,
      cruzamentoMapBiomas: { classeMapBiomas, tipoMapBiomas, confianca: "N/A", alerta: null },
      disclaimer: "",
    }
  }

  const ndvi = statsNDVI.media
  let statusNDVI: string
  let descricaoNDVI: string

  if (ndvi >= 0.6) {
    statusNDVI = "Vegetação nativa densa"
    descricaoNDVI = "NDVI indica vegetação densa, compatível com estágio médio ou avançado de regeneração."
  } else if (ndvi >= 0.4) {
    statusNDVI = "Vegetação presente"
    descricaoNDVI = "NDVI indica presença de vegetação, possivelmente em estágio inicial a médio."
  } else if (ndvi >= 0.3) {
    statusNDVI = "Vegetação esparsa"
    descricaoNDVI = "NDVI indica vegetação esparsa ou regeneração inicial. Recomenda-se vistoria."
  } else if (ndvi >= 0.15) {
    statusNDVI = "Área antropizada"
    descricaoNDVI = "NDVI indica pastagem, agricultura ou vegetação muito esparsa."
  } else {
    statusNDVI = "Solo exposto"
    descricaoNDVI = "NDVI indica solo exposto ou área degradada."
  }

  const analiseSegmentada = distribuicaoClasses
    ? calcularAnaliseSegmentada(ndvi, distribuicaoClasses, nebulosidade, statsNDVI)
    : null

  let confianca: string
  let alerta: string | null = null

  if (analiseSegmentada) {
    if (analiseSegmentada.avaliacao === "Coerente") confianca = "Alta"
    else if (analiseSegmentada.avaliacao === "Parcialmente coerente") confianca = "Moderada"
    else if (analiseSegmentada.avaliacao === "Inconclusivo por nebulosidade") {
      confianca = "Limitada por nebulosidade"
      alerta = `Análise NDVI comprometida por cobertura de nuvens de ${nebulosidade.toFixed(1)}%. Considerar classificação MapBiomas como referência.`
    } else {
      confianca = "Alerta"
      alerta = analiseSegmentada.interpretacao
    }
  } else {
    if (tipoMapBiomas === "natural" && ndvi >= 0.4) confianca = "Alta"
    else if (tipoMapBiomas === "natural" && ndvi < 0.3) {
      confianca = "Alerta"
      alerta = `MapBiomas classifica a área como "${classeMapBiomas}" (natural), mas o NDVI atual (${ndvi.toFixed(3)}) indica perda de cobertura vegetal.`
    } else confianca = "Moderada"
  }

  return {
    status: statusNDVI,
    ndviMedio: ndvi,
    ndviMediana: statsNDVI.mediana,
    ndviDesvPadrao: statsNDVI.desvPadrao,
    percentil10: statsNDVI.percentil10,
    percentil90: statsNDVI.percentil90,
    pixelsAnalisados: statsNDVI.pixelsValidos,
    descricao: descricaoNDVI,
    analiseSegmentada,
    cruzamentoMapBiomas: { classeMapBiomas, tipoMapBiomas, confianca, alerta },
    disclaimer: "Análise NDVI baseada em Sentinel-2 (10m). Os limiares de NDVI esperado por formação vegetal são baseados na literatura de sensoriamento remoto para o bioma Mata Atlântica e estão sujeitos a calibração com dados de campo. As formações de campo rupestre, afloramento rochoso e formação savânica são vegetação nativa legítima do bioma com NDVI naturalmente baixo. A classificação de estágios sucessionais requer inventário florístico conforme Res. CONAMA 388/2007.",
  }
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

export async function analiseSentinel2(
  geojsonPolygon: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  classeMapBiomas: string,
  tipoMapBiomas: string,
  distribuicaoClasses: DistribuicaoClasse[] | null = null,
): Promise<ResultadoSentinel2 | null> {
  if (!process.env.CDSE_CLIENT_ID || !process.env.CDSE_CLIENT_SECRET) {
    console.log("Sentinel-2: credenciais CDSE não configuradas, pulando análise NDVI.")
    return null
  }

  try {
    const selecao = await selecionarCena(geojsonPolygon)
    if (!selecao) {
      return {
        disponivel: false,
        motivo: `Nenhuma imagem Sentinel-2 com nebulosidade aceitável (<= ${LIMITE_NUVENS}%) encontrada nos últimos 12 meses para esta área.`,
      }
    }

    const { cena, recuoTemporal } = selecao

    const dataCena = new Date(cena.data)
    const dataInicio = new Date(dataCena.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const dataFim = new Date(dataCena.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const stats = await obterEstatisticasNDVI(geojsonPolygon, dataInicio, dataFim)

    let coberturaInfo: { percentual: number; status: string; nota: string | null } | null = null
    if (stats) {
      const cu = stats.coberturaUtil || 100
      if (cu < 20) coberturaInfo = { percentual: cu, status: "INSUFICIENTE", nota: `Apenas ${cu.toFixed(1)}% da área livre de nuvens.` }
      else if (cu < 50) coberturaInfo = { percentual: cu, status: "PARCIAL", nota: `Apenas ${cu.toFixed(1)}% da área livre de nuvens.` }
      else coberturaInfo = { percentual: cu, status: "ADEQUADA", nota: null }
    }

    const classificacao = classificarVegetacao(stats, classeMapBiomas, tipoMapBiomas, distribuicaoClasses, cena.nuvens)

    const imagem = await obterImagemNDVI(geojsonPolygon, dataInicio, dataFim)

    return {
      disponivel: true,
      cena: { data: cena.data, coberturaNuvens: cena.nuvens, fonte: "Sentinel-2 L2A (Copernicus Data Space Ecosystem)", resolucao: "10 metros" },
      recuoTemporal,
      coberturaUtil: coberturaInfo,
      classificacao,
      imagem: imagem ? { base64: imagem.imagem, mimeType: imagem.mimeType, bbox: imagem.bbox, largura: imagem.largura, altura: imagem.altura } : null,
      legenda: [
        { cor: "#0B7A0B", rotulo: "Vegetação nativa densa (NDVI >= 0.6)" },
        { cor: "#3AAD3A", rotulo: "Vegetação nativa (NDVI 0.4-0.6)" },
        { cor: "#8BC34A", rotulo: "Regeneração inicial (NDVI 0.3-0.4)" },
        { cor: "#D4A017", rotulo: "Área antropizada (NDVI 0.15-0.3)" },
        { cor: "#C0392B", rotulo: "Solo exposto (NDVI < 0.15)" },
        { cor: "#0D0D4D", rotulo: "Água/sombra (NDVI < 0)" },
        { cor: "#D9D9D9", rotulo: "Nuvem/sombra de nuvem (excluído)" },
      ],
    }
  } catch (err) {
    console.error("Sentinel-2 análise erro:", (err as Error).message)
    return { disponivel: false, motivo: `Erro na análise Sentinel-2: ${(err as Error).message}` }
  }
}

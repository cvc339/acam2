/**
 * Serviço de Análise Geoespacial — IDE-Sisema WFS
 *
 * Portado do ACAM1 services/geoespacial.js
 * Mudanças: require→import, caminhoArquivo→Buffer/string,
 * tipagem TypeScript, sem sentinel-ndvi (Fase V1)
 */

import * as turf from "@turf/turf"
import polygonClipping from "polygon-clipping"

// ============================================
// CONFIGURAÇÃO WFS
// ============================================

const IDE_SISEMA_WFS_URLS = [
  "https://geoserver.meioambiente.mg.gov.br/IDE/ows",
  "https://geoserver.meioambiente.mg.gov.br/ows",
  "https://geoserver.meioambiente.mg.gov.br/wfs",
]

// Camadas
const LAYER_UCS = [
  "ide_2010_mg_unidades_conservacao_federais_pol",
  "ide_2010_mg_unidades_conservacao_estaduais_pol",
  "ide_2010_mg_unidades_conservacao_municipais_pol",
]

const LAYER_MATA_ATLANTICA = "ide_2020_mg_area_lei_mata_atlantica_pol"
const LAYER_BACIAS = "ide_1108_mg_circunscricoes_hidrograficas_pol"
const LAYER_MAPBIOMAS_NAT_ANT = "ide_1403_mg_nat_ant_mapbiomas_col9_2023"

export const MAPBIOMAS_CLASSES: Record<number, { classe: string; tipo: string; descricao: string }> = {
  3: { classe: "Formação Florestal", tipo: "natural", descricao: "Formação Florestal" },
  4: { classe: "Formação Savânica", tipo: "natural", descricao: "Formação Savânica" },
  11: { classe: "Campo Alagado", tipo: "natural", descricao: "Campo Alagado e Área Pantanosa" },
  12: { classe: "Formação Campestre", tipo: "natural", descricao: "Formação Campestre" },
  23: { classe: "Praia, Duna e Areal", tipo: "natural", descricao: "Praia, Duna e Areal" },
  29: { classe: "Afloramento Rochoso", tipo: "natural", descricao: "Afloramento Rochoso" },
  33: { classe: "Rio, Lago e Oceano", tipo: "natural", descricao: "Rio, Lago e Oceano" },
  9: { classe: "Silvicultura", tipo: "antropico", descricao: "Silvicultura" },
  15: { classe: "Pastagem", tipo: "antropico", descricao: "Pastagem" },
  20: { classe: "Cana", tipo: "antropico", descricao: "Cana" },
  21: { classe: "Mosaico de usos", tipo: "antropico", descricao: "Mosaico de usos" },
  24: { classe: "Área urbanizada", tipo: "antropico", descricao: "Área urbanizada" },
  30: { classe: "Mineração", tipo: "antropico", descricao: "Mineração" },
  39: { classe: "Soja", tipo: "antropico", descricao: "Soja" },
  41: { classe: "Outras lavouras temporárias", tipo: "antropico", descricao: "Outras lavouras temporárias" },
  46: { classe: "Café", tipo: "antropico", descricao: "Café" },
  47: { classe: "Citrus", tipo: "antropico", descricao: "Citrus" },
  48: { classe: "Outras lavouras perenes", tipo: "antropico", descricao: "Outras lavouras perenes" },
  62: { classe: "Algodão", tipo: "antropico", descricao: "Algodão (beta)" },
  25: { classe: "Outras áreas não vegetadas", tipo: "indefinido", descricao: "Outras áreas não vegetadas" },
}

// ============================================
// TIPOS
// ============================================

export interface BBox {
  minLon: number
  maxLon: number
  minLat: number
  maxLat: number
}

export interface Centroide {
  lon: number
  lat: number
}

export interface ResultadoProcessamento {
  sucesso: boolean
  geojson?: GeoJSON.FeatureCollection
  feature?: GeoJSON.Feature
  geometria?: GeoJSON.Geometry
  coordenadas?: number[][]
  bbox?: BBox
  centroide?: Centroide
  areaHa?: number
  wkt?: string
  erro?: string
}

export interface UCEncontrada {
  nome: string
  categoria: string
  protecao_integral: boolean
  area_sobreposicao_ha?: number | null
  percentual_sobreposicao?: number | null
  area_total_imovel_ha?: number
  area_fora_uc_ha?: number
  tem_sobreposicao?: boolean
  erro?: string
}

export interface ResultadoIDESisema {
  sucesso: boolean
  ucs_encontradas: UCEncontrada[]
  total_ucs?: number
  bbox?: BBox
  centroide?: Centroide
  erro?: string
  mensagem?: string
}

export interface ResultadoBacia {
  sucesso: boolean
  bacia: {
    sigla: string | null
    nome: string | null
    bacia_federal: string | null
    sigla_ueg: string | null
    area_km2: number | null
    comite: string | null
    sede_comite: string | null
  } | null
  erro?: string
  mensagem?: string
}

// ============================================
// PROCESSAR KML
// ============================================

export async function processarKML(kmlContent: string): Promise<ResultadoProcessamento> {
  try {
    // Importar dependências de XML (dinâmico para evitar problemas de SSR)
    const { DOMParser } = await import("@xmldom/xmldom")
    const toGeoJSON = await import("@mapbox/togeojson")

    const kml = new DOMParser().parseFromString(kmlContent, "text/xml")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geojson = toGeoJSON.kml(kml as any) as GeoJSON.FeatureCollection

    if (!geojson.features || geojson.features.length === 0) {
      throw new Error("Nenhuma feature encontrada no KML")
    }

    return extrairPoligonoDeFeatures(geojson)
  } catch (error) {
    console.error("Erro ao processar KML:", (error as Error).message)
    return { sucesso: false, erro: (error as Error).message }
  }
}

// ============================================
// PROCESSAR GEOJSON
// ============================================

export function processarGeoJSON(geojsonData: string | GeoJSON.FeatureCollection | GeoJSON.Feature | GeoJSON.Geometry): ResultadoProcessamento {
  try {
    let geojson: GeoJSON.FeatureCollection

    const parsed = typeof geojsonData === "string" ? JSON.parse(geojsonData) : geojsonData

    if (parsed.type === "Feature") {
      geojson = { type: "FeatureCollection", features: [parsed] }
    } else if (parsed.type === "Polygon" || parsed.type === "MultiPolygon") {
      geojson = { type: "FeatureCollection", features: [{ type: "Feature", geometry: parsed, properties: {} }] }
    } else if (parsed.type === "FeatureCollection") {
      geojson = parsed
    } else {
      throw new Error("Formato GeoJSON não reconhecido")
    }

    return extrairPoligonoDeFeatures(geojson)
  } catch (error) {
    console.error("Erro ao processar GeoJSON:", (error as Error).message)
    return { sucesso: false, erro: (error as Error).message }
  }
}

// ============================================
// EXTRAIR POLÍGONO (helper compartilhado)
// ============================================

function tentarConverterParaPoligono(geom: GeoJSON.Geometry): GeoJSON.Geometry {
  if (geom.type === "LineString") {
    const coords = geom.coordinates
    if (coords.length >= 4) {
      const primeiro = coords[0]
      const ultimo = coords[coords.length - 1]
      const isFechado = primeiro[0] === ultimo[0] && primeiro[1] === ultimo[1]
      const coordsFechadas = isFechado ? coords : [...coords, coords[0]]
      return { type: "Polygon", coordinates: [coordsFechadas] }
    }
  } else if (geom.type === "MultiLineString") {
    const coords = geom.coordinates[0]
    if (coords && coords.length >= 4) {
      const primeiro = coords[0]
      const ultimo = coords[coords.length - 1]
      const isFechado = primeiro[0] === ultimo[0] && primeiro[1] === ultimo[1]
      const coordsFechadas = isFechado ? coords : [...coords, coords[0]]
      return { type: "Polygon", coordinates: [coordsFechadas] }
    }
  }
  return geom
}

function extrairPoligonoDeFeatures(geojson: GeoJSON.FeatureCollection): ResultadoProcessamento {
  let feature: GeoJSON.Feature | null = null
  let geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon | null = null

  for (const f of geojson.features) {
    if (!f.geometry) continue
    const geom = tentarConverterParaPoligono(f.geometry)
    if (geom.type === "Polygon" || geom.type === "MultiPolygon") {
      feature = { ...f, geometry: geom }
      geometry = geom as GeoJSON.Polygon | GeoJSON.MultiPolygon
      break
    }
    if (f.geometry.type === "GeometryCollection") {
      for (const g of (f.geometry as GeoJSON.GeometryCollection).geometries) {
        const geomConvertida = tentarConverterParaPoligono(g)
        if (geomConvertida.type === "Polygon" || geomConvertida.type === "MultiPolygon") {
          feature = { type: "Feature", geometry: geomConvertida, properties: f.properties || {} }
          geometry = geomConvertida as GeoJSON.Polygon | GeoJSON.MultiPolygon
          break
        }
      }
      if (geometry) break
    }
  }

  if (!feature || !geometry) {
    const tiposEncontrados = geojson.features.map((f) => f.geometry?.type || "sem geometria").filter((v, i, a) => a.indexOf(v) === i).join(", ")
    throw new Error(`Nenhum polígono encontrado. Tipos: ${tiposEncontrados}`)
  }

  const coordenadas = geometry.type === "Polygon" ? geometry.coordinates[0] : geometry.coordinates[0][0]
  const lons = coordenadas.map((c) => c[0])
  const lats = coordenadas.map((c) => c[1])

  const bbox: BBox = {
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  }

  const centroide: Centroide = {
    lon: (bbox.minLon + bbox.maxLon) / 2,
    lat: (bbox.minLat + bbox.maxLat) / 2,
  }

  const areaM2 = turf.area(feature)
  const areaHa = areaM2 / 10000

  return {
    sucesso: true,
    geojson,
    feature,
    geometria: feature.geometry,
    coordenadas,
    bbox,
    centroide,
    areaHa,
    wkt: coordenadasParaWKT(coordenadas),
  }
}

export function coordenadasParaWKT(coordenadas: number[][]): string {
  const pontos = coordenadas.map((c) => `${c[0]} ${c[1]}`).join(", ")
  return `POLYGON((${pontos}))`
}

// ============================================
// CONSULTA WFS GENÉRICA
// ============================================

interface ResultadoWFS {
  sucesso: boolean
  features: GeoJSON.Feature[]
  total: number
  erro?: string
  url_utilizada?: string
  layer?: string
}

async function consultarWFS(layerName: string, bbox: BBox): Promise<ResultadoWFS> {
  for (const baseUrl of IDE_SISEMA_WFS_URLS) {
    try {
      let fullLayerName = layerName
      if (!baseUrl.includes("/IDE/") && !layerName.startsWith("IDE:")) {
        fullLayerName = `IDE:${layerName}`
      } else if (baseUrl.includes("/IDE/") && layerName.startsWith("IDE:")) {
        fullLayerName = layerName.replace("IDE:", "")
      }

      const params = new URLSearchParams({
        service: "WFS",
        version: "2.0.0",
        request: "GetFeature",
        typeName: fullLayerName,
        outputFormat: "application/json",
        srsName: "EPSG:4326",
        bbox: `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat},EPSG:4326`,
      })

      const url = `${baseUrl}?${params.toString()}`
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) continue

      const data = await response.json() as { features?: GeoJSON.Feature[]; exceptions?: unknown; error?: unknown }
      if (data.exceptions || data.error) continue

      return {
        sucesso: true,
        features: data.features || [],
        total: data.features?.length || 0,
        url_utilizada: baseUrl,
        layer: layerName,
      }
    } catch {
      continue
    }
  }

  return { sucesso: false, erro: `Não foi possível consultar camada ${layerName}`, features: [], total: 0 }
}

async function consultarWFSPorCentroide(layerName: string, centroide: Centroide): Promise<ResultadoWFS> {
  for (const baseUrl of IDE_SISEMA_WFS_URLS) {
    try {
      let fullLayerName = layerName
      if (!baseUrl.includes("/IDE/") && !layerName.startsWith("IDE:")) {
        fullLayerName = `IDE:${layerName}`
      } else if (baseUrl.includes("/IDE/") && layerName.startsWith("IDE:")) {
        fullLayerName = layerName.replace("IDE:", "")
      }

      const params = new URLSearchParams({
        service: "WFS",
        version: "2.0.0",
        request: "GetFeature",
        typeName: fullLayerName,
        outputFormat: "application/json",
        srsName: "EPSG:4326",
        CQL_FILTER: `INTERSECTS(geom,POINT(${centroide.lat} ${centroide.lon}))`,
      })

      const url = `${baseUrl}?${params.toString()}`
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) continue

      const data = await response.json() as { features?: GeoJSON.Feature[]; exceptions?: unknown; error?: unknown }
      if (data.exceptions || data.error) continue

      return { sucesso: true, features: data.features || [], total: data.features?.length || 0, url_utilizada: baseUrl, layer: layerName }
    } catch {
      continue
    }
  }

  return { sucesso: false, erro: `Não foi possível consultar camada ${layerName} por centróide`, features: [], total: 0 }
}

// ============================================
// VERIFICAR MATA ATLÂNTICA
// ============================================

export async function verificarMataAtlantica(bbox: BBox, centroide: Centroide): Promise<{ sucesso: boolean; estaNaMataAtlantica: boolean | null; features?: GeoJSON.Feature[]; erro?: string }> {
  let resultado = await consultarWFSPorCentroide(LAYER_MATA_ATLANTICA, centroide)
  if (!resultado.sucesso) {
    resultado = await consultarWFS(LAYER_MATA_ATLANTICA, bbox)
  }

  if (!resultado.sucesso) {
    return { sucesso: false, erro: resultado.erro, estaNaMataAtlantica: null }
  }

  return { sucesso: true, estaNaMataAtlantica: resultado.features.length > 0, features: resultado.features }
}

// ============================================
// CONSULTAR BACIA HIDROGRÁFICA
// ============================================

export async function consultarBaciaHidrografica(bbox: BBox, centroide: Centroide): Promise<ResultadoBacia> {
  let resultado = await consultarWFSPorCentroide(LAYER_BACIAS, centroide)
  if (!resultado.sucesso) {
    resultado = await consultarWFS(LAYER_BACIAS, bbox)
  }

  if (!resultado.sucesso) return { sucesso: false, erro: resultado.erro, bacia: null }
  if (resultado.features.length === 0) return { sucesso: true, bacia: null, mensagem: "Área não encontrada em nenhuma Circunscrição Hidrográfica" }

  const props = resultado.features[0].properties as Record<string, unknown>

  return {
    sucesso: true,
    bacia: {
      sigla: (props.sigla as string) || null,
      nome: (props.nome as string) || null,
      bacia_federal: (props.bacia_fede as string) || null,
      sigla_ueg: (props.sigla_ueg as string) || null,
      area_km2: (props.area_km2 as number) || null,
      comite: (props.cbh as string) || null,
      sede_comite: (props.sede as string) || null,
    },
  }
}

// ============================================
// CONSULTAR COBERTURA VEGETAL (MapBiomas WMS)
// ============================================

export async function consultarCoberturaVegetal(bbox: BBox, centroide: Centroide): Promise<{ sucesso: boolean; classe?: number; tipo?: string; descricao?: string; erro?: string }> {
  const centro = centroide || { lon: (bbox.minLon + bbox.maxLon) / 2, lat: (bbox.minLat + bbox.maxLat) / 2 }
  const buffer = 0.01
  const bboxStr = `${centro.lon - buffer},${centro.lat - buffer},${centro.lon + buffer},${centro.lat + buffer}`

  const baseUrl = "https://geoserver.meioambiente.mg.gov.br/IDE/wms"

  try {
    const params = new URLSearchParams({
      service: "WMS",
      version: "1.1.1",
      request: "GetFeatureInfo",
      layers: LAYER_MAPBIOMAS_NAT_ANT,
      query_layers: LAYER_MAPBIOMAS_NAT_ANT,
      info_format: "application/json",
      srs: "EPSG:4326",
      bbox: bboxStr,
      width: "256",
      height: "256",
      x: "128",
      y: "128",
    })

    const url = `${baseUrl}?${params.toString()}`
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) })

    if (!response.ok) return { sucesso: false, erro: `WMS retornou ${response.status}` }

    const data = await response.json() as { features?: Array<{ properties?: { GRAY_INDEX?: number } }> }
    if (!data.features || data.features.length === 0) return { sucesso: true }

    const grayIndex = data.features[0]?.properties?.GRAY_INDEX
    if (grayIndex === undefined) return { sucesso: true }

    const classeInfo = MAPBIOMAS_CLASSES[grayIndex]
    return {
      sucesso: true,
      classe: grayIndex,
      tipo: classeInfo?.tipo || "desconhecido",
      descricao: classeInfo?.descricao || `Classe ${grayIndex}`,
    }
  } catch (error) {
    return { sucesso: false, erro: (error as Error).message }
  }
}

// ============================================
// VERIFICAR PROTEÇÃO INTEGRAL
// ============================================

export function verificarProtecaoIntegral(categoria: string, nomeUC = ""): boolean {
  const categoriasPI = [
    "PARQUE", "ESTAÇÃO ECOLÓGICA", "ESTACAO ECOLOGICA",
    "RESERVA BIOLÓGICA", "RESERVA BIOLOGICA",
    "MONUMENTO NATURAL", "REFÚGIO DE VIDA SILVESTRE", "REFUGIO DE VIDA SILVESTRE",
    "ESEC", "REBIO", "PARNA", "MONA", "REVIS", "RVS",
    "PE ", "PN ", "PM ",
  ]

  if (categoria) {
    const categoriaUpper = categoria.toUpperCase()
    if (categoriasPI.some((cat) => categoriaUpper.includes(cat))) return true
  }

  if (nomeUC) {
    const nomeUpper = nomeUC.toUpperCase()
    const padroesNome = [
      "PARQUE ESTADUAL", "PARQUE NACIONAL", "PARQUE MUNICIPAL", "PARQUE NATURAL",
      "ESTAÇÃO ECOLÓGICA", "ESTACAO ECOLOGICA",
      "RESERVA BIOLÓGICA", "RESERVA BIOLOGICA",
      "MONUMENTO NATURAL", "REFÚGIO DE VIDA", "REFUGIO DE VIDA",
    ]
    if (padroesNome.some((padrao) => nomeUpper.includes(padrao))) return true
  }

  return false
}

// ============================================
// CALCULAR SOBREPOSIÇÃO
// ============================================

export function calcularSobreposicao(
  geojsonImovel: GeoJSON.FeatureCollection,
  geojsonUC: GeoJSON.Feature,
): {
  area_sobreposicao_ha: number | null
  percentual_sobreposicao: number | null
  area_total_imovel_ha?: number
  area_fora_uc_ha?: number
  tem_sobreposicao?: boolean
  metodo?: string
  erro?: string
} {
  try {
    if (!geojsonImovel?.features?.length) throw new Error("GeoJSON do imóvel inválido")
    if (!geojsonUC) throw new Error("GeoJSON da UC não fornecido")

    const poligonoImovel = geojsonImovel.features[0]
    const areaTotalM2 = turf.area(poligonoImovel)
    const areaTotalHa = areaTotalM2 / 10000

    const coordsImovel = (poligonoImovel.geometry as GeoJSON.Polygon).coordinates as polygonClipping.Polygon
    const coordsUC = geojsonUC.geometry.type === "MultiPolygon"
      ? (geojsonUC.geometry as GeoJSON.MultiPolygon).coordinates[0] as polygonClipping.Polygon
      : (geojsonUC.geometry as GeoJSON.Polygon).coordinates as polygonClipping.Polygon

    const intersection = polygonClipping.intersection(coordsImovel, coordsUC)

    if (!intersection || intersection.length === 0) {
      return { area_sobreposicao_ha: 0, percentual_sobreposicao: 0, area_total_imovel_ha: areaTotalHa, area_fora_uc_ha: areaTotalHa, tem_sobreposicao: false, metodo: "polygon-clipping" }
    }

    const intersectionGeojson: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: intersection.length === 1 ? "Polygon" : "MultiPolygon",
        coordinates: intersection.length === 1 ? intersection[0] : intersection,
      } as GeoJSON.Polygon | GeoJSON.MultiPolygon,
      properties: {},
    }

    const areaSobreposicaoM2 = turf.area(intersectionGeojson)
    const areaSobreposicaoHa = areaSobreposicaoM2 / 10000
    const percentual = (areaSobreposicaoHa / areaTotalHa) * 100

    return {
      area_sobreposicao_ha: parseFloat(areaSobreposicaoHa.toFixed(2)),
      percentual_sobreposicao: parseFloat(percentual.toFixed(1)),
      area_total_imovel_ha: parseFloat(areaTotalHa.toFixed(2)),
      area_fora_uc_ha: parseFloat((areaTotalHa - areaSobreposicaoHa).toFixed(2)),
      tem_sobreposicao: true,
      metodo: "polygon-clipping",
    }
  } catch (error) {
    console.error("Erro ao calcular sobreposição:", (error as Error).message)
    return { area_sobreposicao_ha: null, percentual_sobreposicao: null, erro: (error as Error).message }
  }
}

// ============================================
// CONSULTAR UCs (WFS)
// ============================================

export async function consultarIDESisemaWFS(wkt: string, bbox: BBox): Promise<ResultadoIDESisema & { geometrias?: Record<string, GeoJSON.Feature> }> {
  const ucsEncontradas: UCEncontrada[] = []
  const geometrias: Record<string, GeoJSON.Feature> = {}

  for (const layer of LAYER_UCS) {
    const resultado = await consultarWFS(layer, bbox)
    if (!resultado.sucesso || resultado.features.length === 0) continue

    for (const feature of resultado.features) {
      const props = feature.properties as Record<string, unknown>
      const nome = (props.nome_uc as string) || (props.NOME_UC as string) || (props.nome as string) || (props.NOME as string) || "UC sem nome"
      const categoria = (props.categoria as string) || (props.CATEGORIA as string) || (props.tipo as string) || (props.TIPO as string) || ""
      const grupo = (props.grupo as string) || (props.GRUPO as string) || ""

      // Campo 'grupo' é fonte primária (contém "Proteção Integral" ou "Uso Sustentável")
      const protecaoIntegral = grupo.toUpperCase().includes("PROTE") || verificarProtecaoIntegral(categoria, nome)

      // Deduzir esfera pela layer
      let esfera = (props.esfera_adm as string) || (props.ESFERA_ADM as string) || ""
      if (!esfera) {
        if (layer.includes("federal")) esfera = "Federal"
        else if (layer.includes("estadual")) esfera = "Estadual"
        else if (layer.includes("municipal")) esfera = "Municipal"
      }

      // Evitar duplicatas
      if (ucsEncontradas.some((uc) => uc.nome === nome)) continue

      ucsEncontradas.push({
        nome,
        categoria,
        protecao_integral: protecaoIntegral,
      })

      geometrias[nome] = feature
    }
  }

  if (ucsEncontradas.length === 0) {
    return { sucesso: true, ucs_encontradas: [], geometrias }
  }

  return { sucesso: true, ucs_encontradas: ucsEncontradas, geometrias }
}

// ============================================
// FUNÇÃO PRINCIPAL: ANALISAR IMÓVEL
// ============================================

export async function analisarImovelIDESisema(kmlContent: string): Promise<ResultadoIDESisema> {
  try {
    // 1. Processar KML
    const resultadoKML = await processarKML(kmlContent)
    if (!resultadoKML.sucesso || !resultadoKML.wkt || !resultadoKML.bbox) {
      return { sucesso: false, erro: "Erro ao processar KML: " + resultadoKML.erro, ucs_encontradas: [] }
    }

    // 2. Consultar WFS
    const resultadoWFS = await consultarIDESisemaWFS(resultadoKML.wkt, resultadoKML.bbox)
    if (!resultadoWFS.sucesso) {
      return { sucesso: false, erro: "Erro ao consultar IDE-Sisema: " + resultadoWFS.erro, ucs_encontradas: [], bbox: resultadoKML.bbox, centroide: resultadoKML.centroide }
    }

    if (resultadoWFS.ucs_encontradas.length === 0) {
      return { sucesso: true, ucs_encontradas: [], bbox: resultadoKML.bbox, centroide: resultadoKML.centroide, mensagem: "Imóvel não está dentro de nenhuma Unidade de Conservação" }
    }

    // 3. Calcular sobreposições
    const ucsComSobreposicao: UCEncontrada[] = []

    for (const uc of resultadoWFS.ucs_encontradas) {
      const geometriaUC = resultadoWFS.geometrias?.[uc.nome]

      if (!geometriaUC || !resultadoKML.geojson) {
        ucsComSobreposicao.push({ ...uc, erro: "Geometria da UC não disponível" })
        continue
      }

      const sobreposicao = calcularSobreposicao(resultadoKML.geojson, geometriaUC)
      ucsComSobreposicao.push({
        ...uc,
        area_sobreposicao_ha: sobreposicao.area_sobreposicao_ha,
        percentual_sobreposicao: sobreposicao.percentual_sobreposicao,
        area_total_imovel_ha: sobreposicao.area_total_imovel_ha,
        area_fora_uc_ha: sobreposicao.area_fora_uc_ha,
        tem_sobreposicao: sobreposicao.tem_sobreposicao,
      })
    }

    return {
      sucesso: true,
      ucs_encontradas: ucsComSobreposicao,
      total_ucs: ucsComSobreposicao.length,
      bbox: resultadoKML.bbox,
      centroide: resultadoKML.centroide,
    }
  } catch (error) {
    console.error("Erro na análise geoespacial:", (error as Error).message)
    return { sucesso: false, erro: (error as Error).message, ucs_encontradas: [] }
  }
}

// Re-exportar constantes de camadas para uso externo
export const LAYERS = {
  UCS: LAYER_UCS,
  MATA_ATLANTICA: LAYER_MATA_ATLANTICA,
  BACIAS: LAYER_BACIAS,
  MAPBIOMAS_NAT_ANT: LAYER_MAPBIOMAS_NAT_ANT,
}

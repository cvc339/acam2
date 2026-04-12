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

// ============================================
// COBERTURA VEGETAL DETALHADA (grade de pontos)
// ============================================

export interface ClasseCobertura {
  codigo: number
  classe: string
  descricao: string
  tipo: string
  pontos: number
  percentual: number
  areaEstimadaHa: number
}

export interface ResultadoCoberturaDetalhada {
  sucesso: boolean
  pontosAnalisados: number
  pontosTotal: number
  classes: ClasseCobertura[]
  totaisPorTipo: {
    natural: { pontos: number; percentual: number; areaHa: number }
    antropico: { pontos: number; percentual: number; areaHa: number }
    indefinido: { pontos: number; percentual: number; areaHa: number }
  }
  fonte: string
  ano: number
  metodologia: string
  erro?: string
}

async function consultarPontoMapBiomas(
  layer: string,
  lon: number,
  lat: number,
): Promise<{ codigo: number; classe: string; tipo: string } | null> {
  const baseUrl = "https://geoserver.meioambiente.mg.gov.br/IDE/wms"
  const buffer = 0.0001

  const params = new URLSearchParams({
    SERVICE: "WMS",
    VERSION: "1.1.1",
    REQUEST: "GetFeatureInfo",
    LAYERS: layer,
    QUERY_LAYERS: layer,
    STYLES: "",
    FORMAT: "image/png",
    INFO_FORMAT: "application/json",
    SRS: "EPSG:4674",
    BBOX: `${lon - buffer},${lat - buffer},${lon + buffer},${lat + buffer}`,
    WIDTH: "101",
    HEIGHT: "101",
    X: "50",
    Y: "50",
    FEATURE_COUNT: "1",
  })

  try {
    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) return null

    const data = await response.json() as { features?: Array<{ properties?: { GRAY_INDEX?: number; gray_index?: number } }> }
    if (!data.features?.length) return null

    const props = data.features[0]?.properties
    const codigo = props?.GRAY_INDEX ?? props?.gray_index
    if (codigo === undefined || codigo === null) return null

    const info = MAPBIOMAS_CLASSES[codigo] || { classe: `Código ${codigo}`, tipo: "indefinido", descricao: `Código ${codigo}` }
    return { codigo, classe: info.classe, tipo: info.tipo }
  } catch {
    return null
  }
}

export interface MapaClassificacao {
  width: number
  height: number
  bbox: number[] // [minLon, minLat, maxLon, maxLat]
  dados: number[] // array compacto: código da classe por pixel (0 se fora)
}

/** Paleta de cores MapBiomas para renderização no frontend */
export const MAPBIOMAS_CORES: Record<number, string> = {
  3: "#1f8d49",   // Formação Florestal (verde escuro)
  4: "#7dc975",   // Formação Savânica (verde claro)
  11: "#519799",  // Campo Alagado
  12: "#d6bc74",  // Formação Campestre
  23: "#dd7e6b",  // Praia, Duna e Areal
  29: "#ffaa5f",  // Afloramento Rochoso
  33: "#0000ff",  // Rio, Lago e Oceano
  9: "#7a5900",   // Silvicultura
  15: "#ffd966",  // Pastagem
  20: "#db4d4f",  // Cana
  21: "#ffefc3",  // Mosaico de usos
  24: "#d4271e",  // Área urbanizada
  30: "#9c0027",  // Mineração
  39: "#c27ba0",  // Soja
  41: "#e787f8",  // Outras lavouras temporárias
  46: "#cca0d4",  // Café
  47: "#d082de",  // Citrus
  48: "#cd49e4",  // Outras lavouras perenes
  62: "#660066",  // Algodão
  25: "#bdb76b",  // Outras áreas não vegetadas
}

async function analisarCoberturaWCS(
  geometria: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  areaHa: number,
): Promise<(ResultadoCoberturaDetalhada & { mapaClassificacao?: MapaClassificacao }) | null> {
  try {
    const coords = geometria.type === "Polygon"
      ? geometria.coordinates[0]
      : geometria.coordinates[0][0]

    const lons = coords.map((c) => c[0])
    const lats = coords.map((c) => c[1])
    const bboxObj = {
      minLon: Math.min(...lons), maxLon: Math.max(...lons),
      minLat: Math.min(...lats), maxLat: Math.max(...lats),
    }

    const coverageId = `IDE__${LAYER_MAPBIOMAS_NAT_ANT}`
    const baseUrl = "https://geoserver.meioambiente.mg.gov.br/IDE/ows"

    const params = new URLSearchParams({
      service: "WCS",
      version: "2.0.1",
      request: "GetCoverage",
      CoverageId: coverageId,
      format: "image/tiff",
    })
    const url = `${baseUrl}?${params.toString()}&subset=Long(${bboxObj.minLon},${bboxObj.maxLon})&subset=Lat(${bboxObj.minLat},${bboxObj.maxLat})`

    const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
    if (!response.ok) return null

    const arrayBuffer = await response.arrayBuffer()
    if (arrayBuffer.byteLength < 100) return null

    const GeoTIFF = await import("geotiff")
    const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer)
    const image = await tiff.getImage()
    const rasters = await image.readRasters()
    const data = rasters[0] as Uint8Array | Float32Array
    const width = image.getWidth()
    const height = image.getHeight()
    const imgBbox = image.getBoundingBox() // [minLon, minLat, maxLon, maxLat]
    const resX = (imgBbox[2] - imgBbox[0]) / width
    const resY = (imgBbox[3] - imgBbox[1]) / height

    // Contar pixels por classe (point-in-polygon)
    const contagem: Record<number, { codigo: number; classe: string; descricao: string; tipo: string; pontos: number }> = {}
    let pixelsDentro = 0
    const mapaData: number[] = []

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const pixelLon = imgBbox[0] + (col + 0.5) * resX
        const pixelLat = imgBbox[3] - (row + 0.5) * resY

        let dentro = false
        try {
          dentro = turf.booleanPointInPolygon(turf.point([pixelLon, pixelLat]), geometria)
        } catch { /* fora */ }

        const valor = data[row * width + col]
        if (!dentro || !valor) {
          mapaData.push(0)
          continue
        }

        pixelsDentro++
        mapaData.push(valor)

        if (!contagem[valor]) {
          const info = MAPBIOMAS_CLASSES[valor] || { classe: `Código ${valor}`, tipo: "indefinido", descricao: `Código ${valor}` }
          contagem[valor] = { codigo: valor, classe: info.classe, descricao: info.descricao, tipo: info.tipo, pontos: 0 }
        }
        contagem[valor].pontos++
      }
    }

    if (pixelsDentro < 5) return null

    const classes: ClasseCobertura[] = Object.values(contagem).map((c) => {
      const percentual = parseFloat(((c.pontos / pixelsDentro) * 100).toFixed(1))
      const areaEstimadaHa = parseFloat(((percentual / 100) * areaHa).toFixed(1))
      return { codigo: c.codigo, classe: c.classe, descricao: c.descricao, tipo: c.tipo, pontos: c.pontos, percentual, areaEstimadaHa }
    }).sort((a, b) => b.areaEstimadaHa - a.areaEstimadaHa)

    const totaisPorTipo = { natural: { pontos: 0, percentual: 0, areaHa: 0 }, antropico: { pontos: 0, percentual: 0, areaHa: 0 }, indefinido: { pontos: 0, percentual: 0, areaHa: 0 } }
    for (const c of classes) {
      const tipo = (c.tipo === "natural" || c.tipo === "antropico") ? c.tipo : "indefinido"
      totaisPorTipo[tipo].pontos += c.pontos
      totaisPorTipo[tipo].percentual += c.percentual
      totaisPorTipo[tipo].areaHa += c.areaEstimadaHa
    }

    console.log(`[WCS] ${pixelsDentro} pixels, ${classes.length} classes, mapa ${width}×${height}`)

    return {
      sucesso: true,
      pontosAnalisados: pixelsDentro,
      pontosTotal: pixelsDentro,
      classes,
      totaisPorTipo,
      fonte: "MapBiomas Coleção 9 (WCS via IDE-Sisema)",
      ano: 2023,
      metodologia: `WCS raster ${width}×${height} pixels`,
      mapaClassificacao: { width, height, bbox: imgBbox, dados: mapaData },
    }
  } catch (err) {
    console.warn("[WCS] Falhou:", (err as Error).message, "— usando grade de pontos")
    return null
  }
}

export async function analisarCoberturaDetalhada(
  geometria: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  areaHa: number,
  gridSize = 8,
): Promise<ResultadoCoberturaDetalhada & { mapaClassificacao?: MapaClassificacao }> {
  if (!geometria?.type || !geometria.coordinates) {
    return {
      sucesso: false,
      erro: "Geometria inválida",
      pontosAnalisados: 0,
      pontosTotal: 0,
      classes: [],
      totaisPorTipo: { natural: { pontos: 0, percentual: 0, areaHa: 0 }, antropico: { pontos: 0, percentual: 0, areaHa: 0 }, indefinido: { pontos: 0, percentual: 0, areaHa: 0 } },
      fonte: "MapBiomas Coleção 9",
      ano: 2023,
      metodologia: "N/A",
    }
  }

  // Tentar WCS primeiro (cobertura total por pixel)
  const resultadoWCS = await analisarCoberturaWCS(geometria, areaHa)
  if (resultadoWCS) return resultadoWCS

  // Fallback: grade de pontos
  console.log("[COBERTURA] WCS indisponível, usando grade de pontos")

  const coords = geometria.type === "Polygon"
    ? geometria.coordinates[0]
    : (geometria as GeoJSON.MultiPolygon).coordinates[0][0]

  const lons = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])
  const minLon = Math.min(...lons), maxLon = Math.max(...lons)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)

  const stepLon = (maxLon - minLon) / (gridSize - 1)
  const stepLat = (maxLat - minLat) / (gridSize - 1)

  const pontos: { lon: number; lat: number }[] = []
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      pontos.push({ lon: minLon + i * stepLon, lat: minLat + j * stepLat })
    }
  }

  const contagem: Record<string, { codigo: number; classe: string; descricao: string; tipo: string; pontos: number }> = {}
  let pontosValidos = 0

  for (let idx = 0; idx < pontos.length; idx++) {
    const ponto = pontos[idx]

    const resultado = await consultarPontoMapBiomas(LAYER_MAPBIOMAS_NAT_ANT, ponto.lon, ponto.lat)
    if (resultado) {
      const chave = `${resultado.codigo}_${resultado.classe}`
      if (!contagem[chave]) {
        const info = MAPBIOMAS_CLASSES[resultado.codigo] || { classe: resultado.classe, tipo: resultado.tipo, descricao: resultado.classe }
        contagem[chave] = { codigo: resultado.codigo, classe: info.classe, descricao: info.descricao, tipo: info.tipo, pontos: 0 }
      }
      contagem[chave].pontos++
      pontosValidos++
    }

    // Pausa a cada 5 pontos para não sobrecarregar o servidor
    if (idx % 5 === 0 && idx > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  if (pontosValidos === 0) {
    return {
      sucesso: false,
      erro: "Nenhum ponto válido retornado pelo MapBiomas",
      pontosAnalisados: 0,
      pontosTotal: pontos.length,
      classes: [],
      totaisPorTipo: { natural: { pontos: 0, percentual: 0, areaHa: 0 }, antropico: { pontos: 0, percentual: 0, areaHa: 0 }, indefinido: { pontos: 0, percentual: 0, areaHa: 0 } },
      fonte: "MapBiomas Coleção 9",
      ano: 2023,
      metodologia: `Grade de ${gridSize}×${gridSize} pontos`,
    }
  }

  const classes: ClasseCobertura[] = Object.values(contagem).map((c) => {
    const percentual = parseFloat(((c.pontos / pontosValidos) * 100).toFixed(1))
    const areaEstimadaHa = parseFloat(((percentual / 100) * areaHa).toFixed(1))
    return { codigo: c.codigo, classe: c.classe, descricao: c.descricao, tipo: c.tipo, pontos: c.pontos, percentual, areaEstimadaHa }
  }).sort((a, b) => b.areaEstimadaHa - a.areaEstimadaHa)

  const totaisPorTipo = { natural: { pontos: 0, percentual: 0, areaHa: 0 }, antropico: { pontos: 0, percentual: 0, areaHa: 0 }, indefinido: { pontos: 0, percentual: 0, areaHa: 0 } }
  for (const c of classes) {
    const tipo = (c.tipo === "natural" || c.tipo === "antropico") ? c.tipo : "indefinido"
    totaisPorTipo[tipo].pontos += c.pontos
    totaisPorTipo[tipo].percentual += c.percentual
    totaisPorTipo[tipo].areaHa += c.areaEstimadaHa
  }
  for (const tipo of Object.keys(totaisPorTipo) as Array<keyof typeof totaisPorTipo>) {
    totaisPorTipo[tipo].percentual = parseFloat(totaisPorTipo[tipo].percentual.toFixed(1))
    totaisPorTipo[tipo].areaHa = parseFloat(totaisPorTipo[tipo].areaHa.toFixed(1))
  }

  console.log(`[COBERTURA] ${pontosValidos}/${pontos.length} pontos — Natural: ${totaisPorTipo.natural.percentual}% | Antrópico: ${totaisPorTipo.antropico.percentual}%`)

  return {
    sucesso: true,
    pontosAnalisados: pontosValidos,
    pontosTotal: pontos.length,
    classes,
    totaisPorTipo,
    fonte: "MapBiomas Coleção 9 (via IDE-Sisema)",
    ano: 2023,
    metodologia: `Grade de ${gridSize}×${gridSize} pontos sobre a área`,
  }
}

// ============================================
// DINÂMICA DE COBERTURA VEGETAL (temporal)
// ============================================

const LAYERS_MAPBIOMAS_ANTERIORES = [
  { ano: 2020, camada: "ide_1403_mg_nat_ant_mapbiomas_col9_2020" },
  { ano: 2019, camada: "ide_1403_mg_nat_ant_mapbiomas_col9_2019" },
  { ano: 2018, camada: "ide_1403_mg_nat_ant_mapbiomas_col9_2018" },
  { ano: 2018, camada: "ide_1403_mg_nat_ant_mapbiomas_col8_2018" },
  { ano: 2018, camada: "ide_1403_mg_nat_ant_mapbiomas_col7_2018" },
]

export interface ResultadoDinamicaVegetal {
  sucesso: boolean
  periodoAnalisado: string
  fonteDados: string
  pontosAnalisados: number
  transicoes: {
    coberturaEstavel: { ha: number; percentual: number; descricao: string }
    perdaCobertura: { ha: number; percentual: number; descricao: string }
    ganhoCobertura: { ha: number; percentual: number; descricao: string }
    usoAntropicoEstavel: { ha: number; percentual: number; descricao: string }
  }
  tendencia: "POSITIVA" | "NEGATIVA" | "ESTÁVEL"
  interpretacao: string
  ressalva: string
  erro?: string
}

export async function analisarDinamicaVegetal(
  geometria: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  areaHa: number,
): Promise<ResultadoDinamicaVegetal> {
  if (!geometria?.coordinates) {
    return {
      sucesso: false,
      erro: "Geometria inválida",
      periodoAnalisado: "",
      fonteDados: "",
      pontosAnalisados: 0,
      transicoes: {
        coberturaEstavel: { ha: 0, percentual: 0, descricao: "" },
        perdaCobertura: { ha: 0, percentual: 0, descricao: "" },
        ganhoCobertura: { ha: 0, percentual: 0, descricao: "" },
        usoAntropicoEstavel: { ha: 0, percentual: 0, descricao: "" },
      },
      tendencia: "ESTÁVEL",
      interpretacao: "",
      ressalva: "",
    }
  }

  // Encontrar camada anterior disponível
  const coords = geometria.type === "Polygon"
    ? geometria.coordinates[0]
    : (geometria as GeoJSON.MultiPolygon).coordinates[0][0]
  const lons = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])
  const centroide = { lon: (Math.min(...lons) + Math.max(...lons)) / 2, lat: (Math.min(...lats) + Math.max(...lats)) / 2 }

  let camadaAnterior: { ano: number; camada: string } | null = null
  for (const layer of LAYERS_MAPBIOMAS_ANTERIORES) {
    const teste = await consultarPontoMapBiomas(layer.camada, centroide.lon, centroide.lat)
    if (teste) {
      camadaAnterior = layer
      break
    }
  }

  if (!camadaAnterior) {
    return {
      sucesso: false,
      erro: "Nenhuma camada MapBiomas anterior disponível",
      periodoAnalisado: "",
      fonteDados: "",
      pontosAnalisados: 0,
      transicoes: {
        coberturaEstavel: { ha: 0, percentual: 0, descricao: "" },
        perdaCobertura: { ha: 0, percentual: 0, descricao: "" },
        ganhoCobertura: { ha: 0, percentual: 0, descricao: "" },
        usoAntropicoEstavel: { ha: 0, percentual: 0, descricao: "" },
      },
      tendencia: "ESTÁVEL",
      interpretacao: "",
      ressalva: "",
    }
  }

  // Grade 8x8 para comparação temporal
  const gridSize = 8
  const minLon = Math.min(...lons), maxLon = Math.max(...lons)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const stepLon = (maxLon - minLon) / (gridSize - 1)
  const stepLat = (maxLat - minLat) / (gridSize - 1)

  let coberturaEstavel = 0
  let perdaCobertura = 0
  let ganhoCobertura = 0
  let antropicoEstavel = 0
  let pontosValidos = 0

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lon = minLon + i * stepLon
      const lat = minLat + j * stepLat

      const [atual, anterior] = await Promise.all([
        consultarPontoMapBiomas(LAYER_MAPBIOMAS_NAT_ANT, lon, lat),
        consultarPontoMapBiomas(camadaAnterior.camada, lon, lat),
      ])

      if (!atual || !anterior) continue
      pontosValidos++

      const eraNatural = anterior.tipo === "natural"
      const ehNatural = atual.tipo === "natural"

      if (eraNatural && ehNatural) coberturaEstavel++
      else if (eraNatural && !ehNatural) perdaCobertura++
      else if (!eraNatural && ehNatural) ganhoCobertura++
      else antropicoEstavel++

      // Pausa a cada 5 pares
      if (pontosValidos % 5 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }
  }

  if (pontosValidos === 0) {
    return {
      sucesso: false,
      erro: "Nenhum ponto válido para comparação temporal",
      periodoAnalisado: `${camadaAnterior.ano}-2023`,
      fonteDados: "MapBiomas Coleção 9 (via IDE-Sisema)",
      pontosAnalisados: 0,
      transicoes: {
        coberturaEstavel: { ha: 0, percentual: 0, descricao: "" },
        perdaCobertura: { ha: 0, percentual: 0, descricao: "" },
        ganhoCobertura: { ha: 0, percentual: 0, descricao: "" },
        usoAntropicoEstavel: { ha: 0, percentual: 0, descricao: "" },
      },
      tendencia: "ESTÁVEL",
      interpretacao: "",
      ressalva: "",
    }
  }

  const pctEstavel = parseFloat(((coberturaEstavel / pontosValidos) * 100).toFixed(1))
  const pctPerda = parseFloat(((perdaCobertura / pontosValidos) * 100).toFixed(1))
  const pctGanho = parseFloat(((ganhoCobertura / pontosValidos) * 100).toFixed(1))
  const pctAntropico = parseFloat(((antropicoEstavel / pontosValidos) * 100).toFixed(1))

  const haEstavel = parseFloat(((pctEstavel / 100) * areaHa).toFixed(1))
  const haPerda = parseFloat(((pctPerda / 100) * areaHa).toFixed(1))
  const haGanho = parseFloat(((pctGanho / 100) * areaHa).toFixed(1))
  const haAntropico = parseFloat(((pctAntropico / 100) * areaHa).toFixed(1))

  const saldo = pctGanho - pctPerda
  let tendencia: "POSITIVA" | "NEGATIVA" | "ESTÁVEL"
  if (saldo > 5) tendencia = "POSITIVA"
  else if (saldo < -5) tendencia = "NEGATIVA"
  else tendencia = "ESTÁVEL"

  const interpretacao = tendencia === "ESTÁVEL"
    ? `A área apresenta tendência estável no período ${camadaAnterior.ano}-2023. A cobertura vegetal permaneceu predominantemente estável. ${pctEstavel}% da área manteve cobertura vegetal nativa no período.`
    : tendencia === "POSITIVA"
      ? `A área apresenta tendência positiva (regeneração) no período ${camadaAnterior.ano}-2023. Ganho de ${pctGanho}% de cobertura nativa, com perda de apenas ${pctPerda}%.`
      : `A área apresenta tendência negativa (desmatamento) no período ${camadaAnterior.ano}-2023. Perda de ${pctPerda}% de cobertura nativa, com ganho de apenas ${pctGanho}%.`

  console.log(`[DINÂMICA] ${camadaAnterior.ano}-2023: Estável ${pctEstavel}% | Perda ${pctPerda}% | Ganho ${pctGanho}% → ${tendencia}`)

  return {
    sucesso: true,
    periodoAnalisado: `${camadaAnterior.ano}-2023`,
    fonteDados: "MapBiomas Coleção 9 (via IDE-Sisema)",
    pontosAnalisados: pontosValidos,
    transicoes: {
      coberturaEstavel: { ha: haEstavel, percentual: pctEstavel, descricao: "Cobertura vegetal nativa mantida no período" },
      perdaCobertura: { ha: haPerda, percentual: pctPerda, descricao: "Perda de cobertura florestal no período" },
      ganhoCobertura: { ha: haGanho, percentual: pctGanho, descricao: "Ganho de cobertura florestal no período (regeneração)" },
      usoAntropicoEstavel: { ha: haAntropico, percentual: pctAntropico, descricao: "Uso antrópico mantido no período" },
    },
    tendencia,
    interpretacao,
    ressalva: "Mudanças na cobertura vegetal podem decorrer de múltiplas causas, incluindo atividade antrópica, incêndios florestais, queimas prescritas ou eventos climáticos. A identificação da causa requer investigação de campo.",
  }
}

// Re-exportar constantes de camadas para uso externo
export const LAYERS = {
  UCS: LAYER_UCS,
  MATA_ATLANTICA: LAYER_MATA_ATLANTICA,
  BACIAS: LAYER_BACIAS,
  MAPBIOMAS_NAT_ANT: LAYER_MAPBIOMAS_NAT_ANT,
}

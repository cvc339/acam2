/**
 * Análise Geoespacial para Calculadora SNUC
 *
 * Consulta IDE-Sisema para auto-detecção de fatores FR:
 * - FR3a: ecossistemas protegidos (Mata Atlântica, Veredas, Campos Rupestres)
 * - FR4: patrimônio espeleológico (raio proteção cavidades)
 * - FR5: UCs de Proteção Integral + Zona de Amortecimento
 * - FR6: áreas prioritárias para conservação (Atlas Biodiversidade MG)
 *
 * Reutiliza consultarWFS e processarKML de analise-geoespacial.ts
 */

import * as turf from "@turf/turf"
import {
  processarKML,
  processarGeoJSON,
  verificarProtecaoIntegral,
  type BBox,
  type Centroide,
  type ResultadoProcessamento,
} from "@/lib/services/analise-geoespacial"

// ============================================
// CAMADAS WFS ADICIONAIS (SNUC-específicas)
// ============================================

const IDE_SISEMA_WFS_URLS = [
  "https://geoserver.meioambiente.mg.gov.br/IDE/ows",
  "https://geoserver.meioambiente.mg.gov.br/ows",
  "https://geoserver.meioambiente.mg.gov.br/wfs",
]

// UCs (reutiliza as 3 camadas padrão)
const LAYER_UCS = [
  "ide_2010_mg_unidades_conservacao_federais_pol",
  "ide_2010_mg_unidades_conservacao_estaduais_pol",
  "ide_2010_mg_unidades_conservacao_municipais_pol",
]

// Zonas de Amortecimento
const LAYER_ZA_PLANO_MANEJO = "ide_2011_mg_amortecimento_uc_plano_manejo_pol"
const LAYER_ZA_RAIO_3KM = "ide_2011_mg_amortecimento_uc_raio_3km_pol"

// Ecossistemas protegidos (FR3a)
const LAYER_MATA_ATLANTICA = "ide_2020_mg_area_lei_mata_atlantica_pol"
const LAYER_VEREDAS = "ide_2401_mg_relevancia_reg_fitofisionomia_vereda_pol"
const LAYER_CAMPOS_RUPESTRES = "ide_2401_mg_relevancia_reg_fitofisionomia_campo_rupestre_pol"

// Áreas prioritárias conservação (FR6)
const LAYER_AREAS_PRIORITARIAS = "ide_2014_mg_areas_prioritarias_conservacao_biodiversidade_pol"

// Cavidades (FR4)
const LAYER_CAVIDADES = "ide_2001_mg_raio_protecao_cavidades_pol"

// ============================================
// TIPOS
// ============================================

export interface UCDetectada {
  nome: string
  categoria: string
  esfera: string
  protecaoIntegral: boolean
  motivo: string // "ADA dentro da UC" | "ADA na Zona de Amortecimento"
}

export interface EcossistemaDetectado {
  tipo: string // "mata_atlantica" | "vereda" | "campo_rupestre"
  nome: string
  relevancia?: string
}

export interface AreaPrioritariaDetectada {
  nivel: string // "Especial" | "Extrema" | "Muito Alta" | "Alta"
  fatorId: string // "fr6a" | "fr6b" | "fr6c" | "fr6d"
  nome?: string
}

export interface ResultadoAnaliseSNUC {
  sucesso: boolean
  erro?: string

  // Fatores auto-detectados
  fr3a: boolean // ecossistema protegido
  fr3b: boolean // outros biomas (fallback)
  fr4: boolean  // cavidades
  fr5: boolean  // UC de Proteção Integral / ZA

  // Área prioritária (mais alto nível encontrado)
  areaPrioritaria: AreaPrioritariaDetectada | null

  // Detalhes
  ucsDetectadas: UCDetectada[]
  ecossistemasDetectados: EcossistemaDetectado[]
  cavidadesDetectadas: number

  // Geometria processada
  areaHa?: number
  bbox?: BBox
  centroide?: Centroide
}

// ============================================
// CONSULTA WFS GENÉRICA (local — evita circular dep)
// ============================================

interface ResultadoWFS {
  sucesso: boolean
  features: GeoJSON.Feature[]
  total: number
  erro?: string
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
      }
    } catch {
      continue
    }
  }

  return { sucesso: false, erro: `Não foi possível consultar camada ${layerName}`, features: [], total: 0 }
}

// ============================================
// VERIFICAR UCs + ZONA DE AMORTECIMENTO (FR5)
// ============================================

async function verificarUCsProtecaoIntegral(
  bbox: BBox,
  adaFeature: GeoJSON.Feature,
): Promise<{ fr5: boolean; ucs: UCDetectada[] }> {
  const ucs: UCDetectada[] = []

  // 1. Consultar UCs nas 3 esferas
  for (const layer of LAYER_UCS) {
    const resultado = await consultarWFS(layer, bbox)
    if (!resultado.sucesso || resultado.features.length === 0) continue

    let esfera = "Estadual"
    if (layer.includes("federal")) esfera = "Federal"
    else if (layer.includes("municipal")) esfera = "Municipal"

    for (const feature of resultado.features) {
      const props = feature.properties as Record<string, unknown>
      const nome = (props.nome_uc as string) || (props.NOME_UC as string) || (props.nome as string) || "UC sem nome"
      const categoria = (props.categoria as string) || (props.CATEGORIA as string) || ""
      const grupo = (props.grupo as string) || (props.GRUPO as string) || ""

      const protecaoIntegral = grupo.toUpperCase().includes("PROTE") || verificarProtecaoIntegral(categoria, nome)
      if (!protecaoIntegral) continue

      // Verificar interseção com ADA
      try {
        if (turf.booleanIntersects(adaFeature, feature)) {
          ucs.push({ nome, categoria, esfera, protecaoIntegral: true, motivo: "ADA dentro da UC" })
        }
      } catch {
        // Se falhar interseção geométrica, inclui por bbox overlap
        ucs.push({ nome, categoria, esfera, protecaoIntegral: true, motivo: "ADA na região da UC" })
      }
    }
  }

  // 2. Se nenhuma UC de PI encontrada diretamente, verificar Zona de Amortecimento
  if (ucs.length === 0) {
    // ZA de plano de manejo
    const zaPlano = await consultarWFS(LAYER_ZA_PLANO_MANEJO, bbox)
    if (zaPlano.sucesso && zaPlano.features.length > 0) {
      for (const feature of zaPlano.features) {
        try {
          if (turf.booleanIntersects(adaFeature, feature)) {
            const props = feature.properties as Record<string, unknown>
            const nomeUC = (props.nome_uc as string) || (props.NOME_UC as string) || "UC sem nome"
            ucs.push({ nome: nomeUC, categoria: "Zona de Amortecimento (Plano de Manejo)", esfera: "", protecaoIntegral: true, motivo: "ADA na Zona de Amortecimento" })
          }
        } catch { /* continua */ }
      }
    }

    // ZA ficta (3km)
    if (ucs.length === 0) {
      const zaFicta = await consultarWFS(LAYER_ZA_RAIO_3KM, bbox)
      if (zaFicta.sucesso && zaFicta.features.length > 0) {
        for (const feature of zaFicta.features) {
          try {
            if (turf.booleanIntersects(adaFeature, feature)) {
              const props = feature.properties as Record<string, unknown>
              const nomeUC = (props.nome_uc as string) || (props.NOME_UC as string) || "UC sem nome"
              ucs.push({ nome: nomeUC, categoria: "Zona de Amortecimento (Raio 3km)", esfera: "", protecaoIntegral: true, motivo: "ADA na Zona de Amortecimento" })
            }
          } catch { /* continua */ }
        }
      }
    }
  }

  return { fr5: ucs.length > 0, ucs }
}

// ============================================
// VERIFICAR ECOSSISTEMAS PROTEGIDOS (FR3a / FR3b)
// ============================================

async function verificarEcossistemas(
  bbox: BBox,
  adaFeature: GeoJSON.Feature,
): Promise<{ fr3a: boolean; fr3b: boolean; ecossistemas: EcossistemaDetectado[] }> {
  const ecossistemas: EcossistemaDetectado[] = []

  // 1. Mata Atlântica (sempre FR3a se encontrada)
  const ma = await consultarWFS(LAYER_MATA_ATLANTICA, bbox)
  if (ma.sucesso && ma.features.length > 0) {
    for (const feature of ma.features) {
      try {
        if (turf.booleanIntersects(adaFeature, feature)) {
          ecossistemas.push({ tipo: "mata_atlantica", nome: "Mata Atlântica (Lei 11.428/2006)" })
          return { fr3a: true, fr3b: false, ecossistemas }
        }
      } catch { /* continua */ }
    }
  }

  // 2. Veredas (FR3a se relevância Alta ou Muito Alta)
  const veredas = await consultarWFS(LAYER_VEREDAS, bbox)
  if (veredas.sucesso && veredas.features.length > 0) {
    for (const feature of veredas.features) {
      try {
        if (turf.booleanIntersects(adaFeature, feature)) {
          const props = feature.properties as Record<string, unknown>
          const relevancia = (props.relevancia as string) || (props.RELEVANCIA as string) || ""
          if (relevancia.toUpperCase().includes("ALTA") || relevancia.toUpperCase().includes("MUITO")) {
            ecossistemas.push({ tipo: "vereda", nome: "Vereda", relevancia })
            return { fr3a: true, fr3b: false, ecossistemas }
          }
        }
      } catch { /* continua */ }
    }
  }

  // 3. Campos Rupestres (FR3a se relevância Alta ou Muito Alta)
  const campos = await consultarWFS(LAYER_CAMPOS_RUPESTRES, bbox)
  if (campos.sucesso && campos.features.length > 0) {
    for (const feature of campos.features) {
      try {
        if (turf.booleanIntersects(adaFeature, feature)) {
          const props = feature.properties as Record<string, unknown>
          const relevancia = (props.relevancia as string) || (props.RELEVANCIA as string) || ""
          if (relevancia.toUpperCase().includes("ALTA") || relevancia.toUpperCase().includes("MUITO")) {
            ecossistemas.push({ tipo: "campo_rupestre", nome: "Campo Rupestre", relevancia })
            return { fr3a: true, fr3b: false, ecossistemas }
          }
        }
      } catch { /* continua */ }
    }
  }

  // Nenhum ecossistema protegido encontrado → FR3b (outros biomas)
  return { fr3a: false, fr3b: true, ecossistemas }
}

// ============================================
// VERIFICAR ÁREAS PRIORITÁRIAS (FR6)
// ============================================

async function verificarAreasPrioritarias(
  bbox: BBox,
  adaFeature: GeoJSON.Feature,
): Promise<AreaPrioritariaDetectada | null> {
  const resultado = await consultarWFS(LAYER_AREAS_PRIORITARIAS, bbox)
  if (!resultado.sucesso || resultado.features.length === 0) return null

  // Hierarquia de prioridade (retorna o mais alto encontrado)
  const hierarquia = [
    { nivel: "Especial", fatorId: "fr6a" },
    { nivel: "Extrema", fatorId: "fr6b" },
    { nivel: "Muito Alta", fatorId: "fr6c" },
    { nivel: "Alta", fatorId: "fr6d" },
  ]

  let melhorNivel: AreaPrioritariaDetectada | null = null
  let melhorIdx = hierarquia.length

  for (const feature of resultado.features) {
    try {
      if (!turf.booleanIntersects(adaFeature, feature)) continue

      const props = feature.properties as Record<string, unknown>
      const importancia = (
        (props.importanc as string) ||
        (props.importancia as string) ||
        (props.IMPORTANC as string) ||
        (props.importancia_biologica as string) ||
        ""
      ).trim()

      for (let i = 0; i < hierarquia.length; i++) {
        if (importancia.toUpperCase().includes(hierarquia[i].nivel.toUpperCase()) && i < melhorIdx) {
          melhorIdx = i
          melhorNivel = {
            nivel: hierarquia[i].nivel,
            fatorId: hierarquia[i].fatorId,
            nome: (props.nome as string) || undefined,
          }
          break
        }
      }
    } catch { /* continua */ }
  }

  return melhorNivel
}

// ============================================
// VERIFICAR CAVIDADES (FR4)
// ============================================

async function verificarCavidades(
  bbox: BBox,
  adaFeature: GeoJSON.Feature,
): Promise<number> {
  const resultado = await consultarWFS(LAYER_CAVIDADES, bbox)
  if (!resultado.sucesso || resultado.features.length === 0) return 0

  let count = 0
  for (const feature of resultado.features) {
    try {
      if (turf.booleanIntersects(adaFeature, feature)) count++
    } catch { /* continua */ }
  }

  return count
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================

export async function analisarADASNUC(
  conteudo: string,
  formato: "kml" | "geojson",
): Promise<ResultadoAnaliseSNUC> {
  try {
    // 1. Processar arquivo
    let processado: ResultadoProcessamento
    if (formato === "kml") {
      processado = await processarKML(conteudo)
    } else {
      processado = processarGeoJSON(conteudo)
    }

    if (!processado.sucesso || !processado.feature || !processado.bbox) {
      return {
        sucesso: false,
        erro: processado.erro || "Erro ao processar arquivo geoespacial",
        fr3a: false, fr3b: false, fr4: false, fr5: false,
        areaPrioritaria: null,
        ucsDetectadas: [],
        ecossistemasDetectados: [],
        cavidadesDetectadas: 0,
      }
    }

    const { feature, bbox, centroide, areaHa } = processado

    // 2. Executar análises em paralelo
    const [ucResult, ecoResult, areaPrioritaria, cavidadesCount] = await Promise.all([
      verificarUCsProtecaoIntegral(bbox, feature),
      verificarEcossistemas(bbox, feature),
      verificarAreasPrioritarias(bbox, feature),
      verificarCavidades(bbox, feature),
    ])

    return {
      sucesso: true,
      fr3a: ecoResult.fr3a,
      fr3b: ecoResult.fr3b,
      fr4: cavidadesCount > 0,
      fr5: ucResult.fr5,
      areaPrioritaria,
      ucsDetectadas: ucResult.ucs,
      ecossistemasDetectados: ecoResult.ecossistemas,
      cavidadesDetectadas: cavidadesCount,
      areaHa,
      bbox,
      centroide,
    }
  } catch (error) {
    console.error("Erro na análise SNUC:", (error as Error).message)
    return {
      sucesso: false,
      erro: (error as Error).message,
      fr3a: false, fr3b: false, fr4: false, fr5: false,
      areaPrioritaria: null,
      ucsDetectadas: [],
      ecossistemasDetectados: [],
      cavidadesDetectadas: 0,
    }
  }
}

// Re-exports para conveniência
export { processarKML, processarGeoJSON }

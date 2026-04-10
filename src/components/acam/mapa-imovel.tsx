"use client"

/**
 * Mapa interativo do imóvel — React-Leaflet
 *
 * Mostra o polígono do imóvel (KML processado) e as UCs encontradas.
 * Componente client-only (Leaflet não funciona em SSR).
 */

import { useEffect, useState } from "react"
import type { BBox, Centroide, UCEncontrada } from "@/lib/services/analise-geoespacial"

interface MapaImovelProps {
  bbox: BBox
  centroide: Centroide
  geojsonImovel?: GeoJSON.FeatureCollection
  ucs?: Array<UCEncontrada & { geojson?: GeoJSON.Feature }>
  altura?: string
}

export function MapaImovel({ bbox, centroide, geojsonImovel, ucs, altura = "400px" }: MapaImovelProps) {
  const [MapContainer, setMapContainer] = useState<React.ComponentType<Record<string, unknown>> | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Importar Leaflet dinamicamente (client-only)
    async function loadLeaflet() {
      const L = await import("leaflet")
      const RL = await import("react-leaflet")

      // Fix Leaflet default icon paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      })

      setMapContainer(() => RL.MapContainer as unknown as React.ComponentType<Record<string, unknown>>)
      setMounted(true)
    }
    loadLeaflet()
  }, [])

  if (!mounted || !MapContainer) {
    return (
      <div style={{ height: altura, background: "var(--neutral-100)", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="text-sm text-muted-foreground">Carregando mapa...</span>
      </div>
    )
  }

  return <MapaLeaflet bbox={bbox} centroide={centroide} geojsonImovel={geojsonImovel} ucs={ucs} altura={altura} />
}

// Componente interno que usa React-Leaflet (só renderiza client-side)
function MapaLeaflet({ bbox, centroide, geojsonImovel, ucs, altura }: MapaImovelProps) {
  // Importações precisam ser dinâmicas dentro do componente renderizado
  const [components, setComponents] = useState<{
    MapContainer: React.ComponentType<Record<string, unknown>>
    TileLayer: React.ComponentType<Record<string, unknown>>
    GeoJSON: React.ComponentType<Record<string, unknown>>
    Marker: React.ComponentType<Record<string, unknown>>
    Popup: React.ComponentType<Record<string, unknown>>
  } | null>(null)

  useEffect(() => {
    import("react-leaflet").then((RL) => {
      setComponents({
        MapContainer: RL.MapContainer as unknown as React.ComponentType<Record<string, unknown>>,
        TileLayer: RL.TileLayer as unknown as React.ComponentType<Record<string, unknown>>,
        GeoJSON: RL.GeoJSON as unknown as React.ComponentType<Record<string, unknown>>,
        Marker: RL.Marker as unknown as React.ComponentType<Record<string, unknown>>,
        Popup: RL.Popup as unknown as React.ComponentType<Record<string, unknown>>,
      })
    })

    // Importar CSS do Leaflet
    import("leaflet/dist/leaflet.css")
  }, [])

  if (!components) return null

  const { MapContainer, TileLayer, GeoJSON: GeoJSONLayer, Popup } = components

  const bounds: [[number, number], [number, number]] = [
    [bbox.minLat - 0.01, bbox.minLon - 0.01],
    [bbox.maxLat + 0.01, bbox.maxLon + 0.01],
  ]

  return (
    <div style={{ height: altura, borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--neutral-200)" }}>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <MapContainer
        bounds={bounds}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Polígono do imóvel */}
        {geojsonImovel && (
          <GeoJSONLayer
            data={geojsonImovel}
            style={{ color: "#1a3a2a", weight: 3, fillColor: "#c17f59", fillOpacity: 0.3 }}
          >
            <Popup>Imóvel analisado</Popup>
          </GeoJSONLayer>
        )}

        {/* UCs encontradas */}
        {ucs?.map((uc, i) =>
          uc.geojson ? (
            <GeoJSONLayer
              key={i}
              data={uc.geojson}
              style={{
                color: uc.protecao_integral ? "#16a34a" : "#d97706",
                weight: 2,
                fillColor: uc.protecao_integral ? "#16a34a" : "#d97706",
                fillOpacity: 0.15,
                dashArray: "5,5",
              }}
            >
              <Popup>
                <strong>{uc.nome}</strong><br />
                {uc.categoria}<br />
                {uc.protecao_integral ? "Proteção Integral" : "Uso Sustentável"}
                {uc.percentual_sobreposicao != null && <><br />{uc.percentual_sobreposicao}% de sobreposição</>}
              </Popup>
            </GeoJSONLayer>
          ) : null,
        )}
      </MapContainer>
    </div>
  )
}

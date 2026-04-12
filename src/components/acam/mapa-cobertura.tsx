"use client"

import { useRef, useEffect } from "react"

/** Paleta de cores MapBiomas (espelha MAPBIOMAS_CORES do geoespacial.ts) */
const CORES: Record<number, string> = {
  3: "#1f8d49",   // Formação Florestal
  4: "#7dc975",   // Formação Savânica
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

interface MapaClassificacao {
  width: number
  height: number
  bbox: number[]
  dados: number[]
}

interface MapaCoberturaProps {
  mapa: MapaClassificacao
  classes: Array<{ codigo: number; classe: string; tipo: string; percentual: number }>
}

/**
 * Renderiza mapa de cobertura vegetal MapBiomas usando Canvas.
 * Recebe array de códigos de classe do WCS e coloriza cada pixel.
 */
export function MapaCobertura({ mapa, classes }: MapaCoberturaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !mapa.dados.length) return

    canvas.width = mapa.width
    canvas.height = mapa.height
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.createImageData(mapa.width, mapa.height)

    for (let i = 0; i < mapa.dados.length; i++) {
      const codigo = mapa.dados[i]
      const offset = i * 4

      if (codigo === 0) {
        // Fora do polígono
        imageData.data[offset] = 245
        imageData.data[offset + 1] = 240
        imageData.data[offset + 2] = 230
        imageData.data[offset + 3] = 255
      } else {
        const hex = CORES[codigo] || "#808080"
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        imageData.data[offset] = r
        imageData.data[offset + 1] = g
        imageData.data[offset + 2] = b
        imageData.data[offset + 3] = 255
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }, [mapa])

  // Mostrar todas as classes presentes no mapa (sem filtro de percentual mínimo)
  const classesVisiveis = classes.filter((c) => c.percentual > 0)

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg border"
        style={{ imageRendering: "pixelated" }}
      />
      <div className="flex flex-wrap gap-3 mt-3">
        {classesVisiveis.map((c) => (
          <div key={c.codigo} className="flex items-center gap-1 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: CORES[c.codigo] || "#808080" }} />
            {c.classe}
          </div>
        ))}
      </div>
    </div>
  )
}

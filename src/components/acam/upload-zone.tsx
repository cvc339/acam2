"use client"

import { cn } from "@/lib/utils"

interface UploadZoneProps {
  titulo: string
  descricao: string
  arquivo?: string
  aceita?: string
  onSelect?: () => void
  className?: string
}

export function UploadZone({ titulo, descricao, arquivo, aceita = ".kml,.kmz,.geojson,.json", onSelect, className }: UploadZoneProps) {
  const preenchido = !!arquivo

  return (
    <div className={cn("acam-card acam-upload-card", className)}>
      <h2 className="font-semibold">{titulo}</h2>
      <p>{descricao}</p>
      <div
        className={cn("acam-upload-zone", preenchido && "acam-upload-zone-success")}
        onClick={onSelect}
      >
        <p>{preenchido ? `✓ ${arquivo}` : `Clique para selecionar ${aceita.replace(/\./g, "").replace(/,/g, ", ").toUpperCase()}`}</p>
      </div>
    </div>
  )
}

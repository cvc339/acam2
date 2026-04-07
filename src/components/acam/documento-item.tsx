"use client"

import { cn } from "@/lib/utils"

interface DocumentoItemProps {
  nome: string
  obrigatorio?: boolean
  arquivo?: string
  onSelect?: () => void
  onClear?: () => void
}

export function DocumentoItem({ nome, obrigatorio = false, arquivo, onSelect, onClear }: DocumentoItemProps) {
  const preenchido = !!arquivo

  return (
    <div className="acam-documento-item">
      <div className={cn("acam-documento-status", preenchido && "acam-documento-status-ok")}>
        {preenchido ? "✓" : "?"}
      </div>
      <div className="acam-documento-info">
        <span className="acam-documento-nome">
          {nome}{obrigatorio && " *"}
        </span>
        {arquivo && (
          <span className="acam-documento-arquivo">{arquivo}</span>
        )}
      </div>
      <button
        className="acam-btn acam-btn-sm acam-btn-outline cursor-pointer"
        onClick={preenchido ? onClear : onSelect}
      >
        {preenchido ? "Alterar" : "Selecionar"}
      </button>
    </div>
  )
}

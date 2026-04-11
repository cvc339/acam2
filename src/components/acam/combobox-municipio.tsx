"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { MUNICIPIOS_MG } from "@/lib/data/municipios-mg"

interface ComboboxMunicipioProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/** Remove acentos para busca case/accent-insensitive */
function normalizar(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

export function ComboboxMunicipio({
  value,
  onChange,
  placeholder = "Digite o nome do município",
  className,
}: ComboboxMunicipioProps) {
  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState(value)
  const [destaque, setDestaque] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listaRef = useRef<HTMLUListElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sincroniza busca com value externo
  useEffect(() => {
    setBusca(value)
  }, [value])

  // Filtra municípios pelo termo de busca
  const filtrados = useMemo(() => {
    if (!busca.trim()) return []
    const termo = normalizar(busca)
    // Primeiro os que começam com o termo, depois os que contêm
    const comecam: string[] = []
    const contem: string[] = []
    for (const m of MUNICIPIOS_MG) {
      const norm = normalizar(m)
      if (norm.startsWith(termo)) comecam.push(m)
      else if (norm.includes(termo)) contem.push(m)
    }
    return [...comecam, ...contem].slice(0, 20)
  }, [busca])

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener("mousedown", handleClickFora)
    return () => document.removeEventListener("mousedown", handleClickFora)
  }, [])

  // Scroll no item destacado
  useEffect(() => {
    if (destaque >= 0 && listaRef.current) {
      const item = listaRef.current.children[destaque] as HTMLElement
      item?.scrollIntoView({ block: "nearest" })
    }
  }, [destaque])

  const selecionar = useCallback((nome: string) => {
    onChange(nome)
    setBusca(nome)
    setAberto(false)
    setDestaque(-1)
  }, [onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setBusca(v)
    onChange(v)
    setAberto(v.trim().length > 0)
    setDestaque(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!aberto || filtrados.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setDestaque(d => (d + 1) % filtrados.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setDestaque(d => (d <= 0 ? filtrados.length - 1 : d - 1))
    } else if (e.key === "Enter" && destaque >= 0) {
      e.preventDefault()
      selecionar(filtrados[destaque])
    } else if (e.key === "Escape") {
      setAberto(false)
    }
  }

  return (
    <div ref={wrapperRef} className={`acam-combobox ${className ?? ""}`}>
      <input
        ref={inputRef}
        type="text"
        className="acam-form-input"
        placeholder={placeholder}
        value={busca}
        onChange={handleInputChange}
        onFocus={() => busca.trim() && setAberto(true)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={aberto}
        aria-autocomplete="list"
        autoComplete="off"
      />
      {aberto && filtrados.length > 0 && (
        <ul ref={listaRef} className="acam-combobox-list" role="listbox">
          {filtrados.map((m, i) => (
            <li
              key={m}
              role="option"
              aria-selected={i === destaque}
              className={`acam-combobox-item ${i === destaque ? "acam-combobox-item-active" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); selecionar(m) }}
              onMouseEnter={() => setDestaque(i)}
            >
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

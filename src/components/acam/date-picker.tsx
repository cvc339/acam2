"use client"

import * as React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { parse, format, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { maskDate } from "@/lib/masks"

interface DatePickerProps {
  /** Valor no formato DD/MM/AAAA */
  value: string
  /** Callback com valor mascarado DD/MM/AAAA */
  onChange: (value: string) => void
  /** Placeholder do input */
  placeholder?: string
  /** Campo obrigatório */
  required?: boolean
  /** Estado de erro */
  error?: boolean
  /** Desabilitado */
  disabled?: boolean
  /** Classe CSS adicional no wrapper */
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "DD/MM/AAAA",
  required,
  error,
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Converte string DD/MM/AAAA para Date (se válida)
  const parseDate = useCallback((str: string): Date | undefined => {
    if (str.length !== 10) return undefined
    const parsed = parse(str, "dd/MM/yyyy", new Date())
    return isValid(parsed) ? parsed : undefined
  }, [])

  const selectedDate = parseDate(value)

  // Quando digita no input, aplica máscara
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(maskDate(e.target.value))
  }

  // Quando seleciona no calendário
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "dd/MM/yyyy"))
      setOpen(false)
      // Foco volta pro input
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  // Mês exibido no calendário — segue a data digitada se válida
  const [displayMonth, setDisplayMonth] = useState<Date>(selectedDate ?? new Date())
  useEffect(() => {
    if (selectedDate) setDisplayMonth(selectedDate)
  }, [selectedDate])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={`acam-date-picker ${className ?? ""}`}>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          className={`acam-form-input acam-date-picker-input ${error ? "acam-form-input-error" : ""}`}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          required={required}
          disabled={disabled}
          maxLength={10}
          autoComplete="off"
        />
        <PopoverTrigger
          render={<button type="button" />}
          className="acam-date-picker-btn"
          disabled={disabled}
          aria-label="Abrir calendário"
        >
          <CalendarIcon className="h-4 w-4" />
        </PopoverTrigger>
      </div>
      <PopoverContent align="start" sideOffset={4}>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          month={displayMonth}
          onMonthChange={setDisplayMonth}
          captionLayout="dropdown"
          defaultMonth={selectedDate ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  )
}

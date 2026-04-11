"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/acam/date-picker"

export default function DatePickerShowcase() {
  const [data1, setData1] = useState("")
  const [data2, setData2] = useState("15/03/2024")
  const [data3, setData3] = useState("")
  const [data4, setData4] = useState("")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Date Picker</h1>
        <p className="text-sm mt-1 text-muted-foreground">
          Campo de data com máscara DD/MM/AAAA + calendário em popover.
          Digitação direta com teclado numérico ou seleção visual no calendário
          com navegação por mês e ano.
        </p>
      </div>

      {/* Básico */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Uso básico</CardTitle></CardHeader>
        <CardContent>
          <div style={{ maxWidth: "720px" }}>
            <div className="acam-field">
              <label>Data do evento</label>
              <DatePicker
                value={data1}
                onChange={setData1}
              />
              <div className="hint">Digite DD/MM/AAAA ou clique no ícone para abrir o calendário.</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Com valor inicial */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Com valor pré-preenchido</CardTitle></CardHeader>
        <CardContent>
          <div style={{ maxWidth: "720px" }}>
            <div className="acam-field">
              <label>Data da aprovação da licença</label>
              <DatePicker
                value={data2}
                onChange={setData2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Em grid de formulário */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Em grid de formulário</CardTitle></CardHeader>
        <CardContent>
          <div style={{ maxWidth: "720px" }}>
            <div className="acam-section-title">Dados do processo</div>
            <div className="acam-fg acam-fg-3">
              <div className="acam-field">
                <label>Tipo de licença</label>
                <select className="acam-form-input acam-form-select">
                  <option>Selecione</option>
                  <option>LP</option>
                  <option>LI</option>
                  <option>LO</option>
                </select>
              </div>
              <div className="acam-field">
                <label>Data de aprovação <span className="req">*</span></label>
                <DatePicker
                  value={data3}
                  onChange={setData3}
                  required
                />
              </div>
              <div className="acam-field">
                <label>Data de implantação</label>
                <DatePicker
                  value={data4}
                  onChange={setData4}
                  placeholder="DD/MM/AAAA"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estado de erro */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Estado de erro</CardTitle></CardHeader>
        <CardContent>
          <div style={{ maxWidth: "360px" }}>
            <div className="acam-field">
              <label>Data <span className="req">*</span></label>
              <DatePicker
                value="31/13"
                onChange={() => {}}
                error
              />
              <div className="acam-form-error">Data inválida.</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desabilitado */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Desabilitado</CardTitle></CardHeader>
        <CardContent>
          <div style={{ maxWidth: "360px" }}>
            <div className="acam-field">
              <label>Data</label>
              <DatePicker
                value="01/01/2025"
                onChange={() => {}}
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Código */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Como usar</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">{`import { DatePicker } from "@/components/acam/date-picker"

const [data, setData] = useState("")

<DatePicker
  value={data}
  onChange={setData}
  placeholder="DD/MM/AAAA"   {/* opcional */}
  required                    {/* opcional */}
  error                       {/* opcional — borda vermelha */}
  disabled                    {/* opcional */}
/>

/* Props */
value: string        — valor no formato DD/MM/AAAA
onChange: (v) => void — callback com valor mascarado
placeholder?: string — padrão "DD/MM/AAAA"
required?: boolean
error?: boolean
disabled?: boolean
className?: string

/* Classes CSS */
.acam-date-picker          — wrapper (inline-flex, max-width 200px)
.acam-date-picker-input    — input com padding-right para o ícone
.acam-date-picker-btn      — botão do calendário (absoluto à direita)
.acam-calendar             — container do calendário
.acam-calendar-selected    — dia selecionado (verde)
.acam-calendar-today       — dia atual (borda verde)`}</pre>
        </CardContent>
      </Card>
    </div>
  )
}

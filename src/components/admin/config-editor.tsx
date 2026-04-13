"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatBRL as fmt } from "@/lib/format"

interface ConfigMap {
  [chave: string]: { valor: unknown; descricao: string | null; updated_at: string }
}

interface Props {
  configMap: ConfigMap
}

interface Precos {
  credito_avulso: number
  pacotes: Array<{ nome: string; creditos: number; desconto: number }>
  ferramentas: Record<string, { creditos: number; nome: string }>
}

interface Ufemg {
  ano: number
  valor: number
}

// Lista canônica de ferramentas — garante que ferramentas novas apareçam no editor
const FERRAMENTAS_CANONICAS: Record<string, { creditos: number; nome: string }> = {
  "dest-uc-base": { creditos: 5, nome: "Destinação em UC — Base" },
  "dest-uc-app": { creditos: 6, nome: "Destinação em UC — APP" },
  "dest-uc-ma": { creditos: 7, nome: "Destinação em UC — Mata Atlântica" },
  "dest-servidao": { creditos: 7, nome: "Análise de Servidão/RPPN" },
  "calc-impl-uc": { creditos: 2, nome: "Cálculo de Implantação/Manutenção de UC" },
  "calc-snuc": { creditos: 7, nome: "Calculadora SNUC" },
  "analise-matricula": { creditos: 5, nome: "Análise de Matrícula" },
  "req-mineraria": { creditos: 0.5, nome: "Requerimento Minerária" },
  "req-mata-atlantica": { creditos: 0.5, nome: "Requerimento Mata Atlântica" },
  "req-snuc": { creditos: 0.5, nome: "Requerimento SNUC" },
}

export function ConfigEditor({ configMap }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [erro, setErro] = useState("")

  // Estado editável
  const [ufemg, setUfemg] = useState<Ufemg>(
    (configMap.ufemg?.valor as Ufemg) || { ano: 2026, valor: 5.7899 },
  )

  const [precos, setPrecos] = useState<Precos>(() => {
    const base = (configMap.precos?.valor as Precos) || {
      credito_avulso: 12,
      pacotes: [],
      ferramentas: {},
    }
    // Mesclar ferramentas canônicas com o que está no banco
    const ferramentas = { ...FERRAMENTAS_CANONICAS }
    for (const [id, dados] of Object.entries(base.ferramentas || {})) {
      ferramentas[id] = dados
    }
    return { ...base, ferramentas }
  })

  async function salvar(chave: string, valor: unknown) {
    setSaving(chave)
    setErro("")
    setMensagem("")

    try {
      const res = await fetch("/api/admin/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chave, valor }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErro(data.erro || "Erro ao salvar.")
      } else {
        setMensagem(`"${chave}" atualizado com sucesso.`)
        router.refresh()
      }
    } catch {
      setErro("Erro de comunicação.")
    }

    setSaving("")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      {mensagem && <div className="acam-alert acam-alert-success">{mensagem}</div>}
      {erro && <div className="acam-alert acam-alert-error">{erro}</div>}

      {/* UFEMG */}
      <div className="acam-card">
        <h3 className="font-semibold mb-1">UFEMG</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Unidade Fiscal do Estado de Minas Gerais — valor anual usado nos cálculos.
          {configMap.ufemg && (
            <span className="ml-2">Última atualização: {new Date(configMap.ufemg.updated_at).toLocaleDateString("pt-BR")}</span>
          )}
        </p>

        <div className="acam-fg acam-fg-2">
          <div className="acam-field">
            <label>Ano</label>
            <input
              type="number"
              className="acam-form-input"
              value={ufemg.ano}
              onChange={(e) => setUfemg({ ...ufemg, ano: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
          <div className="acam-field">
            <label>Valor (R$)</label>
            <input
              type="text"
              className="acam-form-input"
              value={String(ufemg.valor).replace(".", ",")}
              onChange={(e) => {
                const val = parseFloat(e.target.value.replace(",", "."))
                if (!isNaN(val)) setUfemg({ ...ufemg, valor: val })
              }}
            />
          </div>
        </div>

        <button
          className="acam-btn acam-btn-primary acam-btn-sm mt-4"
          onClick={() => salvar("ufemg", ufemg)}
          disabled={saving === "ufemg"}
        >
          {saving === "ufemg" ? "Salvando..." : "Salvar UFEMG"}
        </button>
      </div>

      {/* Preço do crédito */}
      <div className="acam-card">
        <h3 className="font-semibold mb-1">Preço do Crédito Avulso</h3>
        <p className="text-sm text-muted-foreground mb-4">Valor unitário do crédito (sem pacote).</p>

        <div className="acam-field" style={{ maxWidth: "12rem" }}>
          <label>Valor por crédito (R$)</label>
          <input
            type="number"
            className="acam-form-input"
            step="0.5"
            min="0"
            value={precos.credito_avulso}
            onChange={(e) => setPrecos({ ...precos, credito_avulso: parseFloat(e.target.value) || 0 })}
          />
        </div>

        {/* Pacotes */}
        <h4 className="font-semibold mt-6 mb-3">Pacotes</h4>
        <div style={{ overflowX: "auto" }}>
          <table className="acam-services-table">
            <thead>
              <tr>
                <th>Pacote</th>
                <th>Créditos</th>
                <th>Desconto (%)</th>
                <th>Preço final</th>
              </tr>
            </thead>
            <tbody>
              {precos.pacotes.map((pacote, i) => (
                <tr key={pacote.nome}>
                  <td className="font-medium">{pacote.nome}</td>
                  <td>
                    <input
                      type="number"
                      className="acam-form-input"
                      style={{ width: "5rem" }}
                      value={pacote.creditos}
                      onChange={(e) => {
                        const novo = [...precos.pacotes]
                        novo[i] = { ...novo[i], creditos: parseInt(e.target.value, 10) || 0 }
                        setPrecos({ ...precos, pacotes: novo })
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="acam-form-input"
                      style={{ width: "5rem" }}
                      step="1"
                      min="0"
                      max="100"
                      value={Math.round(pacote.desconto * 100)}
                      onChange={(e) => {
                        const novo = [...precos.pacotes]
                        novo[i] = { ...novo[i], desconto: (parseInt(e.target.value, 10) || 0) / 100 }
                        setPrecos({ ...precos, pacotes: novo })
                      }}
                    />
                  </td>
                  <td className="text-sm font-semibold">
                    {fmt(pacote.creditos * precos.credito_avulso * (1 - pacote.desconto))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Custos por ferramenta */}
        <h4 className="font-semibold mt-6 mb-3">Custo por Ferramenta (créditos)</h4>
        <div style={{ overflowX: "auto" }}>
          <table className="acam-services-table">
            <thead>
              <tr>
                <th>Ferramenta</th>
                <th>ID</th>
                <th>Créditos</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(precos.ferramentas).map(([id, ferr]) => (
                <tr key={id}>
                  <td className="text-sm">{ferr.nome}</td>
                  <td className="text-xs text-muted-foreground">{id}</td>
                  <td>
                    <input
                      type="number"
                      className="acam-form-input"
                      style={{ width: "5rem" }}
                      step="0.5"
                      min="0"
                      value={ferr.creditos}
                      onChange={(e) => {
                        const novoFerramentas = { ...precos.ferramentas }
                        novoFerramentas[id] = { ...novoFerramentas[id], creditos: parseFloat(e.target.value) || 0 }
                        setPrecos({ ...precos, ferramentas: novoFerramentas })
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          className="acam-btn acam-btn-primary acam-btn-sm mt-4"
          onClick={() => salvar("precos", precos)}
          disabled={saving === "precos"}
        >
          {saving === "precos" ? "Salvando..." : "Salvar Preços e Custos"}
        </button>
      </div>
    </div>
  )
}

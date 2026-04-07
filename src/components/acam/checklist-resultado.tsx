"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CompensacaoIcon, StatusBadge } from "@/components/acam"
import { identificarCompensacoes } from "@/lib/checklist/identificar"
import type { CompensacaoIdentificada } from "@/lib/checklist/identificar"
import type { Compensacao } from "@/components/acam/compensacao-icon"

const todasCompensacoes: { id: Compensacao; nome: string; lei: string; slug: string }[] = [
  { id: "mineraria", nome: "Minerária", lei: "Lei 20.922/2013", slug: "mineraria" },
  { id: "mata-atlantica", nome: "Mata Atlântica", lei: "Lei 11.428/2006", slug: "mata-atlantica" },
  { id: "app", nome: "APP", lei: "Decreto 47.749/2019", slug: "app" },
  { id: "snuc", nome: "SNUC", lei: "Lei 9.985/2000", slug: "snuc" },
  { id: "reserva-legal", nome: "Reserva Legal", lei: "Lei 12.651/2012", slug: "reserva-legal" },
  { id: "reposicao-florestal", nome: "Reposição Florestal", lei: "Lei 20.308/2012", slug: "reposicao-florestal" },
  { id: "ameacadas", nome: "Espécies Ameaçadas", lei: "DN COPAM 147/2010", slug: "especies-ameacadas" },
  { id: "imunes", nome: "Espécies Imunes", lei: "Lei 12.651/2012", slug: "especies-imunes" },
]

export function ChecklistResultado() {
  const [resultados, setResultados] = useState<Map<string, CompensacaoIdentificada>>(new Map())
  const [temResultado, setTemResultado] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("checklist_resultado")
    if (saved) {
      try {
        const respostas = JSON.parse(saved)
        const resultado = identificarCompensacoes(respostas)
        const map = new Map<string, CompensacaoIdentificada>()
        resultado.forEach((r) => map.set(r.id, r))
        setResultados(map)
        setTemResultado(true)
      } catch {
        setTemResultado(false)
      }
    }
  }, [])

  // Buscar nota do SNUC se existir
  const notaSnuc = resultados.get("snuc")?.nota

  return (
    <section>
      <h3 className="mb-2">Compensações Ambientais</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {temResultado
          ? "Compensações identificadas para o seu empreendimento com base no checklist."
          : "Conheça as modalidades de compensação previstas na legislação de MG."
        }
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {todasCompensacoes.map((c) => {
          const resultado = resultados.get(c.id)
          return (
            <Link key={c.id} href={`/compensacoes/${c.slug}`} className="no-underline">
              <div className="acam-card acam-card-hover acam-card-compact cursor-pointer h-full">
                <div style={{ color: "var(--neutral-400)", marginBottom: "var(--spacing-3)" }}>
                  <CompensacaoIcon compensacao={c.id} size={28} />
                </div>
                <h4 className="font-medium text-sm">{c.nome}</h4>
                <p className="text-xs text-muted-foreground mt-1">{c.lei}</p>
                {temResultado && resultado && (
                  <div style={{ marginTop: "var(--spacing-2)" }}>
                    <StatusBadge variant={resultado.status === "verificar" ? "info" : "warning"}>
                      {resultado.status === "verificar" ? "Verificar" : "Provável"}
                    </StatusBadge>
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Nota sobre SNUC quando status = verificar */}
      {notaSnuc && (
        <div className="acam-alert-result" style={{ marginTop: "var(--spacing-4)" }}>
          <strong>Atenção — Compensação SNUC:</strong> {notaSnuc}
        </div>
      )}

      <div className="acam-card acam-card-primary mt-4 flex items-center justify-between" style={{ padding: "var(--spacing-4)" }}>
        <div>
          <p className="font-medium">
            {temResultado
              ? "Deseja refazer a avaliação?"
              : "Quais compensações se aplicam ao seu empreendimento?"
            }
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {temResultado
              ? "Você pode refazer o checklist a qualquer momento."
              : "Responda gratuitamente ao checklist e descubra."
            }
          </p>
        </div>
        <Link href="/checklist" className="acam-btn acam-btn-primary acam-btn-sm">
          {temResultado ? "Refazer avaliação" : "Fazer avaliação gratuita"}
        </Link>
      </div>
    </section>
  )
}

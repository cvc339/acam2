import type { Metadata } from "next"
import { consultoria } from "@/lib/consultoria"
import { GerenciarSlots } from "./gerenciar-slots"
import { GerenciarAgendamentos } from "./gerenciar-agendamentos"

export const metadata: Metadata = { title: "Admin — Consultoria" }

export default async function AdminConsultoriaPage() {
  const hoje = new Date()
  const em12Semanas = new Date(hoje)
  em12Semanas.setDate(em12Semanas.getDate() + 84)

  const [slots, agendamentos] = await Promise.all([
    consultoria.listarTodosSlots(
      hoje.toISOString().slice(0, 10),
      em12Semanas.toISOString().slice(0, 10)
    ),
    consultoria.listarTodosAgendamentos(),
  ])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div>
        <h2 style={{ color: "var(--primary-600)" }}>Consultoria</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie slots disponíveis e acompanhe agendamentos. Criar slots em lote é a forma mais rápida de preencher a agenda semanal.
        </p>
      </div>

      <GerenciarAgendamentos agendamentos={agendamentos} />

      <GerenciarSlots slots={slots} />
    </div>
  )
}

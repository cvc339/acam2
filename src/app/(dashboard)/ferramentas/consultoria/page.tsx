import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/acam"
import { consultoria } from "@/lib/consultoria"
import { creditos } from "@/lib/creditos"
import { FormAgendamento } from "./form-agendamento"

export const metadata: Metadata = {
  title: "Consultoria — Agendamento",
}

export default async function ConsultoriaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [slots, saldo, agendamentos] = await Promise.all([
    consultoria.listarSlotsDisponiveis(),
    creditos.consultarSaldo(user.id),
    consultoria.listarMeusAgendamentos(user.id),
  ])

  const agendamentosAtivos = agendamentos.filter(
    (a) => a.status === "confirmado" || a.status === "reagendado"
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <Link href="/dashboard" className="acam-back-link">← Voltar ao dashboard</Link>

      <PageHeader
        title="Consultoria — Reunião técnica"
        description="Converse com um especialista em compensações ambientais. Reunião online de 30 minutos para tirar dúvidas, discutir o caso ou explorar caminhos. 15 créditos."
      />

      {agendamentosAtivos.length > 0 && (
        <div className="acam-card acam-card-compact">
          <strong>Você já tem {agendamentosAtivos.length === 1 ? "uma reunião agendada" : `${agendamentosAtivos.length} reuniões agendadas`}.</strong>
          <ul style={{ marginTop: "var(--spacing-2)", paddingLeft: "var(--spacing-5)" }}>
            {agendamentosAtivos.map((a) => (
              <li key={a.id}>
                <Link href={`/ferramentas/consultoria/${a.id}`}>
                  {a.slot.data} às {a.slot.hora_inicio.slice(0, 5)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <FormAgendamento
        slots={slots}
        saldo={saldo}
        emailUsuario={user.email ?? ""}
      />
    </div>
  )
}

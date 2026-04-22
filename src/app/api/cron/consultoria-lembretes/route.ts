import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { enviarLembrete24h, enviarLembrete1h } from "@/lib/email/consultoria"
import type { AgendamentoComSlot } from "@/lib/consultoria/types"

/**
 * POST /api/cron/consultoria-lembretes
 *
 * Dispara lembretes de consultoria (24h e 1h antes).
 * Chamado pelo GitHub Actions a cada 15 minutos.
 *
 * Janelas de busca: [24h, 24h+30min] e [1h, 1h+30min].
 * Janela de 30min (em vez de 15min) cobre eventual delay do GitHub Actions
 * sem exigir queda da cadência do cron.
 *
 * Flags `lembrete_24h_enviado` e `lembrete_1h_enviado` garantem idempotência:
 * mesmo que a cron rode duas vezes dentro da janela, não envia duplicado.
 *
 * Autenticação: Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: Request) {
  const cabecalho = request.headers.get("authorization") ?? ""
  const token = cabecalho.startsWith("Bearer ") ? cabecalho.slice(7).trim() : ""
  const secret = process.env.CRON_SECRET

  if (!secret || token !== secret) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 })
  }

  const admin = createAdminClient()
  const agora = new Date()

  const { data, error } = await admin
    .from("agendamentos_consultoria")
    .select("*, slot:slots_consultoria(*)")
    .in("status", ["confirmado", "reagendado"])

  if (error) {
    console.error("[cron/consultoria-lembretes] Erro ao buscar:", error)
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  const agendamentos = (data ?? []) as AgendamentoComSlot[]

  let enviados24h = 0
  let enviados1h = 0
  const erros: string[] = []

  for (const a of agendamentos) {
    // Datetime do slot em America/Sao_Paulo (UTC-3)
    const dataHoraSlot = new Date(`${a.slot.data}T${a.slot.hora_inicio}-03:00`)
    const minutosAteSlot = (dataHoraSlot.getTime() - agora.getTime()) / 60000

    // Janela 24h
    if (!a.lembrete_24h_enviado && minutosAteSlot >= 24 * 60 && minutosAteSlot < 24 * 60 + 30) {
      try {
        await enviarLembrete24h(a)
        await admin
          .from("agendamentos_consultoria")
          .update({ lembrete_24h_enviado: true })
          .eq("id", a.id)
        enviados24h++
      } catch (err) {
        erros.push(`24h/${a.id}: ${(err as Error).message}`)
      }
      continue
    }

    // Janela 1h
    if (!a.lembrete_1h_enviado && minutosAteSlot >= 60 && minutosAteSlot < 90) {
      try {
        await enviarLembrete1h(a)
        await admin
          .from("agendamentos_consultoria")
          .update({ lembrete_1h_enviado: true })
          .eq("id", a.id)
        enviados1h++
      } catch (err) {
        erros.push(`1h/${a.id}: ${(err as Error).message}`)
      }
    }
  }

  console.log(`[cron/consultoria-lembretes] 24h=${enviados24h}, 1h=${enviados1h}, verificados=${agendamentos.length}`)

  return NextResponse.json({
    sucesso: true,
    timestamp: agora.toISOString(),
    agendamentos_verificados: agendamentos.length,
    enviados_24h: enviados24h,
    enviados_1h: enviados1h,
    erros: erros.length > 0 ? erros : undefined,
  })
}

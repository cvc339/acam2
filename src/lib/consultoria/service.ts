/**
 * Módulo centralizado de consultoria — server-side only
 *
 * Responsável por todo o ciclo de vida dos agendamentos:
 * - Listar slots disponíveis (semana corrente + próxima)
 * - Agendar (transação atômica: debita créditos + reserva slot)
 * - Reagendar (com regra de 4h de antecedência, limite de 1 vez)
 * - Cancelar (usuário — sem reembolso; admin — com reembolso)
 * - Concluir (após reunião realizada)
 *
 * Integração com Google Calendar é adicionada na Etapa 2 deste módulo.
 *
 * Uso:
 *   import { consultoria } from "@/lib/consultoria"
 */

import { createAdminClient } from "@/lib/supabase/admin"
import { creditos } from "@/lib/creditos"
import {
  criarEventoReuniao,
  deletarEvento,
  moverEvento,
} from "@/lib/services/google-calendar"
import {
  enviarCancelamentoAdmin,
  enviarConfirmacao,
  enviarReagendamento,
} from "@/lib/email/consultoria"
import type {
  Agendamento,
  AgendamentoComSlot,
  OpcoesAgendar,
  ResultadoAgendamento,
  ResultadoCancelamento,
  ResultadoReagendamento,
  Slot,
  StatusAgendamento,
} from "./types"
import {
  CUSTO_CONSULTORIA,
  HORAS_ANTECEDENCIA_REAGENDAMENTO,
  MINUTOS_REUNIAO,
} from "./types"

function dataHoraDoSlot(slot: Slot): { inicio: Date; fim: Date } {
  const inicio = new Date(`${slot.data}T${slot.hora_inicio}-03:00`)
  const fim = new Date(`${slot.data}T${slot.hora_fim}-03:00`)
  return { inicio, fim }
}

// ============================================
// LEITURA: SLOTS
// ============================================

/**
 * Lista slots disponíveis da semana corrente + próxima.
 * Filtra slots no passado.
 */
export async function listarSlotsDisponiveis(): Promise<Slot[]> {
  const admin = createAdminClient()

  const hoje = new Date()
  const em14Dias = new Date(hoje)
  em14Dias.setDate(em14Dias.getDate() + 14)

  const dataHoje = hoje.toISOString().slice(0, 10)
  const dataLimite = em14Dias.toISOString().slice(0, 10)

  const { data, error } = await admin
    .from("slots_consultoria")
    .select("*")
    .eq("status", "disponivel")
    .gte("data", dataHoje)
    .lte("data", dataLimite)
    .order("data", { ascending: true })
    .order("hora_inicio", { ascending: true })

  if (error) {
    console.error("[consultoria.listarSlotsDisponiveis]", error)
    return []
  }

  const agora = new Date()
  return (data ?? []).filter((slot) => {
    const dataHora = new Date(`${slot.data}T${slot.hora_inicio}`)
    return dataHora > agora
  })
}

// ============================================
// LEITURA: AGENDAMENTOS
// ============================================

export async function listarMeusAgendamentos(
  usuarioId: string
): Promise<AgendamentoComSlot[]> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("agendamentos_consultoria")
    .select("*, slot:slots_consultoria(*)")
    .eq("usuario_id", usuarioId)
    .order("criado_em", { ascending: false })

  if (error) {
    console.error("[consultoria.listarMeusAgendamentos]", error)
    return []
  }

  return (data ?? []) as AgendamentoComSlot[]
}

export async function buscarAgendamento(
  id: string,
  usuarioId?: string
): Promise<AgendamentoComSlot | null> {
  const admin = createAdminClient()

  let query = admin
    .from("agendamentos_consultoria")
    .select("*, slot:slots_consultoria(*)")
    .eq("id", id)

  if (usuarioId) {
    query = query.eq("usuario_id", usuarioId)
  }

  const { data, error } = await query.single()

  if (error || !data) return null
  return data as AgendamentoComSlot
}

// ============================================
// AGENDAR — transação atômica
// ============================================

export async function agendar(opcoes: OpcoesAgendar): Promise<ResultadoAgendamento> {
  const admin = createAdminClient()

  // 1. Reservar slot (atomic: impede race de double-booking)
  const { data: reserva, error: erroReserva } = await admin.rpc(
    "reservar_slot_consultoria",
    { p_slot_id: opcoes.slotId }
  )

  const resultadoReserva = Array.isArray(reserva) ? reserva[0] : reserva
  if (erroReserva || !resultadoReserva?.sucesso) {
    return {
      sucesso: false,
      erro: resultadoReserva?.erro || "Slot indisponível",
    }
  }

  // 2. Debitar créditos
  const resultadoDebito = await creditos.debitar(opcoes.usuarioId, CUSTO_CONSULTORIA, {
    descricao: "Agendamento de consultoria",
    ferramenta_id: "consultoria",
  })

  if (!resultadoDebito.sucesso) {
    // Rollback: liberar slot
    await admin.rpc("liberar_slot_consultoria", { p_slot_id: opcoes.slotId })
    return {
      sucesso: false,
      erro: resultadoDebito.erro || "Saldo insuficiente",
    }
  }

  // 3. Buscar id da transação para vincular ao agendamento
  const { data: transacao } = await admin
    .from("transacoes_creditos")
    .select("id")
    .eq("usuario_id", opcoes.usuarioId)
    .eq("ferramenta_id", "consultoria")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // 4. Criar agendamento
  const { data: agendamento, error: erroInsert } = await admin
    .from("agendamentos_consultoria")
    .insert({
      usuario_id: opcoes.usuarioId,
      slot_id: opcoes.slotId,
      email_reuniao: opcoes.emailReuniao,
      observacoes_usuario: opcoes.observacoes ?? null,
      anexo_url: opcoes.anexoUrl ?? null,
      anexo_nome: opcoes.anexoNome ?? null,
      transacao_credito_id: transacao?.id ?? null,
      status: "confirmado",
    })
    .select("id")
    .single()

  if (erroInsert || !agendamento) {
    // Rollback: reembolsar + liberar slot
    await creditos.reembolsar(opcoes.usuarioId, CUSTO_CONSULTORIA, {
      descricao: "Reembolso — falha ao criar agendamento",
    })
    await admin.rpc("liberar_slot_consultoria", { p_slot_id: opcoes.slotId })
    console.error("[consultoria.agendar] Falha no insert:", erroInsert)
    return {
      sucesso: false,
      erro: "Erro ao criar agendamento. Créditos reembolsados.",
    }
  }

  // 5. Criar evento no Google Calendar com Meet link automático
  const { data: slotInfo } = await admin
    .from("slots_consultoria")
    .select("*")
    .eq("id", opcoes.slotId)
    .single()

  if (slotInfo) {
    const { inicio, fim } = dataHoraDoSlot(slotInfo as Slot)
    const descricao = [
      `Reunião técnica de consultoria em compensações ambientais (${MINUTOS_REUNIAO} min).`,
      opcoes.observacoes ? `\nObservações do cliente:\n${opcoes.observacoes}` : "",
      opcoes.anexoUrl ? `\nRelatório anexado pelo cliente: ${opcoes.anexoUrl}` : "",
    ].join("")

    const evento = await criarEventoReuniao({
      titulo: "Consultoria ACAM",
      descricao,
      inicio,
      fim,
      emailConvidado: opcoes.emailReuniao,
    })

    if (!evento.sucesso) {
      // Rollback total: deletar agendamento, liberar slot, reembolsar
      await admin.from("agendamentos_consultoria").delete().eq("id", agendamento.id)
      await admin.rpc("liberar_slot_consultoria", { p_slot_id: opcoes.slotId })
      await creditos.reembolsar(opcoes.usuarioId, CUSTO_CONSULTORIA, {
        descricao: "Reembolso — falha ao criar evento no Google Calendar",
      })
      return {
        sucesso: false,
        erro: "Não foi possível criar o evento no calendário. Créditos reembolsados.",
      }
    }

    // Salvar evento_gcal_id e link_reuniao no agendamento
    await admin
      .from("agendamentos_consultoria")
      .update({
        evento_gcal_id: evento.eventoId,
        link_reuniao: evento.linkReuniao ?? null,
      })
      .eq("id", agendamento.id)
  }

  // Envia confirmação (fire-and-forget)
  const agendamentoCompleto = await buscarAgendamento(agendamento.id)
  if (agendamentoCompleto) {
    enviarConfirmacao(agendamentoCompleto).catch((err) =>
      console.error("[consultoria.agendar] Falha no email de confirmação:", err)
    )
  }

  return {
    sucesso: true,
    agendamento_id: agendamento.id,
  }
}

// ============================================
// REAGENDAR
// ============================================

export function podeReagendar(
  agendamento: AgendamentoComSlot
): { pode: boolean; motivo?: string } {
  if (agendamento.reagendamento_usado) {
    return { pode: false, motivo: "Reagendamento já utilizado" }
  }

  if (agendamento.status !== "confirmado" && agendamento.status !== "reagendado") {
    return { pode: false, motivo: "Agendamento não está ativo" }
  }

  const dataHoraSlot = new Date(
    `${agendamento.slot.data}T${agendamento.slot.hora_inicio}`
  )
  const agora = new Date()
  const horasAteSlot =
    (dataHoraSlot.getTime() - agora.getTime()) / (1000 * 60 * 60)

  if (horasAteSlot < HORAS_ANTECEDENCIA_REAGENDAMENTO) {
    return {
      pode: false,
      motivo: `Reagendamento deve ser feito com ${HORAS_ANTECEDENCIA_REAGENDAMENTO}h de antecedência`,
    }
  }

  return { pode: true }
}

export async function reagendar(
  agendamentoId: string,
  novoSlotId: string,
  usuarioId: string
): Promise<ResultadoReagendamento> {
  const admin = createAdminClient()

  const agendamento = await buscarAgendamento(agendamentoId, usuarioId)
  if (!agendamento) {
    return { sucesso: false, erro: "Agendamento não encontrado" }
  }

  const check = podeReagendar(agendamento)
  if (!check.pode) {
    return { sucesso: false, erro: check.motivo }
  }

  // Reservar novo slot
  const { data: reserva } = await admin.rpc("reservar_slot_consultoria", {
    p_slot_id: novoSlotId,
  })
  const resultadoReserva = Array.isArray(reserva) ? reserva[0] : reserva
  if (!resultadoReserva?.sucesso) {
    return {
      sucesso: false,
      erro: resultadoReserva?.erro || "Novo slot indisponível",
    }
  }

  // Liberar slot antigo
  await admin.rpc("liberar_slot_consultoria", { p_slot_id: agendamento.slot_id })

  // Atualizar agendamento
  const { error } = await admin
    .from("agendamentos_consultoria")
    .update({
      slot_id: novoSlotId,
      status: "reagendado",
      reagendamento_usado: true,
      lembrete_24h_enviado: false,
      lembrete_1h_enviado: false,
    })
    .eq("id", agendamentoId)

  if (error) {
    // Rollback: voltar slots ao estado anterior
    await admin.rpc("liberar_slot_consultoria", { p_slot_id: novoSlotId })
    await admin.rpc("reservar_slot_consultoria", { p_slot_id: agendamento.slot_id })
    console.error("[consultoria.reagendar] Falha:", error)
    return { sucesso: false, erro: "Erro ao reagendar" }
  }

  // Mover evento no Google Calendar
  if (agendamento.evento_gcal_id) {
    const { data: novoSlot } = await admin
      .from("slots_consultoria")
      .select("*")
      .eq("id", novoSlotId)
      .single()

    if (novoSlot) {
      const { inicio, fim } = dataHoraDoSlot(novoSlot as Slot)
      await moverEvento(agendamento.evento_gcal_id, inicio, fim)
    }
  }

  // Envia email de reagendamento (fire-and-forget)
  const agendamentoAtualizado = await buscarAgendamento(agendamentoId)
  if (agendamentoAtualizado) {
    enviarReagendamento(agendamentoAtualizado).catch((err) =>
      console.error("[consultoria.reagendar] Falha no email de reagendamento:", err)
    )
  }

  return { sucesso: true }
}

// ============================================
// CANCELAR — pelo usuário (sem reembolso)
// ============================================

export async function cancelarPeloUsuario(
  agendamentoId: string,
  usuarioId: string
): Promise<ResultadoCancelamento> {
  const admin = createAdminClient()

  const agendamento = await buscarAgendamento(agendamentoId, usuarioId)
  if (!agendamento) {
    return { sucesso: false, reembolsado: false, erro: "Agendamento não encontrado" }
  }

  if (agendamento.status !== "confirmado" && agendamento.status !== "reagendado") {
    return {
      sucesso: false,
      reembolsado: false,
      erro: "Agendamento não pode ser cancelado",
    }
  }

  await admin.rpc("liberar_slot_consultoria", { p_slot_id: agendamento.slot_id })

  const { error } = await admin
    .from("agendamentos_consultoria")
    .update({ status: "cancelado_usuario" })
    .eq("id", agendamentoId)

  if (error) {
    console.error("[consultoria.cancelarPeloUsuario] Falha:", error)
    return { sucesso: false, reembolsado: false, erro: "Erro ao cancelar" }
  }

  // Deletar evento no Google Calendar (falha silenciosa)
  if (agendamento.evento_gcal_id) {
    await deletarEvento(agendamento.evento_gcal_id)
  }

  return { sucesso: true, reembolsado: false }
}

// ============================================
// CANCELAR — pelo admin (COM reembolso)
// ============================================

export async function cancelarPeloAdmin(
  agendamentoId: string
): Promise<ResultadoCancelamento> {
  const admin = createAdminClient()

  const agendamento = await buscarAgendamento(agendamentoId)
  if (!agendamento) {
    return { sucesso: false, reembolsado: false, erro: "Agendamento não encontrado" }
  }

  if (agendamento.status !== "confirmado" && agendamento.status !== "reagendado") {
    return {
      sucesso: false,
      reembolsado: false,
      erro: "Agendamento não está ativo",
    }
  }

  await admin.rpc("liberar_slot_consultoria", { p_slot_id: agendamento.slot_id })

  const { error } = await admin
    .from("agendamentos_consultoria")
    .update({ status: "cancelado_admin" })
    .eq("id", agendamentoId)

  if (error) {
    console.error("[consultoria.cancelarPeloAdmin] Falha:", error)
    return { sucesso: false, reembolsado: false, erro: "Erro ao cancelar" }
  }

  // Deletar evento no Google Calendar (falha silenciosa)
  if (agendamento.evento_gcal_id) {
    await deletarEvento(agendamento.evento_gcal_id)
  }

  // Reembolsar créditos
  const reembolso = await creditos.reembolsar(
    agendamento.usuario_id,
    CUSTO_CONSULTORIA,
    { descricao: "Reembolso — consultoria cancelada pelo consultor" }
  )

  // Envia email de cancelamento pelo admin (fire-and-forget)
  enviarCancelamentoAdmin(agendamento).catch((err) =>
    console.error("[consultoria.cancelarPeloAdmin] Falha no email:", err)
  )

  return {
    sucesso: true,
    reembolsado: reembolso.sucesso,
  }
}

// ============================================
// CONCLUIR (após reunião realizada)
// ============================================

export async function concluir(agendamentoId: string): Promise<{ sucesso: boolean; erro?: string }> {
  const admin = createAdminClient()

  const { error } = await admin
    .from("agendamentos_consultoria")
    .update({ status: "concluido" })
    .eq("id", agendamentoId)
    .in("status", ["confirmado", "reagendado"])

  if (error) {
    console.error("[consultoria.concluir] Falha:", error)
    return { sucesso: false, erro: error.message }
  }

  return { sucesso: true }
}

// ============================================
// ADMIN: gestão de slots
// ============================================

export async function criarSlot(
  data: string,
  horaInicio: string,
  horaFim: string
): Promise<{ sucesso: boolean; id?: string; erro?: string }> {
  const admin = createAdminClient()

  const { data: slot, error } = await admin
    .from("slots_consultoria")
    .insert({ data, hora_inicio: horaInicio, hora_fim: horaFim })
    .select("id")
    .single()

  if (error) {
    return { sucesso: false, erro: error.message }
  }

  return { sucesso: true, id: slot.id }
}

export async function deletarSlot(
  slotId: string
): Promise<{ sucesso: boolean; erro?: string }> {
  const admin = createAdminClient()

  const { count } = await admin
    .from("agendamentos_consultoria")
    .select("id", { count: "exact", head: true })
    .eq("slot_id", slotId)
    .in("status", ["confirmado", "reagendado"])

  if ((count ?? 0) > 0) {
    return { sucesso: false, erro: "Slot tem agendamento ativo — cancele antes" }
  }

  const { error } = await admin.from("slots_consultoria").delete().eq("id", slotId)

  if (error) return { sucesso: false, erro: error.message }
  return { sucesso: true }
}

export async function listarTodosSlots(dataInicio?: string, dataFim?: string): Promise<Slot[]> {
  const admin = createAdminClient()

  let query = admin.from("slots_consultoria").select("*")
  if (dataInicio) query = query.gte("data", dataInicio)
  if (dataFim) query = query.lte("data", dataFim)

  const { data, error } = await query
    .order("data", { ascending: true })
    .order("hora_inicio", { ascending: true })

  if (error) {
    console.error("[consultoria.listarTodosSlots]", error)
    return []
  }

  return (data ?? []) as Slot[]
}

export async function listarTodosAgendamentos(
  statusFiltro?: StatusAgendamento
): Promise<AgendamentoComSlot[]> {
  const admin = createAdminClient()

  let query = admin
    .from("agendamentos_consultoria")
    .select("*, slot:slots_consultoria(*)")

  if (statusFiltro) {
    query = query.eq("status", statusFiltro)
  }

  const { data, error } = await query.order("criado_em", { ascending: false })

  if (error) {
    console.error("[consultoria.listarTodosAgendamentos]", error)
    return []
  }

  return (data ?? []) as AgendamentoComSlot[]
}

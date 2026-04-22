/**
 * Módulo de consultoria — export público
 *
 * Ponto único de acesso às operações de agendamento.
 *
 * Uso:
 *   import { consultoria } from "@/lib/consultoria"
 *
 *   const slots = await consultoria.listarSlotsDisponiveis()
 *
 *   const resultado = await consultoria.agendar({
 *     usuarioId, slotId, emailReuniao, observacoes, anexoUrl, anexoNome
 *   })
 */

import {
  agendar,
  buscarAgendamento,
  cancelarPeloAdmin,
  cancelarPeloUsuario,
  concluir,
  criarSlot,
  deletarSlot,
  listarMeusAgendamentos,
  listarSlotsDisponiveis,
  listarTodosAgendamentos,
  listarTodosSlots,
  podeReagendar,
  reagendar,
} from "./service"

export const consultoria = {
  // Leitura
  listarSlotsDisponiveis,
  listarMeusAgendamentos,
  buscarAgendamento,

  // Usuário
  agendar,
  reagendar,
  cancelarPeloUsuario,
  podeReagendar,

  // Admin
  cancelarPeloAdmin,
  concluir,
  criarSlot,
  deletarSlot,
  listarTodosSlots,
  listarTodosAgendamentos,
} as const

export type {
  Agendamento,
  AgendamentoComSlot,
  OpcoesAgendar,
  ResultadoAgendamento,
  ResultadoCancelamento,
  ResultadoReagendamento,
  Slot,
  StatusAgendamento,
  StatusSlot,
} from "./types"

export {
  CUSTO_CONSULTORIA,
  HORAS_ANTECEDENCIA_REAGENDAMENTO,
  MINUTOS_REUNIAO,
} from "./types"

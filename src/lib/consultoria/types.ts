/**
 * Tipos do módulo de consultoria
 */

export type StatusSlot = "disponivel" | "reservado" | "bloqueado"

export type StatusAgendamento =
  | "confirmado"
  | "reagendado"
  | "cancelado_usuario"
  | "cancelado_admin"
  | "concluido"

export interface Slot {
  id: string
  data: string // YYYY-MM-DD
  hora_inicio: string // HH:MM:SS
  hora_fim: string // HH:MM:SS
  status: StatusSlot
  created_at: string
}

export interface Agendamento {
  id: string
  usuario_id: string
  slot_id: string
  email_reuniao: string
  link_reuniao: string | null
  evento_gcal_id: string | null
  anexo_url: string | null
  anexo_nome: string | null
  status: StatusAgendamento
  reagendamento_usado: boolean
  transacao_credito_id: string | null
  lembrete_24h_enviado: boolean
  lembrete_1h_enviado: boolean
  observacoes_usuario: string | null
  criado_em: string
  atualizado_em: string
}

export interface AgendamentoComSlot extends Agendamento {
  slot: Slot
}

export interface ResultadoAgendamento {
  sucesso: boolean
  agendamento_id?: string
  erro?: string
}

export interface ResultadoReagendamento {
  sucesso: boolean
  erro?: string
}

export interface ResultadoCancelamento {
  sucesso: boolean
  reembolsado: boolean
  erro?: string
}

export interface OpcoesAgendar {
  usuarioId: string
  slotId: string
  emailReuniao: string
  observacoes?: string
  anexoUrl?: string
  anexoNome?: string
}

export const CUSTO_CONSULTORIA = 15
export const MINUTOS_REUNIAO = 30
export const HORAS_ANTECEDENCIA_REAGENDAMENTO = 4

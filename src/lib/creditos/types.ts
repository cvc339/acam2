/**
 * Tipos do módulo de créditos
 *
 * Centralizados aqui para garantir que todas as partes do sistema
 * (API routes, ferramentas, extrato, webhook) usem os mesmos tipos.
 */

export type TipoTransacao = "compra" | "uso" | "reembolso" | "ajuste"

export interface ResultadoDebito {
  sucesso: boolean
  saldo_restante: number
  erro?: string
}

export interface ResultadoReembolso {
  sucesso: boolean
  saldo_restante: number
}

export interface Transacao {
  id: string
  usuario_id: string
  tipo: TipoTransacao
  quantidade: number
  valor_pago?: number | null
  descricao?: string
  consulta_id?: string | null
  created_at: string
}

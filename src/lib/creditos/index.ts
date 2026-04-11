/**
 * Módulo de créditos — export público
 *
 * Ponto único de acesso para operações de crédito.
 * Toda ferramenta paga (atual e futura) deve usar este módulo.
 *
 * Uso:
 *   import { creditos } from "@/lib/creditos"
 *
 *   // Debitar (atômico, com verificação de saldo)
 *   const resultado = await creditos.debitar(userId, 5, {
 *     descricao: "Análise de UC",
 *     ferramenta_id: "dest-uc-base",
 *   })
 *
 *   // Reembolsar (em caso de falha)
 *   await creditos.reembolsar(userId, 5, {
 *     descricao: "Reembolso — erro no processamento",
 *     consulta_id: "...",
 *   })
 *
 *   // Creditar (webhook de pagamento)
 *   await creditos.creditar(userId, 25, {
 *     valor_pago: 62.50,
 *     pagamento_id: "...",
 *   })
 *
 *   // Consultar saldo
 *   const saldo = await creditos.consultarSaldo(userId)
 */

import { debitar, reembolsar, creditar, consultarSaldo } from "./service"

export const creditos = {
  debitar,
  reembolsar,
  creditar,
  consultarSaldo,
} as const

export type { ResultadoDebito, ResultadoReembolso, TipoTransacao, Transacao } from "./types"

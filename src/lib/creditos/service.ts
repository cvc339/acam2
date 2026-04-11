/**
 * Módulo centralizado de créditos — server-side only
 *
 * TODAS as operações de crédito do sistema passam por aqui.
 * Isso garante que:
 * - Débito atômico (via função Postgres)
 * - Reembolso e crédito usam a mesma lógica
 * - Logs consistentes
 * - Um único ponto para manter e auditar
 *
 * Uso nas API routes:
 *   import { creditos } from "@/lib/creditos"
 *   const resultado = await creditos.debitar(userId, 5, { ... })
 */

import { createAdminClient } from "@/lib/supabase/admin"
import type { ResultadoDebito, ResultadoReembolso } from "./types"

// ============================================
// DÉBITO — via função atômica do Postgres
// ============================================

interface OpcoesDebito {
  descricao?: string
  ferramenta_id?: string
  consulta_id?: string
}

/**
 * Debita créditos do usuário via função atômica.
 * Verifica saldo e insere transação numa única operação (sem race condition).
 */
export async function debitar(
  usuarioId: string,
  quantidade: number,
  opcoes: OpcoesDebito = {}
): Promise<ResultadoDebito> {
  const admin = createAdminClient()

  const { data, error } = await admin.rpc("debitar_creditos", {
    p_usuario_id: usuarioId,
    p_quantidade: quantidade,
    p_descricao: opcoes.descricao || `Uso de ferramenta: ${opcoes.ferramenta_id || "não especificada"}`,
    p_ferramenta_id: opcoes.ferramenta_id || null,
    p_consulta_id: opcoes.consulta_id || null,
  })

  if (error) {
    console.error("[creditos.debitar] Erro na função Postgres:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      usuario: usuarioId,
      quantidade,
      ferramenta_id: opcoes.ferramenta_id,
    })
    return { sucesso: false, saldo_restante: 0, erro: "Erro ao debitar créditos" }
  }

  const resultado = Array.isArray(data) ? data[0] : data
  return {
    sucesso: resultado?.sucesso ?? false,
    saldo_restante: resultado?.saldo_restante ?? 0,
    erro: resultado?.erro,
  }
}

// ============================================
// REEMBOLSO — insert direto (já debitado antes)
// ============================================

interface OpcoesReembolso {
  descricao?: string
  consulta_id?: string
}

/**
 * Reembolsa créditos ao usuário.
 * Insere transação tipo "reembolso" e opcionalmente marca consulta como reembolsada.
 */
export async function reembolsar(
  usuarioId: string,
  quantidade: number,
  opcoes: OpcoesReembolso = {}
): Promise<ResultadoReembolso> {
  const admin = createAdminClient()

  const { error } = await admin.from("transacoes_creditos").insert({
    usuario_id: usuarioId,
    tipo: "reembolso",
    quantidade,
    descricao: opcoes.descricao || "Reembolso",
  })

  if (error) {
    console.error("[creditos.reembolsar] Erro:", {
      code: error.code,
      message: error.message,
      usuario: usuarioId,
      quantidade,
    })
    return { sucesso: false, saldo_restante: 0 }
  }

  // Se tem consulta_id, marcar como reembolsada
  if (opcoes.consulta_id) {
    await admin.from("consultas").update({
      status: "reembolsada",
      updated_at: new Date().toISOString(),
    }).eq("id", opcoes.consulta_id)
  }

  const saldo = await consultarSaldo(usuarioId)
  return { sucesso: true, saldo_restante: saldo }
}

// ============================================
// CRÉDITO — compra confirmada (webhook)
// ============================================

interface OpcoesCredito {
  valor_pago?: number
  pagamento_id?: string
  descricao?: string
}

/**
 * Credita após compra confirmada (chamado pelo webhook de pagamento).
 */
export async function creditar(
  usuarioId: string,
  quantidade: number,
  opcoes: OpcoesCredito = {}
): Promise<{ sucesso: boolean; erro?: string }> {
  const admin = createAdminClient()

  const { error } = await admin.from("transacoes_creditos").insert({
    usuario_id: usuarioId,
    tipo: "compra",
    quantidade,
    valor_pago: opcoes.valor_pago || null,
    descricao: opcoes.descricao || `Compra de ${quantidade} créditos`,
    pagamento_id: opcoes.pagamento_id || null,
  })

  if (error) {
    console.error("[creditos.creditar] Erro:", {
      code: error.code,
      message: error.message,
      usuario: usuarioId,
      quantidade,
    })
    return { sucesso: false, erro: error.message }
  }

  console.log(`[creditos.creditar] ${quantidade} créditos adicionados ao usuário ${usuarioId}`)
  return { sucesso: true }
}

// ============================================
// CONSULTA DE SALDO
// ============================================

/**
 * Retorna o saldo atual do usuário.
 * Usa a view saldo_creditos se disponível, senão calcula.
 */
export async function consultarSaldo(usuarioId: string): Promise<number> {
  const admin = createAdminClient()

  // Tentar via view (mais eficiente)
  const { data, error } = await admin
    .from("saldo_creditos")
    .select("saldo")
    .eq("usuario_id", usuarioId)
    .single()

  if (!error && data) {
    return Number(data.saldo) || 0
  }

  // Fallback: calcular manualmente
  const { data: transacoes } = await admin
    .from("transacoes_creditos")
    .select("tipo, quantidade")
    .eq("usuario_id", usuarioId)

  if (!transacoes) return 0

  return transacoes.reduce((acc, t) => {
    if (["compra", "reembolso", "ajuste"].includes(t.tipo)) return acc + Number(t.quantidade)
    if (t.tipo === "uso") return acc - Number(t.quantidade)
    return acc
  }, 0)
}

/**
 * Teste do fluxo de créditos — verifica integridade end-to-end
 *
 * Testa diretamente no Supabase (sem passar pelo Next.js):
 * 1. Função debitar_creditos existe e service_role tem permissão
 * 2. Débito com saldo suficiente funciona
 * 3. Débito com saldo insuficiente retorna erro (não debita)
 * 4. Reembolso funciona
 * 5. Saldo final é consistente
 *
 * Uso:
 *   npx tsx scripts/testar-creditos.ts
 *
 * Pré-requisitos:
 *   - .env.local com SUPABASE_SERVICE_ROLE_KEY
 *   - Usuário de teste existente no banco
 */

import dotenv from "dotenv"
import path from "path"
import { createClient } from "@supabase/supabase-js"

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias")
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

interface TesteResultado {
  teste: string
  status: "ok" | "falha"
  detalhes: string
}

const resultados: TesteResultado[] = []

function registrar(teste: string, status: "ok" | "falha", detalhes: string) {
  resultados.push({ teste, status, detalhes })
  const icon = status === "ok" ? "✓" : "✗"
  console.log(`  ${icon} ${teste}: ${detalhes}`)
}

async function obterSaldo(usuarioId: string): Promise<number> {
  const { data } = await admin
    .from("transacoes_creditos")
    .select("tipo, quantidade")
    .eq("usuario_id", usuarioId)

  if (!data) return 0
  return data.reduce((acc, t) => {
    if (["compra", "reembolso", "ajuste"].includes(t.tipo)) return acc + Number(t.quantidade)
    if (t.tipo === "uso") return acc - Number(t.quantidade)
    return acc
  }, 0)
}

async function main() {
  console.log("\n" + "=".repeat(60))
  console.log("TESTE DE INTEGRIDADE — SISTEMA DE CRÉDITOS")
  console.log("=".repeat(60))
  console.log(`Supabase: ${SUPABASE_URL}\n`)

  // Buscar um usuário de teste (o primeiro perfil existente)
  const { data: perfis, error: errPerfis } = await admin
    .from("perfis")
    .select("id, email")
    .limit(1)
    .single()

  if (errPerfis || !perfis) {
    console.error("❌ Nenhum usuário encontrado no banco para teste")
    console.error("   Crie um usuário via /registro antes de rodar este teste")
    process.exit(1)
  }

  const userId = perfis.id
  console.log(`Usuário de teste: ${perfis.email} (${userId})\n`)

  // ── Teste 1: Função debitar_creditos existe ──
  console.log("─ Função debitar_creditos")
  const { data: fnTest, error: fnErr } = await admin.rpc("debitar_creditos", {
    p_usuario_id: "00000000-0000-0000-0000-000000000000", // UUID inexistente
    p_quantidade: 0.01,
  })

  if (fnErr) {
    registrar("Função acessível via service_role", "falha",
      `${fnErr.code}: ${fnErr.message}` +
      (fnErr.code === "42501" ? " — GRANT EXECUTE para service_role está faltando!" : ""))
  } else {
    // Com UUID inexistente, deve retornar saldo insuficiente
    const res = Array.isArray(fnTest) ? fnTest[0] : fnTest
    registrar("Função acessível via service_role", "ok",
      `Retornou sucesso=${res?.sucesso}, saldo=${res?.saldo_restante}`)
  }

  // ── Teste 2: Saldo atual ──
  console.log("\n─ Saldo e débito")
  const saldoAntes = await obterSaldo(userId)
  registrar("Saldo atual", "ok", `${saldoAntes} créditos`)

  // ── Teste 3: Crédito de teste (ajuste +1) ──
  const { error: errAjuste } = await admin.from("transacoes_creditos").insert({
    usuario_id: userId,
    tipo: "ajuste",
    quantidade: 1,
    descricao: "[TESTE] Crédito temporário para teste automatizado",
  })

  if (errAjuste) {
    registrar("Inserir ajuste de teste", "falha", errAjuste.message)
  } else {
    registrar("Inserir ajuste de teste (+1)", "ok", "Transação inserida")
  }

  // ── Teste 4: Débito via função atômica ──
  const { data: debData, error: debErr } = await admin.rpc("debitar_creditos", {
    p_usuario_id: userId,
    p_quantidade: 0.5,
    p_descricao: "[TESTE] Débito de teste automatizado",
    p_ferramenta_id: "teste-creditos",
  })

  if (debErr) {
    registrar("Débito atômico (0.5 cr)", "falha", `${debErr.code}: ${debErr.message}`)
  } else {
    const res = Array.isArray(debData) ? debData[0] : debData
    if (res?.sucesso) {
      registrar("Débito atômico (0.5 cr)", "ok", `Saldo restante: ${res.saldo_restante}`)
    } else {
      registrar("Débito atômico (0.5 cr)", "falha", res?.erro || "Resposta inesperada")
    }
  }

  // ── Teste 5: Saldo pós-débito ──
  const saldoPosDebito = await obterSaldo(userId)
  const esperado = saldoAntes + 1 - 0.5
  if (Math.abs(saldoPosDebito - esperado) < 0.01) {
    registrar("Saldo pós-débito consistente", "ok", `${saldoPosDebito} (esperado: ${esperado})`)
  } else {
    registrar("Saldo pós-débito consistente", "falha", `${saldoPosDebito} (esperado: ${esperado})`)
  }

  // ── Teste 6: Reembolso ──
  const { error: errReemb } = await admin.from("transacoes_creditos").insert({
    usuario_id: userId,
    tipo: "reembolso",
    quantidade: 0.5,
    descricao: "[TESTE] Reembolso de teste automatizado",
  })

  if (errReemb) {
    registrar("Reembolso (0.5 cr)", "falha", errReemb.message)
  } else {
    registrar("Reembolso (0.5 cr)", "ok", "Transação inserida")
  }

  // ── Teste 7: Reverter ajuste de teste ──
  const { error: errReverter } = await admin.from("transacoes_creditos").insert({
    usuario_id: userId,
    tipo: "ajuste",
    quantidade: -1,
    descricao: "[TESTE] Reverter crédito temporário",
  })

  // Verificação: saldo deve voltar ao original
  const saldoFinal = await obterSaldo(userId)
  if (Math.abs(saldoFinal - saldoAntes) < 0.01) {
    registrar("Saldo final restaurado", "ok", `${saldoFinal} (original: ${saldoAntes})`)
  } else {
    registrar("Saldo final restaurado", "falha", `${saldoFinal} (original: ${saldoAntes})`)
  }

  // ── Teste 8: Débito com saldo insuficiente ──
  console.log("\n─ Proteções")
  const { data: insufData, error: insufErr } = await admin.rpc("debitar_creditos", {
    p_usuario_id: userId,
    p_quantidade: 999999,
    p_descricao: "[TESTE] Deve falhar por saldo insuficiente",
  })

  if (insufErr) {
    registrar("Rejeitar débito sem saldo", "falha", `Erro inesperado: ${insufErr.message}`)
  } else {
    const res = Array.isArray(insufData) ? insufData[0] : insufData
    if (res?.sucesso === false) {
      registrar("Rejeitar débito sem saldo", "ok", `Bloqueou corretamente: ${res.erro}`)
    } else {
      registrar("Rejeitar débito sem saldo", "falha", "Permitiu débito sem saldo!")
    }
  }

  // ── Resumo ──
  console.log("\n" + "=".repeat(60))
  const total = resultados.length
  const ok = resultados.filter(r => r.status === "ok").length
  const falha = resultados.filter(r => r.status === "falha").length

  if (falha === 0) {
    console.log(`✓ TODOS OS TESTES PASSARAM (${ok}/${total})`)
  } else {
    console.log(`✗ ${falha} TESTE(S) FALHARAM de ${total}`)
    console.log("\nFalhas:")
    resultados.filter(r => r.status === "falha").forEach(r => {
      console.log(`  ✗ ${r.teste}: ${r.detalhes}`)
    })
  }
  console.log("=".repeat(60) + "\n")

  process.exit(falha > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error("Erro fatal:", err)
  process.exit(1)
})

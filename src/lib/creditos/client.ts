/**
 * Débito de créditos — client-side (browser)
 *
 * Módulo centralizado para ferramentas pagas.
 * Importar: import { debitarCreditos } from "@/lib/creditos/client"
 *
 * Uso:
 *   const resultado = await debitarCreditos(5, "dest-uc-base", "Análise de UC")
 *   if (!resultado.ok) {
 *     setErro(resultado.erro)
 *     return
 *   }
 */

interface ResultadoDebitoClient {
  ok: boolean
  erro: string
  saldo_restante: number
}

/** Debita créditos via API. Retorna { ok, erro, saldo_restante }. */
export async function debitarCreditos(
  quantidade: number,
  ferramenta_id: string,
  descricao: string,
): Promise<ResultadoDebitoClient> {
  try {
    const res = await fetch("/api/creditos/debitar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantidade, ferramenta_id, descricao }),
    })

    if (!res.ok) {
      const data = await res.json()
      return { ok: false, erro: data.erro || "Erro ao debitar créditos.", saldo_restante: data.saldo ?? 0 }
    }

    const data = await res.json()
    return { ok: true, erro: "", saldo_restante: data.saldo_restante }
  } catch {
    return { ok: false, erro: "Erro de conexão ao debitar créditos.", saldo_restante: 0 }
  }
}

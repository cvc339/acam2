/**
 * Custos por ferramenta — leitura centralizada da tabela configuracoes
 *
 * Server-side: usar buscarCustoFerramenta() (lê do banco)
 * Client-side: usar o endpoint GET /api/configuracoes?chave=precos
 *
 * Fallback hardcoded para garantir funcionamento se o banco falhar.
 */

import { createAdminClient } from "@/lib/supabase/admin"

const CUSTOS_FALLBACK: Record<string, number> = {
  "dest-uc-base": 5,
  "dest-uc-app": 6,
  "dest-uc-ma": 7,
  "dest-servidao": 7,
  "calc-impl-uc": 2,
  "calc-snuc": 7,
  "analise-matricula": 5,
  "req-mineraria": 0.5,
  "req-mata-atlantica": 0.5,
  "req-snuc": 0.5,
  "consultoria": 15,
}

let _cache: Record<string, number> | null = null
let _cacheTime = 0
const CACHE_TTL = 60000 // 1 minuto

/**
 * Busca o custo de uma ferramenta da tabela configuracoes.
 * Cache de 1 minuto para evitar query a cada request.
 * Server-side only.
 */
export async function buscarCustoFerramenta(ferramentaId: string): Promise<number> {
  const agora = Date.now()

  if (_cache && agora - _cacheTime < CACHE_TTL) {
    return _cache[ferramentaId] ?? CUSTOS_FALLBACK[ferramentaId] ?? 5
  }

  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("configuracoes")
      .select("valor")
      .eq("chave", "precos")
      .single()

    if (data?.valor) {
      const precos = data.valor as { ferramentas?: Record<string, { creditos: number }> }
      if (precos.ferramentas) {
        _cache = {}
        for (const [id, f] of Object.entries(precos.ferramentas)) {
          _cache[id] = f.creditos
        }
        _cacheTime = agora
        return _cache[ferramentaId] ?? CUSTOS_FALLBACK[ferramentaId] ?? 5
      }
    }
  } catch (err) {
    console.warn("[custos] Erro ao buscar configuracoes:", err)
  }

  return CUSTOS_FALLBACK[ferramentaId] ?? 5
}

/** Retorna todos os custos (para exibição em listas) */
export async function buscarTodosCustos(): Promise<Record<string, number>> {
  // Força refresh do cache
  _cache = null
  await buscarCustoFerramenta("dest-uc-base")
  return { ...CUSTOS_FALLBACK, ...(_cache ?? {}) }
}

/** Custos fallback (para client-side quando não pode buscar do banco) */
export { CUSTOS_FALLBACK }

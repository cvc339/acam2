import type { Metadata } from "next"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { StatusBadge } from "@/components/acam"
import { formatBRL as fmt, formatNum as fmtNum } from "@/lib/format"

export const metadata: Metadata = { title: "Admin — Dashboard" }

const FERRAMENTAS: Record<string, string> = {
  "dest-uc-base": "Destinação em UC — Base",
  "dest-uc-app": "Destinação em UC — APP",
  "dest-uc-ma": "Destinação em UC — Mata Atlântica",
  "dest-servidao": "Análise de Servidão/RPPN",
  "calc-impl-uc": "Cálculo Implantação/Manutenção UC",
  "calc-snuc": "Calculadora SNUC",
  "analise-matricula": "Análise de Matrícula",
  "req-mineraria": "Requerimento Minerária",
  "req-mata-atlantica": "Requerimento Mata Atlântica",
  "req-snuc": "Requerimento SNUC",
}

function mesAno(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function mesLabel(key: string): string {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const [ano, mes] = key.split("-")
  return `${meses[parseInt(mes, 10) - 1]}/${ano}`
}

/** Infere ferramenta_id a partir da descrição (registros antigos sem coluna) */
function inferirFerramenta(descricao: string): string {
  const desc = descricao.toLowerCase()
  for (const [id, nome] of Object.entries(FERRAMENTAS)) {
    if (desc.includes(id) || desc.includes(nome.toLowerCase())) return id
  }
  if (desc.includes("modalidade 2") || desc.includes("implantação")) return "calc-impl-uc"
  if (desc.includes("snuc") && !desc.includes("requerimento")) return "calc-snuc"
  if (desc.includes("matrícula") || desc.includes("matricula")) return "analise-matricula"
  if (desc.includes("servidão") || desc.includes("rppn")) return "dest-servidao"
  if (desc.includes("requerimento") && desc.includes("snuc")) return "req-snuc"
  if (desc.includes("requerimento") && desc.includes("mata")) return "req-mata-atlantica"
  if (desc.includes("requerimento") && desc.includes("miner")) return "req-mineraria"
  if (desc.includes("mata atlântica") || desc.includes("mata atlantica")) return "dest-uc-ma"
  if (desc.includes("app")) return "dest-uc-app"
  return "outro"
}

export default async function AdminDashboardPage() {
  const admin = createAdminClient()
  const agora = new Date()
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString()
  const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1).toISOString()
  const fimMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59).toISOString()
  const inicio30d = new Date(agora.getTime() - 30 * 86400000).toISOString()

  // Todas as queries em paralelo
  const [
    { count: totalUsuarios },
    { data: usuariosMes },
    { data: pagamentosAll },
    { data: transacoesUso },
    { data: mensagensNaoLidas },
  ] = await Promise.all([
    admin.from("perfis").select("*", { count: "exact", head: true }),
    admin.from("perfis").select("id").gte("created_at", inicioMes),
    admin.from("pagamentos").select("valor, creditos, status, created_at").eq("status", "aprovado"),
    admin.from("transacoes_creditos").select("quantidade, descricao, ferramenta_id, created_at, usuario_id").eq("tipo", "uso"),
    admin.from("mensagens_contato").select("id").eq("lida", false),
  ])

  // ============================================
  // MÉTRICAS DE RECEITA
  // ============================================

  const receitaTotal = pagamentosAll?.reduce((s, p) => s + Number(p.valor), 0) ?? 0
  const receitaMesAtual = pagamentosAll
    ?.filter((p) => p.created_at >= inicioMes)
    .reduce((s, p) => s + Number(p.valor), 0) ?? 0
  const receitaMesAnterior = pagamentosAll
    ?.filter((p) => p.created_at >= inicioMesAnterior && p.created_at <= fimMesAnterior)
    .reduce((s, p) => s + Number(p.valor), 0) ?? 0

  const variacaoReceita = receitaMesAnterior > 0
    ? ((receitaMesAtual - receitaMesAnterior) / receitaMesAnterior) * 100
    : null

  // ============================================
  // MÉTRICAS DE USO
  // ============================================

  const usosMesAtual = transacoesUso?.filter((t) => t.created_at >= inicioMes) ?? []
  const usosMesAnterior = transacoesUso?.filter((t) => t.created_at >= inicioMesAnterior && t.created_at <= fimMesAnterior) ?? []
  const usos30d = transacoesUso?.filter((t) => t.created_at >= inicio30d) ?? []

  const creditosMes = usosMesAtual.reduce((s, t) => s + Number(t.quantidade), 0)
  const creditosMesAnterior = usosMesAnterior.reduce((s, t) => s + Number(t.quantidade), 0)

  const variacaoUso = creditosMesAnterior > 0
    ? ((creditosMes - creditosMesAnterior) / creditosMesAnterior) * 100
    : null

  // Usuários ativos (últimos 30 dias)
  const usuariosAtivos30d = new Set(usos30d.map((t) => t.usuario_id)).size

  // ============================================
  // RANKING DE FERRAMENTAS (mês atual)
  // ============================================

  const porFerramenta: Record<string, { usos: number; creditos: number }> = {}
  for (const t of usosMesAtual) {
    const fId = t.ferramenta_id || inferirFerramenta(t.descricao || "")
    if (!porFerramenta[fId]) porFerramenta[fId] = { usos: 0, creditos: 0 }
    porFerramenta[fId].usos++
    porFerramenta[fId].creditos += Number(t.quantidade)
  }

  const ranking = Object.entries(porFerramenta)
    .map(([id, d]) => ({ id, nome: FERRAMENTAS[id] || id, ...d }))
    .sort((a, b) => b.creditos - a.creditos)
    .slice(0, 5)

  // ============================================
  // EVOLUÇÃO (últimos 6 meses)
  // ============================================

  const evolucao: Record<string, { usos: number; creditos: number; receita: number; usuarios: Set<string> }> = {}

  // Inicializar os últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    const key = mesAno(d)
    evolucao[key] = { usos: 0, creditos: 0, receita: 0, usuarios: new Set() }
  }

  if (transacoesUso) {
    for (const t of transacoesUso) {
      const key = mesAno(new Date(t.created_at))
      if (evolucao[key]) {
        evolucao[key].usos++
        evolucao[key].creditos += Number(t.quantidade)
        evolucao[key].usuarios.add(t.usuario_id)
      }
    }
  }

  if (pagamentosAll) {
    for (const p of pagamentosAll) {
      const key = mesAno(new Date(p.created_at))
      if (evolucao[key]) {
        evolucao[key].receita += Number(p.valor)
      }
    }
  }

  const meses = Object.entries(evolucao).sort((a, b) => a[0].localeCompare(b[0]))

  // ============================================
  // ATIVIDADE RECENTE (últimos 10 usos)
  // ============================================

  const recentes = (transacoesUso || [])
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10)

  const nomesUsuarios: Record<string, string> = {}
  if (recentes.length > 0) {
    const ids = [...new Set(recentes.map((t) => t.usuario_id))]
    const { data: perfis } = await admin.from("perfis").select("id, nome, email").in("id", ids)
    if (perfis) {
      for (const p of perfis) nomesUsuarios[p.id] = p.nome || p.email
    }
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 style={{ color: "var(--primary-600)" }}>Painel de Gestão</h2>
          <p className="text-sm text-muted-foreground">Saúde do negócio e indicadores-chave</p>
        </div>
        {(mensagensNaoLidas?.length ?? 0) > 0 && (
          <Link href="/admin/mensagens" className="acam-btn acam-btn-ghost acam-btn-sm" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <StatusBadge variant="error">{mensagensNaoLidas!.length}</StatusBadge>
            mensagem(ns) nova(s)
          </Link>
        )}
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita do mês */}
        <div className="acam-card acam-stat-card">
          <div className="acam-stat-card-value">{fmt(receitaMesAtual)}</div>
          <div className="acam-stat-card-label">Receita no mês</div>
          {variacaoReceita !== null && (
            <div className="text-xs mt-1" style={{ color: variacaoReceita >= 0 ? "var(--success)" : "var(--error)" }}>
              {variacaoReceita >= 0 ? "↑" : "↓"} {fmtNum(Math.abs(variacaoReceita), 0)}% vs. mês anterior
            </div>
          )}
        </div>

        {/* Créditos consumidos no mês */}
        <div className="acam-card acam-stat-card">
          <div className="acam-stat-card-value">{creditosMes}</div>
          <div className="acam-stat-card-label">Créditos consumidos (mês)</div>
          {variacaoUso !== null && (
            <div className="text-xs mt-1" style={{ color: variacaoUso >= 0 ? "var(--success)" : "var(--error)" }}>
              {variacaoUso >= 0 ? "↑" : "↓"} {fmtNum(Math.abs(variacaoUso), 0)}% vs. mês anterior
            </div>
          )}
        </div>

        {/* Usuários ativos */}
        <div className="acam-card acam-stat-card">
          <div className="acam-stat-card-value">{usuariosAtivos30d}</div>
          <div className="acam-stat-card-label">Usuários ativos (30d)</div>
          <div className="text-xs text-muted-foreground mt-1">
            de {totalUsuarios ?? 0} cadastrados · {(usuariosMes?.length ?? 0)} novos no mês
          </div>
        </div>

        {/* Receita total acumulada */}
        <div className="acam-card acam-stat-card">
          <div className="acam-stat-card-value">{fmt(receitaTotal)}</div>
          <div className="acam-stat-card-label">Receita acumulada</div>
          <div className="text-xs text-muted-foreground mt-1">
            {(transacoesUso?.length ?? 0)} usos totais
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ferramentas mais usadas (mês) */}
        <div className="acam-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 className="font-semibold">Ferramentas mais usadas <span className="text-xs font-normal text-muted-foreground">(este mês)</span></h3>
            <Link href="/admin/consultas" className="text-xs text-muted-foreground">Detalhes →</Link>
          </div>
          {ranking.length > 0 ? (
            <div className="space-y-0">
              {ranking.map((r, i) => {
                const totalCrMes = usosMesAtual.reduce((s, t) => s + Number(t.quantidade), 0)
                const pct = totalCrMes > 0 ? (r.creditos / totalCrMes) * 100 : 0
                return (
                  <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0", borderBottom: "1px solid var(--grey-100)" }}>
                    <span className="text-sm font-bold" style={{ color: "var(--primary-600)", width: "1.25rem" }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div className="text-sm font-medium">{r.nome}</div>
                      <div className="text-xs text-muted-foreground">{r.usos} usos · {r.creditos} cr</div>
                    </div>
                    <div style={{ width: "5rem" }}>
                      <div style={{ width: "100%", height: "0.4rem", background: "var(--grey-200)", borderRadius: "9999px", overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: "var(--primary-600)", borderRadius: "9999px" }} />
                      </div>
                      <div className="text-xs text-muted-foreground text-right">{fmtNum(pct, 0)}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum uso neste mês.</p>
          )}
        </div>

        {/* Evolução 6 meses */}
        <div className="acam-card">
          <h3 className="font-semibold mb-4">Evolução mensal <span className="text-xs font-normal text-muted-foreground">(últimos 6 meses)</span></h3>
          <div style={{ overflowX: "auto" }}>
            <table className="acam-services-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Usos</th>
                  <th>Créditos</th>
                  <th>Receita</th>
                  <th>Ativos</th>
                </tr>
              </thead>
              <tbody>
                {meses.map(([key, dados]) => (
                  <tr key={key}>
                    <td className="font-medium">{mesLabel(key)}</td>
                    <td>{dados.usos}</td>
                    <td>{dados.creditos} cr</td>
                    <td className="font-semibold">{dados.receita > 0 ? fmt(dados.receita) : "—"}</td>
                    <td>{dados.usuarios.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Atividade recente */}
      <div className="acam-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 className="font-semibold">Atividade recente</h3>
          <Link href="/admin/consultas" className="text-xs text-muted-foreground">Ver tudo →</Link>
        </div>
        {recentes.length > 0 ? (
          <div className="space-y-0">
            {recentes.map((t, i) => {
              const fId = t.ferramenta_id || inferirFerramenta(t.descricao || "")
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: "1px solid var(--grey-100)" }}>
                  <div>
                    <div className="text-sm">{FERRAMENTAS[fId] || t.descricao || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      <Link href={`/admin/usuarios/${t.usuario_id}`} style={{ color: "var(--primary-600)" }}>
                        {nomesUsuarios[t.usuario_id] || "Usuário"}
                      </Link>
                      {" · "}{new Date(t.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <StatusBadge variant="primary">{Number(t.quantidade)} cr</StatusBadge>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
        )}
      </div>
    </div>
  )
}

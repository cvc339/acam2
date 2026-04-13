import type { Metadata } from "next"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { StatusBadge } from "@/components/acam"
import { formatBRL as fmt, formatNum as fmtNum } from "@/lib/format"

export const metadata: Metadata = { title: "Admin — Uso e Faturamento" }

interface Props {
  searchParams: Promise<{ periodo?: string }>
}

const FERRAMENTAS: Record<string, { nome: string; tipo: "analise" | "calculo" | "requerimento" }> = {
  "dest-uc-base": { nome: "Destinação em UC — Base", tipo: "analise" },
  "dest-uc-app": { nome: "Destinação em UC — APP", tipo: "analise" },
  "dest-uc-ma": { nome: "Destinação em UC — Mata Atlântica", tipo: "analise" },
  "dest-servidao": { nome: "Análise de Servidão/RPPN", tipo: "analise" },
  "calc-impl-uc": { nome: "Cálculo Implantação/Manutenção UC", tipo: "calculo" },
  "calc-snuc": { nome: "Calculadora SNUC", tipo: "calculo" },
  "analise-matricula": { nome: "Análise de Matrícula", tipo: "analise" },
  "req-mineraria": { nome: "Requerimento Minerária", tipo: "requerimento" },
  "req-mata-atlantica": { nome: "Requerimento Mata Atlântica", tipo: "requerimento" },
  "req-snuc": { nome: "Requerimento SNUC", tipo: "requerimento" },
}

const PERIODOS = [
  { id: "7d", label: "7 dias", dias: 7 },
  { id: "30d", label: "30 dias", dias: 30 },
  { id: "90d", label: "90 dias", dias: 90 },
  { id: "6m", label: "6 meses", dias: 180 },
  { id: "tudo", label: "Tudo", dias: 0 },
]

const TIPO_LABELS: Record<string, string> = {
  analise: "Análises",
  calculo: "Cálculos",
  requerimento: "Requerimentos",
}

function dateLimite(dias: number): string | null {
  if (dias === 0) return null
  return new Date(Date.now() - dias * 86400000).toISOString()
}

function inferirFerramenta(descricao: string): string {
  const desc = descricao.toLowerCase()
  for (const [id, f] of Object.entries(FERRAMENTAS)) {
    if (desc.includes(id) || desc.includes(f.nome.toLowerCase())) return id
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

function mesAno(d: string): string {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`
}

function mesLabel(key: string): string {
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  const [ano, mes] = key.split("-")
  return `${meses[parseInt(mes, 10) - 1]}/${ano}`
}

export default async function AdminUsoFaturamentoPage({ searchParams }: Props) {
  const params = await searchParams
  const periodoId = params.periodo || "30d"
  const periodo = PERIODOS.find((p) => p.id === periodoId) || PERIODOS[1]
  const desde = dateLimite(periodo.dias)

  const admin = createAdminClient()

  // Dados em paralelo
  let queryUso = admin
    .from("transacoes_creditos")
    .select("quantidade, ferramenta_id, descricao, created_at, usuario_id")
    .eq("tipo", "uso")
    .order("created_at", { ascending: false })

  let queryReceita = admin
    .from("pagamentos")
    .select("valor, creditos, created_at")
    .eq("status", "aprovado")

  if (desde) {
    queryUso = queryUso.gte("created_at", desde)
    queryReceita = queryReceita.gte("created_at", desde)
  }

  // Preço do crédito
  const [{ data: transacoes }, { data: pagamentos }, { data: configPrecos }] = await Promise.all([
    queryUso,
    queryReceita,
    admin.from("configuracoes").select("valor").eq("chave", "precos").single(),
  ])

  const creditoAvulso = (configPrecos?.valor as { credito_avulso?: number })?.credito_avulso ?? 12

  // ============================================
  // POR FERRAMENTA
  // ============================================

  interface DadosFerr { usos: number; creditos: number; usuarios: Set<string>; tipo: string }
  const porFerramenta: Record<string, DadosFerr> = {}

  const usuariosAtivos = new Set<string>()
  let totalCreditos = 0

  if (transacoes) {
    for (const t of transacoes) {
      const fId = t.ferramenta_id || inferirFerramenta(t.descricao || "")
      const tipoFerr = FERRAMENTAS[fId]?.tipo || "outro"
      if (!porFerramenta[fId]) porFerramenta[fId] = { usos: 0, creditos: 0, usuarios: new Set(), tipo: tipoFerr }
      porFerramenta[fId].usos++
      porFerramenta[fId].creditos += Number(t.quantidade)
      porFerramenta[fId].usuarios.add(t.usuario_id)
      usuariosAtivos.add(t.usuario_id)
      totalCreditos += Number(t.quantidade)
    }
  }

  const ranking = Object.entries(porFerramenta)
    .map(([id, d]) => ({
      id,
      nome: FERRAMENTAS[id]?.nome || id,
      tipo: d.tipo,
      usos: d.usos,
      creditos: d.creditos,
      usuariosUnicos: d.usuarios.size,
      ticketMedio: d.usos > 0 ? d.creditos / d.usos : 0,
      faturamento: d.creditos * creditoAvulso,
    }))
    .sort((a, b) => b.faturamento - a.faturamento)

  const receitaReal = pagamentos?.reduce((s, p) => s + Number(p.valor), 0) ?? 0
  const totalUsos = transacoes?.length ?? 0

  // ============================================
  // POR TIPO DE FERRAMENTA (análise, cálculo, requerimento)
  // ============================================

  const porTipo: Record<string, { usos: number; creditos: number; faturamento: number }> = {}
  for (const r of ranking) {
    const t = r.tipo
    if (!porTipo[t]) porTipo[t] = { usos: 0, creditos: 0, faturamento: 0 }
    porTipo[t].usos += r.usos
    porTipo[t].creditos += r.creditos
    porTipo[t].faturamento += r.faturamento
  }

  // ============================================
  // EVOLUÇÃO MENSAL
  // ============================================

  const porMes: Record<string, { usos: number; creditos: number; receita: number; usuarios: Set<string> }> = {}

  if (transacoes) {
    for (const t of transacoes) {
      const key = mesAno(t.created_at)
      if (!porMes[key]) porMes[key] = { usos: 0, creditos: 0, receita: 0, usuarios: new Set() }
      porMes[key].usos++
      porMes[key].creditos += Number(t.quantidade)
      porMes[key].usuarios.add(t.usuario_id)
    }
  }

  if (pagamentos) {
    for (const p of pagamentos) {
      const key = mesAno(p.created_at)
      if (!porMes[key]) porMes[key] = { usos: 0, creditos: 0, receita: 0, usuarios: new Set() }
      porMes[key].receita += Number(p.valor)
    }
  }

  const mesesOrdenados = Object.entries(porMes).sort((a, b) => b[0].localeCompare(a[0]))

  // ============================================
  // ÚLTIMOS USOS
  // ============================================

  const recentes = transacoes?.slice(0, 20) || []
  const nomesUsuarios: Record<string, string> = {}

  if (recentes.length > 0) {
    const ids = [...new Set(recentes.map((t) => t.usuario_id))]
    const { data: perfis } = await admin.from("perfis").select("id, nome, email").in("id", ids)
    if (perfis) {
      for (const p of perfis) nomesUsuarios[p.id] = p.nome || p.email
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ color: "var(--primary-600)" }}>Uso e Faturamento</h2>
          <p className="text-sm text-muted-foreground">Análise detalhada de como as ferramentas estão sendo utilizadas</p>
        </div>

        {/* Seletor de período */}
        <div style={{ display: "flex", gap: "0.25rem", background: "var(--grey-100)", borderRadius: "var(--radius)", padding: "0.2rem" }}>
          {PERIODOS.map((p) => (
            <a
              key={p.id}
              href={`/admin/consultas?periodo=${p.id}`}
              style={{
                padding: "0.4rem 0.75rem",
                fontSize: "0.8rem",
                borderRadius: "var(--radius)",
                textDecoration: "none",
                fontWeight: periodoId === p.id ? 600 : 400,
                background: periodoId === p.id ? "white" : "transparent",
                color: periodoId === p.id ? "var(--primary-600)" : "var(--grey-600)",
                boxShadow: periodoId === p.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {p.label}
            </a>
          ))}
        </div>
      </div>

      {/* KPIs do período */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="acam-card acam-stat-card">
          <div className="acam-stat-card-value">{totalUsos}</div>
          <div className="acam-stat-card-label">Usos no período</div>
        </div>
        <div className="acam-card acam-stat-card">
          <div className="acam-stat-card-value">{totalCreditos} cr</div>
          <div className="acam-stat-card-label">Créditos consumidos</div>
        </div>
        <div className="acam-card acam-stat-card">
          <div className="acam-stat-card-value">{fmt(receitaReal)}</div>
          <div className="acam-stat-card-label">Receita (pagamentos)</div>
        </div>
        <div className="acam-card acam-stat-card">
          <div className="acam-stat-card-value">{usuariosAtivos.size}</div>
          <div className="acam-stat-card-label">Usuários ativos</div>
        </div>
      </div>

      {/* Mix por tipo de ferramenta */}
      {Object.keys(porTipo).length > 0 && (
        <div className="acam-card">
          <h3 className="font-semibold mb-4">Distribuição por Categoria</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(porTipo)
              .sort((a, b) => b[1].faturamento - a[1].faturamento)
              .map(([tipo, dados]) => {
                const pct = totalCreditos > 0 ? (dados.creditos / totalCreditos) * 100 : 0
                return (
                  <div key={tipo} style={{ padding: "1rem", borderRadius: "var(--radius)", border: "1px solid var(--grey-200)" }}>
                    <div className="text-xs text-muted-foreground mb-1">{TIPO_LABELS[tipo] || tipo}</div>
                    <div className="text-lg font-bold" style={{ color: "var(--primary-600)" }}>{fmtNum(pct, 0)}%</div>
                    <div className="text-xs text-muted-foreground">{dados.usos} usos · {dados.creditos} cr · {fmt(dados.faturamento)}</div>
                    <div style={{ width: "100%", height: "0.35rem", background: "var(--grey-200)", borderRadius: "9999px", marginTop: "0.5rem", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "var(--primary-600)", borderRadius: "9999px" }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Ranking completo de ferramentas */}
      <div className="acam-card">
        <h3 className="font-semibold mb-4">Desempenho por Ferramenta</h3>
        {ranking.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="acam-services-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ferramenta</th>
                  <th>Usos</th>
                  <th>Créditos</th>
                  <th>Faturamento est.</th>
                  <th>Ticket médio</th>
                  <th>Usuários</th>
                  <th>Participação</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r, i) => {
                  const pct = totalCreditos > 0 ? (r.creditos / totalCreditos) * 100 : 0
                  return (
                    <tr key={r.id}>
                      <td className="text-sm font-bold" style={{ color: "var(--primary-600)" }}>{i + 1}</td>
                      <td>
                        <div className="font-medium text-sm">{r.nome}</div>
                        <div className="text-xs text-muted-foreground">{TIPO_LABELS[r.tipo] || r.tipo}</div>
                      </td>
                      <td className="font-semibold">{r.usos}</td>
                      <td>{r.creditos} cr</td>
                      <td className="font-semibold">{fmt(r.faturamento)}</td>
                      <td className="text-sm">{fmtNum(r.ticketMedio, 1)} cr/uso</td>
                      <td className="text-sm">{r.usuariosUnicos}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{ width: "4rem", height: "0.4rem", background: "var(--grey-200)", borderRadius: "9999px", overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: "var(--primary-600)", borderRadius: "9999px" }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{fmtNum(pct, 1)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum uso no período.</p>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Faturamento estimado = créditos × {fmt(creditoAvulso)} (crédito avulso). Receita real considera descontos de pacotes.
        </p>
      </div>

      {/* Evolução mensal */}
      {mesesOrdenados.length > 0 && (
        <div className="acam-card">
          <h3 className="font-semibold mb-4">Evolução Mensal</h3>
          <div style={{ overflowX: "auto" }}>
            <table className="acam-services-table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Usos</th>
                  <th>Créditos</th>
                  <th>Faturamento est.</th>
                  <th>Receita real</th>
                  <th>Usuários ativos</th>
                </tr>
              </thead>
              <tbody>
                {mesesOrdenados.map(([key, dados]) => (
                  <tr key={key}>
                    <td className="font-medium">{mesLabel(key)}</td>
                    <td>{dados.usos}</td>
                    <td>{dados.creditos} cr</td>
                    <td>{fmt(dados.creditos * creditoAvulso)}</td>
                    <td className="font-semibold">{dados.receita > 0 ? fmt(dados.receita) : "—"}</td>
                    <td>{dados.usuarios.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Últimos usos */}
      <div className="acam-card">
        <h3 className="font-semibold mb-4">Últimos Usos</h3>
        {recentes.length > 0 ? (
          <div className="space-y-0">
            {recentes.map((t, i) => {
              const fId = t.ferramenta_id || inferirFerramenta(t.descricao || "")
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0", borderBottom: "1px solid var(--grey-100)" }}>
                  <div>
                    <div className="text-sm font-medium">{FERRAMENTAS[fId]?.nome || t.descricao || "—"}</div>
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
          <p className="text-sm text-muted-foreground">Nenhuma atividade no período.</p>
        )}
      </div>
    </div>
  )
}

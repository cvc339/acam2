import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Dashboard",
}

const compensacoes = [
  { nome: "Minerária", lei: "Lei 20.922/2013", icon: "⛏️" },
  { nome: "Mata Atlântica", lei: "Lei 11.428/2006", icon: "🌳" },
  { nome: "APP", lei: "Decreto 47.749/2019", icon: "💧" },
  { nome: "SNUC", lei: "Lei 9.985/2000", icon: "🏔️" },
  { nome: "Reserva Legal", lei: "Lei 12.651/2012", icon: "📐" },
  { nome: "Reposição Florestal", lei: "Lei 20.308/2012", icon: "🌱" },
  { nome: "Espécies Ameaçadas", lei: "DN COPAM 147/2010", icon: "🦜" },
  { nome: "Espécies Imunes", lei: "Lei 12.651/2012", icon: "🌿" },
]

const ferramentas = [
  { nome: "Destinação em UC — Base", descricao: "Análise completa de viabilidade", comp: "Minerária / Reserva Legal", creditos: "5", ativo: true },
  { nome: "Cálculo Implantação/Manutenção UC", descricao: "Cálculo com UFEMG vigente", comp: "Minerária", creditos: "2", ativo: true },
  { nome: "Requerimento Minerária", descricao: "Preenchimento assistido + PDF", comp: "Minerária", creditos: "0,5", ativo: true },
  { nome: "Requerimento Mata Atlântica", descricao: "Preenchimento assistido + PDF", comp: "Mata Atlântica", creditos: "0,5", ativo: true },
  { nome: "Requerimento SNUC", descricao: "Preenchimento assistido + PDF", comp: "SNUC", creditos: "0,5", ativo: true },
  { nome: "Destinação em UC — APP", descricao: "Análise com bacia e sub-bacia", comp: "APP", creditos: "6", ativo: false },
  { nome: "Destinação em UC — Mata Atlântica", descricao: "Análise com bacia, sub-bacia e bioma", comp: "Mata Atlântica", creditos: "7", ativo: false },
  { nome: "Análise de Servidão/RPPN", descricao: "Análise para servidão ou RPPN", comp: "Mata Atlântica", creditos: "7", ativo: false },
  { nome: "Calculadora SNUC", descricao: "Sobreposição com UCs + fatores", comp: "SNUC", creditos: "7", ativo: false },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: consultas } = await supabase
    .from("consultas")
    .select("id, ferramenta_id, nome_imovel, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      {/* Boas-vindas */}
      <div>
        <h2 style={{ color: "var(--primary-600)" }}>Descubra e gerencie suas compensações ambientais</h2>
        <p style={{ color: "var(--neutral-500)", fontSize: "var(--font-size-sm)", marginTop: "var(--spacing-1)" }}>
          Comece identificando quais compensações se aplicam ao seu empreendimento.
        </p>
      </div>

      {/* Compensações */}
      <section>
        <h3 style={{ marginBottom: "var(--spacing-2)" }}>Compensações Ambientais</h3>
        <p style={{ color: "var(--neutral-500)", fontSize: "var(--font-size-sm)", marginBottom: "var(--spacing-4)" }}>
          Conheça as modalidades de compensação previstas na legislação de MG.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--spacing-4)" }}>
          {compensacoes.map((c) => (
            <div key={c.nome} className="acam-card acam-card-hover" style={{ padding: "var(--spacing-4)", cursor: "pointer" }}>
              <div style={{
                width: "3rem", height: "3rem", background: "var(--primary-100)",
                borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "1.5rem", marginBottom: "var(--spacing-3)"
              }}>
                {c.icon}
              </div>
              <h4 style={{ fontWeight: 500, fontSize: "var(--font-size-sm)" }}>{c.nome}</h4>
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--neutral-500)", marginTop: "var(--spacing-1)" }}>{c.lei}</p>
            </div>
          ))}
        </div>

        {/* CTA Checklist */}
        <div className="acam-card acam-card-primary" style={{ marginTop: "var(--spacing-4)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontWeight: 500 }}>Quais compensações se aplicam ao seu empreendimento?</p>
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--neutral-500)", marginTop: "var(--spacing-1)" }}>
              Responda gratuitamente ao checklist e descubra.
            </p>
          </div>
          <button className="acam-btn acam-btn-primary acam-btn-sm">Fazer avaliação gratuita</button>
        </div>
      </section>

      {/* Ferramentas profissionais */}
      <section className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h3 style={{ marginBottom: "var(--spacing-2)" }}>Ferramentas Profissionais</h3>
        <p style={{ color: "var(--neutral-500)", fontSize: "var(--font-size-sm)", marginBottom: "var(--spacing-4)" }}>
          Ferramentas especializadas em análise de compensações ambientais.
        </p>

        <table className="acam-services-table">
          <thead>
            <tr>
              <th>Serviço</th>
              <th>Compensação</th>
              <th>Créditos</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {ferramentas.map((f) => (
              <tr key={f.nome}>
                <td>
                  <div style={{ fontWeight: 500, color: "var(--neutral-800)" }}>{f.nome}</div>
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--neutral-500)" }}>{f.descricao}</div>
                </td>
                <td><span className="acam-badge acam-badge-primary">{f.comp}</span></td>
                <td style={{ fontWeight: 600 }}>{f.creditos}</td>
                <td>
                  {f.ativo ? (
                    <button className="acam-btn acam-btn-primary acam-btn-sm">Acessar</button>
                  ) : (
                    <span className="acam-badge acam-badge-development">Em breve</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ fontSize: "var(--font-size-xs)", color: "var(--neutral-400)", marginTop: "var(--spacing-4)" }}>
          Desenvolvido por especialistas em compensações ambientais de Minas Gerais.
        </p>
      </section>

      {/* Aviso legal */}
      <div className="acam-alert acam-alert-warning" style={{ display: "flex", gap: "var(--spacing-3)" }}>
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: "2px" }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <div>
          <p className="font-medium">Importante</p>
          <p style={{ fontSize: "var(--font-size-sm)" }}>
            Esta é uma análise técnica preliminar. Não substitui trabalhos de campo e análises de profissionais qualificados, mediante responsabilidade técnica.
          </p>
        </div>
      </div>

      {/* Ações rápidas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--spacing-4)" }}>
        <div className="acam-card acam-card-hover" style={{ padding: "var(--spacing-4)", textAlign: "center", cursor: "pointer" }}>
          <div style={{
            width: "3rem", height: "3rem", background: "var(--primary-100)", borderRadius: "var(--radius-lg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--primary-600)", margin: "0 auto var(--spacing-3)", fontSize: "1.25rem"
          }}>
            ✓
          </div>
          <h4 style={{ fontWeight: 500 }}>Checklist</h4>
          <p style={{ fontSize: "var(--font-size-xs)", color: "var(--neutral-500)", marginTop: "var(--spacing-1)" }}>Avaliação gratuita</p>
        </div>

        <Link href="/creditos" style={{ textDecoration: "none" }}>
          <div className="acam-card acam-card-hover" style={{ padding: "var(--spacing-4)", textAlign: "center", cursor: "pointer" }}>
            <div style={{
              width: "3rem", height: "3rem", background: "var(--primary-100)", borderRadius: "var(--radius-lg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--primary-600)", margin: "0 auto var(--spacing-3)", fontSize: "1.25rem"
            }}>
              💳
            </div>
            <h4 style={{ fontWeight: 500 }}>Comprar créditos</h4>
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--neutral-500)", marginTop: "var(--spacing-1)" }}>Adquira créditos</p>
          </div>
        </Link>

        <div className="acam-card acam-card-hover" style={{ padding: "var(--spacing-4)", textAlign: "center", cursor: "pointer" }}>
          <div style={{
            width: "3rem", height: "3rem", background: "var(--primary-100)", borderRadius: "var(--radius-lg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--primary-600)", margin: "0 auto var(--spacing-3)", fontSize: "1.25rem"
          }}>
            📋
          </div>
          <h4 style={{ fontWeight: 500 }}>Extrato de créditos</h4>
          <p style={{ fontSize: "var(--font-size-xs)", color: "var(--neutral-500)", marginTop: "var(--spacing-1)" }}>Histórico de uso</p>
        </div>
      </div>
    </div>
  )
}

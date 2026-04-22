import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { StatusBadge, IconBox, ServicesTable, AlertResult } from "@/components/acam"
import { ChecklistResultado } from "@/components/acam/checklist-resultado"
import { buscarTodosCustos } from "@/lib/creditos/custos"

export const metadata: Metadata = {
  title: "Dashboard",
}


function formatCreditos(custos: Record<string, number>, id: string, fallback: string): string {
  const v = custos[id]
  if (v == null) return fallback
  return v === Math.floor(v) ? String(v) : String(v).replace(".", ",")
}

async function getFerramentas() {
  const custos = await buscarTodosCustos()
  return [
    // Gratuitas
    { nome: "Calculadora de Intervenção Ambiental", descricao: "Taxa de expediente, taxa florestal e reposição florestal", compensacao: "Todas", creditos: "Gratuita", ativo: true, href: "/calculadora" },
    { nome: "Cálculo de Reposição Florestal", descricao: "Cálculo com base nos quantitativos de nativa", compensacao: "Reposição Florestal", creditos: "Gratuita", ativo: true, href: "/reposicao-florestal" },
    // Minerária
    { nome: "Destinação em UC — Base", descricao: "Análise completa de viabilidade", compensacao: "Minerária / Reserva Legal", creditos: formatCreditos(custos, "dest-uc-base", "5"), ativo: true, href: "/ferramentas/destinacao-uc-base" },
    { nome: "Cálculo Implantação/Manutenção UC", descricao: "Cálculo com UFEMG vigente", compensacao: "Minerária", creditos: formatCreditos(custos, "calc-impl-uc", "2"), ativo: true, href: "/ferramentas/calculo-modalidade2" },
    { nome: "Requerimento Minerária", descricao: "Preenchimento assistido + PDF", compensacao: "Minerária", creditos: formatCreditos(custos, "req-mineraria", "0,5"), ativo: true, href: "/ferramentas/requerimento-mineraria" },
    // Mata Atlântica
    { nome: "Destinação em UC — Mata Atlântica", descricao: "Análise com bacia, sub-bacia e bioma", compensacao: "Mata Atlântica", creditos: formatCreditos(custos, "dest-uc-ma", "7"), ativo: true, href: "/ferramentas/destinacao-uc-ma" },
    { nome: "Análise de Servidão/RPPN", descricao: "Análise para servidão ou RPPN", compensacao: "Mata Atlântica", creditos: formatCreditos(custos, "dest-servidao", "7"), ativo: true, href: "/ferramentas/analise-servidao" },
    { nome: "Requerimento Mata Atlântica", descricao: "Preenchimento assistido + PDF", compensacao: "Mata Atlântica", creditos: formatCreditos(custos, "req-mata-atlantica", "0,5"), ativo: true, href: "/ferramentas/requerimento-mata-atlantica" },
    // APP
    { nome: "Destinação em UC — APP", descricao: "Análise com bacia e sub-bacia", compensacao: "APP", creditos: formatCreditos(custos, "dest-uc-app", "6"), ativo: true, href: "/ferramentas/destinacao-uc-app" },
    // SNUC
    { nome: "Calculadora SNUC", descricao: "Sobreposição com UCs + fatores", compensacao: "SNUC", creditos: formatCreditos(custos, "calc-snuc", "7"), ativo: true, href: "/ferramentas/calculadora-snuc" },
    { nome: "Requerimento SNUC", descricao: "Preenchimento assistido + PDF", compensacao: "SNUC", creditos: formatCreditos(custos, "req-snuc", "0,5"), ativo: true, href: "/ferramentas/requerimento-snuc" },
    // Análise documental
    { nome: "Análise de Matrícula", descricao: "Viabilidade registral, MVAR, transmissibilidade", compensacao: "Todas", creditos: formatCreditos(custos, "analise-matricula", "5"), ativo: true, href: "/ferramentas/analise-matricula" },
    // Consultoria
    { nome: "Consultoria — Reunião técnica", descricao: "Converse 30 min online com especialista em compensações", compensacao: "Todas", creditos: formatCreditos(custos, "consultoria", "15"), ativo: true, href: "/ferramentas/consultoria" },
  ]
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const [{ data: { user } }, ferramentas] = await Promise.all([
    supabase.auth.getUser(),
    getFerramentas(),
  ])

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
        <p className="text-sm text-muted-foreground mt-1">
          Comece identificando quais compensações se aplicam ao seu empreendimento.
        </p>
      </div>

      {/* Compensações — componente client que lê resultado do checklist */}
      <ChecklistResultado />

      {/* Ferramentas */}
      <section className="acam-card">
        <h3 className="mb-2">Ferramentas Profissionais</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ferramentas especializadas em análise de compensações ambientais.
        </p>
        <ServicesTable ferramentas={ferramentas} />
        <p className="text-xs text-muted-foreground mt-4">
          Desenvolvido por especialistas em compensações ambientais de Minas Gerais.
        </p>
      </section>

      {/* Aviso legal */}
      <AlertResult>
        <strong>Importante.</strong> Esta é uma análise técnica preliminar. Não substitui trabalhos de campo e análises de profissionais qualificados, mediante responsabilidade técnica.
      </AlertResult>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/checklist" className="no-underline">
          <div className="acam-card acam-card-hover acam-card-compact text-center cursor-pointer h-full">
            <IconBox className="mx-auto mb-3">✓</IconBox>
            <h4 className="font-medium text-sm">Checklist</h4>
            <p className="text-xs text-muted-foreground mt-1">Avaliação gratuita</p>
          </div>
        </Link>
        <Link href="/creditos" className="no-underline">
          <div className="acam-card acam-card-hover acam-card-compact text-center cursor-pointer h-full">
            <IconBox color="amber" className="mx-auto mb-3">$</IconBox>
            <h4 className="font-medium text-sm">Comprar créditos</h4>
            <p className="text-xs text-muted-foreground mt-1">Adquira créditos</p>
          </div>
        </Link>
        <Link href="/creditos/extrato" className="no-underline">
          <div className="acam-card acam-card-hover acam-card-compact text-center cursor-pointer h-full">
            <IconBox color="blue" className="mx-auto mb-3">R</IconBox>
            <h4 className="font-medium text-sm">Extrato de créditos</h4>
            <p className="text-xs text-muted-foreground mt-1">Histórico de uso</p>
          </div>
        </Link>
        <Link href="/fale-conosco" className="no-underline">
          <div className="acam-card acam-card-hover acam-card-compact text-center cursor-pointer h-full">
            <IconBox color="green" className="mx-auto mb-3">✉</IconBox>
            <h4 className="font-medium text-sm">Fale Conosco</h4>
            <p className="text-xs text-muted-foreground mt-1">Sugestões e dúvidas</p>
          </div>
        </Link>
      </div>

      {/* Consultas recentes */}
      {consultas && consultas.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3>Consultas recentes</h3>
            <Link href="/consultas" className="text-sm text-muted-foreground hover:text-foreground">
              Ver todas
            </Link>
          </div>
          <div className="space-y-0 border-t">
            {consultas.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="text-sm font-medium">{c.nome_imovel || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground">{c.ferramenta_id}</p>
                </div>
                <StatusBadge
                  variant={
                    c.status === "concluida" ? "success" :
                    c.status === "processando" ? "primary" :
                    c.status === "erro" ? "error" :
                    c.status === "reembolsada" ? "warning" : "primary"
                  }
                >
                  {c.status}
                </StatusBadge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

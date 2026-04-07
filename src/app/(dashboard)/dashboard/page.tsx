import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { StatusBadge, IconBox, ServicesTable, AlertResult } from "@/components/acam"
import { ChecklistResultado } from "@/components/acam/checklist-resultado"

export const metadata: Metadata = {
  title: "Dashboard",
}


const ferramentas = [
  { nome: "Calculadora de Intervenção Ambiental", descricao: "Taxa de expediente, taxa florestal e reposição florestal", compensacao: "Todas", creditos: "Gratuita", ativo: true, href: "/calculadora" },
  { nome: "Cálculo de Reposição Florestal", descricao: "Cálculo com base nos quantitativos de nativa", compensacao: "Reposição Florestal", creditos: "Gratuita", ativo: true, href: "/reposicao-florestal" },
  { nome: "Destinação em UC — Base", descricao: "Análise completa de viabilidade", compensacao: "Minerária / Reserva Legal", creditos: "5", ativo: true },
  { nome: "Cálculo Implantação/Manutenção UC", descricao: "Cálculo com UFEMG vigente", compensacao: "Minerária", creditos: "2", ativo: true },
  { nome: "Requerimento Minerária", descricao: "Preenchimento assistido + PDF", compensacao: "Minerária", creditos: "0,5", ativo: true },
  { nome: "Requerimento Mata Atlântica", descricao: "Preenchimento assistido + PDF", compensacao: "Mata Atlântica", creditos: "0,5", ativo: true },
  { nome: "Requerimento SNUC", descricao: "Preenchimento assistido + PDF", compensacao: "SNUC", creditos: "0,5", ativo: true },
  { nome: "Destinação em UC — APP", descricao: "Análise com bacia e sub-bacia", compensacao: "APP", creditos: "6", ativo: true },
  { nome: "Destinação em UC — Mata Atlântica", descricao: "Análise com bacia, sub-bacia e bioma", compensacao: "Mata Atlântica", creditos: "7", ativo: true },
  { nome: "Análise de Servidão/RPPN", descricao: "Análise para servidão ou RPPN", compensacao: "Mata Atlântica", creditos: "7", ativo: true },
  { nome: "Calculadora SNUC", descricao: "Sobreposição com UCs + fatores", compensacao: "SNUC", creditos: "7", ativo: true },
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
        <p className="text-sm text-muted-foreground mt-1">
          Comece identificando quais compensações se aplicam ao seu empreendimento.
        </p>
      </div>

      {/* Compensações — componente client que lê resultado do checklist */}
      <ChecklistResultado />

      {/* Ferramentas */}
      <section className="acam-card" style={{ padding: "var(--spacing-6)" }}>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <div className="acam-card acam-card-hover acam-card-compact text-center cursor-pointer">
          <IconBox color="blue" className="mx-auto mb-3">R</IconBox>
          <h4 className="font-medium text-sm">Extrato de créditos</h4>
          <p className="text-xs text-muted-foreground mt-1">Histórico de uso</p>
        </div>
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

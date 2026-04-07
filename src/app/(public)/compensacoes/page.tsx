import type { Metadata } from "next"
import Link from "next/link"
import { CompensacaoIcon } from "@/components/acam"
import type { Compensacao } from "@/components/acam/compensacao-icon"

export const metadata: Metadata = {
  title: "Compensações Ambientais",
}

const compensacoes: { id: Compensacao; nome: string; descricao: string; lei: string }[] = [
  { id: "mineraria", nome: "Minerária", descricao: "Supressão de vegetação nativa por empreendimentos minerários", lei: "Lei 20.922/2013" },
  { id: "mata-atlantica", nome: "Mata Atlântica", descricao: "Corte ou supressão de vegetação no Bioma Mata Atlântica", lei: "Lei 11.428/2006" },
  { id: "snuc", nome: "SNUC", descricao: "Empreendimentos de significativo impacto ambiental", lei: "Lei 9.985/2000" },
  { id: "app", nome: "APP", descricao: "Intervenção em Área de Preservação Permanente", lei: "Decreto 47.749/2019" },
  { id: "reserva-legal", nome: "Reserva Legal", descricao: "Déficit de Reserva Legal em imóvel rural", lei: "Lei 12.651/2012" },
  { id: "reposicao-florestal", nome: "Reposição Florestal", descricao: "Compensação do volume de matéria-prima florestal extraída", lei: "Lei 20.922/2013" },
  { id: "ameacadas", nome: "Espécies Ameaçadas", descricao: "Supressão de espécies ameaçadas de extinção", lei: "Decreto 47.749/2019" },
  { id: "imunes", nome: "Espécies Imunes", descricao: "Supressão de espécies imunes de corte", lei: "Legislações específicas" },
]

export default function CompensacoesPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      <div>
        <h1 className="text-2xl font-semibold">Compensações Ambientais</h1>
        <p className="text-sm text-muted-foreground mt-1">
          8 compensações previstas na legislação de Minas Gerais. Clique em uma para conhecer as modalidades de cumprimento e ferramentas disponíveis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {compensacoes.map((c) => (
          <Link key={c.id} href={`/compensacoes/${c.id}`} className="no-underline">
            <div className="acam-card acam-card-hover" style={{
              padding: "var(--spacing-5)",
              display: "flex", alignItems: "flex-start", gap: "var(--spacing-4)",
            }}>
              <div style={{ color: "var(--primary-500)", flexShrink: 0, marginTop: "2px" }}>
                <CompensacaoIcon compensacao={c.id} size={28} />
              </div>
              <div>
                <h3 style={{ fontFamily: "var(--font-family-heading)", fontSize: "1.1rem", fontWeight: 600, color: "var(--primary-600)" }}>
                  {c.nome}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{c.descricao}</p>
                <p className="text-xs text-muted-foreground mt-2">{c.lei}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

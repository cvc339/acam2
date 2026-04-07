import type { Metadata } from "next"
import { LegislacaoItem, CompensacaoIcon } from "@/components/acam"

export const metadata: Metadata = { title: "Compensação de APP" }

export default function AppPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      <div className="flex items-start gap-4">
        <div style={{ color: "var(--primary-500)", marginTop: "4px" }}><CompensacaoIcon compensacao="app" size={32} /></div>
        <div>
          <h1 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-2xl)", fontWeight: 600 }}>Compensação de APP</h1>
          <p className="text-sm text-muted-foreground mt-1">Decreto MG 47.749/2019 · Art. 75</p>
        </div>
      </div>

      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>O que é?</h2>
        <p className="text-sm" style={{ lineHeight: 1.8, color: "var(--neutral-700)" }}>
          A Compensação por intervenção em Área de Preservação Permanente (APP) é prevista na Resolução CONAMA nº 369/2006 e regulamentada pelo Decreto Estadual nº 47.749/2019. Caracteriza-se pelo impacto causado por intervenção com ou sem supressão em APP.
        </p>
      </div>

      <div className="acam-card acam-card-primary" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>Quando se aplica?</h2>
        <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", fontSize: "var(--font-size-sm)", color: "var(--neutral-700)", lineHeight: 1.8 }}>
          <li>Intervenção em Área de Preservação Permanente</li>
          <li>Com ou sem supressão de vegetação</li>
          <li>Casos de utilidade pública, interesse social ou baixo impacto</li>
        </ul>
        <div style={{ marginTop: "var(--spacing-4)", padding: "var(--spacing-3)", background: "white", borderRadius: "var(--radius-md)" }}>
          <span className="text-xs text-muted-foreground">Proporção de compensação</span>
          <div style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-xl)", fontWeight: 700, color: "var(--primary-600)" }}>
            1:1 <span className="text-sm font-normal text-muted-foreground">— No mínimo equivalente à área de intervenção</span>
          </div>
        </div>
      </div>

      <div>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-xl)", fontWeight: 600, marginBottom: "var(--spacing-6)" }}>Modalidades de Cumprimento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { titulo: "Recuperação de APP", sub: "Plantio na mesma sub-bacia hidrográfica" },
            { titulo: "Recuperação em UC", sub: "Área degradada em Unidade de Conservação" },
            { titulo: "Doação para UC", sub: "Área na mesma bacia hidrográfica (Ferramenta: 6 créditos)" },
            { titulo: "Área Verde Urbana", sub: "Implantação ou revitalização" },
          ].map((m) => (
            <div key={m.titulo} className="acam-card" style={{ padding: "var(--spacing-5)" }}>
              <h3 className="font-semibold text-sm">{m.titulo}</h3>
              <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-4)" }}>Legislação Aplicável</h2>
        <LegislacaoItem titulo="Resolução CONAMA nº 369/2006" descricao="Dispõe sobre os casos excepcionais de intervenção em APP" linkUrl="https://conama.mma.gov.br/?option=com_sisconama&task=arquivo.download&id=480" />
        <LegislacaoItem titulo="Decreto Estadual nº 47.749/2019" descricao="Dispõe sobre os processos de autorização para intervenção ambiental" linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/DEC/47749/2019/?cons=1" />
        <LegislacaoItem titulo="Resolução Conjunta SEMAD/IEF nº 3.102/2021" descricao="Dispõe sobre procedimentos para compensação ambiental" linkUrl="https://siam.mg.gov.br/sla/download.pdf?idNorma=54600" />
      </div>
    </div>
  )
}

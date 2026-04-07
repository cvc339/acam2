import type { Metadata } from "next"
import { LegislacaoItem, CompensacaoIcon } from "@/components/acam"

export const metadata: Metadata = { title: "Reposição Florestal" }

export default function ReposicaoFlorestalPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      <div className="flex items-start gap-4">
        <div style={{ color: "var(--primary-500)", marginTop: "4px" }}><CompensacaoIcon compensacao="reposicao-florestal" size={32} /></div>
        <div>
          <h1 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-2xl)", fontWeight: 600 }}>Reposição Florestal</h1>
          <p className="text-sm text-muted-foreground mt-1">Lei MG 20.922/2013 · Art. 78</p>
        </div>
      </div>

      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>O que é?</h2>
        <p className="text-sm" style={{ lineHeight: 1.8, color: "var(--neutral-700)" }}>
          A Reposição Florestal é uma obrigação legal decorrente da supressão de vegetação nativa. Consiste na compensação do volume de matéria-prima florestal extraída, através do plantio de espécies florestais ou participação em programas de fomento florestal. Conforme a Lei Estadual nº 20.922/2013, a reposição florestal é exigida para toda pessoa física ou jurídica que utilize, transforme, comercialize ou consuma matéria-prima florestal.
        </p>
      </div>

      <div className="acam-card acam-card-primary" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>Quando se aplica?</h2>
        <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", fontSize: "var(--font-size-sm)", color: "var(--neutral-700)", lineHeight: 1.8 }}>
          <li>Supressão de vegetação nativa autorizada</li>
          <li>Extração de matéria-prima florestal</li>
          <li>Utilização, transformação ou comercialização de produtos florestais</li>
        </ul>
      </div>

      <div>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-xl)", fontWeight: 600, marginBottom: "var(--spacing-6)" }}>Formas de Cumprimento</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { titulo: "Florestas Próprias", sub: "Plantio em área própria" },
            { titulo: "Fomento Florestal", sub: "Apoio a pequenos produtores" },
            { titulo: "Associação", sub: "Projetos coletivos de plantio" },
          ].map((m) => (
            <div key={m.titulo} className="acam-card" style={{ padding: "var(--spacing-5)" }}>
              <h3 className="font-semibold text-sm">{m.titulo}</h3>
              <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>Nossa Ferramenta</h2>
        <h3 className="font-semibold mb-2">Cálculo de Reposição Florestal (gratuita)</h3>
        <p className="text-sm text-muted-foreground">Cálculo com base nos quantitativos de lenha nativa, madeira nativa e carvão vegetal de floresta nativa.</p>
      </div>

      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-4)" }}>Legislação Aplicável</h2>
        <LegislacaoItem titulo="Lei Estadual nº 20.922/2013" descricao="Dispõe sobre as políticas florestal e de proteção à biodiversidade (Art. 78)" />
        <LegislacaoItem titulo="Decreto Estadual nº 47.749/2019" descricao="Dispõe sobre os processos de autorização para intervenção ambiental" />
      </div>
    </div>
  )
}

import type { Metadata } from "next"
import { LegislacaoItem, CompensacaoIcon } from "@/components/acam"

export const metadata: Metadata = { title: "Compensação por Espécies Ameaçadas" }

export default function EspeciesAmeacadasPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      <div className="flex items-start gap-4">
        <div style={{ color: "var(--primary-500)", marginTop: "4px" }}><CompensacaoIcon compensacao="ameacadas" size={32} /></div>
        <div>
          <h1 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-2xl)", fontWeight: 600 }}>Compensação por Espécies Ameaçadas</h1>
          <p className="text-sm text-muted-foreground mt-1">Decreto MG 47.749/2019 · Art. 73</p>
        </div>
      </div>

      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>O que é?</h2>
        <p className="text-sm" style={{ lineHeight: 1.8, color: "var(--neutral-700)" }}>
          A compensação por supressão de espécies ameaçadas de extinção visa garantir a conservação dessas espécies através do plantio de mudas em áreas de APP, Reserva Legal ou corredores de vegetação para estabelecer conectividade com outros fragmentos.
        </p>
      </div>

      <div className="acam-card acam-card-primary" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>Quando se aplica?</h2>
        <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", fontSize: "var(--font-size-sm)", color: "var(--neutral-700)", lineHeight: 1.8 }}>
          <li>Supressão de exemplares de espécies ameaçadas de extinção</li>
          <li>Espécies constantes nas listas oficiais de fauna e flora ameaçadas</li>
          <li>Autorização de supressão com condicionante de compensação</li>
        </ul>
      </div>

      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-4)" }}>Proporção por Grau de Ameaça</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { grau: "Vulnerável (VU)", proporcao: "10:1", detalhe: "10 mudas por exemplar" },
            { grau: "Em Perigo (EN)", proporcao: "15:1", detalhe: "15 mudas por exemplar" },
            { grau: "Criticamente em Perigo (CR)", proporcao: "25:1", detalhe: "25 mudas por exemplar" },
          ].map((g) => (
            <div key={g.grau} className="acam-card" style={{ padding: "var(--spacing-4)", textAlign: "center" }}>
              <div className="text-xs text-muted-foreground mb-2">{g.grau}</div>
              <div style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-2xl)", fontWeight: 700, color: "var(--primary-600)" }}>{g.proporcao}</div>
              <div className="text-xs text-muted-foreground mt-1">{g.detalhe}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="acam-alert-result">
        <strong>Importante:</strong> Esse tipo de compensação deve ser feito mediante PLANTIO. Não há possibilidade de doar áreas. Apesar de poder ser realizada em APP, não pode ser feita em área de APP destinada a compensação, como &quot;sobreposição&quot; de compensações.
      </div>

      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-4)" }}>Legislação Aplicável</h2>
        <LegislacaoItem titulo="Decreto Estadual nº 47.749/2019" descricao="Dispõe sobre os processos de autorização para intervenção ambiental (Art. 73)" />
        <LegislacaoItem titulo="Resolução Conjunta SEMAD/IEF nº 3.102/2021" descricao="Dispõe sobre procedimentos para compensação ambiental" />
      </div>
    </div>
  )
}

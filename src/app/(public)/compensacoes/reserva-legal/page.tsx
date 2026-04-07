import type { Metadata } from "next"
import { LegislacaoItem, CompensacaoIcon } from "@/components/acam"

export const metadata: Metadata = { title: "Compensação de Reserva Legal" }

export default function ReservaLegalPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      <div className="flex items-start gap-4">
        <div style={{ color: "var(--primary-500)", marginTop: "4px" }}><CompensacaoIcon compensacao="reserva-legal" size={32} /></div>
        <div>
          <h1 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-2xl)", fontWeight: 600 }}>Compensação de Reserva Legal</h1>
          <p className="text-sm text-muted-foreground mt-1">Lei 12.651/2012 · Lei MG 20.922/2013</p>
        </div>
      </div>

      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>O que é?</h2>
        <p className="text-sm" style={{ lineHeight: 1.8, color: "var(--neutral-700)" }}>
          A Reserva Legal é a área localizada no interior de uma propriedade rural que deve ser mantida com cobertura de vegetação nativa. Quando há déficit de Reserva Legal, o proprietário deve regularizar a situação através de compensação. Conforme a Lei Estadual nº 20.922/2013, todo imóvel rural em Minas Gerais deve manter área com cobertura de vegetação nativa a título de Reserva Legal, equivalente a 20% da área total do imóvel.
        </p>
      </div>

      <div className="acam-card acam-card-primary" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>Quando se aplica?</h2>
        <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", fontSize: "var(--font-size-sm)", color: "var(--neutral-700)", lineHeight: 1.8 }}>
          <li>Imóvel rural com déficit de Reserva Legal</li>
          <li>Intervenção autorizada em área de Reserva Legal</li>
          <li>Necessidade de relocação de Reserva Legal</li>
        </ul>
        <div style={{ marginTop: "var(--spacing-4)", padding: "var(--spacing-3)", background: "white", borderRadius: "var(--radius-md)" }}>
          <span className="text-xs text-muted-foreground">Área necessária</span>
          <div style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-xl)", fontWeight: 700, color: "var(--primary-600)" }}>
            20% <span className="text-sm font-normal text-muted-foreground">— Da área total do imóvel rural</span>
          </div>
        </div>
      </div>

      <div>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-xl)", fontWeight: 600, marginBottom: "var(--spacing-6)" }}>Modalidades de Regularização</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { titulo: "Aquisição de CRA", sub: "Cota de Reserva Ambiental" },
            { titulo: "Arrendamento", sub: "Servidão ambiental de outro imóvel" },
            { titulo: "Doação para UC", sub: "Área em UC pendente de regularização (Ferramenta: 5 créditos)" },
            { titulo: "Cadastramento", sub: "Área equivalente no mesmo bioma" },
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
        <LegislacaoItem titulo="Lei Federal nº 12.651/2012" descricao="Código Florestal — Dispõe sobre a proteção da vegetação nativa" />
        <LegislacaoItem titulo="Lei Estadual nº 20.922/2013" descricao="Dispõe sobre as políticas florestal e de proteção à biodiversidade em MG" />
        <LegislacaoItem titulo="Decreto Estadual nº 47.749/2019" descricao="Dispõe sobre os processos de autorização para intervenção ambiental" />
      </div>
    </div>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const conteudo = {
  h1: "Análise de Compensações Ambientais",
  h2: "Compensação Minerária MG",
  h3: "Modalidade 2.1 — Destinação em UC",
  body: "A compensação minerária é uma obrigação legal decorrente da supressão de vegetação nativa por empreendimentos minerários em Minas Gerais. O imóvel deve estar localizado em Unidade de Conservação de proteção integral, pendente de regularização fundiária.",
  small: "Lei 20.922/2013 — Portaria IEF 27/2017 — Decreto 12.689/2025",
  label: "Área do imóvel (hectares)",
  numero: "92",
  unidade: "pontos MVAR",
}

const combinacoes = [
  {
    nome: "Opção A: IBM Plex Serif + IBM Plex Sans",
    desc: "Técnico, institucional, sério. Serif nos títulos transmite autoridade.",
    heading: "'IBM Plex Serif', Georgia, serif",
    body: "'IBM Plex Sans', sans-serif",
    import: "IBM+Plex+Serif:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600",
  },
  {
    nome: "Opção B: Source Serif 4 + Source Sans 3",
    desc: "Governamental, documental. Mesma família, coesão total.",
    heading: "'Source Serif 4', Georgia, serif",
    body: "'Source Sans 3', sans-serif",
    import: "Source+Serif+4:wght@400;600;700&family=Source+Sans+3:wght@400;500;600",
  },
  {
    nome: "Opção C: Bricolage Grotesque + Source Sans 3",
    desc: "Distintivo mas profissional. Título com personalidade, corpo neutro.",
    heading: "'Bricolage Grotesque', sans-serif",
    body: "'Source Sans 3', sans-serif",
    import: "Bricolage+Grotesque:wght@400;600;700;800&family=Source+Sans+3:wght@400;500;600",
  },
  {
    nome: "Opção D: Newsreader + IBM Plex Sans",
    desc: "Editorial, refinado. Serif elegante nos títulos, sans técnico no corpo.",
    heading: "'Newsreader', Georgia, serif",
    body: "'IBM Plex Sans', sans-serif",
    import: "Newsreader:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600",
  },
  {
    nome: "Opção E: Crimson Pro + Source Sans 3",
    desc: "Clássico jurídico. Serif tradicional com corpo moderno.",
    heading: "'Crimson Pro', Georgia, serif",
    body: "'Source Sans 3', sans-serif",
    import: "Crimson+Pro:wght@400;600;700&family=Source+Sans+3:wght@400;500;600",
  },
  {
    nome: "Atual: System fonts",
    desc: "Stack atual do ACAM. -apple-system, Segoe UI, Roboto. Sem personalidade, carregamento instantâneo.",
    heading: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    import: null,
  },
]

function FontPreview({ combo }: { combo: typeof combinacoes[0] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="text-base">{combo.nome}</CardTitle>
        <p className="text-sm text-muted-foreground">{combo.desc}</p>
      </CardHeader>
      <CardContent className="pt-6 space-y-5">
        {/* H1 */}
        <div>
          <div className="text-xs acam-text-light mb-1">Título principal (h1)</div>
          <h1 style={{ fontFamily: combo.heading, fontSize: "2.25rem", fontWeight: 700, lineHeight: 1.2 }}>
            {conteudo.h1}
          </h1>
        </div>

        {/* H2 */}
        <div>
          <div className="text-xs acam-text-light mb-1">Seção (h2)</div>
          <h2 style={{ fontFamily: combo.heading, fontSize: "1.5rem", fontWeight: 600 }}>
            {conteudo.h2}
          </h2>
        </div>

        {/* H3 */}
        <div>
          <div className="text-xs acam-text-light mb-1">Subseção (h3)</div>
          <h3 style={{ fontFamily: combo.heading, fontSize: "1.25rem", fontWeight: 600 }}>
            {conteudo.h3}
          </h3>
        </div>

        {/* Body */}
        <div>
          <div className="text-xs acam-text-light mb-1">Texto corrido (body)</div>
          <p style={{ fontFamily: combo.body, fontSize: "1rem", lineHeight: 1.6 }}>
            {conteudo.body}
          </p>
        </div>

        {/* Small */}
        <div>
          <div className="text-xs acam-text-light mb-1">Referência legal (small)</div>
          <p style={{ fontFamily: combo.body, fontSize: "0.875rem", color: "var(--neutral-500)" }}>
            {conteudo.small}
          </p>
        </div>

        {/* Label + input simulado */}
        <div>
          <div className="text-xs acam-text-light mb-1">Label de formulário</div>
          <label style={{ fontFamily: combo.body, fontSize: "0.8rem", fontWeight: 500, color: "var(--neutral-700)" }}>
            {conteudo.label}
          </label>
          <div className="acam-form-input mt-1" style={{ fontFamily: combo.body }}>145,3</div>
        </div>

        {/* Número em destaque */}
        <div>
          <div className="text-xs acam-text-light mb-1">Número em destaque (MVAR)</div>
          <div className="flex items-baseline gap-2">
            <span style={{ fontFamily: combo.heading, fontSize: "3rem", fontWeight: 700, lineHeight: 1 }}>
              {conteudo.numero}
            </span>
            <span style={{ fontFamily: combo.body, fontSize: "0.875rem", color: "var(--neutral-500)" }}>
              {conteudo.unidade}
            </span>
            <Badge className="badge-success ml-2">Adequado</Badge>
          </div>
        </div>

        {/* Header simulado */}
        <div>
          <div className="text-xs acam-text-light mb-1">Header</div>
          <div className="flex items-center gap-3 border rounded-lg p-3">
            <div className="acam-icon-box acam-icon-box-md">A</div>
            <div>
              <div style={{ fontFamily: combo.heading, fontSize: "1.25rem", fontWeight: 600 }}>ACAM</div>
              <div style={{ fontFamily: combo.body, fontSize: "0.75rem", color: "var(--neutral-500)" }}>Compensações Ambientais</div>
            </div>
          </div>
        </div>

        {/* Botão + badge */}
        <div>
          <div className="text-xs acam-text-light mb-1">Botões e badges</div>
          <div className="flex items-center gap-3">
            <button className="acam-btn acam-btn-primary" style={{ fontFamily: combo.body }}>Iniciar análise</button>
            <button className="acam-btn acam-btn-accent" style={{ fontFamily: combo.body }}>Comprar créditos</button>
            <Badge className="badge-accent" style={{ fontFamily: combo.body }}>5 créditos</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TipografiaPage() {
  const allImports = combinacoes
    .filter(c => c.import)
    .map(c => c.import)
    .join("&family=")

  return (
    <>
      {/* Carregar todas as fontes do Google Fonts */}
      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?family=${allImports}&display=swap`}
      />

      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Comparação de Tipografia</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            Mesmo conteúdo, fontes diferentes. Avalie qual combinação transmite melhor
            a sensação de autoridade técnica e profissionalismo do ACAM.
          </p>
        </div>

        {combinacoes.map((combo) => (
          <FontPreview key={combo.nome} combo={combo} />
        ))}
      </div>
    </>
  )
}

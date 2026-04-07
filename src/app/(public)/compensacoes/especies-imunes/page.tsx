import type { Metadata } from "next"
import { LegislacaoItem, CompensacaoIcon } from "@/components/acam"

export const metadata: Metadata = { title: "Compensação por Espécies Imunes" }

export default function EspeciesImunesPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      <div className="flex items-start gap-4">
        <div style={{ color: "var(--primary-500)", marginTop: "4px" }}><CompensacaoIcon compensacao="imunes" size={32} /></div>
        <div>
          <h1 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-2xl)", fontWeight: 600 }}>Compensação por Espécies Imunes de Corte</h1>
          <p className="text-sm text-muted-foreground mt-1">Legislações específicas de MG</p>
        </div>
      </div>

      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>O que é?</h2>
        <p className="text-sm" style={{ lineHeight: 1.8, color: "var(--neutral-700)" }}>
          As espécies imunes de corte são aquelas que possuem proteção especial estabelecida em legislação específica. Em Minas Gerais, destacam-se o Pequizeiro, o Ipê-amarelo e o Buriti. Quando há necessidade de supressão autorizada, deve haver compensação.
        </p>
      </div>

      <div className="acam-card acam-card-primary" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>Quando se aplica?</h2>
        <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", fontSize: "var(--font-size-sm)", color: "var(--neutral-700)", lineHeight: 1.8 }}>
          <li>Supressão autorizada de Pequizeiro (Caryocar brasiliense)</li>
          <li>Supressão autorizada de Ipê-amarelo (Tabebuia spp.)</li>
          <li>Supressão autorizada de Buriti (Mauritia flexuosa)</li>
        </ul>
      </div>

      {/* Espécies */}
      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-4)" }}>Principais Espécies Protegidas em MG</h2>
        <div className="overflow-x-auto">
          <table className="acam-normas-table">
            <thead>
              <tr>
                <th>Espécie</th>
                <th>Proporção</th>
                <th>Legislação</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="cell-name">Pequizeiro (Caryocar brasiliense)</td>
                <td>5 a 10 mudas/árvore</td>
                <td className="cell-detail">Lei nº 20.308/2012</td>
              </tr>
              <tr>
                <td className="cell-name">Ipê-amarelo (Tabebuia spp.)</td>
                <td>1 a 5 mudas/árvore</td>
                <td className="cell-detail">Lei nº 9.743/1988</td>
              </tr>
              <tr>
                <td className="cell-name">Buriti (Mauritia flexuosa)</td>
                <td>2 a 5 mudas/árvore</td>
                <td className="cell-detail">Lei nº 13.635/2000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modalidades */}
      <div>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-xl)", fontWeight: 600, marginBottom: "var(--spacing-6)" }}>Modalidades de Compensação</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="acam-modalidade-card">
            <span className="acam-modalidade-badge">Modalidade 1</span>
            <div className="acam-modalidade-titulo">Plantio de Mudas</div>
            <div className="acam-modalidade-subtitulo">Mesma espécie suprimida</div>
            <div className="acam-modalidade-desc">
              Plantio de mudas da mesma espécie suprimida, em proporção definida pela legislação específica.
            </div>
            <div className="acam-modalidade-requisitos">
              <h4>Locais:</h4>
              <ul>
                <li>Mesma sub-bacia hidrográfica</li>
                <li>Em APP, Reserva Legal ou UC de domínio público</li>
              </ul>
            </div>
          </div>
          <div className="acam-modalidade-card">
            <span className="acam-modalidade-badge">Modalidade 2</span>
            <div className="acam-modalidade-titulo">Pagamento em UFEMGs</div>
            <div className="acam-modalidade-subtitulo">100 UFEMGs por árvore suprimida</div>
            <div className="acam-modalidade-desc">
              Alternativamente ao plantio, recolhimento de valor em UFEMGs por cada indivíduo suprimido.
            </div>
            <div className="acam-modalidade-destaque">
              <strong>Dica:</strong> O empreendedor pode optar por uma das modalidades ou combiná-las (ex: pagar 50% em UFEMGs e plantar mudas referentes aos outros 50%).
            </div>
          </div>
        </div>
      </div>

      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-4)" }}>Legislação Aplicável</h2>
        <LegislacaoItem titulo="Lei Estadual nº 9.743/1988" descricao="Declara de interesse comum e imune de corte o Ipê-amarelo" />
        <LegislacaoItem titulo="Lei Estadual nº 20.308/2012" descricao="Altera a Lei nº 13.965/2001, que dispõe sobre proteção do Pequizeiro" />
        <LegislacaoItem titulo="Lei Estadual nº 13.635/2000" descricao="Declara de preservação permanente e imune de corte o Buriti" />
        <LegislacaoItem titulo="Decreto Estadual nº 47.749/2019" descricao="Dispõe sobre os processos de autorização para intervenção ambiental" />
      </div>
    </div>
  )
}

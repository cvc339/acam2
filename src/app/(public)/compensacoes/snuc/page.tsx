import type { Metadata } from "next"
import { LegislacaoItem, CompensacaoIcon } from "@/components/acam"

export const metadata: Metadata = { title: "Compensação SNUC" }

export default function SnucPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      <div className="flex items-start gap-4">
        <div style={{ color: "var(--primary-500)", marginTop: "4px" }}><CompensacaoIcon compensacao="snuc" size={32} /></div>
        <div>
          <h1 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-2xl)", fontWeight: 600 }}>Compensação SNUC</h1>
          <p className="text-sm text-muted-foreground mt-1">Lei 9.985/2000 · Art. 36</p>
        </div>
      </div>

      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>O que é?</h2>
        <p className="text-sm" style={{ lineHeight: 1.8, color: "var(--neutral-700)" }}>
          A Compensação Ambiental SNUC, prevista no Art. 36 da Lei Federal nº 9.985/2000, é aplicável aos casos de licenciamento ambiental de empreendimentos de significativo impacto ambiental. O empreendedor deverá apoiar a implantação e manutenção de Unidade de Conservação (UC) do Grupo de Proteção Integral.
        </p>
      </div>

      <div className="acam-card acam-card-primary" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>Quando se aplica?</h2>
        <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", fontSize: "var(--font-size-sm)", color: "var(--neutral-700)", lineHeight: 1.8 }}>
          <li>Empreendimentos sujeitos a licenciamento ambiental</li>
          <li>Com significativo impacto ambiental (EIA/RIMA obrigatório)</li>
          <li>Definida na fase de Licença Prévia (LP)</li>
        </ul>
        <div style={{ marginTop: "var(--spacing-4)", padding: "var(--spacing-3)", background: "white", borderRadius: "var(--radius-md)" }}>
          <span className="text-xs text-muted-foreground">Valor da compensação</span>
          <div style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-xl)", fontWeight: 700, color: "var(--primary-600)" }}>
            Até 0,5% <span className="text-sm font-normal text-muted-foreground">— Do valor de referência do empreendimento (GI × VR)</span>
          </div>
        </div>
      </div>

      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>Nossa Ferramenta</h2>
        <h3 className="font-semibold mb-2">Calculadora SNUC (7 créditos)</h3>
        <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", fontSize: "var(--font-size-sm)", color: "var(--neutral-700)", lineHeight: 1.8 }}>
          <li>Análise da ADA com Geoserver IDE-Sisema</li>
          <li>Verificação de sobreposição com UCs</li>
          <li>Identificação de áreas prioritárias</li>
          <li>Cálculo automático do Grau de Impacto</li>
          <li>Valor estimado em R$</li>
        </ul>
      </div>

      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-4)" }}>Legislação Aplicável</h2>
        <LegislacaoItem titulo="Lei Federal nº 9.985/2000" descricao="Institui o Sistema Nacional de Unidades de Conservação (SNUC)" linkUrl="https://www.planalto.gov.br/ccivil_03/leis/l9985.htm" />
        <LegislacaoItem titulo="Decreto Federal nº 4.340/2002" descricao="Regulamenta artigos da Lei nº 9.985/2000" linkUrl="https://www.planalto.gov.br/ccivil_03/decreto/2002/d4340.htm" />
        <LegislacaoItem titulo="Decreto Estadual nº 45.175/2009" descricao="Metodologia de gradação de impactos ambientais" linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/DEC/45175/2009/?cons=1" />
      </div>
    </div>
  )
}

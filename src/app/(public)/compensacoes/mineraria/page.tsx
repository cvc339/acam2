import type { Metadata } from "next"
import { LegislacaoItem, CompensacaoIcon } from "@/components/acam"

export const metadata: Metadata = {
  title: "Compensação Minerária MG",
}

export default function MinerariaPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      {/* Header */}
      <div className="flex items-start gap-4">
        <div style={{ color: "var(--primary-500)", marginTop: "4px" }}>
          <CompensacaoIcon compensacao="mineraria" size={32} />
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-2xl)", fontWeight: 600 }}>
            Compensação Minerária MG
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Lei Estadual 20.922/2013 · Art. 32</p>
        </div>
      </div>

      {/* O que é */}
      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>
          O que é?
        </h2>
        <p className="text-sm" style={{ lineHeight: 1.8, color: "var(--neutral-700)" }}>
          A Compensação Minerária é uma obrigação prevista na legislação de Minas Gerais para empreendimentos de mineração que suprimem vegetação nativa. Visa compensar os impactos ambientais gerados pela atividade minerária através da proteção e conservação de áreas naturais.
        </p>
      </div>

      {/* Quando se aplica */}
      <div className="acam-card acam-card-primary" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>
          Quando se aplica?
        </h2>
        <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", fontSize: "var(--font-size-sm)", color: "var(--neutral-700)", lineHeight: 1.8 }}>
          <li>Empreendimentos de mineração em Minas Gerais</li>
          <li>Que realizem supressão de vegetação nativa</li>
          <li>Iniciados após 17 de outubro de 2013</li>
        </ul>
        <div style={{ marginTop: "var(--spacing-4)", padding: "var(--spacing-3)", background: "white", borderRadius: "var(--radius-md)" }}>
          <span className="text-xs text-muted-foreground">Proporção de compensação</span>
          <div style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-xl)", fontWeight: 700, color: "var(--primary-600)" }}>
            1:1 <span className="text-sm font-normal text-muted-foreground">— Um hectare compensado para cada hectare suprimido</span>
          </div>
        </div>
      </div>

      {/* Modalidades */}
      <div>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-xl)", fontWeight: 600, marginBottom: "var(--spacing-2)" }}>
          Modalidades de Cumprimento
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ marginTop: "var(--spacing-6)" }}>
          <div className="acam-modalidade-card">
            <span className="acam-modalidade-badge">Modalidade 1</span>
            <div className="acam-modalidade-titulo">Destinar Área em UC</div>
            <div className="acam-modalidade-subtitulo">Regularização Fundiária em UC</div>
            <div className="acam-modalidade-desc">
              Doação de área de vegetação nativa no interior de <strong>Unidade de Conservação de Proteção Integral</strong>.
            </div>
            <div className="acam-modalidade-requisitos">
              <h4>Requisitos:</h4>
              <ul>
                <li>Área com vegetação nativa preservada</li>
                <li>Localizada em UC de Proteção Integral</li>
                <li>Documentação regular</li>
                <li>Aprovação do órgão gestor da UC</li>
              </ul>
            </div>
            <div className="acam-modalidade-destaque">
              <strong>Ferramenta disponível:</strong> Análise de viabilidade (5 créditos)
            </div>
          </div>

          <div className="acam-modalidade-card">
            <span className="acam-modalidade-badge">Modalidade 2</span>
            <div className="acam-modalidade-titulo">Implantação / Manutenção UC</div>
            <div className="acam-modalidade-subtitulo">Pagamento em UFEMGs</div>
            <div className="acam-modalidade-desc">
              Pagamento de valor calculado em UFEMGs para ações de <strong>implantação, regularização ou manutenção</strong> de UC.
            </div>
            <div className="acam-modalidade-requisitos">
              <h4>Inclui:</h4>
              <ul>
                <li>Cálculo do valor devido (UFEMGs)</li>
                <li>Escolha da UC beneficiada</li>
                <li>Definição das ações/projetos</li>
                <li>Fluxo administrativo completo</li>
              </ul>
            </div>
            <div className="acam-modalidade-destaque">
              <strong>Ferramenta disponível:</strong> Cálculo de compensação (2 créditos)
            </div>
          </div>
        </div>
      </div>

      {/* Legislação */}
      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-4)" }}>
          Legislação Aplicável
        </h2>
        <LegislacaoItem titulo="Lei nº 20.922/2013" descricao="Dispõe sobre as políticas florestal e de proteção à biodiversidade no Estado" linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/LEI/20922/2013/?cons=1" />
        <LegislacaoItem titulo="Portaria IEF nº 27/2017" descricao="Estabelece procedimentos para cumprimento da compensação ambiental" linkUrl="http://www.siam.mg.gov.br/sla/download.pdf?idNorma=44102" />
        <LegislacaoItem titulo="Decreto nº 46.953/2016" descricao="Regulamenta a Lei nº 20.922/2013" linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/DEC/46953/2016/?cons=1" />
        <LegislacaoItem titulo="Decreto nº 47.749/2019" descricao="Dispõe sobre os processos de autorização para intervenção ambiental" linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/DEC/47749/2019/?cons=1" />
        <LegislacaoItem titulo="Resolução Conjunta SEMAD/IEF nº 3.102/2021" descricao="Dispõe sobre procedimentos para compensação ambiental" linkUrl="https://siam.mg.gov.br/sla/download.pdf?idNorma=54600" />
      </div>
    </div>
  )
}

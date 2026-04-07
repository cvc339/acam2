import type { Metadata } from "next"
import { LegislacaoItem, CompensacaoIcon } from "@/components/acam"

export const metadata: Metadata = {
  title: "Compensação Mata Atlântica",
}

export default function MataAtlanticaPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      <div className="flex items-start gap-4">
        <div style={{ color: "var(--primary-500)", marginTop: "4px" }}>
          <CompensacaoIcon compensacao="mata-atlantica" size={32} />
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-2xl)", fontWeight: 600 }}>
            Compensação Mata Atlântica
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Lei 11.428/2006 · Decreto 47.749/2019</p>
        </div>
      </div>

      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>O que é?</h2>
        <p className="text-sm" style={{ lineHeight: 1.8, color: "var(--neutral-700)" }}>
          A Compensação Ambiental Florestal Mata Atlântica é uma obrigação prevista na Lei Federal nº 11.428/2006, caracterizada pelo corte ou supressão de vegetação primária ou secundária em estágio médio ou avançado de regeneração no Bioma Mata Atlântica, bem como as disjunções existentes.
        </p>
      </div>

      <div className="acam-card acam-card-primary" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-3)" }}>Quando se aplica?</h2>
        <ul style={{ listStyle: "disc", paddingLeft: "1.25rem", fontSize: "var(--font-size-sm)", color: "var(--neutral-700)", lineHeight: 1.8 }}>
          <li>Corte ou supressão de vegetação primária no Bioma Mata Atlântica</li>
          <li>Supressão de vegetação secundária em estágio médio ou avançado de regeneração</li>
          <li>Área localizada nos limites geográficos do Bioma Mata Atlântica</li>
        </ul>
        <div style={{ marginTop: "var(--spacing-4)", padding: "var(--spacing-3)", background: "white", borderRadius: "var(--radius-md)" }}>
          <span className="text-xs text-muted-foreground">Proporção de compensação</span>
          <div style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-xl)", fontWeight: 700, color: "var(--primary-600)" }}>
            2:1 <span className="text-sm font-normal text-muted-foreground">— Duas vezes a área suprimida (Art. 49, Decreto 47.749/2019)</span>
          </div>
        </div>
      </div>

      {/* Tabela de regras */}
      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-4)" }}>Regras de Supressão e Compensação</h2>
        <div className="overflow-x-auto">
          <table className="acam-normas-table">
            <thead>
              <tr>
                <th>Situação</th>
                <th>Estágio</th>
                <th>Condições</th>
                <th>Compensação</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="cell-name">Utilidade Pública</td>
                <td>Primária, Secundária Avançada e Média</td>
                <td className="cell-detail">Caráter excepcional; inexistência de alternativa técnica e locacional</td>
                <td className="col-decision">Sim (Art. 17)</td>
              </tr>
              <tr>
                <td className="cell-name">Interesse Social</td>
                <td>Secundária Média</td>
                <td className="cell-detail">Caráter excepcional; inexistência de alternativa técnica e locacional</td>
                <td className="col-decision">Sim (Art. 17)</td>
              </tr>
              <tr>
                <td className="cell-name">Mineração</td>
                <td>Secundária Avançada e Média</td>
                <td className="cell-detail">EIA/RIMA obrigatório; inexistência de alternativa técnica e locacional</td>
                <td className="col-decision">Sim (Art. 32)</td>
              </tr>
              <tr>
                <td className="cell-name">Loteamento (perímetro até a Lei)</td>
                <td>Secundária Avançada e Média</td>
                <td className="cell-detail">Preservar mínimo de 50% (avançada) ou 30% (média); atender Plano Diretor</td>
                <td className="col-decision">Sim (Art. 17)</td>
              </tr>
              <tr>
                <td className="cell-name">Loteamento (perímetro após a Lei)</td>
                <td>Secundária Média</td>
                <td className="cell-detail">Preservar mínimo de 50% da vegetação; atender Plano Diretor</td>
                <td className="col-decision">Sim (Art. 17)</td>
              </tr>
              <tr>
                <td className="cell-name">Secundária Inicial</td>
                <td>Secundária Inicial</td>
                <td className="cell-detail">Autorização do órgão estadual. Se menos de 5% de MA remanescente, aplica-se regime do estágio médio</td>
                <td className="col-decision-no">Em regra, não</td>
              </tr>
              <tr>
                <td className="cell-name">Pequeno Produtor</td>
                <td>Secundária Média</td>
                <td className="cell-detail">Atividades imprescindíveis à subsistência; respeitar APP e Reserva Legal</td>
                <td className="col-decision-no">Não</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="acam-legal-note">Art. 17 da Lei 11.428/2006: A compensação consiste na destinação de área equivalente à desmatada, com as mesmas características ecológicas, na mesma bacia hidrográfica.</p>
      </div>

      {/* Modalidades */}
      <div>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-xl)", fontWeight: 600, marginBottom: "var(--spacing-2)" }}>Modalidades de Cumprimento</h2>
        <p className="text-sm text-muted-foreground mb-6">As opções 1 e 2 são prioritárias. A opção 3 só deve ser utilizada quando comprovada a inviabilidade das duas primeiras.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="acam-modalidade-card">
            <span className="acam-modalidade-badge">Opção 1</span>
            <div className="acam-modalidade-titulo">Doação de Área</div>
            <div className="acam-modalidade-subtitulo">Regularização Fundiária em UC</div>
            <div className="acam-modalidade-desc">Destinação de área no interior de <strong>Unidade de Conservação de domínio público</strong> pendente de regularização fundiária.</div>
            <div className="acam-modalidade-requisitos">
              <h4>Requisitos da Área:</h4>
              <ul>
                <li>Mesma bacia hidrográfica de rio federal</li>
                <li>Localizada em Minas Gerais</li>
                <li>Vegetação nativa do Bioma MA</li>
              </ul>
            </div>
            <div className="acam-modalidade-destaque"><strong>Ferramenta disponível:</strong> Análise de viabilidade (7 créditos)</div>
          </div>
          <div className="acam-modalidade-card">
            <span className="acam-modalidade-badge">Opção 2</span>
            <div className="acam-modalidade-titulo">Destinação para Conservação</div>
            <div className="acam-modalidade-subtitulo">Servidão Ambiental ou RPPN</div>
            <div className="acam-modalidade-desc">Destinação de área para conservação mediante <strong>servidão ambiental perpétua</strong> ou criação de <strong>RPPN</strong>.</div>
            <div className="acam-modalidade-requisitos">
              <h4>Requisitos da Área:</h4>
              <ul>
                <li>Mesma bacia hidrográfica</li>
                <li>Características ecológicas similares</li>
                <li>Vegetação nativa do Bioma MA</li>
              </ul>
            </div>
            <div className="acam-modalidade-destaque"><strong>Ferramenta disponível:</strong> Análise de Servidão/RPPN (7 créditos)</div>
          </div>
          <div className="acam-modalidade-card">
            <span className="acam-modalidade-badge">Opção 3</span>
            <div className="acam-modalidade-titulo">Recuperação Florestal</div>
            <div className="acam-modalidade-subtitulo">Plantio de Espécies Nativas</div>
            <div className="acam-modalidade-desc">Somente quando comprovada <strong>a inviabilidade</strong> das opções 1 e 2. Exige PRADA.</div>
            <div className="acam-modalidade-requisitos">
              <h4>Requisitos:</h4>
              <ul>
                <li>Mesma bacia hidrográfica</li>
                <li>Preferencialmente mesma sub-bacia</li>
                <li>Espécies nativas do bioma</li>
              </ul>
            </div>
            <div className="acam-modalidade-destaque"><strong>Atenção:</strong> Exige plantio, monitoramento e vistoria</div>
          </div>
        </div>
      </div>

      <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
        <h2 style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--spacing-4)" }}>Legislação Aplicável</h2>
        <LegislacaoItem titulo="Lei Federal nº 11.428/2006" descricao="Dispõe sobre a utilização e proteção da vegetação nativa do Bioma Mata Atlântica" />
        <LegislacaoItem titulo="Decreto Federal nº 6.660/2008" descricao="Regulamenta a Lei nº 11.428/2006" />
        <LegislacaoItem titulo="Decreto Estadual nº 47.749/2019" descricao="Dispõe sobre os processos de autorização para intervenção ambiental" />
        <LegislacaoItem titulo="Portaria IEF nº 30/2015" descricao="Estabelece diretrizes e procedimentos para cumprimento da compensação" />
      </div>
    </div>
  )
}

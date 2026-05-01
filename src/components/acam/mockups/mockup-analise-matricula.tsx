/**
 * Mockup visual do output da ferramenta Análise de Matrícula.
 * Reproduz fielmente o template real (semáforo + MVAR com barras
 * horizontais + dados do imóvel + proprietários + ônus + georef)
 * com dados 100% fictícios.
 *
 * Sem dados de terceiros — 100% sintético, isento de risco LGPD.
 */
export function MockupAnaliseMatricula() {
  return (
    <div className="acam-mockup">
      {/* Cabeçalho do app */}
      <div className="acam-mockup-app-bar">
        <span className="acam-mockup-app-bar-logo">A</span>
        <span className="acam-mockup-app-bar-marca">ACAM</span>
        <span className="acam-mockup-app-bar-creditos">Créditos: 50</span>
      </div>

      {/* Badge inline + título */}
      <div className="acam-mockup-badge-banner">
        <span className="acam-mockup-badge acam-mockup-badge-success" style={{ flexShrink: 0 }}>Risco Baixo</span>
        <div>
          <strong>Análise de Matrícula — Imóvel exemplo (dados fictícios). Prosseguir</strong>
          <p className="acam-mockup-text-muted">
            Imóvel apresenta condições favoráveis para prosseguir com a aquisição. Pontos de atenção: imóvel não possui georreferenciamento certificado.
          </p>
        </div>
      </div>

      {/* Aviso */}
      <div className="acam-mockup-aviso">
        <strong>Análise preliminar.</strong> Este relatório é uma pré-avaliação automatizada e não substitui parecer técnico ou jurídico.
      </div>

      {/* MVAR */}
      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Avaliação de Viabilidade (MVAR)</p>
        <div className="acam-mockup-mvar-pontuacao">
          <span className="acam-mockup-mvar-num">90</span>
          <span className="acam-mockup-mvar-de">/100</span>
          <span className="acam-mockup-badge acam-mockup-badge-success" style={{ marginLeft: "var(--spacing-2)" }}>Risco Baixo</span>
        </div>

        {[
          { nome: "Jurídica", max: 40, pts: 40 },
          { nome: "Fiscal", max: 30, pts: 30 },
          { nome: "Titularidade", max: 20, pts: 15 },
          { nome: "Técnica", max: 10, pts: 5 },
        ].map((d) => {
          const pct = (d.pts / d.max) * 100
          return (
            <div key={d.nome} className="acam-mockup-mvar-linha">
              <div className="acam-mockup-mvar-cabecalho">
                <span>{d.nome} ({d.max} pts)</span>
                <span><strong>{d.pts}/{d.max}</strong></span>
              </div>
              <div className="acam-mockup-mvar-barra">
                <div className="acam-mockup-mvar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Dados do Imóvel */}
      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Dados do Imóvel</p>
        <div className="acam-mockup-grid-2">
          <div><span className="acam-mockup-field-label">Matrícula</span><span>00.000</span></div>
          <div><span className="acam-mockup-field-label">Cartório</span><span>1º Ofício de Registro de Imóveis (exemplo)</span></div>
          <div><span className="acam-mockup-field-label">Comarca</span><span>Comarca exemplo</span></div>
          <div><span className="acam-mockup-field-label">Área</span><span>200,00 ha</span></div>
          <div><span className="acam-mockup-field-label">CCIR</span><span>00000000000</span></div>
          <div><span className="acam-mockup-field-label">NIRF/CIB</span><span>0.000.000-0</span></div>
        </div>
      </div>

      {/* Proprietários */}
      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Proprietários</p>
        <div className="acam-mockup-prop-linha">
          <span>EMPRESA EXEMPLO LTDA <span className="acam-mockup-text-muted">— 00.000.000/0001-00</span></span>
          <strong>100%</strong>
        </div>
      </div>

      {/* Ônus */}
      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Ônus e Gravames</p>
        <div className="acam-mockup-status-line">
          <span className="acam-mockup-badge acam-mockup-badge-success">Adequado</span>
          <span>Sem ônus. Situação registral favorável.</span>
        </div>
      </div>

      {/* Georeferenciamento */}
      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Georreferenciamento</p>
        <div className="acam-mockup-status-line">
          <span className="acam-mockup-badge acam-mockup-badge-success">Adequado</span>
          <span><strong>Regular</strong> — Prazo: 21/10/2029</span>
        </div>
      </div>
    </div>
  )
}

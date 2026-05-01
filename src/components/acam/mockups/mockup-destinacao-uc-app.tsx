/**
 * Mockup visual do output da ferramenta Destinação UC — APP.
 * Estrutura visual derivada da Destinação UC Base, com seções específicas
 * de bacia hidrográfica e sub-bacia (relevantes para compensação de APP).
 * Dados 100% sintéticos.
 */
export function MockupDestinacaoUCApp() {
  return (
    <div className="acam-mockup">
      <div className="acam-mockup-app-bar">
        <span className="acam-mockup-app-bar-logo">A</span>
        <span className="acam-mockup-app-bar-marca">ACAM</span>
        <span className="acam-mockup-app-bar-creditos">Créditos: 50</span>
      </div>

      <div className="acam-mockup-semaforo acam-mockup-semaforo-verde">
        <p className="acam-mockup-eyebrow">Análise Preliminar de Viabilidade — APP</p>
        <p className="acam-mockup-titulo">Imóvel exemplo (dados fictícios)</p>
        <p className="acam-mockup-subtitulo">Município/MG · 80,00 ha</p>
        <div className="acam-mockup-label">
          <strong>Risco Baixo</strong> — Imóvel atende aos requisitos de bacia, sub-bacia e cobertura nativa para compensação de APP.
        </div>
      </div>

      <div className="acam-mockup-aviso">
        <strong>Análise preliminar.</strong> Este relatório é uma pré-avaliação automatizada e não substitui parecer técnico ou jurídico.
      </div>

      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Bacia hidrográfica</p>
        <div className="acam-mockup-grid-2">
          <div><span className="acam-mockup-field-label">Bacia</span><span>Rio Exemplo</span></div>
          <div><span className="acam-mockup-field-label">Sub-bacia</span><span>Sub-bacia Genérica</span></div>
        </div>
      </div>

      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Localização em Unidade de Conservação</p>
        <div className="acam-mockup-uc-card">
          <div className="acam-mockup-uc-header">
            <strong>PARQUE NACIONAL EXEMPLO</strong>
            <span className="acam-mockup-badge acam-mockup-badge-success">Proteção Integral</span>
          </div>
          <p className="acam-mockup-text-muted">Parque Nacional</p>
          <p className="acam-mockup-text"><strong>100%</strong> do imóvel está no interior da UC (80,00 ha)</p>
        </div>
      </div>

      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Cobertura vegetal</p>
        <div className="acam-mockup-grid-2">
          <div><span className="acam-mockup-field-label">Vegetação nativa</span><span>74% (59,2 ha)</span></div>
          <div><span className="acam-mockup-field-label">Bioma</span><span>Cerrado</span></div>
        </div>
      </div>
    </div>
  )
}

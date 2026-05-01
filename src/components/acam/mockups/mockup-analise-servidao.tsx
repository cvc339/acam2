/**
 * Mockup visual do output da ferramenta Análise de Servidão / RPPN.
 * Foco em validar imóvel candidato a servidão ambiental perpétua ou criação
 * de RPPN — usado para compensação Mata Atlântica modalidade 2.
 * Dados 100% sintéticos.
 */
export function MockupAnaliseServidao() {
  return (
    <div className="acam-mockup">
      <div className="acam-mockup-app-bar">
        <span className="acam-mockup-app-bar-logo">A</span>
        <span className="acam-mockup-app-bar-marca">ACAM</span>
        <span className="acam-mockup-app-bar-creditos">Créditos: 50</span>
      </div>

      <div className="acam-mockup-semaforo acam-mockup-semaforo-verde">
        <p className="acam-mockup-eyebrow">Análise de Servidão Ambiental / RPPN</p>
        <p className="acam-mockup-titulo">Imóvel exemplo (dados fictícios)</p>
        <p className="acam-mockup-subtitulo">Município/MG · 120,00 ha</p>
        <div className="acam-mockup-label">
          <strong>Apto a servidão ambiental</strong> — Bioma Mata Atlântica, vegetação nativa em estágio médio/avançado, dossiê dominial limpo.
        </div>
      </div>

      <div className="acam-mockup-aviso">
        <strong>Análise preliminar.</strong> Este relatório é uma pré-avaliação automatizada e não substitui parecer técnico ou jurídico.
      </div>

      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Bioma e cobertura</p>
        <div className="acam-mockup-grid-2">
          <div><span className="acam-mockup-field-label">Bioma</span><span>Mata Atlântica</span></div>
          <div><span className="acam-mockup-field-label">Estágio</span><span>Médio + Avançado</span></div>
          <div><span className="acam-mockup-field-label">Vegetação nativa</span><span>92% (110,4 ha)</span></div>
          <div><span className="acam-mockup-field-label">Bacia</span><span>Mesma do empreendimento</span></div>
        </div>
      </div>

      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Análise registral resumida</p>
        <div className="acam-mockup-status-line">
          <span className="acam-mockup-badge acam-mockup-badge-success">Adequado</span>
          <span>Matrícula limpa · Sem ônus impeditivos · CCIR regular</span>
        </div>
      </div>

      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Modalidades viáveis</p>
        <div className="acam-mockup-uc-card">
          <div className="acam-mockup-uc-header">
            <strong>Servidão Ambiental Perpétua</strong>
            <span className="acam-mockup-badge acam-mockup-badge-success">Recomendado</span>
          </div>
          <p className="acam-mockup-text-muted">Lei 12.651/2012 · Art. 9º-A</p>
        </div>
        <div className="acam-mockup-uc-card">
          <div className="acam-mockup-uc-header">
            <strong>RPPN — Reserva Particular do Patrimônio Natural</strong>
            <span className="acam-mockup-badge acam-mockup-badge-warning">Viável</span>
          </div>
          <p className="acam-mockup-text-muted">Decreto 5.746/2006 · processo mais longo</p>
        </div>
      </div>
    </div>
  )
}

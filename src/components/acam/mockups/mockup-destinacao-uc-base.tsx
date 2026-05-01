/**
 * Mockup visual do output da ferramenta Destinação UC — Base.
 * Reproduz fielmente a estrutura da tela de resultado real
 * (ver src/app/(dashboard)/ferramentas/destinacao-uc-base/page.tsx),
 * com dados de exemplo de uma análise realista.
 *
 * Uso em landing comercial — não consome créditos, não chama backend.
 */
export function MockupDestinacaoUCBase() {
  return (
    <div className="acam-mockup">
      {/* Semáforo */}
      <div className="acam-mockup-semaforo acam-mockup-semaforo-verde">
        <p className="acam-mockup-eyebrow">Análise Preliminar de Viabilidade</p>
        <p className="acam-mockup-titulo">Fazenda Santa Helena</p>
        <p className="acam-mockup-subtitulo">Itabira/MG · 187,4 ha</p>
        <div className="acam-mockup-label">
          <strong>Risco Baixo</strong> — Imóvel com matrícula limpa em UC de Proteção Integral
        </div>
      </div>

      {/* UC */}
      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Localização em Unidade de Conservação</p>
        <div className="acam-mockup-uc">
          <div className="acam-mockup-uc-header">
            <strong>Parque Estadual Serra do Brigadeiro</strong>
            <span className="acam-mockup-badge acam-mockup-badge-success">Proteção Integral</span>
          </div>
          <p className="acam-mockup-text-muted">Categoria: Parque Estadual</p>
          <p className="acam-mockup-text">
            <strong>100%</strong> do imóvel no interior da UC (187,4 ha)
          </p>
        </div>
      </div>

      {/* Matrícula */}
      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Análise da Matrícula</p>
        <div className="acam-mockup-grid-2">
          <div><span className="acam-mockup-field-label">Matrícula</span><span>15.428</span></div>
          <div><span className="acam-mockup-field-label">Cartório</span><span>1º Ofício de Itabira</span></div>
          <div><span className="acam-mockup-field-label">Área</span><span>187,4 ha</span></div>
          <div><span className="acam-mockup-field-label">CCIR</span><span>regular</span></div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="acam-mockup-disclaimer">
        Análise preliminar automatizada — não substitui parecer técnico ou jurídico.
      </div>
    </div>
  )
}

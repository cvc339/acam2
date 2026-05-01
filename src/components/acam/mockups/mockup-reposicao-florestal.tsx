/**
 * Mockup visual do output da ferramenta Cálculo de Reposição Florestal (gratuita).
 * Calculadora pública — recebe quantitativos de produtos e calcula reposição
 * em árvores e em valor (UFEMG).
 * Dados 100% sintéticos.
 */
export function MockupReposicaoFlorestal() {
  return (
    <div className="acam-mockup">
      <div className="acam-mockup-app-bar">
        <span className="acam-mockup-app-bar-logo">A</span>
        <span className="acam-mockup-app-bar-marca">ACAM</span>
        <span className="acam-mockup-app-bar-creditos">Gratuita</span>
      </div>

      <div className="acam-mockup-resultado-dark">
        <div className="acam-mockup-resultado-grid">
          <div className="acam-mockup-resultado-cell">
            <p className="acam-mockup-resultado-label">Total de árvores</p>
            <p className="acam-mockup-resultado-valor">240</p>
            <p className="acam-mockup-resultado-sub">a serem plantadas</p>
          </div>
          <div className="acam-mockup-resultado-cell">
            <p className="acam-mockup-resultado-label">Valor estimado</p>
            <p className="acam-mockup-resultado-valor">R$ 8.420,00</p>
            <p className="acam-mockup-resultado-sub">UFEMG 2026 · referência</p>
          </div>
        </div>
      </div>

      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Itens calculados</p>
        <div className="acam-mockup-fluxo">
          <div className="acam-mockup-prop-linha">
            <span>Lenha de floresta nativa · 10 m³</span>
            <strong>60 árv.</strong>
          </div>
          <div className="acam-mockup-prop-linha">
            <span>Carvão vegetal · 20 mdc</span>
            <strong>120 árv.</strong>
          </div>
          <div className="acam-mockup-prop-linha">
            <span>Mourão e estacas · 60 unid.</span>
            <strong>60 árv.</strong>
          </div>
        </div>
      </div>

      <div className="acam-mockup-aviso">
        <strong>Valores referenciais.</strong> Valor definitivo apurado pelo IEF conforme parâmetros vigentes.
      </div>
    </div>
  )
}

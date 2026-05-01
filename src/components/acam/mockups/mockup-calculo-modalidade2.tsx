/**
 * Mockup visual do output da ferramenta Cálculo de Implantação/Manutenção UC (Modalidade 2).
 * Reproduz a estrutura da tela real (page.tsx linha ~200) com dados de exemplo.
 */
export function MockupCalculoModalidade2() {
  return (
    <div className="acam-mockup">
      <div className="acam-mockup-resultado-dark">
        <div className="acam-mockup-resultado-grid">
          <div className="acam-mockup-resultado-cell">
            <p className="acam-mockup-resultado-label">Área a suprimir</p>
            <p className="acam-mockup-resultado-valor">12,40 ha</p>
          </div>
          <div className="acam-mockup-resultado-cell">
            <p className="acam-mockup-resultado-label">Valor em UFEMGs</p>
            <p className="acam-mockup-resultado-valor">38.420</p>
            <p className="acam-mockup-resultado-sub">3.098,4 UFEMGs/ha</p>
          </div>
          <div className="acam-mockup-resultado-cell">
            <p className="acam-mockup-resultado-label">Valor em Reais</p>
            <p className="acam-mockup-resultado-valor">R$ 222.450,00</p>
            <p className="acam-mockup-resultado-sub">UFEMG 2026: R$ 5,7899</p>
          </div>
        </div>
      </div>

      <p className="acam-mockup-vegetacao">Vegetação: <strong>Mata Atlântica em estágio médio</strong></p>

      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Fluxo administrativo estimado</p>
        <p className="acam-mockup-text-muted" style={{ marginBottom: "var(--spacing-3)" }}>
          Prazo total estimado: 18-60 meses
        </p>
        <ol className="acam-mockup-fluxo">
          <li>
            <span className="acam-mockup-fluxo-num">1</span>
            <div>
              <strong>Protocolo do requerimento</strong>
              <span className="acam-mockup-fluxo-prazo">~30 dias</span>
            </div>
          </li>
          <li>
            <span className="acam-mockup-fluxo-num">2</span>
            <div>
              <strong>Análise técnica IEF/SEMAD</strong>
              <span className="acam-mockup-fluxo-prazo">~6 meses</span>
            </div>
          </li>
          <li>
            <span className="acam-mockup-fluxo-num">3</span>
            <div>
              <strong>Pagamento ou execução de projeto em UC</strong>
              <span className="acam-mockup-fluxo-prazo">~12-48 meses</span>
            </div>
          </li>
        </ol>
      </div>
    </div>
  )
}

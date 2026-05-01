/**
 * Mockup visual do output da ferramenta Destinação UC — Base.
 * Reproduz fielmente a estrutura e hierarquia visual da tela de
 * resultado real (ver src/app/(dashboard)/ferramentas/destinacao-uc-base/page.tsx),
 * com dados 100% fictícios e genéricos para uso em landing comercial.
 *
 * Sem dados de terceiros — 100% sintético, isento de risco LGPD.
 */
export function MockupDestinacaoUCBase() {
  return (
    <div className="acam-mockup">
      {/* Cabeçalho do app (linha do topo) */}
      <div className="acam-mockup-app-bar">
        <span className="acam-mockup-app-bar-logo">A</span>
        <span className="acam-mockup-app-bar-marca">ACAM</span>
        <span className="acam-mockup-app-bar-creditos">Créditos: 50</span>
      </div>

      {/* Semáforo */}
      <div className="acam-mockup-semaforo acam-mockup-semaforo-verde">
        <p className="acam-mockup-eyebrow">Análise Preliminar de Viabilidade</p>
        <p className="acam-mockup-titulo">Imóvel exemplo (dados fictícios)</p>
        <p className="acam-mockup-subtitulo">Município/MG · 200,00 ha</p>
        <div className="acam-mockup-label">
          <strong>Risco Baixo</strong> — Nenhum impedimento ou ônus ativo identificado. Imóvel em condições favoráveis para destinação.
        </div>
      </div>

      {/* Disclaimer */}
      <div className="acam-mockup-aviso">
        <strong>Análise preliminar.</strong> Este relatório é uma pré-avaliação automatizada e não substitui parecer técnico ou jurídico.
      </div>

      {/* Localização em UC */}
      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Localização em Unidade de Conservação</p>
        <p className="acam-mockup-text-muted" style={{ marginBottom: "var(--spacing-2)" }}>
          Para compensação minerária, o imóvel deve estar inserido em UC de Proteção Integral pendente de regularização fundiária (Lei Estadual 20.922/2013).
        </p>

        <div className="acam-mockup-uc-card">
          <div className="acam-mockup-uc-header">
            <strong>PARQUE ESTADUAL EXEMPLO</strong>
            <span className="acam-mockup-badge acam-mockup-badge-success">Proteção Integral</span>
          </div>
          <p className="acam-mockup-text-muted">Parque Estadual</p>
          <p className="acam-mockup-text"><strong>100%</strong> do imóvel está no interior da UC (200,00 ha)</p>
        </div>

        <div className="acam-mockup-uc-card">
          <div className="acam-mockup-uc-header">
            <strong>APA Municipal Demonstração</strong>
            <span className="acam-mockup-badge acam-mockup-badge-warning">Uso Sustentável</span>
          </div>
          <p className="acam-mockup-text-muted">APA</p>
          <p className="acam-mockup-text"><strong>40%</strong> do imóvel está no interior da UC (80,00 ha)</p>
        </div>

        <div className="acam-mockup-regime">
          <div className="acam-mockup-regime-label">
            Regime de<br/>UC de<br/>Proteção<br/>Integral
          </div>
          <div className="acam-mockup-regime-corpo">
            Imóvel inserido em UC de proteção integral — restrição de uso total. Possível direito à desapropriação indireta ou regularização fundiária pelo órgão gestor. Transmissão entre particulares é juridicamente possível, mas o adquirente assume as limitações do regime da UC.
          </div>
        </div>

        {/* Mapa esquemático em SVG (não revela imóvel real) */}
        <div className="acam-mockup-mapa">
          <svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
            <rect width="320" height="140" fill="#f0e8d8" />
            {/* "rio" estilizado */}
            <path d="M 0 30 Q 80 50, 160 35 T 320 45" stroke="#a8c8a8" strokeWidth="3" fill="none" opacity="0.7" />
            {/* "linha de UC" */}
            <path d="M 0 90 Q 80 70, 160 95 T 320 80" stroke="#1a3a2a" strokeWidth="1" strokeDasharray="3,3" fill="none" opacity="0.5" />
            {/* polígono do imóvel ilustrativo */}
            <polygon
              points="120,55 200,60 215,95 175,115 130,108 110,80"
              fill="#c17f59"
              fillOpacity="0.3"
              stroke="#1a3a2a"
              strokeWidth="1.2"
            />
            <text x="160" y="135" textAnchor="middle" fontSize="7" fill="#737373" fontFamily="Arial">
              Mapa esquemático ilustrativo
            </text>
          </svg>
        </div>
      </div>
    </div>
  )
}

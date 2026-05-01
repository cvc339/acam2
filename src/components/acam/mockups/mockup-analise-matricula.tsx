/**
 * Mockup visual do output da ferramenta Análise de Matrícula.
 * Reproduz a estrutura da tela real de parecer registral + MVAR.
 */
export function MockupAnaliseMatricula() {
  return (
    <div className="acam-mockup">
      {/* Cabeçalho com semáforo */}
      <div className="acam-mockup-semaforo acam-mockup-semaforo-amarelo">
        <p className="acam-mockup-eyebrow">Parecer registral · MVAR</p>
        <p className="acam-mockup-titulo">Matrícula nº 8.143</p>
        <p className="acam-mockup-subtitulo">2º Ofício de Conceição do Mato Dentro/MG · 412,7 ha</p>
        <div className="acam-mockup-label">
          <strong>Risco Médio · MVAR 68/100</strong> — 1 ressalva fiscal e 1 diligência registral
        </div>
      </div>

      {/* Proprietários */}
      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Proprietários atuais</p>
        <ul className="acam-mockup-list">
          <li><strong>Mineradora Vale do Cipó S.A.</strong> · 100% · CNPJ ●●.●●●.●●●/●●●●-●●</li>
        </ul>
      </div>

      {/* MVAR */}
      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">MVAR — Matriz de viabilidade registral</p>
        <div className="acam-mockup-grid-2">
          <div className="acam-mockup-mvar-cell">
            <span className="acam-mockup-field-label">Jurídica</span>
            <strong>22/25</strong>
          </div>
          <div className="acam-mockup-mvar-cell">
            <span className="acam-mockup-field-label">Fiscal</span>
            <strong>18/25</strong>
          </div>
          <div className="acam-mockup-mvar-cell">
            <span className="acam-mockup-field-label">Titularidade</span>
            <strong>15/25</strong>
          </div>
          <div className="acam-mockup-mvar-cell">
            <span className="acam-mockup-field-label">Técnica</span>
            <strong>13/25</strong>
          </div>
        </div>
      </div>

      {/* Ressalvas */}
      <div className="acam-mockup-bloco">
        <p className="acam-mockup-bloco-titulo">Ressalvas e diligências</p>
        <ul className="acam-mockup-list-warning">
          <li>CND municipal vencida (verificar emissão de nova certidão)</li>
          <li>Hipoteca em 1º grau averbada (Ato R-12) — verificar se cancelada</li>
        </ul>
      </div>

      <div className="acam-mockup-disclaimer">
        Análise documental automatizada — confira dados originais antes de protocolar.
      </div>
    </div>
  )
}

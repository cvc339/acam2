interface Caminho {
  badge: string
  titulo: string
  subtitulo?: string
  descricao: string
  /** Trade-off / consideração estratégica */
  tradeoff: string
}

interface CaminhosPossiveisProps {
  titulo?: string
  intro: string
  caminhos: Caminho[]
}

export function CaminhosPossiveis({
  titulo = "Caminhos possíveis",
  intro,
  caminhos,
}: CaminhosPossiveisProps) {
  return (
    <section className="acam-caminhos-possiveis">
      <h2 className="acam-landing-section-titulo">{titulo}</h2>
      <p className="acam-caminhos-possiveis-intro">{intro}</p>
      <div className="acam-caminhos-possiveis-grid">
        {caminhos.map((c, i) => (
          <div key={i} className="acam-caminhos-possiveis-card">
            <span className="acam-caminhos-possiveis-badge">{c.badge}</span>
            <h3 className="acam-caminhos-possiveis-titulo">{c.titulo}</h3>
            {c.subtitulo && <p className="acam-caminhos-possiveis-subtitulo">{c.subtitulo}</p>}
            <p className="acam-caminhos-possiveis-desc">{c.descricao}</p>
            <div className="acam-caminhos-possiveis-tradeoff">
              <strong>Trade-off:</strong> {c.tradeoff}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

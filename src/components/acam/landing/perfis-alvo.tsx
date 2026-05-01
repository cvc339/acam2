interface PerfilAlvo {
  titulo: string
  descricao: string
}

interface PerfisAlvoProps {
  /** Título da seção (ex.: "Para quem é esta página") */
  titulo?: string
  perfis: PerfilAlvo[]
}

export function PerfisAlvo({ titulo = "Para quem é esta página", perfis }: PerfisAlvoProps) {
  return (
    <section className="acam-perfis-alvo">
      <h2 className="acam-landing-section-titulo">{titulo}</h2>
      <div className="acam-perfis-alvo-grid">
        {perfis.map((p, i) => (
          <div key={i} className="acam-perfis-alvo-card">
            <strong>{p.titulo}</strong>
            <p>{p.descricao}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

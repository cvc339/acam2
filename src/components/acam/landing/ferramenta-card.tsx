import Link from "next/link"

interface FerramentaCardProps {
  /** Nome editorial da ferramenta (ex.: "Análise de viabilidade de área") */
  nome: string
  /** Promessa de valor em 1 linha — orientada a benefício, não a feature */
  tagline: string
  /** Mockup visual do output (componente React renderizado) */
  mockup: React.ReactNode
  /** 3-4 bullets do que o usuário recebe */
  entregas: string[]
  /** Linha de ancoragem (créditos, tempo, comparação) */
  ancoragem: string
  /** URL da ferramenta */
  href: string
  /** Texto do botão de CTA (default: "Usar ferramenta") */
  ctaLabel?: string
}

export function FerramentaCard({
  nome,
  tagline,
  mockup,
  entregas,
  ancoragem,
  href,
  ctaLabel = "Usar ferramenta",
}: FerramentaCardProps) {
  return (
    <article className="acam-ferramenta-card">
      <div className="acam-ferramenta-card-mockup">
        {mockup}
      </div>
      <div className="acam-ferramenta-card-conteudo">
        <h3 className="acam-ferramenta-card-nome">{nome}</h3>
        <p className="acam-ferramenta-card-tagline">{tagline}</p>
        <ul className="acam-ferramenta-card-entregas">
          {entregas.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
        <p className="acam-ferramenta-card-ancoragem">{ancoragem}</p>
        <Link href={href} className="acam-btn acam-btn-primary">
          {ctaLabel}
        </Link>
      </div>
    </article>
  )
}

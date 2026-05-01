import { CompensacaoIcon, type Compensacao } from "../compensacao-icon"

interface HeroCompensacaoProps {
  /** Categoria editorial sobre o título (caps, kerning amplo) */
  eyebrow: string
  /** Título principal */
  titulo: string
  /** Tagline editorial em itálico (1-2 linhas) */
  tagline: string
  /** Linha de fatos rápidos (normas, proporção) */
  fatosRapidos: string
  /** Slug da compensação para o ícone */
  compensacao: Compensacao
}

export function HeroCompensacao({
  eyebrow,
  titulo,
  tagline,
  fatosRapidos,
  compensacao,
}: HeroCompensacaoProps) {
  return (
    <section className="acam-hero-compensacao">
      <div className="acam-hero-compensacao-icon">
        <CompensacaoIcon compensacao={compensacao} size={40} />
      </div>
      <p className="acam-hero-compensacao-eyebrow">{eyebrow}</p>
      <h1 className="acam-hero-compensacao-titulo">{titulo}</h1>
      <p className="acam-hero-compensacao-tagline">{tagline}</p>
      <p className="acam-hero-compensacao-fatos">{fatosRapidos}</p>
    </section>
  )
}

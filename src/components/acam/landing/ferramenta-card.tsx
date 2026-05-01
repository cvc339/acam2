import Link from "next/link"
import Image from "next/image"

/** Coordenadas de uma máscara de proteção LGPD aplicada sobre a imagem.
 *  Valores em percentual (string com "%") relativos à imagem renderizada. */
export interface MascaraLGPD {
  top: string
  left: string
  width: string
  height: string
  /** Texto opcional exibido dentro da tarja (ex.: "Dados protegidos") */
  label?: string
}

interface FerramentaCardProps {
  /** Nome editorial da ferramenta (ex.: "Análise de viabilidade de área") */
  nome: string
  /** Promessa de valor em 1 linha — orientada a benefício, não a feature */
  tagline: string
  /** Mockup visual do output: ou URL de imagem (preferencial), ou componente React (fallback) */
  mockupImage?: string
  mockupImageAlt?: string
  mockup?: React.ReactNode
  /** Tarjas de proteção LGPD sobrepostas à imagem em coordenadas percentuais */
  mascaras?: MascaraLGPD[]
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
  mockupImage,
  mockupImageAlt,
  mockup,
  mascaras,
  entregas,
  ancoragem,
  href,
  ctaLabel = "Usar ferramenta",
}: FerramentaCardProps) {
  return (
    <article className="acam-ferramenta-card">
      <div className="acam-ferramenta-card-mockup">
        {mockupImage ? (
          <div className="acam-ferramenta-card-mockup-imagem">
            <Image
              src={mockupImage}
              alt={mockupImageAlt ?? `Tela de resultado da ferramenta ${nome}`}
              width={800}
              height={600}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            {mascaras?.map((m, i) => (
              <div
                key={i}
                className="acam-ferramenta-card-mascara-lgpd"
                style={{
                  top: m.top,
                  left: m.left,
                  width: m.width,
                  height: m.height,
                }}
                aria-hidden="true"
              >
                {m.label && <span>{m.label}</span>}
              </div>
            ))}
          </div>
        ) : (
          mockup
        )}
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

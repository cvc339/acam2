import Link from "next/link"

interface CTAEspecialistaProps {
  /** Pergunta-gancho contextual (ex.: "O caso é mais específico do que uma ferramenta resolve?") */
  pergunta: string
  /** Texto explicativo (1-2 frases) */
  descricao: string
}

/**
 * Versão destacada do CTA de consultoria, para uso em landings de compensação.
 * Posiciona-se como camada complementar às ferramentas, com identificação clara
 * do especialista responsável (Cláudio Vieira Castro, OAB/MG 76.351).
 */
export function CTAEspecialista({ pergunta, descricao }: CTAEspecialistaProps) {
  return (
    <section className="acam-cta-especialista">
      <div className="acam-cta-especialista-conteudo">
        <h2 className="acam-cta-especialista-pergunta">{pergunta}</h2>
        <p className="acam-cta-especialista-descricao">{descricao}</p>
        <div className="acam-cta-especialista-assinatura">
          <div className="acam-cta-especialista-avatar">CV</div>
          <div>
            <p className="acam-cta-especialista-nome">Cláudio Vieira Castro</p>
            <p className="acam-cta-especialista-titulo">Especialista em compensações ambientais · OAB/MG 76.351</p>
          </div>
        </div>
      </div>
      <div className="acam-cta-especialista-acao">
        <Link href="/ferramentas/consultoria" className="acam-btn acam-btn-accent">
          Agendar reunião técnica
        </Link>
        <p className="acam-cta-especialista-detalhe">30 minutos · 15 créditos · agendamento online</p>
      </div>
    </section>
  )
}

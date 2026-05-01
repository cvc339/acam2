interface ContextoEducativoProps {
  /** Título do bloco (ex.: "A obrigação em 3 minutos") */
  titulo: string
  children: React.ReactNode
}

export function ContextoEducativo({ titulo, children }: ContextoEducativoProps) {
  return (
    <section className="acam-contexto-educativo">
      <h2 className="acam-landing-section-titulo">{titulo}</h2>
      <div className="acam-contexto-educativo-corpo">
        {children}
      </div>
    </section>
  )
}

interface FaqItem {
  pergunta: string
  resposta: React.ReactNode
}

interface FaqRapidoProps {
  titulo?: string
  itens: FaqItem[]
}

/**
 * Accordion de perguntas frequentes para quebrar objeções no fim
 * de uma página de compensação. Usa <details>/<summary> nativo —
 * sem JS, acessível, expansível com teclado.
 */
export function FaqRapido({ titulo = "Perguntas frequentes", itens }: FaqRapidoProps) {
  return (
    <section className="acam-faq-rapido">
      <h2 className="acam-landing-section-titulo">{titulo}</h2>
      <div className="acam-faq-rapido-lista">
        {itens.map((item, i) => (
          <details key={i} className="acam-faq-rapido-item">
            <summary>{item.pergunta}</summary>
            <div className="acam-faq-rapido-resposta">{item.resposta}</div>
          </details>
        ))}
      </div>
    </section>
  )
}

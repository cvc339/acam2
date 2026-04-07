import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Termos de Uso",
}

export default function TermosPage() {
  return (
    <article className="space-y-8" style={{ fontSize: "var(--font-size-sm)", color: "var(--neutral-700)", lineHeight: 1.8 }}>
      <div>
        <h1 className="text-2xl font-semibold mb-2">Termos de Uso</h1>
        <p className="text-muted-foreground">Última atualização: abril de 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>1. Aceitação dos termos</h2>
        <p>Ao acessar e utilizar a plataforma ACAM (&ldquo;Plataforma&rdquo;), operada por Vieira Castro Sociedade Individual de Advocacia, inscrita no CNPJ sob o nº 04.609.894/0001-72, com sede em Montes Claros/MG, você concorda integralmente com estes Termos de Uso.</p>
        <p>Caso não concorde com qualquer disposição, não utilize a Plataforma.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>2. Descrição do serviço</h2>
        <p>A Plataforma ACAM disponibiliza ferramentas de análise, cálculo e preenchimento de documentos relacionados a compensações ambientais previstas na legislação de Minas Gerais. As funcionalidades incluem, mas não se limitam a:</p>
        <ul style={{ paddingLeft: "1.25rem", listStyle: "disc" }}>
          <li>Checklist de identificação de compensações aplicáveis (gratuito)</li>
          <li>Calculadora de intervenção ambiental (gratuita)</li>
          <li>Cálculo de reposição florestal (gratuito)</li>
          <li>Análise de viabilidade de imóveis para destinação em UC (pago)</li>
          <li>Calculadoras de compensação SNUC e minerária (pago)</li>
          <li>Preenchimento assistido de requerimentos (pago)</li>
          <li>Páginas informativas sobre legislação e modalidades de cumprimento</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>3. Natureza das análises</h2>
        <p><strong>As análises fornecidas pela Plataforma são preliminares e não substituem trabalhos de campo, pareceres técnicos ou análises de profissionais qualificados, mediante responsabilidade técnica.</strong></p>
        <p>A Plataforma utiliza dados públicos (IDE-Sisema, MapBiomas, bases geoespaciais) e informações fornecidas pelo usuário. Os resultados são indicativos e não constituem parecer jurídico, laudo técnico ou documento oficial.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>4. Cadastro e conta</h2>
        <p>Para utilizar as ferramentas pagas, é necessário criar uma conta com informações verdadeiras e atualizadas. O usuário é responsável pela segurança de suas credenciais de acesso.</p>
        <p>A Plataforma reserva-se o direito de suspender ou encerrar contas que violem estes Termos.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>5. Sistema de créditos</h2>
        <p>As ferramentas pagas funcionam mediante sistema de créditos:</p>
        <ul style={{ paddingLeft: "1.25rem", listStyle: "disc" }}>
          <li>Créditos são adquiridos via Mercado Pago (PIX, cartão ou boleto)</li>
          <li>Créditos não expiram</li>
          <li>Cada ferramenta consome uma quantidade pré-definida de créditos</li>
          <li>Em caso de falha no processamento, os créditos são reembolsados automaticamente</li>
          <li>Créditos adquiridos não são reembolsáveis em dinheiro, exceto em caso de duplicidade de cobrança</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>6. Propriedade intelectual</h2>
        <p>O design, código, marcas e metodologias de cálculo da Plataforma são de propriedade de Vieira Castro Sociedade Individual de Advocacia. Os conteúdos normativos e legislativos apresentados são de domínio público e pertencem aos respectivos órgãos emissores.</p>
        <p>Os relatórios em PDF gerados pela Plataforma devem ser salvos pelo usuário no momento da geração. <strong>A Plataforma não armazena relatórios gerados.</strong> Os relatórios podem ser utilizados pelo usuário para fins profissionais, mas não podem ser redistribuídos comercialmente.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>7. Limitação de responsabilidade</h2>
        <p>A Plataforma não se responsabiliza por:</p>
        <ul style={{ paddingLeft: "1.25rem", listStyle: "disc" }}>
          <li>Decisões tomadas com base nas análises preliminares</li>
          <li>Indisponibilidade de serviços externos (IDE-Sisema, APIs governamentais)</li>
          <li>Erros em dados fornecidos pelo usuário</li>
          <li>Alterações na legislação posteriores à análise</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>8. Modificações</h2>
        <p>Estes Termos podem ser atualizados periodicamente. O uso continuado da Plataforma após alterações constitui aceitação dos novos termos.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>9. Foro</h2>
        <p>Fica eleito o foro da comarca de Montes Claros/MG para dirimir quaisquer questões decorrentes destes Termos.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>10. Contato</h2>
        <p>Para dúvidas sobre estes Termos: <a href="mailto:atendimento@vieiracastro.com.br" style={{ color: "var(--primary-600)" }}>atendimento@vieiracastro.com.br</a></p>
      </section>
    </article>
  )
}

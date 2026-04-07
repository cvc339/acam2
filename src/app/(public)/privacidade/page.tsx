import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidade",
}

export default function PrivacidadePage() {
  return (
    <article className="space-y-8" style={{ fontSize: "var(--font-size-sm)", color: "var(--neutral-700)", lineHeight: 1.8 }}>
      <div>
        <h1 className="text-2xl font-semibold mb-2">Política de Privacidade</h1>
        <p className="text-muted-foreground">Última atualização: abril de 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>1. Controlador dos dados</h2>
        <p>O controlador dos dados pessoais coletados pela plataforma ACAM é Vieira Castro Sociedade Individual de Advocacia, inscrita no CNPJ sob o nº 04.609.894/0001-72, com sede em Montes Claros/MG.</p>
        <p>Contato do encarregado: <a href="mailto:atendimento@vieiracastro.com.br" style={{ color: "var(--primary-600)" }}>atendimento@vieiracastro.com.br</a></p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>2. Dados coletados</h2>
        <p><strong>Dados de cadastro:</strong> nome, e-mail, telefone, empresa, CPF/CNPJ.</p>
        <p><strong>Dados de uso:</strong> ferramentas acessadas, consultas realizadas, créditos consumidos.</p>
        <p><strong>Dados de documentos:</strong> arquivos enviados para análise (matrículas, KML, CCIR, ITR, CAR, CND). Esses documentos são processados para gerar as análises e <strong>não são armazenados pela Plataforma</strong>. Após o processamento, os arquivos são descartados.</p>
        <p><strong>Dados de pagamento:</strong> processados diretamente pelo Mercado Pago. A Plataforma não armazena dados de cartão de crédito.</p>
        <p><strong>Dados de navegação:</strong> registro de acesso a ferramentas para fins de melhoria do serviço.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>3. Finalidade do tratamento</h2>
        <p>Os dados pessoais são tratados para:</p>
        <ul style={{ paddingLeft: "1.25rem", listStyle: "disc" }}>
          <li>Criação e gestão da conta do usuário</li>
          <li>Processamento de análises de compensações ambientais</li>
          <li>Processamento de pagamentos e gestão de créditos</li>
          <li>Envio de comunicações transacionais (verificação de e-mail, confirmação de compra, entrega de relatórios)</li>
          <li>Envio de comunicações sobre novidades, produtos e promoções (mediante consentimento)</li>
          <li>Melhoria contínua da Plataforma</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>4. Base legal</h2>
        <p>O tratamento dos dados é fundamentado nas seguintes bases legais da LGPD (Lei 13.709/2018):</p>
        <ul style={{ paddingLeft: "1.25rem", listStyle: "disc" }}>
          <li><strong>Execução de contrato</strong> (Art. 7º, V): para prestação dos serviços contratados</li>
          <li><strong>Consentimento</strong> (Art. 7º, I): para envio de comunicações de marketing</li>
          <li><strong>Legítimo interesse</strong> (Art. 7º, IX): para melhoria da Plataforma e prevenção de fraudes</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>5. Compartilhamento</h2>
        <p>Os dados pessoais podem ser compartilhados com:</p>
        <ul style={{ paddingLeft: "1.25rem", listStyle: "disc" }}>
          <li><strong>Supabase</strong>: armazenamento seguro de dados e autenticação</li>
          <li><strong>Mercado Pago</strong>: processamento de pagamentos</li>
          <li><strong>Resend</strong>: envio de e-mails transacionais</li>
          <li><strong>Anthropic (Claude API)</strong>: análise de documentos — os dados são processados e não armazenados pelo provedor</li>
        </ul>
        <p>Não vendemos, alugamos ou compartilhamos dados pessoais com terceiros para fins de marketing.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>6. Armazenamento e segurança</h2>
        <p>Os dados são armazenados em servidores Supabase (região São Paulo, Brasil) com:</p>
        <ul style={{ paddingLeft: "1.25rem", listStyle: "disc" }}>
          <li>Criptografia em trânsito (TLS) e em repouso</li>
          <li>Row Level Security (RLS) — cada usuário acessa apenas seus próprios dados</li>
          <li>Backups automatizados</li>
          <li>Acesso restrito por credenciais seguras</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>7. Direitos do titular</h2>
        <p>Nos termos da LGPD, você tem direito a:</p>
        <ul style={{ paddingLeft: "1.25rem", listStyle: "disc" }}>
          <li>Confirmar a existência de tratamento de seus dados</li>
          <li>Acessar seus dados pessoais</li>
          <li>Corrigir dados incompletos ou desatualizados</li>
          <li>Solicitar a exclusão de seus dados (respeitadas obrigações legais de retenção)</li>
          <li>Revogar o consentimento para comunicações de marketing</li>
          <li>Solicitar a portabilidade dos dados</li>
        </ul>
        <p>Para exercer esses direitos, entre em contato pelo e-mail <a href="mailto:atendimento@vieiracastro.com.br" style={{ color: "var(--primary-600)" }}>atendimento@vieiracastro.com.br</a>.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>8. Retenção</h2>
        <p>Os dados de cadastro são mantidos enquanto a conta estiver ativa ou conforme necessário para cumprir obrigações legais. Documentos enviados para análise não são armazenados — são processados e descartados imediatamente.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>9. Cookies</h2>
        <p>A Plataforma utiliza cookies essenciais para autenticação e manutenção da sessão do usuário. Não utilizamos cookies de rastreamento ou publicidade de terceiros.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold" style={{ color: "var(--neutral-900)" }}>10. Alterações</h2>
        <p>Esta política pode ser atualizada periodicamente. Alterações significativas serão comunicadas por e-mail aos usuários cadastrados.</p>
      </section>
    </article>
  )
}

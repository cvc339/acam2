import type { Metadata } from "next"
import {
  HeroCompensacao,
  PerfisAlvo,
  ContextoEducativo,
  CaminhosPossiveis,
  FerramentaCard,
  CTAEspecialista,
  FaqRapido,
  LegislacaoItem,
  MockupDestinacaoUCApp,
  MockupAnaliseMatricula,
} from "@/components/acam"

export const metadata: Metadata = {
  title: "Compensação por intervenção em APP — Minas Gerais",
  description:
    "Intervenção em Área de Preservação Permanente em MG. Análise de viabilidade da área compensatória, validação registral e fundamentação normativa.",
}

export default function AppPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
      <HeroCompensacao
        compensacao="app"
        eyebrow="Compensação ambiental · APP"
        titulo="Compensação por intervenção em APP"
        tagline="Quem intervém em Área de Preservação Permanente compensa em área equivalente. Os caminhos variam — recuperação, doação para UC ou área verde urbana."
        fatosRapidos="Resolução CONAMA 369/2006 · Decreto MG 47.749/2019 · Proporção 1:1"
      />

      <PerfisAlvo
        perfis={[
          {
            titulo: "Empreendimento com intervenção autorizada",
            descricao: "Você recebeu autorização para intervir em APP e precisa cumprir a compensação.",
          },
          {
            titulo: "Consultoria orçando o projeto",
            descricao: "Seu cliente precisa entender o passivo de compensação por APP antes de aprovar o projeto.",
          },
          {
            titulo: "Loteador planejando empreendimento",
            descricao: "O parcelamento de solo envolve APP e você precisa estruturar a compensação.",
          },
          {
            titulo: "Concessionária ou poder público",
            descricao: "Obras de utilidade pública (estradas, saneamento) frequentemente envolvem APP.",
          },
        ]}
      />

      <ContextoEducativo titulo="A obrigação em três minutos">
        <p>
          A intervenção em <strong>Área de Preservação Permanente</strong> é regra de exceção — só admitida em casos de utilidade pública, interesse social ou baixo impacto ambiental, conforme Resolução CONAMA 369/2006. Quando autorizada, surge a obrigação de compensar com área equivalente.
        </p>
        <p>
          A compensação por APP tem peculiaridade: prefere-se a <strong>recuperação na mesma sub-bacia hidrográfica</strong>. Quando isso é inviável, há caminhos alternativos — recuperação em UC, doação de área para UC, ou implantação de área verde urbana.
        </p>
        <p>
          Antes da escolha do caminho, há diagnóstico técnico necessário: a área proposta como compensação atende às exigências de bacia, sub-bacia, vegetação nativa e disponibilidade dominial?
        </p>
      </ContextoEducativo>

      <CaminhosPossiveis
        titulo="Modalidades de cumprimento"
        intro="Quatro caminhos previstos. A escolha depende da disponibilidade de área na mesma sub-bacia, do perfil do empreendimento e do horizonte de cumprimento."
        caminhos={[
          {
            badge: "Modalidade 1",
            titulo: "Recuperação de APP",
            subtitulo: "Mesma sub-bacia hidrográfica",
            descricao: "Plantio em APP degradada na mesma sub-bacia, restaurando a função ecológica.",
            tradeoff: "Caminho preferencial pela lei. Exige área degradada disponível e projeto de recomposição.",
          },
          {
            badge: "Modalidade 2",
            titulo: "Recuperação em UC",
            subtitulo: "Área degradada em Unidade de Conservação",
            descricao: "Plantio em área degradada no interior de UC pública.",
            tradeoff: "Quitação a longo prazo, mas exige aprovação do órgão gestor da UC e compatibilidade com plano de manejo.",
          },
          {
            badge: "Modalidade 3",
            titulo: "Doação de área para UC",
            subtitulo: "Mesma bacia hidrográfica",
            descricao: "Doação de área de vegetação nativa em UC pendente de regularização fundiária.",
            tradeoff: "Quitação definitiva, mas exige imóvel disponível e dossiê dominial limpo.",
          },
          {
            badge: "Modalidade 4",
            titulo: "Área verde urbana",
            subtitulo: "Implantação ou revitalização",
            descricao: "Implantação ou revitalização de área verde no perímetro urbano.",
            tradeoff: "Aplicável a empreendimentos urbanos. Exige acordo com Município e plano específico.",
          },
        ]}
      />

      <section>
        <h2 className="acam-landing-section-titulo">Como o ACAM acelera essa decisão</h2>
        <p style={{ maxWidth: "65ch", marginBottom: "var(--spacing-6)", color: "var(--neutral-600)", lineHeight: 1.7 }}>
          A escolha entre recuperação, doação para UC e área verde urbana depende de validação técnica da área candidata. Duas ferramentas cobrem as etapas críticas.
        </p>

        <FerramentaCard
          nome="Análise de viabilidade da área compensatória"
          tagline="Antes de comprometer recursos, descubra se a área proposta atende a bacia, vegetação e dominialidade."
          mockup={<MockupDestinacaoUCApp />}
          entregas={[
            "Cruzamento com IDE-Sisema para identificar UCs e bacia",
            "Validação de bioma e cobertura vegetal nativa",
            "Análise da matrícula da área candidata",
            "Parecer fundamentado sobre adequação à compensação de APP",
          ]}
          ancoragem="6 créditos · resposta em ~3 minutos · vs 8h+ de levantamento manual em consultoria"
          href="/ferramentas/destinacao-uc-app"
          ctaLabel="Analisar viabilidade"
        />

        <FerramentaCard
          nome="Análise registral da área candidata"
          tagline="Doação de imóvel para UC exige matrícula limpa. Saiba antes de protocolar."
          mockup={<MockupAnaliseMatricula />}
          entregas={[
            "Pareamento de ônus, gravames e cancelamentos",
            "MVAR — viabilidade em 4 dimensões",
            "Identificação de diligências antes do protocolo",
            "Análise de transmissibilidade",
          ]}
          ancoragem="5 créditos · análise documental por IA · valida matrícula em minutos"
          href="/ferramentas/analise-matricula"
          ctaLabel="Analisar matrícula"
        />
      </section>

      <CTAEspecialista
        pergunta="A intervenção é em projeto complexo — utilidade pública ou loteamento de grande porte?"
        descricao="Compensação por APP em obras de utilidade pública ou em loteamentos urbanos exige interpretação técnica e por vezes acordo com poder público. Para esses casos, agende 30 minutos com o especialista responsável técnico do ACAM."
      />

      <FaqRapido
        itens={[
          {
            pergunta: "Posso compensar em outra sub-bacia se não houver área disponível?",
            resposta: "Sim, mas com fundamentação técnica de inviabilidade na sub-bacia original. O órgão pode exigir análise comparativa.",
          },
          {
            pergunta: "Área verde urbana conta como compensação plena?",
            resposta: "Conta, mas com regras específicas. Deve estar alinhada ao Plano Diretor e geralmente exige acordo formal com o Município.",
          },
          {
            pergunta: "A compensação tem que ser executada antes da intervenção?",
            resposta: "Em geral, antes ou simultaneamente. Algumas autorizações admitem cronograma com cumprimento posterior, mas com garantias.",
          },
        ]}
      />

      <section>
        <h2 className="acam-landing-section-titulo">Legislação aplicável</h2>
        <LegislacaoItem
          titulo="Resolução CONAMA nº 369/2006"
          descricao="Casos excepcionais de intervenção em APP"
          linkUrl="https://conama.mma.gov.br/?option=com_sisconama&task=arquivo.download&id=480"
        />
        <LegislacaoItem
          titulo="Decreto Estadual nº 47.749/2019"
          descricao="Processos de autorização para intervenção ambiental — Art. 75 trata da compensação por APP"
          linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/DEC/47749/2019/?cons=1"
        />
        <LegislacaoItem
          titulo="Resolução Conjunta SEMAD/IEF nº 3.102/2021"
          descricao="Procedimentos para compensação ambiental"
          linkUrl="https://siam.mg.gov.br/sla/download.pdf?idNorma=54600"
        />
      </section>
    </div>
  )
}

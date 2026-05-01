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
  MockupReposicaoFlorestal,
  MockupAnaliseMatricula,
} from "@/components/acam"

export const metadata: Metadata = {
  title: "Reposição Florestal — Minas Gerais",
  description:
    "Cálculo e cumprimento da Reposição Florestal em MG. Calculadora gratuita, modalidades de cumprimento e fundamentação normativa.",
}

export default function ReposicaoFlorestalPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
      <HeroCompensacao
        compensacao="reposicao-florestal"
        eyebrow="Compensação ambiental · Reposição"
        titulo="Reposição Florestal em Minas Gerais"
        tagline="Toda extração de matéria-prima florestal nativa exige reposição. O cálculo é simples — o cumprimento é que tem caminhos diferentes."
        fatosRapidos="Lei MG 20.922/2013 · Art. 78 · Decreto MG 47.749/2019"
      />

      <PerfisAlvo
        perfis={[
          {
            titulo: "Empresa que utiliza matéria-prima florestal",
            descricao: "Você consome lenha, carvão ou madeira nativa e precisa cumprir a reposição.",
          },
          {
            titulo: "Profissional autônomo precisando dimensionar",
            descricao: "Há supressão autorizada e você quer estimar o passivo de reposição antes da operação.",
          },
          {
            titulo: "Consultoria orçando o caso",
            descricao: "Seu cliente perguntou quanto custa repor — você precisa de número para a proposta.",
          },
        ]}
      />

      <ContextoEducativo titulo="A obrigação em três minutos">
        <p>
          A Reposição Florestal é decorrente da supressão de vegetação nativa ou da utilização de matéria-prima florestal nativa (lenha, carvão, madeira). A lógica: <strong>repor o que se extrai</strong>. Aplica-se a qualquer pessoa física ou jurídica que utilize, transforme, comercialize ou consuma matéria-prima florestal nativa em Minas Gerais.
        </p>
        <p>
          O cálculo da reposição é por <strong>volume extraído</strong> — quanto maior o volume, maior o número de árvores a serem repostas. O recolhimento deve ser feito no ano da supressão (Lei 20.922/2013).
        </p>
        <p>
          Há três caminhos para cumprir: plantar em floresta própria, contribuir com fomento florestal ou participar de associação. A escolha depende do tamanho da operação e da disponibilidade de terra.
        </p>
      </ContextoEducativo>

      <CaminhosPossiveis
        titulo="Formas de cumprimento"
        intro="Três caminhos previstos. A escolha depende da escala da operação, da disponibilidade de área e do horizonte de cumprimento."
        caminhos={[
          {
            badge: "Forma 1",
            titulo: "Florestas próprias",
            subtitulo: "Plantio em área própria",
            descricao: "Plantio de espécies florestais em área de propriedade do empreendedor.",
            tradeoff: "Exige área disponível e gestão de plantio próprio. Ganho em controle e custo a longo prazo.",
          },
          {
            badge: "Forma 2",
            titulo: "Fomento florestal",
            subtitulo: "Apoio a pequenos produtores",
            descricao: "Contribuição financeira para programas de fomento florestal — pequenos produtores plantam, empresa repõe.",
            tradeoff: "Sem necessidade de gerir plantio próprio. Custo é financeiro, não operacional.",
          },
          {
            badge: "Forma 3",
            titulo: "Associação",
            subtitulo: "Projetos coletivos",
            descricao: "Participação em projetos coletivos de plantio, geralmente conduzidos por associações setoriais.",
            tradeoff: "Diluição de custo e risco. Depende de existência de associação ativa no setor.",
          },
        ]}
      />

      <section>
        <h2 className="acam-landing-section-titulo">Como o ACAM acelera essa decisão</h2>
        <p style={{ maxWidth: "65ch", marginBottom: "var(--spacing-6)", color: "var(--neutral-600)", lineHeight: 1.7 }}>
          Antes de definir como cumprir, é preciso saber o tamanho do passivo. A Calculadora gratuita do ACAM dá o número em segundos. Para casos com aquisição de área para plantio próprio, a Análise de Matrícula valida o imóvel candidato.
        </p>

        <FerramentaCard
          nome="Cálculo de Reposição Florestal"
          tagline="Saiba quantas árvores precisa plantar a partir do volume extraído — em segundos, sem custo."
          mockup={<MockupReposicaoFlorestal />}
          entregas={[
            "Cálculo a partir de lenha, carvão e madeira nativa",
            "Total de árvores e valor estimado em UFEMG",
            "Lista detalhada por item",
            "Disclaimer sobre apuração definitiva pelo IEF",
          ]}
          ancoragem="Gratuita · resultado em segundos · sem cadastro obrigatório"
          href="/reposicao-florestal"
          ctaLabel="Calcular reposição"
        />

        <FerramentaCard
          nome="Análise registral do imóvel para plantio"
          tagline="Vai adquirir área para plantio próprio? Valide a matrícula antes de fechar negócio."
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
        pergunta="Operação recorrente, com cumprimento estruturado a longo prazo?"
        descricao="Empresas com utilização recorrente de matéria-prima florestal precisam de estratégia integrada de reposição — não apenas cálculo pontual. Para desenhar plano plurianual ou negociar com associações de fomento, agende 30 minutos com o especialista responsável técnico do ACAM."
      />

      <FaqRapido
        itens={[
          {
            pergunta: "Posso cumprir parcialmente em cada modalidade?",
            resposta: "Sim, é possível combinar caminhos — parte em plantio próprio, parte em fomento, por exemplo. A combinação requer comprovação documental de cada parcela.",
          },
          {
            pergunta: "Como funciona o cálculo na prática?",
            resposta: "Há fórmulas específicas para cada tipo de produto (m³ de lenha, mdc de carvão, etc.). Use a calculadora gratuita acima para a estimativa preliminar.",
          },
          {
            pergunta: "O recolhimento substitui o plantio?",
            resposta: "Não, são caminhos diferentes. O recolhimento (em UFEMG) só é admitido em casos específicos previstos em norma — verifique aplicabilidade ao seu caso.",
          },
        ]}
      />

      <section>
        <h2 className="acam-landing-section-titulo">Legislação aplicável</h2>
        <LegislacaoItem
          titulo="Lei Estadual nº 20.922/2013"
          descricao="Política florestal e de proteção à biodiversidade em MG (Art. 78 trata da reposição florestal)"
          linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/LEI/20922/2013/?cons=1"
        />
        <LegislacaoItem
          titulo="Decreto Estadual nº 47.749/2019"
          descricao="Processos de autorização para intervenção ambiental"
          linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/DEC/47749/2019/?cons=1"
        />
      </section>
    </div>
  )
}

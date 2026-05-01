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
  MockupDestinacaoUCBase,
  MockupAnaliseMatricula,
} from "@/components/acam"

export const metadata: Metadata = {
  title: "Compensação Minerária — Minas Gerais",
  description:
    "Compensação ambiental por supressão de vegetação nativa em empreendimentos de mineração em MG. Análise de viabilidade, cálculo em UFEMG, requerimento oficial e parecer registral em uma plataforma só.",
}

export default function MinerariaPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
      <HeroCompensacao
        compensacao="mineraria"
        eyebrow="Compensação ambiental · Mineração"
        titulo="Compensação Minerária em Minas Gerais"
        tagline="Quem suprime vegetação nativa para minerar precisa compensar. O ACAM mostra como, em quanto, e ajuda a executar."
        fatosRapidos="Lei 20.922/2013 · Decreto 47.749/2019 · Proporção 1:1"
      />

      <PerfisAlvo
        perfis={[
          {
            titulo: "Mineradora com licenciamento em curso",
            descricao:
              "Você recebeu a exigência de compensação e precisa orçar antes de comprometer área ou capital.",
          },
          {
            titulo: "Consultoria ambiental orçando",
            descricao:
              "Seu cliente perguntou quanto custa, e você precisa de fundamentação para apresentar opções.",
          },
          {
            titulo: "Jurídico revendo passivos",
            descricao:
              "Houve mudança societária ou due diligence, e você precisa entender o tamanho do passivo.",
          },
          {
            titulo: "Engenharia planejando supressão",
            descricao:
              "Antes de aprovar a área de intervenção, você quer saber a magnitude da contrapartida.",
          },
        ]}
      />

      <ContextoEducativo titulo="A obrigação em três minutos">
        <p>
          A Compensação Minerária é uma obrigação prevista na <strong>Lei Estadual 20.922/2013</strong>{" "}
          para empreendimentos de mineração em Minas Gerais que realizem supressão de vegetação nativa
          a partir de 17 de outubro de 2013. Nasceu como contrapartida ao impacto irreversível sobre o
          patrimônio ambiental do Estado.
        </p>
        <p>
          A regra é simples na superfície: <strong>cada hectare suprimido exige um hectare compensado</strong>.
          A complexidade aparece na decisão sobre como cumprir — destinação de área em Unidade de
          Conservação ou pagamento em UFEMG para implantação/manutenção. Cada caminho tem cronograma,
          custo e risco operacional próprios.
        </p>
        <p>
          Antes da escolha, há perguntas que precisam de resposta técnica: a área candidata está em
          UC de Proteção Integral? A matrícula tem ônus impeditivos? Qual o valor exato em UFEMG?
          Essas respostas, quando demoradas, atrasam licenciamento e comprometem cronograma de obra.
        </p>
      </ContextoEducativo>

      <CaminhosPossiveis
        intro="A lei oferece dois caminhos. A escolha não é trivial — depende de disponibilidade de área, capital de giro, prazo do empreendimento e perfil de risco do gestor."
        caminhos={[
          {
            badge: "Modalidade 1",
            titulo: "Destinar área em UC",
            subtitulo: "Regularização fundiária em Unidade de Conservação",
            descricao:
              "Doação de área de vegetação nativa no interior de Unidade de Conservação de Proteção Integral pendente de regularização fundiária.",
            tradeoff:
              "Quitação definitiva da obrigação, mas exige imóvel disponível, dossiê dominial limpo e aprovação do órgão gestor da UC. Prazo total entre 18 e 36 meses.",
          },
          {
            badge: "Modalidade 2",
            titulo: "Implantação / manutenção em UC",
            subtitulo: "Pagamento em UFEMG para ações em UC",
            descricao:
              "Pagamento de valor calculado em UFEMG para ações de implantação, regularização ou manutenção de Unidade de Conservação.",
            tradeoff:
              "Mais ágil e previsível, mas o valor pode ser alto e o cronograma de execução depende do órgão gestor. Prazo total entre 12 e 60 meses.",
          },
        ]}
      />

      <section>
        <h2 className="acam-landing-section-titulo">Como o ACAM acelera essa decisão</h2>
        <p style={{ maxWidth: "65ch", marginBottom: "var(--spacing-6)", color: "var(--neutral-600)", lineHeight: 1.7 }}>
          Quatro ferramentas cobrem o ciclo completo: avaliar área candidata, calcular valor da
          modalidade 2, validar matrícula antes de protocolar, e gerar o requerimento oficial.
          Cada análise sai em minutos — não em semanas.
        </p>

        <FerramentaCard
          nome="Análise de viabilidade de área"
          tagline="Antes de comprometer recursos em estudos preliminares, descubra em minutos se o imóvel candidato realmente serve."
          mockup={<MockupDestinacaoUCBase />}
          entregas={[
            "Cruzamento com IDE-Sisema para identificar UCs sobrepostas",
            "Extração automática dos dados da matrícula (cartório, área, ônus)",
            "Parecer fundamentado classificado em verde, amarelo ou vermelho",
            "PDF com fundamentação normativa pronto para discussão interna",
          ]}
          ancoragem="5 créditos · resposta em ~3 minutos · vs 8h+ de levantamento manual em consultoria tradicional"
          href="/ferramentas/destinacao-uc-base"
          ctaLabel="Analisar viabilidade da área"
        />

        <FerramentaCard
          nome="Cálculo de implantação / manutenção UC"
          tagline="Saiba o valor exato em UFEMG antes da reunião com o órgão — sem planilha, sem suposição."
          mockupImage="/landing/print-calculo-modalidade2.png"
          mockupImageAlt="Tela do Cálculo Modalidade 2 — área a suprimir, valor em UFEMGs e em reais, fluxo administrativo etapa a etapa"
          entregas={[
            "Cálculo em UFEMG com valor vigente automaticamente atualizado",
            "Conversão direta para reais",
            "Fluxo administrativo estimado etapa por etapa",
            "Fundamentação na Portaria IEF 27/2017",
          ]}
          ancoragem="2 créditos · cálculo auditável · estimativa que pode ser apresentada ao órgão"
          href="/ferramentas/calculo-modalidade2"
          ctaLabel="Calcular valor em UFEMG"
        />

        <FerramentaCard
          nome="Análise registral da área candidata"
          tagline="Doação de imóvel exige matrícula limpa. Saiba antes de protocolar — não depois."
          mockup={<MockupAnaliseMatricula />}
          entregas={[
            "Pareamento de ônus, gravames e cancelamentos",
            "MVAR — pontuação de viabilidade em 4 dimensões (jurídica, fiscal, titularidade, técnica)",
            "Identificação de diligências necessárias antes do protocolo",
            "Análise de transmissibilidade considerando outorga conjugal e georreferenciamento",
          ]}
          ancoragem="5 créditos · análise documental por IA · valida matrícula em minutos"
          href="/ferramentas/analise-matricula"
          ctaLabel="Analisar matrícula"
        />

        <FerramentaCard
          nome="Requerimento de compensação minerária"
          tagline="O formulário oficial preenchido a partir dos seus dados — pronto para protocolo."
          mockupImage="/landing/print-requerimento-mineraria.png"
          mockupImageAlt="Tela do wizard de Requerimento Compensação Minerária — formulário guiado em 5 etapas (Responsável, Empreendedor, Correspondência, Processo, Gerar)"
          entregas={[
            "Wizard guiado em etapas (responsável, empreendedor, processo)",
            "PDF idêntico ao modelo aceito pelo Estado",
            "Validação automática de CPF, CNPJ, datas e códigos de processo",
            "Reaproveitamento dos dados em requerimentos futuros",
          ]}
          ancoragem="0,5 crédito · PDF pronto em segundos · sem retrabalho de digitação"
          href="/ferramentas/requerimento-mineraria"
          ctaLabel="Gerar requerimento"
        />
      </section>

      <CTAEspecialista
        pergunta="O caso é mais específico do que uma ferramenta resolve?"
        descricao="Há situações que não cabem num formulário — passivos antigos, processos com interpretação dúbia, decisões estratégicas envolvendo várias compensações simultâneas. Para esses casos, agende 30 minutos com o especialista responsável técnico do ACAM."
      />

      <FaqRapido
        itens={[
          {
            pergunta: "Vou pagar para descobrir que a compensação não se aplica ao meu caso?",
            resposta:
              "Não. Os créditos são reembolsados em qualquer falha técnica do sistema. A análise sempre entrega resposta — mesmo um \"não se aplica\" fundamentado é resposta útil para sua decisão.",
          },
          {
            pergunta: "O parecer tem valor jurídico?",
            resposta:
              "O ACAM produz análise técnica preliminar com fundamentação normativa, útil para decisão interna e diálogo com o órgão. Para peças oficiais (defesas administrativas, recursos, manifestações em processo), a consultoria com o especialista é o caminho.",
          },
          {
            pergunta: "Como funciona o crédito?",
            resposta:
              "Você compra um pacote, cada ferramenta consome um número fixo de créditos. Não expiram. São reembolsados em caso de falha do sistema.",
          },
          {
            pergunta: "Posso usar para múltiplos imóveis ou processos?",
            resposta:
              "Sim. Cada análise é independente, e pacotes maiores têm desconto progressivo. Empresas com pipeline recorrente costumam adquirir o pacote intermediário.",
          },
          {
            pergunta: "De onde vêm os dados?",
            resposta:
              "Bases oficiais: IDE-Sisema (geoespacial), INCRA (CCIR), MapBiomas (cobertura), IBAMA, IEF e cartórios (matrículas). O ACAM não inventa dado — cruza, interpreta e fundamenta com base em norma vigente.",
          },
        ]}
      />

      <section>
        <h2 className="acam-landing-section-titulo">Legislação aplicável</h2>
        <LegislacaoItem
          titulo="Lei Estadual nº 20.922/2013"
          descricao="Política florestal e de proteção à biodiversidade no Estado — base da compensação minerária"
          linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/LEI/20922/2013/?cons=1"
        />
        <LegislacaoItem
          titulo="Decreto nº 46.953/2016"
          descricao="Regulamenta a Lei nº 20.922/2013"
          linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/DEC/46953/2016/?cons=1"
        />
        <LegislacaoItem
          titulo="Decreto nº 47.749/2019"
          descricao="Dispõe sobre os processos de autorização para intervenção ambiental em MG"
          linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/DEC/47749/2019/?cons=1"
        />
        <LegislacaoItem
          titulo="Portaria IEF nº 27/2017"
          descricao="Procedimentos para cumprimento da compensação ambiental"
          linkUrl="http://www.siam.mg.gov.br/sla/download.pdf?idNorma=44102"
        />
        <LegislacaoItem
          titulo="Resolução Conjunta SEMAD/IEF nº 3.102/2021"
          descricao="Procedimentos para compensação ambiental por supressão de vegetação nativa"
          linkUrl="https://siam.mg.gov.br/sla/download.pdf?idNorma=54600"
        />
      </section>
    </div>
  )
}

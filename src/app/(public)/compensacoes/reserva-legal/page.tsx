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
  MockupAnaliseMatricula,
} from "@/components/acam"

export const metadata: Metadata = {
  title: "Compensação de Reserva Legal — Minas Gerais",
  description:
    "Regularização de Reserva Legal em imóveis rurais de MG. Análise registral, modalidades de cumprimento e fundamentação normativa em uma plataforma só.",
}

export default function ReservaLegalPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
      <HeroCompensacao
        compensacao="reserva-legal"
        eyebrow="Compensação ambiental · Reserva Legal"
        titulo="Reserva Legal em Minas Gerais"
        tagline="Todo imóvel rural deve manter 20% de vegetação nativa. Quando há déficit, há caminhos para regularizar — e cada um tem custo, prazo e risco específico."
        fatosRapidos="Lei 12.651/2012 · Lei MG 20.922/2013 · 20% da área do imóvel"
      />

      <PerfisAlvo
        perfis={[
          {
            titulo: "Proprietário rural com déficit de RL",
            descricao: "Você precisa regularizar a Reserva Legal e quer entender as opções antes de decidir.",
          },
          {
            titulo: "Consultoria ambiental orçando regularização",
            descricao: "Seu cliente quer comparar custos entre CRA, arrendamento e doação para UC.",
          },
          {
            titulo: "Jurídico revendo passivos em due diligence",
            descricao: "Há aquisição em curso e você precisa dimensionar o passivo de RL.",
          },
          {
            titulo: "Empreendimento com necessidade de relocação",
            descricao: "A operação exige relocar a Reserva Legal e você precisa validar a área substituta.",
          },
        ]}
      />

      <ContextoEducativo titulo="A obrigação em três minutos">
        <p>
          A Reserva Legal é uma fração da propriedade rural que deve ser mantida com cobertura de vegetação nativa, equivalente a <strong>20% da área total</strong> em Minas Gerais (Lei Estadual 20.922/2013). Não é APP, não é UC — é uma reserva interna do imóvel, definida por percentual.
        </p>
        <p>
          Quando há <strong>déficit</strong> (área menor que os 20%), o proprietário precisa regularizar. A lei oferece quatro caminhos principais — cada um com perfil de custo, agilidade e risco diferente. A escolha depende da disponibilidade de área dentro do imóvel, do capital disponível e do horizonte de regularização.
        </p>
        <p>
          Antes da escolha, há uma pergunta técnica decisiva: <strong>a matrícula do imóvel está limpa o suficiente para regularizar a RL via destinação para UC?</strong> Análise registral cuidadosa evita protocolar pedidos que serão devolvidos por exigência.
        </p>
      </ContextoEducativo>

      <CaminhosPossiveis
        titulo="Modalidades de regularização"
        intro="Quatro caminhos previstos em lei. A escolha depende de disponibilidade de área, capital de giro e perfil de risco do proprietário."
        caminhos={[
          {
            badge: "Modalidade 1",
            titulo: "Aquisição de CRA",
            subtitulo: "Cota de Reserva Ambiental",
            descricao: "Compra de cotas representativas de área de vegetação nativa preservada em outro imóvel, no mesmo bioma.",
            tradeoff: "Mais ágil e padronizado, mas depende da oferta de CRAs no mercado e da equivalência ecológica.",
          },
          {
            badge: "Modalidade 2",
            titulo: "Arrendamento ou servidão",
            subtitulo: "Sob área de outro imóvel",
            descricao: "Servidão ambiental de área excedente em outro imóvel, mediante contrato de longo prazo ou perpétuo.",
            tradeoff: "Custo recorrente e exige que se encontre proprietário com excedente disposto a contratar.",
          },
          {
            badge: "Modalidade 3",
            titulo: "Doação para UC",
            subtitulo: "Área em UC pendente de regularização",
            descricao: "Doação de área de vegetação nativa no interior de UC de domínio público pendente de regularização fundiária.",
            tradeoff: "Quitação definitiva, mas exige imóvel disponível e dossiê dominial limpo. Aprovação do órgão gestor pode demorar.",
          },
          {
            badge: "Modalidade 4",
            titulo: "Cadastramento de área equivalente",
            subtitulo: "Mesmo bioma, mesma microbacia",
            descricao: "Cadastramento de área equivalente, no mesmo bioma e preferencialmente na mesma microbacia.",
            tradeoff: "Exige documentação detalhada e correspondência ecológica fundamentada.",
          },
        ]}
      />

      <section>
        <h2 className="acam-landing-section-titulo">Como o ACAM acelera essa decisão</h2>
        <p style={{ maxWidth: "65ch", marginBottom: "var(--spacing-6)", color: "var(--neutral-600)", lineHeight: 1.7 }}>
          A regularização de Reserva Legal frequentemente passa pela validação registral do imóvel candidato — seja para doação para UC ou para arrendamento. A Análise de Matrícula entrega esse diagnóstico em minutos.
        </p>

        <FerramentaCard
          nome="Análise registral do imóvel"
          tagline="Antes de aceitar arrendamento ou protocolar doação, valide a matrícula do imóvel candidato."
          mockup={<MockupAnaliseMatricula />}
          entregas={[
            "Pareamento de ônus, gravames e cancelamentos",
            "MVAR — viabilidade em 4 dimensões (jurídica, fiscal, titularidade, técnica)",
            "Identificação de diligências antes do protocolo",
            "Análise de transmissibilidade (outorga, georreferenciamento)",
          ]}
          ancoragem="5 créditos · análise documental por IA · valida matrícula em minutos"
          href="/ferramentas/analise-matricula"
          ctaLabel="Analisar matrícula"
        />
      </section>

      <CTAEspecialista
        pergunta="O caso envolve mais de uma compensação ou exige estratégia jurídica?"
        descricao="Reserva Legal frequentemente se cruza com APP, Mata Atlântica e licenciamento. Para casos que envolvem múltiplas compensações simultâneas ou estratégia de regularização em escala, agende 30 minutos com o especialista responsável técnico do ACAM."
      />

      <FaqRapido
        itens={[
          {
            pergunta: "Posso somar área de APP ao cálculo da Reserva Legal?",
            resposta: "Sim, o Código Florestal admite o cômputo de APP no cálculo da RL desde que atendidas as condições do art. 15. A análise caso a caso é importante para evitar autuação.",
          },
          {
            pergunta: "CRA é mais barato que doação para UC?",
            resposta: "Depende do mercado e da modalidade. CRA tem precificação relativamente líquida; doação para UC envolve custo de aquisição da área + custos de regularização documental. Para tomar decisão, vale comparar com cenário concreto.",
          },
          {
            pergunta: "Tenho prazo para regularizar?",
            resposta: "Imóveis em situação de déficit podem ser autuados a qualquer momento. A regularização via PRA (Programa de Regularização Ambiental) suspende sanções enquanto cumprida — vale conferir se você está aderido.",
          },
        ]}
      />

      <section>
        <h2 className="acam-landing-section-titulo">Legislação aplicável</h2>
        <LegislacaoItem
          titulo="Lei Federal nº 12.651/2012"
          descricao="Código Florestal — proteção da vegetação nativa, definição de Reserva Legal"
          linkUrl="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12651.htm"
        />
        <LegislacaoItem
          titulo="Lei Estadual nº 20.922/2013"
          descricao="Política florestal e de proteção à biodiversidade em MG — define os 20% e regulamenta caminhos"
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

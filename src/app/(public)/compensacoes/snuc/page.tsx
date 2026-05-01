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
} from "@/components/acam"

export const metadata: Metadata = {
  title: "Compensação Ambiental SNUC — Minas Gerais",
  description:
    "Compensação SNUC (Lei 9.985/2000) para empreendimentos de significativo impacto ambiental. Cálculo do valor, identificação de UCs beneficiárias e fundamentação normativa.",
}

export default function SnucPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
      <HeroCompensacao
        compensacao="snuc"
        eyebrow="Compensação ambiental · SNUC"
        titulo="Compensação Ambiental SNUC em Minas Gerais"
        tagline="Empreendimentos de significativo impacto ambiental apoiam a implantação e manutenção de UCs de Proteção Integral. O cálculo é por percentual sobre o valor de referência."
        fatosRapidos="Lei Federal 9.985/2000 · Art. 36 · Até 0,5% do valor de referência"
      />

      <PerfisAlvo
        perfis={[
          {
            titulo: "Empreendedor com EIA/RIMA exigido",
            descricao: "Você está em licenciamento de significativo impacto e precisa orçar a compensação SNUC.",
          },
          {
            titulo: "Consultoria de licenciamento",
            descricao: "Você assessora empreendimentos sujeitos à compensação SNUC e precisa de cálculos auditáveis.",
          },
          {
            titulo: "Jurídico de empreendimento em LP",
            descricao: "A compensação é definida na Licença Prévia — você precisa de fundamentação para negociar com o órgão.",
          },
          {
            titulo: "Gestor de UC",
            descricao: "Você gerencia uma UC potencialmente beneficiária e precisa entender o fluxo de compensação SNUC.",
          },
        ]}
      />

      <ContextoEducativo titulo="A obrigação em três minutos">
        <p>
          A Compensação Ambiental SNUC, prevista no <strong>Art. 36 da Lei 9.985/2000</strong>, aplica-se a empreendimentos de <strong>significativo impacto ambiental</strong> (com EIA/RIMA exigido). O empreendedor apoia a implantação ou manutenção de Unidade de Conservação do Grupo de Proteção Integral.
        </p>
        <p>
          O valor é calculado como percentual sobre o <strong>valor de referência</strong> do empreendimento, com teto de 0,5% — definido pela fórmula <em>CA = VR × (GI / 100)</em>, onde GI é o Grau de Impacto. A definição ocorre na <strong>fase de Licença Prévia (LP)</strong>, e o GI é apurado a partir de fatores como Frequência (FR), Tempo (FT) e Área de Influência Direta (FA).
        </p>
        <p>
          A complexidade está no cálculo do GI (com vários fatores de relevância) e na escolha da UC beneficiária. Erros na apuração podem custar caro — para mais ou para menos.
        </p>
      </ContextoEducativo>

      <CaminhosPossiveis
        titulo="Como cumprir a compensação"
        intro="A compensação SNUC tem caminhos definidos pela própria Lei 9.985/2000. A escolha da UC beneficiária e da modalidade de aplicação tem impacto operacional direto."
        caminhos={[
          {
            badge: "Modalidade 1",
            titulo: "UC afetada pelo empreendimento",
            subtitulo: "Prioridade legal",
            descricao: "Se o empreendimento afeta UC específica, ela tem prioridade no recebimento da compensação.",
            tradeoff: "Caminho mais simples quando há UC claramente afetada. Não há margem de escolha.",
          },
          {
            badge: "Modalidade 2",
            titulo: "UC do mesmo bioma",
            subtitulo: "Lista de UCs beneficiárias",
            descricao: "Quando não há UC afetada, a compensação vai para UC do mesmo bioma, conforme lista aprovada pelo órgão.",
            tradeoff: "Há margem de negociação com o órgão sobre qual UC priorizar — vale análise estratégica.",
          },
        ]}
      />

      <section>
        <h2 className="acam-landing-section-titulo">Como o ACAM acelera essa decisão</h2>
        <p style={{ maxWidth: "65ch", marginBottom: "var(--spacing-6)", color: "var(--neutral-600)", lineHeight: 1.7 }}>
          O cálculo do GI envolve cruzamento de bases geoespaciais e parâmetros técnicos. A Calculadora SNUC do ACAM faz esse cálculo em minutos, com fundamentação auditável.
        </p>

        <FerramentaCard
          nome="Calculadora SNUC"
          tagline="Saiba o valor estimado da compensação SNUC antes da reunião com o órgão — com fundamentação."
          mockupImage="/landing/print-calculadora-snuc.png"
          mockupImageAlt="Tela de resultado da Calculadora SNUC — Compensação Ambiental Estimada com fórmula CA = VR × (GI / 100), composição do Grau de Impacto e fatores de relevância selecionados"
          entregas={[
            "Análise da ADA com Geoserver IDE-Sisema",
            "Verificação de sobreposição com UCs e áreas prioritárias",
            "Cálculo automático do Grau de Impacto (FR + FT + FA)",
            "Valor estimado em R$ com fórmula auditável",
          ]}
          ancoragem="7 créditos · cálculo auditável · vs apuração manual com planilhas e bases dispersas"
          href="/ferramentas/calculadora-snuc"
          ctaLabel="Calcular compensação SNUC"
        />

        <FerramentaCard
          nome="Requerimento SNUC"
          tagline="Formulário oficial preenchido a partir dos dados do cálculo — pronto para protocolo."
          mockupImage="/landing/print-requerimento-mineraria.png"
          mockupImageAlt="Tela do wizard de requerimento — formulário guiado em etapas, semelhante ao da SNUC"
          entregas={[
            "Wizard guiado em etapas (responsável, empreendedor, processo)",
            "PDF aceito pelo Estado",
            "Validação automática de CPF, CNPJ, datas e códigos",
            "Reaproveitamento dos dados em requerimentos futuros",
          ]}
          ancoragem="0,5 crédito · PDF pronto em segundos · sem retrabalho de digitação"
          href="/ferramentas/requerimento-snuc"
          ctaLabel="Gerar requerimento"
        />
      </section>

      <CTAEspecialista
        pergunta="O cálculo de GI envolve interpretação técnica ou negociação com o órgão?"
        descricao="A apuração do Grau de Impacto e a escolha da UC beneficiária têm pontos sensíveis que afetam diretamente o valor final da compensação. Para casos com margem de negociação ou para defender cálculo específico, agende 30 minutos com o especialista responsável técnico do ACAM."
      />

      <FaqRapido
        itens={[
          {
            pergunta: "0,5% é teto ou regra fixa?",
            resposta: "É teto. A lei (após decisão do STF) admite valor menor, conforme o GI apurado. O teto de 0,5% só se aplica quando o GI calculado o atinge.",
          },
          {
            pergunta: "Posso indicar a UC beneficiária?",
            resposta: "Há ordem de prioridade na lei. Quando não há UC afetada, há margem de negociação dentro da lista de UCs do bioma — a indicação é negociada com o órgão licenciador.",
          },
          {
            pergunta: "A compensação é única ou recorrente?",
            resposta: "É única, definida na LP, mas paga conforme cronograma. Renovação de licença não gera nova compensação SNUC — gera as decorrentes de novos impactos.",
          },
          {
            pergunta: "Empresas em ampliação pagam de novo?",
            resposta: "Pagam sobre o incremento de impacto (não sobre o valor total atualizado). Análise específica por especialista é importante para defender valor justo.",
          },
        ]}
      />

      <section>
        <h2 className="acam-landing-section-titulo">Legislação aplicável</h2>
        <LegislacaoItem
          titulo="Lei Federal nº 9.985/2000"
          descricao="Sistema Nacional de Unidades de Conservação (SNUC) — Art. 36 trata da compensação ambiental"
          linkUrl="https://www.planalto.gov.br/ccivil_03/leis/l9985.htm"
        />
        <LegislacaoItem
          titulo="Decreto Federal nº 4.340/2002"
          descricao="Regulamenta artigos da Lei nº 9.985/2000"
          linkUrl="https://www.planalto.gov.br/ccivil_03/decreto/2002/d4340.htm"
        />
        <LegislacaoItem
          titulo="Decreto Estadual nº 45.175/2009"
          descricao="Metodologia de gradação de impactos ambientais em MG"
          linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/DEC/45175/2009/?cons=1"
        />
      </section>
    </div>
  )
}

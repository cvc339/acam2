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
  MockupAnaliseServidao,
  MockupAnaliseMatricula,
} from "@/components/acam"

export const metadata: Metadata = {
  title: "Compensação Mata Atlântica — Minas Gerais",
  description:
    "Compensação por supressão de vegetação no Bioma Mata Atlântica em MG. Regras de supressão, modalidades, ferramentas de viabilidade e fundamentação normativa.",
}

export default function MataAtlanticaPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
      <HeroCompensacao
        compensacao="mata-atlantica"
        eyebrow="Compensação ambiental · Mata Atlântica"
        titulo="Compensação Mata Atlântica em Minas Gerais"
        tagline="Quem suprime vegetação primária ou em estágio médio/avançado precisa compensar — com proporção dobrada e regras específicas por situação e estágio."
        fatosRapidos="Lei Federal 11.428/2006 · Decreto MG 47.749/2019 · Proporção 2:1"
      />

      <PerfisAlvo
        perfis={[
          {
            titulo: "Mineradora ou empreendedor industrial",
            descricao: "Você opera em região de Mata Atlântica e precisa orçar a compensação antes de comprometer área ou capital.",
          },
          {
            titulo: "Loteador ou consultoria de licenciamento",
            descricao: "O parcelamento envolve fragmentos de Mata Atlântica e você precisa estruturar a compensação por estágio.",
          },
          {
            titulo: "Jurídico revendo passivos",
            descricao: "Há autuação ou TAC envolvendo Mata Atlântica e você precisa dimensionar o passivo.",
          },
          {
            titulo: "Engenharia planejando supressão",
            descricao: "Antes de aprovar a área de intervenção, você quer saber se a contrapartida é viável.",
          },
        ]}
      />

      <ContextoEducativo titulo="A obrigação em três minutos">
        <p>
          A Compensação Florestal Mata Atlântica é prevista pela <strong>Lei Federal 11.428/2006</strong>, que protege a vegetação nativa do Bioma Mata Atlântica e suas disjunções. Aplica-se ao corte ou supressão de vegetação primária ou secundária em estágio médio ou avançado de regeneração.
        </p>
        <p>
          A regra geral: <strong>cada hectare suprimido exige dois hectares compensados</strong> (proporção 2:1, conforme Art. 49 do Decreto Estadual 47.749/2019). A compensação tem que ocorrer na <strong>mesma bacia hidrográfica</strong>, preferencialmente na mesma microbacia, com características ecológicas equivalentes.
        </p>
        <p>
          A complexidade está em identificar o <strong>estágio de regeneração</strong> da vegetação suprimida e a <strong>situação que justifica a supressão</strong> (utilidade pública, interesse social, mineração, etc.) — cada combinação tem regras específicas.
        </p>
      </ContextoEducativo>

      {/* Tabela de regras — preservada da versão anterior, ampliada */}
      <section>
        <h2 className="acam-landing-section-titulo">Regras de supressão e compensação</h2>
        <p style={{ maxWidth: "65ch", marginBottom: "var(--spacing-6)", color: "var(--neutral-600)", lineHeight: 1.7 }}>
          Tabela de referência da Lei 11.428/2006: o que pode ser suprimido, em qual estágio, sob quais condições e com qual obrigação de compensação.
        </p>
        <div className="overflow-x-auto">
          <table className="acam-normas-table">
            <thead>
              <tr>
                <th>Situação</th>
                <th>Estágio</th>
                <th>Condições</th>
                <th>Compensação</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="cell-name">Utilidade Pública</td>
                <td>Primária, Secundária Avançada e Média</td>
                <td className="cell-detail">Caráter excepcional; inexistência de alternativa técnica e locacional; EIA/RIMA para primária (Art. 14, 20, 21, 22)</td>
                <td className="col-decision">Sim (Art. 17)</td>
              </tr>
              <tr>
                <td className="cell-name">Interesse Social</td>
                <td>Secundária Média</td>
                <td className="cell-detail">Caráter excepcional; inexistência de alternativa técnica e locacional (Art. 14, 23, 24)</td>
                <td className="col-decision">Sim (Art. 17)</td>
              </tr>
              <tr>
                <td className="cell-name">Mineração</td>
                <td>Secundária Avançada e Média</td>
                <td className="cell-detail">EIA/RIMA obrigatório; inexistência de alternativa técnica e locacional (Art. 32, I)</td>
                <td className="col-decision">Sim (Art. 32, II)</td>
              </tr>
              <tr>
                <td className="cell-name">Loteamento (perímetro até a Lei)</td>
                <td>Secundária Avançada e Média</td>
                <td className="cell-detail">Preservar mínimo de 50% (avançada) ou 30% (média); atender Plano Diretor (Art. 30, 31 §1º)</td>
                <td className="col-decision">Sim (Art. 17)</td>
              </tr>
              <tr>
                <td className="cell-name">Loteamento (perímetro após a Lei)</td>
                <td>Secundária Média</td>
                <td className="cell-detail">Preservar mínimo de 50% da vegetação; atender Plano Diretor (Art. 31, §2º)</td>
                <td className="col-decision">Sim (Art. 17)</td>
              </tr>
              <tr>
                <td className="cell-name">Secundária Inicial</td>
                <td>Secundária Inicial</td>
                <td className="cell-detail">Autorização do órgão estadual. Se menos de 5% de MA remanescente, aplica-se regime do estágio médio</td>
                <td className="col-decision-no">Em regra, não</td>
              </tr>
              <tr>
                <td className="cell-name">Pesquisa Científica</td>
                <td>Primária, Avançada, Média</td>
                <td className="cell-detail">Corte eventual; regulamentado pelo CONAMA; autorizado pelo SISNAMA (Art. 19, 20, 21, 23)</td>
                <td className="col-decision-no">Não</td>
              </tr>
              <tr>
                <td className="cell-name">Pequeno Produtor</td>
                <td>Secundária Média</td>
                <td className="cell-detail">Atividades imprescindíveis à subsistência; respeitar APP e Reserva Legal (Art. 23, III e Art. 24)</td>
                <td className="col-decision-no">Não (Art. 17, §2º)</td>
              </tr>
              <tr>
                <td className="cell-name">Populações Tradicionais</td>
                <td>Todos os estágios</td>
                <td className="cell-detail">Sem propósito comercial; consumo na propriedade; independe de autorização (Art. 9º)</td>
                <td className="col-decision-no">Não</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="acam-legal-note">
          Art. 17 da Lei 11.428/2006: A compensação consiste na destinação de área equivalente à desmatada, com as mesmas características ecológicas, na mesma bacia hidrográfica (preferencialmente na mesma microbacia).
        </p>
      </section>

      <CaminhosPossiveis
        titulo="Modalidades de cumprimento"
        intro="Três modalidades. As opções 1 e 2 são prioritárias; a opção 3 só deve ser utilizada quando comprovada a inviabilidade das duas primeiras."
        caminhos={[
          {
            badge: "Opção 1",
            titulo: "Doação de área para UC",
            subtitulo: "Regularização fundiária",
            descricao: "Destinação de área no interior de Unidade de Conservação de domínio público pendente de regularização fundiária, na mesma bacia.",
            tradeoff: "Quitação definitiva da obrigação. Exige imóvel disponível com bioma MA, dossiê limpo e aprovação do órgão gestor.",
          },
          {
            badge: "Opção 2",
            titulo: "Servidão ambiental ou RPPN",
            subtitulo: "Destinação para conservação",
            descricao: "Destinação de área para conservação mediante servidão ambiental perpétua ou criação de RPPN.",
            tradeoff: "Não exige UC pública. Imóvel permanece com proprietário, mas com restrição de uso registrada na matrícula.",
          },
          {
            badge: "Opção 3",
            titulo: "Recuperação florestal (PRADA)",
            subtitulo: "Plantio de espécies nativas",
            descricao: "Reflorestamento com espécies nativas do bioma. Só admitida quando comprovada inviabilidade das opções 1 e 2.",
            tradeoff: "Caminho mais demorado e oneroso — exige PRADA, plantio, monitoramento e vistoria. Use a ferramenta WebAmbiente da Embrapa para orientação.",
          },
        ]}
      />

      <section>
        <h2 className="acam-landing-section-titulo">Como o ACAM acelera essa decisão</h2>
        <p style={{ maxWidth: "65ch", marginBottom: "var(--spacing-6)", color: "var(--neutral-600)", lineHeight: 1.7 }}>
          Para Mata Atlântica há três pontos críticos: validar área candidata para doação, verificar viabilidade de servidão ambiental, e fazer análise registral. O ACAM cobre os três em minutos.
        </p>

        <FerramentaCard
          nome="Análise de viabilidade — Destinação UC Mata Atlântica"
          tagline="Antes de comprometer área, descubra se ela atende aos requisitos de bacia, bioma e cobertura nativa."
          mockupImage="/landing/print-destinacao-uc-ma.png"
          mockupImageAlt="Tela de resultado da Destinação UC Mata Atlântica — UC identificada, cálculo de compensação 2:1 e cobertura vegetal por MapBiomas"
          entregas={[
            "Identificação automática de UCs sobrepostas",
            "Cálculo da compensação (2×) com indicação de atendimento",
            "Cobertura vegetal por MapBiomas (formação florestal, savânica, etc.)",
            "Áreas de supressão e proposta com classificação por uso",
          ]}
          ancoragem="7 créditos · resposta em minutos · valida bacia, bioma e UC numa única análise"
          href="/ferramentas/destinacao-uc-ma"
          ctaLabel="Analisar área para Mata Atlântica"
        />

        <FerramentaCard
          nome="Análise de Servidão Ambiental / RPPN"
          tagline="Para a opção 2 — saiba se o imóvel candidato atende aos requisitos de servidão perpétua ou criação de RPPN."
          mockup={<MockupAnaliseServidao />}
          entregas={[
            "Validação de bioma, estágio e cobertura nativa",
            "Análise registral resumida (matrícula, ônus, CCIR)",
            "Indicação de modalidades viáveis (servidão vs. RPPN)",
            "Fundamentação normativa para o caso concreto",
          ]}
          ancoragem="7 créditos · análise por IA · diferencia servidão de RPPN com clareza"
          href="/ferramentas/analise-servidao"
          ctaLabel="Analisar servidão / RPPN"
        />

        <FerramentaCard
          nome="Análise registral da área candidata"
          tagline="Doação ou servidão exige matrícula limpa. Saiba antes de protocolar — não depois."
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

        <FerramentaCard
          nome="Requerimento de Compensação Mata Atlântica"
          tagline="Formulário oficial preenchido a partir dos seus dados — pronto para protocolo."
          mockupImage="/landing/print-requerimento-mineraria.png"
          mockupImageAlt="Tela do wizard de requerimento — formulário guiado em etapas, semelhante ao da Mata Atlântica"
          entregas={[
            "Wizard guiado em etapas (responsável, empreendedor, processo)",
            "PDF idêntico ao modelo aceito pelo Estado",
            "Validação automática de CPF, CNPJ, datas e códigos",
            "Reaproveitamento dos dados em requerimentos futuros",
          ]}
          ancoragem="0,5 crédito · PDF pronto em segundos · sem retrabalho de digitação"
          href="/ferramentas/requerimento-mata-atlantica"
          ctaLabel="Gerar requerimento"
        />
      </section>

      <CTAEspecialista
        pergunta="O caso envolve interpretação de estágio de regeneração ou EIA/RIMA?"
        descricao="A classificação correta do estágio de regeneração e a fundamentação técnica para supressão excepcional são pontos sensíveis em Mata Atlântica. Para casos limítrofes ou processos contestados, agende 30 minutos com o especialista responsável técnico do ACAM."
      />

      <FaqRapido
        itens={[
          {
            pergunta: "Como sei se a área é primária, secundária avançada, média ou inicial?",
            resposta: "A classificação do estágio segue parâmetros do CONAMA (Resolução 392/2007 para MG). Geralmente o EIA/RIMA do empreendimento já traz essa classificação — se houver dúvida, vale validação por especialista.",
          },
          {
            pergunta: "Posso compensar fora da bacia hidrográfica?",
            resposta: "Em regra, não. A lei exige mesma bacia (preferencialmente mesma microbacia). Excepcionalmente, com fundamentação técnica de inviabilidade, o órgão pode aceitar fora da bacia.",
          },
          {
            pergunta: "Servidão ambiental é mais rápida que doação para UC?",
            resposta: "Geralmente sim, porque não depende de regularização fundiária pelo Estado. Mas exige proprietário disposto a constituir servidão e equivalência ecológica comprovada.",
          },
          {
            pergunta: "Recuperação florestal (PRADA) é uma alternativa real?",
            resposta: "Sim, mas é a opção menos preferida — exige projeto, plantio, manutenção, monitoramento e vistoria por anos. Só usar quando opções 1 e 2 forem inviáveis comprovadamente.",
          },
        ]}
      />

      <section>
        <h2 className="acam-landing-section-titulo">Legislação aplicável</h2>
        <LegislacaoItem
          titulo="Lei Federal nº 11.428/2006"
          descricao="Lei da Mata Atlântica — proteção da vegetação nativa do Bioma"
          linkUrl="https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11428.htm"
        />
        <LegislacaoItem
          titulo="Decreto Federal nº 6.660/2008"
          descricao="Regulamenta a Lei nº 11.428/2006"
          linkUrl="https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/decreto/d6660.htm"
        />
        <LegislacaoItem
          titulo="Decreto Estadual nº 47.749/2019"
          descricao="Processos de autorização para intervenção ambiental em MG"
          linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/DEC/47749/2019/?cons=1"
        />
        <LegislacaoItem
          titulo="Portaria IEF nº 30/2015"
          descricao="Diretrizes e procedimentos para cumprimento da compensação"
          linkUrl="http://www.siam.mg.gov.br/sla/download.pdf?idNorma=37255"
        />
      </section>
    </div>
  )
}

import type { Metadata } from "next"
import {
  HeroCompensacao,
  PerfisAlvo,
  ContextoEducativo,
  CaminhosPossiveis,
  CTAEspecialista,
  FaqRapido,
  LegislacaoItem,
} from "@/components/acam"

export const metadata: Metadata = {
  title: "Compensação por Espécies Imunes de Corte — Minas Gerais",
  description:
    "Compensação por supressão de espécies imunes de corte (Pequizeiro, Ipê-amarelo, Buriti) em MG. Critérios, modalidades e fundamentação normativa.",
}

export default function EspeciesImunesPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
      <HeroCompensacao
        compensacao="imunes"
        eyebrow="Compensação ambiental · Imunes de corte"
        titulo="Espécies Imunes de Corte em Minas Gerais"
        tagline="Pequizeiro, Ipê-amarelo e Buriti têm proteção especial. Quando a supressão é autorizada, há compensação obrigatória — por plantio ou por pagamento em UFEMG."
        fatosRapidos="Lei 9.743/1988 · Lei 13.635/2000 · Lei 20.308/2012"
      />

      <PerfisAlvo
        perfis={[
          {
            titulo: "Empreendimento com supressão necessária",
            descricao: "Sua área de intervenção tem indivíduos imunes e você precisa dimensionar a compensação.",
          },
          {
            titulo: "Consultoria orçando o caso",
            descricao: "O EIA mapeou árvores imunes na ADA e você precisa calcular o passivo.",
          },
          {
            titulo: "Jurídico revendo condicionante",
            descricao: "Há licença com condicionante de plantio compensatório por imunes e você precisa entender o caminho.",
          },
        ]}
      />

      <ContextoEducativo titulo="A obrigação em três minutos">
        <p>
          Espécies imunes de corte são aquelas declaradas de <strong>preservação permanente</strong> por leis específicas — Pequizeiro, Ipê-amarelo e Buriti em Minas Gerais. A regra é: <strong>não pode cortar</strong>. Quando a supressão é autorizada (em situações excepcionais, com licenciamento), surge a obrigação de compensar.
        </p>
        <p>
          A compensação tem duas modalidades possíveis (plantio ou pagamento em UFEMG), e o empreendedor pode até <strong>combiná-las</strong> — pagar parte e plantar parte. A escolha depende da disponibilidade de área para plantio, do horizonte de cumprimento e do custo comparativo.
        </p>
      </ContextoEducativo>

      <section>
        <h2 className="acam-landing-section-titulo">Principais espécies protegidas em MG</h2>
        <div className="overflow-x-auto">
          <table className="acam-normas-table">
            <thead>
              <tr>
                <th>Espécie</th>
                <th>Proporção</th>
                <th>Legislação</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="cell-name">Pequizeiro (Caryocar brasiliense)</td>
                <td>5 a 10 mudas/árvore</td>
                <td className="cell-detail">Lei nº 20.308/2012</td>
              </tr>
              <tr>
                <td className="cell-name">Ipê-amarelo (Tabebuia spp.)</td>
                <td>1 a 5 mudas/árvore</td>
                <td className="cell-detail">Lei nº 9.743/1988</td>
              </tr>
              <tr>
                <td className="cell-name">Buriti (Mauritia flexuosa)</td>
                <td>2 a 5 mudas/árvore</td>
                <td className="cell-detail">Lei nº 13.635/2000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <CaminhosPossiveis
        titulo="Modalidades de compensação"
        intro="Duas opções, combináveis. A escolha depende de disponibilidade de área para plantio e do horizonte de cumprimento da obrigação."
        caminhos={[
          {
            badge: "Modalidade 1",
            titulo: "Plantio de mudas",
            subtitulo: "Mesma espécie suprimida",
            descricao: "Plantio em proporção definida pela legislação específica, na mesma sub-bacia, em APP, Reserva Legal ou UC de domínio público.",
            tradeoff: "Exige área disponível, projeto de plantio e monitoramento. Custo recorrente até consolidação.",
          },
          {
            badge: "Modalidade 2",
            titulo: "Pagamento em UFEMG",
            subtitulo: "Valor fixo por exemplar suprimido",
            descricao: "Recolhimento de valor em UFEMGs por cada indivíduo suprimido — referência: 100 UFEMGs por árvore.",
            tradeoff: "Mais ágil e previsível, sem custo de manutenção. Mas o valor pode ser alto em casos com muitas árvores.",
          },
        ]}
      />

      <CTAEspecialista
        pergunta="A condicionante é específica e exige interpretação?"
        descricao="A compensação por imunes de corte se cruza com licenciamento, EIA e por vezes com TAC. Para definir estratégia (plantio? pagamento? combinação?) ou para responder a exigência específica do órgão, agende 30 minutos com o especialista responsável técnico do ACAM."
      />

      <FaqRapido
        itens={[
          {
            pergunta: "Posso pagar tudo em UFEMG e nada plantar?",
            resposta: "Em geral, sim — a Modalidade 2 é alternativa autônoma. Mas alguns órgãos exigem combinação mínima quando há disponibilidade de área. Confirme no ato autorizativo.",
          },
          {
            pergunta: "Onde posso plantar?",
            resposta: "Mesma sub-bacia hidrográfica, em APP, Reserva Legal ou UC de domínio público. O órgão pode definir restrições adicionais — verifique a condicionante específica.",
          },
          {
            pergunta: "Tenho que plantar a mesma espécie suprimida?",
            resposta: "Sim. Plantio compensatório de imune segue espécie por espécie — Pequizeiro por Pequizeiro, Ipê-amarelo por Ipê-amarelo. Não se troca espécie.",
          },
        ]}
      />

      <section>
        <h2 className="acam-landing-section-titulo">Legislação aplicável</h2>
        <LegislacaoItem
          titulo="Lei Estadual nº 9.743/1988"
          descricao="Declara de interesse comum e imune de corte o Ipê-amarelo"
          linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/LEI/9743/1988/?cons=1"
        />
        <LegislacaoItem
          titulo="Lei Estadual nº 13.635/2000"
          descricao="Declara de preservação permanente e imune de corte o Buriti"
          linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/LEI/13635/2000/?cons=1"
        />
        <LegislacaoItem
          titulo="Lei Estadual nº 20.308/2012"
          descricao="Altera a Lei nº 13.965/2001, que dispõe sobre proteção do Pequizeiro"
          linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/LEI/20308/2012/?cons=1"
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

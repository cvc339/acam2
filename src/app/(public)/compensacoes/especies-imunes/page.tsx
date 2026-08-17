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
        fatosRapidos="Lei 9.743/1988 · Lei 10.883/1992 · Lei 13.635/2000"
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
          A lei prevê o plantio de mudas e, <strong>alternativamente</strong>, o recolhimento de 100 UFEMGs por árvore suprimida. São vias alternativas, e não parcelas de uma mesma obrigação. No Ipê-amarelo a via pecuniária só está prevista para a supressão necessária a obra, plano, atividade ou projeto de utilidade pública.
        </p>
      </ContextoEducativo>

      {/* Base legal conferida no texto consolidado da ALMG em 17/08/2026.
          Pequizeiro: Lei 10.883/1992, art. 2º, §§ 1º e 2º, na redação da Lei 20.308/2012.
          Ipê-amarelo: Lei 9.743/1988, art. 1º, parágrafo único, e art. 2º, §§ 1º e 2º.
          Buriti: Lei 13.635/2000, art. 2º-A, I e II, na redação da Lei 22.919/2018. */}
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
                <td className="cell-detail">Lei nº 10.883/1992</td>
              </tr>
              <tr>
                <td className="cell-name">Ipê-amarelo e pau-d&apos;arco-amarelo (Tabebuia e Tecoma)</td>
                <td>1 a 5 mudas/árvore</td>
                <td className="cell-detail">Lei nº 9.743/1988</td>
              </tr>
              <tr>
                <td className="cell-name">Buriti (Mauritia sp.)</td>
                <td>2 a 5 mudas/palmeira</td>
                <td className="cell-detail">Lei nº 13.635/2000</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="acam-legal-note">
          A imunidade do Ipê-amarelo não alcança o Ipê-roxo. O parágrafo único do art. 1º da Lei nº 9.743/1988 protege as essências nativas popularmente conhecidas como ipê-amarelo e pau-d&apos;arco-amarelo, pertencentes aos gêneros <em>Tabebuia</em> e <em>Tecoma</em>, e o Ipê-roxo (<em>Handroanthus impetiginosus</em>) não atende ao nome popular nem ao gênero. Espécie ameaçada de extinção segue outro regime, tratado na página de espécies ameaçadas.
        </p>
        <p className="acam-legal-note">
          O plantio do Buriti tem destinação própria, em área de vereda, conforme o inciso I do art. 2º-A da Lei nº 13.635/2000.
        </p>
      </section>

      <CaminhosPossiveis
        titulo="Modalidades de compensação"
        intro="Duas vias alternativas. A escolha depende de disponibilidade de área para plantio, do horizonte de cumprimento e do custo comparativo."
        caminhos={[
          {
            badge: "Modalidade 1",
            titulo: "Plantio de mudas",
            subtitulo: "Mesma espécie suprimida",
            descricao: "Plantio em proporção definida pela legislação específica, na mesma sub-bacia, em APP, Reserva Legal ou UC de domínio público. No Buriti, em área de vereda.",
            tradeoff: "Exige área disponível, projeto de plantio e monitoramento por cinco anos, com reposição das mudas que não se desenvolverem.",
          },
          {
            badge: "Modalidade 2",
            titulo: "Recolhimento em UFEMG",
            subtitulo: "Alternativa ao plantio",
            descricao: "Recolhimento de 100 UFEMGs por árvore a ser suprimida. No Ipê-amarelo, previsto apenas para utilidade pública; no Pequizeiro, o § 2º da lei prevê variações conforme a hipótese de supressão.",
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
            pergunta: "Posso recolher em UFEMG e nada plantar?",
            resposta: "Sim, onde a lei da espécie prevê a alternativa, que é o caso das três. No Ipê-amarelo ela vale apenas para supressão necessária a obra ou projeto de utilidade pública. Confirme sempre a hipótese e o valor no ato autorizativo.",
          },
          {
            pergunta: "Onde posso plantar?",
            resposta: "Mesma sub-bacia hidrográfica, em sistema de enriquecimento florestal ou recuperação de área antropizada, incluindo APP e Reserva Legal, ou em UC de domínio público. O Buriti tem regra própria, em área de vereda. O órgão pode definir critérios adicionais, então verifique a condicionante específica.",
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
          descricao="Declara de preservação permanente, de interesse comum e imune de corte o Ipê-amarelo, alcançando as essências amarelas dos gêneros Tabebuia e Tecoma. Alterada pela Lei nº 20.308/2012"
          linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/LEI/9743/1988/?cons=1"
        />
        <LegislacaoItem
          titulo="Lei Estadual nº 10.883/1992"
          descricao="Declara de preservação permanente, de interesse comum e imune de corte o Pequizeiro (Caryocar brasiliense). Alterada pela Lei nº 20.308/2012"
          linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/LEI/10883/1992/?cons=1"
        />
        <LegislacaoItem
          titulo="Lei Estadual nº 13.635/2000"
          descricao="Declara de interesse comum e imune de corte a palmeira Buriti (Mauritia sp.). Alterada pela Lei nº 22.919/2018, que acrescentou o art. 2º-A da compensação"
          linkUrl="https://www.almg.gov.br/legislacao-mineira/texto/LEI/13635/2000/?cons=1"
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

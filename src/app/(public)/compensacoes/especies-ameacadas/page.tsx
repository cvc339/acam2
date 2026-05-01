import type { Metadata } from "next"
import {
  HeroCompensacao,
  PerfisAlvo,
  ContextoEducativo,
  CTAEspecialista,
  FaqRapido,
  LegislacaoItem,
} from "@/components/acam"

export const metadata: Metadata = {
  title: "Compensação por Espécies Ameaçadas — Minas Gerais",
  description:
    "Compensação por supressão de espécies ameaçadas de extinção em MG. Critérios técnicos, proporção por grau de ameaça e fundamentação normativa.",
}

export default function EspeciesAmeacadasPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-12)" }}>
      <HeroCompensacao
        compensacao="ameacadas"
        eyebrow="Compensação ambiental · Biodiversidade"
        titulo="Compensação por Espécies Ameaçadas"
        tagline="Quando a supressão envolve espécies das listas oficiais, a compensação é por plantio — não há doação de área. A proporção varia conforme o grau de ameaça."
        fatosRapidos="Decreto 47.749/2019 · Art. 73 · Listas oficiais MMA/IEF"
      />

      <PerfisAlvo
        perfis={[
          {
            titulo: "Empreendedor com supressão autorizada",
            descricao: "Você recebeu condicionante envolvendo espécies ameaçadas e precisa dimensionar a compensação.",
          },
          {
            titulo: "Consultoria ambiental orçando o caso",
            descricao: "O EIA identificou ocorrência de espécies ameaçadas e você precisa calcular o passivo.",
          },
          {
            titulo: "Jurídico revendo TAC ou condicionante",
            descricao: "Há TAC em andamento e a compensação por espécies ameaçadas é parte do escopo.",
          },
        ]}
      />

      <ContextoEducativo titulo="A obrigação em três minutos">
        <p>
          A compensação por supressão de espécies ameaçadas de extinção visa garantir a conservação dessas espécies. É distinta da compensação por bioma (Mata Atlântica) ou por destinação fundiária (UC) — aqui o caminho obrigatório é o <strong>plantio de mudas</strong>, em proporção fixada conforme o grau de ameaça da espécie suprimida.
        </p>
        <p>
          A complexidade está em duas frentes: <strong>identificar a espécie</strong> nas listas oficiais (federal e estadual) e <strong>calcular a quantidade exata</strong> de mudas, que varia entre 10× e 25× o número de exemplares suprimidos. O local do plantio também tem regras: APP, Reserva Legal ou corredores de vegetação para conectividade com fragmentos, na mesma sub-bacia.
        </p>
      </ContextoEducativo>

      <section>
        <h2 className="acam-landing-section-titulo">Proporção por grau de ameaça</h2>
        <p style={{ maxWidth: "65ch", marginBottom: "var(--spacing-6)", color: "var(--neutral-600)", lineHeight: 1.7 }}>
          A compensação varia conforme a categoria de ameaça da espécie suprimida, definida pelas listas oficiais.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { grau: "Vulnerável (VU)", proporcao: "10:1", detalhe: "10 mudas por exemplar" },
            { grau: "Em Perigo (EN)", proporcao: "15:1", detalhe: "15 mudas por exemplar" },
            { grau: "Criticamente em Perigo (CR)", proporcao: "25:1", detalhe: "25 mudas por exemplar" },
          ].map((g) => (
            <div key={g.grau} className="acam-card" style={{ padding: "var(--spacing-4)", textAlign: "center" }}>
              <div className="text-xs text-muted-foreground mb-2">{g.grau}</div>
              <div style={{ fontFamily: "var(--font-family-heading)", fontSize: "var(--font-size-2xl)", fontWeight: 700, color: "var(--primary-600)" }}>{g.proporcao}</div>
              <div className="text-xs text-muted-foreground mt-1">{g.detalhe}</div>
            </div>
          ))}
        </div>
        <div className="acam-alert-result" style={{ marginTop: "var(--spacing-5)" }}>
          <strong>Importante:</strong> Esse tipo de compensação deve ser feito mediante <strong>plantio</strong>. Não há possibilidade de doar áreas. Apesar de poder ser realizada em APP, não pode ser feita em área de APP destinada a outra compensação — não há &quot;sobreposição&quot; de compensações.
        </div>
      </section>

      <CTAEspecialista
        pergunta="O caso envolve identificação de espécies, projeto de plantio ou interlocução com órgão?"
        descricao="A compensação por espécies ameaçadas exige conhecimento técnico-jurídico específico — desde a leitura das listas oficiais até o desenho do projeto de plantio. Para casos concretos, agende 30 minutos com o especialista responsável técnico do ACAM."
      />

      <FaqRapido
        itens={[
          {
            pergunta: "Como sei se a espécie está nas listas oficiais?",
            resposta: "Há listas federais (MMA/ICMBio) e estaduais (em MG, deliberação COPAM). O EIA/RIMA do empreendimento é o ponto de partida — geralmente já indica a categoria. Para casos limítrofes, vale validação técnica.",
          },
          {
            pergunta: "Posso compensar plantando outra espécie?",
            resposta: "Não. A compensação exige a mesma espécie suprimida (ou, em alguns casos, espécie do mesmo gênero, com aprovação do órgão). Plantar espécie diferente não cumpre a obrigação.",
          },
          {
            pergunta: "O que acontece se eu não cumprir?",
            resposta: "Inadimplemento gera autuação, multa e, em casos graves, suspensão do licenciamento. A condicionante é vinculada ao processo — sem cumprimento não há renovação de licença.",
          },
        ]}
      />

      <section>
        <h2 className="acam-landing-section-titulo">Legislação aplicável</h2>
        <LegislacaoItem
          titulo="Decreto Estadual nº 47.749/2019"
          descricao="Processos de autorização para intervenção ambiental — Art. 73 trata da compensação por espécies ameaçadas"
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

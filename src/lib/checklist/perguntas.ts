// Perguntas do checklist — replicadas fielmente do ACAM1
// NÃO alterar sem consulta ao fundador

export interface Opcao {
  valor: string
  texto: string
}

export interface Pergunta {
  id: string
  campo: string
  titulo: string
  subtitulo?: string
  tipo: "single" | "multiple"
  opcoes: Opcao[]
  condicao?: (respostas: Record<string, string | string[]>) => boolean
}

export const perguntas: Pergunta[] = [
  {
    id: "q1",
    campo: "tipo_empreendimento",
    titulo: "Qual o tipo do seu empreendimento?",
    tipo: "single",
    opcoes: [
      { valor: "mineracao", texto: "Mineração" },
      { valor: "infraestrutura", texto: "Infraestrutura (rodovia, ferrovia, energia)" },
      { valor: "industrial", texto: "Industrial" },
      { valor: "loteamento", texto: "Loteamento / Edificação" },
      { valor: "outros", texto: "Outros" },
    ],
  },
  {
    id: "q2",
    campo: "estado",
    titulo: "Em qual estado está localizado?",
    tipo: "single",
    opcoes: [
      { valor: "mg", texto: "Minas Gerais" },
      { valor: "outros", texto: "Outros estados" },
    ],
  },
  {
    id: "q3",
    campo: "bioma_ma",
    titulo: "A área de supressão está localizada no Bioma Mata Atlântica?",
    tipo: "single",
    opcoes: [
      { valor: "sim", texto: "Sim (totalmente)" },
      { valor: "parcial", texto: "Parcialmente" },
      { valor: "nao", texto: "Não" },
      { valor: "nao_sei", texto: "Não sei" },
    ],
  },
  {
    id: "q4",
    campo: "licenciamento",
    titulo: "O empreendimento está sujeito a licenciamento ambiental?",
    tipo: "single",
    opcoes: [
      { valor: "sim", texto: "Sim" },
      { valor: "nao", texto: "Não" },
      { valor: "nao_sei", texto: "Não sei" },
    ],
  },
  {
    id: "q5",
    campo: "impacto_significativo",
    titulo: "Foi considerado de significativo impacto ambiental?",
    subtitulo: "Empreendimentos com EIA/RIMA exigido",
    tipo: "single",
    opcoes: [
      { valor: "sim", texto: "Sim (EIA/RIMA exigido)" },
      { valor: "nao", texto: "Não" },
      { valor: "analise", texto: "Em análise / Não definido" },
    ],
    condicao: (r) => r.licenciamento === "sim",
  },
  {
    id: "q6",
    campo: "supressao",
    titulo: "Haverá supressão (corte) de vegetação nativa?",
    tipo: "single",
    opcoes: [
      { valor: "sim", texto: "Sim" },
      { valor: "nao", texto: "Não" },
    ],
  },
  {
    id: "q7",
    campo: "estagio_ma",
    titulo: "Qual o estágio da vegetação a ser suprimida na Mata Atlântica?",
    tipo: "single",
    opcoes: [
      { valor: "primaria", texto: "Primária (vegetação original)" },
      { valor: "avancado", texto: "Secundária - Estágio Avançado" },
      { valor: "medio", texto: "Secundária - Estágio Médio" },
      { valor: "inicial", texto: "Secundária - Estágio Inicial" },
      { valor: "nao_definido", texto: "Não definido ainda" },
    ],
    condicao: (r) => r.supressao === "sim" && (r.bioma_ma === "sim" || r.bioma_ma === "parcial"),
  },
  {
    id: "q8",
    campo: "utilidade_publica",
    titulo: "O empreendimento se enquadra como Utilidade Pública?",
    tipo: "single",
    opcoes: [
      { valor: "sim", texto: "Sim, é Utilidade Pública" },
      { valor: "nao", texto: "Não" },
    ],
    condicao: (r) =>
      r.supressao === "sim" &&
      (r.bioma_ma === "sim" || r.bioma_ma === "parcial") &&
      r.tipo_empreendimento !== "mineracao",
  },
  {
    id: "q9",
    campo: "perimetro_antes_2006",
    titulo: "A área de supressão está em perímetro urbano aprovado antes de 2006?",
    tipo: "single",
    opcoes: [
      { valor: "sim", texto: "Sim (antes de 22/12/2006)" },
      { valor: "nao", texto: "Não (após 22/12/2006)" },
      { valor: "nao_sei", texto: "Não sei" },
    ],
    condicao: (r) =>
      r.tipo_empreendimento === "loteamento" &&
      (r.bioma_ma === "sim" || r.bioma_ma === "parcial"),
  },
  {
    id: "q10",
    campo: "especies_imunes",
    titulo: "Foram identificadas espécies imunes de corte na área?",
    subtitulo: "Pequizeiro, ipê-amarelo, aroeira, entre outras",
    tipo: "single",
    opcoes: [
      { valor: "sim", texto: "Sim" },
      { valor: "nao", texto: "Não" },
      { valor: "nao_sei", texto: "Não sei / Não analisado" },
    ],
    condicao: (r) => r.supressao === "sim",
  },
  {
    id: "q11",
    campo: "intervencao_rl",
    titulo: "Haverá intervenção em Reserva Legal averbada ou declarada no CAR?",
    tipo: "single",
    opcoes: [
      { valor: "sim", texto: "Sim" },
      { valor: "nao", texto: "Não" },
    ],
    condicao: (r) => r.supressao === "sim",
  },
  {
    id: "q12",
    campo: "hipoteses_rl",
    titulo: "A intervenção na Reserva Legal se enquadra em alguma destas hipóteses?",
    tipo: "multiple",
    opcoes: [
      { valor: "utilidade_publica", texto: "Utilidade pública" },
      { valor: "interesse_social", texto: "Interesse social" },
      { valor: "area_desprovida", texto: "Área desprovida de vegetação nativa desde antes de 19/06/2002" },
    ],
    condicao: (r) => r.intervencao_rl === "sim",
  },
  {
    id: "q13",
    campo: "intervencao_app",
    titulo: "Haverá intervenção em APP (Área de Preservação Permanente)?",
    subtitulo: "Margens de cursos d'água, topos de morro, nascentes, encostas",
    tipo: "single",
    opcoes: [
      { valor: "sim", texto: "Sim" },
      { valor: "nao", texto: "Não" },
      { valor: "nao_sei", texto: "Não sei / Não analisado" },
    ],
    condicao: (r) => r.supressao === "sim",
  },
  {
    id: "q14",
    campo: "especies_ameacadas",
    titulo: "Foram identificadas espécies ameaçadas de extinção na área?",
    subtitulo: "Espécies constantes das listas oficiais",
    tipo: "single",
    opcoes: [
      { valor: "sim", texto: "Sim" },
      { valor: "nao", texto: "Não" },
      { valor: "nao_sei", texto: "Não sei / Não analisado" },
    ],
    condicao: (r) => r.supressao === "sim",
  },
]

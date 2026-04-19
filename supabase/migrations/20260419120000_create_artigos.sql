-- Tipo: Schema
-- Descricao: Tabela de artigos editoriais publicados no site Vieira Castro
-- Integrado ao ACAM — admin via service_role; leitura publica dos artigos com status='publicado' via RLS.

BEGIN;

-- 1. Tabela de artigos
CREATE TABLE IF NOT EXISTS public.artigos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  resumo TEXT,
  conteudo TEXT,                    -- markdown
  categoria TEXT NOT NULL DEFAULT 'geral',
  autor TEXT NOT NULL DEFAULT 'Cláudio Vieira Castro',
  capa_url TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','publicado','arquivado')),
  publicado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices para consultas publicas (listagem por status + ordenacao temporal)
CREATE INDEX IF NOT EXISTS idx_artigos_status_publicado
  ON public.artigos (status, publicado_em DESC);
CREATE INDEX IF NOT EXISTS idx_artigos_categoria
  ON public.artigos (categoria);
CREATE INDEX IF NOT EXISTS idx_artigos_criado
  ON public.artigos (criado_em DESC);

-- Trigger para manter atualizado_em automatico
CREATE OR REPLACE FUNCTION public.artigos_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_artigos_atualizado_em ON public.artigos;
CREATE TRIGGER trg_artigos_atualizado_em
  BEFORE UPDATE ON public.artigos
  FOR EACH ROW
  EXECUTE FUNCTION public.artigos_set_atualizado_em();

-- 2. RLS: apenas artigos publicados sao visiveis publicamente.
-- Rascunhos/arquivados ficam restritos ao service_role (admin do ACAM).
ALTER TABLE public.artigos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artigos publicados sao visiveis publicamente" ON public.artigos;
CREATE POLICY "Artigos publicados sao visiveis publicamente"
  ON public.artigos FOR SELECT
  USING (status = 'publicado');

-- Sem outras policies = escrita/leitura de rascunhos apenas via service_role.

COMMIT;

-- =========================================================================
-- SEED: migrar o artigo IN ICMBio 24/2025 (ja redigido no vieiracastro-site)
-- Pode rodar separadamente do schema se preferir.
-- =========================================================================

INSERT INTO public.artigos (
  titulo, slug, resumo, conteudo, categoria, autor, status, publicado_em
) VALUES (
  'IN ICMBio 24/2025: o instrumento que sua empresa vai precisar — e o tempo que ele exige',
  'in-icmbio-24-2025',
  'A IN 24/2025 reorganizou o procedimento de doação de imóveis em unidades de conservação federais e criou a doação antecipada. Mas o gargalo real — a capacidade operacional de um ICMBio que perdeu quase um terço do quadro — segue de pé. Para o gestor, aceleração normativa não é aceleração efetiva.',
$MD$Um processo de doação de imóvel para uma unidade de conservação federal protocolado em maio de 2023 foi concluído em setembro de 2025. Dois anos e quatro meses. Uma única doação. O caso é público e, pior, não é exceção. É padrão. Eu tenho ouvido de muitos empreendedores uma reclamação constante sobre o tempo de tramitação desses processos administrativos e cartorários.

Esse é o problema que a [Instrução Normativa ICMBio nº 24/2025](https://www.in.gov.br/en/web/dou/-/instrucao-normativa-icmbio-n-24-de-12-de-agosto-de-2025-639756567), publicada em agosto de 2025, se propôs a resolver. O próprio ICMBio anunciou a norma como ação para **acelerar** a regularização fundiária e dar vazão ao estoque reprimido de compensações ambientais. A intenção foi correta. Mas, a leitura que eu faço, depois de 25 anos acompanhando casos de compensação ambiental por regularização fundiária em UC, é que a norma, sozinha, não vai dar conta.

## O que a IN mudou e o que ela não mudou

A IN 24/2025 reorganizou o procedimento, criou a modalidade de **doação antecipada** com geração de crédito ambiental compensável, alargou as hipóteses cobertas (compensação de reserva legal, compensação florestal, compensação minerária, intervenção em APP, supressão em Mata Atlântica) e padronizou o rito em duas fases. Tudo isso é melhoria real.

É necessário reconhecer que a IN mudou o **procedimento**. Mas não mudou quem executa o procedimento.

No mesmo período em que o estoque de compensações represadas cresceu, o ICMBio perdeu quase um terço do seu quadro de pessoal. De acordo com levantamento divulgado pelo jornal *Metrópoles*, IBAMA e ICMBio perderam **2.800 servidores em dez anos**. O déficit atual é estimado em 4.000 vagas. O ICMBio opera hoje com cerca de 3.600 servidores em atividade, responsáveis por administrar 335 unidades de conservação federais, participar de licenciamentos, analisar compensações e também instruir processos de doação com as etapas adicionais que a IN exige.

A aritmética não fecha. Um instituto em desestruturação não vai processar em menos tempo uma norma que criou etapas novas e ampliou modalidades.

## O que isso significa para o gestor

Se a empresa tem compensação ambiental pendente — seja minerária, florestal, de APP ou de reserva legal — e aposta que a IN 24/2025 vai acelerar o encerramento da obrigação, pode se frustrar. A norma resultou em avanço regulatório, mas não proporcionou o aumento da capacidade operacional.

O prazo de 2 anos e 4 meses que o caso público revelou é o cenário considerado como "otimista". Pressupõe que o imóvel candidato já estava documentalmente saneado, que não houve sobreposição fundiária, que a UC de destino tinha gestor disponível e que a equipe do ICMBio responsável pela análise não estava acumulando outras pautas. Quando qualquer uma dessas variáveis falha — e todas elas falham com regularidade —, o prazo estica.

## A recomendação que eu dou aos clientes

**Primeiro.** Trate a compensação ambiental como um processo de três a quatro anos, não de meses. Ajuste cronograma, orçamento e comunicação com o órgão licenciador a esse horizonte real.

**Segundo.** Não entre no rito da IN sem certificar-se de que o imóvel escolhido foi previamente saneado: cadeia dominial completa, georreferenciamento homologado, CAR válido, ausência de litígio registral e de passivos ambientais são pré-condições. Resolver essas pendências depois do protocolo significa meses adicionais parados em exigências.

Existem ferramentas indicadas para essa análise preliminar. Essa análise pode ser feita com apoio do [ACAM](https://acam.com.br/), plataforma que o escritório desenvolveu justamente para acelerar esse tipo de diagnóstico. A ferramenta de due diligence de matrícula do ACAM lê a certidão imobiliária, identifica pendências registrais, cruza com bases de dados de informações ambientais e gera um parecer preliminar sobre a elegibilidade do imóvel em poucos minutos, não em semanas. Antes de protocolar qualquer doação, saber se o imóvel candidato tem chance real de ser aceito é o que separa um processo de dois anos de um processo que pode durar até cinco anos.

**Terceiro.** Se a obrigação ambiental é crítica para o cronograma do empreendimento, considere fazer a **doação antecipada**, a novidade mais útil da IN 24. Funciona como uma compra antecipada de crédito compensatório, antes mesmo de a empresa ter definido o passivo específico que irá quitar. Essa estratégia pode reduzir o risco de o empreendedor ficar refém do relógio do ICMBio no momento em que estiver buscando a regularização.

## Um ponto sobre o discurso oficial

A comunicação do ICMBio sobre a IN 24/2025 fala em "aceleração". Em sentido normativo, comparado ao vácuo anterior regulado pela revogada IN 05/2016, a norma de fato acelera. Mas *aceleração normativa* e *aceleração efetiva* são coisas diferentes. Enquanto a segunda não ocorre, a primeira é publicidade institucional. Gestor corporativo que planeja com base em publicidade institucional se torna refém dos prazos. É assim que funciona.

A IN 24/2025 precisa ser vista com a mesma lente de realismo com que se recebe qualquer instrumento normativo de um órgão que precisa exercitar a reestruturação. A norma é bem-vinda, mas ela não consegue substituir o planejamento.$MD$,
  'compensacoes-ambientais',
  'Cláudio Vieira Castro',
  'publicado',
  '2026-04-19 12:00:00+00'::TIMESTAMPTZ
)
ON CONFLICT (slug) DO NOTHING;

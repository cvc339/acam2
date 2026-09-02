# Spec: rodada mista na Calculadora de Intervencao (AIA previa + corretiva)

STATUS: IMPLEMENTADA em 2026-09-02 (sessao seguinte a da escrita), sem commit.
Motor: calcularIntervencaoMista + tipo FrenteAia em intervencao.ts; wizard com
terceira opcao no passo tipoAia e dois campos de volume por produto; resultado,
fichas DAE e PDF separados por frente (expediente unico). Testes: 13 passando
(8 anteriores + 5 da mista) via npx vitest.

Escrita em 2026-09-02, ao fim da sessao que criou o marcador de tipo de AIA.
Contexto de negocio: caso real (PIA da Fazenda Lapa da Onca, Capitao Eneas) com
DAIA convencional e corretiva no MESMO processo (RC SEMAD/IEF 3.102/2021, arts.
4o e 26). Pratica adotada: uma guia de taxa de expediente e DUAS guias de taxa
florestal, previa simples e corretiva em dobro (art. 69 da Lei 4.747/1968).

## Estado atual (ja implementado, NAO COMMITADO)

- `src/lib/calculo/intervencao.ts`: TipoAia ("previa" | "corretiva"),
  FATOR_CORRETIVA = 2, fator aplicado so na taxa florestal, detalhe do item
  declara o acrescimo, ResultadoIntervencao.tipoAia.
- `src/app/(public)/calculadora/page.tsx`: passo "tipoAia" apos "intro",
  fator no calcular() local, aviso no resultado, tipoAia no payload do PDF,
  prefixo na descricao do DAE florestal.
- `src/app/api/pdf/calculadora/route.tsx`: tipoAia no body, nota na Secao
  Taxa Florestal, prefixo no descFlorestal.
- `src/lib/calculo/intervencao.test.ts`: 8 testes (rodados com npx vitest,
  que NAO e devDependency por decisao do titular nesta sessao).

## O que a rodada mista acrescenta

Terceira opcao no passo tipoAia: "Mista, previa e corretiva no mesmo processo".

1. Estado: `tipoAia: "previa" | "corretiva" | "mista"`. Quando mista, o passo
   "volumes" pede DOIS campos por produto selecionado (volume da frente previa
   e volume da frente corretiva); `volumes` vira
   `Record<string, { previa: number; corretiva: number }>` OU dois records
   paralelos (`volumesPrevia`, `volumesCorretiva`), o que for menos invasivo.
   Quantidades de expediente seguem por atividade, sem divisao (guia unica de
   expediente na pratica adotada); avaliar campo opcional de area por frente
   apenas como memoria descritiva.
2. Motor: `calcularIntervencao` ganha sobrecarga ou funcao nova
   `calcularIntervencaoMista(atividades, produtosPrevia, produtosCorretiva,
   ufemg, ano)` que devolve `{ previa: ResultadoIntervencao; corretiva:
   ResultadoIntervencao; totalGeral }`, reusando a funcao existente duas vezes
   (previa sem fator, corretiva com fator; reposicao de cada frente sem dobro).
3. Resultado: bloco de taxa florestal e reposicao SEPARADOS por frente, com
   subtotais e a nota do art. 69 so na frente corretiva; expediente unico.
   Duas fichas de DAE florestal (uma por frente), uma ficha de expediente.
4. PDF: mesmas divisoes; duas linhas de descFlorestal.
5. Testes: mista = soma exata de uma rodada previa + uma corretiva; reposicao
   nunca dobra; expediente identico ao de uma rodada unica com as mesmas
   quantidades.

## Restricoes

- Mexer SOMENTE na calculadora (ordem do titular em 02/09/2026): os tres
  arquivos acima + testes. Nao instalar dependencias (vitest roda via npx).
- Acentuacao correta em todo texto visivel ao usuario (regra 7 do CLAUDE.md).
- Antes de codar, conferir `git status`: as alteracoes da sessao de 02/09
  podem ainda estar sem commit.

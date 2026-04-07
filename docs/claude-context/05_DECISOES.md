# ACAM 2 — Decisoes Arquiteturais

## [2026-04-06] Multi-tenancy

**Contexto:** O ACAM 1 nao tinha isolamento de dados entre usuarios.
Com multiplos usuarios simultaneos, dados podem vazar entre contas.

**Decisao:** Multi-tenancy N1 (isolamento por usuario_id).
Cada usuario ve apenas seus proprios dados. RLS obrigatorio em todas as tabelas
que contem dados de usuario. Nao ha conceito de "organizacao" — cada usuario
e independente.

**Alternativas:**
- N2 (organizacao com multiplos usuarios) — complexidade desnecessaria neste momento
- Sem RLS (confiar no backend) — exatamente o que causou problemas no ACAM 1

**Consequencias:**
- (+) Isolamento garantido no nivel do banco
- (+) Simples de implementar e testar
- (-) Se no futuro precisar de equipes/organizacoes, sera necessario migrar para N2

---

## [2026-04-06] Stack Frontend

**Contexto:** O ACAM 1 usa HTML/CSS/JS vanilla com 39+ paginas separadas.
Manter consistencia visual e comportamental e muito dificil. A calculadora
de intervencoes, por exemplo, causou problemas serios ao atualizar.

**Decisao:** Next.js (App Router) + Tailwind + shadcn/ui.
O projeto tem 39+ paginas e ferramentas complexas (calculadora de intervencoes).
A componentizacao resolve os problemas de manutencao do ACAM 1.

**Alternativas consideradas:**
- Pages Router — sendo substituido gradualmente
- HTML/CSS/JS vanilla — mesmos problemas do ACAM 1

**Consequencias:**
- (+) Componentes reutilizaveis, SSR, rotas automaticas
- (+) Ecossistema maduro, boa integracao com Supabase
- (-) Build mais complexo que vanilla

---

## [2026-04-06] Banco de dados

**Contexto:** O ACAM 1 comecou em SQLite e migrou para PostgreSQL (Supabase),
mas manteve funcoes de compatibilidade (dbGet, dbAll, dbRun) que escondem
problemas. Migrations nao eram versionadas.

**Decisao:** PostgreSQL via Supabase, com:
- Migrations versionadas (numeradas sequencialmente)
- RLS em todas as tabelas com dados de usuario
- Sem camada de compatibilidade — SQL nativo do PostgreSQL
- Supabase client para auth e real-time (quando aplicavel)

**Alternativas:**
- PostgreSQL auto-hospedado — mais controle, mais trabalho operacional
- PlanetScale (MySQL) — bom, mas Supabase tem RLS nativo e auth integrado

**Consequencias:**
- (+) RLS nativo, auth integrado, storage integrado
- (+) Migrations versionadas previnem o problema de "tabela que nao existe"
- (-) Dependencia do Supabase como provider

---

## [2026-04-06] Autenticacao

**Contexto:** O ACAM 1 usa JWT custom com bcrypt. Funciona, mas nao tem
verificacao de email robusta, recuperacao de senha, nem protecao contra brute force.

**Decisao:** Supabase Auth.
A integracao com RLS e nativa (auth.uid()) e elimina uma classe inteira
de bugs de seguranca. Verificacao de email, recuperacao de senha e
protecao contra brute force vem prontos.

**Alternativa considerada:**
- Auth.js (NextAuth) — flexivel, mas precisa sincronizar com RLS manualmente

**Consequencias:**
- (+) RLS usa auth.uid() nativamente
- (+) Menos codigo custom de auth
- (-) Menos controle sobre o fluxo de autenticacao

---

## [2026-04-06] Pagamentos

**Contexto:** O ACAM 1 ja usa Mercado Pago e funciona.

**Decisao:** Manter Mercado Pago.
- Checkout Pro para pagamentos
- Webhooks para confirmacao
- Suporte a PIX, cartao, boleto

**Consequencias:**
- (+) Ja validado no ACAM 1
- (+) Mercado brasileiro, sem problemas de cambio
- (-) API do MP pode ser instavel — manter retry robusto

---

## [2026-04-06] Email

**Contexto:** O ACAM 1 usa Resend e funciona bem.

**Decisao:** Manter Resend.
- Templates para emails transacionais
- Dominio verificado

---

## [2026-04-06] Armazenamento de arquivos

**Contexto:** O ACAM 1 salva uploads no filesystem local. Em producao
com deploy serverless (Vercel), isso nao funciona — arquivos sao efemeros.

**Decisao:** Supabase Storage.
- Uploads de documentos em buckets privados
- URLs assinadas para download temporario
- Politicas de acesso vinculadas ao usuario

**Alternativas:**
- S3 direto — mais controle, mais configuracao
- Cloudflare R2 — mais barato, mas sem integracao nativa com Supabase

---

## [2026-04-06] Deploy

**Contexto:** O ACAM 1 roda em servidor dedicado. Para escalar
e manter, um deploy mais automatizado e necessario.

**Decisao:** Railway (full-stack) + Supabase (banco/auth/storage).
O fundador ja tem assinatura Railway. O processamento de consultas
(Claude API + IDE-Sisema) leva 15-20 segundos — Railway nao tem
limitacao de tempo de execucao, diferente do Vercel.

**Alternativa considerada:**
- Vercel — limitacoes de timeout para processos longos

**Consequencias:**
- (+) Sem limites de tempo de execucao
- (+) Bom para processos longos
- (+) Custo ja coberto pela assinatura existente
- (-) Deploy um pouco menos automatizado que Vercel (mas funcional)

---

## [2026-04-06] Tabelas editaveis de legislacao e documentos — PENDENTE

**Contexto:** Cada compensacao tem legislacao aplicavel e documentos exigidos
para protocolo. No ACAM1, essas informacoes estao hardcoded no HTML.
Quando uma norma muda, e preciso alterar o codigo. Os links usados
sao majoritariamente da Assembleia Legislativa de MG, o que garante
atualizacao em caso de alteracao parcial da norma.

**Opcoes:**
1. Tabelas no banco (editaveis pelo admin): legislacao_por_compensacao,
   documentos_por_compensacao. Admin atualiza sem mexer em codigo.
2. Manter no codigo (como no ACAM1): mais simples, mas exige deploy
   para cada alteracao de norma.

**Decisao:** A avaliar. A frequencia de mudanca de normas determinara.
Se raro (1-2x por ano), pode ficar no codigo. Se frequente, vale tabela.

---

## [2026-04-06] PDFs devem incluir documentos para protocolo

**Contexto:** No ACAM1, a lista de documentos necessarios para protocolar
a compensacao aparece na tela de resultado, mas nao e reproduzida no PDF.
O usuario perde essa informacao ao salvar apenas o PDF.

**Decisao:** Os PDFs gerados pelo ACAM2 devem incluir uma secao
"Documentos necessarios para protocolo" com a lista completa.
Essa informacao e parte do resultado da consulta.

---

## [2026-04-07] Ferramenta gratuita de Reposicao Florestal

**Contexto:** A calculadora de intervencao ambiental ja calcula a reposicao
florestal, mas como parte de um fluxo maior (taxa expediente + taxa florestal
+ reposicao). O profissional que busca reposicao florestal quer calcular
apenas a reposicao, com base nos quantitativos de lenha nativa, madeira nativa
e carvao vegetal de floresta nativa.

**Decisao:** Criar ferramenta gratuita separada para a compensacao de Reposicao
Florestal. Duas ou tres perguntas sobre quantitativos + calculo. Manter a
calculadora de intervencao como esta (nao mexer). As duas coexistem:
- Calculadora de intervencao: fluxo completo do requerimento
- Calculo de reposicao: ferramenta especifica da compensacao

---

## [2026-04-06] Botao de gerar PDF padronizado

**Contexto:** No ACAM1, o botao de gerar PDF era uma barra verde enorme.
Desnecessario e inconsistente com os demais botoes.

**Decisao:** Usar botao padrao (acam-btn-primary, tamanho default)
em todas as paginas onde o PDF sera gerado. Sem barra gigante.

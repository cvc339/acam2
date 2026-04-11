o # ACAM 2 — Plano de Execucao

Este documento e o mapa do projeto. Ao iniciar cada sessao de trabalho,
leia este plano para saber onde o projeto esta e o que fazer em seguida.

Referencia de ferramentas e nomenclatura: `01_COMPENSACOES.md`

---

## Fase 0 — Fundacao (antes de qualquer feature)

**Skills:** /vc-init → /vc-design → /vc-data (tabelas core)
**Stack:** Next.js App Router + Tailwind + shadcn/ui | Supabase (auth/banco/storage) | Railway (deploy)

**Entregas:**
- [x] Decisoes arquiteturais finalizadas (Next.js, Supabase Auth, Railway)
- [x] Compensacoes e modalidades documentadas (01_COMPENSACOES.md)
- [x] Projeto criado com /vc-init (Next.js + Supabase + Railway)
- [x] Design system criado com /vc-design (/styleguide funcionando)
- [x] CLAUDE.md escrito com convencoes do projeto
- [x] Layout base: header, navegacao, footer
- [x] Tabelas core criadas com RLS: perfis, configuracoes, transacoes_creditos, pagamentos, consultas, documentos, leads, registro_uso
- [x] Schema documentado em 04_BANCO_DADOS.md
- [x] Auth funcionando (cadastro, login, verificacao email, recuperacao senha)
- [x] /vc-security: RLS verificado (8/8 tabelas, 0 issues) — 2026-04-06
- [x] Styleguide aprovado pelo fundador (16 showcases, 100% cobertura, zero inline) — 2026-04-06
- [x] Tabelas normas, normas_compensacoes, documentos_protocolo criadas com RLS — 2026-04-06
- [x] /vc-security: re-verificacao (11/11 tabelas, 0 issues) — 2026-04-06
- [x] Skill /vc-design atualizada com licoes aprendidas

**Criterio para avancar:** Build funcional, auth OK, styleguide aprovado, RLS OK.
**Status: FASE 0 CONCLUIDA — 2026-04-06**

---

## Fase 1 — MVP (compensacao mineraria completa + ferramentas gratuitas)

O MVP entrega a compensacao mais usada (Mineraria) com todas as suas modalidades,
os 3 requerimentos, e as ferramentas gratuitas. Isso permite uso real imediato.

**Entregas:**

### Bloco 0 — Componentes React + Paginas base (pré-requisito)
- [x] Criar componentes React reutilizaveis em src/components/acam/ (11 componentes)
- [x] Styleguide importa e usa esses componentes (nao replica classes)
- [x] Landing page (storytelling: dores reais, 8 compensacoes + ferramentas, cenarios, creditos, autoridade)
- [x] Login, registro, recuperar senha usando componentes do design system
- [x] Dashboard usando componentes do design system
- [x] Termos de uso e politica de privacidade
- [x] Tipografia: Source Serif 4 (titulos) + Source Sans 3 (corpo)
- [x] Icones SVG de compensacoes (CompensacaoIcon)
**Status: BLOCO 0 CONCLUIDO — 2026-04-07**

### Bloco 1A — Creditos e Pagamento
- [x] Tabelas: transacoes_creditos, pagamentos (com RLS)
- [x] Compra de creditos via Mercado Pago (pacotes: 10/25/50)
- [x] Webhook de confirmacao
- [x] Extrato de creditos
- [x] Saldo no dashboard
- [x] /vc-security: isolamento verificado
**Status: BLOCO 1A CONCLUIDO — 2026-04-09**

### Bloco 1B — Conteudo gratuito
- [x] Avaliacao de Compensacoes (checklist 14 perguntas, logica condicional, SNUC verificar)
- [x] Resultado no dashboard com badges (Provavel/Verificar) + refazer avaliacao
- [x] 8 paginas informativas (compensacoes com modalidades, legislacao com links)
- [x] Auditoria normativa: tabela MA completa, base calculo reposicao, PRADA/WebAmbiente
- [x] Links de legislacao: 16 normas com fontes verificadas (Planalto, ALMG, SIAM, CONAMA)
- [x] Calculadora de Intervencao Ambiental (taxa expediente, florestal, reposicao)
- [x] Calculo de Reposicao Florestal (ferramenta gratuita separada)
- [x] Template PDF profissional (React-PDF: capa, tabelas, fichas DAE, paginacao)
- [x] Accordion nas orientacoes DAE
**Status: BLOCO 1B CONCLUIDO — 2026-04-07**

**Pendencias resolvidas:**
- [x] Enriquecer PDF de reposicao florestal com conteudo normativo (1 pagina max)
- [x] Fontes Source Serif/Sans no PDF (URLs a corrigir)
- [x] Responsividade mobile (ajuste fino da landing page)

### Bloco 1C — Engine de analise (servicos internos)
- [x] Analise Documental (Claude API): matricula 20+ campos, CCIR, ITR, CAR, CND
- [x] Analise Geoespacial (IDE-Sisema WFS): UCs, bacias, MapBiomas
- [x] MVAR: pontuacao 0-100, classificacao de risco, vetos
- [x] Divergencias: cruzamento entre documentos
- [x] Parecer PDF: relatorio tecnico completo com mapa
- [x] Mapa interativo (Leaflet)
**Status: BLOCO 1C CONCLUIDO — 2026-04-10**

### Bloco 1D — Destinacao em UC — Base (5cr) [modalidades 2.1, 6.3]
- [x] Tabelas: consultas, documentos (com RLS) — criadas na Fase 0
- [x] Upload multi-documento (matricula + KML obrigatorios)
- [x] Orquestracao completa: docs → geo → MVAR → pontuacao → PDF
- [x] Debito de creditos com garantia de reembolso
- [x] Status em tempo real
- [x] Aparece em: Comp. Mineraria (2.1) e Comp. Reserva Legal (6.3)
- [x] /vc-security: isolamento completo (10 tabelas, 10 API routes, 0 critico)
**Status: BLOCO 1D CONCLUIDO — 2026-04-10**

### Bloco 1E — Calculo de Implantacao/Manutencao de UC (2cr) [modalidade 2.2]
- [x] Calculo com UFEMG vigente
- [x] Debito de creditos com reembolso
**Status: BLOCO 1E CONCLUIDO — 2026-04-08**

### Bloco 1F — Requerimentos (0.5cr cada)
- [x] Requerimento Mineraria (Anexo I, Lei 20.922/2013) — wizard + PDF
- [x] Requerimento Mata Atlantica (Portaria IEF 30/2015) — wizard + PDF
- [x] Requerimento SNUC (Portaria IEF 55) — wizard + PDF
- [x] Mascaras de campo (CPF, CNPJ, CEP, telefone, data)
- [x] Exportacao PDF
**Status: BLOCO 1F CONCLUIDO — 2026-04-08**

**Criterio para avancar:** Um usuario real consegue:
1. Se cadastrar e verificar email
2. Comprar creditos
3. Fazer checklist e ver compensacoes aplicaveis
4. Submeter analise de destinacao em UC (mineraria) e receber parecer PDF
5. Usar calculo de implantacao/manutencao de UC
6. Preencher e exportar os 3 requerimentos
7. Usar a calculadora de intervencao (gratuita)

---

## Fase 2 — V1 (todas as ferramentas pagas + admin)

Acrescenta as ferramentas de Mata Atlantica, APP e SNUC, alem de
admin, email e analytics.

**Entregas:**

### Bloco 2A — Destinacao em UC — APP (6cr) [modalidade 4.4]
- [x] Engine base + validacao de bacia e sub-bacia
- [x] Aparece em: Comp. APP (4.4)
**Status: BLOCO 2A CONCLUIDO — 2026-04-11**

### Bloco 2B — Destinacao em UC — Mata Atlantica (7cr) [modalidade 1.2]
- [ ] Engine base + bacia + sub-bacia + bioma MA
- [ ] Aparece em: Comp. Mata Atlantica (1.2)

### Bloco 2C — Analise de Servidao/RPPN (7cr) [modalidade 1.1]
- [ ] Analise geoespacial para servidao ambiental ou RPPN
- [ ] Aparece em: Comp. Mata Atlantica (1.1)

### Bloco 2D — Calculadora SNUC (7cr) [modalidade 5.1]
- [ ] Sobreposicao UCs + fatores FR3a/FR4/FR5
- [ ] Ecossistemas ameacados + areas prioritarias

### Bloco 2E — NDVI Sentinel
- [ ] Analise de vegetacao por satelite (apoio para MA e Servidao)

### Bloco 2F — Comunicacao, admin, analytics
- [ ] Email transacional (Resend): verificacao, compra, parecer, alertas
- [ ] Lead capture + consentimento LGPD + exportacao CSV
- [ ] Admin: estatisticas, precos, UFEMG, usuarios, consultas
- [ ] Analytics: uso por ferramenta

### Pipeline de Analise de Matricula (reescrita completa — prioridade maxima)
- [x] Nivel 1: Multi-pass basico (substituido pelo pipeline v3)
- [x] Pipeline v3 (3 LLM + codigo deterministico):
  - [x] Prompt A: dados do imovel (abertura da matricula)
  - [x] Prompt B: atos com partes e percentuais (A+B em paralelo)
  - [x] Codigo deterministico: pareamento, onus, titularidade (parcial), area vigente
  - [x] Outorga conjugal (art. 1.647 CC), georef (Decreto 4.449/2002)
  - [x] Restricoes ambientais + regra de UC de protecao integral
  - [x] Prompt C: analise de transmissibilidade (sem PDF, so JSON)
  - [x] Semaforo deterministico (regras binarias, override sobre LLM)
  - [x] Testado com Opus: 7/7 na matricula 12669 (80/20 correto)
- [x] Parecer PDF migrado para React-PDF com template ACAM2
- [ ] Nivel 2: Few-shot examples no prompt (exemplos reais anonimizados)
- [ ] Nivel 3: Validacao de schema com Zod (rejeitar extracoes impossiveis, re-extrair)

### Verificacao final V1
- [ ] /vc-security: re-verificacao completa (todas as tabelas)
- [ ] /vc-review: checklist pre-deploy aprovado
- [ ] Testes com multiplos usuarios simultaneos

**Criterio para avancar:** Todas as 9 ferramentas pagas + 2 gratuitas funcionando.
Sistema estavel com multiplos usuarios.

---

## Fase 3 — V2 (evolucao pos-feedback)

- [ ] Fluxo + Normas (2cr) — PDFs processuais + legislacao consolidada
- [ ] Melhorias de UX baseadas em feedback real
- [ ] Otimizacoes de performance
- [ ] Expansao para outros estados (alem de MG)
- [ ] API publica (se houver demanda)

---

## Resumo de ferramentas por fase

| Fase | Ferramentas pagas | Ferramentas gratuitas |
|---|---|---|
| MVP | dest-uc-base (5cr), calc-impl-uc (2cr), 3 requerimentos (0.5cr cada) | avaliacao, calc-intervencao |
| V1 | dest-uc-app (6cr), dest-uc-ma (7cr), dest-servidao (7cr), calc-snuc (7cr) | — |
| V2 | fluxo+normas (2cr) | — |

---

## Regras do plano

1. **Nao pular fases** — Fase 0 deve estar 100% antes de iniciar Fase 1
2. **Blocos podem ser paralelos** — 1A e 1B podem ser feitos ao mesmo tempo
3. **Seguranca nao e opcional** — /vc-security apos cada conjunto de migrations
4. **Creditos sempre seguros** — Todo fluxo de erro deve reembolsar
5. **Nomenclatura canonica** — Usar nomes de 01_COMPENSACOES.md, nunca inventar
6. **Atualizar este documento** — Marcar checkboxes conforme concluir

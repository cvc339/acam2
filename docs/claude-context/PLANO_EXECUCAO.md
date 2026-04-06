# ACAM 2 — Plano de Execucao

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
- [ ] Projeto criado com /vc-init (Next.js + Supabase + Railway)
- [ ] Design system criado com /vc-design (/styleguide funcionando)
- [ ] Tabelas core criadas com RLS: perfis, configuracoes
- [ ] Auth funcionando (cadastro, login, verificacao email, recuperacao senha)
- [ ] Layout base: header, navegacao, footer
- [ ] CLAUDE.md escrito com convencoes do projeto
- [ ] /vc-security: RLS verificado nas tabelas core

**Criterio para avancar:** Build funcional, auth OK, styleguide aprovado, RLS OK.

---

## Fase 1 — MVP (compensacao mineraria completa + ferramentas gratuitas)

O MVP entrega a compensacao mais usada (Mineraria) com todas as suas modalidades,
os 3 requerimentos, e as ferramentas gratuitas. Isso permite uso real imediato.

**Entregas:**

### Bloco 1A — Creditos e Pagamento
- [ ] Tabelas: transacoes_creditos, pagamentos (com RLS)
- [ ] Compra de creditos via Mercado Pago (pacotes: 10/25/50)
- [ ] Webhook de confirmacao
- [ ] Extrato de creditos
- [ ] Saldo no dashboard
- [ ] /vc-security: isolamento verificado

### Bloco 1B — Conteudo gratuito
- [ ] Avaliacao de Compensacoes (checklist 13 perguntas)
- [ ] Resultado com compensacoes aplicaveis → modalidades → ferramentas
- [ ] 8 paginas informativas (uma por compensacao, com modalidades)
- [ ] Link externo para WebAmbiente (1.3) — verificar URL atualizada
- [ ] Calculadora de Intervencao Ambiental (taxa expediente, florestal, reposicao)

### Bloco 1C — Engine de analise (servicos internos)
- [ ] Analise Documental (Claude API): matricula 20+ campos, CCIR, ITR, CAR, CND
- [ ] Analise Geoespacial (IDE-Sisema WFS): UCs, bacias, MapBiomas
- [ ] MVAR: pontuacao 0-100, classificacao de risco, vetos
- [ ] Divergencias: cruzamento entre documentos
- [ ] Parecer PDF: relatorio tecnico completo com mapa
- [ ] Mapa interativo (Leaflet)

### Bloco 1D — Destinacao em UC — Base (5cr) [modalidades 2.1, 6.3]
- [ ] Tabelas: consultas, documentos (com RLS)
- [ ] Upload multi-documento (matricula + KML obrigatorios)
- [ ] Orquestracao completa: docs → geo → MVAR → pontuacao → PDF
- [ ] Debito de creditos com garantia de reembolso
- [ ] Status em tempo real
- [ ] Aparece em: Comp. Mineraria (2.1) e Comp. Reserva Legal (6.3)
- [ ] /vc-security: isolamento completo

### Bloco 1E — Calculo de Implantacao/Manutencao de UC (2cr) [modalidade 2.2]
- [ ] Calculo com UFEMG vigente
- [ ] Debito de creditos com reembolso

### Bloco 1F — Requerimentos (0.5cr cada)
- [ ] Requerimento Mineraria (Anexo I, Lei 20.922/2013) — wizard + PDF
- [ ] Requerimento Mata Atlantica (Portaria IEF 30/2015) — wizard + PDF
- [ ] Requerimento SNUC (Portaria IEF 55) — wizard + PDF
- [ ] Mascaras de campo (CPF, CNPJ, CEP, telefone, data)
- [ ] Exportacao PDF

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
- [ ] Engine base + validacao de bacia e sub-bacia
- [ ] Aparece em: Comp. APP (4.4)

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

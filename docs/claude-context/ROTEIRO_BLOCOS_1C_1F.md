# Roteiro de Execucao — Blocos 1C a 1F

Preparado para acelerar as proximas sessoes.
Cada bloco lista: o que fazer, referencia no ACAM1, decisoes necessarias do fundador, e estimativa de complexidade.

---

## Bloco 1C — Engine de Analise (servicos internos)

Este e o bloco mais complexo. Sao 6 servicos que formam o motor de todas as ferramentas pagas.

### 1C.1 — Analise Documental (Claude API)
**O que faz:** Envia PDF da matricula para Claude API, extrai 20+ campos estruturados.
**Referencia ACAM1:** `services/analise.js`
**Complexidade:** Media — e uma chamada de API com prompt estruturado.
**Decisao necessaria:** Nenhuma — logica identica ao ACAM1.
**Estimativa:** 30 min

### 1C.2 — Analise Geoespacial (IDE-Sisema WFS)
**O que faz:** Processa KML/GeoJSON, consulta camadas WFS do geoserver de MG, calcula sobreposicao com Turf.js.
**Referencia ACAM1:** `services/geoespacial.js`
**Complexidade:** Alta — multiplas chamadas WFS, processamento geometrico, timeout de 30s.
**Decisao necessaria:** Nenhuma — mesmas camadas e logica do ACAM1.
**Estimativa:** 1-2h (muita logica geoespacial)
**Dependencias:** @turf/turf, @mapbox/togeojson (instalar)

### 1C.3 — MVAR (Matriz de Viabilidade)
**O que faz:** Pontua imovel em 4 dimensoes (juridica, fiscal, titularidade, tecnica), classifica risco.
**Referencia ACAM1:** `services/mvar.js`, `data/onus_gravames.json`
**Complexidade:** Media — logica de pontuacao com regras claras.
**Decisao necessaria:** Nenhuma — mesma matriz do ACAM1.
**Estimativa:** 45 min
**Dependencia:** Copiar `onus_gravames.json` e `vtn_database.json` do ACAM1

### 1C.4 — Divergencias
**O que faz:** Cruza dados entre documentos (matricula vs ITR vs CCIR), detecta inconsistencias.
**Referencia ACAM1:** `services/divergencias.js`
**Complexidade:** Baixa — comparacao de campos.
**Estimativa:** 20 min

### 1C.5 — Parecer PDF
**O que faz:** Gera relatorio tecnico completo com todos os resultados.
**Referencia ACAM1:** `services/pdf.js` (usa Puppeteer)
**Complexidade:** Alta — template PDF complexo com mapa, tabelas, graficos.
**Decisao necessaria:** Usar React-PDF (como fizemos na calculadora) ou Puppeteer (como ACAM1)?
**Recomendacao:** React-PDF — ja temos o template base, nao precisa de Chrome headless.
**Estimativa:** 2-3h (template extenso)

### 1C.6 — Mapa Interativo (Leaflet)
**O que faz:** Renderiza poligonos do imovel e UCs sobrepostas em mapa interativo.
**Referencia ACAM1:** usa Leaflet inline no HTML
**Complexidade:** Media — Leaflet em Next.js precisa de dynamic import (SSR incompativel).
**Decisao necessaria:** Nenhuma.
**Estimativa:** 45 min
**Dependencia:** leaflet, react-leaflet (instalar)

### Total Bloco 1C: ~6h de trabalho
### Decisoes do fundador: 1 (React-PDF vs Puppeteer para parecer)

---

## Bloco 1D — Destinacao em UC — Base (5cr)

**O que faz:** Pagina de upload de documentos + orquestracao completa (docs → geo → MVAR → pontuacao → PDF).
**Referencia ACAM1:** `public/upload-imovel.html`, `routes/consultas.js`
**Complexidade:** Alta — e a integracao de todos os servicos do 1C.

### Tarefas:
- 1D.1: Pagina de upload (componente DocumentoItem + UploadZone do styleguide)
- 1D.2: API route de orquestracao (recebe docs, processa, retorna resultado)
- 1D.3: Debito de creditos com garantia de reembolso
- 1D.4: Status em tempo real (polling ou SSE)
- 1D.5: Pagina de resultado com mapa + MVAR + parecer PDF

### Decisoes do fundador:
- Status em tempo real: polling simples (consulta a cada 5s) ou Server-Sent Events?
**Recomendacao:** Polling — mais simples, funciona em qualquer ambiente.

### Total Bloco 1D: ~4h de trabalho

---

## Bloco 1E — Calculo de Implantacao/Manutencao de UC (2cr)

**O que faz:** Calcula valor da compensacao mineraria modalidade 2 com UFEMG.
**Referencia ACAM1:** `public/calculo-modalidade2.html`
**Complexidade:** Baixa — formula simples com UFEMG.
**Decisao necessaria:** Nenhuma.

### Tarefas:
- 1E.1: Logica de calculo em src/lib/calculo/
- 1E.2: Pagina com formulario (mesma abordagem da calculadora)
- 1E.3: PDF do resultado

### Total Bloco 1E: ~1.5h de trabalho

---

## Bloco 1F — Requerimentos (0.5cr cada)

**O que faz:** 3 formularios wizard multi-etapa com exportacao PDF.
**Referencia ACAM1:**
- `public/requerimento-mineraria.html`
- `public/requerimento-mata-atlantica.html`
- `public/requerimento-snuc.html`
**Complexidade:** Media-alta — muitos campos, mascaras, validacoes, PDF formatado como formulario oficial.

### Tarefas:
- 1F.1: Componente de mascaras (CPF, CNPJ, CEP, telefone, data) — ja parcialmente feito
- 1F.2: Requerimento Mineraria — wizard 5 etapas + PDF
- 1F.3: Requerimento Mata Atlantica — wizard 5 etapas + PDF
- 1F.4: Requerimento SNUC — wizard com mais etapas + PDF

### Decisoes do fundador:
- Os PDFs dos requerimentos devem seguir exatamente o formato do orgao? Ou formato ACAM?
**Nota:** No ACAM1, os requerimentos geram PDF no formato do orgao (Anexo I, Portaria IEF, etc.)

### Total Bloco 1F: ~4h de trabalho (muito campo, 3 formularios)

---

## Resumo de tempo estimado

| Bloco | Estimativa | Decisoes |
|---|---|---|
| 1C — Engine | ~6h | 1 (PDF: React-PDF vs Puppeteer) |
| 1D — Destinacao UC | ~4h | 1 (Status: polling vs SSE) |
| 1E — Calculo Mod.2 | ~1.5h | 0 |
| 1F — Requerimentos | ~4h | 1 (formato PDF) |
| **Total** | **~15.5h** | **3 decisoes** |

## Como acelerar

1. **Sessoes focadas:** Uma sessao por bloco, sem desvios.
2. **Decisoes antecipadas:** Responda as 3 decisoes acima antes da sessao.
3. **Validacao ao final:** Em vez de revisar cada passo, valide o bloco completo no final.
4. **Prioridade:** 1E (mais simples) primeiro, depois 1F, depois 1C+1D juntos.

## Ordem recomendada de execucao

1. **1E** (Calculo Mod.2) — rapido, entrega valor imediato
2. **1F** (Requerimentos) — independente da engine, pode rodar em paralelo
3. **1C** (Engine) — o mais complexo, precisa de atencao
4. **1D** (Destinacao UC) — integracao final de tudo

Essa ordem permite que 1E e 1F fiquem prontos enquanto o 1C (mais pesado) e desenvolvido.

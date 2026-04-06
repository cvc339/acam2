# ACAM 2 — Compensacoes Ambientais de MG

O ACAM trata de compensacoes ambientais previstas na legislacao de Minas Gerais.
Atualmente sao 8 compensacoes, cada uma com modalidades de cumprimento.

Este documento e a referencia canonica para nomenclatura e estrutura do dominio.

---

## 1. Compensacao Mata Atlantica

**Nome formal:** Compensacao pelo corte ou supressao de vegetacao primaria ou secundaria
em estagio medio ou avancado de regeneracao no Bioma Mata Atlantica

**Modalidades de cumprimento:**
- **1.1** Destinar area para servidao ambiental ou RPPN
- **1.2** Destinar area para regularizacao fundiaria em UC de protecao integral
- **1.3** Recuperacao florestal (subsidiaria — quando 1.1 e 1.2 sao inviaveis)

**Ferramentas ACAM:**
- 1.1 → Analise de Servidao/RPPN (7cr)
- 1.2 → Destinacao em UC — Mata Atlantica (7cr) — inclui validacao de bacia, sub-bacia e bioma
- 1.3 → Link externo para WebAmbiente (Embrapa) — sem ferramenta propria
- Requerimento Mata Atlantica (0.5cr) — Portaria IEF 30/2015

---

## 2. Compensacao Mineraria

**Nome formal:** Compensacao por supressao de vegetacao nativa por empreendimentos minerarios

**Modalidades de cumprimento:**
- **2.1** Destinar area para regularizacao fundiaria em UC de protecao integral
- **2.2** Executar medida compensatoria para implantacao ou manutencao de UC de protecao integral

**Ferramentas ACAM:**
- 2.1 → Destinacao em UC — Base (5cr)
- 2.2 → Calculo de Implantacao/Manutencao de UC (2cr)
- Requerimento Mineraria (0.5cr) — Anexo I, Lei 20.922/2013

---

## 3. Compensacao de Ameacadas

**Nome formal:** Compensacao pelo corte de especies ameacadas de extincao

**Modalidades de cumprimento:**
- **3.1** Plantio de mudas da especie suprimida em APP, Reserva Legal ou corredores
  de vegetacao para estabelecer conectividade a outro fragmento vegetacional

**Ferramentas ACAM:** Apenas informativo (sem ferramenta propria)

---

## 4. Compensacao APP

**Nome formal:** Compensacao por intervencao em Area de Preservacao Permanente

**Modalidades de cumprimento:**
- **4.1** Recuperacao de APP
- **4.2** Recuperacao de area degradada no interior de UC
- **4.3** Implantacao ou revitalizacao de area verde urbana
- **4.4** Destinacao ao Poder Publico de area no interior de UC de dominio publico,
  pendente de regularizacao fundiaria

**Ferramentas ACAM:**
- 4.4 → Destinacao em UC — APP (6cr) — inclui validacao de bacia e sub-bacia
- 4.1, 4.2, 4.3 → Apenas informativo (sem ferramenta propria)

---

## 5. Compensacao SNUC

**Nome formal:** Compensacao ambiental prevista na Lei do SNUC, para empreendimentos
de significativo impacto ambiental

**Modalidades de cumprimento:**
- **5.1** Pagamento de valor a ser calculado

**Ferramentas ACAM:**
- 5.1 → Calculadora SNUC (7cr)
- Requerimento SNUC (0.5cr) — Portaria IEF 55

---

## 6. Compensacao de Reserva Legal

**Nome formal:** Compensacao de Reserva Legal, quando existe deficit de reserva legal
na propriedade

**Modalidades de cumprimento:**
- **6.1** Aquisicao de Cota de Reserva Ambiental (CRA)
- **6.2** Arrendamento de area sob regime de servidao ambiental ou Reserva Legal
- **6.3** Destinacao ao Poder Publico de area em UC de dominio publico pendente
  de regularizacao fundiaria
- **6.4** Cadastramento de outra area equivalente e excedente a Reserva Legal,
  em imovel de mesma titularidade ou de terceiro, com vegetacao nativa,
  no mesmo bioma

**Ferramentas ACAM:**
- 6.3 → Destinacao em UC — Base (5cr) — mesma ferramenta de 2.1
- 6.1, 6.2, 6.4 → Apenas informativo (sem ferramenta propria)

---

## 7. Compensacao de Imunes

**Nome formal:** Compensacao por supressao de especies imunes de corte

**Modalidades de cumprimento:**
- **7.1** Plantio de mudas da mesma especie suprimida
- **7.2** Pagamento em UFEMG por individuo suprimido

**Ferramentas ACAM:** Apenas informativo (sem ferramenta propria)

---

## 8. Reposicao Florestal

**Nome formal:** Obrigacao legal decorrente da supressao de vegetacao nativa,
de natureza compensatoria do volume de materia-prima florestal extraida

**Modalidades de cumprimento:**
- **8.1** Formacao de florestas, proprias ou fomentadas
- **8.2** Participacao em associacoes de reflorestadores ou outros sistemas
- **8.3** Recolhimento de valor especifico a conta de arrecadacao da reposicao florestal

**Ferramentas ACAM:** Apenas informativo (Calculadora de Intervencao ajuda no calculo
da reposicao florestal como parte do requerimento de intervencao)

---

## Catalogo completo de ferramentas

### Ferramentas pagas de analise

| ID | Nome | Creditos | Modalidades | Validacoes |
|---|---|---|---|---|
| `dest-uc-base` | Destinacao em UC — Base | 5 | 2.1, 6.3 | Documental (Claude API) + Geoespacial (UCs) + MVAR |
| `dest-uc-app` | Destinacao em UC — APP | 6 | 4.4 | Base + bacia + sub-bacia |
| `dest-uc-ma` | Destinacao em UC — Mata Atlantica | 7 | 1.2 | Base + bacia + sub-bacia + bioma MA |
| `dest-servidao` | Analise de Servidao/RPPN | 7 | 1.1 | Analise geoespacial + area para servidao ou RPPN |
| `calc-impl-uc` | Calculo de Implantacao/Manutencao de UC | 2 | 2.2 | Calculo com UFEMG |
| `calc-snuc` | Calculadora SNUC | 7 | 5.1 | Sobreposicao UCs + fatores FR |

### Ferramentas pagas de preenchimento

| ID | Nome | Creditos | Compensacao |
|---|---|---|---|
| `req-mineraria` | Requerimento Mineraria | 0.5 | Comp. Mineraria |
| `req-mata-atlantica` | Requerimento Mata Atlantica | 0.5 | Comp. Mata Atlantica |
| `req-snuc` | Requerimento SNUC | 0.5 | Comp. SNUC |

### Ferramentas gratuitas

| ID | Nome | Descricao |
|---|---|---|
| `avaliacao` | Avaliacao de Compensacoes | Checklist que identifica compensacoes aplicaveis |
| `calc-intervencao` | Calculadora de Intervencao Ambiental | Calculo de taxa de expediente, taxa florestal e reposicao florestal |

### Links externos

| Modalidade | Destino | Status |
|---|---|---|
| 1.3 Recuperacao Florestal | WebAmbiente (Embrapa) | Link quebrado — verificar URL atualizada |

---

## Arquitetura das ferramentas de Destinacao em UC

As 3 ferramentas de destinacao compartilham um motor de analise comum (engine),
com camadas adicionais conforme a complexidade:

```
Engine Core (todas usam):
  ├─ Analise Documental (Claude API) — matricula, CCIR, ITR, CAR, CND
  ├─ Analise Geoespacial (IDE-Sisema) — sobreposicao com UCs
  ├─ MVAR — pontuacao de viabilidade (juridica, fiscal, titularidade, tecnica)
  ├─ Divergencias — cruzamento entre documentos
  ├─ Parecer PDF — relatorio tecnico completo
  └─ Mapa interativo (Leaflet)

Camada APP (dest-uc-app = engine + isto):
  ├─ Verificacao de bacia hidrografica
  └─ Verificacao de sub-bacia hidrografica

Camada Mata Atlantica (dest-uc-ma = engine + APP + isto):
  └─ Verificacao de bioma Mata Atlantica
```

Isso significa que no codigo, a implementacao sera:
- 1 servico core de analise de destinacao
- Modulos de validacao adicional (bacia, sub-bacia, bioma) ativados por parametro
- 3 rotas/paginas distintas no frontend (uma por tipo)
- Precos diferenciados refletindo a complexidade

# ACAM 2 — Modulos e Prioridades

A nomenclatura de ferramentas segue o documento 01_COMPENSACOES.md.
A referencia canonica e la. Este documento organiza os modulos tecnicos.

---

## Catalogo de ferramentas do usuario

### Ferramentas gratuitas

| ID | Nome | Descricao |
|---|---|---|
| `avaliacao` | Avaliacao de Compensacoes | Checklist que identifica compensacoes aplicaveis ao empreendimento |
| `calc-intervencao` | Calculadora de Intervencao Ambiental | Calcula taxa de expediente, taxa florestal e reposicao florestal (MG) |

### Ferramentas pagas — Analise

| ID | Nome | Cr. | Modalidades | Camadas de validacao |
|---|---|---|---|---|
| `dest-uc-base` | Destinacao em UC — Base | 5 | 2.1, 6.3 | Documental + Geoespacial + MVAR |
| `dest-uc-app` | Destinacao em UC — APP | 6 | 4.4 | Base + bacia + sub-bacia |
| `dest-uc-ma` | Destinacao em UC — Mata Atlantica | 7 | 1.2 | Base + bacia + sub-bacia + bioma MA |
| `dest-servidao` | Analise de Servidao/RPPN | 7 | 1.1 | Geoespacial + area para servidao/RPPN |
| `calc-impl-uc` | Calculo de Implantacao/Manutencao de UC | 2 | 2.2 | Calculo com UFEMG |
| `calc-snuc` | Calculadora SNUC | 7 | 5.1 | Sobreposicao UCs + fatores FR |

### Ferramentas pagas — Preenchimento de requerimentos

| ID | Nome | Cr. | Base legal |
|---|---|---|---|
| `req-mineraria` | Requerimento Mineraria | 0.5 | Anexo I, Lei 20.922/2013 |
| `req-mata-atlantica` | Requerimento Mata Atlantica | 0.5 | Portaria IEF 30/2015 |
| `req-snuc` | Requerimento SNUC | 0.5 | Portaria IEF 55 |

### Links externos

| Modalidade | Destino | Observacao |
|---|---|---|
| 1.3 Recuperacao Florestal | WebAmbiente (Embrapa) | Link a verificar |

### Resumo financeiro

| Tipo | Qtd | Creditos (total se usar todas) |
|---|---|---|
| Analise de destinacao | 3 | 5 + 6 + 7 = 18 |
| Outras analises | 3 | 7 + 2 + 7 = 16 |
| Requerimentos | 3 | 0.5 x 3 = 1.5 |
| **Total** | **9 pagas** | **35.5** |

---

## Modulos tecnicos

### Modulo 1 — Auth
- Cadastro com nome, email, senha, telefone, empresa, CPF/CNPJ
- Login via Supabase Auth
- Verificacao de email obrigatoria
- Recuperacao de senha
- Descadastro (LGPD)
- Tabelas: `auth.users` (Supabase) + `perfis` (dados adicionais)
- Multi-tenancy: N1 (usuario isolado por auth.uid())
- Dependencias: nenhuma
- **Prioridade: MVP**

### Modulo 2 — Dashboard
- Exibe ferramentas organizadas por compensacao → modalidade
- Mostra saldo de creditos
- Lista consultas recentes com status
- Acesso ao checklist e resultados
- Tabelas: leitura de `consultas`, `transacoes_creditos`
- Dependencias: Auth, Creditos
- **Prioridade: MVP**

### Modulo 3 — Creditos
- Saldo atual do usuario
- Extrato de transacoes (compras, usos, reembolsos)
- Debito atomico com garantia de reembolso
- Tabelas: `transacoes_creditos`
- Dependencias: Auth
- **Prioridade: MVP**

### Modulo 4 — Pagamento
- Integracao Mercado Pago (preferencia de pagamento)
- Webhook para confirmacao
- Pacotes de creditos com desconto (Basico 10cr, Intermediario 25cr, Premium 50cr)
- Historico de pagamentos
- Tabelas: `pagamentos`
- Dependencias: Auth, Creditos
- **Prioridade: MVP**

### Modulo 5 — Avaliacao de Compensacoes (gratuito)
- Checklist de 13 perguntas dinamicas sobre o empreendimento
- Identifica quais das 8 compensacoes sao aplicaveis
- Resultado direcionando para modalidades e ferramentas
- Tabelas: nenhuma (client-side, pode persistir)
- Dependencias: nenhuma
- **Prioridade: MVP**

### Modulo 6 — Paginas Informativas
- 8 paginas (uma por compensacao) com:
  - Legislacao aplicavel
  - Modalidades de cumprimento e seus requisitos
  - Ferramentas disponiveis (link para ferramenta ou info "sem ferramenta")
  - Link externo para WebAmbiente na modalidade 1.3
- Gratuito, sem autenticacao
- Dependencias: nenhuma
- **Prioridade: MVP**

### Modulo 7 — Engine de Analise Documental
- Envio de PDFs para Claude API
- Extracao estruturada da matricula (20+ campos)
- Extracao de CCIR, ITR, CAR, CND
- Classificacao de onus/gravames (impede/dificulta/nao prejudica)
- Deteccao de divergencias entre documentos
- Tabelas: `documentos` (dados_extraidos)
- Servico interno, usado por dest-uc-base/app/ma
- **Prioridade: MVP**

### Modulo 8 — Engine de Analise Geoespacial
- Processamento de KML/KMZ/SHP/GeoJSON
- Consulta WFS ao IDE-Sisema:
  - UCs federais/estaduais/municipais/privadas
  - Bioma Mata Atlantica
  - Bacias e sub-bacias hidrograficas
  - MapBiomas (uso natural/antropico e uso do solo)
- Calculo de sobreposicao com Turf.js (area ha, percentual)
- Geracao de mapa interativo (Leaflet)
- Servico interno, usado por todas as ferramentas de analise
- **Prioridade: MVP**

### Modulo 9 — MVAR (Matriz de Viabilidade)
- Pontuacao 0-100 em 4 dimensoes:
  - Juridica 40% (onus, gravames, integridade registral)
  - Fiscal 30% (conformidade tributaria)
  - Titularidade 20% (tipo de proprietario)
  - Tecnica 10% (georreferenciamento, Decreto 12.689/2025)
- Classificacao: verde (90-100) / amarelo (60-89) / vermelho (0-55)
- Itens de veto automatico
- Base: onus_gravames.json
- Servico interno, usado pelas ferramentas de destinacao
- **Prioridade: MVP**

### Modulo 10 — Parecer PDF
- Geracao de relatorio tecnico completo via Puppeteer
- Template HTML → PDF com capa, dados, analises, mapa, pontuacao, recomendacoes
- Salvo para download e envio por email
- Servico interno, usado pelas ferramentas de destinacao
- **Prioridade: MVP**

### Modulo 11 — Destinacao em UC — Base (5cr) [2.1, 6.3]
- Upload multi-documento (matricula + KML obrigatorios)
- Orquestracao: Documental → Geoespacial → MVAR → Pontuacao → PDF
- Debito de 5 creditos com garantia de reembolso
- Status em tempo real
- Tabelas: `consultas`, `documentos`
- Dependencias: Auth, Creditos, Mod.7, Mod.8, Mod.9, Mod.10
- **Prioridade: MVP**

### Modulo 12 — Calculo de Implantacao/Manutencao de UC (2cr) [2.2]
- Calculo automatico com UFEMG vigente
- Debito de 2 creditos com reembolso
- Dependencias: Auth, Creditos, Configuracoes (UFEMG)
- **Prioridade: MVP**

### Modulo 13 — Requerimentos (0.5cr cada)
- 3 formularios assistidos com wizard multi-etapa:
  - Requerimento Mineraria (Anexo I, Lei 20.922/2013)
  - Requerimento Mata Atlantica (Portaria IEF 30/2015)
  - Requerimento SNUC (Portaria IEF 55)
- Mascaras (CPF, CNPJ, CEP, telefone, data)
- Exportacao PDF
- Dependencias: Auth, Creditos
- **Prioridade: MVP**

### Modulo 14 — Calculadora de Intervencao Ambiental (gratuito)
- Calcula: taxa de expediente, taxa florestal, reposicao florestal
- Usa UFEMG vigente
- Interface complexa com regras regulatorias
- Client-side
- Dependencias: Configuracoes (UFEMG)
- **Prioridade: MVP**

### Modulo 15 — Destinacao em UC — APP (6cr) [4.4]
- Mesma engine de dest-uc-base + validacao de bacia e sub-bacia
- Debito de 6 creditos com reembolso
- Dependencias: Auth, Creditos, Mod.7, Mod.8, Mod.9, Mod.10
- **Prioridade: V1**

### Modulo 16 — Destinacao em UC — Mata Atlantica (7cr) [1.2]
- Mesma engine de dest-uc-app + validacao de bioma Mata Atlantica
- Debito de 7 creditos com reembolso
- Dependencias: Auth, Creditos, Mod.7, Mod.8, Mod.9, Mod.10
- **Prioridade: V1**

### Modulo 17 — Analise de Servidao/RPPN (7cr) [1.1]
- Analise geoespacial de area para servidao ambiental ou RPPN
- Processamento de shapefile/KML/GeoJSON
- Debito de 7 creditos com reembolso
- Dependencias: Auth, Creditos, Mod.8
- **Prioridade: V1**

### Modulo 18 — Calculadora SNUC (7cr) [5.1]
- Sobreposicao com UCs + fatores de compensacao (FR3a, FR4, FR5)
- Analise de ecossistemas ameacados
- Areas prioritarias para conservacao
- Dependencias: Auth, Creditos, Mod.8
- **Prioridade: V1**

### Modulo 19 — NDVI Sentinel
- Analise de cobertura vegetal via Sentinel-2
- NDVI, deteccao de nuvens, tendencias historicas
- Servico de apoio para dest-uc-ma e dest-servidao
- **Prioridade: V1**

### Modulo 20 — Email Transacional
- Verificacao de email, confirmacao de compra, parecer pronto, alertas
- Provider: Resend
- **Prioridade: V1**

### Modulo 21 — Lead Capture
- Formulario de captura + consentimento LGPD
- Exportacao CSV
- Tabelas: `leads`
- **Prioridade: V1**

### Modulo 22 — Admin
- Estatisticas, gestao de precos, UFEMG, usuarios, leads
- Tabelas: leitura de todas
- **Prioridade: V1**

### Modulo 23 — Analytics
- Registro de uso de ferramentas (gratuitas e pagas)
- Dashboard no admin
- Tabelas: `registro_uso`
- **Prioridade: V1**

### Modulo 24 — Fluxo + Normas (2cr)
- PDFs processuais + legislacao consolidada
- **Prioridade: V2**

### Modulo 25 — API Publica
- Endpoints REST para integracao externa
- **Prioridade: Futuro**

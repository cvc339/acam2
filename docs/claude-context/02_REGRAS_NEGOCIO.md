# ACAM 2 — Regras de Negocio e Modelo de Dominio

## Entidades do Dominio

### Usuario
- E uma pessoa que acessa a plataforma
- Criado pelo proprio usuario (auto-cadastro)
- Contem: nome, email, senha (hash), telefone, empresa, CPF/CNPJ
- Relaciona-se com: creditos (1:N), consultas (1:N), pagamentos (1:N)
- Estados: pendente_verificacao → ativo → inativo
- Regras:
  - Email deve ser verificado antes do primeiro uso de ferramenta paga
  - Pode ter perfil admin (flag)
  - Creditos sao saldo acumulado, nunca negativo

### Credito
- E a unidade monetaria interna do sistema
- Criado por compra (Mercado Pago) ou ajuste administrativo
- Contem: quantidade, tipo (compra/uso/reembolso), descricao, valor_pago
- Relaciona-se com: usuario (N:1), pagamento (N:1, opcional), consulta (N:1, opcional)
- Regras:
  - NUNCA debitar sem garantia de que a operacao sera concluida ou reembolsada
  - Todo debito deve ter transacao registrada
  - Todo reembolso deve ter motivo documentado
  - Saldo = SUM(compras + reembolsos) - SUM(usos)

### Consulta
- E uma analise solicitada pelo usuario sobre um imovel ou cenario
- Criada pelo usuario ao submeter documentos
- Contem: modalidade, nome_imovel, municipio, area, status, parecer (JSON/PDF)
- Relaciona-se com: usuario (N:1), documentos (1:N), creditos (1:N)
- Estados: pendente → processando → concluida → erro → reembolsada
- Regras:
  - Debitar creditos ANTES do processamento
  - Se processamento falhar: reembolsar automaticamente
  - Registrar tentativas e motivos de falha
  - Parecer PDF gerado ao final com sucesso

### Documento
- E um arquivo enviado pelo usuario como parte de uma consulta
- Criado pelo upload durante a consulta
- Contem: tipo, nome_arquivo, caminho, tamanho, dados_extraidos (JSON)
- Relaciona-se com: consulta (N:1)
- Tipos aceitos:
  - **matricula** (obrigatorio) — PDF da matricula do imovel
  - **kml** (obrigatorio) — Arquivo geoespacial do imovel (KML, KMZ, SHP, GeoJSON)
  - **ccir** — Certificado de Cadastro de Imovel Rural
  - **itr** — Imposto Territorial Rural
  - **car** — Cadastro Ambiental Rural
  - **cnd** — Certidao Negativa de Debitos Trabalhistas
  - **outros** — Documentos complementares (ate 5)
- Regras:
  - Limite de tamanho: 10MB por arquivo (50MB para geoespaciais)
  - Tipos permitidos: .pdf, .kml, .kmz, .shp (zip), .geojson, .json
  - Dados extraidos via Claude API ficam em dados_extraidos

### Pagamento
- E uma transacao financeira via Mercado Pago
- Criado quando o usuario inicia compra de creditos
- Contem: pacote, creditos, valor, status, payment_id, metodo
- Relaciona-se com: usuario (N:1), creditos (1:N)
- Estados: pendente → aprovado → rejeitado → cancelado
- Regras:
  - Creditos so sao creditados apos webhook confirmar aprovacao
  - Webhook do Mercado Pago atualiza status
  - Historico de pagamentos acessivel ao usuario

### Lead
- E um contato capturado pelo sistema (pre-cadastro)
- Criado pelo questionario ou formulario de contato
- Contem: email, nome, telefone, empresa, origem, dados_checklist
- Relaciona-se com: nenhuma entidade (independente)
- Regras:
  - Email unico
  - Consentimento de marketing registrado

### Configuracao
- E um par chave-valor de configuracao do sistema
- Criada pelo admin
- Contem: chave (unica), valor (JSON)
- Exemplos: precos, ufemg, limites
- Regras:
  - Alteravel apenas por admin
  - Valor UFEMG atualizado anualmente

### RegistroUso (Analytics)
- E um evento de uso de ferramenta
- Criado automaticamente ao acessar/usar ferramentas
- Contem: ferramenta, evento (acesso/resultado/pdf), usuario_id (opcional), dados
- Regras:
  - Funciona mesmo sem autenticacao (ferramentas gratuitas)
  - Nao contem dados sensiveis do usuario

---

## Regras de Negocio Criticas

### R1 — Seguranca de Creditos
```
ANTES de processar qualquer consulta paga:
  1. Verificar saldo >= custo
  2. Debitar creditos
  3. Registrar transacao com tipo "uso"
  4. Iniciar processamento

SE processamento falhar:
  1. Registrar erro com motivo
  2. Reembolsar creditos automaticamente
  3. Registrar transacao com tipo "reembolso"
  4. Notificar usuario

NUNCA: debitar sem reembolso garantido em caso de falha
```

### R2 — Analise de Matricula (Claude API)
Campos extraidos obrigatoriamente:
- Numero da matricula, cartorio, livro, folha
- Proprietario(s): nome, CPF/CNPJ, estado civil, percentual
- Area total em hectares
- Municipio e comarca
- Onus e gravames (lista completa com classificacao)
- Averbacoes ambientais (reserva legal, APP)
- Confrontacoes e coordenadas

Classificacao de onus (dados em onus_gravames.json):
- **IMPEDE** (0 pts) — Hipoteca, penhora, arresto, alienacao fiduciaria, etc.
- **DIFICULTA** (10 pts) — Servidao, tombamento, restricao ambiental, etc.
- **NAO_PREJUDICA** (40 pts) — Retificacoes, georreferenciamento, cancelamentos

### R3 — MVAR (Matriz de Viabilidade de Aquisicao Rural)
Pontuacao total: 100 pontos

| Dimensao | Peso | O que avalia |
|---|---|---|
| Juridica | 40% | Onus, gravames, integridade registral |
| Fiscal | 30% | Conformidade tributaria (CND-ITR) |
| Titularidade | 20% | Tipo de proprietario |
| Tecnica | 10% | Status do georreferenciamento |

Classificacao de risco:
- **Verde (90-100)** — Baixo risco, prosseguir
- **Amarelo (60-89)** — Medio risco, cautela
- **Vermelho (0-55)** — Alto risco, nao prosseguir

Itens de VETO (automaticamente 0 pontos):
- Onus que impedem transferencia
- Espolio sem inventario
- Pessoa incapaz

### R4 — Analise Geoespacial (IDE-Sisema)
Camadas consultadas via WFS:
- UCs federais, estaduais, municipais, privadas
- Area de Lei Mata Atlantica
- Circunscricoes hidrograficas
- MapBiomas (uso natural/antropico)
- MapBiomas (uso do solo detalhado)

Processamento:
1. Converter arquivo do usuario para GeoJSON
2. Extrair bounding box
3. Consultar cada camada WFS dentro do bbox
4. Calcular sobreposicao com Turf.js (area em hectares, percentual)
5. Gerar mapa interativo com Leaflet

### R5 — Pontuacao Final da Consulta
Pesos por dimensao:
- Registral: 25%
- Fiscal: 20%
- Geoespacial: 35% (mais importante — prioridade UC)
- Juridica: 20%

Status final:
- **ADEQUADO** — Imovel viavel para compensacao
- **PENDENCIAS** — Viavel com ressalvas
- **NAO ATENDE** — Inviavel

### R6 — Calculadora de Intervencoes Ambientais
Ferramenta gratuita que calcula requisitos de compensacao baseado em:
- Tipo de intervencao
- Area afetada
- Bioma
- Normas aplicaveis

### R7 — Destinacao de Areas
Analise se uma area pode ser destinada a UC especifica:
- Verificacao de bioma (Mata Atlantica)
- Verificacao de bacia hidrografica
- Analise de vegetacao nativa (NDVI via Sentinel-2)
- Fatores de compensacao SNUC (FR3a, FR4, FR5)

### R8 — Checklist de Identificacao
Questionario de 13 perguntas que identifica quais modalidades de compensacao
se aplicam ao caso do usuario. Resultado gratuito, direciona para ferramentas.

### R9 — Geracao de Parecer (PDF)
Relatorio tecnico completo gerado ao final de cada consulta:
- Capa com logo, titulo, data, ID
- Dados do imovel
- Status de cada documento
- Resultados IDE-Sisema com mapa
- Analise de divergencias
- Pontuacao e classificacao de risco
- Impedimentos e pontos positivos
- Recomendacoes finais

---

## Valores de Referencia

### UFEMG (Unidade Fiscal do Estado de Minas Gerais)
- 2026: R$ 5,7899
- Atualizada anualmente
- Usada em calculos de compensacao mineraria

### VTN (Valor da Terra Nua)
- Fonte: SIPT (Sistema de Precos de Terras) — Receita Federal
- Base: exercicio 2022
- 800+ municipios de MG
- 6 categorias de uso do solo com R$/ha

### Onus e Gravames
- 20 tipos que IMPEDEM transferencia
- 20 tipos que DIFICULTAM
- 10 tipos que NAO PREJUDICAM
- Base legal: Portaria IEF 27/2017, Lei 9.985/2000

### Georreferenciamento
- Decreto 12.689/2025
- Certificado SIGEF: 10 pts
- Nao georreferenciado (transferencia): 5 pts (permitido ate 21/10/2029)
- Nao georreferenciado (desmembramento): 0 pts (obrigatorio)

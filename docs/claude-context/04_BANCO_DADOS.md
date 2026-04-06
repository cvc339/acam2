# ACAM 2 — Banco de Dados

## Modelo

- **Provider:** PostgreSQL via Supabase
- **Multi-tenancy:** N3 (isolamento por `auth.uid()`)
- **Migrations:** `supabase/migrations/` (versionadas, idempotentes)
- **RLS:** Obrigatorio em todas as tabelas

## Tabelas

### perfis (N3)
Dados adicionais do usuario, vinculados 1:1 ao `auth.users`.
Criado automaticamente pelo trigger `handle_new_user` ao registrar.

| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID PK | = auth.users.id |
| email | TEXT | Email do usuario |
| nome | TEXT | Nome completo |
| telefone | TEXT | Telefone (opcional) |
| empresa | TEXT | Empresa (opcional) |
| cpf_cnpj | TEXT | CPF ou CNPJ (opcional) |
| is_admin | BOOLEAN | Flag de administrador |
| created_at | TIMESTAMPTZ | Data de criacao |
| updated_at | TIMESTAMPTZ | Atualizado automaticamente |

**RLS:** Usuario ve/edita apenas seu proprio perfil (`auth.uid() = id`).

---

### transacoes_creditos (N3)
Registro de todas as movimentacoes de creditos.
Saldo = SUM(compras + reembolsos + ajustes) - SUM(usos).

| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID PK | |
| usuario_id | UUID FK | → auth.users |
| tipo | TEXT | compra, uso, reembolso, ajuste |
| quantidade | NUMERIC(10,2) | Quantidade de creditos |
| valor_pago | NUMERIC(10,2) | Valor em R$ (para compras) |
| descricao | TEXT | Descricao da transacao |
| consulta_id | UUID FK | → consultas (para uso/reembolso) |
| pagamento_id | UUID FK | → pagamentos (para compra) |
| created_at | TIMESTAMPTZ | |

**RLS:** Usuario ve apenas suas transacoes. INSERT apenas via service_role.

**View:** `saldo_creditos` — calcula saldo por usuario (SEM SECURITY DEFINER).

---

### pagamentos (N3)
Historico de pagamentos via Mercado Pago.

| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID PK | |
| usuario_id | UUID FK | → auth.users |
| preference_id | TEXT | ID da preferencia Mercado Pago |
| payment_id | TEXT | ID do pagamento confirmado |
| pacote | TEXT | Nome do pacote comprado |
| creditos | NUMERIC(10,2) | Quantidade de creditos |
| valor | NUMERIC(10,2) | Valor em R$ |
| status | TEXT | pendente, aprovado, rejeitado, cancelado |
| metodo_pagamento | TEXT | PIX, cartao, boleto |
| dados_pagamento | JSONB | Dados brutos do Mercado Pago |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS:** Usuario ve apenas seus pagamentos. INSERT/UPDATE via service_role (webhook).

---

### consultas (N3)
Analises realizadas pelo usuario.

| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID PK | |
| usuario_id | UUID FK | → auth.users |
| ferramenta_id | TEXT | ID da ferramenta (01_COMPENSACOES.md) |
| nome_imovel | TEXT | Nome do imovel analisado |
| municipio | TEXT | Municipio |
| estado | TEXT | Default: MG |
| area_hectares | NUMERIC(12,4) | Area em hectares |
| status | TEXT | pendente, processando, concluida, erro, reembolsada |
| parecer_json | JSONB | Resultado completo da analise |
| parecer_pdf_path | TEXT | Caminho do PDF no Storage |
| creditos_usados | NUMERIC(10,2) | Creditos debitados |
| dados_entrada | JSONB | Dados de entrada do formulario |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS:** Usuario ve apenas suas consultas. INSERT/UPDATE via service_role.

**ferramenta_id** aceita: dest-uc-base, dest-uc-app, dest-uc-ma, dest-servidao,
calc-impl-uc, calc-snuc, req-mineraria, req-mata-atlantica, req-snuc.

---

### documentos (N3)
Arquivos enviados como parte de uma consulta.

| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID PK | |
| consulta_id | UUID FK | → consultas (CASCADE) |
| usuario_id | UUID FK | → auth.users (CASCADE) |
| tipo | TEXT | matricula, kml, ccir, itr, car, cnd, outro |
| arquivo_nome | TEXT | Nome original do arquivo |
| arquivo_path | TEXT | Caminho no Supabase Storage |
| arquivo_tamanho | BIGINT | Tamanho em bytes |
| dados_extraidos | JSONB | Dados extraidos via Claude API |
| created_at | TIMESTAMPTZ | |

**RLS:** Usuario ve apenas seus documentos. INSERT via service_role.

---

### configuracoes (Publica)
Chave-valor de configuracao do sistema.

| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID PK | |
| chave | TEXT UNIQUE | Nome da configuracao |
| valor | JSONB | Dados da configuracao |
| descricao | TEXT | Descricao da configuracao |
| updated_at | TIMESTAMPTZ | |

**RLS:** Leitura para autenticados. Escrita via service_role (admin).

**Chaves iniciais:**
- `precos` — credito avulso, pacotes, custo por ferramenta
- `ufemg` — valor da UFEMG vigente (2026: R$ 5,7899)
- `limites` — max upload, tipos permitidos, timeout

---

### leads (Publica)
Captura de contatos pre-cadastro.

| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID PK | |
| email | TEXT UNIQUE | |
| nome | TEXT | |
| telefone | TEXT | |
| empresa | TEXT | |
| aceita_marketing | BOOLEAN | Consentimento LGPD |
| origem | TEXT | Fonte do lead |
| dados_checklist | JSONB | Respostas do checklist |
| created_at | TIMESTAMPTZ | |

**RLS:** INSERT aberto (formulario publico). Leitura via service_role (admin).

---

### registro_uso (Publica)
Analytics de uso de ferramentas.

| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID PK | |
| ferramenta | TEXT | ID da ferramenta |
| evento | TEXT | acesso, resultado, pdf |
| usuario_id | UUID FK | Opcional (ferramentas gratuitas) |
| dados | JSONB | Metadados do evento |
| created_at | TIMESTAMPTZ | |

**RLS:** INSERT aberto. Leitura via service_role (admin).

---

## Diagrama de relacionamentos

```
auth.users
  └─ perfis (1:1, PK = FK)
  └─ transacoes_creditos (1:N)
  │    ├─ → consultas (FK opcional)
  │    └─ → pagamentos (FK opcional)
  └─ pagamentos (1:N)
  └─ consultas (1:N)
  │    └─ documentos (1:N)
  └─ registro_uso (1:N, opcional)

configuracoes (independente)
leads (independente)
```

## Regras de seguranca

1. **Toda tabela tem RLS habilitado** — nenhuma excecao
2. **Dados de usuario isolados por `auth.uid()`**
3. **Operacoes criticas (creditos, consultas) via service_role** — nunca pelo client
4. **View `saldo_creditos` sem SECURITY DEFINER**
5. **INSERT em leads/registro_uso aberto** — dados nao sensiveis
6. **Leitura de leads/registro_uso apenas admin** — via service_role

## Migrations

| Arquivo | Conteudo |
|---|---|
| `20260406120000_funcoes_auxiliares.sql` | handle_updated_at, handle_new_user, trigger auth |
| `20260406120100_create_perfis.sql` | Tabela perfis + RLS |
| `20260406120200_create_configuracoes.sql` | Tabela configuracoes + RLS |
| `20260406120300_create_transacoes_creditos.sql` | Tabela + view saldo_creditos + RLS |
| `20260406120400_create_pagamentos.sql` | Tabela pagamentos + FK em transacoes + RLS |
| `20260406120500_create_consultas_documentos.sql` | Tabelas consultas e documentos + FK + RLS |
| `20260406120600_create_leads_registro_uso.sql` | Tabelas publicas + RLS |
| `20260406120700_seed_configuracoes.sql` | Dados iniciais (precos, UFEMG, limites) |
| `20260406130000_create_normas_documentos_protocolo.sql` | Normas, normas_compensacoes (N:N), documentos_protocolo + RLS |

---

### normas (Publica leitura / Admin escrita)
Legislacao aplicavel as compensacoes. Editavel pelo admin.

| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID PK | |
| tipo | TEXT | Lei Federal, Decreto Estadual, Portaria, etc. |
| numero | TEXT | Numero da norma |
| ano | INTEGER | Ano de publicacao |
| ementa | TEXT | Descricao da norma |
| link_url | TEXT | Link (preferencialmente ALMG) |
| status | TEXT | vigente, revogada |
| ordem | INTEGER | Sequencia de exibicao |
| created_at, updated_at | TIMESTAMPTZ | |

**RLS:** Leitura para autenticados. Escrita via service_role (admin).

### normas_compensacoes (Publica leitura / Admin escrita)
Relacao N:N entre normas e compensacoes. Uma norma pode se aplicar a varias compensacoes.

| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID PK | |
| norma_id | UUID FK | → normas (CASCADE) |
| compensacao | TEXT | mineraria, mata-atlantica, app, snuc, reserva-legal, ameacadas, imunes, reposicao-florestal |

### documentos_protocolo (Publica leitura / Admin escrita)
Documentos exigidos para protocolo por compensacao/modalidade. Editavel pelo admin.
Se esta na lista, e obrigatorio. Sem campo opcional.

| Coluna | Tipo | Descricao |
|---|---|---|
| id | UUID PK | |
| compensacao | TEXT | Identificador da compensacao |
| modalidade | TEXT | Nullable — se null, vale para todas as modalidades |
| nome | TEXT | Nome do documento exigido |
| observacao | TEXT | Detalhes adicionais |
| ordem | INTEGER | Sequencia de exibicao |
| created_at, updated_at | TIMESTAMPTZ | |

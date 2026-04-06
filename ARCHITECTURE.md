# ARCHITECTURE.md — Arquitetura ACAM2

## Visao geral

```
Browser → Next.js (Railway) → Supabase (Auth + DB + Storage)
                             → Claude API (analise documental)
                             → IDE-Sisema WFS (geoespacial)
                             → Mercado Pago (pagamentos)
                             → Resend (email)
```

## Modelo de dados

### Multi-tenancy: N1 (isolamento por usuario)

Cada usuario ve apenas seus proprios dados. RLS usa `auth.uid()` do Supabase Auth.

### Tabelas core

```
auth.users (Supabase Auth)
  └─ perfis (1:1) — dados adicionais do usuario

perfis
  ├─ transacoes_creditos (1:N) — compras, usos, reembolsos
  ├─ pagamentos (1:N) — historico Mercado Pago
  └─ consultas (1:N) — analises realizadas
       └─ documentos (1:N) — arquivos enviados

configuracoes — chave/valor (precos, UFEMG, limites)
leads — captura de contatos (independente de auth)
registro_uso — analytics de ferramentas
```

### Template SQL para tabelas com RLS

```sql
-- Criar tabela
CREATE TABLE nome_tabela (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- demais colunas
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;

-- Politica: usuario ve apenas seus dados
CREATE POLICY "Usuarios veem apenas seus dados"
  ON nome_tabela FOR ALL
  USING (auth.uid() = usuario_id);

-- Indice no usuario_id
CREATE INDEX idx_nome_tabela_usuario ON nome_tabela(usuario_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER set_atualizado_em
  BEFORE UPDATE ON nome_tabela
  FOR EACH ROW EXECUTE FUNCTION moddatetime(atualizado_em);
```

### Tabelas sem RLS (dados publicos)

```sql
-- configuracoes: leitura publica, escrita apenas admin
-- leads: escrita publica (formulario), leitura apenas admin
-- registro_uso: escrita publica, leitura apenas admin
```

## Estrutura de pastas

```
src/
  app/
    (auth)/              # Login, registro (sem sidebar)
    (dashboard)/         # Rotas protegidas (com header)
    (public)/            # Paginas publicas (compensacoes, calculadora)
    styleguide/          # Design system vivo
    api/                 # API routes
  components/
    ui/                  # shadcn/ui
    layout/              # Header, Sidebar, Footer
    forms/               # Formularios reutilizaveis
  lib/
    supabase/            # Clients (browser + server)
    calculo/             # Logica de negocio (com testes)
    services/            # APIs externas (Claude, IDE-Sisema, MP)
  types/                 # Interfaces TypeScript
  middleware.ts          # Protecao de rotas + refresh sessao
```

## Engine de Destinacao em UC

As 3 ferramentas de destinacao compartilham um motor:

```
Engine Core (dest-uc-base, 5cr):
  Analise Documental → Geoespacial → MVAR → Pontuacao → PDF

+ Camada APP (dest-uc-app, 6cr):
  + bacia + sub-bacia

+ Camada MA (dest-uc-ma, 7cr):
  + bacia + sub-bacia + bioma Mata Atlantica
```

Implementacao: um servico `src/lib/services/destinacao-uc.ts` com parametro
`contexto: 'base' | 'app' | 'mata-atlantica'` que ativa validacoes extras.

## Fluxo de creditos (atomico)

```
1. Verificar saldo >= custo
2. INSERT transacao tipo='uso' (debitar)
3. Processar analise
4. Se ERRO:
   a. INSERT transacao tipo='reembolso'
   b. UPDATE consulta status='reembolsada'
   c. Notificar usuario
5. Se OK:
   a. UPDATE consulta status='concluida'
   b. Gerar parecer PDF
```

## Anti-patterns proibidos

- ❌ SECURITY DEFINER em views (bypass de RLS)
- ❌ Alterar banco sem migration versionada
- ❌ Debitar creditos sem garantia de reembolso
- ❌ Secrets hardcoded (usar .env.local)
- ❌ Funcoes SQLite em PostgreSQL
- ❌ Tabelas sem RLS que contenham dados de usuario
- ❌ `SELECT *` em queries — listar colunas explicitamente

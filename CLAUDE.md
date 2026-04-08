@AGENTS.md

# CLAUDE.md — Instrucoes para desenvolvimento ACAM2

## O que e este projeto

ACAM (Analise de Compensacoes Ambientais) e uma plataforma web para profissionais
que lidam com compensacoes ambientais em Minas Gerais. O sistema tem 8 compensacoes
cobertas, 9 ferramentas pagas e 2 gratuitas.

Documentacao completa em `docs/claude-context/`.

## Stack

- **Framework:** Next.js 15 (App Router) + TypeScript strict
- **UI:** shadcn/ui + Tailwind CSS v4
- **Banco:** PostgreSQL via Supabase (RLS obrigatorio)
- **Auth:** Supabase Auth (auth.uid() para RLS)
- **Storage:** Supabase Storage
- **Pagamento:** Mercado Pago
- **Email:** Resend
- **Deploy:** Railway
- **IA:** Claude API (analise documental)
- **Geoespacial:** IDE-Sisema WFS + Turf.js + Leaflet

## Convencoes de codigo

### Nomenclatura
- Arquivos e pastas: kebab-case (`analise-documental.ts`)
- Componentes React: PascalCase (`CardConsulta.tsx`)
- Funcoes e variaveis: camelCase
- Tabelas e colunas do banco: snake_case
- Tipos TypeScript: PascalCase

### Componentes
- Server Components por padrao. Usar `"use client"` apenas quando necessario
- Componentes UI ficam em `src/components/ui/` (shadcn)
- Componentes de layout em `src/components/layout/`
- Componentes de formulario em `src/components/forms/`

### Rotas
- `(auth)` — Login, registro, recuperacao (sem layout de dashboard)
- `(dashboard)` — Rotas protegidas (layout com header e navegacao)
- `(public)` — Paginas publicas (compensacoes, calculadora)
- `api/` — API routes

### Supabase
- Client-side: `src/lib/supabase/client.ts`
- Server-side: `src/lib/supabase/server.ts`
- Middleware: `src/middleware.ts` (refresh de sessao + protecao de rotas)

### Logica de negocio
- Calculos e regras ficam em `src/lib/calculo/`
- Cada modulo de calculo deve ter testes
- Servicos de API (Claude, IDE-Sisema) ficam em `src/lib/services/`

## Regras obrigatorias

1. **RLS em toda tabela com dados de usuario** — sem excecao
2. **Creditos atomicos** — debitar antes, reembolsar se falhar, registrar transacao
3. **Migrations versionadas** — nunca alterar banco manualmente
4. **Sem SECURITY DEFINER em views** — causa bypass de RLS
5. **Sem secrets no codigo** — tudo em variaveis de ambiente
6. **Nomenclatura de ferramentas** — usar IDs de `01_COMPENSACOES.md`
7. **Acentuacao obrigatoria em portugues** — todo texto visivel ao usuario (titulos, botoes, labels, placeholders, mensagens, descricoes) deve ter acentuacao correta. Documentos internos (docs/, comentarios) podem ficar sem acento.
8. **Ferramenta paga = debito obrigatorio** — toda ferramenta paga deve: (a) chamar POST /api/creditos/debitar ANTES de entregar resultado, (b) router.refresh() apos debito para atualizar saldo no header, (c) botao "Baixar Novamente" nao debita de novo
9. **PDFs oficiais vs relatorios internos** — requerimentos e formularios oficiais do Estado usam jsPDF com layout posicional exato (modelo ACAM1). Relatorios internos do ACAM (calculadora, parecer) usam React-PDF com template ACAM2 (Capa, Pagina, Secao)
10. **Layout publico auth-aware** — rotas (public) verificam sessao: logado mostra header com creditos, deslogado mostra Entrar/Criar conta

## Design system

O design system sera criado via /vc-design e acessivel em `/styleguide`.
Ate la, usar componentes shadcn/ui com o tema padrao.

## Documentos de contexto

| Arquivo | Conteudo |
|---|---|
| `docs/claude-context/00_VISAO_GERAL.md` | O que e, para quem, modelo de negocio |
| `docs/claude-context/01_COMPENSACOES.md` | 8 compensacoes, modalidades, ferramentas |
| `docs/claude-context/02_REGRAS_NEGOCIO.md` | Entidades, regras criticas |
| `docs/claude-context/03_MODULOS.md` | Modulos tecnicos priorizados |
| `docs/claude-context/05_DECISOES.md` | Decisoes arquiteturais |
| `docs/claude-context/06_RISCOS.md` | Riscos mapeados |
| `docs/claude-context/PLANO_EXECUCAO.md` | Fases e entregas |

Ao iniciar uma sessao, leia `PLANO_EXECUCAO.md` para saber onde estamos.

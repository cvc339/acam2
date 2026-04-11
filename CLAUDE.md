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
8. **Ferramenta paga = debito obrigatorio** — toda ferramenta paga deve: (a) usar `debitarCreditos()` de `@/lib/creditos/client` (client-side) ou `creditos.debitar()` de `@/lib/creditos` (server-side) ANTES de entregar resultado, (b) router.refresh() apos debito para atualizar saldo no header, (c) botao "Baixar Novamente" nao debita de novo
9. **PDFs oficiais vs relatorios internos** — requerimentos e formularios oficiais do Estado usam jsPDF com layout posicional exato (modelo ACAM1). Relatorios internos do ACAM (calculadora, parecer) usam React-PDF com template ACAM2 (Capa, Pagina, Secao)
10. **Layout publico auth-aware** — rotas (public) verificam sessao: logado mostra header com creditos, deslogado mostra Entrar/Criar conta
11. **Resultados de analise = AlertResult** — todo resultado de analise (viabilidade, onus, criterios, impedimentos) usa `AlertResult` com `status` + `statusLabel` (fundo neutro, badge comunica). Proibido: cards coloridos (`acam-semaforo-*`), `acam-alert-success/error` como resultado, fundos coloridos. `acam-alert` so para erros de sistema (formulario, conexao). Mesma regra no PDF com `AlertResultPDF`.
12. **Checklist pre/pos UI** — antes de criar pagina: `grep "^\.acam-" globals.css` + `ls src/components/acam/`. Depois: `grep "style={{" pagina.tsx` — cada inline precisa de justificativa (valor dinamico ou layout fixo). Se nao for dinamico, criar classe CSS.

## Modulos centralizados — NAO DUPLICAR

Logica que ja foi extraida para modulos reutilizaveis. Ao criar novas ferramentas
ou modificar existentes, SEMPRE importar destes modulos. Nunca copiar a logica.

| Modulo | Import | O que faz |
|---|---|---|
| `src/lib/creditos/` | `import { creditos } from "@/lib/creditos"` | Debito atomico, reembolso, credito, saldo (server-side) |
| `src/lib/creditos/client.ts` | `import { debitarCreditos } from "@/lib/creditos/client"` | Debito de creditos no browser (client-side) |
| `src/lib/format.ts` | `import { formatBRL, formatNum } from "@/lib/format"` | Formatacao monetaria (R$) e decimal pt-BR |
| `src/lib/pdf/download.ts` | `import { downloadPDF } from "@/lib/pdf/download"` | Download de PDF no browser (blob → arquivo) |
| `src/lib/masks.ts` | `import { maskCPF, maskDate, ... } from "@/lib/masks"` | Mascaras de CPF, CNPJ, CEP, telefone, data |
| `src/lib/data/municipios-mg.ts` | `import { MUNICIPIOS_MG } from "@/lib/data/municipios-mg"` | 853 municipios de MG com acentuacao (IBGE) |

**Regra:** se voce precisa formatar moeda, debitar creditos, baixar PDF ou aplicar mascara,
o modulo ja existe. Nao crie funcoes locais como `function fmt()` ou `function fmtNum()`.

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

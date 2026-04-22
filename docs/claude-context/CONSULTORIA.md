# Ferramenta de Consultoria — Agendamento de Reunião Técnica

## Visão geral

Nova ferramenta paga do ACAM (15 créditos, 30 minutos) que permite ao usuário agendar uma reunião online com o especialista em compensações ambientais (o fundador). Posiciona-se como **serviço complementar**, nunca como conclusão/confirmação de análise técnica.

- **ID da ferramenta:** `consultoria`
- **Custo:** 15 créditos
- **Duração:** 30 minutos
- **Plataforma:** Google Meet (fase 1) / Teams (fase 2)
- **Timezone:** America/Sao_Paulo
- **Visibilidade de slots:** semana corrente + próxima
- **Reagendamento:** 1 único, com no mínimo 4h de antecedência
- **Anexo opcional:** PDF do relatório gerado pelo usuário (até 10MB)

## Decisões-chave (confirmadas)

| Item | Decisão | Por quê |
|---|---|---|
| Plataforma de reunião | Google Meet-only no MVP | Vem automático via Google Calendar API (zero trabalho extra); Teams exige segundo OAuth |
| No-show do cliente | Créditos consumidos | Horário foi reservado |
| No-show ou cancelamento do consultor | Reembolso automático + e-mail de desculpas | Falha do lado do fornecedor |
| Integração Google Calendar | No MVP (Etapa 2) | Confirmado pelo fundador |
| Copy do CTA | "Converse com especialista" — nunca "confirme/valide análise jurídica" | Consultoria é complementar, não conclusiva |
| CTA nas páginas de resultado | Componente único `CTAConsultoria` com prop de contexto | Uma única edição por página |

## Modelo de dados

### Tabela `slots_consultoria`
Horários que o consultor disponibiliza. Criados via admin.

| Coluna | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| data | DATE | Data do slot |
| hora_inicio | TIME | Ex.: 14:00 |
| hora_fim | TIME | Ex.: 14:30 |
| status | TEXT | `disponivel` \| `reservado` \| `bloqueado` |
| created_at | TIMESTAMPTZ | |

**Constraint:** `UNIQUE(data, hora_inicio)` — impede slots duplicados.

### Tabela `agendamentos_consultoria`
Reservas feitas pelos usuários.

| Coluna | Tipo | Notas |
|---|---|---|
| id | UUID PK | |
| usuario_id | UUID FK auth.users | |
| slot_id | UUID FK slots_consultoria | |
| email_reuniao | TEXT | E-mail para o convite |
| link_reuniao | TEXT | Meet link gerado via GCal |
| evento_gcal_id | TEXT | ID do evento no Google Calendar |
| anexo_url | TEXT | URL no Supabase Storage (opcional) |
| anexo_nome | TEXT | Nome original do arquivo |
| status | TEXT | `confirmado` \| `reagendado` \| `cancelado_usuario` \| `cancelado_admin` \| `concluido` |
| reagendamento_usado | BOOLEAN | Default FALSE; true após 1º reagendamento |
| transacao_credito_id | UUID FK transacoes_creditos | Rastreia o débito original (para reembolso) |
| lembrete_24h_enviado | BOOLEAN | |
| lembrete_1h_enviado | BOOLEAN | |
| observacoes_usuario | TEXT | Opcional: "o que gostaria de tratar" |
| criado_em | TIMESTAMPTZ | |
| atualizado_em | TIMESTAMPTZ | |

**Constraint crítico:** `UNIQUE(slot_id) WHERE status IN ('confirmado', 'reagendado')` — impede double-booking a nível de DB.

### Tabela `google_calendar_auth`
Armazena o refresh token do consultor (1 linha).

| Coluna | Tipo | Notas |
|---|---|---|
| id | INT PK | Sempre 1 (singleton) |
| refresh_token | TEXT | Criptografado se possível |
| access_token | TEXT | Cache curto |
| expiry | TIMESTAMPTZ | |
| atualizado_em | TIMESTAMPTZ | |

RLS: apenas `service_role` acessa. Nunca exposto a qualquer role de usuário.

## Plano em etapas

### Etapa 1 — Base de dados e módulo de consultoria
**Entregas:**
- Migration com as 3 tabelas, RLS, constraint de double-booking
- `src/lib/consultoria/` com:
  - `types.ts` — tipos TS
  - `service.ts` — `agendar()`, `reagendar()`, `cancelarPeloUsuario()`, `cancelarPeloAdmin()`, `concluir()`, `listarSlotsDisponiveis()`, `listarMeusAgendamentos()`, `podeReagendar()`
  - `index.ts` — export público
- Adição de `consultoria: 15` em `custos.ts` (fallback) e em `configuracoes.precos`

**Regras:**
- Toda operação que mexe com slot é transacional
- Débito de créditos sempre via `creditos.debitar()` (módulo central)
- Reembolso automático se qualquer etapa falhar após débito

### Etapa 2 — Integração Google Calendar
**Entregas:**
- `src/lib/services/google-calendar.ts`:
  - `criarEvento(agendamento)` — cria evento com Meet link e convida e-mail do cliente
  - `moverEvento(gcal_id, novoSlot)` — reagendamento
  - `deletarEvento(gcal_id)` — cancelamento
  - `refreshTokenSeNecessario()`
- Rota `GET /api/admin/google/auth` — inicia OAuth
- Rota `GET /api/admin/google/callback` — recebe code, troca por tokens, salva em `google_calendar_auth`
- Page `(dashboard)/admin/google/` — mostra status da conexão

**Nota operacional:** o fundador precisa criar projeto no Google Cloud Console, ativar Calendar API, gerar OAuth credentials (Client ID + Secret) e configurar redirect URI.

### Etapa 3 — Página pública da ferramenta
**Entregas:**
- `(dashboard)/ferramentas/consultoria/page.tsx` — calendário semana corrente + próxima, slots clicáveis, formulário (email + anexo opcional + observações), botão confirmar
- `(dashboard)/ferramentas/consultoria/[id]/page.tsx` — detalhe do agendamento, botões reagendar/cancelar
- API `POST /api/consultoria/agendar` — transação atômica: valida slot → debita créditos → cria evento GCal → salva agendamento → envia e-mail (rollback em qualquer falha)
- API `POST /api/consultoria/reagendar` — valida 4h + não usado, libera slot antigo, ocupa novo, move evento GCal
- API `POST /api/consultoria/cancelar` — cancelamento pelo próprio usuário (sem reembolso — ele escolheu desistir)
- API `POST /api/consultoria/upload-anexo` — salva PDF no Supabase Storage

**UI:** usa `acam-calendar`, `acam-card-hover`, `acam-btn-primary`, `AlertResult`, `UploadZone`. Zero componente novo além do contêiner.

### Etapa 4 — Admin
**Entregas:**
- `(dashboard)/admin/consultoria/page.tsx` — tabs: "Slots" | "Agendamentos"
- Criação de slots em lote ("toda segunda e quarta, 14h e 16h, próximas 8 semanas")
- Criação avulsa
- Lista de agendamentos filtrável por status/data
- Ações: "marcar como concluído" | "cancelar com reembolso" | "baixar anexo"
- APIs admin protegidas com verificação de role

### Etapa 5 — E-mails (Resend)
**Entregas — 5 templates HTML:**
1. Confirmação imediata (data/hora, link Meet, regra de reagendamento, anexo se tiver)
2. Lembrete 24h antes
3. Lembrete 1h antes (com link destacado)
4. Confirmação de reagendamento (aviso de direito esgotado)
5. Cancelamento pelo admin (aviso de reembolso automático)

**Padrão:** templates em `src/lib/email/templates/consultoria/`. Envio via `src/lib/email/resend.ts` (verificar se já existe esse wrapper).

### Etapa 6 — Cron de lembretes
**Entregas:**
- API `POST /api/consultoria/cron/lembretes` — busca agendamentos nas janelas [24h, 24h+15min] e [1h, 1h+15min] não enviados, dispara e-mails
- Configuração do Railway Cron: a cada 15 minutos
- Flags `lembrete_24h_enviado` e `lembrete_1h_enviado` atualizadas para idempotência

### Etapa 7 — CTA nas páginas de resultado
**Entregas:**
- `src/components/acam/cta-consultoria.tsx` — componente único, prop `contexto?: string` para gancho dinâmico
- Aplicado em todas as páginas de resultado (gratuitas e pagas):
  - `/calculadora-snuc` (gratuita)
  - `/destinacao-uc-base` (paga)
  - `/destinacao-uc-app` (paga)
  - `/destinacao-uc-ma` (paga)
  - `/calculo-modalidade2` (paga)
  - `/analise-matricula` (paga)
  - `/analise-servidao` (paga)
  - `/requerimento-*` (pagas)
- Copy base: "Converse com um especialista em compensações ambientais — 30 minutos, 15 créditos"
- **Proibido:** qualquer framing de "confirmação", "validação jurídica", "parecer conclusivo"

### Etapa 8 — Ajustes finais
- Ajuste do disclaimer das outras ferramentas citando consultoria como caminho
- Testes manuais dos fluxos críticos:
  - Agendar (golden path)
  - Reagendar dentro da janela
  - Tentar reagendar fora da janela de 4h
  - Tentar reagendar 2ª vez
  - Double-booking (2 usuários tentam o mesmo slot)
  - Cancelamento pelo admin → reembolso
  - No-show → ver como fica
  - Rollback se GCal falhar
- Documentação curta neste arquivo com FAQs operacionais

## Componentes de design reutilizados (zero componente novo)

| Peça | Componente |
|---|---|
| Calendário de slots | `acam-calendar` + `DatePicker` |
| Card de slot | `acam-card-hover` |
| Botão confirmar | `acam-btn-primary` |
| CTA nas páginas | `acam-card` + `IconBox` + `acam-btn-accent` |
| Formulário | `acam-form-*` |
| Upload do anexo | `UploadZone` |
| Feedback de resultado | `AlertResult` (status neutro + badge) |
| Status do agendamento | `StatusBadge` |
| Tabela admin | `ServicesTable` padrão |

## Segurança e integridade

- **RLS obrigatório** em `slots_consultoria` (SELECT público de `disponivel`) e `agendamentos_consultoria` (SELECT apenas próprio; INSERT apenas via service_role)
- **`google_calendar_auth`:** zero policy de usuário; acesso só por service_role
- **Débito de créditos transacional:** toda API de agendar deve debitar ANTES de criar evento no GCal. Se GCal falhar, reembolsar. Mesmo princípio das demais ferramentas.
- **Double-booking:** além do constraint do DB, verificar disponibilidade do slot no início da transação com lock (`FOR UPDATE`).
- **Anexo no Storage:** bucket privado `consultoria-anexos`. URL gerada com assinatura curta apenas para download pelo admin.

## Convenções do projeto aplicadas

- Kebab-case em arquivos, camelCase em funções, snake_case em banco
- Server Components por padrão; `"use client"` só onde precisa (formulário, calendário interativo)
- Reutilizar `creditos.debitar()` e `creditos.reembolsar()` — nunca inserir em `transacoes_creditos` direto
- Toda texto visível em português com acentuação correta
- Feedback de resultado via `AlertResult`, nunca cards coloridos

## Fora de escopo (não MVP)

- Teams como alternativa a Meet
- Rating pós-reunião
- Slots recorrentes automáticos (ex.: "sempre segunda e quarta")
- Pré-anexo automático do PDF quando usuário vem do CTA
- Integração com CRM / newsletter pós-reunião
- Videochamada no próprio ACAM (WebRTC)

---

## Operação

### Primeiro deploy (checklist único)

- [ ] Aplicar a migration `20260422120000_create_consultoria.sql` no ambiente de destino
- [ ] Garantir que `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `GOOGLE_REDIRECT_URI` estão nas env vars do Railway (com `GOOGLE_REDIRECT_URI=https://acam.com.br/api/admin/google/callback`)
- [ ] Garantir que `CRON_SECRET` existe no Railway (já existia antes da feature — verificar)
- [ ] Garantir que `CRON_SECRET` está como secret no GitHub Actions (já existia antes da feature)
- [ ] Após o deploy, acessar `https://acam.com.br/admin/google` e clicar em **"Conectar Google Calendar"** — autorizar com a conta que receberá os eventos
- [ ] Verificar em `https://acam.com.br/admin/consultoria` que a página carrega
- [ ] Criar alguns slots via lote (ex.: Seg/Qua, 14:00 e 16:00, 2 semanas)
- [ ] Confirmar que o workflow `.github/workflows/consultoria-lembretes.yml` aparece no GitHub Actions

### Rotinas do consultor

- **Toda segunda-feira:** acessar `/admin/consultoria`, revisar agenda da semana, criar slots em lote se faltar
- **Antes de cada reunião:** baixar anexos (se houver), ler observações do cliente
- **Após cada reunião:** marcar como "Concluído" no admin
- **Imprevistos do consultor:** cancelar pelo admin — sistema reembolsa 15 créditos automaticamente, envia e-mail ao cliente e remove evento do Google Calendar

### Roteiro de testes manuais

#### Golden path (agendar → reunião → concluir)
1. Logar como usuário com ≥15 créditos
2. Acessar `/ferramentas/consultoria`
3. Escolher slot, informar e-mail, opcionalmente anexar PDF
4. Confirmar — 15 créditos devem ser debitados
5. Conferir: (a) agendamento criado, (b) evento no Google Calendar do consultor, (c) convite recebido no e-mail informado, (d) e-mail de confirmação do ACAM
6. No horário, entrar na reunião via link Meet
7. Admin marca como "Concluído"

#### Reagendamento dentro da janela
1. Agendamento confirmado com slot > 4h no futuro
2. Em `/ferramentas/consultoria/[id]`, clicar "Reagendar"
3. Escolher novo slot, confirmar
4. Conferir: (a) slot antigo liberado, (b) slot novo reservado, (c) evento GCal movido, (d) e-mail de reagendamento

#### Reagendamento bloqueado
1. Agendamento < 4h do slot OU já reagendou 1 vez
2. Botão "Reagendar" não aparece, mensagem explica o motivo

#### Double-booking
1. Dois usuários acessam simultaneamente `/ferramentas/consultoria`
2. Ambos escolhem o mesmo slot
3. Um confirma antes — o segundo recebe erro "Slot indisponível"
4. Créditos do segundo **não** são debitados

#### Cancelamento pelo admin
1. Em `/admin/consultoria`, clicar "Cancelar e reembolsar"
2. Conferir: (a) 15 créditos voltaram ao cliente, (b) slot liberado, (c) evento GCal deletado, (d) e-mail de cancelamento com aviso de reembolso

#### Falha do Google Calendar
1. Revogar autorização Google em `/admin/google` e tentar agendar
2. Conferir rollback: (a) agendamento não criado, (b) slot liberado, (c) créditos reembolsados, (d) mensagem explicativa para o usuário

#### Lembretes (cron)
1. Criar agendamento com slot 25h no futuro
2. Esperar até faltarem 24h (ou adiantar manualmente `slot.data`/`slot.hora_inicio` no DB)
3. Disparar manualmente: `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://acam.com.br/api/cron/consultoria-lembretes`
4. Conferir: (a) e-mail de lembrete 24h recebido, (b) flag `lembrete_24h_enviado = true` no DB, (c) segunda chamada não envia de novo

### FAQ operacional

**O evento GCal foi criado mas o link Meet não apareceu. O que faço?**  
Isso indica que o evento foi criado sem `conferenceDataVersion=1`. Verifique logs `[google-calendar.criarEventoReuniao]`. O agendamento em si funciona — o admin pode editar o evento no GCal e adicionar Meet manualmente, depois enviar o link ao cliente via Fale Conosco.

**O cliente diz que não recebeu o e-mail de confirmação.**  
Verifique: (1) logs `[email] Enviado: ...` no servidor, (2) se o e-mail está correto em `/admin/consultoria`, (3) caixa de spam do cliente. Se o Resend retornou erro, confira `RESEND_API_KEY` e se o domínio `acam.com.br` está verificado no Resend.

**Refresh do Google Calendar parou de funcionar.**  
O `refresh_token` pode ter expirado (6 meses sem uso) ou o admin revogou o app manualmente. Solução: acessar `/admin/google` e clicar "Reconectar".

**Cliente quer reagendar depois do prazo de 4h.**  
Por política, o sistema não permite. Soluções: (1) cliente cancela sem reembolso e agenda novo (perde 15 créditos), (2) admin cancela pelo `/admin/consultoria` com reembolso, cliente agenda novo (recomendado se o motivo é legítimo).

### Limitações conhecidas

- **Build com heap default OOM:** `npx next build` pode falhar com out-of-memory no Node default. Solução: `NODE_OPTIONS="--max-old-space-size=6144" npx next build`. Railway normalmente já aloca memória suficiente.
- **Teams não suportado:** apenas Google Meet no MVP (fase 2 prevista).
- **Slots só nas próximas 14 dias:** `listarSlotsDisponiveis` filtra a janela semana corrente + próxima. Admin pode criar até 12 semanas à frente, mas o público só vê os próximos 14 dias.
- **Timezone fixo:** `America/Sao_Paulo`. Se houver clientes em outros fusos, eles verão o horário BRT no e-mail/convite, mas o Google Calendar mostra no fuso local do destinatário automaticamente.

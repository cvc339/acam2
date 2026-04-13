# ACAM — Descritivo Técnico e de Segurança

**Versão:** 2.0  
**Data:** Abril de 2026  
**Classificação:** Interno / Institucional

---

## 1. Visão Geral da Plataforma

O ACAM (Análise de Compensações Ambientais) é uma plataforma web especializada em compensações ambientais no estado de Minas Gerais. A plataforma processa documentos, dados geoespaciais e legislação para auxiliar profissionais na tomada de decisão sobre obrigações de compensação ambiental.

### 1.1. Escopo Funcional

- 8 compensações ambientais cobertas (Minerária, Mata Atlântica, APP, SNUC, Reserva Legal, Espécies Ameaçadas, Espécies Imunes, Reposição Florestal)
- 9 ferramentas pagas de análise, cálculo e preenchimento de requerimentos
- 3 ferramentas gratuitas (Checklist de Compensações, Calculadora de Intervenção Ambiental, Cálculo de Reposição Florestal)
- Painel administrativo com indicadores de gestão
- Sistema de créditos com pagamento online
- Comunicação por email transacional

### 1.2. Público-alvo

Consultores ambientais, empresas de mineração, escritórios de advocacia ambiental e profissionais técnicos que lidam com processos de compensação ambiental em Minas Gerais.

---

## 2. Arquitetura Técnica

### 2.1. Stack Tecnológico

| Camada | Tecnologia | Função |
|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript | Aplicação web com renderização no servidor |
| UI | Tailwind CSS + Design System próprio (ACAM) | Interface responsiva e consistente |
| Banco de dados | PostgreSQL via Supabase | Armazenamento relacional com segurança nativa |
| Autenticação | Supabase Auth | Cadastro, login, verificação de email, recuperação de senha |
| Armazenamento de arquivos | Supabase Storage | Upload de documentos e PDFs gerados |
| Pagamento | Mercado Pago | Compra de créditos (checkout, webhook de confirmação) |
| Email | Resend | Emails transacionais (boas-vindas, confirmação de compra, notificações) |
| IA / NLP | Claude API (Anthropic) | Extração inteligente de dados de documentos (matrículas, certidões) |
| Geoespacial | IDE-Sisema WFS (SEMAD-MG) + Turf.js | Consulta de camadas ambientais oficiais do estado |
| Satélite | Sentinel-2 (Copernicus) | Análise de vegetação por índice NDVI |
| Mapas | Leaflet + OpenStreetMap | Visualização de polígonos e camadas geoespaciais |
| Geração de PDFs | React-PDF | Relatórios técnicos com identidade visual |
| Hospedagem | Railway | Deploy contínuo com integração GitHub |

### 2.2. Arquitetura de Dados

O banco de dados utiliza PostgreSQL gerenciado pelo Supabase, com 12 tabelas organizadas por nível de sensibilidade:

**Dados pessoais (isolamento por usuário):**
- Perfis de usuários
- Transações de créditos
- Pagamentos
- Consultas e documentos
- Mensagens de contato

**Dados de referência (leitura pública):**
- Configurações do sistema (UFEMG, preços)
- Normas e legislação
- Documentos de protocolo

**Dados de captação:**
- Leads (captura pública)
- Registro de uso (analytics)

### 2.3. Integrações Externas

| Serviço | Protocolo | Dados trafegados | Autenticação |
|---|---|---|---|
| IDE-Sisema | WFS 2.0.0 (HTTP/JSON) | Camadas geoespaciais públicas (UCs, bacias, biomas) | Sem auth (dados públicos) |
| Claude API | REST/HTTPS | Texto extraído de documentos (sem dados pessoais) | API Key |
| Mercado Pago | REST/HTTPS + Webhook | Dados de pagamento (valor, status) | OAuth + HMAC-SHA256 |
| Resend | REST/HTTPS | Endereço de email + conteúdo HTML | API Key |
| Copernicus (Sentinel-2) | OAuth2 + WCS | Imagens de satélite (NDVI) | OAuth Client Credentials |

---

## 3. Segurança

### 3.1. Modelo de Segurança

A plataforma implementa segurança em múltiplas camadas:

```
Camada 1 — Rede
  └─ HTTPS obrigatório (TLS via Railway)
  └─ Headers de segurança via Next.js

Camada 2 — Autenticação
  └─ Supabase Auth (JWT com expiração)
  └─ Verificação de email obrigatória
  └─ Recuperação de senha segura

Camada 3 — Autorização
  └─ Row Level Security (RLS) em todas as 12 tabelas
  └─ Middleware de proteção de rotas (dashboard + admin)
  └─ Verificação de perfil admin em 3 camadas (middleware + layout + API)

Camada 4 — Integridade Financeira
  └─ Débito atômico via função PostgreSQL (sem race condition)
  └─ Reembolso automático em caso de falha
  └─ Registro completo de transações (auditoria)

Camada 5 — Isolamento de Dados
  └─ Cada usuário acessa apenas seus próprios dados
  └─ Operações de escrita restritas ao backend (service_role)
  └─ Administração via cliente privilegiado com verificação de perfil
```

### 3.2. Row Level Security (RLS)

Todas as 12 tabelas do sistema possuem RLS habilitado. Políticas implementadas:

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| Perfis | Próprio | Trigger (auto) | Próprio | — |
| Transações de créditos | Próprio | Backend | — | — |
| Pagamentos | Próprio | Backend | Backend | — |
| Consultas | Próprio | Backend | Backend | — |
| Documentos | Próprio | Backend | — | — |
| Mensagens de contato | Próprio | Autenticado | Backend | — |
| Configurações | Autenticado | Backend | Backend | — |
| Leads | Backend | Público | — | — |
| Registro de uso | Backend | Público | — | — |
| Normas | Autenticado | Backend | Backend | — |

**"Próprio"** = apenas o dono do registro (`auth.uid() = usuario_id`)  
**"Backend"** = apenas via `service_role` (servidor, nunca cliente)  
**"Autenticado"** = qualquer usuário logado  
**"Público"** = sem restrição de autenticação

### 3.3. Proteção do Painel Administrativo

O acesso administrativo é protegido por 3 camadas independentes:

1. **Middleware (Next.js):** Intercepta requisições para `/admin/*`, verifica flag `is_admin` no perfil. Redireciona para dashboard se não autorizado.
2. **Layout (Server Component):** Verificação server-side redundante antes de renderizar qualquer página administrativa.
3. **API Helper:** Toda rota `POST/PUT/DELETE` administrativa verifica `is_admin` independentemente das camadas anteriores. Retorna HTTP 403 se não autorizado.

### 3.4. Segurança Financeira

- **Débito atômico:** Função PostgreSQL com `FOR UPDATE` locking — impede débito duplo em requisições concorrentes
- **Reembolso automático:** Se a análise falha após débito, os créditos são devolvidos automaticamente
- **Idempotência:** Webhook do Mercado Pago verifica `payment_id` para evitar crédito duplo
- **Validação de assinatura:** Webhook valida HMAC-SHA256 quando a chave está configurada
- **Auditoria:** Todas as transações (compra, uso, reembolso, ajuste) são registradas com timestamp e descrição

### 3.5. Proteção de Dados Pessoais

- Dados pessoais armazenados apenas no Supabase (infraestrutura em conformidade com padrões internacionais)
- Senhas gerenciadas pelo Supabase Auth (bcrypt, nunca armazenadas em texto)
- Nenhum dado pessoal é enviado para a Claude API (apenas texto de documentos para extração)
- Variáveis sensíveis (API keys, tokens) armazenadas em variáveis de ambiente, nunca no código
- `.env` e `.env.local` excluídos do versionamento (`.gitignore`)
- Consentimento de comunicação registrado no cadastro (LGPD)

### 3.6. Verificações de Segurança Realizadas

| Verificação | Data | Resultado |
|---|---|---|
| RLS em todas as tabelas | 2026-04-13 | 12/12 tabelas protegidas |
| Auth em todas as API routes | 2026-04-13 | 22/22 rotas verificadas |
| Secrets no código | 2026-04-13 | 0 exposições |
| Views (SECURITY INVOKER) | 2026-04-13 | 1/1 view correta |
| Funções (grants restritos) | 2026-04-13 | Função financeira com grants restritos |

---

## 4. Disponibilidade e Infraestrutura

| Aspecto | Especificação |
|---|---|
| Hospedagem | Railway (cloud, região América do Sul) |
| Banco de dados | Supabase (PostgreSQL gerenciado, backups automáticos) |
| Deploy | Contínuo via GitHub (push → build → deploy) |
| Domínio | acam.com.br (DNS via Registro.br) |
| SSL/TLS | Certificado automático via Railway |
| Email | Resend (domínio acam.com.br verificado, região São Paulo) |

---

## 5. Contato Técnico

**Desenvolvedor:** Vieira Castro Sociedade Individual de Advocacia  
**Plataforma:** acam.com.br  
**Email técnico:** atendimento@vieiracastro.com.br

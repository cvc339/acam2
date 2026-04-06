# ACAM 2 — Riscos Identificados

## Riscos do ACAM 1 que se materializaram

| Risco | O que aconteceu | Impacto | Prevencao no ACAM 2 |
|---|---|---|---|
| Tabela inexistente | Referencia a tabela que nao existia no banco | 502 em producao | Migrations versionadas + testes de schema |
| Creditos sem reembolso | Creditos debitados e operacao falhou sem devolver | Perda financeira do usuario | Transacao atomica: debitar → processar → reembolsar se erro |
| Colunas inconsistentes | Nomes diferentes para o mesmo conceito | Queries falhando silenciosamente | Convencao de nomes documentada + review |
| SQLite em PostgreSQL | Funcoes de compatibilidade escondiam incompatibilidades | Erros sutis em producao | PostgreSQL nativo, sem camada de compatibilidade |
| Calculadora de intervencoes | Atualizacao de itens causou efeitos colaterais | Ferramenta quebrada | Componentizacao + testes |

## Riscos do SGI-IDAL (projeto irmao)

| Risco | O que aconteceu | Prevencao no ACAM 2 |
|---|---|---|
| 9 tabelas sem RLS | Dados potencialmente expostos entre organizacoes | RLS obrigatorio, /vc-security apos cada migration |
| View com SECURITY DEFINER | Bypass de RLS | Nunca usar SECURITY DEFINER em views |

---

## Riscos identificados para o ACAM 2

### Criticos

| # | Risco | Probabilidade | Impacto | Mitigacao |
|---|---|---|---|---|
| 1 | Vazamento de dados entre usuarios | Alta (se nao testar RLS) | Critico | RLS em todas as tabelas + /vc-security apos cada migration |
| 2 | Creditos perdidos em falha | Alta (sem transacao atomica) | Critico | Debito + reembolso atomico, log de todas as transacoes |
| 3 | IDE-Sisema indisponivel | Media (servico governo) | Alto | Timeout 30s + retry 3x + informar usuario + reembolso |
| 4 | Claude API indisponivel | Baixa | Alto | Retry 3x + fila de reprocessamento + reembolso |
| 5 | Schema inconsistente | Alta (sem migrations) | Critico | Migrations numeradas, nunca alterar banco manualmente |

### Altos

| # | Risco | Probabilidade | Impacto | Mitigacao |
|---|---|---|---|---|
| 6 | Webhook MP nao confirmado | Media | Alto | Verificacao periodica de pagamentos pendentes |
| 7 | Upload de arquivo malicioso | Media | Alto | Validacao de tipo (magic bytes, nao so extensao) + antivirus |
| 8 | JWT comprometido | Baixa (se bem configurado) | Critico | Supabase Auth (sem JWT custom) + HTTPS obrigatorio |
| 9 | Timeout no processamento | Media (15-20s por consulta) | Medio | Processamento assincrono com status polling |
| 10 | Dados regulatorios desatualizados | Media | Alto | Documentar versao de cada norma, verificar anualmente |

### Medios

| # | Risco | Probabilidade | Impacto | Mitigacao |
|---|---|---|---|---|
| 11 | Arquivos temporarios acumulando | Alta | Medio | Supabase Storage com politica de expiracao |
| 12 | Rate limiting ausente | Alta | Medio | Rate limit no middleware (por IP e por usuario) |
| 13 | Abuso de ferramentas gratuitas | Media | Baixo | Rate limit + CAPTCHA se necessario |
| 14 | Perda de dados do ACAM 1 | Baixa | Medio | Script de migracao de dados (se aplicavel) |

---

## Checklist de prevencao

Antes de cada deploy:
- [ ] Todas as tabelas novas tem RLS? (/vc-security)
- [ ] Creditos tem garantia de reembolso em todos os fluxos de erro?
- [ ] Migrations estao versionadas e testadas?
- [ ] Nenhuma view usa SECURITY DEFINER?
- [ ] Rate limiting esta configurado?
- [ ] Uploads validam tipo real do arquivo?
- [ ] Webhooks tem verificacao de assinatura?
- [ ] Secrets estao em variaveis de ambiente (nunca hardcoded)?

# ACAM 2 — Visao Geral

## O que e

Plataforma web especializada em compensacoes ambientais no estado de Minas Gerais.
Auxilia empreendedores, consultores e profissionais do setor a tomar decisoes informadas
sobre obrigacoes de compensacao ambiental, com foco em atividades de mineracao.

## Problema que resolve

Compensacoes ambientais envolvem regras complexas, multiplas normas legais, cruzamento
de dados documentais e geoespaciais, e analise de viabilidade de imoveis rurais.
Hoje, esse trabalho e feito manualmente, consultando diversos sistemas e documentos
regulatorios. Erros custam tempo, dinheiro e podem gerar problemas legais.

O ACAM antecipa problemas com baixo custo, antes da tomada de decisao.
Nao substitui trabalhos de campo ou responsabilidade tecnica, mas permite
que o profissional chegue ao campo com muito mais informacao.

## Para quem

- Profissionais que lidam com compensacoes ambientais no dia a dia
- Consultores ambientais
- Empresas de mineracao
- Escritorios de advocacia ambiental

Nivel tecnico: medio a alto. Conhecem o dominio, mas precisam de agilidade.

## Modelo de negocio

Duas camadas:

1. **Gratuita** — Informacoes sobre compensacoes, checklist de identificacao,
   calculadoras e ferramentas de consulta publica
2. **Paga** — Ferramentas avancadas de analise, consumidas via creditos
   comprados pelo Mercado Pago

### Ferramentas pagas (creditos)
| Ferramenta | Creditos | Descricao |
|---|---|---|
| Analise de Imovel (Mineraria) | 5 | Upload de documentos + analise completa |
| Calculo + Fluxo | 2 | Calculo UFEMG e fluxo processual |
| Calculadora SNUC | 7 | Analise de sobreposicao com UCs |
| Mata Atlantica | 7 | Analise de destinacao no bioma |

### Pacotes de creditos
| Pacote | Creditos | Desconto |
|---|---|---|
| Avulso | 1 | — |
| Basico | 10 | 17% |
| Intermediario | 25 | 25% |
| Premium | 50 | 33% |

## Compensacoes cobertas

O sistema aborda 7 modalidades de compensacao ambiental:

1. **Mineraria MG** — Lei 20.922/2013. Doacao de area em UC de dominio publico
2. **Mata Atlantica** — Decreto 47.749/2019, Art. 49, II. Destinacao em bioma MA
3. **APP** — Decreto 47.749/2019, Art. 75, IV. Areas de preservacao permanente
4. **SNUC** — Lei 9.985/2000. Sistema Nacional de Unidades de Conservacao
5. **Reserva Legal** — Compensacao de reserva legal
6. **Reposicao Florestal** — Replantio compensatorio
7. **Especies Ameacadas** — Protecao de especies em risco

## Integracoes externas

| Servico | Finalidade |
|---|---|
| IDE-Sisema (WFS Geoserver MG) | Camadas geoespaciais: UCs, biomas, bacias, MapBiomas |
| Claude API (Anthropic) | Extracao inteligente de dados de documentos (matricula, CCIR, ITR) |
| Mercado Pago | Processamento de pagamentos |
| Resend | Envio de emails transacionais |
| OpenStreetMap / Leaflet | Mapas interativos |
| Sentinel-2 | Analise NDVI (vegetacao por satelite) |

## Por que reescrever (ACAM 1 → ACAM 2)

O ACAM 1 funciona. As funcionalidades estao corretas. Mas a arquitetura foi construida
sem planejamento e acumulou problemas estruturais que tornam a operacao com multiplos
usuarios arriscada:

- Migracoes de banco nao versionadas (tabelas faltando → 502 em producao)
- Sem RLS — dados de usuarios nao isolados
- Nomes de colunas inconsistentes entre tabelas
- Funcoes SQLite em banco PostgreSQL
- Creditos debitados sem reembolso em caso de erro
- JWT secret hardcoded
- Sem rate limiting
- Frontend em vanilla JS (dificil manter e escalar)
- Arquivos temporarios sem limpeza confiavel
- Sem logging profissional

O ACAM 2 mantem todas as funcionalidades, mas com:
- Banco de dados modelado com migrations versionadas e RLS
- Arquitetura frontend moderna (componentizada)
- Tratamento de erros robusto (creditos seguros)
- Seguranca adequada para multi-usuario
- Design system consistente
- Codigo organizado e testavel

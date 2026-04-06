-- ============================================================
-- ACAM2 — Verificação de Segurança (/vc-security)
-- Executar no SQL Editor do Supabase
-- Data: 2026-04-06
-- ============================================================

-- 1. TABELAS SEM RLS (deve retornar ZERO linhas com dados de usuário)
SELECT '1. TABELAS SEM RLS' as verificacao,
       tablename as resultado
FROM pg_tables
WHERE schemaname = 'public'
  AND NOT rowsecurity
ORDER BY tablename;

-- 2. POLICIES INSERT SEM WITH CHECK (deve retornar ZERO linhas)
SELECT '2. INSERT SEM WITH CHECK' as verificacao,
       tablename as tabela,
       policyname as policy
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'INSERT'
  AND with_check IS NULL;

-- 3. VIEWS — verificar se alguma usa SECURITY DEFINER
SELECT '3. VIEWS' as verificacao,
       viewname as view_name,
       LEFT(definition, 200) as definicao_resumida
FROM pg_views
WHERE schemaname = 'public';

-- 4. LISTAR TODAS AS POLICIES (para revisão manual)
SELECT '4. POLICIES' as verificacao,
       tablename as tabela,
       policyname as policy,
       cmd as comando,
       LEFT(qual::text, 100) as using_clause,
       LEFT(with_check::text, 100) as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- 5. TABELAS COM RLS — confirmar que todas as esperadas têm
SELECT '5. STATUS RLS' as verificacao,
       tablename as tabela,
       CASE WHEN rowsecurity THEN 'RLS ATIVO' ELSE 'SEM RLS' END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. ÍNDICES EM FKs (verificar cobertura)
SELECT '6. INDICES' as verificacao,
       indexname as indice,
       tablename as tabela
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 7. DADOS DE CONFIGURAÇÃO (verificar seed)
SELECT '7. CONFIGURACOES' as verificacao,
       chave,
       LEFT(valor::text, 80) as valor_resumido
FROM public.configuracoes;

-- 8. FUNÇÕES SECURITY DEFINER (verificar se são apenas as necessárias)
SELECT '8. FUNCOES SECURITY DEFINER' as verificacao,
       proname as funcao,
       prosecdef as is_security_definer
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND prosecdef = true;

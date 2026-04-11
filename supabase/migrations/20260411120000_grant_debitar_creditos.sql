-- Tipo: Seguranca
-- Descricao: Concede permissao de execucao da funcao debitar_creditos ao service_role.
-- A migration 20260410120000 revogou permissoes de PUBLIC, anon e authenticated
-- mas nao concedeu explicitamente ao service_role, que precisa dessa permissao
-- para ser chamado via admin client (createAdminClient) nas API routes.

BEGIN;

-- Garantir que service_role pode executar a funcao de debito
GRANT EXECUTE ON FUNCTION public.debitar_creditos TO service_role;

COMMIT;

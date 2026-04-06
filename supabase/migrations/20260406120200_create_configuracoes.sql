-- Tipo: Publica (leitura) / Admin (escrita)
-- Tabela: configuracoes
-- Descricao: Chave-valor de configuracao do sistema (precos, UFEMG, limites)

BEGIN;

CREATE TABLE IF NOT EXISTS public.configuracoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave           TEXT NOT NULL UNIQUE,
  valor           JSONB NOT NULL DEFAULT '{}',
  descricao       TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.configuracoes;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Leitura publica (qualquer usuario autenticado)
DROP POLICY IF EXISTS "configuracoes_select_authenticated" ON public.configuracoes;
CREATE POLICY "configuracoes_select_authenticated" ON public.configuracoes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Escrita apenas admin (via service_role no backend)
-- Nao ha policy de INSERT/UPDATE/DELETE para usuarios comuns

COMMIT;

-- ROLLBACK
-- DROP TABLE IF EXISTS public.configuracoes;

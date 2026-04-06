-- Tipo: N3 (pessoal)
-- Tabela: perfis
-- Descricao: Dados adicionais do usuario, vinculados 1:1 ao auth.users

BEGIN;

CREATE TABLE IF NOT EXISTS public.perfis (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  nome            TEXT NOT NULL DEFAULT '',
  telefone        TEXT,
  empresa         TEXT,
  cpf_cnpj        TEXT,
  is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_perfis_email ON public.perfis(email);

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.perfis;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Politicas: usuario ve e edita apenas seu proprio perfil
DROP POLICY IF EXISTS "perfis_select_own" ON public.perfis;
CREATE POLICY "perfis_select_own" ON public.perfis
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "perfis_update_own" ON public.perfis;
CREATE POLICY "perfis_update_own" ON public.perfis
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- INSERT e feito pelo trigger handle_new_user (SECURITY DEFINER), nao pelo usuario
-- DELETE e feito pelo CASCADE do auth.users

COMMIT;

-- ROLLBACK
-- DROP TABLE IF EXISTS public.perfis;

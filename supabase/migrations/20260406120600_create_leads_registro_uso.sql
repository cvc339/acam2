-- Tipo: Publica (escrita) / Admin (leitura)
-- Tabelas: leads, registro_uso
-- Descricao: Captura de contatos e analytics de uso de ferramentas

BEGIN;

-- ========================
-- LEADS
-- ========================
CREATE TABLE IF NOT EXISTS public.leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  nome            TEXT,
  telefone        TEXT,
  empresa         TEXT,
  aceita_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  origem          TEXT,
  dados_checklist JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Qualquer visitante pode inserir (via API publica)
DROP POLICY IF EXISTS "leads_insert_anon" ON public.leads;
CREATE POLICY "leads_insert_anon" ON public.leads
  FOR INSERT WITH CHECK (TRUE);

-- Leitura apenas via service_role (admin backend)

-- ========================
-- REGISTRO DE USO (Analytics)
-- ========================
CREATE TABLE IF NOT EXISTS public.registro_uso (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ferramenta      TEXT NOT NULL,
  evento          TEXT NOT NULL CHECK (evento IN ('acesso', 'resultado', 'pdf')),
  usuario_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dados           JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_registro_uso_ferramenta ON public.registro_uso(ferramenta);
CREATE INDEX IF NOT EXISTS idx_registro_uso_created ON public.registro_uso(created_at DESC);

-- RLS
ALTER TABLE public.registro_uso ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode inserir (ferramentas gratuitas nao exigem auth)
DROP POLICY IF EXISTS "registro_uso_insert_all" ON public.registro_uso;
CREATE POLICY "registro_uso_insert_all" ON public.registro_uso
  FOR INSERT WITH CHECK (TRUE);

-- Leitura apenas via service_role (admin backend)

COMMIT;

-- ROLLBACK
-- DROP TABLE IF EXISTS public.registro_uso;
-- DROP TABLE IF EXISTS public.leads;

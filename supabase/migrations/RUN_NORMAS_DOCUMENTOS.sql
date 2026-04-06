-- ============================================================
-- ACAM2 — Tabelas de normas e documentos de protocolo
-- Executar no SQL Editor do Supabase
-- ============================================================

-- NORMAS
CREATE TABLE IF NOT EXISTS public.normas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo            TEXT NOT NULL,
  numero          TEXT NOT NULL,
  ano             INTEGER NOT NULL,
  ementa          TEXT NOT NULL,
  link_url        TEXT,
  status          TEXT NOT NULL DEFAULT 'vigente'
                    CHECK (status IN ('vigente', 'revogada')),
  ordem           INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_normas_status ON public.normas(status);

CREATE TRIGGER set_updated_at_normas
  BEFORE UPDATE ON public.normas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.normas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "normas_select_authenticated" ON public.normas
  FOR SELECT USING (auth.role() = 'authenticated');

-- NORMAS_COMPENSACOES (N:N)
CREATE TABLE IF NOT EXISTS public.normas_compensacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  norma_id        UUID NOT NULL REFERENCES public.normas(id) ON DELETE CASCADE,
  compensacao     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_normas_comp_norma ON public.normas_compensacoes(norma_id);
CREATE INDEX IF NOT EXISTS idx_normas_comp_compensacao ON public.normas_compensacoes(compensacao);

ALTER TABLE public.normas_compensacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "normas_comp_select_authenticated" ON public.normas_compensacoes
  FOR SELECT USING (auth.role() = 'authenticated');

-- DOCUMENTOS_PROTOCOLO
CREATE TABLE IF NOT EXISTS public.documentos_protocolo (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compensacao     TEXT NOT NULL,
  modalidade      TEXT,
  nome            TEXT NOT NULL,
  observacao      TEXT,
  ordem           INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_protocolo_comp ON public.documentos_protocolo(compensacao);
CREATE INDEX IF NOT EXISTS idx_docs_protocolo_modalidade ON public.documentos_protocolo(compensacao, modalidade);

CREATE TRIGGER set_updated_at_docs_protocolo
  BEFORE UPDATE ON public.documentos_protocolo
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.documentos_protocolo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "docs_protocolo_select_authenticated" ON public.documentos_protocolo
  FOR SELECT USING (auth.role() = 'authenticated');

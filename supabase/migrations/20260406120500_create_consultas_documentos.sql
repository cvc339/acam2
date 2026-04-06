-- Tipo: N3 (pessoal)
-- Tabelas: consultas, documentos
-- Descricao: Analises realizadas pelo usuario e documentos enviados

BEGIN;

-- ========================
-- CONSULTAS
-- ========================
CREATE TABLE IF NOT EXISTS public.consultas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ferramenta_id   TEXT NOT NULL,
    -- IDs: dest-uc-base, dest-uc-app, dest-uc-ma, dest-servidao,
    --       calc-impl-uc, calc-snuc, req-mineraria, req-mata-atlantica, req-snuc
  nome_imovel     TEXT,
  municipio       TEXT,
  estado          TEXT NOT NULL DEFAULT 'MG',
  area_hectares   NUMERIC(12,4),
  status          TEXT NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente', 'processando', 'concluida', 'erro', 'reembolsada')),
  parecer_json    JSONB,
  parecer_pdf_path TEXT,
  creditos_usados NUMERIC(10,2) NOT NULL DEFAULT 0,
  dados_entrada   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_consultas_usuario ON public.consultas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_consultas_status ON public.consultas(status);
CREATE INDEX IF NOT EXISTS idx_consultas_ferramenta ON public.consultas(ferramenta_id);
CREATE INDEX IF NOT EXISTS idx_consultas_created ON public.consultas(created_at DESC);

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.consultas;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.consultas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consultas_select_own" ON public.consultas;
CREATE POLICY "consultas_select_own" ON public.consultas
  FOR SELECT USING (auth.uid() = usuario_id);

-- INSERT e UPDATE via backend (service_role) para garantir atomicidade com creditos

-- ========================
-- DOCUMENTOS
-- ========================
CREATE TABLE IF NOT EXISTS public.documentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id     UUID NOT NULL REFERENCES public.consultas(id) ON DELETE CASCADE,
  usuario_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL
                    CHECK (tipo IN ('matricula', 'kml', 'ccir', 'itr', 'car', 'cnd', 'outro')),
  arquivo_nome    TEXT NOT NULL,
  arquivo_path    TEXT NOT NULL,
  arquivo_tamanho BIGINT NOT NULL DEFAULT 0,
  dados_extraidos JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_documentos_consulta ON public.documentos(consulta_id);
CREATE INDEX IF NOT EXISTS idx_documentos_usuario ON public.documentos(usuario_id);

-- RLS
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documentos_select_own" ON public.documentos;
CREATE POLICY "documentos_select_own" ON public.documentos
  FOR SELECT USING (auth.uid() = usuario_id);

-- INSERT via backend (service_role) durante o processamento da consulta

COMMIT;

-- Adicionar FK em transacoes_creditos
ALTER TABLE public.transacoes_creditos
  ADD CONSTRAINT fk_transacoes_consulta
  FOREIGN KEY (consulta_id) REFERENCES public.consultas(id)
  ON DELETE SET NULL;

-- ROLLBACK
-- ALTER TABLE public.transacoes_creditos DROP CONSTRAINT IF EXISTS fk_transacoes_consulta;
-- DROP TABLE IF EXISTS public.documentos;
-- DROP TABLE IF EXISTS public.consultas;

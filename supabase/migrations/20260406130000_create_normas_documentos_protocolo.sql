-- Tipo: Publica (leitura) / Admin (escrita)
-- Tabelas: normas, normas_compensacoes, documentos_protocolo
-- Descricao: Legislacao aplicavel e documentos exigidos para protocolo,
--            editaveis pelo admin sem necessidade de alterar codigo

BEGIN;

-- ========================
-- NORMAS (legislacao aplicavel)
-- ========================
CREATE TABLE IF NOT EXISTS public.normas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo            TEXT NOT NULL,
    -- Ex: 'Lei Federal', 'Decreto Federal', 'Decreto Estadual', 'Portaria', 'Deliberacao Normativa'
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

DROP TRIGGER IF EXISTS set_updated_at ON public.normas;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.normas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.normas ENABLE ROW LEVEL SECURITY;

-- Leitura publica (qualquer usuario autenticado)
CREATE POLICY "normas_select_authenticated" ON public.normas
  FOR SELECT USING (auth.role() = 'authenticated');

-- Escrita apenas via service_role (admin)

-- ========================
-- NORMAS_COMPENSACOES (relacao N:N)
-- ========================
CREATE TABLE IF NOT EXISTS public.normas_compensacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  norma_id        UUID NOT NULL REFERENCES public.normas(id) ON DELETE CASCADE,
  compensacao     TEXT NOT NULL
    -- Valores: 'mineraria', 'mata-atlantica', 'app', 'snuc',
    --          'reserva-legal', 'ameacadas', 'imunes', 'reposicao-florestal'
);

CREATE INDEX IF NOT EXISTS idx_normas_comp_norma ON public.normas_compensacoes(norma_id);
CREATE INDEX IF NOT EXISTS idx_normas_comp_compensacao ON public.normas_compensacoes(compensacao);

ALTER TABLE public.normas_compensacoes ENABLE ROW LEVEL SECURITY;

-- Leitura publica
CREATE POLICY "normas_comp_select_authenticated" ON public.normas_compensacoes
  FOR SELECT USING (auth.role() = 'authenticated');

-- ========================
-- DOCUMENTOS_PROTOCOLO (documentos exigidos por compensacao/modalidade)
-- ========================
CREATE TABLE IF NOT EXISTS public.documentos_protocolo (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compensacao     TEXT NOT NULL,
  modalidade      TEXT,
    -- Nullable: se null, vale para todas as modalidades da compensacao
    -- Ex: '2.1', '1.2', '4.4'
  nome            TEXT NOT NULL,
  observacao      TEXT,
    -- Ex: 'atualizada ha menos de 30 dias', 'com ART do responsavel tecnico'
  ordem           INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_protocolo_comp ON public.documentos_protocolo(compensacao);
CREATE INDEX IF NOT EXISTS idx_docs_protocolo_modalidade ON public.documentos_protocolo(compensacao, modalidade);

DROP TRIGGER IF EXISTS set_updated_at ON public.documentos_protocolo;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.documentos_protocolo
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.documentos_protocolo ENABLE ROW LEVEL SECURITY;

-- Leitura publica
CREATE POLICY "docs_protocolo_select_authenticated" ON public.documentos_protocolo
  FOR SELECT USING (auth.role() = 'authenticated');

-- Escrita apenas via service_role (admin)

COMMIT;

-- ROLLBACK
-- DROP TABLE IF EXISTS public.documentos_protocolo;
-- DROP TABLE IF EXISTS public.normas_compensacoes;
-- DROP TABLE IF EXISTS public.normas;

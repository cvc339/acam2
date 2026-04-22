-- Tipo: Schema
-- Descricao: Campos na tabela artigos para incluir artigos na newsletter

BEGIN;

ALTER TABLE public.artigos
  ADD COLUMN IF NOT EXISTS incluir_newsletter BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS enviado_newsletter_em TIMESTAMPTZ;

-- Indice para query rapida de artigos elegiveis para envio
CREATE INDEX IF NOT EXISTS idx_artigos_newsletter_elegivel
  ON public.artigos (incluir_newsletter)
  WHERE status = 'publicado' AND enviado_newsletter_em IS NULL;

COMMIT;

-- ROLLBACK
-- ALTER TABLE public.artigos
--   DROP COLUMN IF EXISTS incluir_newsletter,
--   DROP COLUMN IF EXISTS enviado_newsletter_em;
-- DROP INDEX IF EXISTS idx_artigos_newsletter_elegivel;

-- Tipo: Schema
-- Descricao: Adiciona coluna aceita_newsletter em perfis para controlar opt-out da newsletter

ALTER TABLE public.perfis
  ADD COLUMN IF NOT EXISTS aceita_newsletter BOOLEAN DEFAULT TRUE;

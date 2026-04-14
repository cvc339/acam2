-- Tipo: Schema
-- Descricao: Tabelas do Radar Ambiental / Newsletter
-- Integrado ao ACAM — acesso via service_role (admin backend)

BEGIN;

-- 1. Itens coletados (normas federais, estaduais e noticias)
CREATE TABLE IF NOT EXISTS public.radar_itens (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  titulo TEXT NOT NULL,
  resumo TEXT,
  url TEXT,
  fonte TEXT NOT NULL,
  fonte_nome TEXT,
  orgao TEXT,
  tipo TEXT,
  numero TEXT,
  categoria TEXT,
  relevancia INTEGER DEFAULT 0,
  palavras_chave TEXT[],
  data_publicacao DATE,
  incluir_email BOOLEAN DEFAULT TRUE,
  coletado_em TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT radar_itens_url_unique UNIQUE (url)
);

CREATE INDEX IF NOT EXISTS idx_radar_itens_fonte ON public.radar_itens (fonte);
CREATE INDEX IF NOT EXISTS idx_radar_itens_data ON public.radar_itens (data_publicacao DESC);
CREATE INDEX IF NOT EXISTS idx_radar_itens_incluir ON public.radar_itens (incluir_email);
CREATE INDEX IF NOT EXISTS idx_radar_itens_coletado ON public.radar_itens (coletado_em DESC);

-- 2. Assinantes da newsletter
CREATE TABLE IF NOT EXISTS public.radar_destinatarios (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT TRUE,
  origem TEXT DEFAULT 'manual',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radar_destinatarios_ativo ON public.radar_destinatarios (ativo);
CREATE INDEX IF NOT EXISTS idx_radar_destinatarios_email ON public.radar_destinatarios (email);

-- 3. Historico de envios
CREATE TABLE IF NOT EXISTS public.radar_envios (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  assunto TEXT NOT NULL,
  conteudo_html TEXT,
  destinatarios_count INTEGER DEFAULT 0,
  itens_count INTEGER DEFAULT 0,
  enviado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS — tudo via service_role (admin backend)
ALTER TABLE public.radar_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_destinatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_envios ENABLE ROW LEVEL SECURITY;

-- Sem policies para authenticated = bloqueado para usuarios comuns
-- service_role bypassa RLS automaticamente
-- Scripts de coleta e admin do ACAM usam service_role

COMMIT;

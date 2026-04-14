-- Tipo: Schema
-- Descricao: Adiciona coluna enviado_em em radar_itens para rastrear envios

ALTER TABLE public.radar_itens
  ADD COLUMN IF NOT EXISTS enviado_em TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_radar_itens_enviado ON public.radar_itens (enviado_em);

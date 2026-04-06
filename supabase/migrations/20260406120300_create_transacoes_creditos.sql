-- Tipo: N3 (pessoal)
-- Tabela: transacoes_creditos
-- Descricao: Registro de todas as movimentacoes de creditos (compra, uso, reembolso, ajuste)
-- Regra critica: saldo = SUM(compras + reembolsos + ajustes) - SUM(usos)

BEGIN;

CREATE TABLE IF NOT EXISTS public.transacoes_creditos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('compra', 'uso', 'reembolso', 'ajuste')),
  quantidade      NUMERIC(10,2) NOT NULL,
  valor_pago      NUMERIC(10,2),
  descricao       TEXT NOT NULL DEFAULT '',
  consulta_id     UUID,  -- FK adicionada apos criar tabela consultas
  pagamento_id    UUID,  -- FK adicionada apos criar tabela pagamentos
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_transacoes_creditos_usuario ON public.transacoes_creditos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_creditos_tipo ON public.transacoes_creditos(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_creditos_created ON public.transacoes_creditos(created_at DESC);

-- RLS
ALTER TABLE public.transacoes_creditos ENABLE ROW LEVEL SECURITY;

-- Usuario ve apenas suas transacoes
DROP POLICY IF EXISTS "transacoes_select_own" ON public.transacoes_creditos;
CREATE POLICY "transacoes_select_own" ON public.transacoes_creditos
  FOR SELECT USING (auth.uid() = usuario_id);

-- INSERT apenas via backend (service_role) para garantir atomicidade
-- Nao ha policy de INSERT para usuarios comuns — creditos sao geridos pelo servidor

COMMIT;

-- View auxiliar: saldo do usuario (SECURITY INVOKER — respeita RLS!)
CREATE OR REPLACE VIEW public.saldo_creditos
WITH (security_invoker = true)
AS
SELECT
  usuario_id,
  COALESCE(SUM(
    CASE WHEN tipo IN ('compra', 'reembolso', 'ajuste') THEN quantidade
         WHEN tipo = 'uso' THEN -quantidade
         ELSE 0
    END
  ), 0) AS saldo
FROM public.transacoes_creditos
GROUP BY usuario_id;

-- ROLLBACK
-- DROP VIEW IF EXISTS public.saldo_creditos;
-- DROP TABLE IF EXISTS public.transacoes_creditos;

-- Tipo: N3 (pessoal)
-- Tabela: pagamentos
-- Descricao: Historico de pagamentos via Mercado Pago

BEGIN;

CREATE TABLE IF NOT EXISTS public.pagamentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_id   TEXT,
  payment_id      TEXT,
  pacote          TEXT NOT NULL,
  creditos        NUMERIC(10,2) NOT NULL,
  valor           NUMERIC(10,2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'cancelado')),
  metodo_pagamento TEXT,
  dados_pagamento JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario ON public.pagamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON public.pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_payment_id ON public.pagamentos(payment_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.pagamentos;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Usuario ve apenas seus pagamentos
DROP POLICY IF EXISTS "pagamentos_select_own" ON public.pagamentos;
CREATE POLICY "pagamentos_select_own" ON public.pagamentos
  FOR SELECT USING (auth.uid() = usuario_id);

-- INSERT e UPDATE apenas via backend (service_role) — webhook do Mercado Pago

COMMIT;

-- Adicionar FK em transacoes_creditos
ALTER TABLE public.transacoes_creditos
  ADD CONSTRAINT fk_transacoes_pagamento
  FOREIGN KEY (pagamento_id) REFERENCES public.pagamentos(id)
  ON DELETE SET NULL;

-- ROLLBACK
-- ALTER TABLE public.transacoes_creditos DROP CONSTRAINT IF EXISTS fk_transacoes_pagamento;
-- DROP TABLE IF EXISTS public.pagamentos;

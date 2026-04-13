-- Tipo: Schema
-- Descricao: Adiciona ferramenta_id em transacoes_creditos para analytics confiavel
-- + cria tabela mensagens_contato (Fale Conosco)

BEGIN;

-- ============================================
-- 1. Coluna ferramenta_id em transacoes_creditos
-- ============================================

ALTER TABLE public.transacoes_creditos
  ADD COLUMN IF NOT EXISTS ferramenta_id TEXT;

CREATE INDEX IF NOT EXISTS idx_transacoes_creditos_ferramenta
  ON public.transacoes_creditos (ferramenta_id);

-- Atualizar funcao debitar_creditos para gravar ferramenta_id
CREATE OR REPLACE FUNCTION public.debitar_creditos(
  p_usuario_id UUID,
  p_quantidade NUMERIC,
  p_descricao TEXT DEFAULT '',
  p_ferramenta_id TEXT DEFAULT NULL,
  p_consulta_id UUID DEFAULT NULL
)
RETURNS TABLE(sucesso BOOLEAN, saldo_restante NUMERIC, erro TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_saldo NUMERIC;
BEGIN
  -- Passo 1: travar todas as linhas do usuario
  PERFORM 1
  FROM public.transacoes_creditos
  WHERE usuario_id = p_usuario_id
  FOR UPDATE;

  -- Passo 2: calcular saldo
  SELECT COALESCE(SUM(
    CASE WHEN tipo IN ('compra', 'reembolso', 'ajuste') THEN quantidade
         WHEN tipo = 'uso' THEN -quantidade
         ELSE 0
    END
  ), 0)
  INTO v_saldo
  FROM public.transacoes_creditos
  WHERE usuario_id = p_usuario_id;

  -- Verificar saldo suficiente
  IF v_saldo < p_quantidade THEN
    RETURN QUERY SELECT FALSE, v_saldo, format('Saldo insuficiente. Você tem %s créditos, mas precisa de %s.', v_saldo, p_quantidade);
    RETURN;
  END IF;

  -- Inserir transacao de debito (agora com ferramenta_id)
  INSERT INTO public.transacoes_creditos (usuario_id, tipo, quantidade, descricao, consulta_id, ferramenta_id)
  VALUES (p_usuario_id, 'uso', p_quantidade,
    COALESCE(p_descricao, 'Uso de ferramenta: ' || COALESCE(p_ferramenta_id, 'não especificada')),
    p_consulta_id, p_ferramenta_id);

  RETURN QUERY SELECT TRUE, v_saldo - p_quantidade, NULL::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.debitar_creditos FROM PUBLIC;
REVOKE ALL ON FUNCTION public.debitar_creditos FROM anon;
REVOKE ALL ON FUNCTION public.debitar_creditos FROM authenticated;
GRANT EXECUTE ON FUNCTION public.debitar_creditos TO service_role;

-- ============================================
-- 2. Tabela mensagens_contato (Fale Conosco)
-- ============================================

CREATE TABLE IF NOT EXISTS public.mensagens_contato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('sugestao', 'elogio', 'reclamacao', 'duvida')),
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  resposta TEXT,
  respondido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_contato_tipo ON public.mensagens_contato (tipo);
CREATE INDEX IF NOT EXISTS idx_mensagens_contato_created ON public.mensagens_contato (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_contato_lida ON public.mensagens_contato (lida);

ALTER TABLE public.mensagens_contato ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode enviar mensagem
CREATE POLICY mensagens_insert_authenticated ON public.mensagens_contato
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Usuario ve apenas suas proprias mensagens
CREATE POLICY mensagens_select_own ON public.mensagens_contato
  FOR SELECT TO authenticated
  USING (auth.uid() = usuario_id);

-- Leitura e update pelo admin via service_role (sem policy necessaria)

COMMIT;

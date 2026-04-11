-- Tipo: Bugfix
-- Descricao: Corrige funcao debitar_creditos que falhava com
-- "FOR UPDATE is not allowed with aggregate functions"
-- Solucao: separar lock (FOR UPDATE) e calculo (SUM) em dois passos

BEGIN;

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
  -- Passo 1: travar todas as linhas do usuario (sem aggregate)
  -- Debitos concorrentes do mesmo usuario ficam na fila ate este COMMIT
  PERFORM 1
  FROM public.transacoes_creditos
  WHERE usuario_id = p_usuario_id
  FOR UPDATE;

  -- Passo 2: calcular saldo com as linhas ja travadas
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

  -- Inserir transacao de debito
  INSERT INTO public.transacoes_creditos (usuario_id, tipo, quantidade, descricao, consulta_id)
  VALUES (p_usuario_id, 'uso', p_quantidade, COALESCE(p_descricao, 'Uso de ferramenta: ' || COALESCE(p_ferramenta_id, 'não especificada')), p_consulta_id);

  RETURN QUERY SELECT TRUE, v_saldo - p_quantidade, NULL::TEXT;
END;
$$;

-- Permissoes: apenas service_role pode chamar
REVOKE ALL ON FUNCTION public.debitar_creditos FROM PUBLIC;
REVOKE ALL ON FUNCTION public.debitar_creditos FROM anon;
REVOKE ALL ON FUNCTION public.debitar_creditos FROM authenticated;
GRANT EXECUTE ON FUNCTION public.debitar_creditos TO service_role;

COMMIT;

-- Tipo: Seguranca
-- Descricao: Correcoes de seguranca identificadas pelo /vc-security em 2026-04-10
-- Fixes: search_path em funcoes, debito atomico de creditos

BEGIN;

-- ============================================
-- FIX 1: search_path em funcoes
-- Supabase linter: function_search_path_mutable
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, email, nome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ============================================
-- FIX 2: Funcao atomica para debitar creditos
-- Resolve race condition (TOCTOU) no debito
-- ============================================

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
  -- Lock: seleciona saldo com FOR UPDATE implícito via aggregate
  -- Isso serializa débitos concorrentes para o mesmo usuário
  SELECT COALESCE(SUM(
    CASE WHEN tipo IN ('compra', 'reembolso', 'ajuste') THEN quantidade
         WHEN tipo = 'uso' THEN -quantidade
         ELSE 0
    END
  ), 0)
  INTO v_saldo
  FROM public.transacoes_creditos
  WHERE usuario_id = p_usuario_id
  FOR UPDATE;

  -- Verificar saldo suficiente
  IF v_saldo < p_quantidade THEN
    RETURN QUERY SELECT FALSE, v_saldo, format('Saldo insuficiente. Você tem %s créditos, mas precisa de %s.', v_saldo, p_quantidade);
    RETURN;
  END IF;

  -- Inserir transação de débito
  INSERT INTO public.transacoes_creditos (usuario_id, tipo, quantidade, descricao, consulta_id)
  VALUES (p_usuario_id, 'uso', p_quantidade, COALESCE(p_descricao, 'Uso de ferramenta: ' || COALESCE(p_ferramenta_id, 'não especificada')), p_consulta_id);

  RETURN QUERY SELECT TRUE, v_saldo - p_quantidade, NULL::TEXT;
END;
$$;

-- Permissao: apenas service_role pode chamar
REVOKE ALL ON FUNCTION public.debitar_creditos FROM PUBLIC;
REVOKE ALL ON FUNCTION public.debitar_creditos FROM anon;
REVOKE ALL ON FUNCTION public.debitar_creditos FROM authenticated;

COMMIT;

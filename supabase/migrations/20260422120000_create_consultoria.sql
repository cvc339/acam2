-- Tipo: Feature
-- Descricao: Ferramenta de consultoria (agendamento de reuniao tecnica)
-- Tabelas: slots_consultoria, agendamentos_consultoria, google_calendar_auth

BEGIN;

-- ============================================
-- 1. slots_consultoria
-- Horarios disponibilizados pelo consultor (criados via admin)
-- ============================================

CREATE TABLE IF NOT EXISTS public.slots_consultoria (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data            DATE NOT NULL,
  hora_inicio     TIME NOT NULL,
  hora_fim        TIME NOT NULL,
  status          TEXT NOT NULL DEFAULT 'disponivel'
                    CHECK (status IN ('disponivel', 'reservado', 'bloqueado')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT slot_unico UNIQUE (data, hora_inicio),
  CONSTRAINT horario_valido CHECK (hora_fim > hora_inicio)
);

CREATE INDEX IF NOT EXISTS idx_slots_data ON public.slots_consultoria(data);
CREATE INDEX IF NOT EXISTS idx_slots_status ON public.slots_consultoria(status);

ALTER TABLE public.slots_consultoria ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ver slots disponiveis (para escolher)
DROP POLICY IF EXISTS slots_select_disponiveis ON public.slots_consultoria;
CREATE POLICY slots_select_disponiveis ON public.slots_consultoria
  FOR SELECT TO authenticated
  USING (status = 'disponivel' OR status = 'reservado');

-- INSERT/UPDATE/DELETE: apenas service_role (admin via backend)

-- ============================================
-- 2. agendamentos_consultoria
-- Reservas feitas pelos usuarios
-- ============================================

CREATE TABLE IF NOT EXISTS public.agendamentos_consultoria (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_id                 UUID NOT NULL REFERENCES public.slots_consultoria(id) ON DELETE RESTRICT,
  email_reuniao           TEXT NOT NULL,
  link_reuniao            TEXT,
  evento_gcal_id          TEXT,
  anexo_url               TEXT,
  anexo_nome              TEXT,
  status                  TEXT NOT NULL DEFAULT 'confirmado'
                            CHECK (status IN ('confirmado', 'reagendado', 'cancelado_usuario', 'cancelado_admin', 'concluido')),
  reagendamento_usado     BOOLEAN NOT NULL DEFAULT FALSE,
  transacao_credito_id    UUID REFERENCES public.transacoes_creditos(id) ON DELETE SET NULL,
  lembrete_24h_enviado    BOOLEAN NOT NULL DEFAULT FALSE,
  lembrete_1h_enviado     BOOLEAN NOT NULL DEFAULT FALSE,
  observacoes_usuario     TEXT,
  criado_em               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_usuario ON public.agendamentos_consultoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_slot ON public.agendamentos_consultoria(slot_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON public.agendamentos_consultoria(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_criado ON public.agendamentos_consultoria(criado_em DESC);

-- Constraint critico: impede double-booking no DB
-- Um slot so pode ter UMA reserva ativa (confirmado ou reagendado)
CREATE UNIQUE INDEX IF NOT EXISTS agendamento_slot_ativo_unico
  ON public.agendamentos_consultoria (slot_id)
  WHERE status IN ('confirmado', 'reagendado');

ALTER TABLE public.agendamentos_consultoria ENABLE ROW LEVEL SECURITY;

-- Usuario ve apenas proprios agendamentos
DROP POLICY IF EXISTS agendamentos_select_own ON public.agendamentos_consultoria;
CREATE POLICY agendamentos_select_own ON public.agendamentos_consultoria
  FOR SELECT TO authenticated
  USING (auth.uid() = usuario_id);

-- INSERT/UPDATE/DELETE: apenas via service_role (garante atomicidade do debito + agendamento)

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION public.trigger_atualizar_agendamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS agendamentos_atualizado_em ON public.agendamentos_consultoria;
CREATE TRIGGER agendamentos_atualizado_em
  BEFORE UPDATE ON public.agendamentos_consultoria
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_atualizar_agendamento();

-- ============================================
-- 3. google_calendar_auth
-- Singleton: 1 linha com tokens OAuth do consultor
-- ============================================

CREATE TABLE IF NOT EXISTS public.google_calendar_auth (
  id              INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  refresh_token   TEXT NOT NULL,
  access_token    TEXT,
  expiry          TIMESTAMPTZ,
  email_conta     TEXT,
  atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.google_calendar_auth ENABLE ROW LEVEL SECURITY;

-- Zero policy para usuarios: acesso apenas via service_role
-- Nenhuma policy = nada eh visivel a qualquer role de usuario comum

-- ============================================
-- 4. Funcao atomica: reservar slot
-- Garante que o slot passa de 'disponivel' para 'reservado' sem race condition
-- ============================================

CREATE OR REPLACE FUNCTION public.reservar_slot_consultoria(
  p_slot_id UUID
)
RETURNS TABLE(sucesso BOOLEAN, erro TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_status TEXT;
BEGIN
  -- Lock do slot
  SELECT status INTO v_status
  FROM public.slots_consultoria
  WHERE id = p_slot_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Slot nao encontrado'::TEXT;
    RETURN;
  END IF;

  IF v_status != 'disponivel' THEN
    RETURN QUERY SELECT FALSE, format('Slot indisponivel (status: %s)', v_status);
    RETURN;
  END IF;

  UPDATE public.slots_consultoria
  SET status = 'reservado'
  WHERE id = p_slot_id;

  RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.reservar_slot_consultoria FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reservar_slot_consultoria FROM anon;
REVOKE ALL ON FUNCTION public.reservar_slot_consultoria FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reservar_slot_consultoria TO service_role;

-- ============================================
-- 5. Funcao atomica: liberar slot
-- Usada em cancelamento e reagendamento (volta o slot antigo para 'disponivel')
-- ============================================

CREATE OR REPLACE FUNCTION public.liberar_slot_consultoria(
  p_slot_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.slots_consultoria
  SET status = 'disponivel'
  WHERE id = p_slot_id
    AND status = 'reservado';
END;
$$;

REVOKE ALL ON FUNCTION public.liberar_slot_consultoria FROM PUBLIC;
REVOKE ALL ON FUNCTION public.liberar_slot_consultoria FROM anon;
REVOKE ALL ON FUNCTION public.liberar_slot_consultoria FROM authenticated;
GRANT EXECUTE ON FUNCTION public.liberar_slot_consultoria TO service_role;

-- ============================================
-- 6. Adicionar 'consultoria' em configuracoes.precos
-- ============================================

UPDATE public.configuracoes
SET valor = jsonb_set(
  valor,
  '{ferramentas,consultoria}',
  '{"creditos": 15, "nome": "Consultoria — Reuniao Tecnica"}'::jsonb,
  true
),
updated_at = NOW()
WHERE chave = 'precos';

COMMIT;

-- ROLLBACK
-- DROP FUNCTION IF EXISTS public.liberar_slot_consultoria(UUID);
-- DROP FUNCTION IF EXISTS public.reservar_slot_consultoria(UUID);
-- DROP TRIGGER IF EXISTS agendamentos_atualizado_em ON public.agendamentos_consultoria;
-- DROP FUNCTION IF EXISTS public.trigger_atualizar_agendamento();
-- DROP TABLE IF EXISTS public.google_calendar_auth;
-- DROP TABLE IF EXISTS public.agendamentos_consultoria;
-- DROP TABLE IF EXISTS public.slots_consultoria;

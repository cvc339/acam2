-- ============================================================
-- ACAM2 — Todas as migrations (executar no SQL Editor do Supabase)
-- Executar uma unica vez no banco acam2
-- ============================================================

-- ============================================================
-- 1. FUNCOES AUXILIARES
-- ============================================================

-- Funcao para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Funcao para criar perfil automaticamente ao registrar usuario
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. TABELA PERFIS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.perfis (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  nome            TEXT NOT NULL DEFAULT '',
  telefone        TEXT,
  empresa         TEXT,
  cpf_cnpj        TEXT,
  is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perfis_email ON public.perfis(email);

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.perfis
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfis_select_own" ON public.perfis
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "perfis_update_own" ON public.perfis
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Trigger: criar perfil quando usuario se registra
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. TABELA CONFIGURACOES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.configuracoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave           TEXT NOT NULL UNIQUE,
  valor           JSONB NOT NULL DEFAULT '{}',
  descricao       TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_configuracoes
  BEFORE UPDATE ON public.configuracoes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "configuracoes_select_authenticated" ON public.configuracoes
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- 4. TABELA TRANSACOES_CREDITOS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.transacoes_creditos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('compra', 'uso', 'reembolso', 'ajuste')),
  quantidade      NUMERIC(10,2) NOT NULL,
  valor_pago      NUMERIC(10,2),
  descricao       TEXT NOT NULL DEFAULT '',
  consulta_id     UUID,
  pagamento_id    UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transacoes_creditos_usuario ON public.transacoes_creditos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_creditos_tipo ON public.transacoes_creditos(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_creditos_created ON public.transacoes_creditos(created_at DESC);

ALTER TABLE public.transacoes_creditos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transacoes_select_own" ON public.transacoes_creditos
  FOR SELECT USING (auth.uid() = usuario_id);

-- View: saldo do usuario (SECURITY INVOKER — respeita RLS!)
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

-- ============================================================
-- 5. TABELA PAGAMENTOS
-- ============================================================

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

CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario ON public.pagamentos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON public.pagamentos(status);
CREATE INDEX IF NOT EXISTS idx_pagamentos_payment_id ON public.pagamentos(payment_id);

CREATE TRIGGER set_updated_at_pagamentos
  BEFORE UPDATE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pagamentos_select_own" ON public.pagamentos
  FOR SELECT USING (auth.uid() = usuario_id);

-- FK em transacoes_creditos
ALTER TABLE public.transacoes_creditos
  ADD CONSTRAINT fk_transacoes_pagamento
  FOREIGN KEY (pagamento_id) REFERENCES public.pagamentos(id)
  ON DELETE SET NULL;

-- ============================================================
-- 6. TABELAS CONSULTAS E DOCUMENTOS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.consultas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ferramenta_id   TEXT NOT NULL,
  nome_imovel     TEXT,
  municipio       TEXT,
  estado          TEXT NOT NULL DEFAULT 'MG',
  area_hectares   NUMERIC(12,4),
  status          TEXT NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente', 'processando', 'concluida', 'erro', 'reembolsada')),
  parecer_json    JSONB,
  parecer_pdf_path TEXT,
  creditos_usados NUMERIC(10,2) NOT NULL DEFAULT 0,
  dados_entrada   JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultas_usuario ON public.consultas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_consultas_status ON public.consultas(status);
CREATE INDEX IF NOT EXISTS idx_consultas_ferramenta ON public.consultas(ferramenta_id);
CREATE INDEX IF NOT EXISTS idx_consultas_created ON public.consultas(created_at DESC);

CREATE TRIGGER set_updated_at_consultas
  BEFORE UPDATE ON public.consultas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultas_select_own" ON public.consultas
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE TABLE IF NOT EXISTS public.documentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id     UUID NOT NULL REFERENCES public.consultas(id) ON DELETE CASCADE,
  usuario_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL
                    CHECK (tipo IN ('matricula', 'kml', 'ccir', 'itr', 'car', 'cnd', 'outro')),
  arquivo_nome    TEXT NOT NULL,
  arquivo_path    TEXT NOT NULL,
  arquivo_tamanho BIGINT NOT NULL DEFAULT 0,
  dados_extraidos JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documentos_consulta ON public.documentos(consulta_id);
CREATE INDEX IF NOT EXISTS idx_documentos_usuario ON public.documentos(usuario_id);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documentos_select_own" ON public.documentos
  FOR SELECT USING (auth.uid() = usuario_id);

-- FK em transacoes_creditos
ALTER TABLE public.transacoes_creditos
  ADD CONSTRAINT fk_transacoes_consulta
  FOREIGN KEY (consulta_id) REFERENCES public.consultas(id)
  ON DELETE SET NULL;

-- ============================================================
-- 7. TABELAS LEADS E REGISTRO_USO
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  nome            TEXT,
  telefone        TEXT,
  empresa         TEXT,
  aceita_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  origem          TEXT,
  dados_checklist JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads(created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_insert_anon" ON public.leads
  FOR INSERT WITH CHECK (TRUE);

CREATE TABLE IF NOT EXISTS public.registro_uso (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ferramenta      TEXT NOT NULL,
  evento          TEXT NOT NULL CHECK (evento IN ('acesso', 'resultado', 'pdf')),
  usuario_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  dados           JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registro_uso_ferramenta ON public.registro_uso(ferramenta);
CREATE INDEX IF NOT EXISTS idx_registro_uso_created ON public.registro_uso(created_at DESC);

ALTER TABLE public.registro_uso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registro_uso_insert_all" ON public.registro_uso
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- 8. DADOS INICIAIS
-- ============================================================

INSERT INTO public.configuracoes (chave, valor, descricao)
VALUES (
  'precos',
  '{
    "credito_avulso": 12.00,
    "pacotes": [
      {"nome": "Basico", "creditos": 10, "desconto": 0.17},
      {"nome": "Intermediario", "creditos": 25, "desconto": 0.25},
      {"nome": "Premium", "creditos": 50, "desconto": 0.33}
    ],
    "ferramentas": {
      "dest-uc-base": {"creditos": 5, "nome": "Destinacao em UC — Base"},
      "dest-uc-app": {"creditos": 6, "nome": "Destinacao em UC — APP"},
      "dest-uc-ma": {"creditos": 7, "nome": "Destinacao em UC — Mata Atlantica"},
      "dest-servidao": {"creditos": 7, "nome": "Analise de Servidao/RPPN"},
      "calc-impl-uc": {"creditos": 2, "nome": "Calculo de Implantacao/Manutencao de UC"},
      "calc-snuc": {"creditos": 7, "nome": "Calculadora SNUC"},
      "req-mineraria": {"creditos": 0.5, "nome": "Requerimento Mineraria"},
      "req-mata-atlantica": {"creditos": 0.5, "nome": "Requerimento Mata Atlantica"},
      "req-snuc": {"creditos": 0.5, "nome": "Requerimento SNUC"}
    }
  }'::jsonb,
  'Precos de creditos, pacotes com desconto e custo por ferramenta'
)
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

INSERT INTO public.configuracoes (chave, valor, descricao)
VALUES (
  'ufemg',
  '{"ano": 2026, "valor": 5.7899}'::jsonb,
  'Valor da UFEMG vigente, atualizado anualmente'
)
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

INSERT INTO public.configuracoes (chave, valor, descricao)
VALUES (
  'limites',
  '{
    "max_upload_mb": 10,
    "max_upload_geoespacial_mb": 50,
    "tipos_arquivo_permitidos": [".pdf", ".kml", ".kmz", ".shp", ".zip", ".geojson", ".json"],
    "timeout_ide_sisema_ms": 30000,
    "max_tentativas_api": 3
  }'::jsonb,
  'Limites operacionais do sistema'
)
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

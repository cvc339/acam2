-- Tipo: Seed
-- Descricao: Dados iniciais de configuracao do sistema

BEGIN;

-- Precos e pacotes de creditos
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

-- UFEMG (Unidade Fiscal do Estado de Minas Gerais)
INSERT INTO public.configuracoes (chave, valor, descricao)
VALUES (
  'ufemg',
  '{"ano": 2026, "valor": 5.7899}'::jsonb,
  'Valor da UFEMG vigente, atualizado anualmente'
)
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

-- Limites do sistema
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

COMMIT;

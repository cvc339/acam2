// Tipos do banco de dados Supabase
// Gerados manualmente ate configurar supabase gen types

export interface Perfil {
  id: string
  nome: string
  email: string
  telefone: string | null
  empresa: string | null
  cpf_cnpj: string | null
  is_admin: boolean
  email_verificado: boolean
  criado_em: string
  atualizado_em: string
}

export interface TransacaoCredito {
  id: string
  usuario_id: string
  tipo: 'compra' | 'uso' | 'reembolso' | 'ajuste'
  quantidade: number
  valor_pago: number | null
  descricao: string
  consulta_id: string | null
  pagamento_id: string | null
  criado_em: string
}

export interface Pagamento {
  id: string
  usuario_id: string
  preference_id: string | null
  payment_id: string | null
  pacote: string
  creditos: number
  valor: number
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado'
  metodo_pagamento: string | null
  dados_pagamento: Record<string, unknown> | null
  criado_em: string
  atualizado_em: string
}

export interface Consulta {
  id: string
  usuario_id: string
  ferramenta_id: string
  nome_imovel: string | null
  municipio: string | null
  estado: string
  area_hectares: number | null
  status: 'pendente' | 'processando' | 'concluida' | 'erro' | 'reembolsada'
  parecer_json: Record<string, unknown> | null
  parecer_pdf_path: string | null
  creditos_usados: number
  dados_entrada: Record<string, unknown> | null
  criado_em: string
  atualizado_em: string
}

export interface Documento {
  id: string
  consulta_id: string
  tipo: 'matricula' | 'kml' | 'ccir' | 'itr' | 'car' | 'cnd' | 'outro'
  arquivo_nome: string
  arquivo_path: string
  arquivo_tamanho: number
  dados_extraidos: Record<string, unknown> | null
  criado_em: string
}

export interface Lead {
  id: string
  email: string
  nome: string | null
  telefone: string | null
  empresa: string | null
  aceita_marketing: boolean
  origem: string | null
  dados_checklist: Record<string, unknown> | null
  criado_em: string
}

export interface Configuracao {
  id: string
  chave: string
  valor: Record<string, unknown>
  atualizado_em: string
}

export interface RegistroUso {
  id: string
  ferramenta: string
  evento: 'acesso' | 'resultado' | 'pdf'
  usuario_id: string | null
  dados: Record<string, unknown> | null
  criado_em: string
}

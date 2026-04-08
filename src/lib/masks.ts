/**
 * Máscaras de formatação e validação para formulários
 * Adaptado do ACAM1 utils.js para React/TypeScript
 */

// ============================================
// MÁSCARAS DE FORMATAÇÃO
// ============================================

/** Aplica máscara de CPF: 000.000.000-00 */
export function maskCPF(value: string): string {
  let v = value.replace(/\D/g, "").slice(0, 11)
  if (v.length > 3) v = v.slice(0, 3) + "." + v.slice(3)
  if (v.length > 7) v = v.slice(0, 7) + "." + v.slice(7)
  if (v.length > 11) v = v.slice(0, 11) + "-" + v.slice(11)
  return v
}

/** Aplica máscara de CNPJ: 00.000.000/0000-00 (ou CPF se ≤11 dígitos) */
export function maskCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (digits.length <= 11) return maskCPF(value)
  let v = digits.slice(0, 14)
  if (v.length > 2) v = v.slice(0, 2) + "." + v.slice(2)
  if (v.length > 6) v = v.slice(0, 6) + "." + v.slice(6)
  if (v.length > 10) v = v.slice(0, 10) + "/" + v.slice(10)
  if (v.length > 15) v = v.slice(0, 15) + "-" + v.slice(15)
  return v
}

/** Aplica máscara de CEP: 00000-000 */
export function maskCEP(value: string): string {
  let v = value.replace(/\D/g, "").slice(0, 8)
  if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5)
  return v
}

/** Aplica máscara de telefone: (00) 00000-0000 ou (00) 0000-0000 */
export function maskTel(value: string): string {
  let v = value.replace(/\D/g, "").slice(0, 11)
  if (v.length > 0) v = "(" + v
  if (v.length > 3) v = v.slice(0, 3) + ") " + v.slice(3)
  if (v.length > 10) v = v.slice(0, 10) + "-" + v.slice(10)
  return v
}

/** Aplica máscara de data: DD/MM/AAAA */
export function maskDate(value: string): string {
  let v = value.replace(/\D/g, "").slice(0, 8)
  if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2)
  if (v.length > 5) v = v.slice(0, 5) + "/" + v.slice(5)
  return v
}

// ============================================
// VALIDAÇÕES
// ============================================

/** Valida CPF (retorna true/false) */
export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "")
  if (digits.length !== 11) return false
  if (/^(\d)\1+$/.test(digits)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(digits[i]) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto >= 10) resto = 0
  if (resto !== parseInt(digits[9])) return false

  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(digits[i]) * (11 - i)
  resto = (soma * 10) % 11
  if (resto >= 10) resto = 0
  if (resto !== parseInt(digits[10])) return false

  return true
}

/** Valida CNPJ (retorna true/false) */
export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "")
  if (digits.length !== 14) return false
  if (/^(\d)\1+$/.test(digits)) return false

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  let soma = 0
  for (let i = 0; i < 12; i++) soma += parseInt(digits[i]) * pesos1[i]
  let resto = soma % 11
  const dig1 = resto < 2 ? 0 : 11 - resto
  if (dig1 !== parseInt(digits[12])) return false

  soma = 0
  for (let i = 0; i < 13; i++) soma += parseInt(digits[i]) * pesos2[i]
  resto = soma % 11
  const dig2 = resto < 2 ? 0 : 11 - resto
  if (dig2 !== parseInt(digits[13])) return false

  return true
}

/** Valida CNPJ ou CPF (detecta pelo tamanho) */
export function validateCNPJorCPF(value: string): boolean {
  const digits = value.replace(/\D/g, "")
  if (digits.length === 11) return validateCPF(value)
  if (digits.length === 14) return validateCNPJ(value)
  return false
}

// ============================================
// APIs DE CONSULTA
// ============================================

export interface DadosCEP {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

/** Busca endereço pelo CEP (API ViaCEP) */
export async function fetchCEP(cep: string): Promise<DadosCEP | null> {
  const digits = cep.replace(/\D/g, "")
  if (digits.length !== 8) return null

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    const data = await response.json()
    if (data.erro) return null

    return {
      cep: data.cep,
      logradouro: data.logradouro || "",
      complemento: data.complemento || "",
      bairro: data.bairro || "",
      cidade: data.localidade || "",
      uf: data.uf || "",
    }
  } catch {
    return null
  }
}

export interface DadosCNPJ {
  cnpj: string
  razaoSocial: string
  nomeFantasia: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  cep: string
  email: string
  telefone: string
}

/** Busca dados da empresa pelo CNPJ (API pública) */
export async function fetchCNPJ(cnpj: string): Promise<DadosCNPJ | null> {
  const digits = cnpj.replace(/\D/g, "")
  if (digits.length !== 14) return null
  if (!validateCNPJ(cnpj)) return null

  try {
    const response = await fetch(`https://publica.cnpj.ws/cnpj/${digits}`)
    if (!response.ok) return null

    const data = await response.json()
    const est = data.estabelecimento || {}

    return {
      cnpj: digits,
      razaoSocial: data.razao_social || "",
      nomeFantasia: est.nome_fantasia || "",
      logradouro: ((est.tipo_logradouro || "") + " " + (est.logradouro || "")).trim(),
      numero: est.numero || "",
      complemento: est.complemento || "",
      bairro: est.bairro || "",
      cidade: est.cidade?.nome || "",
      uf: est.estado?.sigla || "",
      cep: est.cep || "",
      email: (est.email || "").toLowerCase(),
      telefone: est.ddd1 && est.telefone1 ? `(${est.ddd1}) ${est.telefone1}` : "",
    }
  } catch {
    return null
  }
}

// ============================================
// CONSTANTES COMPARTILHADAS
// ============================================

export const UFS_BRASIL = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const

export const ESTADOS_CIVIS = [
  "Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável",
] as const

export const QUALIDADES_VINCULO = [
  "Diretor", "Presidente", "Sócio", "Gerente",
  "Administrador", "Procurador", "Responsável Técnico", "Representante Legal",
] as const

export const UNIDADES_IEF = [
  "URFBio Alto Médio São Francisco",
  "URFBio Alto Paranaíba",
  "URFBio Centro Norte",
  "URFBio Centro Oeste",
  "URFBio Centro-Sul",
  "URFBio Jequitinhonha",
  "URFBio Mata",
  "URFBio Metropolitana",
  "URFBio Nordeste",
  "URFBio Noroeste",
  "URFBio Norte",
  "URFBio Rio Doce",
  "URFBio Sul",
  "URFBio Triângulo",
] as const

export const TIPOS_LICENCA = [
  "LP", "LI", "LP+LI", "LIC", "LO", "LOC", "RevLO",
] as const

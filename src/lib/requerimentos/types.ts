/**
 * Tipos dos 3 requerimentos — modelo oficial do Estado de MG
 *
 * Estrutura espelha exatamente os formulários do ACAM1:
 * - req-mineraria: Anexo I, Lei 20.922/2013
 * - req-mata-atlantica: Anexo I, Portaria IEF 30/2015
 * - req-snuc: Portaria IEF 55
 */

// ============================================
// SEÇÃO 1 — RESPONSÁVEL (quem assina)
// ============================================

export interface DadosResponsavel {
  nomeCompleto: string
  nacionalidade: string
  estadoCivil: string
  rg: string
  cpf: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  qualidade: string // vínculo com empreendimento
  unidadeIEF: string // só minerária e mata atlântica
}

// ============================================
// SEÇÃO 2 — EMPREENDEDOR
// ============================================

export interface DadosEmpreendedor {
  cnpjCpf: string
  razaoSocial: string
  nomeFantasia: string
  ie: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  telefone: string
  email: string
  caixaPostal: string
}

// ============================================
// SEÇÃO 3 — CORRESPONDÊNCIA
// ============================================

export interface DadosCorrespondencia {
  tipo: "empreendedor" | "empreendimento" | "outro"
  destinatario: string
  vinculo: string
  cep: string
  endereco: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
  telefone: string
  email: string
  caixaPostal: string
}

// ============================================
// SEÇÃO 4 — PROCESSO (Minerária)
// ============================================

export interface ProcessoMineraria {
  processoAdmin: string
  certificadoLicenca: string
  tipoLicenca: string
  validadeAto: string
  dataAprovacao: string
  condicionante: string
  areaOcupada: string
  outrosProc: "sim" | "nao"
  outrosProcNum: string
  dnpm: string
}

// ============================================
// SEÇÃO 4 — PROCESSO (Mata Atlântica)
// ============================================

export interface ProcessoMataAtlantica {
  processoCOPAM: string
  certificadoLicenca: string
  tipoLicenca: string
  validadeLicenca: string
  dataAprovacao: string
  condicionante: string
  outrosProc: "sim" | "nao"
  outrosProcNum: string
  processoDesmate: string
  apefNum: string
  apefValidade: string
  daiaNum: string
  daiaValidade: string
}

// ============================================
// SEÇÃO 5 — PROCESSO (SNUC)
// ============================================

export interface ProcessoSNUC {
  processoCopam: string
  certificadoLicenca: string
  tipoLicenca: string
  validadeLicenca: string
  dataAprovacao: string
  condicionante: string
  outrosProc: "sim" | "nao"
  outrosProcNum: string
  dataImplantacao: string
  ampliacao: "sim" | "nao"
  processoPrincipal: string
  compCumprida: "sim" | "nao" | ""
  termoCompromisso: string
  motivoNaoCumprida: string
  revalidacao: "sim" | "nao"
  procCompensados: string
}

// ============================================
// SEÇÃO 6 — UCs (SNUC)
// ============================================

export interface DadosUCs {
  uc3km: "sim" | "nao"
  uc3kmNomes: string
  ucInserido: "sim" | "nao"
  ucInseridoNomes: string
  ucZA: "sim" | "nao"
  ucZANomes: string
}

// ============================================
// FORMS COMPLETOS
// ============================================

export interface FormMineraria {
  responsavel: DadosResponsavel
  empreendedor: DadosEmpreendedor
  correspondencia: DadosCorrespondencia
  processo: ProcessoMineraria
}

export interface FormMataAtlantica {
  responsavel: DadosResponsavel
  empreendedor: DadosEmpreendedor
  correspondencia: DadosCorrespondencia
  processo: ProcessoMataAtlantica
}

export interface FormSNUC {
  responsavel: DadosResponsavel
  empreendedor: DadosEmpreendedor
  empreendimento: DadosEmpreendedor // seção 3 separada no SNUC
  correspondencia: DadosCorrespondencia
  processo: ProcessoSNUC
  ucs: DadosUCs
}

// ============================================
// VALORES INICIAIS
// ============================================

export const responsavelInicial: DadosResponsavel = {
  nomeCompleto: "",
  nacionalidade: "Brasileiro(a)",
  estadoCivil: "",
  rg: "",
  cpf: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  qualidade: "",
  unidadeIEF: "",
}

export const empreendedorInicial: DadosEmpreendedor = {
  cnpjCpf: "",
  razaoSocial: "",
  nomeFantasia: "",
  ie: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "MG",
  telefone: "",
  email: "",
  caixaPostal: "",
}

export const correspondenciaInicial: DadosCorrespondencia = {
  tipo: "empreendedor",
  destinatario: "",
  vinculo: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "MG",
  telefone: "",
  email: "",
  caixaPostal: "",
}

export const processoMinerariaInicial: ProcessoMineraria = {
  processoAdmin: "",
  certificadoLicenca: "",
  tipoLicenca: "",
  validadeAto: "",
  dataAprovacao: "",
  condicionante: "",
  areaOcupada: "",
  outrosProc: "nao",
  outrosProcNum: "",
  dnpm: "",
}

export const processoMataAtlanticaInicial: ProcessoMataAtlantica = {
  processoCOPAM: "",
  certificadoLicenca: "",
  tipoLicenca: "",
  validadeLicenca: "",
  dataAprovacao: "",
  condicionante: "",
  outrosProc: "nao",
  outrosProcNum: "",
  processoDesmate: "",
  apefNum: "",
  apefValidade: "",
  daiaNum: "",
  daiaValidade: "",
}

export const processoSNUCInicial: ProcessoSNUC = {
  processoCopam: "",
  certificadoLicenca: "",
  tipoLicenca: "",
  validadeLicenca: "",
  dataAprovacao: "",
  condicionante: "",
  outrosProc: "nao",
  outrosProcNum: "",
  dataImplantacao: "",
  ampliacao: "nao",
  processoPrincipal: "",
  compCumprida: "",
  termoCompromisso: "",
  motivoNaoCumprida: "",
  revalidacao: "nao",
  procCompensados: "",
}

export const ucsInicial: DadosUCs = {
  uc3km: "nao",
  uc3kmNomes: "",
  ucInserido: "nao",
  ucInseridoNomes: "",
  ucZA: "nao",
  ucZANomes: "",
}

export const CUSTO_REQUERIMENTO = 0.5

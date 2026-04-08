"use client"

import { type ReactNode } from "react"
import Link from "next/link"
import {
  maskCPF,
  maskCNPJ,
  maskCEP,
  maskTel,
  fetchCEP,
  fetchCNPJ,
  ESTADOS_CIVIS,
  QUALIDADES_VINCULO,
  UNIDADES_IEF,
  TIPOS_LICENCA,
  UFS_BRASIL,
} from "@/lib/masks"
import type {
  DadosResponsavel,
  DadosEmpreendedor,
  DadosCorrespondencia,
} from "@/lib/requerimentos/types"

// ============================================
// WIZARD SHELL
// ============================================

interface WizardShellProps {
  titulo: string
  subtitulo: string
  custoCreditos: number
  etapas: string[]
  etapaAtual: number
  children: ReactNode
  onVoltar: () => void
  onProximo: () => void
  podAvancar: boolean
  ehUltimo: boolean
  loading?: boolean
  erro?: string
}

export function WizardShell({
  titulo,
  subtitulo,
  custoCreditos,
  etapas,
  etapaAtual,
  children,
  onVoltar,
  onProximo,
  podAvancar,
  ehUltimo,
  loading,
  erro,
}: WizardShellProps) {
  return (
    <div>
      <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "var(--spacing-4) var(--spacing-6) 0" }}>
        <Link href="/dashboard" className="text-sm text-muted-foreground inline-flex items-center gap-1" style={{ textDecoration: "none" }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Voltar ao dashboard
        </Link>
      </div>

      <div className="acam-service-header acam-service-header-primary">
        <div className="acam-service-header-content">
          <div className="acam-service-header-info">
            <div className="acam-service-header-icon">R</div>
            <div className="acam-service-header-text">
              <h1>{titulo}</h1>
              <p>{subtitulo}</p>
            </div>
          </div>
          <div className="acam-service-header-cost">
            <div className="acam-service-header-cost-label">Custo</div>
            <div className="acam-service-header-cost-value">{custoCreditos} créditos</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "var(--spacing-6)", width: "100%" }}>
        <div className="acam-wizard">
          {etapas.map((nome, i) => (
            <div key={i} style={{ display: "contents" }}>
              {i > 0 && <div className="acam-wizard-sep" />}
              <div className={`acam-wizard-step${i === etapaAtual ? " acam-wizard-step-active" : ""}${i < etapaAtual ? " acam-wizard-step-completed" : ""}`}>
                <div className="acam-wizard-num">{i < etapaAtual ? "✓" : i + 1}</div>
                <span>{nome}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="acam-card" style={{ padding: "var(--spacing-6)", marginTop: "var(--spacing-6)" }}>
          {children}
        </div>

        {erro && (
          <div className="acam-alert acam-alert-error" style={{ marginTop: "var(--spacing-4)" }}>{erro}</div>
        )}

        <div className="acam-wizard-nav" style={{ marginTop: "var(--spacing-4)" }}>
          {etapaAtual > 0 ? (
            <button className="acam-btn acam-btn-secondary" onClick={onVoltar}>← Voltar</button>
          ) : <div />}
          <button
            className="acam-btn acam-btn-primary"
            onClick={onProximo}
            disabled={!podAvancar || loading}
          >
            {loading ? "Gerando..." : ehUltimo ? "Gerar PDF do requerimento" : "Próximo →"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// STEP: RESPONSÁVEL (Seção 1 — quem assina)
// ============================================

interface StepResponsavelProps {
  dados: DadosResponsavel
  onChange: (d: DadosResponsavel) => void
  mostrarUnidadeIEF?: boolean
}

export function StepResponsavel({ dados, onChange, mostrarUnidadeIEF = true }: StepResponsavelProps) {
  function set<K extends keyof DadosResponsavel>(campo: K, valor: DadosResponsavel[K]) {
    onChange({ ...dados, [campo]: valor })
  }

  return (
    <>
      <div className="acam-section-title">1. Requerimento para Formalização</div>
      <div className="acam-section-desc">Dados do responsável pelo preenchimento</div>

      <div className="acam-field">
        <label>Nome Completo <span className="req">*</span></label>
        <input className="acam-form-input" placeholder="Nome completo do representante" value={dados.nomeCompleto} onChange={(e) => set("nomeCompleto", e.target.value)} />
      </div>

      <div className="acam-fg acam-fg-2">
        <div className="acam-field">
          <label>Nacionalidade</label>
          <input className="acam-form-input" value={dados.nacionalidade} onChange={(e) => set("nacionalidade", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>Estado Civil</label>
          <select className="acam-form-input acam-form-select" value={dados.estadoCivil} onChange={(e) => set("estadoCivil", e.target.value)}>
            <option value="">Selecione</option>
            {ESTADOS_CIVIS.map((ec) => <option key={ec} value={ec}>{ec}</option>)}
          </select>
        </div>
      </div>

      <div className="acam-fg acam-fg-2">
        <div className="acam-field">
          <label>RG <span className="req">*</span></label>
          <input className="acam-form-input" placeholder="00.000.000-0" value={dados.rg} onChange={(e) => set("rg", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>CPF <span className="req">*</span></label>
          <input className="acam-form-input" maxLength={14} placeholder="000.000.000-00" value={dados.cpf} onChange={(e) => set("cpf", maskCPF(e.target.value))} />
        </div>
      </div>

      <div className="acam-fg acam-fg-2">
        <div className="acam-field">
          <label>CEP</label>
          <div className="acam-input-with-action">
            <input className="acam-form-input" maxLength={9} placeholder="00000-000" value={dados.cep} onChange={(e) => set("cep", maskCEP(e.target.value))} />
            <button className="acam-btn acam-btn-secondary acam-btn-sm" type="button" onClick={async () => {
              const result = await fetchCEP(dados.cep)
              if (result) onChange({ ...dados, endereco: result.logradouro || dados.endereco, bairro: result.bairro || dados.bairro, cidade: result.cidade || dados.cidade })
            }}>Buscar</button>
          </div>
        </div>
        <div className="acam-field">
          <label>Endereço</label>
          <input className="acam-form-input" placeholder="Rua, Av., Alameda..." value={dados.endereco} onChange={(e) => set("endereco", e.target.value)} />
        </div>
      </div>

      <div className="acam-fg acam-fg-4">
        <div className="acam-field">
          <label>Nº</label>
          <input className="acam-form-input" value={dados.numero} onChange={(e) => set("numero", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>Complemento</label>
          <input className="acam-form-input" value={dados.complemento} onChange={(e) => set("complemento", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>Bairro</label>
          <input className="acam-form-input" value={dados.bairro} onChange={(e) => set("bairro", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>Cidade</label>
          <input className="acam-form-input" value={dados.cidade} onChange={(e) => set("cidade", e.target.value)} />
        </div>
      </div>

      <div className="acam-field">
        <label>Qualidade/Vínculo com o Empreendimento <span className="req">*</span></label>
        <select className="acam-form-input acam-form-select" value={dados.qualidade} onChange={(e) => set("qualidade", e.target.value)}>
          <option value="">Selecione</option>
          {QUALIDADES_VINCULO.map((q) => <option key={q} value={q}>{q}</option>)}
        </select>
      </div>

      {mostrarUnidadeIEF && (
        <div className="acam-field">
          <label>Unidade Regional do IEF <span className="req">*</span></label>
          <select className="acam-form-input acam-form-select" value={dados.unidadeIEF} onChange={(e) => set("unidadeIEF", e.target.value)}>
            <option value="">Selecione a Unidade Regional</option>
            {UNIDADES_IEF.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      )}
    </>
  )
}

// ============================================
// STEP: EMPREENDEDOR (Seção 2)
// ============================================

interface StepEmpreendedorProps {
  titulo?: string
  descricao?: string
  dados: DadosEmpreendedor
  onChange: (d: DadosEmpreendedor) => void
  buscandoCNPJ?: boolean
  onBuscarCNPJ?: () => void
}

export function StepEmpreendedor({ titulo, descricao, dados, onChange, buscandoCNPJ, onBuscarCNPJ }: StepEmpreendedorProps) {
  function set<K extends keyof DadosEmpreendedor>(campo: K, valor: DadosEmpreendedor[K]) {
    onChange({ ...dados, [campo]: valor })
  }

  return (
    <>
      <div className="acam-section-title">{titulo || "2. Identificação do Empreendedor"}</div>
      <div className="acam-section-desc">{descricao || "Responsável pelo processo de intervenção ambiental"}</div>

      <div className="acam-field">
        <label>CNPJ/CPF <span className="req">*</span></label>
        <div className="acam-input-with-action">
          <input className="acam-form-input" maxLength={18} placeholder="00.000.000/0000-00" value={dados.cnpjCpf} onChange={(e) => set("cnpjCpf", maskCNPJ(e.target.value))} />
          <button className="acam-btn acam-btn-secondary acam-btn-sm" type="button" onClick={onBuscarCNPJ} disabled={buscandoCNPJ}>
            {buscandoCNPJ ? "..." : "Buscar"}
          </button>
        </div>
      </div>

      <div className="acam-field">
        <label>Razão Social / Nome <span className="req">*</span></label>
        <input className="acam-form-input" value={dados.razaoSocial} onChange={(e) => set("razaoSocial", e.target.value)} />
      </div>

      <div className="acam-fg acam-fg-2">
        <div className="acam-field">
          <label>Nome Fantasia</label>
          <input className="acam-form-input" value={dados.nomeFantasia} onChange={(e) => set("nomeFantasia", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>Inscrição Estadual</label>
          <input className="acam-form-input" value={dados.ie} onChange={(e) => set("ie", e.target.value)} />
        </div>
      </div>

      <div className="acam-fg acam-fg-2">
        <div className="acam-field">
          <label>CEP</label>
          <div className="acam-input-with-action">
            <input className="acam-form-input" maxLength={9} placeholder="00000-000" value={dados.cep} onChange={(e) => set("cep", maskCEP(e.target.value))} />
            <button className="acam-btn acam-btn-secondary acam-btn-sm" type="button" onClick={async () => {
              const result = await fetchCEP(dados.cep)
              if (result) onChange({ ...dados, endereco: result.logradouro || dados.endereco, bairro: result.bairro || dados.bairro, cidade: result.cidade || dados.cidade, uf: result.uf || dados.uf })
            }}>Buscar</button>
          </div>
        </div>
        <div className="acam-field">
          <label>Endereço</label>
          <input className="acam-form-input" value={dados.endereco} onChange={(e) => set("endereco", e.target.value)} />
        </div>
      </div>

      <div className="acam-fg acam-fg-4">
        <div className="acam-field">
          <label>Nº</label>
          <input className="acam-form-input" value={dados.numero} onChange={(e) => set("numero", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>Complemento</label>
          <input className="acam-form-input" value={dados.complemento} onChange={(e) => set("complemento", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>Bairro</label>
          <input className="acam-form-input" value={dados.bairro} onChange={(e) => set("bairro", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>Município</label>
          <input className="acam-form-input" value={dados.cidade} onChange={(e) => set("cidade", e.target.value)} />
        </div>
      </div>

      <div className="acam-fg acam-fg-3">
        <div className="acam-field">
          <label>UF</label>
          <select className="acam-form-input acam-form-select" value={dados.uf} onChange={(e) => set("uf", e.target.value)}>
            {UFS_BRASIL.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>
        <div className="acam-field">
          <label>Telefone</label>
          <input className="acam-form-input" maxLength={15} placeholder="(00) 00000-0000" value={dados.telefone} onChange={(e) => set("telefone", maskTel(e.target.value))} />
        </div>
        <div className="acam-field">
          <label>E-mail</label>
          <input className="acam-form-input" type="email" value={dados.email} onChange={(e) => set("email", e.target.value)} />
        </div>
      </div>

      <div className="acam-field">
        <label>Caixa Postal</label>
        <input className="acam-form-input" value={dados.caixaPostal} onChange={(e) => set("caixaPostal", e.target.value)} />
      </div>
    </>
  )
}

// ============================================
// STEP: CORRESPONDÊNCIA (Seção 3)
// ============================================

interface StepCorrespondenciaProps {
  dados: DadosCorrespondencia
  onChange: (d: DadosCorrespondencia) => void
  opcaoEmpreendimento?: boolean // SNUC tem 3 opções
}

export function StepCorrespondencia({ dados, onChange, opcaoEmpreendimento }: StepCorrespondenciaProps) {
  function set<K extends keyof DadosCorrespondencia>(campo: K, valor: DadosCorrespondencia[K]) {
    onChange({ ...dados, [campo]: valor })
  }

  return (
    <>
      <div className="acam-section-title">Endereço para Correspondência</div>
      <div className="acam-section-desc">Endereço para recebimento de notificações do IEF</div>

      <div className="acam-alert acam-alert-warning" style={{ marginBottom: "1rem" }}>
        Informe endereço em <strong>área urbana</strong>. Os Correios não entregam correspondência em área rural.
      </div>

      <div className="acam-field">
        <label>Utilizar endereço:</label>
        <div className="acam-radio-group">
          <label>
            <input type="radio" name="corresp" checked={dados.tipo === "empreendedor"} onChange={() => set("tipo", "empreendedor")} />
            Repetir Campo 2 (Empreendedor)
          </label>
          {opcaoEmpreendimento && (
            <label>
              <input type="radio" name="corresp" checked={dados.tipo === "empreendimento"} onChange={() => set("tipo", "empreendimento")} />
              Repetir Campo 3 (Empreendimento)
            </label>
          )}
          <label>
            <input type="radio" name="corresp" checked={dados.tipo === "outro"} onChange={() => set("tipo", "outro")} />
            Outro endereço
          </label>
        </div>
      </div>

      {dados.tipo === "outro" && (
        <>
          <div className="acam-fg acam-fg-2">
            <div className="acam-field">
              <label>Destinatário <span className="req">*</span></label>
              <input className="acam-form-input" placeholder="Nome de quem vai receber" value={dados.destinatario} onChange={(e) => set("destinatario", e.target.value)} />
            </div>
            <div className="acam-field">
              <label>Vínculo com a empresa</label>
              <input className="acam-form-input" placeholder="Ex: Gerente Ambiental" value={dados.vinculo} onChange={(e) => set("vinculo", e.target.value)} />
            </div>
          </div>

          <div className="acam-fg acam-fg-2">
            <div className="acam-field">
              <label>CEP <span className="req">*</span></label>
              <div className="acam-input-with-action">
                <input className="acam-form-input" maxLength={9} placeholder="00000-000" value={dados.cep} onChange={(e) => set("cep", maskCEP(e.target.value))} />
                <button className="acam-btn acam-btn-secondary acam-btn-sm" type="button" onClick={async () => {
                  const result = await fetchCEP(dados.cep)
                  if (result) onChange({ ...dados, endereco: result.logradouro || dados.endereco, bairro: result.bairro || dados.bairro, cidade: result.cidade || dados.cidade, uf: result.uf || dados.uf })
                }}>Buscar</button>
              </div>
            </div>
            <div className="acam-field">
              <label>Endereço <span className="req">*</span></label>
              <input className="acam-form-input" value={dados.endereco} onChange={(e) => set("endereco", e.target.value)} />
            </div>
          </div>

          <div className="acam-fg acam-fg-4">
            <div className="acam-field">
              <label>Nº</label>
              <input className="acam-form-input" value={dados.numero} onChange={(e) => set("numero", e.target.value)} />
            </div>
            <div className="acam-field">
              <label>Complemento</label>
              <input className="acam-form-input" value={dados.complemento} onChange={(e) => set("complemento", e.target.value)} />
            </div>
            <div className="acam-field">
              <label>Bairro</label>
              <input className="acam-form-input" value={dados.bairro} onChange={(e) => set("bairro", e.target.value)} />
            </div>
            <div className="acam-field">
              <label>Município</label>
              <input className="acam-form-input" value={dados.cidade} onChange={(e) => set("cidade", e.target.value)} />
            </div>
          </div>

          <div className="acam-fg acam-fg-3">
            <div className="acam-field">
              <label>UF</label>
              <select className="acam-form-input acam-form-select" value={dados.uf} onChange={(e) => set("uf", e.target.value)}>
                {UFS_BRASIL.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
            <div className="acam-field">
              <label>Telefone</label>
              <input className="acam-form-input" maxLength={15} value={dados.telefone} onChange={(e) => set("telefone", maskTel(e.target.value))} />
            </div>
            <div className="acam-field">
              <label>E-mail</label>
              <input className="acam-form-input" type="email" value={dados.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ============================================
// SUMMARY HELPERS
// ============================================

export function SummaryItem({ label, valor }: { label: string; valor: string }) {
  if (!valor) return null
  return (
    <div className="acam-summary-item">
      <span className="acam-summary-label">{label}</span>
      <span className="acam-summary-value">{valor}</span>
    </div>
  )
}

export function SummaryCard({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="acam-summary-card">
      <div className="acam-summary-title">{titulo}</div>
      {children}
    </div>
  )
}

// ============================================
// BUSCA CNPJ PARA EMPREENDEDOR
// ============================================

export async function buscarCNPJEmpreendedor(
  cnpj: string,
  emp: DadosEmpreendedor,
  setEmp: (d: DadosEmpreendedor) => void,
  setLoading: (v: boolean) => void,
) {
  setLoading(true)
  const result = await fetchCNPJ(cnpj)
  if (result) {
    setEmp({
      ...emp,
      razaoSocial: result.razaoSocial || emp.razaoSocial,
      nomeFantasia: result.nomeFantasia || emp.nomeFantasia,
      endereco: result.logradouro || emp.endereco,
      numero: result.numero || emp.numero,
      complemento: result.complemento || emp.complemento,
      bairro: result.bairro || emp.bairro,
      cidade: result.cidade || emp.cidade,
      uf: result.uf || emp.uf,
      cep: result.cep ? maskCEP(result.cep) : emp.cep,
      email: result.email || emp.email,
      telefone: result.telefone || emp.telefone,
    })
  }
  setLoading(false)
}

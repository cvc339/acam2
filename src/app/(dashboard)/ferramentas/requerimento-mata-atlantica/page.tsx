"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  WizardShell,
  StepResponsavel,
  StepEmpreendedor,
  StepCorrespondencia,
  SummaryCard,
  SummaryItem,
  buscarCNPJEmpreendedor,
} from "@/components/acam/wizard-requerimento"
import {
  type FormMataAtlantica,
  type ProcessoMataAtlantica,
  responsavelInicial,
  empreendedorInicial,
  correspondenciaInicial,
  processoMataAtlanticaInicial,
  CUSTO_REQUERIMENTO,
} from "@/lib/requerimentos/types"
import { TIPOS_LICENCA } from "@/lib/masks"
import { DatePicker } from "@/components/acam/date-picker"
import { downloadPDF } from "@/lib/pdf/download"
import { debitarCreditos } from "@/lib/creditos/client"

const ETAPAS = ["Responsável", "Empreendedor", "Correspondência", "Processo", "Gerar"]

export default function RequerimentoMataAtlanticaPage() {
  const router = useRouter()
  const [etapa, setEtapa] = useState(0)
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false)
  const [concluido, setConcluido] = useState(false)

  const [form, setForm] = useState<FormMataAtlantica>({
    responsavel: responsavelInicial,
    empreendedor: empreendedorInicial,
    correspondencia: correspondenciaInicial,
    processo: processoMataAtlanticaInicial,
  })

  function validarEtapa(): boolean {
    setErro("")
    const r = form.responsavel
    const e = form.empreendedor

    switch (etapa) {
      case 0:
        if (!r.nomeCompleto) return fail("Informe o nome completo.")
        if (!r.rg) return fail("Informe o RG.")
        if (!r.cpf) return fail("Informe o CPF.")
        if (!r.qualidade) return fail("Selecione a qualidade/vínculo.")
        return true
      case 1:
        if (!e.cnpjCpf) return fail("Informe o CNPJ/CPF do empreendedor.")
        if (!e.razaoSocial) return fail("Informe a razão social.")
        return true
      case 2:
        return true
      case 3:
        return true
      default:
        return true
    }
  }

  function fail(msg: string) { setErro(msg); return false }

  function avancar() {
    if (!validarEtapa()) return
    if (etapa === ETAPAS.length - 1) {
      gerarPDF()
    } else {
      setEtapa((e) => e + 1)
    }
  }

  async function gerarPDF() {
    setLoading(true)
    setErro("")
    try {
      // Debitar créditos antes de gerar
      const debito = await debitarCreditos(CUSTO_REQUERIMENTO, "req-mata-atlantica", `Requerimento Mata Atlântica — ${form.empreendedor.razaoSocial || "N/A"}`)
      if (!debito.ok) { setErro(debito.erro); setLoading(false); return }

      // Gerar PDF
      const res = await fetch("/api/pdf/requerimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "mata-atlantica", form }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErro(data.erro || "Erro ao gerar PDF.")
        setLoading(false)
        return
      }
      await downloadPDF(res, "Requerimento_Compensacao_Mata_Atlantica.pdf")
      setConcluido(true)
      router.refresh()
    } catch {
      setErro("Erro ao gerar PDF. Tente novamente.")
    }
    setLoading(false)
  }

  if (concluido) {
    return (
      <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "var(--spacing-8) var(--spacing-6)", textAlign: "center" }}>
        <div className="acam-card">
          <div style={{ fontSize: "3rem", marginBottom: "var(--spacing-4)" }}>✓</div>
          <h2 style={{ color: "var(--primary-600)", marginBottom: "var(--spacing-2)" }}>PDF Gerado!</h2>
          <p className="text-sm text-muted-foreground mb-6">O requerimento foi baixado com sucesso. Lembre-se de anexar os documentos necessários.</p>
          <div style={{ display: "flex", gap: "var(--spacing-3)", justifyContent: "center", flexWrap: "wrap" }}>
            <button className="acam-btn acam-btn-secondary" onClick={async () => {
              const res = await fetch("/api/pdf/requerimento", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "mata-atlantica", form }) })
              if (res.ok) { await downloadPDF(res, "Requerimento_Compensacao_Mata_Atlantica.pdf") }
            }}>Baixar Novamente</button>
            <button className="acam-btn acam-btn-primary" onClick={() => { setConcluido(false); setEtapa(0); setForm({ responsavel: responsavelInicial, empreendedor: empreendedorInicial, correspondencia: correspondenciaInicial, processo: processoMataAtlanticaInicial }) }}>
              Novo Requerimento
            </button>
          </div>
          <Link href="/dashboard" className="text-sm text-muted-foreground mt-4 inline-block" style={{ textDecoration: "none" }}>← Voltar ao dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <WizardShell
      titulo="Requerimento Compensação Mata Atlântica"
      subtitulo="Portaria IEF nº 30/2015"
      custoCreditos={CUSTO_REQUERIMENTO}
      etapas={ETAPAS}
      etapaAtual={etapa}
      onVoltar={() => { setErro(""); setEtapa((e) => e - 1) }}
      onProximo={avancar}
      podAvancar={true}
      ehUltimo={etapa === ETAPAS.length - 1}
      loading={loading}
      erro={erro}
    >
      {etapa === 0 && (
        <StepResponsavel
          dados={form.responsavel}
          onChange={(d) => setForm({ ...form, responsavel: d })}
          mostrarUnidadeIEF={false}
        />
      )}

      {etapa === 1 && (
        <StepEmpreendedor
          dados={form.empreendedor}
          onChange={(d) => setForm({ ...form, empreendedor: d })}
          buscandoCNPJ={buscandoCNPJ}
          onBuscarCNPJ={() => buscarCNPJEmpreendedor(form.empreendedor.cnpjCpf, form.empreendedor, (d) => setForm((f) => ({ ...f, empreendedor: d })), setBuscandoCNPJ)}
        />
      )}

      {etapa === 2 && (
        <StepCorrespondencia
          dados={form.correspondencia}
          onChange={(d) => setForm({ ...form, correspondencia: d })}
        />
      )}

      {etapa === 3 && (
        <StepProcessoMA
          dados={form.processo}
          onChange={(d) => setForm({ ...form, processo: d })}
        />
      )}

      {etapa === 4 && (
        <StepRevisaoMA form={form} />
      )}
    </WizardShell>
  )
}

// ============================================
// STEP: PROCESSO MATA ATLÂNTICA (Seção 4)
// ============================================

function StepProcessoMA({ dados, onChange }: { dados: ProcessoMataAtlantica; onChange: (d: ProcessoMataAtlantica) => void }) {
  function set<K extends keyof ProcessoMataAtlantica>(campo: K, valor: ProcessoMataAtlantica[K]) {
    onChange({ ...dados, [campo]: valor })
  }

  return (
    <>
      <div className="acam-section-title">4. Identificação do Processo de Licenciamento/Intervenção Ambiental</div>
      <div className="acam-section-desc">Dados do processo COPAM e licença concedida</div>

      <div className="acam-fg acam-fg-2">
        <div className="acam-field">
          <label>4.1 - Processo COPAM Nº <span className="req">*</span></label>
          <input className="acam-form-input" placeholder="00000/0000/000/0000" value={dados.processoCOPAM} onChange={(e) => set("processoCOPAM", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>4.2 - Certificado de Licença/Tipo/Nº <span className="req">*</span></label>
          <input className="acam-form-input" value={dados.certificadoLicenca} onChange={(e) => set("certificadoLicenca", e.target.value)} />
        </div>
      </div>

      <div className="acam-fg acam-fg-3">
        <div className="acam-field">
          <label>Tipo de Licença</label>
          <select className="acam-form-input acam-form-select" value={dados.tipoLicenca} onChange={(e) => set("tipoLicenca", e.target.value)}>
            <option value="">Selecione</option>
            {TIPOS_LICENCA.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="acam-field">
          <label>4.3 - Validade da Licença (anos)</label>
          <input className="acam-form-input" type="number" min="1" max="20" value={dados.validadeLicenca} onChange={(e) => set("validadeLicenca", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>4.4 - Data Aprovação junto à URC/COPAM</label>
          <DatePicker value={dados.dataAprovacao} onChange={(v) => set("dataAprovacao", v)} />
        </div>
      </div>

      <div className="acam-field">
        <label>4.5 - Nº Condicionante Compensação Florestal</label>
        <input className="acam-form-input" style={{ maxWidth: "150px" }} value={dados.condicionante} onChange={(e) => set("condicionante", e.target.value)} />
      </div>

      <div className="acam-field">
        <label>4.6 - Outros processos vinculados</label>
        <div className="acam-radio-group">
          <label><input type="radio" name="outrosProc" checked={dados.outrosProc === "nao"} onChange={() => set("outrosProc", "nao")} /> NÃO</label>
          <label><input type="radio" name="outrosProc" checked={dados.outrosProc === "sim"} onChange={() => set("outrosProc", "sim")} /> SIM</label>
        </div>
      </div>
      {dados.outrosProc === "sim" && (
        <div className="acam-field">
          <label>Nº do(s) Processo(s):</label>
          <textarea className="acam-form-input" rows={2} value={dados.outrosProcNum} onChange={(e) => set("outrosProcNum", e.target.value)} />
        </div>
      )}

      <div className="acam-field">
        <label>4.7 - Processo de Intervenção Ambiental (Desmate)</label>
        <input className="acam-form-input" value={dados.processoDesmate} onChange={(e) => set("processoDesmate", e.target.value)} />
      </div>

      <div className="acam-fg acam-fg-2">
        <div className="acam-field">
          <label>4.8 - APEF Nº</label>
          <input className="acam-form-input" value={dados.apefNum} onChange={(e) => set("apefNum", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>Válida até</label>
          <DatePicker value={dados.apefValidade} onChange={(v) => set("apefValidade", v)} />
        </div>
      </div>

      <div className="acam-fg acam-fg-2">
        <div className="acam-field">
          <label>4.9 - DAIA Nº</label>
          <input className="acam-form-input" value={dados.daiaNum} onChange={(e) => set("daiaNum", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>Válido até</label>
          <DatePicker value={dados.daiaValidade} onChange={(v) => set("daiaValidade", v)} />
        </div>
      </div>
    </>
  )
}

// ============================================
// STEP: REVISÃO MATA ATLÂNTICA
// ============================================

function StepRevisaoMA({ form }: { form: FormMataAtlantica }) {
  const r = form.responsavel
  const e = form.empreendedor
  const p = form.processo

  return (
    <>
      <div className="acam-section-title">Revisar e Gerar PDF</div>
      <div className="acam-section-desc">Confira os dados antes de baixar o documento</div>

      <SummaryCard titulo="1. Responsável">
        <SummaryItem label="Nome" valor={r.nomeCompleto} />
        <SummaryItem label="CPF" valor={r.cpf} />
        <SummaryItem label="RG" valor={r.rg} />
        <SummaryItem label="Qualidade" valor={r.qualidade} />
      </SummaryCard>

      <SummaryCard titulo="2. Empreendedor">
        <SummaryItem label="Razão Social" valor={e.razaoSocial} />
        <SummaryItem label="CNPJ/CPF" valor={e.cnpjCpf} />
        <SummaryItem label="Município/UF" valor={`${e.cidade}/${e.uf}`} />
      </SummaryCard>

      <SummaryCard titulo="3. Correspondência">
        <SummaryItem label="Tipo" valor={form.correspondencia.tipo === "empreendedor" ? "Repetir Campo 2" : "Outro endereço"} />
      </SummaryCard>

      <SummaryCard titulo="4. Processo">
        <SummaryItem label="Processo COPAM" valor={p.processoCOPAM} />
        <SummaryItem label="Licença" valor={`${p.certificadoLicenca} / ${p.tipoLicenca}`} />
        <SummaryItem label="Condicionante" valor={p.condicionante} />
        <SummaryItem label="APEF" valor={p.apefNum || "N/A"} />
        <SummaryItem label="DAIA" valor={p.daiaNum || "N/A"} />
      </SummaryCard>

      <div className="acam-alert acam-alert-result" style={{ marginTop: "1rem" }}>
        Este serviço consome <strong>{CUSTO_REQUERIMENTO} crédito</strong>
      </div>
    </>
  )
}

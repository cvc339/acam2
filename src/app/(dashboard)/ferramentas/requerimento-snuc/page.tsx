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
  type FormSNUC,
  type ProcessoSNUC,
  type DadosUCs,
  responsavelInicial,
  empreendedorInicial,
  correspondenciaInicial,
  processoSNUCInicial,
  ucsInicial,
  CUSTO_REQUERIMENTO,
} from "@/lib/requerimentos/types"
import { TIPOS_LICENCA } from "@/lib/masks"
import { DatePicker } from "@/components/acam/date-picker"
import { downloadPDF } from "@/lib/pdf/download"
import { debitarCreditos } from "@/lib/creditos/client"

const ETAPAS = ["Responsável", "Empreendedor", "Empreendimento", "Correspondência", "Licenciamento", "UCs", "Gerar"]

export default function RequerimentoSNUCPage() {
  const router = useRouter()
  const [etapa, setEtapa] = useState(0)
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  const [buscandoCNPJ1, setBuscandoCNPJ1] = useState(false)
  const [buscandoCNPJ2, setBuscandoCNPJ2] = useState(false)
  const [concluido, setConcluido] = useState(false)

  const [form, setForm] = useState<FormSNUC>({
    responsavel: responsavelInicial,
    empreendedor: empreendedorInicial,
    empreendimento: { ...empreendedorInicial },
    correspondencia: correspondenciaInicial,
    processo: processoSNUCInicial,
    ucs: ucsInicial,
  })

  function validarEtapa(): boolean {
    setErro("")
    const r = form.responsavel

    switch (etapa) {
      case 0:
        if (!r.nomeCompleto) return fail("Informe o nome completo.")
        if (!r.rg) return fail("Informe o RG.")
        if (!r.cpf) return fail("Informe o CPF.")
        if (!r.qualidade) return fail("Selecione a qualidade/cargo.")
        return true
      case 1:
        if (!form.empreendedor.cnpjCpf) return fail("Informe o CNPJ do empreendedor.")
        if (!form.empreendedor.razaoSocial) return fail("Informe a razão social.")
        return true
      case 2:
        if (!form.empreendimento.razaoSocial) return fail("Informe a razão social do empreendimento.")
        return true
      case 3:
        return true
      case 4:
        return true
      case 5:
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
      const debito = await debitarCreditos(CUSTO_REQUERIMENTO, "req-snuc", `Requerimento SNUC — ${form.empreendimento.razaoSocial || "N/A"}`)
      if (!debito.ok) { setErro(debito.erro); setLoading(false); return }

      // Gerar PDF
      const res = await fetch("/api/pdf/requerimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "snuc", form }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErro(data.erro || "Erro ao gerar PDF.")
        setLoading(false)
        return
      }
      await downloadPDF(res, "Requerimento_SNUC.pdf")
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
              const res = await fetch("/api/pdf/requerimento", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "snuc", form }) })
              if (res.ok) { await downloadPDF(res, "Requerimento_SNUC.pdf") }
            }}>Baixar Novamente</button>
            <button className="acam-btn acam-btn-primary" onClick={() => { setConcluido(false); setEtapa(0); setForm({ responsavel: responsavelInicial, empreendedor: empreendedorInicial, empreendimento: { ...empreendedorInicial }, correspondencia: correspondenciaInicial, processo: processoSNUCInicial, ucs: ucsInicial }) }}>
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
      titulo="Requerimento SNUC"
      subtitulo="Compensação Ambiental — Lei 9.985/2000"
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
          titulo="2. Identificação do Empreendedor"
          descricao="Pessoa física ou jurídica responsável pelo empreendimento"
          dados={form.empreendedor}
          onChange={(d) => setForm({ ...form, empreendedor: d })}
          buscandoCNPJ={buscandoCNPJ1}
          onBuscarCNPJ={() => buscarCNPJEmpreendedor(form.empreendedor.cnpjCpf, form.empreendedor, (d) => setForm((f) => ({ ...f, empreendedor: d })), setBuscandoCNPJ1)}
        />
      )}

      {etapa === 2 && (
        <StepEmpreendedor
          titulo="3. Identificação do Empreendimento"
          descricao="Dados do empreendimento objeto do licenciamento ambiental"
          dados={form.empreendimento}
          onChange={(d) => setForm({ ...form, empreendimento: d })}
          buscandoCNPJ={buscandoCNPJ2}
          onBuscarCNPJ={() => buscarCNPJEmpreendedor(form.empreendimento.cnpjCpf, form.empreendimento, (d) => setForm((f) => ({ ...f, empreendimento: d })), setBuscandoCNPJ2)}
        />
      )}

      {etapa === 3 && (
        <StepCorrespondencia
          dados={form.correspondencia}
          onChange={(d) => setForm({ ...form, correspondencia: d })}
          opcaoEmpreendimento={true}
        />
      )}

      {etapa === 4 && (
        <StepProcessoSNUC
          dados={form.processo}
          onChange={(d) => setForm({ ...form, processo: d })}
        />
      )}

      {etapa === 5 && (
        <StepUCs
          dados={form.ucs}
          onChange={(d) => setForm({ ...form, ucs: d })}
        />
      )}

      {etapa === 6 && (
        <StepRevisaoSNUC form={form} />
      )}
    </WizardShell>
  )
}

// ============================================
// STEP: PROCESSO SNUC (Seção 5)
// ============================================

function StepProcessoSNUC({ dados, onChange }: { dados: ProcessoSNUC; onChange: (d: ProcessoSNUC) => void }) {
  function set<K extends keyof ProcessoSNUC>(campo: K, valor: ProcessoSNUC[K]) {
    onChange({ ...dados, [campo]: valor })
  }

  return (
    <>
      <div className="acam-section-title">5. Identificação do Processo de Licenciamento Ambiental</div>
      <div className="acam-section-desc">Dados do processo COPAM e licença concedida</div>

      <div className="acam-fg acam-fg-2">
        <div className="acam-field">
          <label>5.1 - Processo COPAM Nº <span className="req">*</span></label>
          <input className="acam-form-input" placeholder="00000/0000/000/0000" value={dados.processoCopam} onChange={(e) => set("processoCopam", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>5.2 - Certificado de Licença/Tipo/Nº <span className="req">*</span></label>
          <input className="acam-form-input" value={dados.certificadoLicenca} onChange={(e) => set("certificadoLicenca", e.target.value)} />
        </div>
      </div>

      <div className="acam-fg acam-fg-3">
        <div className="acam-field">
          <label>Tipo de Licença <span className="req">*</span></label>
          <select className="acam-form-input acam-form-select" value={dados.tipoLicenca} onChange={(e) => set("tipoLicenca", e.target.value)}>
            <option value="">Selecione</option>
            {TIPOS_LICENCA.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="acam-field">
          <label>5.3 - Validade da Licença (anos) <span className="req">*</span></label>
          <input className="acam-form-input" type="number" min="1" max="20" value={dados.validadeLicenca} onChange={(e) => set("validadeLicenca", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>5.4 - Data da Aprovação da Licença <span className="req">*</span></label>
          <DatePicker value={dados.dataAprovacao} onChange={(v) => set("dataAprovacao", v)} />
        </div>
      </div>

      <div className="acam-field">
        <label>5.5 - Nº da Condicionante de Compensação Ambiental <span className="req">*</span></label>
        <input className="acam-form-input" style={{ maxWidth: "150px" }} value={dados.condicionante} onChange={(e) => set("condicionante", e.target.value)} />
      </div>

      <div className="acam-field">
        <label>5.6 - Existe(m) outro(s) processo(s) de Licenciamento Ambiental vinculado(s) à atividade?</label>
        <div className="acam-radio-group">
          <label><input type="radio" name="outrosProc" checked={dados.outrosProc === "nao"} onChange={() => set("outrosProc", "nao")} /> NÃO</label>
          <label><input type="radio" name="outrosProc" checked={dados.outrosProc === "sim"} onChange={() => set("outrosProc", "sim")} /> SIM</label>
        </div>
      </div>
      {dados.outrosProc === "sim" && (
        <div className="acam-field">
          <label>Nº do(s) Processo(s) COPAM:</label>
          <textarea className="acam-form-input" rows={2} placeholder="00000/0000/000/0000" value={dados.outrosProcNum} onChange={(e) => set("outrosProcNum", e.target.value)} />
        </div>
      )}

      <div className="acam-field">
        <label>5.7 - Data de implantação do empreendimento (se LI, LP+LI, LIC, LO ou RevLO):</label>
        <DatePicker value={dados.dataImplantacao} onChange={(v) => set("dataImplantacao", v)} />
      </div>

      <div className="acam-field">
        <label>5.8 - O presente requerimento se refere à ampliação do empreendimento?</label>
        <div className="acam-radio-group">
          <label><input type="radio" name="ampliacao" checked={dados.ampliacao === "nao"} onChange={() => set("ampliacao", "nao")} /> NÃO</label>
          <label><input type="radio" name="ampliacao" checked={dados.ampliacao === "sim"} onChange={() => set("ampliacao", "sim")} /> SIM</label>
        </div>
      </div>
      {dados.ampliacao === "sim" && (
        <div style={{ padding: "1rem", background: "var(--neutral-50)", borderRadius: "6px", marginBottom: "1rem" }}>
          <div className="acam-field">
            <label>Nº do Processo Principal:</label>
            <input className="acam-form-input" placeholder="00000/0000/000/0000" value={dados.processoPrincipal} onChange={(e) => set("processoPrincipal", e.target.value)} />
          </div>
          <div className="acam-field">
            <label>No processo principal, a compensação ambiental foi cumprida?</label>
            <div className="acam-radio-group">
              <label><input type="radio" name="compCumprida" checked={dados.compCumprida === "sim"} onChange={() => set("compCumprida", "sim")} /> SIM</label>
              <label><input type="radio" name="compCumprida" checked={dados.compCumprida === "nao"} onChange={() => set("compCumprida", "nao")} /> NÃO</label>
            </div>
          </div>
          {dados.compCumprida === "sim" && (
            <div className="acam-field">
              <label>Nº do Termo de Compromisso:</label>
              <input className="acam-form-input" placeholder="Número do TC" value={dados.termoCompromisso} onChange={(e) => set("termoCompromisso", e.target.value)} />
            </div>
          )}
          {dados.compCumprida === "nao" && (
            <div className="acam-field">
              <label>Por que a compensação não foi cumprida?</label>
              <textarea className="acam-form-input" rows={2} placeholder="Explique o motivo..." value={dados.motivoNaoCumprida} onChange={(e) => set("motivoNaoCumprida", e.target.value)} />
            </div>
          )}
        </div>
      )}

      <div className="acam-field">
        <label>5.9 - Revalidação de Licença de Operação, com compensação ambiental total ou parcialmente cumprida?</label>
        <div className="acam-radio-group">
          <label><input type="radio" name="revalidacao" checked={dados.revalidacao === "nao"} onChange={() => set("revalidacao", "nao")} /> NÃO</label>
          <label><input type="radio" name="revalidacao" checked={dados.revalidacao === "sim"} onChange={() => set("revalidacao", "sim")} /> SIM</label>
        </div>
      </div>
      {dados.revalidacao === "sim" && (
        <div className="acam-field">
          <label>Nº do(s) Processo(s) COPAM compensados:</label>
          <textarea className="acam-form-input" rows={2} placeholder="00000/0000/000/0000" value={dados.procCompensados} onChange={(e) => set("procCompensados", e.target.value)} />
        </div>
      )}
    </>
  )
}

// ============================================
// STEP: UCs (Seção 6)
// ============================================

function StepUCs({ dados, onChange }: { dados: DadosUCs; onChange: (d: DadosUCs) => void }) {
  function set<K extends keyof DadosUCs>(campo: K, valor: DadosUCs[K]) {
    onChange({ ...dados, [campo]: valor })
  }

  return (
    <>
      <div className="acam-section-title">6. Localização do Empreendimento em Relação às Unidades de Conservação</div>
      <div className="acam-section-desc">Proximidade com Unidades de Conservação (UCs)</div>

      <div className="acam-field">
        <label>6.1 - O empreendimento está localizado num raio de até 3 km do limite de Unidade(s) de Conservação?</label>
        <div className="acam-radio-group">
          <label><input type="radio" name="uc3km" checked={dados.uc3km === "nao"} onChange={() => set("uc3km", "nao")} /> NÃO</label>
          <label><input type="radio" name="uc3km" checked={dados.uc3km === "sim"} onChange={() => set("uc3km", "sim")} /> SIM</label>
        </div>
      </div>
      {dados.uc3km === "sim" && (
        <div className="acam-field">
          <label>Nome(s) da(s) UC(s):</label>
          <textarea className="acam-form-input" rows={2} value={dados.uc3kmNomes} onChange={(e) => set("uc3kmNomes", e.target.value)} />
        </div>
      )}

      <div className="acam-field">
        <label>6.2 - O empreendimento está inserido, total ou parcialmente, em Unidade de Conservação?</label>
        <div className="acam-radio-group">
          <label><input type="radio" name="ucInserido" checked={dados.ucInserido === "nao"} onChange={() => set("ucInserido", "nao")} /> NÃO</label>
          <label><input type="radio" name="ucInserido" checked={dados.ucInserido === "sim"} onChange={() => set("ucInserido", "sim")} /> SIM</label>
        </div>
      </div>
      {dados.ucInserido === "sim" && (
        <div className="acam-field">
          <label>Nome(s) da(s) UC(s):</label>
          <textarea className="acam-form-input" rows={2} value={dados.ucInseridoNomes} onChange={(e) => set("ucInseridoNomes", e.target.value)} />
        </div>
      )}

      <div className="acam-field">
        <label>6.3 - O empreendimento está localizado, total ou parcialmente, em Zona de Amortecimento de Unidade de Conservação?</label>
        <div className="acam-radio-group">
          <label><input type="radio" name="ucZA" checked={dados.ucZA === "nao"} onChange={() => set("ucZA", "nao")} /> NÃO</label>
          <label><input type="radio" name="ucZA" checked={dados.ucZA === "sim"} onChange={() => set("ucZA", "sim")} /> SIM</label>
        </div>
      </div>
      {dados.ucZA === "sim" && (
        <div className="acam-field">
          <label>Nome(s) da(s) UC(s):</label>
          <textarea className="acam-form-input" rows={2} value={dados.ucZANomes} onChange={(e) => set("ucZANomes", e.target.value)} />
        </div>
      )}
    </>
  )
}

// ============================================
// STEP: REVISÃO SNUC
// ============================================

function StepRevisaoSNUC({ form }: { form: FormSNUC }) {
  const r = form.responsavel
  const emp = form.empreendedor
  const empr = form.empreendimento
  const p = form.processo

  return (
    <>
      <div className="acam-section-title">Revisar e Gerar PDF</div>
      <div className="acam-section-desc">Confira os dados antes de baixar o documento</div>

      <SummaryCard titulo="1. Responsável">
        <SummaryItem label="Nome" valor={r.nomeCompleto} />
        <SummaryItem label="CPF" valor={r.cpf} />
        <SummaryItem label="Qualidade" valor={r.qualidade} />
      </SummaryCard>

      <SummaryCard titulo="2. Empreendedor">
        <SummaryItem label="Razão Social" valor={emp.razaoSocial} />
        <SummaryItem label="CNPJ" valor={emp.cnpjCpf} />
        <SummaryItem label="Município/UF" valor={`${emp.cidade}/${emp.uf}`} />
      </SummaryCard>

      <SummaryCard titulo="3. Empreendimento">
        <SummaryItem label="Razão Social" valor={empr.razaoSocial} />
        <SummaryItem label="CNPJ" valor={empr.cnpjCpf} />
        <SummaryItem label="Município/UF" valor={`${empr.cidade}/${empr.uf}`} />
      </SummaryCard>

      <SummaryCard titulo="4. Correspondência">
        <SummaryItem label="Tipo" valor={
          form.correspondencia.tipo === "empreendedor" ? "Repetir Campo 2" :
          form.correspondencia.tipo === "empreendimento" ? "Repetir Campo 3" : "Outro endereço"
        } />
      </SummaryCard>

      <SummaryCard titulo="5. Licenciamento">
        <SummaryItem label="Processo COPAM" valor={p.processoCopam} />
        <SummaryItem label="Licença" valor={`${p.certificadoLicenca} / ${p.tipoLicenca}`} />
        <SummaryItem label="Condicionante" valor={p.condicionante} />
        <SummaryItem label="Ampliação" valor={p.ampliacao === "sim" ? "SIM" : "NÃO"} />
      </SummaryCard>

      <SummaryCard titulo="6. UCs">
        <SummaryItem label="Raio 3km" valor={form.ucs.uc3km === "sim" ? `SIM — ${form.ucs.uc3kmNomes}` : "NÃO"} />
        <SummaryItem label="Inserido em UC" valor={form.ucs.ucInserido === "sim" ? `SIM — ${form.ucs.ucInseridoNomes}` : "NÃO"} />
        <SummaryItem label="Zona Amortecimento" valor={form.ucs.ucZA === "sim" ? `SIM — ${form.ucs.ucZANomes}` : "NÃO"} />
      </SummaryCard>

      <div className="acam-alert acam-alert-result" style={{ marginTop: "1rem" }}>
        Este serviço consome <strong>{CUSTO_REQUERIMENTO} crédito</strong>
      </div>
    </>
  )
}

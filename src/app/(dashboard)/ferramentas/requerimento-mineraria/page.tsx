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
  type FormMineraria,
  type ProcessoMineraria,
  responsavelInicial,
  empreendedorInicial,
  correspondenciaInicial,
  processoMinerariaInicial,
  CUSTO_REQUERIMENTO,
} from "@/lib/requerimentos/types"
import { TIPOS_LICENCA } from "@/lib/masks"
import { DatePicker } from "@/components/acam/date-picker"

const ETAPAS = ["Responsável", "Empreendedor", "Correspondência", "Processo", "Gerar"]

export default function RequerimentoMinerariaPage() {
  const router = useRouter()
  const [etapa, setEtapa] = useState(0)
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false)
  const [concluido, setConcluido] = useState(false)

  const [form, setForm] = useState<FormMineraria>({
    responsavel: responsavelInicial,
    empreendedor: empreendedorInicial,
    correspondencia: correspondenciaInicial,
    processo: processoMinerariaInicial,
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
        if (!r.unidadeIEF) return fail("Selecione a Unidade Regional do IEF.")
        return true
      case 1:
        if (!e.cnpjCpf) return fail("Informe o CNPJ/CPF do empreendedor.")
        if (!e.razaoSocial) return fail("Informe a razão social.")
        return true
      case 2:
        return true // correspondência pode repetir campo 2
      case 3:
        return true // campos livres
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
      const debitRes = await fetch("/api/creditos/debitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantidade: CUSTO_REQUERIMENTO,
          descricao: `Requerimento Minerária — ${form.empreendedor.razaoSocial || "N/A"}`,
          ferramenta_id: "req-mineraria",
        }),
      })
      if (!debitRes.ok) {
        const data = await debitRes.json()
        setErro(data.erro || "Erro ao debitar créditos.")
        setLoading(false)
        return
      }

      // Gerar PDF
      const res = await fetch("/api/pdf/requerimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "mineraria", form }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErro(data.erro || "Erro ao gerar PDF.")
        setLoading(false)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "Requerimento_Compensacao_Mineraria.pdf"
      a.click()
      URL.revokeObjectURL(url)
      setConcluido(true)
      router.refresh() // atualiza saldo no header
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
              const res = await fetch("/api/pdf/requerimento", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "mineraria", form }) })
              if (res.ok) { const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "Requerimento_Compensacao_Mineraria.pdf"; a.click(); URL.revokeObjectURL(url) }
            }}>Baixar Novamente</button>
            <button className="acam-btn acam-btn-primary" onClick={() => { setConcluido(false); setEtapa(0); setForm({ responsavel: responsavelInicial, empreendedor: empreendedorInicial, correspondencia: correspondenciaInicial, processo: processoMinerariaInicial }) }}>
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
      titulo="Requerimento Compensação Minerária"
      subtitulo="Anexo I — Lei Estadual nº 20.922/2013"
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
          mostrarUnidadeIEF={true}
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
        <StepProcessoMineraria
          dados={form.processo}
          onChange={(d) => setForm({ ...form, processo: d })}
        />
      )}

      {etapa === 4 && (
        <StepRevisaoMineraria form={form} />
      )}
    </WizardShell>
  )
}

// ============================================
// STEP: PROCESSO MINERÁRIA (Seção 4)
// ============================================

function StepProcessoMineraria({ dados, onChange }: { dados: ProcessoMineraria; onChange: (d: ProcessoMineraria) => void }) {
  function set<K extends keyof ProcessoMineraria>(campo: K, valor: ProcessoMineraria[K]) {
    onChange({ ...dados, [campo]: valor })
  }

  return (
    <>
      <div className="acam-section-title">4. Identificação do Processo de Licenciamento/Intervenção Ambiental</div>
      <div className="acam-section-desc">Dados do processo administrativo e ato autorizativo</div>

      <div className="acam-fg acam-fg-2">
        <div className="acam-field">
          <label>4.1 - Nº do Processo Administrativo <span className="req">*</span></label>
          <input className="acam-form-input" placeholder="Licenciamento/AAF/DAIA solteira" value={dados.processoAdmin} onChange={(e) => set("processoAdmin", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>4.2 - Certificado de Licença/AAF/DAIA Nº <span className="req">*</span></label>
          <input className="acam-form-input" value={dados.certificadoLicenca} onChange={(e) => set("certificadoLicenca", e.target.value)} />
        </div>
      </div>

      <div className="acam-fg acam-fg-3">
        <div className="acam-field">
          <label>4.3 - Tipo de Licença (se for o caso)</label>
          <select className="acam-form-input acam-form-select" value={dados.tipoLicenca} onChange={(e) => set("tipoLicenca", e.target.value)}>
            <option value="">Não se aplica</option>
            {TIPOS_LICENCA.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="acam-field">
          <label>4.4 - Validade do Ato Autorizativo (anos) <span className="req">*</span></label>
          <input className="acam-form-input" type="number" min="1" max="20" value={dados.validadeAto} onChange={(e) => set("validadeAto", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>4.5 - Data da Aprovação <span className="req">*</span></label>
          <DatePicker value={dados.dataAprovacao} onChange={(v) => set("dataAprovacao", v)} />
        </div>
      </div>

      <div className="acam-fg acam-fg-2">
        <div className="acam-field">
          <label>4.6 - Nº da Condicionante de Compensação Florestal Minerária <span className="req">*</span></label>
          <input className="acam-form-input" style={{ maxWidth: "150px" }} value={dados.condicionante} onChange={(e) => set("condicionante", e.target.value)} />
        </div>
        <div className="acam-field">
          <label>4.7 - Área efetivamente ocupada pelo empreendimento (ha) <span className="req">*</span></label>
          <input className="acam-form-input" placeholder="Ex: 15,50" value={dados.areaOcupada} onChange={(e) => set("areaOcupada", e.target.value)} />
          <span className="hint">Conforme §1º do Art. 36 da Lei 14.309/2002, recepcionado pelo §2º do Art. 75 da Lei 20.922/2013</span>
        </div>
      </div>

      <div className="acam-field">
        <label>4.8 - Existe(m) outro(s) processo(s) administrativo(s) vinculado(s) à atividade?</label>
        <div className="acam-radio-group">
          <label><input type="radio" name="outrosProc" checked={dados.outrosProc === "nao"} onChange={() => set("outrosProc", "nao")} /> NÃO</label>
          <label><input type="radio" name="outrosProc" checked={dados.outrosProc === "sim"} onChange={() => set("outrosProc", "sim")} /> SIM</label>
        </div>
      </div>
      {dados.outrosProc === "sim" && (
        <div className="acam-field">
          <label>Nº do(s) Processo(s) Administrativo(s):</label>
          <textarea className="acam-form-input" rows={2} placeholder="00000/0000/000/0000" value={dados.outrosProcNum} onChange={(e) => set("outrosProcNum", e.target.value)} />
        </div>
      )}

      <div className="acam-field">
        <label>4.9 - DNPM <span className="req">*</span></label>
        <input className="acam-form-input" placeholder="Número do processo DNPM/ANM" value={dados.dnpm} onChange={(e) => set("dnpm", e.target.value)} />
      </div>
    </>
  )
}

// ============================================
// STEP: REVISÃO MINERÁRIA
// ============================================

function StepRevisaoMineraria({ form }: { form: FormMineraria }) {
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
        <SummaryItem label="Unidade IEF" valor={r.unidadeIEF} />
      </SummaryCard>

      <SummaryCard titulo="2. Empreendedor">
        <SummaryItem label="Razão Social" valor={e.razaoSocial} />
        <SummaryItem label="CNPJ/CPF" valor={e.cnpjCpf} />
        <SummaryItem label="Endereço" valor={[e.endereco, e.numero, e.bairro].filter(Boolean).join(", ")} />
        <SummaryItem label="Município/UF" valor={`${e.cidade}/${e.uf}`} />
      </SummaryCard>

      <SummaryCard titulo="3. Correspondência">
        <SummaryItem label="Tipo" valor={form.correspondencia.tipo === "empreendedor" ? "Repetir Campo 2" : "Outro endereço"} />
      </SummaryCard>

      <SummaryCard titulo="4. Processo">
        <SummaryItem label="Processo" valor={p.processoAdmin} />
        <SummaryItem label="Licença" valor={`${p.certificadoLicenca} / ${p.tipoLicenca}`} />
        <SummaryItem label="Condicionante" valor={p.condicionante} />
        <SummaryItem label="Área (ha)" valor={p.areaOcupada} />
        <SummaryItem label="DNPM" valor={p.dnpm} />
      </SummaryCard>

      <div className="acam-alert acam-alert-result" style={{ marginTop: "1rem" }}>
        Este serviço consome <strong>{CUSTO_REQUERIMENTO} crédito</strong>
      </div>
    </>
  )
}

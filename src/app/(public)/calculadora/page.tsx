"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ATIVIDADES,
  PRODUTOS,
  type Atividade,
  type Produto,
} from "@/lib/calculo/intervencao"

function Accordion({ titulo, children, defaultOpen = false }: { titulo: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [aberto, setAberto] = useState(defaultOpen)
  return (
    <div className="acam-card mb-4" style={{ padding: 0, overflow: "hidden" }}>
      <button onClick={() => setAberto(!aberto)} style={{
        width: "100%", padding: "var(--spacing-4) var(--spacing-5)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--neutral-50)", border: "none", cursor: "pointer",
        fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--neutral-700)",
      }}>
        {titulo}
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transition: "transform 0.2s", transform: aberto ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {aberto && (
        <div style={{ padding: "var(--spacing-5)" }}>
          {children}
        </div>
      )}
    </div>
  )
}

function OpcaoBtn({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      display: "block", width: "100%", padding: "1rem 1.25rem", marginBottom: "0.5rem",
      border: selected ? "1px solid var(--primary-200)" : "1px solid var(--neutral-200)",
      borderRadius: "var(--radius-lg)",
      background: selected ? "var(--primary-50)" : "white",
      textAlign: "left", cursor: "pointer", fontSize: "0.95rem",
      fontWeight: selected ? 600 : 400,
      transition: "all 0.15s",
    }}>
      {children}
    </button>
  )
}

function fmt(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function un(unidade: string, qtd: number): string {
  if (unidade === "hectare" && qtd > 1) return "hectares"
  return unidade
}

function montarInfoComplementares(nome: string, doc: string, municipio: string, processo: string, descricao: string): string {
  let texto = ""
  texto += "Nome: " + (nome || "[NOME DO EMPREENDIMENTO]") + "\n"
  texto += "CPF/CNPJ: " + (doc || "[CPF/CNPJ]") + "\n"
  texto += "Município: " + (municipio ? municipio + "/MG" : "[MUNICÍPIO]") + "\n"
  if (processo) texto += "Processo: " + processo + "\n"
  texto += "\n"
  texto += "Descrição da solicitação:\n"
  texto += descricao
  return texto
}

export default function CalculadoraPage() {
  const [ufemg, setUfemg] = useState({ ano: 2026, valor: 5.7899 })
  const [ufemgFallback, setUfemgFallback] = useState(false)

  // Estado do wizard — idêntico ao ACAM1
  const [state, setState] = useState({
    tipoVegetacao: null as string | null,
    temManejo: null as boolean | null,
    temAPP: null as boolean | null,
    tiposAPP: [] as string[],
    temAproveitamento: null as boolean | null,
    temProdutos: null as boolean | null,
    produtosSelecionados: [] as string[],
    dentroLicenciamento: null as boolean | null,
    quantidades: {} as Record<string, number>,
    volumes: {} as Record<string, number>,
  })

  const [documento, setDocumento] = useState("")
  const [nome, setNome] = useState("")
  const [municipio, setMunicipio] = useState("")
  const [processo, setProcesso] = useState("")
  const [cnpjStatus, setCnpjStatus] = useState("")

  const [etapaAtual, setEtapaAtual] = useState(0)

  // Buscar UFEMG
  useEffect(() => {
    fetch("/api/pagamento/pacotes")
      .then((r) => r.json())
      .catch(() => { setUfemgFallback(true) })
  }, [])

  // Etapas — mesma lógica do ACAM1
  const getEtapas = useCallback((): string[] => {
    const lista = ["intro", "tipoVegetacao"]
    if (state.tipoVegetacao === "nativa" || state.tipoVegetacao === "ambas") {
      lista.push("temManejo")
    }
    lista.push("temAPP")
    if (state.temAPP === true) lista.push("tiposAPP")
    lista.push("temAproveitamento")
    lista.push("quantidades")
    lista.push("introFlorestal")
    lista.push("temProdutos")
    if (state.temProdutos === true) {
      lista.push("produtosSelecionados")
      lista.push("volumes")
    }
    lista.push("dentroLicenciamento")
    lista.push("dadosEmpreendimento")
    lista.push("resultado")
    return lista
  }, [state.tipoVegetacao, state.temAPP, state.temProdutos])

  const etapas = getEtapas()
  const stepId = etapas[etapaAtual]

  function getAtividadesDisponiveis(): Atividade[] {
    const lista: Atividade[] = []
    if (state.tipoVegetacao === "nativa" || state.tipoVegetacao === "ambas") {
      lista.push(...ATIVIDADES.nativa)
      if (state.temManejo === true) lista.push(...ATIVIDADES.manejo)
    }
    if (state.tipoVegetacao === "plantada" || state.tipoVegetacao === "ambas") {
      lista.push(...ATIVIDADES.plantada)
    }
    if (state.temAPP === true) {
      if (state.tiposAPP.includes("com_supressao")) lista.push(...ATIVIDADES.app_com_supressao)
      if (state.tiposAPP.includes("sem_supressao")) lista.push(...ATIVIDADES.app_sem_supressao)
      if (state.tiposAPP.includes("plantada_app")) lista.push(...ATIVIDADES.app_plantada)
    }
    if (state.temAproveitamento === true) lista.push(...ATIVIDADES.aproveitamento)
    return lista
  }

  function selecionar(campo: string, valor: string | boolean) {
    setState((prev) => ({ ...prev, [campo]: valor }))
  }

  function toggleArray(campo: string, valor: string) {
    setState((prev) => {
      const arr = [...(prev[campo as keyof typeof prev] as string[])]
      const idx = arr.indexOf(valor)
      if (idx === -1) arr.push(valor)
      else arr.splice(idx, 1)
      return { ...prev, [campo]: arr }
    })
  }

  function podeAvancar(): boolean {
    if (stepId === "intro" || stepId === "introFlorestal") return true
    if (stepId === "tipoVegetacao") return state.tipoVegetacao !== null
    if (stepId === "temManejo") return state.temManejo !== null
    if (stepId === "temAPP") return state.temAPP !== null
    if (stepId === "tiposAPP") return state.tiposAPP.length > 0
    if (stepId === "temAproveitamento") return state.temAproveitamento !== null
    if (stepId === "temProdutos") return state.temProdutos !== null
    if (stepId === "produtosSelecionados") return state.produtosSelecionados.length > 0
    if (stepId === "dentroLicenciamento") return state.dentroLicenciamento !== null
    return true
  }

  function avancar() {
    if (!podeAvancar()) return
    if (etapaAtual >= etapas.length - 1) return
    setEtapaAtual(etapaAtual + 1)
  }

  function voltar() {
    if (etapaAtual <= 0) return
    setEtapaAtual(etapaAtual - 1)
  }

  function reiniciar() {
    setState({
      tipoVegetacao: null, temManejo: null, temAPP: null, tiposAPP: [],
      temAproveitamento: null, temProdutos: null, produtosSelecionados: [],
      dentroLicenciamento: null, quantidades: {}, volumes: {},
    })
    setDocumento(""); setNome(""); setMunicipio(""); setProcesso("")
    setCnpjStatus("")
    setEtapaAtual(0)
  }

  // Formatação de documento + busca CNPJ
  async function formatarDocumento(valor: string) {
    let v = valor.replace(/\D/g, "")
    if (v.length <= 11) {
      v = v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    } else {
      v = v.replace(/^(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2")
    }
    setDocumento(v)

    const digitos = v.replace(/\D/g, "")
    if (digitos.length === 14) {
      setCnpjStatus("Buscando dados...")
      try {
        const res = await fetch("https://brasilapi.com.br/api/cnpj/v1/" + digitos)
        if (res.ok) {
          const data = await res.json()
          setNome(data.razao_social || data.nome_fantasia || "")
          setMunicipio(data.municipio || "")
          setCnpjStatus("Dados preenchidos automaticamente")
        } else {
          setCnpjStatus("CNPJ não encontrado. Preencha manualmente.")
        }
      } catch {
        setCnpjStatus("Erro na busca. Preencha manualmente.")
      }
    }
  }

  // Cálculo — idêntico ao ACAM1
  function calcular() {
    const atividades = getAtividadesDisponiveis()
    const produtos = PRODUTOS.filter((p) => state.produtosSelecionados.includes(p.id))

    let totalExpediente = 0
    const itensExpediente: { nome: string; codigo: string; qtd: number; unidade: string; valor: number }[] = []
    atividades.forEach((a) => {
      const qtd = state.quantidades[a.id] || 0
      if (qtd > 0) {
        const valor = (a.ufemgBase * ufemg.valor) + (Math.ceil(qtd) * a.ufemgPorUnidade * ufemg.valor)
        totalExpediente += valor
        itensExpediente.push({ nome: a.nome, codigo: a.codigo, qtd, unidade: a.unidade, valor })
      }
    })

    let totalFlorestal = 0
    const itensFlorestal: { nome: string; codigo: string; vol: number; unidade: string; valor: number }[] = []
    produtos.forEach((p) => {
      const vol = state.volumes[p.id] || 0
      if (vol > 0) {
        const valor = ufemg.valor * vol * p.ufemg
        totalFlorestal += valor
        itensFlorestal.push({ nome: p.nome, codigo: p.codigo, vol, unidade: p.unidade, valor })
      }
    })

    let totalReposicao = 0
    const itensReposicao: { nome: string; codigo: string; vol: number; unidade: string; arvores: number; totalArvores: number; valor: number }[] = []
    produtos.forEach((p) => {
      const vol = state.volumes[p.id] || 0
      if (vol > 0 && p.arvores > 0) {
        const valor = ufemg.valor * vol * p.arvores
        totalReposicao += valor
        itensReposicao.push({ nome: p.nome, codigo: p.codigo, vol, unidade: p.unidade, arvores: p.arvores, totalArvores: Math.ceil(vol * p.arvores), valor })
      }
    })

    return { total: totalExpediente + totalFlorestal + totalReposicao, totalExpediente, totalFlorestal, totalReposicao, itensExpediente, itensFlorestal, itensReposicao }
  }

  function copiar(texto: string, btn: HTMLButtonElement) {
    navigator.clipboard.writeText(texto).then(() => {
      const original = btn.textContent
      btn.textContent = "Copiado!"
      setTimeout(() => { btn.textContent = original }, 1500)
    })
  }

  // Progresso
  const parte = stepId === "intro" || stepId === "tipoVegetacao" || stepId === "temManejo" || stepId === "temAPP" || stepId === "tiposAPP" || stepId === "temAproveitamento" || stepId === "quantidades" ? 1
    : stepId === "introFlorestal" || stepId === "temProdutos" || stepId === "produtosSelecionados" || stepId === "volumes" ? 2 : 3

  // Agrupar produtos por grupo
  const grupos: Record<string, Produto[]> = {}
  PRODUTOS.forEach((p) => { if (!grupos[p.grupo]) grupos[p.grupo] = []; grupos[p.grupo].push(p) })

  const resultado = stepId === "resultado" ? calcular() : null
  const orgao = state.dentroLicenciamento ? "FEAM - Fundação Estadual do Meio Ambiente" : "IEF - Instituto Estadual de Florestas"

  const btnLabel = stepId === "intro" || stepId === "introFlorestal" ? "Começar"
    : etapaAtual === etapas.length - 2 ? "Ver Resultado" : "Próximo"

  return (
    <div>
      <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "var(--spacing-4) var(--spacing-6) 0" }}>
        <Link href="/dashboard" className="text-sm text-muted-foreground inline-flex items-center gap-1" style={{ textDecoration: "none" }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Voltar ao dashboard
        </Link>
      </div>

      {/* Service Header */}
      <div className="acam-service-header acam-service-header-primary">
        <div className="acam-service-header-content">
          <div className="acam-service-header-info">
            <div className="acam-service-header-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
            </div>
            <div className="acam-service-header-text">
              <h1>Calculadora de Intervenção Ambiental</h1>
              <p>Cálculo de taxas de expediente, florestal e reposição florestal</p>
            </div>
          </div>
          <div className="acam-service-header-cost">
            <div className="acam-service-header-cost-label">Custo</div>
            <div className="acam-service-header-cost-value">Gratuito</div>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: "40rem", margin: "0 auto", padding: "var(--spacing-8) var(--spacing-6)", width: "100%" }}>
        {/* Aviso UFEMG fallback */}
        {ufemgFallback && (
          <div style={{ padding: "0.5rem 1rem", background: "#fef3c7", borderLeft: "3px solid #d97706", borderRadius: "var(--radius-md)", fontSize: "0.8rem", color: "#92400e", marginBottom: "1rem" }}>
            Não foi possível obter o valor atualizado da UFEMG. Usando valor de referência. <strong>Confirme o valor vigente antes de emitir o DAE.</strong>
          </div>
        )}

        {/* Badge UFEMG */}
        <div className="text-center mb-4">
          <span className="acam-badge acam-badge-primary" style={{ fontSize: "0.85rem", padding: "0.4rem 1rem" }}>
            UFEMG {ufemg.ano}: R$ {ufemg.valor.toFixed(4).replace(".", ",")}
          </span>
        </div>

        {/* Wizard */}
        <div id="wizard-container" className="acam-card" style={{ padding: "var(--spacing-6)" }}>
          {/* Progresso */}
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", padding: "1rem 0", fontSize: "0.8rem", color: "var(--neutral-400)" }}>
            <span style={parte === 1 ? { color: "var(--primary-600)", fontWeight: 600 } : {}}>1. Expediente</span>
            <span style={{ color: "var(--neutral-300)" }}>→</span>
            <span style={parte === 2 ? { color: "var(--primary-600)", fontWeight: 600 } : {}}>2. Florestal</span>
            <span style={{ color: "var(--neutral-300)" }}>→</span>
            <span style={parte === 3 ? { color: "var(--primary-600)", fontWeight: 600 } : {}}>3. Resultado</span>
          </div>

          {/* ETAPAS */}
          {stepId === "intro" && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Taxa de Expediente para Intervenção Ambiental</h2>
              <p className="text-sm text-muted-foreground mb-4">Esta calculadora determina os valores de <strong>Taxa de Expediente</strong>, <strong>Taxa Florestal</strong> e <strong>Reposição Florestal</strong> para processos de intervenção ambiental em Minas Gerais.</p>
              <div className="acam-alert-result">
                <strong>Como funciona:</strong> Responda às perguntas sobre a sua intervenção e a calculadora determinará automaticamente as atividades aplicáveis e os valores devidos.
              </div>
            </div>
          )}

          {stepId === "tipoVegetacao" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">A intervenção envolve qual tipo de vegetação?</h2>
              {[
                { valor: "nativa", texto: "Vegetação nativa" },
                { valor: "plantada", texto: "Floresta plantada" },
                { valor: "ambas", texto: "Ambas" },
              ].map((op) => (
                <OpcaoBtn key={op.valor} selected={state.tipoVegetacao === op.valor} onClick={() => selecionar("tipoVegetacao", op.valor)}>
                  {op.texto}
                </OpcaoBtn>
              ))}
            </div>
          )}

          {stepId === "temManejo" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">A vegetação nativa está sob plano de manejo sustentável?</h2>
              {[{ valor: true, texto: "Sim, possui plano de manejo" }, { valor: false, texto: "Não" }].map((op) => (
                <OpcaoBtn key={String(op.valor)} selected={state.temManejo === op.valor} onClick={() => selecionar("temManejo", op.valor)}>
                  {op.texto}
                </OpcaoBtn>
              ))}
            </div>
          )}

          {stepId === "temAPP" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">A intervenção atinge Área de Preservação Permanente (APP)?</h2>
              {[{ valor: true, texto: "Sim" }, { valor: false, texto: "Não" }].map((op) => (
                <OpcaoBtn key={String(op.valor)} selected={state.temAPP === op.valor} onClick={() => selecionar("temAPP", op.valor)}>
                  {op.texto}
                </OpcaoBtn>
              ))}
            </div>
          )}

          {stepId === "tiposAPP" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Quais tipos de intervenção em APP?</h2>
              <p className="text-sm text-muted-foreground mb-3">Selecione todos que se aplicam.</p>
              {[
                { valor: "com_supressao", texto: "Intervenção com supressão de vegetação em APP" },
                { valor: "sem_supressao", texto: "Intervenção em APP sem supressão de vegetação" },
                { valor: "plantada_app", texto: "Supressão de floresta plantada em APP" },
              ].map((op) => (
                <OpcaoBtn key={op.valor} selected={state.tiposAPP.includes(op.valor)} onClick={() => toggleArray("tiposAPP", op.valor)}>
                  {op.texto}
                </OpcaoBtn>
              ))}
            </div>
          )}

          {stepId === "temAproveitamento" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Haverá aproveitamento de material lenhoso?</h2>
              <div style={{ background: "var(--neutral-50)", borderRadius: "var(--radius-lg)", padding: "1rem", fontSize: "0.85rem", lineHeight: 1.6, color: "var(--neutral-600)", marginBottom: "1rem" }}>
                <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "var(--neutral-700)" }}>O que é &quot;Aproveitamento de Material Lenhoso&quot;?</div>
                <p style={{ marginBottom: "0.5rem" }}>O Aproveitamento de Material Lenhoso é uma modalidade específica de intervenção ambiental prevista na Resolução Conjunta SEMAD/IEF n° 3.102/2021.</p>
                <p style={{ marginBottom: "0.25rem" }}>Situações em que se aplica (art. 5°):</p>
                <ul style={{ paddingLeft: "1.25rem", marginBottom: "0.5rem" }}>
                  <li>Destinação de material lenhoso fora do prazo de validade da intervenção ambiental</li>
                  <li>Retirada e transporte de material lenhoso em áreas impactadas por acidentes</li>
                  <li>Retirada e transporte de material lenhoso resultante de intervenção por terceiro em área de servidão</li>
                  <li>Transporte de material lenhoso resultante de aproveitamento de árvores mortas</li>
                </ul>
                <p style={{ fontWeight: 500, color: "var(--neutral-700)", marginBottom: "0.25rem" }}>Atenção: Esta pergunta não se refere ao aproveitamento comercial de lenha, madeira ou carvão resultantes da sua intervenção. Esses produtos serão tratados na próxima etapa.</p>
                <p style={{ fontSize: "0.75rem", color: "var(--neutral-400)" }}>Base legal: Art. 5° da Resolução Conjunta SEMAD/IEF n° 3.102/2021</p>
              </div>
              {[{ valor: true, texto: "Sim" }, { valor: false, texto: "Não" }].map((op) => (
                <OpcaoBtn key={String(op.valor)} selected={state.temAproveitamento === op.valor} onClick={() => selecionar("temAproveitamento", op.valor)}>
                  {op.texto}
                </OpcaoBtn>
              ))}
            </div>
          )}

          {stepId === "quantidades" && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Informe as quantidades</h2>
              <p className="text-sm text-muted-foreground mb-4">Preencha a quantidade para cada atividade identificada.</p>
              {getAtividadesDisponiveis().map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", border: "1px solid var(--neutral-200)", borderRadius: "var(--radius-lg)", marginBottom: "0.75rem" }}>
                  <label style={{ flex: 1, fontSize: "0.9rem" }}>{a.nome}<br /><span style={{ color: "var(--neutral-400)", fontSize: "0.8rem" }}>Código {a.codigo}</span></label>
                  <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="0"
                    value={state.quantidades[a.id] || ""}
                    onChange={(e) => setState((prev) => ({ ...prev, quantidades: { ...prev.quantidades, [a.id]: parseFloat(e.target.value) || 0 } }))}
                    style={{ width: "120px", padding: "0.5rem 0.75rem", border: "2px solid var(--neutral-200)", borderRadius: "var(--radius-md)", textAlign: "right", fontSize: "1rem" }} />
                  <span style={{ fontSize: "0.8rem", color: "var(--neutral-500)", minWidth: "40px" }}>{a.unidade}</span>
                </div>
              ))}
            </div>
          )}

          {stepId === "introFlorestal" && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Taxa Florestal e Reposição</h2>
              <p className="text-sm text-muted-foreground mb-4">Agora vamos verificar se há <strong>produtos florestais</strong> resultantes da intervenção, o que gera a Taxa Florestal e, no caso de vegetação nativa, a obrigação de Reposição Florestal.</p>
            </div>
          )}

          {stepId === "temProdutos" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">A intervenção gerará produtos florestais?</h2>
              <p className="text-sm text-muted-foreground mb-3">Lenha, madeira, carvão ou produtos não madeireiros.</p>
              {[{ valor: true, texto: "Sim" }, { valor: false, texto: "Não" }].map((op) => (
                <OpcaoBtn key={String(op.valor)} selected={state.temProdutos === op.valor} onClick={() => selecionar("temProdutos", op.valor)}>
                  {op.texto}
                </OpcaoBtn>
              ))}
            </div>
          )}

          {stepId === "produtosSelecionados" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Quais produtos?</h2>
              <p className="text-sm text-muted-foreground mb-3">Selecione todos que se aplicam.</p>
              {Object.entries(grupos).map(([grupo, prods]) => (
                <div key={grupo} style={{ marginBottom: "1rem" }}>
                  <h4 style={{ fontSize: "0.8rem", color: "var(--neutral-500)", textTransform: "uppercase", marginBottom: "0.5rem" }}>{grupo}</h4>
                  {prods.map((p) => (
                    <OpcaoBtn key={p.id} selected={state.produtosSelecionados.includes(p.id)} onClick={() => toggleArray("produtosSelecionados", p.id)}>
                      {p.nome}
                    </OpcaoBtn>
                  ))}
                </div>
              ))}
            </div>
          )}

          {stepId === "volumes" && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Informe os volumes</h2>
              <p className="text-sm text-muted-foreground mb-4">Preencha o volume para cada produto selecionado.</p>
              {PRODUTOS.filter((p) => state.produtosSelecionados.includes(p.id)).map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", border: "1px solid var(--neutral-200)", borderRadius: "var(--radius-lg)", marginBottom: "0.75rem" }}>
                  <label style={{ flex: 1, fontSize: "0.9rem" }}>{p.nome}<br /><span style={{ color: "var(--neutral-400)", fontSize: "0.8rem" }}>Código {p.codigo}</span></label>
                  <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="0"
                    value={state.volumes[p.id] || ""}
                    onChange={(e) => setState((prev) => ({ ...prev, volumes: { ...prev.volumes, [p.id]: parseFloat(e.target.value) || 0 } }))}
                    style={{ width: "120px", padding: "0.5rem 0.75rem", border: "2px solid var(--neutral-200)", borderRadius: "var(--radius-md)", textAlign: "right", fontSize: "1rem" }} />
                  <span style={{ fontSize: "0.8rem", color: "var(--neutral-500)", minWidth: "40px" }}>{p.unidade}</span>
                </div>
              ))}
            </div>
          )}

          {stepId === "dentroLicenciamento" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">A intervenção está dentro de processo de licenciamento ambiental?</h2>
              <p className="text-sm text-muted-foreground mb-3">Isso define o órgão de destino do DAE.</p>
              {[{ valor: true, texto: "Sim, faz parte de licenciamento" }, { valor: false, texto: "Não, é pedido avulso (IEF)" }].map((op) => (
                <OpcaoBtn key={String(op.valor)} selected={state.dentroLicenciamento === op.valor} onClick={() => selecionar("dentroLicenciamento", op.valor)}>
                  {op.texto}
                </OpcaoBtn>
              ))}
            </div>
          )}

          {stepId === "dadosEmpreendimento" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Dados do empreendimento</h2>
              <p className="text-sm text-muted-foreground mb-4">Esses dados serão usados na ficha do DAE.</p>
              <div className="acam-form-group">
                <label className="acam-form-label">CPF ou CNPJ</label>
                <input className="acam-form-input" placeholder="000.000.000-00 ou 00.000.000/0000-00" maxLength={18}
                  value={documento} onChange={(e) => formatarDocumento(e.target.value)} />
                {cnpjStatus && <p className="text-xs mt-1" style={{ color: cnpjStatus.includes("preenchidos") ? "var(--primary-600)" : "#d97706" }}>{cnpjStatus}</p>}
              </div>
              <div className="acam-form-group">
                <label className="acam-form-label">Nome / Razão Social</label>
                <input className="acam-form-input" placeholder="Nome completo ou razão social" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="acam-form-group">
                <label className="acam-form-label">Município</label>
                <input className="acam-form-input" placeholder="Município em MG" value={municipio} onChange={(e) => setMunicipio(e.target.value)} />
              </div>
              <div className="acam-form-group">
                <label className="acam-form-label">Nº do Processo (opcional)</label>
                <input className="acam-form-input" placeholder="Número do processo administrativo" value={processo} onChange={(e) => setProcesso(e.target.value)} />
              </div>
            </div>
          )}

          {stepId === "resultado" && resultado && (() => {
            const descExpediente = resultado.itensExpediente.map((i) => `${i.nome} (${i.codigo}): ${i.qtd} ${un(i.unidade, i.qtd)}`).join("; ")
            const descFlorestal = resultado.itensFlorestal.map((i) => `${i.nome} (${i.codigo}): ${i.vol} ${un(i.unidade, i.vol)}`).join("; ")
            const orgaoFlorestal = state.dentroLicenciamento ? "SECRETARIA ESTADO DE MEIO AMBIENTE E DESENVOLVIMENTO SUSTENTÁVEL" : "INSTITUTO ESTADUAL DE FLORESTAS - IEF"

            return (
              <div>
                {/* Total */}
                <div style={{ background: "linear-gradient(135deg, #1a3a2a 0%, #2d5a3f 100%)", color: "white", borderRadius: "var(--radius-xl)", padding: "2rem", textAlign: "center", marginBottom: "1.5rem" }}>
                  <p style={{ fontSize: "0.9rem", opacity: 0.85, marginBottom: "0.5rem" }}>Valor Total</p>
                  <p style={{ fontSize: "2.5rem", fontWeight: 800 }}>{fmt(resultado.total)}</p>
                  {resultado.totalReposicao > 0 && <p style={{ fontSize: "0.8rem", opacity: 0.7, marginTop: "0.5rem" }}>Inclui reposição florestal</p>}
                </div>

                {/* Taxa de Expediente */}
                {resultado.itensExpediente.length > 0 && (
                  <div className="acam-card mb-4" style={{ padding: "var(--spacing-5)" }}>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">Taxa de Expediente</h3>
                      <span className="font-semibold" style={{ color: "var(--primary-700)" }}>{fmt(resultado.totalExpediente)}</span>
                    </div>
                    {resultado.itensExpediente.map((i) => (
                      <div key={i.codigo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid var(--neutral-100)", fontSize: "0.9rem" }}>
                        <div><span>{i.nome}</span><br /><span style={{ color: "var(--neutral-400)", fontSize: "0.8rem" }}>Código {i.codigo} · {i.qtd} {un(i.unidade, i.qtd)}</span></div>
                        <span style={{ fontWeight: 600, color: "var(--primary-700)", whiteSpace: "nowrap" }}>{fmt(i.valor)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Taxa Florestal */}
                {resultado.itensFlorestal.length > 0 && (
                  <div className="acam-card mb-4" style={{ padding: "var(--spacing-5)" }}>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">Taxa Florestal</h3>
                      <span className="font-semibold" style={{ color: "var(--primary-700)" }}>{fmt(resultado.totalFlorestal)}</span>
                    </div>
                    {resultado.itensFlorestal.map((i) => (
                      <div key={i.codigo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid var(--neutral-100)", fontSize: "0.9rem" }}>
                        <div><span>{i.nome}</span><br /><span style={{ color: "var(--neutral-400)", fontSize: "0.8rem" }}>Código {i.codigo} · {i.vol} {un(i.unidade, i.vol)}</span></div>
                        <span style={{ fontWeight: 600, color: "var(--primary-700)", whiteSpace: "nowrap" }}>{fmt(i.valor)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reposição */}
                {resultado.itensReposicao.length > 0 && (
                  <div className="acam-card mb-4" style={{ padding: "var(--spacing-5)" }}>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold">Reposição Florestal</h3>
                      <span className="font-semibold" style={{ color: "var(--primary-700)" }}>{fmt(resultado.totalReposicao)}</span>
                    </div>
                    {resultado.itensReposicao.map((i) => (
                      <div key={i.codigo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderBottom: "1px solid var(--neutral-100)", fontSize: "0.9rem" }}>
                        <div><span>{i.nome}</span><br /><span style={{ color: "var(--neutral-400)", fontSize: "0.8rem" }}>{i.vol} {un(i.unidade, i.vol)} × {i.arvores} árv/{i.unidade} = {i.totalArvores} árvores</span></div>
                        <span style={{ fontWeight: 600, color: "var(--primary-700)", whiteSpace: "nowrap" }}>{fmt(i.valor)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Orientações DAE */}
                <Accordion titulo="Orientações para emissão do DAE">
                  <div className="text-center mb-6">
                    <a href="https://daeonline1.fazenda.mg.gov.br/daeonline/executeReceitaOrgaosEstaduais.action" target="_blank" rel="noopener noreferrer" className="acam-btn acam-btn-primary">
                      Acessar DAE Online — SEF/MG
                    </a>
                  </div>

                  <div style={{ background: "var(--primary-50)", borderRadius: "var(--radius-lg)", padding: "1.25rem", marginBottom: "1.5rem" }}>
                    <h4 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--primary-700)", textAlign: "center", marginBottom: "1rem" }}>Passo a passo para emissão do DAE</h4>
                    {[
                      "Acesse o DAE Online",
                      "Selecione o Órgão Público",
                      "Selecione o Serviço",
                      "Preencha o Valor da Receita",
                      "Cole as Informações Complementares",
                      'Clique em "Continuar" e "Emitir DAE"',
                    ].map((t, n) => (
                      <div key={n} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                        <div style={{ width: "2rem", height: "2rem", borderRadius: "50%", background: "var(--primary-700)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 700, flexShrink: 0 }}>{n + 1}</div>
                        <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{t}</span>
                      </div>
                    ))}
                  </div>

                  {/* Ficha DAE - Expediente */}
                  {resultado.totalExpediente > 0 && (
                    <div className="acam-card mb-3" style={{ padding: "var(--spacing-4)", background: "var(--neutral-50)", border: "2px solid var(--primary-100)" }}>
                      <h4 className="font-semibold mb-3" style={{ fontSize: "0.95rem", color: "var(--primary-700)" }}>Taxa de Expediente</h4>
                      <div style={{ background: "var(--neutral-50)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "0.5rem" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Órgão Público</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>{orgao}</div>
                      </div>
                      <div style={{ background: "var(--neutral-50)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "0.5rem" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Serviço</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>ANÁLISE DE INTERVENÇÃO AMBIENTAL</div>
                      </div>
                      <div style={{ background: "var(--primary-50)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "0.5rem", border: "2px solid var(--primary-200)" }}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Valor da Receita</div>
                            <div style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--primary-700)" }}>{fmt(resultado.totalExpediente)}</div>
                          </div>
                          <button className="acam-btn acam-btn-ghost acam-btn-sm" onClick={(e) => copiar(resultado.totalExpediente.toFixed(2).replace(".", ","), e.currentTarget)}>Copiar</button>
                        </div>
                      </div>
                      <div style={{ background: "var(--neutral-50)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem" }}>
                        <div className="flex justify-between items-center">
                          <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", textTransform: "uppercase" }}>Informações Complementares</div>
                          <button className="acam-btn acam-btn-ghost acam-btn-sm" onClick={(e) => copiar(montarInfoComplementares(nome, documento, municipio, processo, descExpediente), e.currentTarget)}>Copiar</button>
                        </div>
                        <pre style={{ fontSize: "0.78rem", marginTop: "0.25rem", whiteSpace: "pre-line", fontFamily: "monospace", lineHeight: 1.6, maxHeight: "200px", overflowY: "auto", background: "white", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--neutral-200)" }}>
                          {montarInfoComplementares(nome, documento, municipio, processo, descExpediente)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Ficha DAE - Florestal */}
                  {resultado.totalFlorestal > 0 && (
                    <div className="acam-card mb-3" style={{ padding: "var(--spacing-4)", background: "var(--neutral-50)", border: "2px solid var(--primary-100)" }}>
                      <h4 className="font-semibold mb-3" style={{ fontSize: "0.95rem", color: "var(--primary-700)" }}>Taxa Florestal</h4>
                      <div style={{ background: "var(--neutral-50)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "0.5rem" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Órgão Público</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>{orgaoFlorestal}</div>
                      </div>
                      <div style={{ background: "var(--neutral-50)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "0.5rem" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Serviço</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>TAXA FLORESTAL</div>
                      </div>
                      <div style={{ background: "var(--primary-50)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "0.5rem", border: "2px solid var(--primary-200)" }}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Valor da Receita</div>
                            <div style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--primary-700)" }}>{fmt(resultado.totalFlorestal)}</div>
                          </div>
                          <button className="acam-btn acam-btn-ghost acam-btn-sm" onClick={(e) => copiar(resultado.totalFlorestal.toFixed(2).replace(".", ","), e.currentTarget)}>Copiar</button>
                        </div>
                      </div>
                      <div style={{ background: "var(--neutral-50)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem" }}>
                        <div className="flex justify-between items-center">
                          <div style={{ fontSize: "0.75rem", color: "var(--neutral-500)", textTransform: "uppercase" }}>Informações Complementares</div>
                          <button className="acam-btn acam-btn-ghost acam-btn-sm" onClick={(e) => copiar(montarInfoComplementares(nome, documento, municipio, processo, descFlorestal), e.currentTarget)}>Copiar</button>
                        </div>
                        <pre style={{ fontSize: "0.78rem", marginTop: "0.25rem", whiteSpace: "pre-line", fontFamily: "monospace", lineHeight: 1.6, maxHeight: "200px", overflowY: "auto", background: "white", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--neutral-200)" }}>
                          {montarInfoComplementares(nome, documento, municipio, processo, descFlorestal)}
                        </pre>
                      </div>
                    </div>
                  )}
                </Accordion>

                {/* UFEMG ref */}
                <p className="text-xs text-muted-foreground text-center mb-4">
                  UFEMG {ufemg.ano}: R$ {ufemg.valor.toFixed(4).replace(".", ",")}
                  {ufemgFallback ? " (valor de referência — confirme no site da Fazenda de MG)" : ""}
                </p>

                {/* Botões */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <button className="acam-btn acam-btn-primary" style={{ width: "100%" }} onClick={async () => {
                    try {
                      const res = await fetch("/api/pdf/calculadora", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...resultado,
                          ufemgAno: ufemg.ano,
                          ufemgValor: ufemg.valor,
                          nome, documento, municipio, processo,
                          dentroLicenciamento: state.dentroLicenciamento,
                        }),
                      })
                      if (res.ok) {
                        const blob = await res.blob()
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement("a")
                        a.href = url
                        a.download = "ACAM-Calculadora-Intervencao-" + new Date().toISOString().slice(0, 10) + ".pdf"
                        a.click()
                        URL.revokeObjectURL(url)
                      }
                    } catch (err) {
                      console.error("Erro ao gerar PDF:", err)
                    }
                  }}>Salvar PDF</button>
                  <button className="acam-btn acam-btn-ghost" style={{ width: "100%" }} onClick={reiniciar}>Nova Simulação</button>
                </div>
              </div>
            )
          })()}

          {/* Navegação */}
          {stepId !== "resultado" && (
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              {etapaAtual > 0 && (
                <button className="acam-btn acam-btn-ghost" style={{ flex: 1 }} onClick={voltar}>Voltar</button>
              )}
              <button className="acam-btn acam-btn-primary" style={{ flex: 1 }} onClick={avancar}>{btnLabel}</button>
            </div>
          )}
        </div>
      </main>

    </div>
  )
}

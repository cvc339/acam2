"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Status = "rascunho" | "publicado" | "arquivado"

type Artigo = {
  id?: string
  titulo: string
  slug: string
  resumo: string | null
  conteudo: string | null
  categoria: string
  autor: string
  capa_url: string | null
  status: Status
}

const CATEGORIAS = [
  { value: "compensacoes-ambientais", label: "Compensações ambientais" },
  { value: "licenciamento", label: "Licenciamento" },
  { value: "compliance-socioambiental", label: "Compliance socioambiental" },
  { value: "regulatorio", label: "Regulatório" },
  { value: "due-diligence", label: "Due diligence" },
  { value: "geral", label: "Direito ambiental — geral" },
]

function gerarSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
}

/**
 * Mapeia nome de categoria (label ou valor) para o valor canonico do select.
 * Aceita variacoes: "Compensacoes ambientais", "compensacoes-ambientais",
 * "Direito ambiental — geral", etc.
 */
function normalizarCategoria(valor: string): string {
  const limpo = valor
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[—–]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  // Match direto pelo value do select
  const matchValor = CATEGORIAS.find((c) => c.value === limpo)
  if (matchValor) return matchValor.value

  // Heuristicas por palavras-chave
  if (limpo.includes("compens")) return "compensacoes-ambientais"
  if (limpo.includes("licenci")) return "licenciamento"
  if (limpo.includes("compliance") || limpo.includes("socio")) return "compliance-socioambiental"
  if (limpo.includes("regulat")) return "regulatorio"
  if (limpo.includes("due") || limpo.includes("diligence") || limpo.includes("diligencia")) return "due-diligence"
  return "geral"
}

/**
 * Parseia a saida do Project do Claude no formato:
 *
 *   Título: ...
 *   Resumo: ...
 *   Categoria sugerida: ...
 *   ---
 *   [corpo em markdown]
 *
 * Tolerante a variacoes: **negrito** nos labels, acentuacao no label,
 * "Categoria" com ou sem "sugerida", multiplas linhas no resumo.
 */
function parseRascunhoClaude(texto: string): {
  titulo?: string
  resumo?: string
  categoria?: string
  conteudo?: string
  camposPreenchidos: string[]
} {
  const resultado: {
    titulo?: string
    resumo?: string
    categoria?: string
    conteudo?: string
    camposPreenchidos: string[]
  } = { camposPreenchidos: [] }

  // Separar cabecalho (metadados) do corpo, via linha com apenas "---"
  const sepMatch = texto.match(/\n---+[ \t]*\n/)
  let cabecalho = texto
  let corpo = ""
  if (sepMatch && sepMatch.index !== undefined) {
    cabecalho = texto.slice(0, sepMatch.index)
    corpo = texto.slice(sepMatch.index + sepMatch[0].length).trim()
  }

  if (corpo) {
    resultado.conteudo = corpo
    resultado.camposPreenchidos.push("Conteúdo")
  }

  // Parse label-a-label do cabecalho
  const linhas = cabecalho.split(/\r?\n/)
  let campoAtual: "titulo" | "resumo" | "categoria" | null = null
  let buffer: string[] = []

  const flush = () => {
    if (campoAtual && buffer.length) {
      const val = buffer.join("\n").trim()
      if (val) {
        if (campoAtual === "categoria") {
          resultado.categoria = normalizarCategoria(val)
          resultado.camposPreenchidos.push("Categoria")
        } else {
          resultado[campoAtual] = val
          resultado.camposPreenchidos.push(
            campoAtual === "titulo" ? "Título" : "Resumo"
          )
        }
      }
    }
    buffer = []
  }

  const regexLabel = /^\s*(?:\*\*|__)?\s*(t[íi]tulo|resumo|categoria)(?:\s+sugerida)?\s*(?:\*\*|__)?\s*:\s*(.*)$/i

  for (const linha of linhas) {
    const m = linha.match(regexLabel)
    if (m) {
      flush()
      const rotulo = m[1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      campoAtual =
        rotulo === "titulo" ? "titulo" :
        rotulo === "resumo" ? "resumo" :
        rotulo === "categoria" ? "categoria" : null
      if (campoAtual && m[2]) buffer.push(m[2])
    } else if (campoAtual) {
      buffer.push(linha)
    }
  }
  flush()

  return resultado
}

interface Props {
  artigo?: Artigo
}

export function ArtigoForm({ artigo }: Props) {
  const router = useRouter()
  const editando = !!artigo?.id

  const [titulo, setTitulo] = useState(artigo?.titulo ?? "")
  const [slug, setSlug] = useState(artigo?.slug ?? "")
  const [slugManual, setSlugManual] = useState(editando)
  const [resumo, setResumo] = useState(artigo?.resumo ?? "")
  const [conteudo, setConteudo] = useState(artigo?.conteudo ?? "")
  const [categoria, setCategoria] = useState(artigo?.categoria ?? "geral")
  const [autor, setAutor] = useState(artigo?.autor ?? "Cláudio Vieira Castro")
  const [capaUrl, setCapaUrl] = useState(artigo?.capa_url ?? "")
  const [status, setStatus] = useState<Status>(artigo?.status ?? "rascunho")

  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState("")
  const [mensagem, setMensagem] = useState("")

  // Estado do painel "Colar do Claude"
  const [colarAberto, setColarAberto] = useState(false)
  const [colarTexto, setColarTexto] = useState("")
  const [colarFeedback, setColarFeedback] = useState("")

  function handleColarParse() {
    const parsed = parseRascunhoClaude(colarTexto)
    if (parsed.camposPreenchidos.length === 0) {
      setColarFeedback(
        "Não encontrei os rótulos esperados (Título:, Resumo:, Categoria sugerida:, ---). Confira se colou o rascunho inteiro."
      )
      return
    }
    if (parsed.titulo) {
      setTitulo(parsed.titulo)
      if (!slugManual) setSlug(gerarSlug(parsed.titulo))
    }
    if (parsed.resumo) setResumo(parsed.resumo)
    if (parsed.categoria) setCategoria(parsed.categoria)
    if (parsed.conteudo) setConteudo(parsed.conteudo)
    setColarFeedback(`Preenchido: ${parsed.camposPreenchidos.join(", ")}.`)
    // fechar o painel apos 1.5s
    setTimeout(() => {
      setColarAberto(false)
      setColarTexto("")
      setColarFeedback("")
    }, 1500)
  }

  function handleTituloChange(valor: string) {
    setTitulo(valor)
    if (!slugManual) setSlug(gerarSlug(valor))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setMensagem("")
    setLoading(true)

    const payload = {
      titulo: titulo.trim(),
      slug: slug.trim(),
      resumo: resumo.trim() || null,
      conteudo,
      categoria,
      autor: autor.trim() || "Cláudio Vieira Castro",
      capa_url: capaUrl.trim() || null,
      status,
    }

    try {
      const url = editando ? `/api/admin/artigos/${artigo!.id}` : "/api/admin/artigos"
      const method = editando ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        setErro(data.erro || "Erro ao salvar.")
        setLoading(false)
        return
      }

      setMensagem("Salvo.")
      if (!editando && data.artigo?.id) {
        router.push(`/admin/artigos/${data.artigo.id}`)
        return
      }
      router.refresh()
    } catch {
      setErro("Erro de comunicação.")
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Painel "Colar do Claude" — só aparece na criação */}
      {!editando && (
        <div
          style={{
            border: `1px dashed ${colarAberto ? "var(--primary-600)" : "var(--grey-200)"}`,
            borderRadius: "0.5rem",
            padding: colarAberto ? "1rem" : "0.6rem 0.875rem",
            background: colarAberto ? "var(--primary-50)" : "transparent",
            transition: "all 0.15s",
          }}
        >
          {!colarAberto ? (
            <button
              type="button"
              onClick={() => setColarAberto(true)}
              style={{
                background: "none",
                border: "none",
                color: "var(--primary-600)",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                width: "100%",
                textAlign: "left",
                padding: 0,
              }}
            >
              <span>📋</span>
              <span>Colar rascunho do Claude.ai (preenche todos os campos de uma vez)</span>
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <label className="text-xs font-medium text-muted-foreground">
                Cole o texto completo que o Claude devolveu, incluindo os rótulos Título:, Resumo:, Categoria sugerida: e o corpo após ---
              </label>
              <textarea
                className="acam-form-input"
                value={colarTexto}
                onChange={(e) => setColarTexto(e.target.value)}
                rows={8}
                autoFocus
                style={{
                  width: "100%",
                  fontFamily: "ui-monospace, 'Courier New', monospace",
                  fontSize: "0.85rem",
                  resize: "vertical",
                }}
                placeholder={"Título: ...\nResumo: ...\nCategoria sugerida: ...\n---\n[corpo do artigo]"}
              />
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleColarParse}
                  className="acam-btn acam-btn-primary acam-btn-sm"
                  disabled={!colarTexto.trim()}
                >
                  Preencher campos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setColarAberto(false)
                    setColarTexto("")
                    setColarFeedback("")
                  }}
                  className="acam-btn acam-btn-ghost acam-btn-sm"
                >
                  Cancelar
                </button>
                {colarFeedback && (
                  <span
                    className="text-xs"
                    style={{
                      color: colarFeedback.startsWith("Preenchido")
                        ? "var(--success)"
                        : "var(--error)",
                    }}
                  >
                    {colarFeedback}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Linha 1: título */}
      <div>
        <label className="text-xs font-medium text-muted-foreground" style={{ display: "block", marginBottom: "0.25rem" }}>
          Título
        </label>
        <input
          type="text"
          className="acam-form-input"
          value={titulo}
          onChange={(e) => handleTituloChange(e.target.value)}
          required
          style={{ width: "100%", fontSize: "1rem" }}
        />
      </div>

      {/* Linha 2: slug (auto ou manual) */}
      <div>
        <label className="text-xs font-medium text-muted-foreground" style={{ display: "block", marginBottom: "0.25rem" }}>
          Slug (URL)
          {!slugManual && (
            <button
              type="button"
              onClick={() => setSlugManual(true)}
              style={{ marginLeft: "0.5rem", fontSize: "0.7rem", color: "var(--primary-600)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer" }}
            >
              editar manualmente
            </button>
          )}
        </label>
        <input
          type="text"
          className="acam-form-input"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          disabled={!slugManual}
          style={{ width: "100%", fontFamily: "monospace", fontSize: "0.9rem" }}
        />
      </div>

      {/* Linha 3: resumo */}
      <div>
        <label className="text-xs font-medium text-muted-foreground" style={{ display: "block", marginBottom: "0.25rem" }}>
          Resumo (aparece na listagem e nos metadados)
        </label>
        <textarea
          className="acam-form-input"
          value={resumo}
          onChange={(e) => setResumo(e.target.value)}
          rows={3}
          style={{ width: "100%", resize: "vertical" }}
        />
      </div>

      {/* Linha 4: categoria + autor (side-by-side em desktop, empilhado em mobile) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <div>
          <label className="text-xs font-medium text-muted-foreground" style={{ display: "block", marginBottom: "0.25rem" }}>
            Categoria
          </label>
          <select
            className="acam-form-input"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            style={{ width: "100%" }}
          >
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground" style={{ display: "block", marginBottom: "0.25rem" }}>
            Autor
          </label>
          <input
            type="text"
            className="acam-form-input"
            value={autor}
            onChange={(e) => setAutor(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* Linha 5: capa URL */}
      <div>
        <label className="text-xs font-medium text-muted-foreground" style={{ display: "block", marginBottom: "0.25rem" }}>
          URL da imagem de capa (opcional)
        </label>
        <input
          type="url"
          className="acam-form-input"
          value={capaUrl}
          onChange={(e) => setCapaUrl(e.target.value)}
          placeholder="https://..."
          style={{ width: "100%" }}
        />
      </div>

      {/* Linha 6: status (radio) */}
      <div>
        <label className="text-xs font-medium text-muted-foreground" style={{ display: "block", marginBottom: "0.4rem" }}>
          Status
        </label>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {(["rascunho", "publicado", "arquivado"] as Status[]).map((s) => (
            <label key={s} style={{
              flex: "1 1 90px",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.6rem 0.75rem",
              border: `1px solid ${status === s ? "var(--primary-600)" : "var(--grey-200)"}`,
              borderRadius: "0.375rem",
              cursor: "pointer",
              background: status === s ? "var(--primary-50, #f0f5f0)" : "transparent",
              fontSize: "0.9rem",
            }}>
              <input
                type="radio"
                name="status"
                value={s}
                checked={status === s}
                onChange={() => setStatus(s)}
                style={{ accentColor: "var(--primary-600)" }}
              />
              <span style={{ textTransform: "capitalize" }}>{s}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Linha 7: conteúdo (markdown) */}
      <div>
        <label className="text-xs font-medium text-muted-foreground" style={{ display: "block", marginBottom: "0.25rem" }}>
          Conteúdo (markdown)
        </label>
        <textarea
          className="acam-form-input"
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          rows={20}
          style={{
            width: "100%",
            fontFamily: "ui-monospace, 'Courier New', monospace",
            fontSize: "0.9rem",
            lineHeight: 1.6,
            resize: "vertical",
            minHeight: "400px",
          }}
          placeholder="## Título de seção\n\nParágrafo aqui. Use **negrito** e [links](https://...)."
        />
        <p className="text-xs text-muted-foreground" style={{ marginTop: "0.25rem" }}>
          Markdown. Use <code>## Título</code> para seções, <code>**negrito**</code>, <code>*itálico*</code>, <code>[texto](url)</code> para links.
        </p>
      </div>

      {/* Submit */}
      <div style={{
        position: "sticky",
        bottom: 0,
        background: "var(--background, #fff)",
        padding: "0.75rem 0",
        borderTop: "1px solid var(--grey-100)",
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
        flexWrap: "wrap",
      }}>
        <button type="submit" className="acam-btn acam-btn-primary" disabled={loading}>
          {loading ? "Salvando..." : editando ? "Salvar alterações" : "Criar artigo"}
        </button>
        {erro && <span className="text-sm" style={{ color: "var(--error)" }}>{erro}</span>}
        {mensagem && <span className="text-sm" style={{ color: "var(--success)" }}>{mensagem}</span>}
      </div>
    </form>
  )
}

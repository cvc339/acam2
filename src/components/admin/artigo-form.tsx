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

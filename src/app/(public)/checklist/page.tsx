"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { HeaderLogo } from "@/components/acam"
import { perguntas } from "@/lib/checklist/perguntas"

export default function ChecklistPage() {
  const router = useRouter()
  const [respostas, setRespostas] = useState<Record<string, string | string[]>>({})
  const [historico, setHistorico] = useState<number[]>([])
  const [perguntaAtualIdx, setPerguntaAtualIdx] = useState(0)
  const [multiSelecao, setMultiSelecao] = useState<string[]>([])

  // Filtrar perguntas visíveis com base nas condições
  const perguntasVisiveis = perguntas.filter(
    (p) => !p.condicao || p.condicao(respostas)
  )

  const perguntaAtual = perguntasVisiveis[perguntaAtualIdx]
  const totalPerguntas = perguntasVisiveis.length
  const progresso = totalPerguntas > 0 ? ((perguntaAtualIdx + 1) / totalPerguntas) * 100 : 0

  function avancar(novasRespostas: Record<string, string | string[]>) {
    // Recalcular perguntas visíveis com as NOVAS respostas
    const novasVisiveis = perguntas.filter(
      (p) => !p.condicao || p.condicao(novasRespostas)
    )
    const novoTotal = novasVisiveis.length

    if (perguntaAtualIdx + 1 >= novoTotal) {
      finalizar(novasRespostas)
    } else {
      setPerguntaAtualIdx(perguntaAtualIdx + 1)
    }
  }

  function responder(valor: string) {
    if (!perguntaAtual) return

    const novasRespostas = { ...respostas, [perguntaAtual.campo]: valor }
    setRespostas(novasRespostas)
    setHistorico([...historico, perguntaAtualIdx])
    avancar(novasRespostas)
  }

  function responderMultiplo() {
    if (!perguntaAtual || multiSelecao.length === 0) return

    const novasRespostas = { ...respostas, [perguntaAtual.campo]: multiSelecao }
    setRespostas(novasRespostas)
    setHistorico([...historico, perguntaAtualIdx])
    setMultiSelecao([])
    avancar(novasRespostas)
  }

  function voltar() {
    if (historico.length === 0) return
    const novoHistorico = [...historico]
    const anterior = novoHistorico.pop()!
    setHistorico(novoHistorico)
    setPerguntaAtualIdx(anterior)
  }

  function reiniciar() {
    if (window.confirm("Deseja reiniciar o questionário?")) {
      setRespostas({})
      setHistorico([])
      setPerguntaAtualIdx(0)
      setMultiSelecao([])
    }
  }

  function finalizar(respostasFinais: Record<string, string | string[]>) {
    localStorage.setItem("checklist_resultado", JSON.stringify(respostasFinais))
    localStorage.removeItem("checklist_acam2")
    router.push("/dashboard")
  }

  function toggleMulti(valor: string) {
    setMultiSelecao((prev) =>
      prev.includes(valor)
        ? prev.filter((v) => v !== valor)
        : [...prev, valor]
    )
  }

  if (!perguntaAtual) return null

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--neutral-50)" }}>
      {/* Header com progresso */}
      <header className="acam-header">
        <div className="acam-header-content">
          <HeaderLogo />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Pergunta <strong>{perguntaAtualIdx + 1}</strong>
            </span>
            <button onClick={reiniciar} className="acam-btn acam-btn-ghost acam-btn-sm">
              Reiniciar
            </button>
          </div>
        </div>
        {/* Barra de progresso */}
        <div style={{ height: "3px", background: "var(--neutral-200)" }}>
          <div style={{
            height: "100%",
            width: `${progresso}%`,
            background: "var(--primary-500)",
            transition: "width 0.3s ease",
          }} />
        </div>
      </header>

      {/* Pergunta */}
      <main style={{
        flex: 1, display: "flex", justifyContent: "center",
        padding: "4rem 2rem 2rem",
      }}>
        <div style={{ width: "100%", maxWidth: "40rem", paddingTop: "2rem" }} className="acam-slide-up" key={perguntaAtual.id}>
          {perguntaAtualIdx === 0 && (
            <div className="acam-alert-result" style={{ marginBottom: "32px" }}>
              Responda ao questionário. O resultado será exibido no seu painel principal.
            </div>
          )}
          <h2 style={{
            fontFamily: "var(--font-family-heading)",
            fontSize: "1.5rem", fontWeight: 600,
            color: "var(--neutral-900)",
            marginBottom: perguntaAtual.subtitulo ? "8px" : "32px",
          }}>
            {perguntaAtual.titulo}
          </h2>

          {perguntaAtual.subtitulo && (
            <p className="text-sm text-muted-foreground" style={{ marginBottom: "32px" }}>
              {perguntaAtual.subtitulo}
            </p>
          )}

          {/* Opções */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {perguntaAtual.tipo === "single" ? (
              perguntaAtual.opcoes.map((op) => (
                <button
                  key={op.valor}
                  onClick={() => responder(op.valor)}
                  className="acam-card acam-card-hover"
                  style={{
                    padding: "16px 20px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 500,
                    color: "var(--neutral-700)",
                    border: respostas[perguntaAtual.campo] === op.valor
                      ? "2px solid var(--primary-500)"
                      : undefined,
                  }}
                >
                  {op.texto}
                </button>
              ))
            ) : (
              <>
                {perguntaAtual.opcoes.map((op) => (
                  <label
                    key={op.valor}
                    className="acam-card acam-card-hover"
                    style={{
                      padding: "16px 20px",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "12px",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: 500,
                      color: "var(--neutral-700)",
                      border: multiSelecao.includes(op.valor)
                        ? "2px solid var(--primary-500)"
                        : undefined,
                    }}
                  >
                    <input
                      type="checkbox"
                      className="acam-form-checkbox"
                      checked={multiSelecao.includes(op.valor)}
                      onChange={() => toggleMulti(op.valor)}
                    />
                    {op.texto}
                  </label>
                ))}
                <button
                  onClick={responderMultiplo}
                  disabled={multiSelecao.length === 0}
                  className="acam-btn acam-btn-primary"
                  style={{ marginTop: "8px" }}
                >
                  Continuar
                </button>
              </>
            )}
          </div>

          {/* Voltar */}
          {historico.length > 0 && (
            <button
              onClick={voltar}
              className="acam-btn acam-btn-ghost"
              style={{ marginTop: "24px" }}
            >
              ← Voltar
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

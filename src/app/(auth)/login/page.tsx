"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setSucesso("")
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })

    if (error) {
      setErro(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message
      )
      setLoading(false)
      return
    }

    setSucesso("Login realizado! Redirecionando...")
    setTimeout(() => {
      router.push("/dashboard")
      router.refresh()
    }, 1000)
  }

  return (
    <body className="page-public" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header className="acam-header">
        <div className="acam-header-content">
          <Link href="/" className="acam-header-logo">
            <div className="acam-header-logo-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-xl)", fontWeight: 600, color: "var(--neutral-800)" }}>ACAM</div>
              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--neutral-500)" }}>Compensações Ambientais</div>
            </div>
          </Link>
          <nav className="acam-header-nav">
            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--neutral-500)" }}>Não tem conta?</span>
            <Link href="/registro" className="acam-btn acam-btn-primary">Criar conta</Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "28rem" }}>
          <div className="acam-card" style={{ padding: "var(--spacing-8)" }}>
            <div style={{ textAlign: "center", marginBottom: "var(--spacing-6)" }}>
              <h2 style={{ marginBottom: "var(--spacing-1)" }}>Entrar</h2>
              <p style={{ color: "var(--neutral-500)", fontSize: "var(--font-size-sm)" }}>Acesse sua conta</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="acam-form-group">
                <label className="acam-form-label">E-mail</label>
                <input
                  type="email"
                  className="acam-form-input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="acam-form-group">
                <label className="acam-form-label">Senha</label>
                <input
                  type="password"
                  className="acam-form-input"
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--spacing-4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
                  <input type="checkbox" className="acam-form-checkbox" id="lembrar" />
                  <label htmlFor="lembrar" style={{ fontSize: "var(--font-size-sm)", color: "var(--neutral-500)" }}>Lembrar de mim</label>
                </div>
                <Link href="/recuperar-senha" style={{ fontSize: "var(--font-size-sm)", color: "var(--primary-600)" }}>
                  Esqueci a senha
                </Link>
              </div>

              {erro && (
                <div className="acam-alert acam-alert-error" style={{ marginBottom: "var(--spacing-4)" }}>
                  {erro}
                </div>
              )}

              {sucesso && (
                <div className="acam-alert acam-alert-success" style={{ marginBottom: "var(--spacing-4)", display: "flex", alignItems: "center", gap: "var(--spacing-2)" }}>
                  <span className="acam-spinner" style={{ width: "1rem", height: "1rem" }} />
                  <span>{sucesso}</span>
                </div>
              )}

              <button
                type="submit"
                className="acam-btn acam-btn-primary"
                style={{ width: "100%" }}
                disabled={loading}
              >
                {loading ? (
                  <><span className="acam-spinner" style={{ width: "1rem", height: "1rem" }} /> Entrando...</>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>

            <div className="acam-divider">
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--neutral-400)", padding: "0 var(--spacing-2)" }}>ou</span>
            </div>

            <Link href="/registro" className="acam-btn acam-btn-secondary" style={{ width: "100%", textAlign: "center" }}>
              Criar nova conta
            </Link>
          </div>

          <div style={{ textAlign: "center", marginTop: "var(--spacing-6)" }}>
            <Link href="/" style={{ fontSize: "var(--font-size-sm)", color: "var(--neutral-500)", display: "inline-flex", alignItems: "center", gap: "var(--spacing-1)" }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Voltar ao início
            </Link>
          </div>
        </div>
      </main>
    </body>
  )
}

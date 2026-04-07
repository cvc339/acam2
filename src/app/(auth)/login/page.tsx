"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { HeaderLogo } from "@/components/acam"

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
    <div className="page-public" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="acam-header">
        <div className="acam-header-content">
          <HeaderLogo />
          <nav className="acam-header-nav">
            <span className="text-sm text-muted-foreground">Não tem conta?</span>
            <Link href="/registro" className="acam-btn acam-btn-primary">Criar conta</Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "var(--max-width-md)" }}>
          <div className="acam-card" style={{ padding: "var(--spacing-8)" }}>
            <div className="text-center mb-6">
              <h2 className="mb-1">Entrar</h2>
              <p className="text-sm text-muted-foreground">Acesse sua conta</p>
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

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="acam-form-checkbox" id="lembrar" />
                  <label htmlFor="lembrar" className="text-sm text-muted-foreground">Lembrar de mim</label>
                </div>
                <Link href="/recuperar-senha" className="text-sm" style={{ color: "var(--primary-600)" }}>
                  Esqueci a senha
                </Link>
              </div>

              {erro && <div className="acam-alert acam-alert-error mb-4">{erro}</div>}

              {sucesso && (
                <div className="acam-alert acam-alert-success mb-4 flex items-center gap-2">
                  <span className="acam-spinner acam-spinner-sm" />
                  <span>{sucesso}</span>
                </div>
              )}

              <button type="submit" className="acam-btn acam-btn-primary w-full" disabled={loading}>
                {loading ? (
                  <><span className="acam-spinner acam-spinner-sm" /> Entrando...</>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>

            <div className="acam-divider">
              <span className="text-xs text-muted-foreground px-2">ou</span>
            </div>

            <Link href="/registro" className="acam-btn acam-btn-secondary w-full text-center">
              Criar nova conta
            </Link>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-muted-foreground inline-flex items-center gap-1">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
              Voltar ao início
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

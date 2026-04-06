"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function RegistroPage() {
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [empresa, setEmpresa] = useState("")
  const [senha, setSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [aceitaTermos, setAceitaTermos] = useState(false)
  const [aceitaComunicacoes, setAceitaComunicacoes] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault()
    setErro("")

    if (!aceitaTermos) {
      setErro("Você deve aceitar os termos de uso.")
      return
    }

    if (senha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.")
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, empresa, aceita_comunicacoes: aceitaComunicacoes },
      },
    })

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    setSucesso(true)
    setLoading(false)
  }

  if (sucesso) {
    return (
      <body className="page-public" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
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
          </div>
        </header>
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{ width: "100%", maxWidth: "28rem" }}>
            <div className="acam-card" style={{ padding: "var(--spacing-8)", textAlign: "center" }}>
              <div className="acam-alert acam-alert-success" style={{ marginBottom: "var(--spacing-4)" }}>
                Conta criada com sucesso!
              </div>
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--neutral-600)" }}>
                Enviamos um link de confirmação para <strong>{email}</strong>.
                Clique no link para ativar sua conta.
              </p>
              <Link href="/login" className="acam-btn acam-btn-primary" style={{ width: "100%", marginTop: "var(--spacing-6)" }}>
                Ir para login
              </Link>
            </div>
          </div>
        </main>
      </body>
    )
  }

  return (
    <body className="page-public" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
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
            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--neutral-500)" }}>Já tem conta?</span>
            <Link href="/login" className="acam-btn acam-btn-ghost">Entrar</Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "28rem" }}>
          <div className="acam-card" style={{ padding: "var(--spacing-8)" }}>
            <div style={{ textAlign: "center", marginBottom: "var(--spacing-6)" }}>
              <h2 style={{ marginBottom: "var(--spacing-1)" }}>Criar conta</h2>
              <p style={{ color: "var(--neutral-500)", fontSize: "var(--font-size-sm)" }}>Comece gratuitamente</p>
            </div>

            <form onSubmit={handleRegistro}>
              <div className="acam-form-group">
                <label className="acam-form-label">Nome completo</label>
                <input className="acam-form-input" placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} required autoComplete="name" />
              </div>

              <div className="acam-form-group">
                <label className="acam-form-label">E-mail</label>
                <input className="acam-form-input" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>

              <div className="acam-form-group">
                <label className="acam-form-label">Empresa <span style={{ color: "var(--neutral-400)", fontWeight: 400 }}>(opcional)</span></label>
                <input className="acam-form-input" placeholder="Nome da empresa" value={empresa} onChange={(e) => setEmpresa(e.target.value)} autoComplete="organization" />
              </div>

              <div className="acam-form-group">
                <label className="acam-form-label">Senha</label>
                <input className="acam-form-input" type="password" placeholder="Mínimo 6 caracteres" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} autoComplete="new-password" />
              </div>

              <div className="acam-form-group">
                <label className="acam-form-label">Confirmar senha</label>
                <input className="acam-form-input" type="password" placeholder="Repita a senha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required minLength={6} autoComplete="new-password" />
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--spacing-2)", marginBottom: "var(--spacing-3)" }}>
                <input type="checkbox" className="acam-form-checkbox" checked={aceitaTermos} onChange={(e) => setAceitaTermos(e.target.checked)} style={{ marginTop: "2px" }} />
                <label style={{ fontSize: "var(--font-size-sm)", color: "var(--neutral-600)" }}>
                  Aceito os <span style={{ color: "var(--primary-600)" }}>termos de uso</span> e a <span style={{ color: "var(--primary-600)" }}>política de privacidade</span>
                </label>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--spacing-2)", marginBottom: "var(--spacing-4)" }}>
                <input type="checkbox" className="acam-form-checkbox" checked={aceitaComunicacoes} onChange={(e) => setAceitaComunicacoes(e.target.checked)} style={{ marginTop: "2px" }} />
                <label style={{ fontSize: "var(--font-size-sm)", color: "var(--neutral-600)" }}>
                  Quero receber novidades e atualizações por e-mail
                </label>
              </div>

              {erro && (
                <div className="acam-alert acam-alert-error" style={{ marginBottom: "var(--spacing-4)" }}>
                  {erro}
                </div>
              )}

              <button type="submit" className="acam-btn acam-btn-primary" style={{ width: "100%" }} disabled={loading}>
                {loading ? (
                  <><span className="acam-spinner" style={{ width: "1rem", height: "1rem" }} /> Criando...</>
                ) : (
                  "Criar conta"
                )}
              </button>
            </form>

            <div className="acam-divider">
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--neutral-400)", padding: "0 var(--spacing-2)" }}>ou</span>
            </div>

            <Link href="/login" className="acam-btn acam-btn-secondary" style={{ width: "100%", textAlign: "center" }}>
              Já tenho uma conta
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

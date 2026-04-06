"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("")
  const [erro, setErro] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/atualizar-senha`,
    })

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    setEnviado(true)
    setLoading(false)
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
            <Link href="/login" className="acam-btn acam-btn-ghost">Voltar ao login</Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "28rem" }}>
          <div className="acam-card" style={{ padding: "var(--spacing-8)" }}>
            {enviado ? (
              <div style={{ textAlign: "center" }}>
                <div className="acam-alert acam-alert-success" style={{ marginBottom: "var(--spacing-4)" }}>
                  E-mail enviado!
                </div>
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--neutral-600)" }}>
                  Se existe uma conta com <strong>{email}</strong>, você receberá
                  um link para redefinir sua senha.
                </p>
                <Link href="/login" className="acam-btn acam-btn-primary" style={{ width: "100%", marginTop: "var(--spacing-6)" }}>
                  Voltar ao login
                </Link>
              </div>
            ) : (
              <>
                <div style={{ textAlign: "center", marginBottom: "var(--spacing-6)" }}>
                  <h2 style={{ marginBottom: "var(--spacing-1)" }}>Recuperar senha</h2>
                  <p style={{ color: "var(--neutral-500)", fontSize: "var(--font-size-sm)" }}>
                    Informe seu e-mail para receber o link de recuperação
                  </p>
                </div>

                <form onSubmit={handleRecuperar}>
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

                  {erro && (
                    <div className="acam-alert acam-alert-error" style={{ marginBottom: "var(--spacing-4)" }}>
                      {erro}
                    </div>
                  )}

                  <button type="submit" className="acam-btn acam-btn-primary" style={{ width: "100%" }} disabled={loading}>
                    {loading ? (
                      <><span className="acam-spinner" style={{ width: "1rem", height: "1rem" }} /> Enviando...</>
                    ) : (
                      "Enviar link de recuperação"
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </body>
  )
}

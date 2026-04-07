"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { HeaderLogo } from "@/components/acam"

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
    <div className="page-public" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="acam-header">
        <div className="acam-header-content">
          <HeaderLogo />
          <nav className="acam-header-nav">
            <Link href="/login" className="acam-btn acam-btn-ghost">Voltar ao login</Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "var(--max-width-md)" }}>
          <div className="acam-card" style={{ padding: "var(--spacing-8)" }}>
            {enviado ? (
              <div className="text-center">
                <div className="acam-alert acam-alert-success mb-4">E-mail enviado!</div>
                <p className="text-sm acam-text-body">
                  Se existe uma conta com <strong>{email}</strong>, você receberá
                  um link para redefinir sua senha.
                </p>
                <Link href="/login" className="acam-btn acam-btn-primary w-full mt-6">
                  Voltar ao login
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="mb-1">Recuperar senha</h2>
                  <p className="text-sm text-muted-foreground">
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

                  {erro && <div className="acam-alert acam-alert-error mb-4">{erro}</div>}

                  <button type="submit" className="acam-btn acam-btn-primary w-full" disabled={loading}>
                    {loading ? (
                      <><span className="acam-spinner acam-spinner-sm" /> Enviando...</>
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
    </div>
  )
}

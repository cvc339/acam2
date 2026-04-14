"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { HeaderLogo } from "@/components/acam"

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

    if (senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres, com letras maiúsculas, minúsculas e números.")
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
      <div className="page-public" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <header className="acam-header">
          <div className="acam-header-content">
            <HeaderLogo />
          </div>
        </header>
        <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{ width: "100%", maxWidth: "var(--max-width-md)" }}>
            <div className="acam-card text-center" style={{ padding: "var(--spacing-8)" }}>
              <div className="acam-alert acam-alert-success mb-4">Conta criada com sucesso!</div>
              <p className="text-sm acam-text-body">
                Enviamos um link de confirmação para <strong>{email}</strong>.
                Clique no link para ativar sua conta.
              </p>
              <Link href="/login" className="acam-btn acam-btn-primary w-full mt-6">
                Ir para login
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="page-public" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="acam-header">
        <div className="acam-header-content">
          <HeaderLogo />
          <nav className="acam-header-nav">
            <span className="text-sm text-muted-foreground">Já tem conta?</span>
            <Link href="/login" className="acam-btn acam-btn-ghost">Entrar</Link>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "var(--max-width-md)" }}>
          <div className="acam-card" style={{ padding: "var(--spacing-8)" }}>
            <div className="text-center mb-6">
              <h2 className="mb-1">Criar conta</h2>
              <p className="text-sm text-muted-foreground">Comece gratuitamente</p>
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

              <div className="flex items-start gap-2 mb-3">
                <input type="checkbox" className="acam-form-checkbox mt-0.5" checked={aceitaTermos} onChange={(e) => setAceitaTermos(e.target.checked)} />
                <label className="text-sm acam-text-body">
                  Aceito os <span style={{ color: "var(--primary-600)" }}>termos de uso</span> e a <span style={{ color: "var(--primary-600)" }}>política de privacidade</span>
                </label>
              </div>

              <div className="flex items-start gap-2 mb-4">
                <input type="checkbox" className="acam-form-checkbox mt-0.5" checked={aceitaComunicacoes} onChange={(e) => setAceitaComunicacoes(e.target.checked)} />
                <label className="text-sm acam-text-body">
                  Quero receber novidades e atualizações por e-mail
                </label>
              </div>

              {erro && <div className="acam-alert acam-alert-error mb-4">{erro}</div>}

              <button type="submit" className="acam-btn acam-btn-primary w-full" disabled={loading}>
                {loading ? (
                  <><span className="acam-spinner acam-spinner-sm" /> Criando...</>
                ) : (
                  "Criar conta"
                )}
              </button>
            </form>

            <div className="acam-divider">
              <span className="text-xs text-muted-foreground px-2">ou</span>
            </div>

            <Link href="/login" className="acam-btn acam-btn-secondary w-full text-center">
              Já tenho uma conta
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

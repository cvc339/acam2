"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { HeaderLogo } from "@/components/acam"

export default function AtualizarSenhaPage() {
  const router = useRouter()
  const [senha, setSenha] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleAtualizar(e: React.FormEvent) {
    e.preventDefault()
    setErro("")

    if (senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.")
      return
    }

    if (!/[a-z]/.test(senha) || !/[A-Z]/.test(senha) || !/[0-9]/.test(senha)) {
      setErro("A senha deve conter letras maiúsculas, minúsculas e números.")
      return
    }

    if (senha !== confirmar) {
      setErro("As senhas não coincidem.")
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })

    if (error) {
      // Traduzir mensagens comuns do Supabase
      const msg = error.message.toLowerCase()
      if (msg.includes("weak") || msg.includes("easy to guess")) {
        setErro("Senha muito fraca. Escolha uma senha mais forte, evitando sequências simples como '12345678' ou 'Abcd1234'.")
      } else if (msg.includes("at least")) {
        setErro("A senha deve ter pelo menos 8 caracteres, com letras maiúsculas, minúsculas e números.")
      } else {
        setErro(error.message)
      }
      setLoading(false)
      return
    }

    setSucesso(true)
    setLoading(false)

    // Redirecionar para o dashboard após 2 segundos
    setTimeout(() => router.push("/dashboard"), 2000)
  }

  return (
    <div className="page-public" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="acam-header">
        <div className="acam-header-content">
          <HeaderLogo />
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "var(--max-width-md)" }}>
          <div className="acam-card" style={{ padding: "var(--spacing-8)" }}>
            {sucesso ? (
              <div className="text-center">
                <div className="acam-alert acam-alert-success mb-4">Senha atualizada com sucesso!</div>
                <p className="text-sm text-muted-foreground">
                  Você será redirecionado para o dashboard em instantes.
                </p>
                <Link href="/dashboard" className="acam-btn acam-btn-primary w-full mt-6">
                  Ir para o Dashboard
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="mb-1">Nova senha</h2>
                  <p className="text-sm text-muted-foreground">
                    Defina sua nova senha de acesso ao ACAM
                  </p>
                </div>

                <form onSubmit={handleAtualizar}>
                  <div className="acam-form-group">
                    <label className="acam-form-label">Nova senha</label>
                    <input
                      type="password"
                      className="acam-form-input"
                      placeholder="Mínimo 8 caracteres (maiúsculas, minúsculas e números)"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="acam-form-group">
                    <label className="acam-form-label">Confirmar nova senha</label>
                    <input
                      type="password"
                      className="acam-form-input"
                      placeholder="Repita a senha"
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>

                  {erro && <div className="acam-alert acam-alert-error mb-4">{erro}</div>}

                  <button type="submit" className="acam-btn acam-btn-primary w-full" disabled={loading}>
                    {loading ? (
                      <><span className="acam-spinner acam-spinner-sm" /> Atualizando...</>
                    ) : (
                      "Atualizar senha"
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

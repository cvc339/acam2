"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { StatusBadge } from "@/components/acam"

const pacotes = [
  { id: "avulso", nome: "Avulso", creditos: 1, valor: 12, per: "R$ 12/un" },
  { id: "basico", nome: "Básico", creditos: 10, valor: 100, per: "R$ 10/un" },
  { id: "intermediario", nome: "Intermediário", creditos: 25, valor: 225, per: "R$ 9/un", destaque: true },
  { id: "premium", nome: "Premium", creditos: 50, valor: 400, per: "R$ 8/un" },
]

export default function CreditosPage() {
  const searchParams = useSearchParams()
  const statusParam = searchParams.get("status")
  const [loading, setLoading] = useState<string | null>(null)
  const [saldo, setSaldo] = useState<number>(0)
  const [mensagem, setMensagem] = useState("")

  useEffect(() => {
    if (statusParam === "sucesso") {
      setMensagem("Pagamento aprovado! Seus créditos serão adicionados em instantes.")
    } else if (statusParam === "pendente") {
      setMensagem("Pagamento pendente. Você receberá os créditos assim que for confirmado.")
    } else if (statusParam === "erro") {
      setMensagem("Pagamento não aprovado. Tente novamente.")
    }

    async function fetchSaldo() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("saldo_creditos")
          .select("saldo")
          .eq("usuario_id", user.id)
          .single()
        setSaldo(data?.saldo ?? 0)
      }
    }
    fetchSaldo()
  }, [statusParam])

  async function handleComprar(pacoteId: string) {
    setLoading(pacoteId)
    setMensagem("")

    try {
      const response = await fetch("/api/pagamento/criar-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pacote: pacoteId }),
      })

      const data = await response.json()

      if (data.sucesso && data.init_point) {
        window.location.href = data.init_point
      } else {
        setMensagem(data.erro || "Erro ao processar pagamento.")
        setLoading(null)
      }
    } catch {
      setMensagem("Erro de conexão. Tente novamente.")
      setLoading(null)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      <div>
        <Link href="/dashboard" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-4" style={{ textDecoration: "none" }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Voltar ao dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Créditos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Saldo atual: <strong>{saldo} créditos</strong>
            </p>
          </div>
          <Link href="/creditos/extrato" className="acam-btn acam-btn-secondary acam-btn-sm">
            Ver extrato
          </Link>
        </div>
      </div>

      {mensagem && (
        <div className={`acam-alert ${
          statusParam === "sucesso" ? "acam-alert-success" :
          statusParam === "erro" ? "acam-alert-error" :
          "acam-alert-info"
        }`}>
          {mensagem}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-2">Adquirir créditos</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Créditos não expiram. Reembolso automático em caso de falha. Quanto maior o pacote, menor o custo por crédito.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pacotes.map((p) => (
            <div key={p.id} className="acam-card" style={{
              padding: "var(--spacing-6)",
              textAlign: "center",
              border: p.destaque ? "2px solid var(--primary-500)" : undefined,
            }}>
              {p.destaque && (
                <StatusBadge variant="primary" className="mb-3">Mais popular</StatusBadge>
              )}
              <div style={{
                fontFamily: "var(--font-family-heading)",
                fontSize: "2.5rem", fontWeight: 700,
                lineHeight: 1, marginBottom: "4px",
              }}>
                {p.creditos}
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                {p.creditos === 1 ? "crédito" : "créditos"}
              </div>
              <div className="text-xl font-bold mb-1">
                R$ {p.valor}
              </div>
              <div className="text-sm mb-6" style={{ color: "var(--accent)" }}>
                {p.per}
              </div>
              <button
                className={`acam-btn w-full ${p.destaque ? "acam-btn-primary" : "acam-btn-secondary"}`}
                onClick={() => handleComprar(p.id)}
                disabled={loading !== null}
              >
                {loading === p.id ? (
                  <><span className="acam-spinner acam-spinner-sm" /> Processando...</>
                ) : (
                  "Comprar"
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="acam-alert-result">
        <strong>Como funciona:</strong> Ao clicar em &quot;Comprar&quot;, você será redirecionado para o Mercado Pago.
        Após o pagamento, os créditos são adicionados automaticamente à sua conta.
        Aceitamos PIX, cartão de crédito e boleto.
      </div>
    </div>
  )
}

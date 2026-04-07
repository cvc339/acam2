import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { StatusBadge } from "@/components/acam"

export const metadata: Metadata = {
  title: "Extrato de Créditos",
}

export default async function ExtratoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: saldo } = await supabase
    .from("saldo_creditos")
    .select("saldo")
    .eq("usuario_id", user?.id)
    .single()

  const { data: transacoes } = await supabase
    .from("transacoes_creditos")
    .select("id, tipo, quantidade, valor_pago, descricao, created_at")
    .order("created_at", { ascending: false })
    .limit(50)

  const creditosDisponiveis = saldo?.saldo ?? 0

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-8)" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Extrato de Créditos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Saldo atual: <strong>{creditosDisponiveis} créditos</strong>
          </p>
        </div>
        <Link href="/creditos" className="acam-btn acam-btn-accent acam-btn-sm">
          Comprar créditos
        </Link>
      </div>

      {transacoes && transacoes.length > 0 ? (
        <div className="acam-card" style={{ padding: "var(--spacing-6)" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="acam-services-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th style={{ textAlign: "right" }}>Créditos</th>
                </tr>
              </thead>
              <tbody>
                {transacoes.map((t) => (
                  <tr key={t.id}>
                    <td className="text-sm">
                      {new Date(t.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td>
                      <StatusBadge variant={
                        t.tipo === "compra" ? "success" :
                        t.tipo === "reembolso" ? "warning" :
                        t.tipo === "uso" ? "primary" : "primary"
                      }>
                        {t.tipo === "compra" ? "Compra" :
                         t.tipo === "uso" ? "Uso" :
                         t.tipo === "reembolso" ? "Reembolso" : "Ajuste"}
                      </StatusBadge>
                    </td>
                    <td className="text-sm">{t.descricao}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }} className={
                      t.tipo === "uso" ? "text-destructive" : "text-success"
                    }>
                      {t.tipo === "uso" ? `-${t.quantidade}` : `+${t.quantidade}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="acam-alert-result">
          Nenhuma transação encontrada. Compre créditos para começar a usar as ferramentas.
        </div>
      )}
    </div>
  )
}

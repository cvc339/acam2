import type { Metadata } from "next"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { StatusBadge } from "@/components/acam"
import { EnviarNewsletterButton } from "@/components/admin/enviar-newsletter-button"

export const metadata: Metadata = { title: "Admin — Enviar Newsletter" }

export default async function AdminEnviarNewsletterPage() {
  const admin = createAdminClient()

  // Buscar itens selecionados
  const { data: itens } = await admin
    .from("radar_itens")
    .select("*")
    .eq("incluir_email", true)
    .order("fonte")
    .order("relevancia", { ascending: false })

  // Buscar assinantes ativos
  const { count: totalAssinantes } = await admin
    .from("radar_destinatarios")
    .select("*", { count: "exact", head: true })
    .eq("ativo", true)

  const itensDOU = itens?.filter((i) => i.fonte === "DOU") ?? []
  const itensMG = itens?.filter((i) => i.fonte === "MG") ?? []
  const itensRSS = itens?.filter((i) => i.fonte === "RSS") ?? []
  const totalItens = itens?.length ?? 0

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div>
        <Link href="/admin/newsletter" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-2" style={{ textDecoration: "none" }}>
          ← Voltar à Newsletter
        </Link>
        <h2 style={{ color: "var(--primary-600)" }}>Enviar Newsletter</h2>
        <p className="text-sm text-muted-foreground">
          {totalItens} itens selecionados · {totalAssinantes ?? 0} assinantes ativos
        </p>
      </div>

      {totalItens === 0 ? (
        <div className="acam-card" style={{ textAlign: "center", padding: "3rem" }}>
          <p className="text-muted-foreground mb-4">Nenhum item selecionado para envio.</p>
          <Link href="/admin/newsletter" className="acam-btn acam-btn-primary acam-btn-sm">Selecionar itens</Link>
        </div>
      ) : (
        <>
          {/* Preview por seção */}
          {itensDOU.length > 0 && (
            <div className="acam-card">
              <h3 className="font-semibold mb-3">
                <StatusBadge variant="info">DOU</StatusBadge>
                <span className="ml-2">Normas Federais ({itensDOU.length})</span>
              </h3>
              {itensDOU.map((item) => (
                <div key={item.id} style={{ padding: "0.4rem 0", borderBottom: "1px solid var(--grey-100)" }}>
                  <div className="text-sm font-medium">{item.titulo}</div>
                  {item.resumo && <div className="text-xs text-muted-foreground">{item.resumo.slice(0, 150)}</div>}
                </div>
              ))}
            </div>
          )}

          {itensMG.length > 0 && (
            <div className="acam-card">
              <h3 className="font-semibold mb-3">
                <StatusBadge variant="primary">MG</StatusBadge>
                <span className="ml-2">Normas Estaduais ({itensMG.length})</span>
              </h3>
              {itensMG.map((item) => (
                <div key={item.id} style={{ padding: "0.4rem 0", borderBottom: "1px solid var(--grey-100)" }}>
                  <div className="text-sm font-medium">{item.titulo}</div>
                  <div className="text-xs text-muted-foreground">{item.fonte_nome} · {item.tipo} {item.numero}</div>
                </div>
              ))}
            </div>
          )}

          {itensRSS.length > 0 && (
            <div className="acam-card">
              <h3 className="font-semibold mb-3">
                <StatusBadge variant="success">Notícias</StatusBadge>
                <span className="ml-2">Notícias Ambientais ({itensRSS.length})</span>
              </h3>
              {itensRSS.map((item) => (
                <div key={item.id} style={{ padding: "0.4rem 0", borderBottom: "1px solid var(--grey-100)" }}>
                  <div className="text-sm font-medium">{item.titulo}</div>
                  <div className="text-xs text-muted-foreground">{item.fonte_nome}</div>
                </div>
              ))}
            </div>
          )}

          {/* Botão de envio */}
          <div className="acam-card" style={{ textAlign: "center", padding: "2rem" }}>
            <p className="text-sm text-muted-foreground mb-4">
              Serão enviados <strong>{totalItens} itens</strong> para <strong>{totalAssinantes ?? 0} assinantes</strong>.
            </p>
            <EnviarNewsletterButton totalItens={totalItens} totalAssinantes={totalAssinantes ?? 0} />
          </div>
        </>
      )}
    </div>
  )
}

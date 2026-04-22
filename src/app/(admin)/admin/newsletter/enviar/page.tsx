import type { Metadata } from "next"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { StatusBadge } from "@/components/acam"
import { EnviarNewsletterButton } from "@/components/admin/enviar-newsletter-button"

export const metadata: Metadata = { title: "Admin — Enviar Newsletter" }

export default async function AdminEnviarNewsletterPage() {
  const admin = createAdminClient()

  // Buscar itens selecionados (radar) e artigos selecionados
  const [{ data: itens }, { data: artigos }] = await Promise.all([
    admin
      .from("radar_itens")
      .select("*")
      .eq("incluir_email", true)
      .order("fonte")
      .order("relevancia", { ascending: false }),
    admin
      .from("artigos")
      .select("id, titulo, resumo, autor, publicado_em")
      .eq("status", "publicado")
      .eq("incluir_newsletter", true)
      .is("enviado_newsletter_em", null)
      .order("publicado_em", { ascending: false }),
  ])

  // Contar destinatários únicos (3 fontes)
  const emails = new Set<string>()

  const { data: manuais } = await admin.from("radar_destinatarios").select("email").eq("ativo", true)
  if (manuais) for (const d of manuais) emails.add(d.email.toLowerCase())

  const { data: leads } = await admin.from("leads").select("email").eq("aceita_marketing", true)
  if (leads) for (const l of leads) emails.add(l.email.toLowerCase())

  const { data: perfis } = await admin.from("perfis").select("email").neq("aceita_newsletter", false)
  if (perfis) for (const p of perfis) emails.add(p.email.toLowerCase())

  const totalAssinantes = emails.size

  const itensDOU = itens?.filter((i) => i.fonte === "DOU") ?? []
  const itensMG = itens?.filter((i) => i.fonte === "MG") ?? []
  const itensRSS = itens?.filter((i) => i.fonte === "RSS") ?? []
  const totalItens = itens?.length ?? 0
  const totalArtigos = artigos?.length ?? 0
  const totalGeral = totalItens + totalArtigos

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div>
        <Link href="/admin/newsletter" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-2" style={{ textDecoration: "none" }}>
          ← Voltar à Newsletter
        </Link>
        <h2 style={{ color: "var(--primary-600)" }}>Enviar Newsletter</h2>
        <p className="text-sm text-muted-foreground">
          {totalArtigos > 0 && <>{totalArtigos} artigo{totalArtigos > 1 ? "s" : ""} · </>}
          {totalItens} ite{totalItens === 1 ? "m" : "ns"} do radar · {totalAssinantes ?? 0} assinantes ativos
        </p>
      </div>

      {totalGeral === 0 ? (
        <div className="acam-card" style={{ textAlign: "center", padding: "3rem" }}>
          <p className="text-muted-foreground mb-4">Nenhum item ou artigo selecionado para envio.</p>
          <Link href="/admin/newsletter" className="acam-btn acam-btn-primary acam-btn-sm">Selecionar</Link>
        </div>
      ) : (
        <>
          {/* Artigos */}
          {artigos && artigos.length > 0 && (
            <div className="acam-card">
              <h3 className="font-semibold mb-3">
                <StatusBadge variant="accent">Artigos</StatusBadge>
                <span className="ml-2">Artigos do Vieira Castro Advogados ({totalArtigos})</span>
              </h3>
              {artigos.map((a) => (
                <div key={a.id} style={{ padding: "0.4rem 0", borderBottom: "1px solid var(--grey-100)" }}>
                  <div className="text-sm font-medium">{a.titulo}</div>
                  {a.resumo && <div className="text-xs text-muted-foreground">{a.resumo.slice(0, 150)}</div>}
                </div>
              ))}
            </div>
          )}

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
              Serão enviados{" "}
              {totalArtigos > 0 && <><strong>{totalArtigos} artigo{totalArtigos > 1 ? "s" : ""}</strong> + </>}
              <strong>{totalItens} ite{totalItens === 1 ? "m" : "ns"}</strong> para <strong>{totalAssinantes ?? 0} assinantes</strong>.
            </p>
            <EnviarNewsletterButton totalItens={totalGeral} totalAssinantes={totalAssinantes ?? 0} />
          </div>
        </>
      )}
    </div>
  )
}

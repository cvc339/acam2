import type { Metadata } from "next"
import { createAdminClient } from "@/lib/supabase/admin"
import { StatusBadge } from "@/components/acam"
import { NewsletterActions } from "@/components/admin/newsletter-actions"
import { NewsletterEditUrl } from "@/components/admin/newsletter-edit-url"
import { ColetarButtons } from "@/components/admin/coletar-buttons"

export const metadata: Metadata = { title: "Admin — Newsletter" }

interface Props {
  searchParams: Promise<{ fonte?: string; selecionados?: string }>
}

export default async function AdminNewsletterPage({ searchParams }: Props) {
  const params = await searchParams
  const filtroFonte = params.fonte || ""
  const mostrarSelecionados = params.selecionados === "true"

  const admin = createAdminClient()

  // Buscar itens (apenas não enviados, ordenados por data de publicação)
  let query = admin
    .from("radar_itens")
    .select("*")
    .is("enviado_em", null)
    .order("data_publicacao", { ascending: false, nullsFirst: false })
    .order("coletado_em", { ascending: false })
    .limit(100)

  if (filtroFonte) query = query.eq("fonte", filtroFonte)
  if (mostrarSelecionados) {
    // Filtro "Selecionados": mostra apenas os marcados para envio
    query = query.eq("incluir_email", true)
  } else if (!filtroFonte) {
    // Lista principal (sem filtro): esconde itens já selecionados
    // Eles aparecem no filtro "Selecionados" para revisão
    query = query.eq("incluir_email", false)
  }
  // Com filtro de fonte: mostra todos (selecionados e não) daquela fonte

  const { data: itens } = await query

  // Stats
  const { count: totalItens } = await admin.from("radar_itens").select("*", { count: "exact", head: true }).is("enviado_em", null)
  const { count: selecionados } = await admin.from("radar_itens").select("*", { count: "exact", head: true }).eq("incluir_email", true).is("enviado_em", null)
  // Contar destinatários únicos (3 fontes: manuais + leads + perfis)
  const emailsSet = new Set<string>()
  const { data: dManuais } = await admin.from("radar_destinatarios").select("email").eq("ativo", true)
  if (dManuais) for (const d of dManuais) emailsSet.add(d.email.toLowerCase())
  const { data: dLeads } = await admin.from("leads").select("email").eq("aceita_marketing", true)
  if (dLeads) for (const l of dLeads) emailsSet.add(l.email.toLowerCase())
  const { data: dPerfis } = await admin.from("perfis").select("email").neq("aceita_newsletter", false)
  if (dPerfis) for (const p of dPerfis) emailsSet.add(p.email.toLowerCase())
  const totalAssinantes = emailsSet.size
  const { data: ultimoEnvio } = await admin.from("radar_envios").select("enviado_em, assunto").order("enviado_em", { ascending: false }).limit(1)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ color: "var(--primary-600)" }}>Newsletter — Radar Ambiental</h2>
          <p className="text-sm text-muted-foreground">Curadoria de normas e notícias para envio por e-mail</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <a href="/admin/newsletter/assinantes" className="acam-btn acam-btn-ghost acam-btn-sm">Assinantes ({totalAssinantes ?? 0})</a>
          <a href="/admin/newsletter/enviar" className="acam-btn acam-btn-primary acam-btn-sm">Gerar e Enviar</a>
        </div>
      </div>

      {/* Coleta */}
      <div className="acam-card">
        <h3 className="font-semibold mb-3">Coletar normas e notícias</h3>
        <ColetarButtons />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="acam-card acam-stat-card">
          <div className="acam-stat-card-value">{totalItens ?? 0}</div>
          <div className="acam-stat-card-label">Itens coletados</div>
        </div>
        <div className="acam-card acam-stat-card">
          <div className="acam-stat-card-value">{selecionados ?? 0}</div>
          <div className="acam-stat-card-label">Selecionados para envio</div>
        </div>
        <div className="acam-card acam-stat-card">
          <div className="acam-stat-card-value">{totalAssinantes ?? 0}</div>
          <div className="acam-stat-card-label">Assinantes ativos</div>
        </div>
        <div className="acam-card acam-stat-card">
          <div className="acam-stat-card-value">{ultimoEnvio?.[0] ? new Date(ultimoEnvio[0].enviado_em).toLocaleDateString("pt-BR") : "—"}</div>
          <div className="acam-stat-card-label">Último envio</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <a href="/admin/newsletter" className={`acam-btn acam-btn-sm ${!filtroFonte && !mostrarSelecionados ? "acam-btn-primary" : "acam-btn-ghost"}`}>Todos</a>
        <a href="/admin/newsletter?fonte=DOU" className={`acam-btn acam-btn-sm ${filtroFonte === "DOU" ? "acam-btn-primary" : "acam-btn-ghost"}`}>DOU</a>
        <a href="/admin/newsletter?fonte=MG" className={`acam-btn acam-btn-sm ${filtroFonte === "MG" ? "acam-btn-primary" : "acam-btn-ghost"}`}>MG</a>
        <a href="/admin/newsletter?fonte=RSS" className={`acam-btn acam-btn-sm ${filtroFonte === "RSS" ? "acam-btn-primary" : "acam-btn-ghost"}`}>Notícias</a>
        <a href="/admin/newsletter?selecionados=true" className={`acam-btn acam-btn-sm ${mostrarSelecionados ? "acam-btn-primary" : "acam-btn-ghost"}`}>Selecionados ({selecionados ?? 0})</a>
      </div>

      {/* Lista de itens */}
      {itens && itens.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {itens.map((item) => (
            <div key={item.id} className="acam-card" style={{ padding: "0.75rem 1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <NewsletterActions itemId={item.id} incluir={item.incluir_email} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                  <StatusBadge variant={item.fonte === "DOU" ? "info" : item.fonte === "MG" ? "primary" : "success"}>
                    {item.fonte_nome || item.fonte}
                  </StatusBadge>
                  {item.tipo && <span className="text-xs text-muted-foreground">{item.tipo} {item.numero}</span>}
                  {item.relevancia > 0 && <span className="text-xs text-muted-foreground">Relevância: {item.relevancia}</span>}
                </div>
                <div className="text-sm font-medium">{item.titulo}</div>
                {item.resumo && <div className="text-xs text-muted-foreground mt-1" style={{ lineHeight: 1.5 }}>{item.resumo.slice(0, 200)}{item.resumo.length > 200 ? "..." : ""}</div>}
                <div className="text-xs text-muted-foreground mt-1">
                  {item.data_publicacao && new Date(item.data_publicacao).toLocaleDateString("pt-BR")}
                  {item.url && <> · <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary-600)" }}>Ver fonte</a></>}
                  {" · "}<NewsletterEditUrl itemId={item.id} urlAtual={item.url} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="acam-card" style={{ textAlign: "center", padding: "3rem" }}>
          <p className="text-muted-foreground">Nenhum item coletado{filtroFonte ? ` para ${filtroFonte}` : ""}. Execute os scripts de coleta.</p>
        </div>
      )}
    </div>
  )
}

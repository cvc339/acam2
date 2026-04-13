import type { Metadata } from "next"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { StatusBadge } from "@/components/acam"
import { RespostaForm } from "@/components/admin/resposta-form"

export const metadata: Metadata = { title: "Admin — Mensagens" }

interface Props {
  searchParams: Promise<{ tipo?: string; page?: string }>
}

const TIPO_LABELS: Record<string, { label: string; variant: "info" | "success" | "error" | "warning" }> = {
  sugestao: { label: "Sugestão", variant: "info" },
  elogio: { label: "Elogio", variant: "success" },
  reclamacao: { label: "Reclamação", variant: "error" },
  duvida: { label: "Dúvida", variant: "warning" },
}

export default async function AdminMensagensPage({ searchParams }: Props) {
  const params = await searchParams
  const filtroTipo = params.tipo || ""
  const page = parseInt(params.page || "1", 10)
  const porPagina = 20
  const offset = (page - 1) * porPagina

  const admin = createAdminClient()

  // Contagem por tipo (para badges)
  const { data: todas } = await admin
    .from("mensagens_contato")
    .select("tipo, lida")

  const contagemPorTipo: Record<string, number> = {}
  let naoLidas = 0
  if (todas) {
    for (const m of todas) {
      contagemPorTipo[m.tipo] = (contagemPorTipo[m.tipo] || 0) + 1
      if (!m.lida) naoLidas++
    }
  }

  // Query paginada
  let query = admin
    .from("mensagens_contato")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + porPagina - 1)

  if (filtroTipo) query = query.eq("tipo", filtroTipo)

  const { data: mensagens, count } = await query
  const totalPaginas = Math.ceil((count || 0) / porPagina)

  // Marcar como lidas ao visualizar
  if (mensagens && mensagens.length > 0) {
    const naoLidasIds = mensagens.filter((m) => !m.lida).map((m) => m.id)
    if (naoLidasIds.length > 0) {
      await admin
        .from("mensagens_contato")
        .update({ lida: true })
        .in("id", naoLidasIds)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div>
        <h2 style={{ color: "var(--primary-600)" }}>Mensagens</h2>
        <p className="text-sm text-muted-foreground">
          {count ?? 0} mensagens{naoLidas > 0 ? ` · ${naoLidas} não lida(s)` : ""}
        </p>
      </div>

      {/* Filtro por tipo */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <a
          href="/admin/mensagens"
          className={`acam-btn acam-btn-sm ${!filtroTipo ? "acam-btn-primary" : "acam-btn-ghost"}`}
        >
          Todas ({todas?.length ?? 0})
        </a>
        {Object.entries(TIPO_LABELS).map(([tipo, { label }]) => (
          <a
            key={tipo}
            href={`/admin/mensagens?tipo=${tipo}`}
            className={`acam-btn acam-btn-sm ${filtroTipo === tipo ? "acam-btn-primary" : "acam-btn-ghost"}`}
          >
            {label} ({contagemPorTipo[tipo] || 0})
          </a>
        ))}
      </div>

      {/* Mensagens */}
      {mensagens && mensagens.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {mensagens.map((m) => {
            const tipoInfo = TIPO_LABELS[m.tipo] || { label: m.tipo, variant: "primary" as const }
            return (
              <div key={m.id} className="acam-card" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <StatusBadge variant={tipoInfo.variant}>{tipoInfo.label}</StatusBadge>
                    {!m.lida && <StatusBadge variant="accent">Nova</StatusBadge>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                <p className="text-sm" style={{ whiteSpace: "pre-wrap", marginBottom: "0.5rem" }}>{m.mensagem}</p>
                <div className="text-xs text-muted-foreground">
                  {m.nome || "Sem nome"} · {m.email}
                  {m.usuario_id && (
                    <>
                      {" · "}
                      <Link href={`/admin/usuarios/${m.usuario_id}`} style={{ color: "var(--primary-600)" }}>
                        Ver perfil
                      </Link>
                    </>
                  )}
                </div>
                <RespostaForm mensagemId={m.id} respostaExistente={m.resposta} />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="acam-card" style={{ textAlign: "center", padding: "3rem" }}>
          <p className="text-muted-foreground">Nenhuma mensagem{filtroTipo ? ` do tipo "${TIPO_LABELS[filtroTipo]?.label || filtroTipo}"` : ""}.</p>
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
          {page > 1 && (
            <a href={`/admin/mensagens?tipo=${filtroTipo}&page=${page - 1}`} className="acam-btn acam-btn-ghost acam-btn-sm">← Anterior</a>
          )}
          <span className="text-sm text-muted-foreground" style={{ display: "flex", alignItems: "center" }}>
            Página {page} de {totalPaginas}
          </span>
          {page < totalPaginas && (
            <a href={`/admin/mensagens?tipo=${filtroTipo}&page=${page + 1}`} className="acam-btn acam-btn-ghost acam-btn-sm">Próxima →</a>
          )}
        </div>
      )}
    </div>
  )
}

import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { StatusBadge } from "@/components/acam"
import { FaleConoscoForm } from "@/components/acam/fale-conosco-form"

const TIPO_LABELS: Record<string, { label: string; variant: "info" | "success" | "error" | "warning" }> = {
  sugestao: { label: "Sugestão", variant: "info" },
  elogio: { label: "Elogio", variant: "success" },
  reclamacao: { label: "Reclamação", variant: "error" },
  duvida: { label: "Dúvida", variant: "warning" },
}

export default async function FaleConoscoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Buscar mensagens anteriores do usuário
  const { data: mensagens } = await supabase
    .from("mensagens_contato")
    .select("id, tipo, mensagem, resposta, respondido_em, created_at")
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div>
      <div style={{ maxWidth: "36rem", margin: "0 auto", padding: "var(--spacing-4) var(--spacing-6) 0" }}>
        <Link href="/dashboard" className="text-sm text-muted-foreground inline-flex items-center gap-1" style={{ textDecoration: "none" }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
          Voltar ao dashboard
        </Link>
      </div>

      <div style={{ maxWidth: "36rem", margin: "0 auto", padding: "var(--spacing-8) var(--spacing-6)", display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
        <div>
          <h2 style={{ color: "var(--primary-600)", marginBottom: "0.25rem" }}>Fale Conosco</h2>
          <p className="text-sm text-muted-foreground">
            Sua opinião é importante para melhorar o ACAM. Envie sugestões, elogios, reclamações ou dúvidas.
          </p>
        </div>

        {/* Formulário de envio */}
        <FaleConoscoForm />

        {/* Mensagens anteriores */}
        {mensagens && mensagens.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Suas mensagens</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {mensagens.map((m) => {
                const tipoInfo = TIPO_LABELS[m.tipo] || { label: m.tipo, variant: "info" as const }
                return (
                  <div key={m.id} className="acam-card" style={{ padding: "1rem 1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <StatusBadge variant={tipoInfo.variant}>{tipoInfo.label}</StatusBadge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>{m.mensagem}</p>

                    {m.resposta ? (
                      <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "var(--primary-50)", borderRadius: "var(--radius)", borderLeft: "3px solid var(--primary-600)" }}>
                        <div className="text-xs font-semibold" style={{ color: "var(--primary-600)", marginBottom: "0.25rem" }}>
                          Resposta do ACAM
                          {m.respondido_em && (
                            <span className="font-normal text-muted-foreground ml-2">
                              {new Date(m.respondido_em).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                        <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>{m.resposta}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-2">Aguardando resposta</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

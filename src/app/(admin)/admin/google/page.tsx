import type { Metadata } from "next"
import Link from "next/link"
import { statusConexao } from "@/lib/services/google-calendar"
import { DesconectarBotao } from "./desconectar-botao"

export const metadata: Metadata = { title: "Admin — Google Calendar" }

export default async function AdminGooglePage({
  searchParams,
}: {
  searchParams: Promise<{ conectado?: string; erro?: string }>
}) {
  const params = await searchParams
  const status = await statusConexao()

  const mensagemSucesso = params.conectado === "1"
  const mensagemErro = params.erro

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div>
        <h2 style={{ color: "var(--primary-600)" }}>Integração Google Calendar</h2>
        <p className="text-sm text-muted-foreground">
          Conecta sua conta Google para que agendamentos de consultoria gerem eventos com link Meet automaticamente.
        </p>
      </div>

      {mensagemSucesso && (
        <div className="acam-alert acam-alert-success">
          <strong>Conectado.</strong> Google Calendar autorizado com sucesso.
        </div>
      )}

      {mensagemErro && (
        <div className="acam-alert acam-alert-error">
          <strong>Erro:</strong> {decodeURIComponent(mensagemErro)}
        </div>
      )}

      <div className="acam-card">
        {status.conectado ? (
          <>
            <h3>Status: conectado</h3>
            <p className="text-sm text-muted-foreground" style={{ marginTop: "var(--spacing-2)" }}>
              Última atualização: {new Date(status.atualizadoEm).toLocaleString("pt-BR")}
            </p>
            <p style={{ marginTop: "var(--spacing-4)" }}>
              Quando um usuário agenda uma consultoria, o ACAM cria um evento no seu calendário com link Google Meet e envia convite por e-mail para o cliente.
            </p>
            <div style={{ display: "flex", gap: "var(--spacing-3)", marginTop: "var(--spacing-4)" }}>
              <Link href="/api/admin/google/auth" className="acam-btn acam-btn-outline acam-btn-sm">
                Reconectar
              </Link>
              <DesconectarBotao />
            </div>
          </>
        ) : (
          <>
            <h3>Status: desconectado</h3>
            <p style={{ marginTop: "var(--spacing-2)" }}>
              É preciso conectar uma conta Google para que os agendamentos de consultoria funcionem. Só um admin precisa fazer isso, e apenas uma vez.
            </p>
            <p className="text-sm text-muted-foreground" style={{ marginTop: "var(--spacing-2)" }}>
              Use a conta cujo calendário deve receber os eventos.
            </p>
            <div style={{ marginTop: "var(--spacing-4)" }}>
              <Link href="/api/admin/google/auth" className="acam-btn acam-btn-primary">
                Conectar Google Calendar
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="acam-card acam-card-compact">
        <h4>Como funciona</h4>
        <ol style={{ marginTop: "var(--spacing-3)", paddingLeft: "var(--spacing-5)", display: "flex", flexDirection: "column", gap: "var(--spacing-2)" }}>
          <li>Cliente escolhe um slot disponível na ferramenta de consultoria.</li>
          <li>ACAM debita 15 créditos e reserva o slot.</li>
          <li>ACAM cria um evento no seu Google Calendar com link Meet gerado automaticamente.</li>
          <li>Cliente recebe convite por e-mail (via Google) + confirmação (via ACAM).</li>
          <li>Você e o cliente recebem lembretes 24h e 1h antes.</li>
        </ol>
      </div>
    </div>
  )
}

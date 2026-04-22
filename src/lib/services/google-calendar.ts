/**
 * Integração Google Calendar — server-side only
 *
 * Responsabilidades:
 * - Fluxo OAuth (gerar URL, trocar code por tokens, salvar refresh_token)
 * - Criar evento com Meet link automático
 * - Mover evento (reagendamento)
 * - Deletar evento (cancelamento)
 *
 * Requer variáveis:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   GOOGLE_REDIRECT_URI
 */

import { google } from "googleapis"
import type { OAuth2Client } from "google-auth-library"
import { createAdminClient } from "@/lib/supabase/admin"

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"]
const TIMEZONE = "America/Sao_Paulo"

function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Credenciais Google Calendar ausentes (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)"
    )
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

// ============================================
// OAuth — conexão inicial do admin
// ============================================

export function gerarUrlAuth(): string {
  const oauth2 = getOAuth2Client()
  return oauth2.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  })
}

export async function trocarCodePorToken(code: string): Promise<{ sucesso: boolean; erro?: string }> {
  const oauth2 = getOAuth2Client()

  try {
    const { tokens } = await oauth2.getToken(code)

    if (!tokens.refresh_token) {
      return {
        sucesso: false,
        erro: "Refresh token não recebido. Revogue o acesso ao ACAM em https://myaccount.google.com/permissions e tente novamente.",
      }
    }

    const admin = createAdminClient()
    const { error } = await admin.from("google_calendar_auth").upsert({
      id: 1,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token ?? null,
      expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      atualizado_em: new Date().toISOString(),
    })

    if (error) {
      console.error("[google-calendar] Erro ao salvar token:", error)
      return { sucesso: false, erro: "Erro ao salvar credenciais" }
    }

    return { sucesso: true }
  } catch (err) {
    console.error("[google-calendar.trocarCodePorToken]", err)
    return { sucesso: false, erro: (err as Error).message }
  }
}

export async function statusConexao(): Promise<
  { conectado: false } | { conectado: true; atualizadoEm: string }
> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("google_calendar_auth")
    .select("atualizado_em")
    .eq("id", 1)
    .maybeSingle()

  if (!data) return { conectado: false }
  return { conectado: true, atualizadoEm: data.atualizado_em }
}

export async function desconectar(): Promise<void> {
  const admin = createAdminClient()
  await admin.from("google_calendar_auth").delete().eq("id", 1)
}

// ============================================
// Cliente autenticado (uso interno)
// ============================================

async function getClienteAutenticado(): Promise<OAuth2Client> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("google_calendar_auth")
    .select("*")
    .eq("id", 1)
    .single()

  if (error || !data) {
    throw new Error("Google Calendar não está conectado. Configure em /admin/google.")
  }

  const oauth2 = getOAuth2Client()
  oauth2.setCredentials({
    refresh_token: data.refresh_token,
    access_token: data.access_token,
    expiry_date: data.expiry ? new Date(data.expiry).getTime() : undefined,
  })

  // Ao renovar access_token automaticamente, persiste no banco
  oauth2.on("tokens", (tokens) => {
    const update: Record<string, unknown> = {
      atualizado_em: new Date().toISOString(),
    }
    if (tokens.access_token) update.access_token = tokens.access_token
    if (tokens.expiry_date) update.expiry = new Date(tokens.expiry_date).toISOString()
    admin
      .from("google_calendar_auth")
      .update(update)
      .eq("id", 1)
      .then(({ error: err }) => {
        if (err) console.error("[google-calendar] Erro ao persistir token renovado:", err)
      })
  })

  return oauth2
}

// ============================================
// Operações sobre eventos
// ============================================

export interface DadosEvento {
  titulo: string
  descricao: string
  inicio: Date
  fim: Date
  emailConvidado: string
}

export interface ResultadoCriarEvento {
  sucesso: boolean
  eventoId?: string
  linkReuniao?: string
  erro?: string
}

export async function criarEventoReuniao(dados: DadosEvento): Promise<ResultadoCriarEvento> {
  try {
    const auth = await getClienteAutenticado()
    const calendar = google.calendar({ version: "v3", auth })

    const resposta = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      sendUpdates: "all",
      requestBody: {
        summary: dados.titulo,
        description: dados.descricao,
        start: { dateTime: dados.inicio.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: dados.fim.toISOString(), timeZone: TIMEZONE },
        attendees: [{ email: dados.emailConvidado }],
        conferenceData: {
          createRequest: {
            requestId: `acam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    })

    const evento = resposta.data
    if (!evento.id) {
      return { sucesso: false, erro: "Evento criado sem ID" }
    }

    const linkMeet =
      evento.hangoutLink ||
      evento.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri

    return {
      sucesso: true,
      eventoId: evento.id,
      linkReuniao: linkMeet ?? undefined,
    }
  } catch (err) {
    console.error("[google-calendar.criarEventoReuniao]", err)
    return { sucesso: false, erro: (err as Error).message }
  }
}

export async function moverEvento(
  eventoId: string,
  novoInicio: Date,
  novoFim: Date
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const auth = await getClienteAutenticado()
    const calendar = google.calendar({ version: "v3", auth })

    await calendar.events.patch({
      calendarId: "primary",
      eventId: eventoId,
      sendUpdates: "all",
      requestBody: {
        start: { dateTime: novoInicio.toISOString(), timeZone: TIMEZONE },
        end: { dateTime: novoFim.toISOString(), timeZone: TIMEZONE },
      },
    })

    return { sucesso: true }
  } catch (err) {
    console.error("[google-calendar.moverEvento]", err)
    return { sucesso: false, erro: (err as Error).message }
  }
}

export async function deletarEvento(eventoId: string): Promise<{ sucesso: boolean }> {
  try {
    const auth = await getClienteAutenticado()
    const calendar = google.calendar({ version: "v3", auth })

    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventoId,
      sendUpdates: "all",
    })

    return { sucesso: true }
  } catch (err) {
    console.error("[google-calendar.deletarEvento]", err)
    // Não falhamos o fluxo de cancelamento por causa do GCal — só logamos
    return { sucesso: false }
  }
}

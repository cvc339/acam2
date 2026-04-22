/**
 * Emails transacionais da ferramenta de consultoria
 *
 * 5 templates:
 * 1. Confirmação imediata (após agendar)
 * 2. Lembrete 24h antes
 * 3. Lembrete 1h antes
 * 4. Reagendamento confirmado
 * 5. Cancelamento pelo admin (com reembolso)
 *
 * Todos fire-and-forget: erros são logados mas não quebram o fluxo do serviço.
 */

import { enviarEmail } from "./enviar"
import type { AgendamentoComSlot } from "@/lib/consultoria/types"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://acam.com.br"

// ============================================
// Helpers
// ============================================

const DIAS_SEMANA = [
  "domingo", "segunda-feira", "terça-feira", "quarta-feira",
  "quinta-feira", "sexta-feira", "sábado",
]
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

function formatarDataHora(data: string, hora: string): string {
  const [ano, mes, dia] = data.split("-").map(Number)
  const d = new Date(ano, mes - 1, dia)
  return `${DIAS_SEMANA[d.getDay()]}, ${dia} de ${MESES[d.getMonth()]} de ${ano} às ${hora.slice(0, 5)}`
}

function layout(titulo: string, conteudo: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 20px;">
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#1a3a2a;padding:24px 32px;text-align:center;">
      <span style="color:white;font-size:22px;font-weight:700;letter-spacing:3px;">ACAM</span>
      <div style="color:#c17f59;font-size:11px;margin-top:4px;">Consultoria técnica</div>
    </div>
    <div style="padding:32px;">
      <h2 style="color:#1a3a2a;font-size:20px;margin:0 0 16px;">${titulo}</h2>
      ${conteudo}
    </div>
  </div>
  <div style="text-align:center;padding:20px;color:#999;font-size:11px;line-height:1.6;">
    ACAM — Vieira Castro Sociedade Individual de Advocacia<br>
    Este é um email automático. Não responda diretamente.
  </div>
</div>
</body>
</html>`
}

function blocoDetalhes(dataHora: string, linkMeet: string | null, observacoes: string | null, anexoNome: string | null): string {
  const linhas: string[] = [
    `<tr><td style="padding:6px 0;color:#737373;font-size:13px;">Quando</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1a3a2a;font-size:13px;">${dataHora}</td></tr>`,
    `<tr><td style="padding:6px 0;color:#737373;font-size:13px;">Duração</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1a3a2a;font-size:13px;">30 minutos</td></tr>`,
  ]
  if (anexoNome) {
    linhas.push(`<tr><td style="padding:6px 0;color:#737373;font-size:13px;">Relatório anexado</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#1a3a2a;font-size:13px;">${anexoNome}</td></tr>`)
  }
  const tabela = `<div style="background:#f0ebe3;border-radius:8px;padding:20px;margin:0 0 24px;"><table style="width:100%;border-collapse:collapse;">${linhas.join("")}</table></div>`
  const botaoMeet = linkMeet
    ? `<div style="text-align:center;margin:0 0 24px;"><a href="${linkMeet}" style="display:inline-block;background:#1a3a2a;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Entrar na reunião</a></div>`
    : ""
  const obs = observacoes
    ? `<div style="background:#f5f5f5;border-left:3px solid #ccc;padding:12px 16px;margin:0 0 16px;border-radius:4px;"><div style="color:#999;font-size:11px;margin-bottom:6px;">Você registrou:</div><div style="color:#404040;font-size:13px;line-height:1.6;white-space:pre-wrap;">${observacoes}</div></div>`
    : ""
  return tabela + botaoMeet + obs
}

// ============================================
// 1. Confirmação imediata
// ============================================

export async function enviarConfirmacao(agendamento: AgendamentoComSlot): Promise<void> {
  const dataHora = formatarDataHora(agendamento.slot.data, agendamento.slot.hora_inicio)

  const html = layout(
    "Reunião agendada",
    `
    <p style="color:#404040;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Sua reunião de consultoria com o especialista em compensações ambientais foi confirmada.
    </p>
    ${blocoDetalhes(dataHora, agendamento.link_reuniao, agendamento.observacoes_usuario, agendamento.anexo_nome)}
    <div style="border-top:1px solid #e5e5e5;padding-top:16px;margin-top:24px;">
      <p style="color:#737373;font-size:12px;line-height:1.7;margin:0 0 8px;">
        <strong>Você também recebeu um convite no Google Calendar.</strong> O link da reunião está no convite e aqui neste e-mail.
      </p>
      <p style="color:#737373;font-size:12px;line-height:1.7;margin:0 0 8px;">
        <strong>Reagendamento:</strong> possível uma única vez, com no mínimo 4 horas de antecedência. Acesse seu painel para reagendar ou cancelar.
      </p>
      <p style="color:#737373;font-size:12px;line-height:1.7;margin:0;">
        <strong>Cancelamento pelo cliente:</strong> não dá direito a reembolso.
      </p>
    </div>
    <div style="text-align:center;margin-top:24px;">
      <a href="${APP_URL}/ferramentas/consultoria/${agendamento.id}" style="color:#1a3a2a;font-size:13px;text-decoration:underline;">Ver agendamento no ACAM</a>
    </div>
    `
  )

  await enviarEmail(agendamento.email_reuniao, "ACAM — Reunião de consultoria agendada", html)
}

// ============================================
// 2. Lembrete 24h antes
// ============================================

export async function enviarLembrete24h(agendamento: AgendamentoComSlot): Promise<void> {
  const dataHora = formatarDataHora(agendamento.slot.data, agendamento.slot.hora_inicio)

  const html = layout(
    "Sua consultoria é amanhã",
    `
    <p style="color:#404040;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Lembrete: você tem uma reunião de consultoria agendada para amanhã.
    </p>
    ${blocoDetalhes(dataHora, agendamento.link_reuniao, null, null)}
    <p style="color:#737373;font-size:12px;line-height:1.7;margin:0;">
      Se precisar reagendar, faça com no mínimo 4 horas de antecedência pelo seu painel no ACAM.
    </p>
    `
  )

  await enviarEmail(agendamento.email_reuniao, "ACAM — Lembrete: sua consultoria é amanhã", html)
}

// ============================================
// 3. Lembrete 1h antes
// ============================================

export async function enviarLembrete1h(agendamento: AgendamentoComSlot): Promise<void> {
  const dataHora = formatarDataHora(agendamento.slot.data, agendamento.slot.hora_inicio)

  const html = layout(
    "Sua consultoria começa em 1 hora",
    `
    <p style="color:#404040;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Sua reunião está próxima. Use o botão abaixo para entrar na reunião no horário.
    </p>
    ${blocoDetalhes(dataHora, agendamento.link_reuniao, null, null)}
    <p style="color:#737373;font-size:12px;line-height:1.7;margin:0;">
      Recomendamos entrar com alguns minutos de antecedência para testar o áudio e a conexão.
    </p>
    `
  )

  await enviarEmail(agendamento.email_reuniao, "ACAM — Sua consultoria começa em 1 hora", html)
}

// ============================================
// 4. Reagendamento confirmado
// ============================================

export async function enviarReagendamento(agendamento: AgendamentoComSlot): Promise<void> {
  const dataHora = formatarDataHora(agendamento.slot.data, agendamento.slot.hora_inicio)

  const html = layout(
    "Reagendamento confirmado",
    `
    <p style="color:#404040;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Sua reunião foi reagendada com sucesso.
    </p>
    ${blocoDetalhes(dataHora, agendamento.link_reuniao, null, agendamento.anexo_nome)}
    <div style="background:#fff7e6;border-left:3px solid #c17f59;padding:12px 16px;margin:0 0 16px;border-radius:4px;">
      <p style="color:#404040;font-size:13px;line-height:1.6;margin:0;">
        <strong>Atenção:</strong> este foi o seu único reagendamento disponível. Caso precise cancelar a nova data, o cancelamento não dá direito a reembolso.
      </p>
    </div>
    <div style="text-align:center;margin-top:16px;">
      <a href="${APP_URL}/ferramentas/consultoria/${agendamento.id}" style="color:#1a3a2a;font-size:13px;text-decoration:underline;">Ver agendamento no ACAM</a>
    </div>
    `
  )

  await enviarEmail(agendamento.email_reuniao, "ACAM — Reagendamento confirmado", html)
}

// ============================================
// 5. Cancelamento pelo admin (com reembolso)
// ============================================

export async function enviarCancelamentoAdmin(agendamento: AgendamentoComSlot): Promise<void> {
  const dataHora = formatarDataHora(agendamento.slot.data, agendamento.slot.hora_inicio)

  const html = layout(
    "Reunião cancelada",
    `
    <p style="color:#404040;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Precisamos cancelar a reunião que havia sido agendada para <strong>${dataHora}</strong>. Pedimos desculpas pelo transtorno.
    </p>
    <div style="background:#f0ebe3;border-radius:8px;padding:20px;margin:0 0 24px;">
      <p style="color:#1a3a2a;font-size:14px;line-height:1.7;margin:0;">
        <strong>Os 15 créditos foram reembolsados à sua conta</strong> e já estão disponíveis para um novo agendamento.
      </p>
    </div>
    <div style="text-align:center;margin:16px 0;">
      <a href="${APP_URL}/ferramentas/consultoria" style="display:inline-block;background:#1a3a2a;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Agendar nova data</a>
    </div>
    <p style="color:#737373;font-size:12px;line-height:1.7;margin:24px 0 0;">
      Se tiver urgência ou quiser alinhar um horário específico, entre em contato pelo Fale Conosco.
    </p>
    `
  )

  await enviarEmail(agendamento.email_reuniao, "ACAM — Reunião de consultoria cancelada", html)
}

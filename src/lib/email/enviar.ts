/**
 * Envio centralizado de emails — server-side only
 *
 * Todas as chamadas de email passam por aqui.
 * Fire-and-forget: erros são logados mas nunca quebram o fluxo.
 *
 * Uso:
 *   import { enviarEmail } from "@/lib/email/enviar"
 *   await enviarEmail("user@email.com", "Assunto", htmlContent)
 */

import { getResend, REMETENTE } from "./resend"

export async function enviarEmail(
  para: string,
  assunto: string,
  html: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const resend = getResend()
    if (!resend) {
      console.warn("[email] RESEND_API_KEY não configurada — email não enviado")
      return { sucesso: false, erro: "API key não configurada" }
    }

    const { error } = await resend.emails.send({
      from: REMETENTE,
      to: para,
      subject: assunto,
      html,
    })

    if (error) {
      console.error("[email] Erro Resend:", error)
      return { sucesso: false, erro: error.message }
    }

    console.log(`[email] Enviado: "${assunto}" → ${para}`)
    return { sucesso: true }
  } catch (error) {
    console.error("[email] Erro ao enviar:", (error as Error).message)
    return { sucesso: false, erro: (error as Error).message }
  }
}

// ============================================
// TEMPLATES
// ============================================

function layout(conteudo: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 20px;">
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background:#1a3a2a;padding:24px 32px;text-align:center;">
      <span style="color:white;font-size:22px;font-weight:700;letter-spacing:3px;">ACAM</span>
      <div style="color:#c17f59;font-size:11px;margin-top:4px;">Análise de Compensações Ambientais</div>
    </div>
    <!-- Corpo -->
    <div style="padding:32px;">
      ${conteudo}
    </div>
  </div>
  <!-- Footer -->
  <div style="text-align:center;padding:20px;color:#999;font-size:11px;line-height:1.6;">
    ACAM — Vieira Castro Sociedade Individual de Advocacia<br>
    Este é um email automático. Não responda diretamente.
  </div>
</div>
</body>
</html>`
}

// ---- Boas-vindas ----

export function templateBoasVindas(nome: string): string {
  return layout(`
    <h2 style="color:#1a3a2a;font-size:20px;margin:0 0 16px;">Bem-vindo ao ACAM, ${nome}!</h2>
    <p style="color:#404040;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Sua conta foi confirmada com sucesso. Agora você tem acesso a todas as ferramentas de análise de compensações ambientais de Minas Gerais.
    </p>
    <p style="color:#404040;font-size:14px;line-height:1.7;margin:0 0 24px;">
      <strong>Por onde começar:</strong>
    </p>
    <ul style="color:#404040;font-size:14px;line-height:2;margin:0 0 24px;padding-left:20px;">
      <li>Use o <strong>Checklist de Compensações</strong> (gratuito) para identificar quais compensações se aplicam ao seu empreendimento</li>
      <li>Experimente a <strong>Calculadora de Intervenção Ambiental</strong> (gratuita)</li>
      <li>Para análises completas, adquira créditos no painel</li>
    </ul>
    <div style="text-align:center;margin:24px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://acam.com.br"}/dashboard" style="display:inline-block;background:#1a3a2a;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">Acessar o ACAM</a>
    </div>
  `)
}

// ---- Confirmação de compra ----

export function templateCompraConfirmada(dados: {
  nome: string
  pacote: string
  creditos: number
  valor: number
  saldoAtual: number
}): string {
  const valorFmt = dados.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  return layout(`
    <h2 style="color:#1a3a2a;font-size:20px;margin:0 0 16px;">Compra confirmada!</h2>
    <p style="color:#404040;font-size:14px;line-height:1.7;margin:0 0 24px;">
      Olá, ${dados.nome}. Seu pagamento foi aprovado e os créditos já estão disponíveis.
    </p>
    <div style="background:#f0ebe3;border-radius:8px;padding:20px;margin:0 0 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;color:#737373;font-size:13px;">Pacote</td>
          <td style="padding:6px 0;text-align:right;font-weight:600;color:#1a3a2a;font-size:13px;">${dados.pacote}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#737373;font-size:13px;">Créditos adicionados</td>
          <td style="padding:6px 0;text-align:right;font-weight:600;color:#1a3a2a;font-size:13px;">${dados.creditos} créditos</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#737373;font-size:13px;">Valor pago</td>
          <td style="padding:6px 0;text-align:right;font-weight:600;color:#1a3a2a;font-size:13px;">${valorFmt}</td>
        </tr>
        <tr style="border-top:1px solid #d4c4b0;">
          <td style="padding:10px 0 0;color:#737373;font-size:13px;">Saldo atual</td>
          <td style="padding:10px 0 0;text-align:right;font-weight:700;color:#1a3a2a;font-size:16px;">${dados.saldoAtual} créditos</td>
        </tr>
      </table>
    </div>
    <p style="color:#737373;font-size:12px;margin:0;">
      Seus créditos não expiram. Em caso de falha em qualquer análise, o valor é reembolsado automaticamente.
    </p>
  `)
}

// ---- Resposta ao Fale Conosco ----

export function templateRespostaContato(dados: {
  nome: string
  mensagemOriginal: string
  resposta: string
}): string {
  return layout(`
    <h2 style="color:#1a3a2a;font-size:20px;margin:0 0 16px;">Respondemos sua mensagem</h2>
    <p style="color:#404040;font-size:14px;line-height:1.7;margin:0 0 16px;">
      Olá, ${dados.nome}. A equipe do ACAM respondeu sua mensagem.
    </p>
    <div style="background:#f5f5f5;border-left:3px solid #ccc;padding:12px 16px;margin:0 0 16px;border-radius:4px;">
      <div style="color:#999;font-size:11px;margin-bottom:6px;">Sua mensagem:</div>
      <div style="color:#404040;font-size:13px;line-height:1.6;">${dados.mensagemOriginal}</div>
    </div>
    <div style="background:#f0ebe3;border-left:3px solid #1a3a2a;padding:12px 16px;margin:0 0 24px;border-radius:4px;">
      <div style="color:#1a3a2a;font-size:11px;font-weight:600;margin-bottom:6px;">Resposta do ACAM:</div>
      <div style="color:#404040;font-size:13px;line-height:1.6;">${dados.resposta}</div>
    </div>
    <div style="text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://acam.com.br"}/fale-conosco" style="display:inline-block;background:#1a3a2a;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">Ver no ACAM</a>
    </div>
  `)
}

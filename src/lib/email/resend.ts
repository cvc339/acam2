/**
 * Cliente Resend — lazy singleton
 *
 * Usado por enviar.ts para envio de emails transacionais.
 * Requer RESEND_API_KEY no .env.local
 * Inicialização lazy para não falhar no build quando a key não está configurada.
 */

import { Resend } from "resend"

let _resend: Resend | null = null

export function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

/**
 * Remetente padrão.
 * Enquanto o domínio acam.com.br não estiver verificado no Resend,
 * use "onboarding@resend.dev" (sandbox do Resend).
 */
export const REMETENTE = process.env.RESEND_FROM || "ACAM <noreply@acam.com.br>"

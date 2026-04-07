import { createClient } from '@supabase/supabase-js'

// Client com service_role — APENAS para uso server-side (API routes, webhooks)
// Bypassa RLS — usar com cuidado, sempre validando o usuario antes
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

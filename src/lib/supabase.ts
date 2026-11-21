import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(url && key)

export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing', {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'japi-auth' },
})

export type Family = { id: string; name: string; dog_name: string; join_code: string }
export type Member = { id: string; family_id: string; user_id: string; display_name: string; emoji: string; created_at: string }

export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e)
  if (msg.includes('invalid_code')) return 'Diesen Code gibt es nicht. Bitte nochmal genau prüfen.'
  if (msg.includes('already_member')) return 'Dieses Handy ist schon in einer Familie.'
  if (/anonymous.*disabled/i.test(msg)) return 'Die anonyme Anmeldung ist im Supabase-Projekt noch nicht eingeschaltet.'
  if (/fetch|network/i.test(msg)) return 'Keine Verbindung. Bist du online?'
  return 'Das hat nicht geklappt. Bitte nochmal versuchen.'
}

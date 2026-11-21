import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, type Family, type Member } from './supabase'

type Status = 'loading' | 'noFamily' | 'ready' | 'error'

type Ctx = {
  status: Status
  family: Family | null
  me: Member | null
  members: Member[]
  createFamily: (p: { familyName: string; dogName: string; name: string; emoji: string }) => Promise<void>
  joinFamily: (p: { code: string; name: string; emoji: string }) => Promise<void>
  updateProfile: (p: { name: string; emoji: string }) => Promise<void>
  rotateCode: () => Promise<void>
  leaveFamily: () => Promise<void>
  retry: () => void
}

const SessionContext = createContext<Ctx | null>(null)

async function ensureSignedIn(): Promise<Session> {
  const { data } = await supabase.auth.getSession()
  if (data.session) return data.session
  const res = await supabase.auth.signInAnonymously()
  if (res.error || !res.data.session) throw res.error ?? new Error('no session')
  return res.data.session
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [userId, setUserId] = useState<string | null>(null)
  const [family, setFamily] = useState<Family | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [reloadKey, setReloadKey] = useState(0)

  const load = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    const uid = data.session?.user.id ?? null
    setUserId(uid)
    if (!uid) { setFamily(null); setMembers([]); setStatus('noFamily'); return }

    const { data: mine, error } = await supabase.from('members').select('family_id').eq('user_id', uid).maybeSingle()
    if (error) { setStatus('error'); return }
    if (!mine) { setFamily(null); setMembers([]); setStatus('noFamily'); return }

    const [fam, mem] = await Promise.all([
      supabase.from('families').select('id,name,dog_name,join_code').eq('id', mine.family_id).single(),
      supabase.from('members').select('*').eq('family_id', mine.family_id).order('created_at'),
    ])
    if (fam.error || mem.error) { setStatus('error'); return }
    setFamily(fam.data)
    setMembers(mem.data)
    setStatus('ready')
  }, [])

  useEffect(() => { void load() }, [load, reloadKey])

  // Live: neue Familienmitglieder / Namensänderungen sofort anzeigen
  useEffect(() => {
    if (!family) return
    const ch = supabase
      .channel(`members:${family.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members', filter: `family_id=eq.${family.id}` }, () => {
        void supabase.from('members').select('*').eq('family_id', family.id).order('created_at')
          .then(({ data }) => { if (data) setMembers(data) })
      })
      .subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [family])

  // Beim Zurückkehren in die App frisch laden (Handy war im Standby)
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') void load() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [load])

  const value = useMemo<Ctx>(() => ({
    status,
    family,
    me: members.find((m) => m.user_id === userId) ?? null,
    members,
    async createFamily({ familyName, dogName, name, emoji }) {
      await ensureSignedIn()
      const { error } = await supabase.rpc('create_family', {
        p_family_name: familyName, p_dog_name: dogName, p_display_name: name, p_emoji: emoji,
      })
      if (error) throw error
      await load()
    },
    async joinFamily({ code, name, emoji }) {
      await ensureSignedIn()
      const { error } = await supabase.rpc('join_family', { p_code: code, p_display_name: name, p_emoji: emoji })
      if (error) throw error
      await load()
    },
    async updateProfile({ name, emoji }) {
      if (!userId) return
      const { error } = await supabase.from('members').update({ display_name: name, emoji }).eq('user_id', userId)
      if (error) throw error
      await load()
    },
    async rotateCode() {
      const { error } = await supabase.rpc('rotate_join_code')
      if (error) throw error
      await load()
    },
    async leaveFamily() {
      if (!userId) return
      const { error } = await supabase.from('members').delete().eq('user_id', userId)
      if (error) throw error
      await load()
    },
    retry: () => { setStatus('loading'); setReloadKey((k) => k + 1) },
  }), [status, family, members, userId, load])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession outside provider')
  return ctx
}

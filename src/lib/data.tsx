import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { supabase, type Log, type Message, type Task } from './supabase'
import { useSession } from './session'
import { addDays, startOfDay } from './time'

const HISTORY_DAYS = 7

type Ctx = {
  loaded: boolean
  tasks: Task[]          // aktive, sortiert
  allTasks: Task[]       // inkl. archivierter (für Verlauf)
  logs: Log[]            // letzte 7 Tage, neueste zuerst
  logTask: (taskId: string, extra?: { choice?: string | null; note?: string | null }) => Promise<Log>
  updateLog: (logId: string, patch: { choice?: string | null; note?: string | null }) => Promise<void>
  removeLog: (logId: string) => Promise<void>
  addTask: (t: Pick<Task, 'name' | 'emoji' | 'times_per_day' | 'options'>) => Promise<void>
  updateTask: (id: string, patch: Partial<Pick<Task, 'name' | 'emoji' | 'times_per_day' | 'sort' | 'archived' | 'options'>>) => Promise<void>
  messages: Message[]   // älteste zuerst
  unread: number
  markChatSeen: () => void
  sendMessage: (body: string) => Promise<void>
  deleteMessage: (id: string) => Promise<void>
}

const DataContext = createContext<Ctx | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { family } = useSession()
  const familyId = family?.id
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [loaded, setLoaded] = useState(false)
  const pending = useRef<Set<string>>(new Set()) // gelöschte IDs, bis der Server es bestätigt
  const [messages, setMessages] = useState<Message[]>([])
  const [seenAt, setSeenAt] = useState(() => {
    try { return localStorage.getItem('japi-chat-seen') ?? '' } catch { return '' }
  })
  const { me } = useSession()

  const refresh = useCallback(async () => {
    if (!familyId) return
    const since = addDays(startOfDay(), -(HISTORY_DAYS - 1)).toISOString()
    const [t, l, m] = await Promise.all([
      supabase.from('tasks').select('*').eq('family_id', familyId).order('sort').order('created_at'),
      supabase.from('logs').select('*').eq('family_id', familyId).gte('done_at', since).order('done_at', { ascending: false }),
      supabase.from('messages').select('*').eq('family_id', familyId).order('created_at', { ascending: false }).limit(200),
    ])
    if (m.data) setMessages(m.data.reverse())
    if (t.data) setAllTasks(t.data)
    if (l.data) setLogs(l.data.filter((x) => !pending.current.has(x.id)))
    setLoaded(true)
  }, [familyId])

  useEffect(() => { void refresh() }, [refresh])

  // Live-Updates von den anderen Handys
  useEffect(() => {
    if (!familyId) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const soon = () => { clearTimeout(timer); timer = setTimeout(() => void refresh(), 150) }
    const ch = supabase
      .channel(`data:${familyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'logs', filter: `family_id=eq.${familyId}` }, soon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `family_id=eq.${familyId}` }, soon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `family_id=eq.${familyId}` }, soon)
      .subscribe()
    const onVis = () => { if (document.visibilityState === 'visible') void refresh() }
    document.addEventListener('visibilitychange', onVis)
    // Tageswechsel um Mitternacht
    const midnight = setInterval(() => void refresh(), 5 * 60 * 1000)
    return () => {
      clearTimeout(timer); clearInterval(midnight)
      document.removeEventListener('visibilitychange', onVis)
      void supabase.removeChannel(ch)
    }
  }, [familyId, refresh])

  const value = useMemo<Ctx>(() => ({
    loaded,
    allTasks,
    tasks: allTasks.filter((t) => !t.archived),
    logs,
    async logTask(taskId, extra) {
      const { data, error } = await supabase.rpc('log_task', { p_task_id: taskId, p_choice: extra?.choice ?? null, p_note: extra?.note ?? null })
      if (error) throw error
      const log = data as Log
      setLogs((ls) => (ls.some((l) => l.id === log.id) ? ls : [log, ...ls]))
      return log
    },
    async updateLog(logId, patch) {
      setLogs((ls) => ls.map((l) => (l.id === logId ? { ...l, ...patch } : l)))
      const { error } = await supabase.from('logs').update(patch).eq('id', logId)
      if (error) { void refresh(); throw error }
    },
    async removeLog(logId) {
      pending.current.add(logId)
      setLogs((ls) => ls.filter((l) => l.id !== logId))
      const { error } = await supabase.from('logs').delete().eq('id', logId)
      pending.current.delete(logId)
      if (error) { void refresh(); throw error }
    },
    async addTask({ name, emoji, times_per_day, options }) {
      if (!familyId) return
      const sort = Math.max(0, ...allTasks.map((t) => t.sort)) + 10
      const { error } = await supabase.from('tasks').insert({ family_id: familyId, name, emoji, times_per_day, sort, options, kind: 'custom' })
      if (error) throw error
      await refresh()
    },
    async updateTask(id, patch) {
      setAllTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)))
      const { error } = await supabase.from('tasks').update(patch).eq('id', id)
      if (error) { void refresh(); throw error }
    },
    messages,
    unread: messages.filter((m) => m.created_at > seenAt && m.member_id !== me?.id).length,
    markChatSeen() {
      const last = messages[messages.length - 1]?.created_at ?? new Date().toISOString()
      if (last <= seenAt) return
      setSeenAt(last)
      try { localStorage.setItem('japi-chat-seen', last) } catch { /* egal */ }
    },
    async sendMessage(body) {
      const { data, error } = await supabase.from('messages').insert({ body }).select().single()
      if (error) throw error
      setMessages((ms) => (ms.some((m) => m.id === data.id) ? ms : [...ms, data]))
    },
    async deleteMessage(id) {
      setMessages((ms) => ms.filter((m) => m.id !== id))
      const { error } = await supabase.from('messages').delete().eq('id', id)
      if (error) { void refresh(); throw error }
    },
  }), [loaded, allTasks, logs, familyId, refresh, messages, seenAt, me?.id])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData outside provider')
  return ctx
}

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { supabase, type Log, type Task } from './supabase'
import { useSession } from './session'
import { addDays, startOfDay } from './time'

const HISTORY_DAYS = 7

type Ctx = {
  loaded: boolean
  tasks: Task[]          // aktive, sortiert
  allTasks: Task[]       // inkl. archivierter (für Verlauf)
  logs: Log[]            // letzte 7 Tage, neueste zuerst
  logTask: (taskId: string) => Promise<Log>
  removeLog: (logId: string) => Promise<void>
  addTask: (t: Pick<Task, 'name' | 'emoji' | 'times_per_day'>) => Promise<void>
  updateTask: (id: string, patch: Partial<Pick<Task, 'name' | 'emoji' | 'times_per_day' | 'sort' | 'archived'>>) => Promise<void>
}

const DataContext = createContext<Ctx | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { family } = useSession()
  const familyId = family?.id
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [loaded, setLoaded] = useState(false)
  const pending = useRef<Set<string>>(new Set()) // gelöschte IDs, bis der Server es bestätigt

  const refresh = useCallback(async () => {
    if (!familyId) return
    const since = addDays(startOfDay(), -(HISTORY_DAYS - 1)).toISOString()
    const [t, l] = await Promise.all([
      supabase.from('tasks').select('*').eq('family_id', familyId).order('sort').order('created_at'),
      supabase.from('logs').select('*').eq('family_id', familyId).gte('done_at', since).order('done_at', { ascending: false }),
    ])
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
    async logTask(taskId) {
      const { data, error } = await supabase.rpc('log_task', { p_task_id: taskId })
      if (error) throw error
      const log = data as Log
      setLogs((ls) => (ls.some((l) => l.id === log.id) ? ls : [log, ...ls]))
      return log
    },
    async removeLog(logId) {
      pending.current.add(logId)
      setLogs((ls) => ls.filter((l) => l.id !== logId))
      const { error } = await supabase.from('logs').delete().eq('id', logId)
      pending.current.delete(logId)
      if (error) { void refresh(); throw error }
    },
    async addTask({ name, emoji, times_per_day }) {
      if (!familyId) return
      const sort = Math.max(0, ...allTasks.map((t) => t.sort)) + 10
      const { error } = await supabase.from('tasks').insert({ family_id: familyId, name, emoji, times_per_day, sort, kind: 'custom' })
      if (error) throw error
      await refresh()
    },
    async updateTask(id, patch) {
      setAllTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)))
      const { error } = await supabase.from('tasks').update(patch).eq('id', id)
      if (error) { void refresh(); throw error }
    },
  }), [loaded, allTasks, logs, familyId, refresh])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData outside provider')
  return ctx
}

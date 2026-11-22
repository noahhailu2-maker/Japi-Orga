import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton, Button, Screen, Sheet } from '../components/ui'
import { LogRow } from '../components/LogRow'
import { useData } from '../lib/data'
import { useSession } from '../lib/session'
import type { Log } from '../lib/supabase'
import { clock, dayLabel, startOfDay } from '../lib/time'

export function History() {
  const nav = useNavigate()
  const { logs, allTasks, removeLog } = useData()
  const { members } = useSession()
  const [toDelete, setToDelete] = useState<Log | null>(null)

  const days = useMemo(() => {
    const map = new Map<number, Log[]>()
    for (const l of logs) {
      const k = startOfDay(new Date(l.done_at)).getTime()
      map.set(k, [...(map.get(k) ?? []), l])
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0])
  }, [logs])

  const delTask = toDelete ? allTasks.find((t) => t.id === toDelete.task_id) : undefined
  const delWho = toDelete ? members.find((m) => m.id === toDelete.member_id) : undefined

  return (
    <Screen>
      <div className="flex h-12 items-center"><BackButton onClick={() => nav('/')} /></div>
      <h1 className="pt-2 text-[28px] font-bold tracking-tight">Verlauf</h1>
      <p className="mt-1 text-[15px] text-muted">Die letzten 7 Tage. Tippe auf ✕, um einen falschen Eintrag zu löschen.</p>

      <div className="mt-6 flex flex-col gap-6 pb-8">
        {days.length === 0 && <p className="py-8 text-center text-muted">Noch keine Einträge.</p>}
        {days.map(([day, items]) => {
          const counts = allTasks
            .map((t) => ({ t, n: items.filter((l) => l.task_id === t.id).length }))
            .filter((x) => x.n > 0)
          return (
            <section key={day}>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-bold">{dayLabel(new Date(day))}</h2>
                <p className="truncate text-sm text-muted">{counts.map(({ t, n }) => `${t.emoji} ${n}×`).join('  ')}</p>
              </div>
              <ul className="divide-y divide-line rounded-3xl border border-line bg-card px-4">
                {items.map((l) => <LogRow key={l.id} log={l} onDelete={() => setToDelete(l)} />)}
              </ul>
            </section>
          )
        })}
      </div>

      <Sheet open={!!toDelete} onClose={() => setToDelete(null)} title="Eintrag löschen?">
        {toDelete && (
          <div className="flex flex-col gap-3 pb-2">
            <p className="text-[17px]">
              {delTask?.emoji} <b>{delTask?.name}</b> um {clock(toDelete.done_at)} von {delWho ? `${delWho.emoji} ${delWho.display_name}` : 'jemandem'}.
            </p>
            <Button variant="danger" onClick={() => { void removeLog(toDelete.id); setToDelete(null) }}>Löschen</Button>
            <Button variant="secondary" onClick={() => setToDelete(null)}>Abbrechen</Button>
          </div>
        )}
      </Sheet>
    </Screen>
  )
}

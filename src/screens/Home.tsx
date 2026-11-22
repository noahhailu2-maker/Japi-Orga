import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Screen, Sheet, Spinner } from '../components/ui'
import { InstallHint } from '../components/InstallHint'
import { TaskCard } from '../components/TaskCard'
import { Japi } from '../components/Japi'
import { UndoToast, type ToastData } from '../components/UndoToast'
import { LogRow } from '../components/LogRow'
import { ChoiceSheet, LogEditSheet } from '../components/LogSheets'
import { useSession } from '../lib/session'
import { useData } from '../lib/data'
import { friendlyError, type Log, type Message, type Task } from '../lib/supabase'
import { vibrate } from '../lib/platform'
import { ago, clock, startOfDay } from '../lib/time'
import { InviteSheet } from './InviteSheet'
import { ProfileSheet } from './ProfileSheet'

function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Guten Morgen'
  if (h < 18) return 'Hallo'
  return 'Guten Abend'
}

export function Home() {
  const { family, me, members } = useSession()
  const { tasks, logs, loaded, logTask, removeLog, messages, unread } = useData()
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const inviteOpen = params.get('einladen') === '1'
  const setInviteOpen = (open: boolean) => setParams(open ? { einladen: '1' } : {}, { replace: true })
  const [profileOpen, setProfileOpen] = useState(false)
  const [toast, setToast] = useState<ToastData | null>(null)
  const [confirm, setConfirm] = useState<{ task: Task; last: Log } | null>(null)
  const [busyTask, setBusyTask] = useState<string | null>(null)
  const [choosing, setChoosing] = useState<Task | null>(null)
  const [editLog, setEditLog] = useState<Log | null>(null)
  const clearToast = useCallback(() => setToast(null), [])

  const todayStart = startOfDay().getTime()
  const todayLogs = useMemo(() => logs.filter((l) => new Date(l.done_at).getTime() >= todayStart), [logs, todayStart])

  const goals = tasks.filter((t) => t.times_per_day > 0)
  const openCount = goals.reduce((n, t) => n + Math.max(0, t.times_per_day - todayLogs.filter((l) => l.task_id === t.id).length), 0)
  const allDone = loaded && goals.length > 0 && openCount === 0

  if (!family || !me) return null
  const dog = family.dog_name

  const doLog = async (task: Task, extra?: { choice: string | null; note: string | null }) => {
    setBusyTask(task.id)
    try {
      const log = await logTask(task.id, extra)
      vibrate(20)
      setToast({
        id: log.id,
        text: `${task.emoji} Eingetragen`,
        onNote: () => setEditLog(log),
        onUndo: () => { void removeLog(log.id).catch((e) => setToast({ id: 'err', text: friendlyError(e) })) },
      })
    } catch (e) {
      setToast({ id: `err-${Date.now()}`, text: friendlyError(e) })
    } finally {
      setBusyTask(null)
    }
  }

  const tap = (task: Task) => {
    if (task.kind === 'futter' && family.double_feed_hours > 0) {
      const last = logs.find((l) => l.task_id === task.id)
      if (last && Date.now() - new Date(last.done_at).getTime() < family.double_feed_hours * 3600_000) {
        vibrate([30, 60, 30])
        setConfirm({ task, last })
        return
      }
    }
    proceed(task)
  }

  const proceed = (task: Task) => {
    if (task.options.length > 0) setChoosing(task)
    else void doLog(task)
  }

  const lastFeeder = confirm ? members.find((m) => m.id === confirm.last.member_id) : undefined

  return (
    <Screen className="pb-28">
      <header className="flex items-center gap-2 pt-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted">{family.name}</p>
          <h1 className="truncate text-[28px] font-bold leading-tight tracking-tight">{greeting()}, {me.display_name}</h1>
        </div>
        <button
          onClick={() => nav('/einstellungen')}
          className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-card text-muted active:scale-95"
          aria-label="Einstellungen"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></svg>
        </button>
        <button
          onClick={() => setProfileOpen(true)}
          className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-card text-2xl active:scale-95"
          aria-label="Mein Profil"
        >
          {me.emoji}
        </button>
      </header>

      <main className="mt-6 flex flex-1 flex-col gap-6">
        <section>
          <div className="mb-3 flex items-end gap-3">
            <Japi size={60} background={false} mood={allDone ? 'happy' : 'idle'} className="-mb-1 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Heute für {dog}</h2>
              <p className="truncate text-[15px] font-medium">{allDone ? `Alles erledigt, ${dog} ist glücklich!` : `${openCount} ${openCount === 1 ? 'Sache' : 'Sachen'} noch offen`}</p>
            </div>
          </div>
          {!loaded ? (
            <div className="flex justify-center py-10 text-muted"><Spinner /></div>
          ) : (
            <div className="flex flex-col gap-3">
              {tasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  todayLogs={todayLogs.filter((l) => l.task_id === t.id)}
                  members={members}
                  busy={busyTask === t.id}
                  onTap={() => tap(t)}
                />
              ))}
              {tasks.length === 0 && (
                <p className="rounded-3xl border border-dashed border-line p-6 text-center text-muted">
                  Noch keine Aufgaben. Lege sie in den <Link to="/einstellungen" className="text-accent underline">Einstellungen</Link> an.
                </p>
              )}
            </div>
          )}
        </section>

        <ChatCard messages={messages} unread={unread} onOpen={() => nav('/chat')} />

        {members.length < 2 && (
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-3 rounded-3xl border border-dashed border-accent/50 p-4 text-left active:scale-[0.98]"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft text-xl text-accent">+</span>
            <span>
              <span className="block font-semibold">Familie einladen</span>
              <span className="block text-sm text-muted">Damit alle sehen, was schon erledigt ist.</span>
            </span>
          </button>
        )}

        <section>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Verlauf heute</h2>
            <Link to="/verlauf" className="text-[15px] font-medium text-accent">Alle Tage</Link>
          </div>
          {todayLogs.length === 0 ? (
            <p className="py-4 text-[15px] text-muted">Heute wurde noch nichts eingetragen.</p>
          ) : (
            <ul className="divide-y divide-line rounded-3xl border border-line bg-card px-4">
              {todayLogs.slice(0, 8).map((l) => <LogRow key={l.id} log={l} onOpen={() => setEditLog(l)} />)}
            </ul>
          )}
        </section>

        <InstallHint />
      </main>

      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title={`${dog} hat schon gegessen`}>
        {confirm && (
          <div className="flex flex-col gap-4 pb-2">
            <div className="flex items-center gap-4 rounded-3xl bg-accent-soft p-4">
              <span className="text-4xl">🍖</span>
              <p className="text-[17px] leading-snug">
                <b>{lastFeeder ? `${lastFeeder.emoji} ${lastFeeder.display_name}` : 'Jemand'}</b> hat um{' '}
                <b>{clock(confirm.last.done_at)}</b> gefüttert ({ago(confirm.last.done_at)}).
              </p>
            </div>
            <p className="text-[15px] text-muted">Wirklich nochmal füttern?</p>
            <Button onClick={() => setConfirm(null)}>Doch nicht</Button>
            <Button variant="secondary" onClick={() => { const t = confirm.task; setConfirm(null); proceed(t) }}>
              Trotzdem eintragen
            </Button>
          </div>
        )}
      </Sheet>

      <ChoiceSheet task={choosing} onClose={() => setChoosing(null)} onLog={(extra) => { const t = choosing!; setChoosing(null); void doLog(t, extra) }} />
      <LogEditSheet log={editLog} onClose={() => setEditLog(null)} />
      <UndoToast toast={toast} onDone={clearToast} />
      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </Screen>
  )
}

function ChatCard({ messages, unread, onOpen }: { messages: Message[]; unread: number; onOpen: () => void }) {
  const { members } = useSession()
  const last = messages[messages.length - 1]
  const who = last ? members.find((m) => m.id === last.member_id) : undefined
  return (
    <button onClick={onOpen} className="flex items-center gap-4 rounded-3xl border border-line bg-card p-4 text-left active:scale-[0.98]">
      <span className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-bg text-[28px]">
        💬
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-[13px] font-bold text-accent-ink">{unread}</span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[19px] font-bold">Familien-Chat</span>
        <span className="block truncate text-[15px] text-muted">
          {last ? <>{who ? `${who.emoji} ${who.display_name}: ` : ''}{last.body}</> : 'Nachricht für alle hinterlassen'}
        </span>
      </span>
      <span className="text-xl text-muted" aria-hidden>›</span>
    </button>
  )
}

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton, Button, ErrorText, Screen, Sheet, TextField } from '../components/ui'
import { useData } from '../lib/data'
import { useSession } from '../lib/session'
import { friendlyError, type Task } from '../lib/supabase'
import { InviteSheet } from './InviteSheet'

const TASK_EMOJIS = ['🍖', '🦮', '🎾', '💧', '🛁', '🪮', '💊', '🦴', '🧸', '🚗', '🩺', '✂️', '🐾', '🧹', '🌙', '☀️']

export function Settings() {
  const nav = useNavigate()
  const { family, members, me, updateFamily } = useSession()
  const { tasks, allTasks, updateTask } = useData()
  const [editing, setEditing] = useState<Task | 'new' | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [familyOpen, setFamilyOpen] = useState(false)
  if (!family || !me) return null
  const archived = allTasks.filter((t) => t.archived)

  const move = (i: number, dir: -1 | 1) => {
    const a = tasks[i], b = tasks[i + dir]
    if (!a || !b) return
    void updateTask(a.id, { sort: b.sort === a.sort ? a.sort + dir : b.sort })
    void updateTask(b.id, { sort: a.sort })
  }

  const hours = family.double_feed_hours
  const setHours = (h: number) => void updateFamily({ double_feed_hours: Math.max(0, Math.min(12, h)) })

  return (
    <Screen>
      <div className="flex h-12 items-center"><BackButton onClick={() => nav('/')} /></div>
      <h1 className="pt-2 text-[28px] font-bold tracking-tight">Einstellungen</h1>

      <div className="mt-6 flex flex-col gap-8 pb-10">
        {/* Aufgaben */}
        <section>
          <SectionTitle>Aufgaben für {family.dog_name}</SectionTitle>
          <ul className="divide-y divide-line rounded-3xl border border-line bg-card">
            {tasks.map((t, i) => (
              <li key={t.id} className="flex items-center gap-2 py-2 pl-4 pr-2">
                <button onClick={() => setEditing(t)} className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left">
                  <span className="text-2xl">{t.emoji}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[17px] font-medium">{t.name}</span>
                    <span className="block text-sm text-muted">{t.times_per_day === 0 ? 'Nach Bedarf' : `${t.times_per_day}× am Tag`}</span>
                  </span>
                </button>
                <IconBtn label="Nach oben" disabled={i === 0} onClick={() => move(i, -1)}>↑</IconBtn>
                <IconBtn label="Nach unten" disabled={i === tasks.length - 1} onClick={() => move(i, 1)}>↓</IconBtn>
              </li>
            ))}
            <li>
              <button onClick={() => setEditing('new')} className="flex h-14 w-full items-center gap-3 px-4 font-semibold text-accent">
                <span className="text-xl">+</span> Aufgabe hinzufügen
              </button>
            </li>
          </ul>
          {archived.length > 0 && (
            <details className="mt-3 px-1 text-[15px] text-muted">
              <summary className="cursor-pointer">Ausgeblendet ({archived.length})</summary>
              <ul className="mt-2 flex flex-col gap-1">
                {archived.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-1">
                    <span>{t.emoji} {t.name}</span>
                    <button className="font-medium text-accent" onClick={() => void updateTask(t.id, { archived: false })}>Wieder anzeigen</button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        {/* Doppelt füttern */}
        <section>
          <SectionTitle>Warnung bei doppeltem Füttern</SectionTitle>
          <div className="rounded-3xl border border-line bg-card p-4">
            <p className="text-[15px] leading-snug text-muted">
              {hours === 0 ? 'Ausgeschaltet.' : <>Wenn innerhalb von <b className="text-ink">{fmtHours(hours)}</b> nochmal gefüttert wird, fragt die App nach.</>}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Stepper value={hours} onChange={setHours} step={0.5} min={0} max={12} format={(h) => (h === 0 ? 'Aus' : fmtHours(h))} />
            </div>
          </div>
        </section>

        {/* Familie */}
        <section>
          <SectionTitle>Familie</SectionTitle>
          <ul className="divide-y divide-line rounded-3xl border border-line bg-card">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-[17px] font-medium">{m.display_name}</span>
                {m.id === me.id && <span className="ml-auto text-sm text-muted">Du</span>}
              </li>
            ))}
            <li>
              <button onClick={() => setInviteOpen(true)} className="flex h-14 w-full items-center gap-3 px-4 font-semibold text-accent">
                <span className="text-xl">+</span> Familie einladen
              </button>
            </li>
          </ul>
          <button onClick={() => setFamilyOpen(true)} className="mt-3 px-1 text-[15px] font-medium text-accent">
            Namen von Familie und Hund ändern
          </button>
        </section>
      </div>

      <TaskSheet
        task={editing}
        onClose={() => setEditing(null)}
      />
      <FamilySheet open={familyOpen} onClose={() => setFamilyOpen(false)} />
      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </Screen>
  )
}

const fmtHours = (h: number) => `${String(h).replace('.', ',')} ${h === 1 ? 'Stunde' : 'Stunden'}`

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-muted">{children}</h2>
}

function IconBtn({ children, label, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button {...rest} aria-label={label} className="flex size-10 items-center justify-center rounded-full text-lg text-muted active:bg-line disabled:opacity-25">
      {children}
    </button>
  )
}

function Stepper({ value, onChange, step = 1, min, max, format }: { value: number; onChange: (v: number) => void; step?: number; min: number; max: number; format: (v: number) => string }) {
  const btn = 'flex size-12 items-center justify-center rounded-2xl border border-line bg-bg text-2xl font-medium active:scale-95 disabled:opacity-30'
  return (
    <div className="flex items-center gap-3">
      <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} aria-label="Weniger">−</button>
      <span className="min-w-28 text-center text-[17px] font-semibold tabular-nums">{format(value)}</span>
      <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} aria-label="Mehr">+</button>
    </div>
  )
}

function TaskSheet({ task, onClose }: { task: Task | 'new' | null; onClose: () => void }) {
  const isNew = task === 'new'
  const t = task && task !== 'new' ? task : null
  return (
    <Sheet open={!!task} onClose={onClose} title={isNew ? 'Neue Aufgabe' : 'Aufgabe bearbeiten'}>
      {task && <TaskForm key={t?.id ?? 'new'} task={t} onClose={onClose} />}
    </Sheet>
  )
}

function TaskForm({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const { addTask, updateTask } = useData()
  const [name, setName] = useState(task?.name ?? '')
  const [emoji, setEmoji] = useState(task?.emoji ?? '🐾')
  const [times, setTimes] = useState(task?.times_per_day ?? 1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true); setError('')
    try {
      if (task) await updateTask(task.id, { name: name.trim(), emoji, times_per_day: times })
      else await addTask({ name: name.trim(), emoji, times_per_day: times })
      onClose()
    } catch (err) { setError(friendlyError(err)); setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 pb-2">
      <TextField label="Name" value={name} maxLength={40} placeholder="z. B. Wasser auffüllen" onChange={(e) => setName(e.target.value)} />
      <div>
        <span className="mb-2 block text-sm font-medium text-muted">Symbol</span>
        <div className="grid grid-cols-8 gap-1.5">
          {TASK_EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => setEmoji(e)} aria-pressed={emoji === e}
              className={`flex aspect-square items-center justify-center rounded-xl text-2xl ${emoji === e ? 'bg-accent-soft ring-2 ring-accent' : 'border border-line bg-card'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="mb-2 block text-sm font-medium text-muted">Wie oft am Tag?</span>
        <Stepper value={times} onChange={setTimes} min={0} max={12} format={(v) => (v === 0 ? 'Nach Bedarf' : `${v}×`)} />
      </div>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" loading={busy} disabled={!name.trim()}>Speichern</Button>
      {task && (
        <Button type="button" variant="ghost" className="h-11 text-[15px]"
          onClick={() => { void updateTask(task.id, { archived: true }); onClose() }}>
          Aufgabe ausblenden
        </Button>
      )}
    </form>
  )
}

function FamilySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { family, updateFamily } = useSession()
  const [name, setName] = useState(family?.name ?? '')
  const [dog, setDog] = useState(family?.dog_name ?? '')
  const [busy, setBusy] = useState(false)
  if (!family) return null
  return (
    <Sheet open={open} onClose={onClose} title="Namen ändern">
      <form
        className="flex flex-col gap-5 pb-2"
        onSubmit={async (e) => {
          e.preventDefault(); setBusy(true)
          try { await updateFamily({ name: name.trim() || family.name, dog_name: dog.trim() || family.dog_name }); onClose() }
          finally { setBusy(false) }
        }}
      >
        <TextField label="Name der Familie" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        <TextField label="Name des Hundes" value={dog} maxLength={40} onChange={(e) => setDog(e.target.value)} />
        <Button type="submit" loading={busy}>Speichern</Button>
      </form>
    </Sheet>
  )
}

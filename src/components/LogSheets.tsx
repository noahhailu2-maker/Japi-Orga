import { useState } from 'react'
import { Button, Sheet } from './ui'
import { useData } from '../lib/data'
import { useSession } from '../lib/session'
import type { Log, Task } from '../lib/supabase'
import { clock } from '../lib/time'

function NoteInput({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <textarea
      value={value}
      autoFocus={autoFocus}
      maxLength={300}
      rows={2}
      placeholder="Notiz, z. B. „hat langsam gegessen“"
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-none rounded-2xl border border-line bg-card px-4 py-3 text-[17px] text-ink outline-none placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15"
    />
  )
}

function Choices({ options, value, onPick }: { options: string[]; value: string | null; onPick: (o: string | null) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onPick(value === o ? null : o)} aria-pressed={value === o}
          className={`flex h-14 items-center justify-between rounded-2xl px-5 text-left text-[17px] font-semibold transition active:scale-[0.98] ${
            value === o ? 'bg-accent text-accent-ink' : 'border border-line bg-card'}`}>
          {o}{value === o && <span>✓</span>}
        </button>
      ))}
    </div>
  )
}

/** Vor dem Eintragen: Auswahl (z. B. ganze/halbe Portion) + optionale Notiz. */
export function ChoiceSheet({ task, onClose, onLog }: { task: Task | null; onClose: () => void; onLog: (extra: { choice: string | null; note: string | null }) => void }) {
  return (
    <Sheet open={!!task} onClose={onClose} title={task ? `${task.emoji} ${task.name}` : ''}>
      {task && <ChoiceForm key={task.id} task={task} onLog={onLog} />}
    </Sheet>
  )
}

function ChoiceForm({ task, onLog }: { task: Task; onLog: (extra: { choice: string | null; note: string | null }) => void }) {
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const n = note.trim() || null
  return (
    <div className="flex flex-col gap-3 pb-2">
      {task.options.map((o) => (
        <Button key={o} variant="secondary" className="justify-start text-left" onClick={() => onLog({ choice: o, note: n })}>{o}</Button>
      ))}
      <Button variant="ghost" className="h-11 text-[15px]" onClick={() => onLog({ choice: null, note: n })}>Ohne Angabe eintragen</Button>
      {showNote
        ? <NoteInput value={note} onChange={setNote} autoFocus />
        : <button className="text-[15px] font-medium text-accent" onClick={() => setShowNote(true)}>+ Notiz dazuschreiben</button>}
    </div>
  )
}

/** Eintrag ansehen, Auswahl/Notiz ändern oder löschen. */
export function LogEditSheet({ log, onClose }: { log: Log | null; onClose: () => void }) {
  return (
    <Sheet open={!!log} onClose={onClose} title="Eintrag">
      {log && <LogEditForm key={log.id} log={log} onClose={onClose} />}
    </Sheet>
  )
}

function LogEditForm({ log, onClose }: { log: Log; onClose: () => void }) {
  const { allTasks, updateLog, removeLog } = useData()
  const { members } = useSession()
  const task = allTasks.find((t) => t.id === log.task_id)
  const who = members.find((m) => m.id === log.member_id)
  const [choice, setChoice] = useState<string | null>(log.choice)
  const [note, setNote] = useState(log.note ?? '')
  const [confirmDel, setConfirmDel] = useState(false)
  const [busy, setBusy] = useState(false)
  const options = [...new Set([...(task?.options ?? []), ...(log.choice ? [log.choice] : [])])]

  const save = async () => {
    setBusy(true)
    try { await updateLog(log.id, { choice, note: note.trim() || null }); onClose() } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col gap-4 pb-2">
      <p className="text-[17px]">
        {task?.emoji} <b>{task?.name ?? 'Aufgabe'}</b> um {clock(log.done_at)} von {who ? `${who.emoji} ${who.display_name}` : 'jemandem'}
      </p>
      {options.length > 0 && <Choices options={options} value={choice} onPick={setChoice} />}
      <NoteInput value={note} onChange={setNote} />
      <Button onClick={save} loading={busy}>Speichern</Button>
      {confirmDel ? (
        <div className="flex gap-2">
          <Button variant="secondary" className="h-12" onClick={() => setConfirmDel(false)}>Abbrechen</Button>
          <Button variant="danger" className="h-12" onClick={() => { void removeLog(log.id); onClose() }}>Wirklich löschen</Button>
        </div>
      ) : (
        <Button variant="ghost" className="h-11 text-[15px]" onClick={() => setConfirmDel(true)}>Eintrag löschen</Button>
      )}
    </div>
  )
}

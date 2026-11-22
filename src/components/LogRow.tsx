import { useData } from '../lib/data'
import { useSession } from '../lib/session'
import type { Log } from '../lib/supabase'
import { clock } from '../lib/time'

export function LogRow({ log, onDelete }: { log: Log; onDelete?: () => void }) {
  const { allTasks } = useData()
  const { members } = useSession()
  const task = allTasks.find((t) => t.id === log.task_id)
  const who = members.find((m) => m.id === log.member_id)
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="w-12 shrink-0 font-mono text-[15px] tabular-nums text-muted">{clock(log.done_at)}</span>
      <span className="text-xl">{task?.emoji ?? '•'}</span>
      <span className="min-w-0 flex-1 truncate text-[16px] font-medium">
        {task?.name ?? 'Aufgabe'}
        {log.source === 'nfc' && <span className="ml-1.5 rounded-md bg-bg px-1.5 py-0.5 text-xs text-muted">NFC</span>}
      </span>
      <span className="shrink-0 truncate text-[15px] text-muted">{who ? `${who.emoji} ${who.display_name}` : 'Ehemalig'}</span>
      {onDelete && (
        <button onClick={onDelete} className="-mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-muted active:bg-line" aria-label="Eintrag löschen">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      )}
    </li>
  )
}

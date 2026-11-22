import { useData } from '../lib/data'
import { useSession } from '../lib/session'
import type { Log } from '../lib/supabase'
import { clock } from '../lib/time'

export function LogRow({ log, onOpen }: { log: Log; onOpen?: () => void }) {
  const { allTasks } = useData()
  const { members } = useSession()
  const task = allTasks.find((t) => t.id === log.task_id)
  const who = members.find((m) => m.id === log.member_id)
  const extra = [log.choice, log.note].filter(Boolean).join(' · ')
  return (
    <li>
      <button onClick={onOpen} disabled={!onOpen} className="flex w-full items-center gap-3 py-3 text-left">
        <span className="w-12 shrink-0 self-start pt-0.5 font-mono text-[15px] tabular-nums text-muted">{clock(log.done_at)}</span>
        <span className="self-start text-xl">{task?.emoji ?? '•'}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-medium">
            {task?.name ?? 'Aufgabe'}
            {log.source === 'nfc' && <span className="ml-1.5 rounded-md bg-bg px-1.5 py-0.5 text-xs text-muted">NFC</span>}
          </span>
          {extra && <span className="block text-[14px] leading-snug text-muted">{extra}</span>}
        </span>
        <span className="shrink-0 self-start truncate pt-0.5 text-[15px] text-muted">{who ? `${who.emoji} ${who.display_name}` : 'Ehemalig'}</span>
      </button>
    </li>
  )
}

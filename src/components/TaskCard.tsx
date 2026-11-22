import type { Log, Member, Task } from '../lib/supabase'
import { clock } from '../lib/time'

type Props = { task: Task; todayLogs: Log[]; members: Member[]; onTap: () => void; busy?: boolean }

export function TaskCard({ task, todayLogs, members, onTap, busy }: Props) {
  const count = todayLogs.length
  const goal = task.times_per_day
  const done = goal > 0 && count >= goal
  const last = todayLogs[0]
  const who = last ? members.find((m) => m.id === last.member_id) : undefined

  return (
    <button
      onClick={onTap}
      disabled={busy}
      className={`flex w-full items-center gap-4 rounded-3xl border p-4 text-left transition active:scale-[0.98] ${
        done ? 'border-transparent bg-accent-soft' : 'border-line bg-card'
      }`}
    >
      <span className={`flex size-14 shrink-0 items-center justify-center rounded-2xl text-[30px] ${done ? 'bg-card/70' : 'bg-bg'}`}>
        {task.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate text-[19px] font-bold">{task.name}</span>
          {goal > 0 && <span className="shrink-0 text-[15px] font-medium text-muted">{count}/{goal}</span>}
        </span>
        <span className="mt-0.5 block truncate text-[15px] text-muted">
          {last
            ? <>{clock(last.done_at)} · {who ? `${who.emoji} ${who.display_name}` : 'jemand'}</>
            : goal === 0 ? 'Nach Bedarf' : 'Heute noch nicht'}
        </span>
        {goal > 1 && (
          <span className="mt-2 flex gap-1.5" aria-hidden>
            {Array.from({ length: goal }).map((_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i < count ? 'bg-accent' : 'bg-line'}`} />
            ))}
          </span>
        )}
      </span>
      <span
        className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xl font-bold ${
          done ? 'bg-accent text-accent-ink' : 'border-2 border-line text-muted'
        }`}
        aria-hidden
      >
        {done ? '✓' : '+'}
      </span>
    </button>
  )
}

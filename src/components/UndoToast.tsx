import { useEffect, useState } from 'react'

export type ToastData = { id: string; text: string; onUndo?: () => void; onNote?: () => void }
const DURATION = 10_000

export function UndoToast({ toast, onDone }: { toast: ToastData | null; onDone: () => void }) {
  const [undoing, setUndoing] = useState(false)

  useEffect(() => {
    if (!toast) return
    setUndoing(false)
    const t = setTimeout(onDone, DURATION)
    return () => clearTimeout(t)
  }, [toast, onDone])

  if (!toast) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 safe-bottom">
      <div key={toast.id} className="animate-sheet pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl bg-ink text-bg shadow-xl">
        <div className="flex items-center gap-3 py-2 pl-4 pr-2">
          <p className="min-w-0 flex-1 truncate text-[16px] font-medium">{toast.text}</p>
          {toast.onNote && (
            <button
              onClick={() => { toast.onNote?.(); onDone() }}
              className="h-11 shrink-0 rounded-xl px-3 text-[16px] font-semibold text-bg/80 active:bg-white/10"
            >
              Notiz
            </button>
          )}
          {toast.onUndo && (
            <button
              disabled={undoing}
              onClick={() => { setUndoing(true); toast.onUndo?.(); onDone() }}
              className="h-11 shrink-0 rounded-xl px-4 text-[16px] font-semibold text-accent active:bg-white/10"
            >
              Rückgängig
            </button>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-accent" style={{ animation: `shrink ${DURATION}ms linear forwards` }} />
      </div>
    </div>
  )
}

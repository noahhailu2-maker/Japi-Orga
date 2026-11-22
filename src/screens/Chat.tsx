import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton, Button, Sheet } from '../components/ui'
import { useData } from '../lib/data'
import { useSession } from '../lib/session'
import { friendlyError, type Message } from '../lib/supabase'
import { clock, dayLabel, startOfDay } from '../lib/time'

export function Chat() {
  const nav = useNavigate()
  const { messages, sendMessage, deleteMessage, markChatSeen } = useData()
  const { members, me } = useSession()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [toDelete, setToDelete] = useState<Message | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { markChatSeen() }, [messages, markChatSeen])
  useLayoutEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [messages.length])

  const send = async (e: FormEvent) => {
    e.preventDefault()
    const body = text.trim()
    if (!body) return
    setSending(true); setError('')
    try { await sendMessage(body); setText('') }
    catch (err) { setError(friendlyError(err)) }
    finally { setSending(false) }
  }

  return (
    <div className="mx-auto flex h-dvh w-full max-w-md flex-col">
      <header className="flex items-center gap-2 border-b border-line bg-bg/90 px-5 pb-2 backdrop-blur safe-top">
        <BackButton onClick={() => nav('/')} />
        <h1 className="flex-1 text-center text-[17px] font-bold">Familien-Chat</h1>
        <span className="w-20" />
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted">
            <p className="text-5xl">💬</p>
            <p className="mt-3 max-w-[16rem] text-[15px]">Hier könnt ihr euch Nachrichten hinterlassen, z. B. „Tierarzt morgen um 10“.</p>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          {messages.map((m, i) => {
            const mine = m.member_id === me?.id
            const prev = messages[i - 1]
            const newDay = !prev || startOfDay(new Date(prev.created_at)).getTime() !== startOfDay(new Date(m.created_at)).getTime()
            const showName = !mine && (newDay || prev?.member_id !== m.member_id)
            const who = members.find((x) => x.id === m.member_id)
            return (
              <div key={m.id}>
                {newDay && <p className="my-3 text-center text-xs font-medium uppercase tracking-wide text-muted">{dayLabel(new Date(m.created_at))}</p>}
                <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <button
                    onClick={() => mine && setToDelete(m)}
                    className={`max-w-[80%] rounded-3xl px-4 py-2.5 text-left ${mine ? 'rounded-br-lg bg-accent text-accent-ink' : 'rounded-bl-lg border border-line bg-card'}`}
                  >
                    {showName && <span className="mb-0.5 block text-[13px] font-semibold text-muted">{who ? `${who.emoji} ${who.display_name}` : 'Ehemalig'}</span>}
                    <span className="whitespace-pre-wrap break-words text-[16px] leading-snug">{m.body}</span>
                    <span className={`ml-2 inline-block translate-y-0.5 text-[11px] ${mine ? 'text-accent-ink/70' : 'text-muted'}`}>{clock(m.created_at)}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        <div ref={endRef} />
      </main>

      <form onSubmit={send} className="border-t border-line bg-bg px-4 pt-3 safe-bottom">
        {error && <p className="mb-2 text-sm text-danger">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); void send(e) } }}
            rows={1}
            maxLength={1000}
            placeholder="Nachricht an alle"
            className="max-h-32 min-h-12 flex-1 resize-none rounded-3xl border border-line bg-card px-4 py-3 text-[16px] leading-snug outline-none focus:border-accent"
          />
          <button type="submit" disabled={!text.trim() || sending} aria-label="Senden"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-accent-ink transition active:scale-95 disabled:opacity-40">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          </button>
        </div>
      </form>

      <Sheet open={!!toDelete} onClose={() => setToDelete(null)} title="Nachricht löschen?">
        <div className="flex flex-col gap-3 pb-2">
          <p className="rounded-2xl bg-card p-4 text-[16px]">{toDelete?.body}</p>
          <Button variant="danger" onClick={() => { if (toDelete) void deleteMessage(toDelete.id); setToDelete(null) }}>Für alle löschen</Button>
          <Button variant="secondary" onClick={() => setToDelete(null)}>Abbrechen</Button>
        </div>
      </Sheet>
    </div>
  )
}

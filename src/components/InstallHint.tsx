import { useState } from 'react'
import { isIOS, isStandalone } from '../lib/platform'

/** Erklärt iPhone-Nutzern, warum die App auf den Home-Bildschirm gehört (nötig für Push ab iOS 16.4). */
export function InstallHint() {
  const [hidden, setHidden] = useState(() => {
    try { return localStorage.getItem('japi-install-hint') === 'hidden' } catch { return false }
  })
  if (isStandalone() || hidden) return null
  const ios = isIOS()

  const hide = () => {
    setHidden(true)
    try { localStorage.setItem('japi-install-hint', 'hidden') } catch { /* egal */ }
  }

  return (
    <div className="animate-fade relative rounded-3xl border border-line bg-card p-4 pr-10">
      <p className="font-semibold">Als App installieren</p>
      {ios ? (
        <p className="mt-1 text-[15px] leading-snug text-muted">
          Tippe unten in Safari auf <ShareIcon /> <b className="text-ink">Teilen</b> und dann auf{' '}
          <b className="text-ink">„Zum Home-Bildschirm"</b>. Öffne Japi danach immer über das neue Symbol. Nur so
          klappen später die Erinnerungen.
        </p>
      ) : (
        <p className="mt-1 text-[15px] leading-snug text-muted">
          Tippe oben rechts auf <b className="text-ink">⋮</b> und dann auf <b className="text-ink">„App installieren"</b>{' '}
          oder <b className="text-ink">„Zum Startbildschirm"</b>.
        </p>
      )}
      <button onClick={hide} className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full text-muted" aria-label="Hinweis ausblenden">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
  )
}

function ShareIcon() {
  return (
    <svg className="inline -mt-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  )
}

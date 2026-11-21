import { Button, PawLogo, Screen, Spinner } from '../components/ui'

export function Loading() {
  return (
    <Screen className="items-center justify-center">
      <PawLogo size={64} />
      <Spinner className="mt-8 text-muted" />
    </Screen>
  )
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <Screen className="justify-center gap-6 text-center">
      <div>
        <p className="text-5xl">📡</p>
        <h1 className="mt-4 text-2xl font-bold">Keine Verbindung</h1>
        <p className="mt-2 text-muted">Bitte prüfe dein Internet und versuche es nochmal.</p>
      </div>
      <Button onClick={onRetry}>Nochmal versuchen</Button>
    </Screen>
  )
}

export function SetupMissing() {
  return (
    <Screen className="justify-center gap-4">
      <PawLogo size={56} />
      <h1 className="text-2xl font-bold">Fast fertig</h1>
      <p className="text-muted">
        Die Verbindung zur Datenbank fehlt noch. Trage <code className="rounded bg-line px-1">VITE_SUPABASE_URL</code> und{' '}
        <code className="rounded bg-line px-1">VITE_SUPABASE_ANON_KEY</code> vom Japi-Supabase-Projekt ein (lokal in <code className="rounded bg-line px-1">.env</code>, online in Vercel unter Environment Variables).
      </p>
    </Screen>
  )
}

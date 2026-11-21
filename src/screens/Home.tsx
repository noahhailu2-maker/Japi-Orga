import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Screen } from '../components/ui'
import { InstallHint } from '../components/InstallHint'
import { useSession } from '../lib/session'
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
  const [params, setParams] = useSearchParams()
  const inviteOpen = params.get('einladen') === '1'
  const setInviteOpen = (open: boolean) => setParams(open ? { einladen: '1' } : {}, { replace: true })
  const [profileOpen, setProfileOpen] = useState(false)
  if (!family || !me) return null

  return (
    <Screen>
      <header className="flex items-center gap-3 pt-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted">{family.name}</p>
          <h1 className="truncate text-[28px] font-bold leading-tight tracking-tight">{greeting()}, {me.display_name}</h1>
        </div>
        <button
          onClick={() => setProfileOpen(true)}
          className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-card text-2xl active:scale-95"
          aria-label="Mein Profil"
        >
          {me.emoji}
        </button>
      </header>

      <main className="mt-6 flex flex-1 flex-col gap-4">
        <section className="rounded-3xl bg-accent-soft p-5">
          <p className="text-3xl">🐾</p>
          <p className="mt-2 text-xl font-bold">{family.dog_name} ist startklar</p>
          <p className="mt-1 text-[15px] leading-snug text-muted">
            Hier erscheint bald die Liste für heute: Futter, Gassi und Spielen, live für alle.
          </p>
        </section>

        <section className="rounded-3xl border border-line bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Familie</h2>
            <span className="text-sm text-muted">{members.length} {members.length === 1 ? 'Person' : 'Personen'}</span>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-bg text-xl">{m.emoji}</span>
                <span className="text-[17px] font-medium">{m.display_name}</span>
                {m.user_id === me.user_id && <span className="ml-auto text-sm text-muted">Du</span>}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setInviteOpen(true)}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-bg text-[16px] font-semibold text-accent active:scale-[0.98]"
          >
            <span className="text-xl leading-none">+</span> Familie einladen
          </button>
        </section>

        <InstallHint />
      </main>

      <InviteSheet open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </Screen>
  )
}

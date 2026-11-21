import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BackButton, Button, Screen } from '../components/ui'
import { useSession } from '../lib/session'
import { formatCode } from '../lib/platform'
import { ProfileForm } from './ProfileForm'
import { Header } from './CreateFamily'

const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)

export function JoinFamily() {
  const nav = useNavigate()
  const params = useParams()
  const { joinFamily } = useSession()
  const fromLink = clean(params.code ?? '')
  const [code, setCode] = useState(fromLink)
  const [step, setStep] = useState<1 | 2>(fromLink.length === 6 ? 2 : 1)

  const next = (e: FormEvent) => {
    e.preventDefault()
    if (code.length === 6) setStep(2)
  }

  return (
    <Screen>
      <div className="flex h-12 items-center">
        <BackButton onClick={() => (step === 2 ? setStep(1) : nav('/'))} />
        <span className="ml-auto text-sm text-muted">Schritt {step} von 2</span>
      </div>

      {step === 1 ? (
        <form onSubmit={next} className="flex flex-1 flex-col gap-6">
          <Header title="Familie beitreten" text="Gib den 6-stelligen Code ein. Du findest ihn bei jemandem aus der Familie unter „Einladen“." />
          <label className="block">
            <span className="sr-only">Familien-Code</span>
            <input
              value={formatCode(code).trim()}
              onChange={(e) => setCode(clean(e.target.value))}
              placeholder="ABC 123"
              autoFocus
              autoCapitalize="characters"
              autoComplete="one-time-code"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              className="h-20 w-full rounded-3xl border border-line bg-card text-center font-mono text-4xl font-bold tracking-[0.2em] text-ink uppercase outline-none transition placeholder:text-muted/40 focus:border-accent focus:ring-4 focus:ring-accent/15"
            />
          </label>
          <p className="text-center text-[15px] text-muted">Oder einfach den QR-Code mit der Handy-Kamera scannen.</p>
          <div className="mt-auto pt-2">
            <Button type="submit" disabled={code.length !== 6}>Weiter</Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-1 flex-col gap-6">
          <Header title="Und wer bist du?" text={`Code ${formatCode(code)} · Wähle deinen Namen und ein Zeichen.`} />
          <ProfileForm
            submitLabel="Beitreten"
            onSubmit={async ({ name, emoji }) => {
              await joinFamily({ code, name, emoji })
            }}
          />
        </div>
      )}
    </Screen>
  )
}

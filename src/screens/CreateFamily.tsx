import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton, Button, Screen, TextField } from '../components/ui'
import { useSession } from '../lib/session'
import { ProfileForm } from './ProfileForm'

export function CreateFamily() {
  const nav = useNavigate()
  const { createFamily } = useSession()
  const [step, setStep] = useState<1 | 2>(1)
  const [familyName, setFamilyName] = useState('')
  const [dogName, setDogName] = useState('Japi')

  const next = (e: FormEvent) => {
    e.preventDefault()
    if (familyName.trim()) setStep(2)
  }

  return (
    <Screen>
      <div className="flex h-12 items-center">
        <BackButton onClick={() => (step === 2 ? setStep(1) : nav('/'))} />
        <span className="ml-auto text-sm text-muted">Schritt {step} von 2</span>
      </div>

      {step === 1 ? (
        <form onSubmit={next} className="flex flex-1 flex-col gap-6">
          <Header title="Neue Familie" text="Das machst nur du. Die anderen treten danach mit einem Code bei." />
          <TextField label="Name der Familie" placeholder="z. B. Familie Müller" value={familyName} maxLength={60}
            onChange={(e) => setFamilyName(e.target.value)} autoFocus enterKeyHint="next" />
          <TextField label="Name des Hundes" value={dogName} maxLength={40} onChange={(e) => setDogName(e.target.value)} enterKeyHint="next" />
          <div className="mt-auto pt-2">
            <Button type="submit" disabled={!familyName.trim()}>Weiter</Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-1 flex-col gap-6">
          <Header title="Und wer bist du?" text="Wähle einen Namen und ein Zeichen für dieses Handy." />
          <ProfileForm
            submitLabel="Familie gründen"
            onSubmit={async ({ name, emoji }) => {
              // Danach springt die App automatisch auf die Startseite mit geöffneter Einladung (siehe App.tsx)
              await createFamily({ familyName: familyName.trim(), dogName: dogName.trim() || 'Japi', name, emoji })
            }}
          />
        </div>
      )}
    </Screen>
  )
}

export function Header({ title, text }: { title: string; text: string }) {
  return (
    <div className="pt-2">
      <h1 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
      <p className="mt-2 text-[17px] leading-snug text-muted">{text}</p>
    </div>
  )
}

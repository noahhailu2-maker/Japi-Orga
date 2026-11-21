import { useNavigate } from 'react-router-dom'
import { Button, PawLogo, Screen } from '../components/ui'
import { InstallHint } from '../components/InstallHint'

export function Welcome() {
  const nav = useNavigate()
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <PawLogo size={88} />
        <h1 className="mt-6 text-4xl font-bold tracking-tight">Japi</h1>
        <p className="mt-3 max-w-[18rem] text-[17px] leading-snug text-muted">
          Wer hat Japi schon gefüttert? Die ganze Familie sieht es sofort.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <InstallHint />
        <Button onClick={() => nav('/beitreten')}>Familie beitreten</Button>
        <Button variant="secondary" onClick={() => nav('/neu')}>Neue Familie gründen</Button>
        <p className="pt-1 text-center text-sm text-muted">Kein Passwort, keine E-Mail. Nur ein Familien-Code.</p>
      </div>
    </Screen>
  )
}

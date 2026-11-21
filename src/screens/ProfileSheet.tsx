import { useState } from 'react'
import { Button, Sheet } from '../components/ui'
import { useSession } from '../lib/session'
import { ProfileForm } from './ProfileForm'

export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { me, updateProfile, leaveFamily, family } = useSession()
  const [confirmLeave, setConfirmLeave] = useState(false)
  if (!me) return null

  return (
    <Sheet open={open} onClose={() => { setConfirmLeave(false); onClose() }} title="Mein Profil">
      <div className="flex flex-col gap-6 pb-2">
        <ProfileForm
          key={me.id + me.display_name + me.emoji}
          submitLabel="Speichern"
          initialName={me.display_name}
          initialEmoji={me.emoji}
          onSubmit={async (p) => { await updateProfile(p); onClose() }}
        />
        {confirmLeave ? (
          <div className="rounded-2xl border border-line bg-card p-4">
            <p className="text-[15px] text-muted">Dieses Handy verlässt „{family?.name}“. Du kannst jederzeit mit dem Code wieder beitreten.</p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" className="h-12" onClick={() => setConfirmLeave(false)}>Abbrechen</Button>
              <Button variant="danger" className="h-12" onClick={() => void leaveFamily()}>Verlassen</Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="h-11 text-[15px]" onClick={() => setConfirmLeave(true)}>Familie verlassen</Button>
        )}
      </div>
    </Sheet>
  )
}

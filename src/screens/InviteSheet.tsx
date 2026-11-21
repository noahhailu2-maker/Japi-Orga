import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Button, Sheet } from '../components/ui'
import { formatCode } from '../lib/platform'
import { useSession } from '../lib/session'

export function InviteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { family, rotateCode } = useSession()
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)
  const link = family ? `${window.location.origin}/j/${family.join_code}` : ''

  useEffect(() => {
    if (!link) return
    QRCode.toDataURL(link, { margin: 1, width: 480, color: { dark: '#1f1a17', light: '#ffffff' } }).then(setQr)
  }, [link])

  if (!family) return null

  const share = async () => {
    const text = `Komm in unsere Japi-App 🐶 Code: ${formatCode(family.join_code)}`
    if (navigator.share) {
      try { await navigator.share({ title: 'Japi', text, url: link }) } catch { /* abgebrochen */ }
    } else {
      await navigator.clipboard.writeText(`${text}\n${link}`)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Familie einladen">
      <p className="text-[15px] leading-snug text-muted">Mit der Handy-Kamera scannen oder den Code in der App eingeben.</p>
      <div className="mt-5 flex flex-col items-center rounded-3xl border border-line bg-white p-5">
        {qr ? <img src={qr} alt="QR-Code zum Beitreten" className="size-56" /> : <div className="size-56" />}
        <p className="mt-4 font-mono text-4xl font-bold tracking-[0.2em] text-[#1f1a17]">{formatCode(family.join_code)}</p>
      </div>
      <div className="mt-5 flex flex-col gap-3 pb-2">
        <Button onClick={share}>{copied ? 'Link kopiert ✓' : 'Link teilen'}</Button>
        {confirmRotate ? (
          <div className="rounded-2xl border border-line bg-card p-4">
            <p className="text-[15px] text-muted">Der alte Code funktioniert dann nicht mehr. Wer schon drin ist, bleibt drin.</p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" className="h-12" onClick={() => setConfirmRotate(false)}>Abbrechen</Button>
              <Button className="h-12" onClick={async () => { await rotateCode(); setConfirmRotate(false) }}>Neuer Code</Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="h-11 text-[15px]" onClick={() => setConfirmRotate(true)}>Neuen Code erzeugen</Button>
        )}
      </div>
    </Sheet>
  )
}

import { useState, type FormEvent } from 'react'
import { Button, EmojiPicker, ErrorText, TextField } from '../components/ui'
import { friendlyError } from '../lib/supabase'

type Props = {
  submitLabel: string
  initialName?: string
  initialEmoji?: string
  onSubmit: (p: { name: string; emoji: string }) => Promise<void>
}

export function ProfileForm({ submitLabel, initialName = '', initialEmoji = '', onSubmit }: Props) {
  const [name, setName] = useState(initialName)
  const [emoji, setEmoji] = useState(initialEmoji)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const valid = name.trim().length > 0 && emoji !== ''

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setBusy(true); setError('')
    try { await onSubmit({ name: name.trim(), emoji }) }
    catch (err) { setError(friendlyError(err)); setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="flex flex-1 flex-col gap-6">
      <TextField
        label="Dein Name"
        placeholder="z. B. Mama"
        value={name}
        maxLength={30}
        autoComplete="given-name"
        enterKeyHint="done"
        onChange={(e) => setName(e.target.value)}
        hint="So sehen die anderen, wer Japi versorgt hat."
      />
      <EmojiPicker value={emoji} onChange={setEmoji} />
      <ErrorText>{error}</ErrorText>
      <div className="mt-auto pt-2">
        <Button type="submit" disabled={!valid} loading={busy}>{submitLabel}</Button>
      </div>
    </form>
  )
}

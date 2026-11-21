import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { EMOJIS } from '../lib/platform'

export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 safe-top safe-bottom ${className}`}>
      {children}
    </div>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; loading?: boolean }

export function Button({ variant = 'primary', loading, className = '', children, disabled, ...rest }: BtnProps) {
  const styles = {
    primary: 'bg-accent text-accent-ink shadow-sm active:brightness-95',
    secondary: 'bg-card text-ink border border-line active:bg-line/60',
    ghost: 'text-muted active:text-ink',
    danger: 'bg-card text-danger border border-line active:bg-line/60',
  }[variant]
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`flex h-14 w-full items-center justify-center gap-2 rounded-2xl px-5 text-[17px] font-semibold transition active:scale-[0.98] disabled:opacity-50 ${styles} ${className}`}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return <span className={`inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} aria-label="Lädt" />
}

export function TextField({ label, hint, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-muted">{label}</span>
      <input
        {...rest}
        className="h-14 w-full rounded-2xl border border-line bg-card px-4 text-[17px] text-ink outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-4 focus:ring-accent/15"
      />
      {hint && <span className="mt-2 block text-sm text-muted">{hint}</span>}
    </label>
  )
}

export function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-muted">Dein Zeichen</span>
      <div className="grid grid-cols-5 gap-2">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            aria-pressed={value === e}
            className={`flex aspect-square items-center justify-center rounded-2xl text-[28px] transition active:scale-90 ${
              value === e ? 'bg-accent-soft ring-2 ring-accent' : 'bg-card border border-line'
            }`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="-ml-2 flex h-11 items-center gap-1 rounded-xl px-2 text-[17px] text-muted active:text-ink" aria-label="Zurück">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      Zurück
    </button>
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null
  return <p role="alert" className="animate-fade rounded-2xl bg-danger/10 px-4 py-3 text-[15px] text-danger">{children}</p>
}

export function Sheet({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: ReactNode; title: string }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button className="animate-fade absolute inset-0 bg-black/40" onClick={onClose} aria-label="Schließen" />
      <div className="animate-sheet relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-bg px-5 pt-3 safe-bottom">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="flex size-9 items-center justify-center rounded-full bg-line/70 text-muted" aria-label="Schließen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function PawLogo({ size = 72 }: { size?: number }) {
  return <img src="/favicon.svg" width={size} height={size} alt="" className="rounded-[22%] shadow-lg shadow-accent/25" />
}

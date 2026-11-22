export const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

export const clock = (iso: string | Date) =>
  new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

export function ago(iso: string, now = Date.now()) {
  const min = Math.round((now - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'gerade eben'
  if (min < 60) return `vor ${min} Min.`
  const h = Math.floor(min / 60)
  if (h < 24) return `vor ${h} Std.`
  return `vor ${Math.floor(h / 24)} Tg.`
}

export function dayLabel(d: Date) {
  const today = startOfDay()
  const diff = Math.round((today.getTime() - startOfDay(d).getTime()) / 86400000)
  if (diff === 0) return 'Heute'
  if (diff === 1) return 'Gestern'
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
}

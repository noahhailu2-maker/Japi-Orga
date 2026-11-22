import { useState } from 'react'

/** Japi (Foto). Antippen = kleiner Hüpfer, bei „alles erledigt“ wackelt sie fröhlich. */
export function Japi({ size = 96, mood = 'idle', className = '', rounded = 'full' }: { size?: number; mood?: 'idle' | 'happy'; className?: string; rounded?: 'full' | 'icon' }) {
  const [hop, setHop] = useState(0)
  return (
    <img
      key={hop}
      src="/japi.jpg"
      alt="Japi"
      width={size}
      height={size}
      onClick={() => setHop((h) => h + 1)}
      className={`object-cover ${rounded === 'full' ? 'rounded-full' : 'rounded-[22%]'} ${mood === 'happy' ? 'japi-happy' : ''} ${hop ? 'japi-hop' : ''} ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

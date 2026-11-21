export const isIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

export const vibrate = (pattern: number | number[]) => {
  try { navigator.vibrate?.(pattern) } catch { /* iOS kann das nicht */ }
}

export const formatCode = (code: string) => `${code.slice(0, 3)} ${code.slice(3)}`

export const EMOJIS = ['🐶', '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🐙', '🦄', '🐝', '🐢', '🌸', '🌻', '⭐', '🔥', '⚡', '🍀', '🎈', '🍕']

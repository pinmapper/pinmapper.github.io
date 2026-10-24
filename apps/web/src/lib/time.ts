const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

export function timeAgo(ts: number): string {
  const s = Math.round((ts - Date.now()) / 1000)
  if (Math.abs(s) < 60) return 'just now'
  const m = Math.round(s / 60)
  if (Math.abs(m) < 60) return rtf.format(m, 'minute')
  const h = Math.round(m / 60)
  if (Math.abs(h) < 24) return rtf.format(h, 'hour')
  const d = Math.round(h / 24)
  if (Math.abs(d) < 30) return rtf.format(d, 'day')
  return new Date(ts).toLocaleDateString()
}

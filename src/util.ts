export function fmtDate(iso: string): string {
  if (!iso || iso === '—') return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function ageYears(iso: string, now = new Date()): number {
  const b = new Date(iso)
  let a = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--
  return a
}

export function ageLabel(iso: string): string {
  const years = ageYears(iso)
  if (years >= 1) return `${years} ${years === 1 ? 'año' : 'años'}`
  const b = new Date(iso)
  const now = new Date()
  const months = (now.getFullYear() - b.getFullYear()) * 12 + now.getMonth() - b.getMonth()
  return `${Math.max(months, 0)} meses`
}

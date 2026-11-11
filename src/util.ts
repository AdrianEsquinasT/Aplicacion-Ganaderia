export function today(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function fmtDate(iso?: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function parse(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function addDays(iso: string, days: number): string {
  const d = parse(iso)
  d.setUTCDate(d.getUTCDate() + Math.round(days))
  return d.toISOString().slice(0, 10)
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86400000)
}

export function monthsBetween(a: string, b: string): number {
  const x = parse(a)
  const y = parse(b)
  let m = (y.getUTCFullYear() - x.getUTCFullYear()) * 12 + y.getUTCMonth() - x.getUTCMonth()
  if (y.getUTCDate() < x.getUTCDate()) m--
  return Math.max(m, 0)
}

export function ageLabel(birth: string, ref = today()): string {
  const m = monthsBetween(birth, ref)
  if (m >= 24) return `${Math.floor(m / 12)} años`
  if (m >= 12) return `${Math.floor(m / 12)} año${m % 12 ? ` y ${m % 12} m` : ''}`
  return `${m} ${m === 1 ? 'mes' : 'meses'}`
}

export function year(iso: string): number {
  return Number(iso.slice(0, 4))
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

export function avg(xs: number[]): number | undefined {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined
}

export function fmtNum(n: number | undefined, dec = 0, unit = ''): string {
  if (n === undefined || Number.isNaN(n)) return '—'
  return `${n.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec })}${unit ? ' ' + unit : ''}`
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

/** Reduce una imagen a un máximo de px de lado y la devuelve como JPEG dataURL. */
export function resizeImage(file: File, max = 1000, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k)
      c.height = Math.round(img.height * k)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = url
  })
}

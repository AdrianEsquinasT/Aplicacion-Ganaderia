import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import * as I from './Icons'
import { fotoAnimal } from '../logic'
import type { Index } from '../logic'
import type { Animal } from '../types'
import { resizeImage } from '../util'

// ---- avisos emergentes ----
let toastMsg = ''
const toastSubs = new Set<() => void>()
let timer: ReturnType<typeof setTimeout> | undefined
export function toast(msg: string) {
  toastMsg = msg
  toastSubs.forEach((f) => f())
  clearTimeout(timer)
  timer = setTimeout(() => {
    toastMsg = ''
    toastSubs.forEach((f) => f())
  }, 3200)
}
export function Toast() {
  const m = useSyncExternalStore(
    (f) => {
      toastSubs.add(f)
      return () => {
        toastSubs.delete(f)
      }
    },
    () => toastMsg,
  )
  return m ? <div className="toast" role="status">{m}</div> : null
}

// ---- ventana modal (hoja inferior en móvil) ----
export function Sheet({ title, sub, onClose, children, wide }: { title: string; sub?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="presentation">
      <div className={`sheet ${wide ? 'wide' : ''}`} role="dialog" aria-label={title}>
        <header>
          <div>
            <h3>{title}</h3>
            {sub && <p className="muted">{sub}</p>}
          </div>
          <button className="x" onClick={onClose} aria-label="Cerrar">×</button>
        </header>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children, hint, full }: { label: string; children: ReactNode; hint?: string; full?: boolean }) {
  return (
    <label className={`fld ${full ? 'full' : ''}`}>
      <span>{label}</span>
      {children}
      {hint && <small className="muted">{hint}</small>}
    </label>
  )
}

export function FormActions({ onCancel, label = 'Guardar', extra }: { onCancel: () => void; label?: string; extra?: ReactNode }) {
  return (
    <div className="form-actions">
      {extra}
      <span className="grow" />
      <button type="button" className="btn ghost" onClick={onCancel}>Cancelar</button>
      <button type="submit" className="btn primary">{label}</button>
    </div>
  )
}

export function Avatar({ i, a, size = 52, round }: { i: Index; a: Animal; size?: number; round?: boolean }) {
  const f = fotoAnimal(i, a)
  const st = { width: size, height: size, borderRadius: round ? '50%' : 10 }
  if (f) return <img className="avatar" style={st} src={f} alt={a.name || a.crotal} />
  return (
    <span className={`avatar ph ${a.sex === 'M' ? 'male' : ''}`} style={st}>
      <I.Cow size={Math.round(size * 0.7)} />
    </span>
  )
}

export const SexMark = ({ sex }: { sex: 'F' | 'M' }) => <span className={sex === 'F' ? 'sex f' : 'sex m'} title={sex === 'F' ? 'Hembra' : 'Macho'}>{sex === 'F' ? '♀' : '♂'}</span>

export function PhotoPicker({ value, onChange, label = 'Añadir fotografía' }: { value?: string; onChange: (dataUrl: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  return (
    <div className="photo-picker">
      {value ? <img src={value} alt="Vista previa" /> : <span className="ph-box"><I.Camera size={28} /></span>}
      <button type="button" className="btn soft" onClick={() => ref.current?.click()} disabled={busy}>
        <I.Camera size={16} /> {busy ? 'Procesando…' : value ? 'Cambiar fotografía' : label}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (!f) return
          setBusy(true)
          try {
            onChange(await resizeImage(f))
          } catch {
            toast('No se pudo leer la imagen')
          }
          setBusy(false)
        }}
      />
    </div>
  )
}

export function Card({ title, icon, action, children, className = '' }: { title?: string; icon?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="head">
          <h3>{icon}{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="muted empty">{children}</p>
}

export function ScoreBar({ valor, detalle, nombre, destacado }: { valor: number | null; detalle: string; nombre: string; destacado?: boolean }) {
  return (
    <li className={`score-row ${destacado ? 'big' : ''}`} title={detalle}>
      <span>{nombre}</span>
      <span className="bar"><i style={{ width: valor === null ? 0 : `${valor * 10}%` }} /></span>
      <b>{valor === null ? '—' : valor.toFixed(1).replace('.', ',')}</b>
    </li>
  )
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string }[] }) {
  return (
    <div className="tabs" role="tablist">
      {items.map((t) => (
        <button key={t.id} role="tab" aria-selected={t.id === value} className={t.id === value ? 'on' : ''} onClick={() => onChange(t.id)}>{t.label}</button>
      ))}
    </div>
  )
}

export function Kpi({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="kpi">
      <small>{label}</small>
      <b>{value}</b>
      {sub && <small className="muted">{sub}</small>}
    </div>
  )
}

import { useState } from 'react'
import type { FormEvent } from 'react'

export type ModalKind = 'peso' | 'tratamiento' | 'parto' | 'estrategia'

interface Props {
  kind: ModalKind
  animalName: string
  onClose: () => void
  onSubmit: (values: Record<string, string>) => void
}

const TITLES: Record<ModalKind, string> = {
  peso: 'Añadir peso',
  tratamiento: 'Añadir tratamiento',
  parto: 'Registrar parto',
  estrategia: 'Nueva estrategia reproductiva',
}

export default function Modal({ kind, animalName, onClose, onSubmit }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [v, setV] = useState<Record<string, string>>({ date: today, sex: 'Macho' })
  const set = (k: string, val: string) => setV((s) => ({ ...s, [k]: val }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(v)
  }

  return (
    <div className="overlay" onClick={onClose} role="presentation">
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} aria-label={TITLES[kind]}>
        <h3>{TITLES[kind]}</h3>
        <p className="muted">{animalName}</p>
        <label>
          Fecha
          <input type="date" required value={v.date} onChange={(e) => set('date', e.target.value)} />
        </label>
        {kind === 'peso' && (
          <label>
            Peso (kg)
            <input type="number" min="1" max="2000" step="1" required autoFocus value={v.kg ?? ''} onChange={(e) => set('kg', e.target.value)} />
          </label>
        )}
        {kind === 'tratamiento' && (
          <label>
            Descripción
            <input type="text" required autoFocus placeholder="Ej.: Vacunación" value={v.text ?? ''} onChange={(e) => set('text', e.target.value)} />
          </label>
        )}
        {kind === 'parto' && (
          <>
            <label>
              Sexo de la cría
              <select value={v.sex} onChange={(e) => set('sex', e.target.value)}>
                <option>Macho</option>
                <option>Hembra</option>
              </select>
            </label>
            <label>
              Nombre o crotal de la cría
              <input type="text" required placeholder="Ej.: Ternero 260" value={v.name ?? ''} onChange={(e) => set('name', e.target.value)} />
            </label>
          </>
        )}
        {kind === 'estrategia' && (
          <p className="muted">
            Se reiniciará el ciclo con CIDR en la fecha indicada y los pasos siguientes (retirada, PG, IA, diagnóstico) calculados automáticamente.
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn primary">
            Guardar
          </button>
        </div>
      </form>
    </div>
  )
}

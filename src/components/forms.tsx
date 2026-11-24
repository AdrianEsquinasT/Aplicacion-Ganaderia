import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { A } from '../actions'
import { etiqueta, fechaPrevistaParto, categoria } from '../logic'
import type { Index } from '../logic'
import { TIPOS_SANIDAD } from '../types'
import type { Animal, BreedShare, Ciclo, Facilidad, Lote, Metodo, Ref, Sanidad, Semental, Sex, TipoParto, TipoSanidad } from '../types'
import { addDays, ageLabel, fmtDate, today, uid } from '../util'
import { Field, FormActions, PhotoPicker, Sheet, toast } from './ui'

const num = (s: string): number | undefined => (s.trim() === '' || Number.isNaN(Number(s)) ? undefined : Number(s))
const txt = (s: string): string | undefined => (s.trim() === '' ? undefined : s.trim())

/** Opciones de padre: sementales del catálogo + machos de la explotación. */
export function PadreSelect({ i, value, onChange, excludeId }: { i: Index; value?: Ref; onChange: (r?: Ref) => void; excludeId?: string }) {
  const toros = i.state.animals.filter((a) => a.sex === 'M' && a.id !== excludeId)
  const v = value ? `${value.kind}:${value.id}` : ''
  return (
    <select value={v} onChange={(e) => { const [k, id] = e.target.value.split(':'); onChange(e.target.value ? { kind: k as Ref['kind'], id } : undefined) }}>
      <option value="">No registrado</option>
      <optgroup label="Catálogo de sementales">
        {i.state.sementales.map((s) => <option key={s.id} value={`semental:${s.id}`}>{s.name} ({s.breed})</option>)}
      </optgroup>
      <optgroup label="Toros de la explotación">
        {toros.map((a) => <option key={a.id} value={`animal:${a.id}`}>{etiqueta(i, a)}{i.baja.has(a.id) ? ' (baja)' : ''}</option>)}
      </optgroup>
    </select>
  )
}
export function MadreSelect({ i, value, onChange, excludeId }: { i: Index; value?: string; onChange: (id?: string) => void; excludeId?: string }) {
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)}>
      <option value="">No registrada</option>
      {i.state.animals.filter((a) => a.sex === 'F' && a.id !== excludeId).map((a) => <option key={a.id} value={a.id}>{etiqueta(i, a)}{i.baja.has(a.id) ? ' (baja)' : ''}</option>)}
    </select>
  )
}

// ---------------------------------------------------------------- animal
export function AnimalForm({ i, animal, onClose, onSaved }: { i: Index; animal?: Animal; onClose: () => void; onSaved?: (id: string) => void }) {
  const cfg = i.state.config
  const [a, setA] = useState<Animal>(
    animal ?? { id: uid(), crotal: '', name: '', sex: 'F', breed: cfg.razaPorDefecto, birth: today(), entryDate: today(), explotacion: cfg.nombre },
  )
  const [photo, setPhoto] = useState<string>()
  const [peso, setPeso] = useState('')
  const [manual, setManual] = useState<BreedShare[] | undefined>(animal?.compositionManual)
  const set = <K extends keyof Animal>(k: K, v: Animal[K]) => setA((s) => ({ ...s, [k]: v }))
  const dup = i.state.animals.find((x) => x.crotal.trim() === a.crotal.trim() && x.id !== a.id)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!a.crotal.trim()) return toast('El número de crotal es obligatorio')
    const clean: Animal = { ...a, crotal: a.crotal.trim(), name: a.name.trim(), compositionManual: manual && manual.length ? manual : undefined }
    A.saveAnimal(clean, photo)
    const kg = num(peso)
    if (!animal && kg) A.addPesaje({ animalId: a.id, fecha: today(), kg, tipo: 'control' })
    toast(animal ? 'Cambios guardados' : 'Animal creado')
    onSaved?.(a.id)
    onClose()
  }

  return (
    <Sheet title={animal ? 'Editar animal' : 'Nuevo animal'} sub={animal ? etiqueta(i, animal) : undefined} onClose={onClose} wide>
      <form onSubmit={submit} className="form-grid">
        <div className="full"><PhotoPicker value={photo ?? (animal && i.photo.get(animal.mainPhotoId ?? '')?.data)} onChange={setPhoto} /></div>
        <Field label="Número de crotal *" hint={dup ? '⚠ Ya existe un animal con este crotal' : undefined}><input required value={a.crotal} onChange={(e) => set('crotal', e.target.value)} placeholder="ES123456789012" /></Field>
        <Field label="Nombre"><input value={a.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Nº de manejo" hint="El número corto con el que lo llamas (ej. 125)"><input value={a.num ?? ''} onChange={(e) => set('num', txt(e.target.value))} /></Field>
        <Field label="Identificación oficial"><input value={a.officialId ?? ''} onChange={(e) => set('officialId', txt(e.target.value))} /></Field>
        <Field label="Sexo *"><select value={a.sex} onChange={(e) => set('sex', e.target.value as Sex)}><option value="F">Hembra</option><option value="M">Macho</option></select></Field>
        <Field label="Raza"><select value={a.breed} onChange={(e) => set('breed', e.target.value)}>{[...new Set([...cfg.breeds, a.breed])].map((b) => <option key={b}>{b}</option>)}</select></Field>
        <Field label="Fecha de nacimiento *"><input type="date" required value={a.birth} max={today()} onChange={(e) => set('birth', e.target.value)} /></Field>
        <Field label="Fecha de alta"><input type="date" value={a.entryDate ?? ''} onChange={(e) => set('entryDate', txt(e.target.value))} /></Field>
        <Field label="Padre (semental o toro)"><PadreSelect i={i} value={a.sire} onChange={(r) => set('sire', r)} excludeId={a.id} /></Field>
        <Field label="Madre"><MadreSelect i={i} value={a.dam} onChange={(id) => set('dam', id)} excludeId={a.id} /></Field>
        <Field label="Lote"><select value={a.loteId ?? ''} onChange={(e) => set('loteId', txt(e.target.value))}><option value="">Sin lote</option>{i.state.lotes.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></Field>
        <Field label="Destino"><select value={a.destino ?? ''} onChange={(e) => set('destino', (e.target.value || undefined) as Animal['destino'])}><option value="">Sin definir</option><option>Reposición</option><option>Venta</option></select></Field>
        <Field label="Condición corporal (1-5)"><input type="number" min="1" max="5" step="0.5" value={a.condition ?? ''} onChange={(e) => set('condition', num(e.target.value))} /></Field>
        <Field label="Altura (cm)"><input type="number" min="0" value={a.height ?? ''} onChange={(e) => set('height', num(e.target.value))} /></Field>
        <Field label="Manejabilidad (1-10)"><input type="number" min="1" max="10" value={a.manejabilidad ?? ''} onChange={(e) => set('manejabilidad', num(e.target.value))} /></Field>
        <Field label="Partos anteriores no registrados" hint="Si ya había parido antes de usar la app"><input type="number" min="0" value={a.partosPrevios ?? ''} onChange={(e) => set('partosPrevios', num(e.target.value))} /></Field>
        {!animal && <Field label="Peso actual (kg)" hint="Opcional; se guarda como primer pesaje"><input type="number" min="1" value={peso} onChange={(e) => setPeso(e.target.value)} /></Field>}
        <label className="check"><input type="checkbox" checked={!!a.seca} onChange={(e) => set('seca', e.target.checked || undefined)} /> Vaca seca</label>
        <div className="full">
          <label className="check"><input type="checkbox" checked={!!manual} onChange={(e) => setManual(e.target.checked ? [{ breed: a.breed, pct: 100 }] : undefined)} /> Indicar la composición racial a mano (si no, se calcula de los progenitores)</label>
          {manual && (
            <div className="comp-rows">
              {manual.map((m, k) => (
                <div key={k}>
                  <select value={m.breed} onChange={(e) => setManual(manual.map((x, j) => (j === k ? { ...x, breed: e.target.value } : x)))}>{cfg.breeds.map((b) => <option key={b}>{b}</option>)}</select>
                  <input type="number" min="0" max="100" value={m.pct} onChange={(e) => setManual(manual.map((x, j) => (j === k ? { ...x, pct: Number(e.target.value) } : x)))} /> %
                  {manual.length > 1 && <button type="button" className="x" onClick={() => setManual(manual.filter((_, j) => j !== k))}>×</button>}
                </div>
              ))}
              <button type="button" className="btn soft" onClick={() => setManual([...manual, { breed: cfg.breeds[0], pct: 0 }])}>+ Otra raza</button>
              {Math.round(manual.reduce((s, x) => s + x.pct, 0)) !== 100 && <small className="warn">Los porcentajes deberían sumar 100 (suman {manual.reduce((s, x) => s + x.pct, 0)})</small>}
            </div>
          )}
        </div>
        <Field label="Collar GPS: proveedor" hint="Preparado para el futuro; aún sin conexión con el collar"><input value={a.collarProveedor ?? ''} onChange={(e) => set('collarProveedor', txt(e.target.value))} /></Field>
        <Field label="Collar GPS: identificador"><input value={a.collarGps ?? ''} onChange={(e) => set('collarGps', txt(e.target.value))} /></Field>
        <Field label="Observaciones morfológicas" full><textarea rows={2} value={a.morfologia ?? ''} onChange={(e) => set('morfologia', txt(e.target.value))} /></Field>
        <Field label="Observaciones" full><textarea rows={2} value={a.obs ?? ''} onChange={(e) => set('obs', txt(e.target.value))} /></Field>
        <div className="full"><FormActions onCancel={onClose} /></div>
      </form>
    </Sheet>
  )
}

// ---------------------------------------------------------------- peso
export function PesoForm({ animal, i, onClose }: { animal: Animal; i: Index; onClose: () => void }) {
  const [fecha, setFecha] = useState(today())
  const [kg, setKg] = useState('')
  const [tipo, setTipo] = useState<'control' | 'nacimiento' | 'destete'>('control')
  const [obs, setObs] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const v = num(kg)
    if (!v || v <= 0) return toast('Introduce un peso válido')
    A.addPesaje({ animalId: animal.id, fecha, kg: v, tipo, obs: txt(obs) })
    toast(`Peso registrado: ${v} kg`)
    onClose()
  }
  return (
    <Sheet title="Añadir peso" sub={etiqueta(i, animal)} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <Field label="Fecha"><input type="date" required value={fecha} max={today()} onChange={(e) => setFecha(e.target.value)} /></Field>
        <Field label="Peso (kg)"><input type="number" inputMode="decimal" required autoFocus min="1" step="0.5" value={kg} onChange={(e) => setKg(e.target.value)} /></Field>
        <Field label="Edad (calculada)"><input readOnly value={fecha >= animal.birth ? ageLabel(animal.birth, fecha) : '—'} /></Field>
        <Field label="Tipo de pesaje"><select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)}><option value="control">Control</option><option value="nacimiento">Al nacimiento</option><option value="destete">Al destete</option></select></Field>
        <Field label="Observaciones" full><input value={obs} onChange={(e) => setObs(e.target.value)} /></Field>
        <div className="full"><FormActions onCancel={onClose} /></div>
      </form>
    </Sheet>
  )
}

// ---------------------------------------------------------------- estrategia reproductiva (ciclo)
export function CicloForm({ i, vaca, ciclo, onClose }: { i: Index; vaca: Animal; ciclo?: Ciclo; onClose: () => void }) {
  const cfg = i.state.config
  const [c, setC] = useState<Ciclo>(ciclo ?? { id: uid(), vacaId: vaca.id, label: `Ciclo ${new Date().getFullYear()}`, metodo: 'Inseminación artificial' })
  const set = (p: Partial<Ciclo>) => setC((s) => ({ ...s, ...p }))
  const step = (k: 'cidr' | 'retirada') => ({
    fecha: c[k]?.fecha ?? '',
    hora: c[k]?.hora ?? '',
    obs: c[k]?.obs ?? '',
  })
  const setStep = (k: 'cidr' | 'retirada', f: Partial<{ fecha: string; hora: string; obs: string }>) => {
    const n = { ...step(k), ...f }
    set({ [k]: n.fecha ? { fecha: n.fecha, hora: txt(n.hora), obs: txt(n.obs) } : undefined } as Partial<Ciclo>)
  }
  const pg = c.pg
  const ia = c.ia
  const mo = c.monta
  const dg = c.diag
  const prevista = useMemo(() => fechaPrevistaParto({ ...c, fechaPrevista: undefined }, cfg.gestacionDias), [c, cfg.gestacionDias])

  const autofill = () => {
    if (!c.cidr?.fecha) return toast('Primero indica la fecha de colocación del CIDR')
    const d = c.cidr.fecha
    set({ retirada: c.retirada ?? { fecha: addDays(d, 8) }, pg: c.pg ?? { fecha: addDays(d, 8) }, ia: c.metodo === 'Inseminación artificial' ? (c.ia ?? { fecha: addDays(d, 10) }) : c.ia })
    toast('Fechas típicas propuestas (CIDR + 8 días, IA + 10 días). Ajústalas si hace falta.')
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (c.metodo === 'Inseminación artificial' && c.ia && !c.ia.fecha) return toast('Indica la fecha de inseminación')
    const out: Ciclo = {
      ...c,
      ia: c.metodo === 'Inseminación artificial' ? c.ia : undefined,
      monta: c.metodo === 'Monta natural' ? c.monta : undefined,
      diag: c.diag && (c.diag.fecha || c.diag.resultado) ? c.diag : undefined,
    }
    A.saveCiclo(out)
    toast(ciclo ? 'Ciclo actualizado' : 'Estrategia reproductiva guardada')
    onClose()
  }

  const toros = i.state.animals.filter((a) => a.sex === 'M')
  return (
    <Sheet title={ciclo ? 'Editar ciclo reproductivo' : 'Nueva estrategia reproductiva'} sub={etiqueta(i, vaca)} onClose={onClose} wide>
      <form onSubmit={submit} className="form-grid">
        <Field label="Nombre del ciclo"><input value={c.label} onChange={(e) => set({ label: e.target.value })} /></Field>
        <Field label="Método reproductivo"><select value={c.metodo} onChange={(e) => set({ metodo: e.target.value as Metodo })}><option>Inseminación artificial</option><option>Monta natural</option></select></Field>

        <fieldset className="full"><legend>CIDR</legend>
          <div className="row3">
            <Field label="Fecha de colocación"><input type="date" value={step('cidr').fecha} onChange={(e) => setStep('cidr', { fecha: e.target.value })} /></Field>
            <Field label="Hora"><input type="time" value={step('cidr').hora} onChange={(e) => setStep('cidr', { hora: e.target.value })} /></Field>
            <Field label="Observaciones"><input value={step('cidr').obs} onChange={(e) => setStep('cidr', { obs: e.target.value })} /></Field>
          </div>
          <button type="button" className="btn soft" onClick={autofill}>Proponer fechas típicas del protocolo</button>
        </fieldset>
        <fieldset className="full"><legend>Retirada del CIDR</legend>
          <div className="row3">
            <Field label="Fecha de retirada"><input type="date" value={step('retirada').fecha} onChange={(e) => setStep('retirada', { fecha: e.target.value })} /></Field>
            <Field label="Hora"><input type="time" value={step('retirada').hora} onChange={(e) => setStep('retirada', { hora: e.target.value })} /></Field>
            <Field label="Observaciones"><input value={step('retirada').obs} onChange={(e) => setStep('retirada', { obs: e.target.value })} /></Field>
          </div>
        </fieldset>
        <fieldset className="full"><legend>Prostaglandina</legend>
          <div className="row3">
            <Field label="Fecha"><input type="date" value={pg?.fecha ?? ''} onChange={(e) => set({ pg: e.target.value ? { ...pg, fecha: e.target.value } : undefined })} /></Field>
            <Field label="Hora"><input type="time" value={pg?.hora ?? ''} onChange={(e) => pg && set({ pg: { ...pg, hora: txt(e.target.value) } })} disabled={!pg} /></Field>
            <Field label="Producto"><input value={pg?.producto ?? ''} onChange={(e) => pg && set({ pg: { ...pg, producto: txt(e.target.value) } })} disabled={!pg} /></Field>
            <Field label="Dosis"><input value={pg?.dosis ?? ''} onChange={(e) => pg && set({ pg: { ...pg, dosis: txt(e.target.value) } })} disabled={!pg} /></Field>
            <Field label="Observaciones" full><input value={pg?.obs ?? ''} onChange={(e) => pg && set({ pg: { ...pg, obs: txt(e.target.value) } })} disabled={!pg} /></Field>
          </div>
        </fieldset>

        {c.metodo === 'Inseminación artificial' ? (
          <fieldset className="full"><legend>Inseminación artificial</legend>
            <div className="row3">
              <Field label="Fecha"><input type="date" value={ia?.fecha ?? ''} onChange={(e) => set({ ia: e.target.value ? { ...ia, fecha: e.target.value } : undefined })} /></Field>
              <Field label="Hora"><input type="time" value={ia?.hora ?? ''} disabled={!ia} onChange={(e) => ia && set({ ia: { ...ia, hora: txt(e.target.value) } })} /></Field>
              <Field label="Semental del catálogo"><select value={ia?.sementalId ?? ''} disabled={!ia} onChange={(e) => ia && set({ ia: { ...ia, sementalId: txt(e.target.value) } })}><option value="">Sin indicar</option>{i.state.sementales.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
              <Field label="Tipo de semen"><input value={ia?.tipoSemen ?? ''} disabled={!ia} onChange={(e) => ia && set({ ia: { ...ia, tipoSemen: txt(e.target.value) } })} placeholder="Convencional / sexado…" /></Field>
              <Field label="Técnico / veterinario" full><input value={ia?.tecnico ?? ''} disabled={!ia} onChange={(e) => ia && set({ ia: { ...ia, tecnico: txt(e.target.value) } })} /></Field>
              <Field label="Observaciones" full><input value={ia?.obs ?? ''} disabled={!ia} onChange={(e) => ia && set({ ia: { ...ia, obs: txt(e.target.value) } })} /></Field>
            </div>
          </fieldset>
        ) : (
          <fieldset className="full"><legend>Monta natural (excepción)</legend>
            <div className="row3">
              <Field label="Toro utilizado"><select value={mo?.toroId ?? ''} onChange={(e) => set({ monta: { ...mo, toroId: txt(e.target.value) } })}><option value="">Seleccionar…</option>{toros.map((t) => <option key={t.id} value={t.id}>{etiqueta(i, t)}</option>)}</select></Field>
              <Field label="Entrada con el toro"><input type="date" value={mo?.entrada ?? ''} onChange={(e) => set({ monta: { ...mo, entrada: txt(e.target.value) } })} /></Field>
              <Field label="Salida del toro"><input type="date" value={mo?.salida ?? ''} onChange={(e) => set({ monta: { ...mo, salida: txt(e.target.value) } })} /></Field>
              <Field label="Observaciones" full><input value={mo?.obs ?? ''} onChange={(e) => set({ monta: { ...mo, obs: txt(e.target.value) } })} /></Field>
            </div>
          </fieldset>
        )}

        <fieldset className="full"><legend>Diagnóstico de gestación</legend>
          <div className="row3">
            <Field label="Fecha"><input type="date" value={dg?.fecha ?? ''} onChange={(e) => set({ diag: { resultado: dg?.resultado ?? 'Gestante', ...dg, fecha: txt(e.target.value) } })} /></Field>
            <Field label="Resultado"><select value={dg?.resultado ?? ''} onChange={(e) => set({ diag: e.target.value ? { ...dg, resultado: e.target.value as 'Gestante' | 'Vacía' | 'Dudosa' } : undefined })}><option value="">Pendiente</option><option>Gestante</option><option>Vacía</option><option>Dudosa</option></select></Field>
            <Field label="Método"><input value={dg?.metodo ?? ''} disabled={!dg} placeholder="Ecografía / palpación…" onChange={(e) => dg && set({ diag: { ...dg, metodo: txt(e.target.value) } })} /></Field>
            <Field label="Observaciones" full><input value={dg?.obs ?? ''} disabled={!dg} onChange={(e) => dg && set({ diag: { ...dg, obs: txt(e.target.value) } })} /></Field>
          </div>
        </fieldset>
        <Field label="Aborto (fecha, si ocurre)"><input type="date" value={c.aborto?.fecha ?? ''} onChange={(e) => set({ aborto: e.target.value ? { fecha: e.target.value } : undefined })} /></Field>
        <Field label="Fecha prevista de parto" hint={prevista ? `Calculada: ${fmtDate(prevista)} (${cfg.gestacionDias} días de gestación). Déjalo vacío para usarla.` : 'Se calcula al indicar la inseminación o la monta'}><input type="date" value={c.fechaPrevista ?? ''} onChange={(e) => set({ fechaPrevista: txt(e.target.value) })} /></Field>
        <Field label="Observaciones del ciclo" full><input value={c.obs ?? ''} onChange={(e) => set({ obs: txt(e.target.value) })} /></Field>
        <div className="full"><FormActions onCancel={onClose} /></div>
      </form>
    </Sheet>
  )
}

// ---------------------------------------------------------------- parto
export function PartoForm({ i, vacaId, onClose, onSaved }: { i: Index; vacaId?: string; onClose: () => void; onSaved?: (calfId: string) => void }) {
  const vacas = i.state.animals.filter((a) => a.sex === 'F' && !i.baja.has(a.id) && ['Vaca', 'Novilla'].includes(categoria(i, a)))
  const [dam, setDam] = useState(vacaId ?? vacas[0]?.id ?? '')
  const abierto = useMemo(() => {
    const l = (i.ciclos.get(dam) ?? []).filter((c) => !c.partoId && !c.aborto && (c.ia || c.monta))
    return l[l.length - 1]
  }, [i, dam])
  const sireAuto: Ref | undefined = abierto?.ia?.sementalId ? { kind: 'semental', id: abierto.ia.sementalId } : abierto?.monta?.toroId ? { kind: 'animal', id: abierto.monta.toroId } : undefined
  const [sireOv, setSireOv] = useState<{ v?: Ref } | null>(null)
  const sire = sireOv ? sireOv.v : sireAuto
  const [f, setF] = useState({ fecha: today(), sex: 'M' as Sex, crotal: '', num: '', name: '', peso: '', facilidad: 'Normal' as Facilidad, tipo: 'Normal' as TipoParto, estadoCria: 'Vivo', estadoMadre: 'Buena', incidencias: '', obs: '' })
  const [photo, setPhoto] = useState<string>()
  const s = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }))
  const dup = i.state.animals.some((a) => a.crotal.trim() === f.crotal.trim())

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!dam) return toast('Selecciona la vaca')
    if (!f.crotal.trim()) return toast('Introduce el crotal del ternero')
    const id = A.registrarParto({ damId: dam, fecha: f.fecha, sire, sex: f.sex, crotal: f.crotal.trim(), num: txt(f.num), name: txt(f.name), pesoNac: num(f.peso), tipo: f.tipo, facilidad: f.facilidad, incidencias: txt(f.incidencias), estadoMadre: txt(f.estadoMadre), estadoCria: f.estadoCria, obs: txt(f.obs), cicloId: abierto?.id, photo })
    toast('Parto registrado: ternero creado y enlazado con su madre y su padre')
    onSaved?.(id)
    onClose()
  }
  return (
    <Sheet title="Nuevo parto" sub="Se creará el ternero y se enlazará con la madre y el padre" onClose={onClose} wide>
      <form onSubmit={submit} className="form-grid">
        <Field label="Vaca"><select value={dam} onChange={(e) => { setDam(e.target.value); setSireOv(null) }}>{vacas.map((a) => <option key={a.id} value={a.id}>{etiqueta(i, a)}</option>)}</select></Field>
        <Field label="Fecha del parto"><input type="date" required value={f.fecha} max={today()} onChange={(e) => s({ fecha: e.target.value })} /></Field>
        <Field label="Padre" hint={sireAuto && !sireOv ? `Propuesto desde el ciclo "${abierto?.label}"` : undefined}><PadreSelect i={i} value={sire} onChange={(v) => setSireOv({ v })} /></Field>
        <Field label="Sexo de la cría"><select value={f.sex} onChange={(e) => s({ sex: e.target.value as Sex })}><option value="M">Macho</option><option value="F">Hembra</option></select></Field>
        <Field label="Crotal del ternero *" hint={dup ? '⚠ Este crotal ya existe' : undefined}><input required value={f.crotal} onChange={(e) => s({ crotal: e.target.value })} /></Field>
        <Field label="Nº de manejo"><input value={f.num} onChange={(e) => s({ num: e.target.value })} /></Field>
        <Field label="Nombre"><input value={f.name} onChange={(e) => s({ name: e.target.value })} /></Field>
        <Field label="Peso al nacimiento (kg)"><input type="number" inputMode="decimal" step="0.5" min="1" value={f.peso} onChange={(e) => s({ peso: e.target.value })} /></Field>
        <Field label="Facilidad de parto"><select value={f.facilidad} onChange={(e) => s({ facilidad: e.target.value as Facilidad })}><option>Fácil</option><option>Normal</option><option>Difícil</option><option>Muy difícil</option></select></Field>
        <Field label="Tipo de parto"><select value={f.tipo} onChange={(e) => s({ tipo: e.target.value as TipoParto })}><option>Normal</option><option>Asistido</option><option>Cesárea</option></select></Field>
        <Field label="Estado del ternero"><select value={f.estadoCria} onChange={(e) => s({ estadoCria: e.target.value })}><option>Vivo</option><option>Débil</option><option>Nacido muerto</option></select></Field>
        <Field label="Estado de la madre"><select value={f.estadoMadre} onChange={(e) => s({ estadoMadre: e.target.value })}><option>Buena</option><option>Regular</option><option>Mala</option></select></Field>
        <Field label="Incidencias"><input value={f.incidencias} onChange={(e) => s({ incidencias: e.target.value })} /></Field>
        <Field label="Observaciones"><input value={f.obs} onChange={(e) => s({ obs: e.target.value })} /></Field>
        <div className="full"><PhotoPicker value={photo} onChange={setPhoto} label="Fotografía del ternero (opcional)" /></div>
        <div className="full"><FormActions onCancel={onClose} label="Guardar parto" /></div>
      </form>
    </Sheet>
  )
}

// ---------------------------------------------------------------- sanidad
export function SanidadForm({ i, animalId, item, onClose }: { i: Index; animalId?: string; item?: Sanidad; onClose: () => void }) {
  const [x, setX] = useState<Sanidad>(item ?? { id: uid(), animalId: animalId ?? '', fecha: today(), tipo: 'Vacunación' })
  const set = (p: Partial<Sanidad>) => setX((s) => ({ ...s, ...p }))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!x.animalId) return toast('Selecciona el animal')
    A.saveSanidad(x)
    toast('Actuación sanitaria guardada')
    onClose()
  }
  const activos = i.state.animals.filter((a) => !i.baja.has(a.id))
  return (
    <Sheet title={item ? 'Editar actuación sanitaria' : 'Añadir actuación sanitaria'} onClose={onClose} wide>
      <form onSubmit={submit} className="form-grid">
        <Field label="Animal"><select value={x.animalId} disabled={!!animalId} onChange={(e) => set({ animalId: e.target.value })}><option value="">Seleccionar…</option>{activos.map((a) => <option key={a.id} value={a.id}>{etiqueta(i, a)}</option>)}</select></Field>
        <Field label="Fecha"><input type="date" required value={x.fecha} onChange={(e) => set({ fecha: e.target.value })} /></Field>
        <Field label="Tipo de actuación"><select value={x.tipo} onChange={(e) => set({ tipo: e.target.value as TipoSanidad })}>{TIPOS_SANIDAD.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Producto / medicamento"><input value={x.producto ?? ''} onChange={(e) => set({ producto: txt(e.target.value) })} /></Field>
        <Field label="Dosis"><input value={x.dosis ?? ''} onChange={(e) => set({ dosis: txt(e.target.value) })} /></Field>
        <Field label="Duración (días)"><input type="number" min="0" value={x.duracionDias ?? ''} onChange={(e) => set({ duracionDias: num(e.target.value) })} /></Field>
        <Field label="Veterinario"><input value={x.veterinario ?? ''} onChange={(e) => set({ veterinario: txt(e.target.value) })} /></Field>
        <Field label="Próxima actuación / revisión"><input type="date" value={x.proxima ?? ''} onChange={(e) => set({ proxima: txt(e.target.value) })} /></Field>
        <Field label="Observaciones" full><input value={x.obs ?? ''} onChange={(e) => set({ obs: txt(e.target.value) })} /></Field>
        <div className="full"><FormActions onCancel={onClose} /></div>
      </form>
    </Sheet>
  )
}

// ---------------------------------------------------------------- semental
export function SementalForm({ i, semental, onClose }: { i: Index; semental?: Semental; onClose: () => void }) {
  const [x, setX] = useState<Semental>(semental ?? { id: uid(), name: '', breed: i.state.config.razaPorDefecto })
  const [photo, setPhoto] = useState<string>()
  const set = (p: Partial<Semental>) => setX((s) => ({ ...s, ...p }))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!x.name.trim()) return toast('El nombre es obligatorio')
    A.saveSemental({ ...x, name: x.name.trim() }, photo)
    toast('Semental guardado')
    onClose()
  }
  return (
    <Sheet title={semental ? 'Editar semental' : 'Nuevo semental del catálogo'} onClose={onClose} wide>
      <form onSubmit={submit} className="form-grid">
        <div className="full"><PhotoPicker value={photo ?? (semental && i.photo.get(semental.photoId ?? '')?.data)} onChange={setPhoto} /></div>
        <Field label="Nombre *"><input required value={x.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Identificación"><input value={x.officialId ?? ''} onChange={(e) => set({ officialId: txt(e.target.value) })} /></Field>
        <Field label="Raza"><select value={x.breed} onChange={(e) => set({ breed: e.target.value })}>{[...new Set([...i.state.config.breeds, x.breed])].map((b) => <option key={b}>{b}</option>)}</select></Field>
        <Field label="Procedencia / catálogo"><input value={x.procedencia ?? ''} onChange={(e) => set({ procedencia: txt(e.target.value) })} /></Field>
        <Field label="Padre (pedigrí)"><input value={x.sireName ?? ''} onChange={(e) => set({ sireName: txt(e.target.value) })} /></Field>
        <Field label="Madre (pedigrí)"><input value={x.damName ?? ''} onChange={(e) => set({ damName: txt(e.target.value) })} /></Field>
        <Field label="Características" full><textarea rows={2} value={x.caracteristicas ?? ''} onChange={(e) => set({ caracteristicas: txt(e.target.value) })} /></Field>
        <Field label="Información genética disponible" full><textarea rows={2} value={x.genetica ?? ''} onChange={(e) => set({ genetica: txt(e.target.value) })} /></Field>
        <Field label="Observaciones" full><textarea rows={2} value={x.obs ?? ''} onChange={(e) => set({ obs: txt(e.target.value) })} /></Field>
        <div className="full"><FormActions onCancel={onClose} /></div>
      </form>
    </Sheet>
  )
}

// ---------------------------------------------------------------- baja
export function BajaForm({ i, animal, onClose }: { i: Index; animal: Animal; onClose: () => void }) {
  const [b, setB] = useState({ fecha: today(), motivo: 'Venta' as 'Venta' | 'Muerte' | 'Sacrificio' | 'Otro', precio: '', comprador: '', obs: '' })
  const submit = (e: FormEvent) => {
    e.preventDefault()
    A.darDeBaja({ animalId: animal.id, fecha: b.fecha, motivo: b.motivo, precio: num(b.precio), comprador: txt(b.comprador), obs: txt(b.obs) })
    toast('Baja registrada. El animal se conserva en el historial y la genealogía')
    onClose()
  }
  return (
    <Sheet title="Dar de baja" sub={etiqueta(i, animal)} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <Field label="Fecha de baja"><input type="date" required value={b.fecha} onChange={(e) => setB({ ...b, fecha: e.target.value })} /></Field>
        <Field label="Motivo"><select value={b.motivo} onChange={(e) => setB({ ...b, motivo: e.target.value as typeof b.motivo })}><option>Venta</option><option>Muerte</option><option>Sacrificio</option><option>Otro</option></select></Field>
        {b.motivo === 'Venta' && <><Field label="Precio de venta (€)"><input type="number" min="0" value={b.precio} onChange={(e) => setB({ ...b, precio: e.target.value })} /></Field><Field label="Comprador"><input value={b.comprador} onChange={(e) => setB({ ...b, comprador: e.target.value })} /></Field></>}
        <Field label="Observaciones" full><input value={b.obs} onChange={(e) => setB({ ...b, obs: e.target.value })} /></Field>
        <div className="full"><FormActions onCancel={onClose} label="Registrar baja" /></div>
      </form>
    </Sheet>
  )
}

export function LoteForm({ lote, onClose }: { lote?: Lote; onClose: () => void }) {
  const [n, setN] = useState(lote?.name ?? '')
  return (
    <Sheet title={lote ? 'Renombrar lote' : 'Nuevo lote'} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (!n.trim()) return; A.saveLote({ id: lote?.id ?? uid(), name: n.trim() }); toast('Lote guardado'); onClose() }} className="form-grid">
        <Field label="Nombre del lote" full><input autoFocus required value={n} onChange={(e) => setN(e.target.value)} /></Field>
        <div className="full"><FormActions onCancel={onClose} /></div>
      </form>
    </Sheet>
  )
}


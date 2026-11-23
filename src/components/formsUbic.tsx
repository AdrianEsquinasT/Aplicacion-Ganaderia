import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { A } from '../actions'
import * as L from '../logic'
import type { Index } from '../logic'
import { movimientoAbierto, nombreUbicacion, presentes } from '../ubicaciones'
import { CALIDADES, CANTIDADES, COMPOSICIONES, ESTADOS_PASTO, HUMEDADES, NIVELES, SOMBRAS, TIPOS_LABOR, TIPOS_UBICACION } from '../types'
import type { Animal, EstadoUbicacion, Labor, TipoLabor, TipoUbicacion, Ubicacion, Visita } from '../types'
import { fmtDate, today, uid } from '../util'
import { Field, FormActions, PhotoPicker, Sheet, toast } from './ui'

const num = (s: string): number | undefined => (s.trim() === '' || Number.isNaN(Number(s.replace(',', '.'))) ? undefined : Number(s.replace(',', '.')))
const txt = (s: string): string | undefined => (s.trim() === '' ? undefined : s.trim())

// ---------------------------------------------------------------- A. datos generales
export function UbicacionForm({ i, ubicacion, onClose, onSaved }: { i: Index; ubicacion?: Ubicacion; onClose: () => void; onSaved?: (id: string) => void }) {
  const [u, setU] = useState<Ubicacion>(ubicacion ?? { id: uid(), nombre: '', tipo: 'Pradera propia', estado: 'Disponible' })
  const [photo, setPhoto] = useState<string>()
  const [tot, setTot] = useState(u.superficieTotal?.toString().replace('.', ',') ?? '')
  const [apr, setApr] = useState(u.superficieAprovechable?.toString().replace('.', ',') ?? '')
  const set = <K extends keyof Ubicacion>(k: K, v: Ubicacion[K]) => setU((s) => ({ ...s, [k]: v }))
  const total = num(tot)
  const aprov = num(apr)
  const aviso = total !== undefined && aprov !== undefined && aprov > total

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!u.nombre.trim()) return toast('El nombre es obligatorio')
    if (aviso) return toast('La superficie aprovechable no puede superar a la total')
    A.saveUbicacion({ ...u, nombre: u.nombre.trim(), superficieTotal: total, superficieAprovechable: aprov }, photo)
    toast(ubicacion ? 'Cambios guardados' : 'Ubicación creada')
    onSaved?.(u.id)
    onClose()
  }
  const posibles = i.state.ubicaciones.filter((x) => x.id !== u.id && x.dentroDe !== u.id)
  return (
    <Sheet title={ubicacion ? 'Editar ubicación' : 'Nueva ubicación'} sub={ubicacion?.nombre} onClose={onClose} wide>
      <form onSubmit={submit} className="form-grid">
        <div className="full"><PhotoPicker value={photo ?? (ubicacion && i.photo.get(ubicacion.mainPhotoId ?? '')?.data)} onChange={setPhoto} label="Fotografía del terreno" /></div>
        <Field label="Nombre *" hint="Ej.: La Vega, El Prao Grande"><input required value={u.nombre} onChange={(e) => set('nombre', e.target.value)} /></Field>
        <Field label="Tipo de ubicación"><select value={u.tipo} onChange={(e) => set('tipo', e.target.value as TipoUbicacion)}>{TIPOS_UBICACION.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Está dentro de" hint="Para zonas de unos pastos comunales, por ejemplo"><select value={u.dentroDe ?? ''} onChange={(e) => set('dentroDe', txt(e.target.value))}><option value="">— (ubicación principal)</option>{posibles.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select></Field>
        <Field label="Estado" hint="«Ocupada» se calcula sola si hay animales"><select value={u.estado} onChange={(e) => set('estado', e.target.value as EstadoUbicacion)}><option>Disponible</option><option>En descanso</option><option>Reservada</option><option>No pastable</option></select></Field>
        <Field label="Municipio"><input value={u.municipio ?? ''} onChange={(e) => set('municipio', txt(e.target.value))} /></Field>
        <Field label="Provincia"><input value={u.provincia ?? ''} onChange={(e) => set('provincia', txt(e.target.value))} /></Field>
        <Field label="Zona"><input value={u.zona ?? ''} onChange={(e) => set('zona', txt(e.target.value))} /></Field>
        <fieldset className="full"><legend>Parcela / recinto SIGPAC (si se conocen)</legend>
          <div className="row3">
            <Field label="Polígono"><input value={u.poligono ?? ''} onChange={(e) => set('poligono', txt(e.target.value))} /></Field>
            <Field label="Parcela"><input value={u.parcela ?? ''} onChange={(e) => set('parcela', txt(e.target.value))} /></Field>
            <Field label="Recinto"><input value={u.recinto ?? ''} onChange={(e) => set('recinto', txt(e.target.value))} /></Field>
          </div>
        </fieldset>
        <Field label="Superficie total (ha)"><input inputMode="decimal" value={tot} onChange={(e) => setTot(e.target.value)} /></Field>
        <Field label="Superficie aprovechable (ha)" hint={aviso ? undefined : 'Lo realmente disponible para el ganado (sin arbolado, pendientes, zonas húmedas…)'}><input inputMode="decimal" value={apr} onChange={(e) => setApr(e.target.value)} />{aviso && <small className="warn">⚠ Mayor que la superficie total</small>}</Field>
        <Field label="Observaciones" full><textarea rows={2} value={u.obs ?? ''} onChange={(e) => set('obs', txt(e.target.value))} /></Field>
        <div className="full"><FormActions onCancel={onClose} /></div>
      </form>
    </Sheet>
  )
}

// ---------------------------------------------------------------- B. valoración del pasto
export function VisitaForm({ ub, visita, previa, onClose }: { ub: Ubicacion; visita?: Visita; previa?: Visita; onClose: () => void }) {
  // se parte de la valoración anterior para modificar solo lo que ha cambiado
  const [v, setV] = useState<Visita>(visita ?? { ...(previa ?? {}), id: uid(), ubicacionId: ub.id, fecha: today(), obs: undefined })
  const set = <K extends keyof Visita>(k: K, val: Visita[K]) => setV((s) => ({ ...s, [k]: val }))
  const sel = <K extends keyof Visita>(k: K, opts: readonly string[]) => (
    <select value={(v[k] as string | undefined) ?? ''} onChange={(e) => set(k, (e.target.value || undefined) as Visita[K])}><option value="">Sin valorar</option>{opts.map((o) => <option key={o}>{o}</option>)}</select>
  )
  const comp = v.composicion ?? []
  return (
    <Sheet title="Valorar el terreno" sub={`${ub.nombre} · se guarda como una visita nueva`} onClose={onClose} wide>
      <form onSubmit={(e) => { e.preventDefault(); A.saveVisita(v); toast('Valoración guardada'); onClose() }} className="form-grid">
        <Field label="Fecha de la visita"><input type="date" required value={v.fecha} max={today()} onChange={(e) => set('fecha', e.target.value)} /></Field>
        <Field label="Calidad general">{sel('calidad', CALIDADES)}</Field>
        <Field label="Cantidad de hierba">{sel('cantidad', CANTIDADES)}</Field>
        <Field label="Estado del pasto">{sel('estadoPasto', ESTADOS_PASTO)}</Field>
        <Field label="Humedad del terreno">{sel('humedad', HUMEDADES)}</Field>
        <Field label="Presencia de malas hierbas">{sel('malasHierbas', NIVELES)}</Field>
        <Field label="Estado del cierre">{sel('cierre', ['Bueno', 'Necesita revisión'])}</Field>
        <Field label="Agua disponible"><select value={v.agua === undefined ? '' : v.agua ? 'si' : 'no'} onChange={(e) => set('agua', e.target.value === '' ? undefined : e.target.value === 'si')}><option value="">Sin valorar</option><option value="si">Sí</option><option value="no">No</option></select></Field>
        <Field label="Sombra">{sel('sombra', SOMBRAS)}</Field>
        <div className="full"><span className="fld-label">Composición vegetal</span>
          <div className="chips">{COMPOSICIONES.map((c) => <button type="button" key={c} className={comp.includes(c) ? 'on' : ''} onClick={() => set('composicion', comp.includes(c) ? comp.filter((x) => x !== c) : [...comp, c])}>{c}</button>)}</div>
        </div>
        <Field label="Observaciones" full><textarea rows={2} value={v.obs ?? ''} onChange={(e) => set('obs', txt(e.target.value))} /></Field>
        <div className="full"><FormActions onCancel={onClose} /></div>
      </form>
    </Sheet>
  )
}

// ---------------------------------------------------------------- C. trabajos y aprovechamientos
export function LaborForm({ ub, onClose }: { ub: Ubicacion; onClose: () => void }) {
  const [l, setL] = useState<Labor>({ id: uid(), ubicacionId: ub.id, fecha: today(), tipo: 'Siega' })
  const [kg, setKg] = useState('')
  const [unidad, setUnidad] = useState<'kg' | 't'>('kg')
  const set = <K extends keyof Labor>(k: K, v: Labor[K]) => setL((s) => ({ ...s, [k]: v }))
  const produce = ['Siega', 'Heno', 'Silo'].includes(l.tipo)
  return (
    <Sheet title="Añadir trabajo o aprovechamiento" sub={ub.nombre} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); const n = num(kg); A.saveLabor({ ...l, produccionKg: produce && n !== undefined ? (unidad === 't' ? n * 1000 : n) : undefined }); toast('Guardado'); onClose() }} className="form-grid">
        <Field label="Fecha"><input type="date" required value={l.fecha} onChange={(e) => set('fecha', e.target.value)} /></Field>
        <Field label="Tipo"><select value={l.tipo} onChange={(e) => set('tipo', e.target.value as TipoLabor)}>{TIPOS_LABOR.map((t) => <option key={t}>{t}</option>)}</select></Field>
        {produce && <>
          <Field label="Producción de forraje (si se conoce)"><input inputMode="decimal" value={kg} onChange={(e) => setKg(e.target.value)} /></Field>
          <Field label="Unidad"><select value={unidad} onChange={(e) => setUnidad(e.target.value as 'kg' | 't')}><option value="kg">kilos</option><option value="t">toneladas</option></select></Field>
        </>}
        <Field label="Observaciones" full><input value={l.obs ?? ''} onChange={(e) => set('obs', txt(e.target.value))} /></Field>
        <div className="full"><FormActions onCancel={onClose} /></div>
      </form>
    </Sheet>
  )
}

// ---------------------------------------------------------------- llevar animales a esta ubicación
type Modo = 'animales' | 'lote' | 'rebano'

export function LlevarForm({ i, ub, onClose, inicial }: { i: Index; ub: Ubicacion; onClose: () => void; inicial?: string[] }) {
  const [modo, setModo] = useState<Modo>('animales')
  const [sel, setSel] = useState<string[]>(inicial ?? [])
  const [loteId, setLoteId] = useState(i.state.lotes[0]?.id ?? '')
  const [fecha, setFecha] = useState(today())
  const [hora, setHora] = useState('')
  const [obs, setObs] = useState('')
  const [q, setQ] = useState('')
  const activos = useMemo(() => L.activos(i).sort((a, b) => L.etiqueta(i, a).localeCompare(L.etiqueta(i, b), 'es', { numeric: true })), [i])
  const ids = modo === 'rebano' ? activos.map((a) => a.id) : modo === 'lote' ? activos.filter((a) => a.loteId === loteId).map((a) => a.id) : sel
  const animales = ids.map((id) => i.animal.get(id)).filter((a): a is Animal => !!a)
  const aqui = animales.filter((a) => movimientoAbierto(i, a.id)?.ubicacionId === ub.id)
  const otros = animales.filter((a) => { const m = movimientoAbierto(i, a.id); return m && m.ubicacionId !== ub.id })
  const antes = animales.filter((a) => { const m = movimientoAbierto(i, a.id); return m && m.ubicacionId !== ub.id && fecha < m.entrada })
  const lista = activos.filter((a) => !q.trim() || `${L.etiqueta(i, a)} ${a.crotal}`.toLowerCase().includes(q.trim().toLowerCase()))
  const nuevos = animales.length - aqui.length

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!nuevos) return toast(animales.length ? 'Esos animales ya están en esta ubicación' : 'Selecciona al menos un animal')
    if (antes.length) return toast(`La fecha es anterior a la entrada en su ubicación actual (${antes.map((a) => L.etiqueta(i, a)).slice(0, 2).join(', ')}…)`)
    const r = A.llevarAnimales({ ubicacionId: ub.id, animalIds: ids, fecha, hora: txt(hora), obs: txt(obs), loteNombre: modo === 'lote' ? i.lote.get(loteId)?.name : modo === 'rebano' ? 'Todo el rebaño' : undefined })
    toast(`${r.movidos} animal${r.movidos === 1 ? '' : 'es'} en ${ub.nombre}${otros.length ? ' · salida registrada de su ubicación anterior' : ''}`)
    onClose()
  }
  return (
    <Sheet title="Llevar animales a esta ubicación" sub={ub.nombre} onClose={onClose} wide>
      <form onSubmit={submit} className="form-grid">
        <div className="full tabs">
          {([['animales', 'Elegir animales'], ['lote', 'Un lote completo'], ['rebano', 'Todo el rebaño']] as const).map(([k, l]) => <button type="button" key={k} className={modo === k ? 'on' : ''} onClick={() => setModo(k)}>{l}</button>)}
        </div>
        {modo === 'lote' && <Field label="Lote" full><select value={loteId} onChange={(e) => setLoteId(e.target.value)}>{i.state.lotes.map((l) => <option key={l.id} value={l.id}>{l.name} ({activos.filter((a) => a.loteId === l.id).length})</option>)}</select></Field>}
        {modo === 'animales' && (
          <div className="full">
            <div className="toolbar"><label className="search"><input placeholder="Buscar animal…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
              <button type="button" className="btn soft" onClick={() => setSel([...new Set([...sel, ...lista.map((a) => a.id)])])}>Marcar los de la lista</button>
              <button type="button" className="btn ghost" onClick={() => setSel([])}>Quitar todos</button></div>
            <ul className="pick-list">
              {lista.map((a) => { const m = movimientoAbierto(i, a.id); return (
                <li key={a.id}><label className="check"><input type="checkbox" checked={sel.includes(a.id)} onChange={(e) => setSel(e.target.checked ? [...sel, a.id] : sel.filter((x) => x !== a.id))} />
                  <span>{L.etiqueta(i, a)}</span><small className="muted">{m ? `ahora en ${nombreUbicacion(i, m.ubicacionId)}` : 'sin ubicación'}</small></label></li>
              ) })}
            </ul>
          </div>
        )}
        <p className="full notice">{animales.length} animal{animales.length === 1 ? '' : 'es'} seleccionado{animales.length === 1 ? '' : 's'}
          {aqui.length > 0 && <> · <b>{aqui.length}</b> ya están aquí</>}
          {otros.length > 0 && <> · <b>{otros.length}</b> saldrán de su ubicación actual al hacer este movimiento (se conserva su historial)</>}</p>
        <Field label="Fecha de entrada"><input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
        <Field label="Hora (opcional)"><input type="time" value={hora} onChange={(e) => setHora(e.target.value)} /></Field>
        <Field label="Observaciones del movimiento" full><input value={obs} onChange={(e) => setObs(e.target.value)} /></Field>
        <div className="full"><FormActions onCancel={onClose} label="Registrar entrada" /></div>
      </form>
    </Sheet>
  )
}

export function SalidaForm({ i, ub, onClose }: { i: Index; ub: Ubicacion; onClose: () => void }) {
  const pr = presentes(i, ub.id)
  const [sel, setSel] = useState<string[]>(pr.map((x) => x.a.id))
  const [fecha, setFecha] = useState(today())
  const [hora, setHora] = useState('')
  const antes = pr.filter((x) => sel.includes(x.a.id) && fecha < x.mov.entrada)
  return (
    <Sheet title="Registrar salida" sub={`${ub.nombre} · los animales quedan sin ubicación hasta que los lleves a otra`} onClose={onClose}>
      <form className="form-grid" onSubmit={(e) => { e.preventDefault(); if (!sel.length) return toast('Selecciona al menos un animal'); if (antes.length) return toast('La fecha es anterior a la entrada de algún animal'); A.registrarSalida({ ubicacionId: ub.id, animalIds: sel, fecha, hora: txt(hora) }); toast(`Salida registrada (${sel.length})`); onClose() }}>
        <ul className="pick-list full">
          {pr.map(({ a, mov }) => <li key={a.id}><label className="check"><input type="checkbox" checked={sel.includes(a.id)} onChange={(e) => setSel(e.target.checked ? [...sel, a.id] : sel.filter((x) => x !== a.id))} /><span>{L.etiqueta(i, a)}</span><small className="muted">desde {fmtDate(mov.entrada)}</small></label></li>)}
        </ul>
        <Field label="Fecha de salida"><input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
        <Field label="Hora (opcional)"><input type="time" value={hora} onChange={(e) => setHora(e.target.value)} /></Field>
        <div className="full"><FormActions onCancel={onClose} label="Registrar salida" /></div>
      </form>
    </Sheet>
  )
}

/** Desde la ficha de un animal: moverlo a otra ubicación. */
export function MoverAnimalForm({ i, animal, onClose }: { i: Index; animal: Animal; onClose: () => void }) {
  const actual = movimientoAbierto(i, animal.id)
  const [ubId, setUbId] = useState(i.state.ubicaciones.find((u) => u.id !== actual?.ubicacionId)?.id ?? '')
  const [fecha, setFecha] = useState(today())
  const [hora, setHora] = useState('')
  const [obs, setObs] = useState('')
  const ub = i.ubic.get(ubId)
  return (
    <Sheet title="Mover a otra ubicación" sub={`${L.etiqueta(i, animal)}${actual ? ' · ahora en ' + nombreUbicacion(i, actual.ubicacionId) : ''}`} onClose={onClose}>
      <form className="form-grid" onSubmit={(e) => { e.preventDefault(); if (!ub) return toast('Elige la ubicación'); if (actual && fecha < actual.entrada) return toast('La fecha es anterior a su entrada actual'); A.llevarAnimales({ ubicacionId: ub.id, animalIds: [animal.id], fecha, hora: txt(hora), obs: txt(obs) }); toast(`${L.etiqueta(i, animal)} → ${ub.nombre}`); onClose() }}>
        <Field label="Nueva ubicación" full><select value={ubId} onChange={(e) => setUbId(e.target.value)}>{i.state.ubicaciones.filter((u) => u.id !== actual?.ubicacionId).map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}</select></Field>
        <Field label="Fecha"><input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
        <Field label="Hora (opcional)"><input type="time" value={hora} onChange={(e) => setHora(e.target.value)} /></Field>
        <Field label="Observaciones" full><input value={obs} onChange={(e) => setObs(e.target.value)} /></Field>
        <div className="full"><FormActions onCancel={onClose} label="Mover" /></div>
      </form>
    </Sheet>
  )
}

/** Fotografía de la ubicación con fecha, para comparar su evolución. */
export function FotoUbicacionForm({ ub, onClose }: { ub: Ubicacion; onClose: () => void }) {
  const [data, setData] = useState<string>()
  const [fecha, setFecha] = useState(today())
  const [principal, setPrincipal] = useState(!ub.mainPhotoId)
  return (
    <Sheet title="Añadir fotografía del terreno" sub={ub.nombre} onClose={onClose}>
      <form className="form-grid" onSubmit={(e) => { e.preventDefault(); if (!data) return toast('Elige una fotografía'); A.addPhoto(ub.id, principal ? 'principal' : 'adicional', data, principal, fecha); toast('Fotografía añadida'); onClose() }}>
        <div className="full"><PhotoPicker value={data} onChange={setData} label="Elegir o hacer fotografía" /></div>
        <Field label="Fecha de la foto"><input type="date" required value={fecha} max={today()} onChange={(e) => setFecha(e.target.value)} /></Field>
        <label className="check"><input type="checkbox" checked={principal} onChange={(e) => setPrincipal(e.target.checked)} /> Usar como foto principal</label>
        <div className="full"><FormActions onCancel={onClose} /></div>
      </form>
    </Sheet>
  )
}

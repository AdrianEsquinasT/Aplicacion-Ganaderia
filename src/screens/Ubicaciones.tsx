import { useMemo, useState } from 'react'
import { A } from '../actions'
import FichaUbicacion, { FotoUbic, claseEstado } from '../components/FichaUbicacion'
import { UbicacionForm } from '../components/formsUbic'
import * as I from '../components/Icons'
import { Card, Empty, Tabs, Toast, toast } from '../components/ui'
import * as L from '../logic'
import type { Index } from '../logic'
import { verAnimal, verUbicacion } from '../router'
import { ubicacionesIniciales } from '../seed'
import { TIPOS_UBICACION } from '../types'
import { calendario, descanso, diasMov, estadoEfectivo, MESES, nombreUbicacion, presentes } from '../ubicaciones'
import { fmtDate, fmtNum, plural, today, year } from '../util'

type Tab = 'lista' | 'calendario' | 'movimientos'

function Calendario({ i }: { i: Index }) {
  const anios = useMemo(() => {
    const ys = new Set<number>([year(today())])
    for (const m of i.state.movimientos) { ys.add(year(m.entrada)); if (m.salida) ys.add(year(m.salida)) }
    return [...ys].sort((a, b) => b - a)
  }, [i])
  const [anio, setAnio] = useState(anios[0])
  const filas = calendario(i, anio)
  return (
    <>
      <div className="toolbar"><label className="inline">Año <select value={anio} onChange={(e) => setAnio(Number(e.target.value))}>{anios.map((y) => <option key={y}>{y}</option>)}</select></label>
        <small className="muted">Días del mes con ganado en cada pradera. Pasa el ratón por una casilla para ver los lotes.</small></div>
      {filas.every((f) => f.meses.every((m) => m.dias === 0)) ? <Empty>No hay movimientos de ganado en {anio}.</Empty> : (
        <div className="table-wrap"><table className="tbl cal">
          <thead><tr><th>Pradera</th>{MESES.map((m) => <th key={m}>{m}</th>)}<th>Total</th></tr></thead>
          <tbody>
            {filas.map(({ u, meses }) => (
              <tr key={u.id} className="click" onClick={() => verUbicacion(u.id)}>
                <td><b>{u.nombre}</b></td>
                {meses.map((m, k) => <td key={k} className={m.dias ? 'on' : ''} style={m.dias ? { background: `rgba(79,122,58,${0.18 + Math.min(1, m.dias / 31) * 0.6})`, color: m.dias > 18 ? '#fff' : undefined } : undefined} title={m.dias ? `${m.dias} días · ${m.animales} animales${m.lotes.length ? ' · ' + m.lotes.join(', ') : ''}` : undefined}>{m.dias || ''}</td>)}
                <td><b>{meses.reduce((s, m) => s + m.dias, 0)}</b></td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </>
  )
}

export default function Ubicaciones({ i, id }: { i: Index; id?: string }) {
  const [tab, setTab] = useState<Tab>('lista')
  const [tipo, setTipo] = useState('')
  const [nueva, setNueva] = useState(false)
  const ub = id ? i.ubic.get(id) : undefined
  if (id) {
    return ub ? <div className="animals-wrap"><FichaUbicacion key={ub.id} i={i} ub={ub} /><Toast /></div> : <div className="page"><Card><Empty>No se encuentra esta ubicación.</Empty></Card></div>
  }
  const lista = i.state.ubicaciones.filter((u) => !tipo || u.tipo === tipo)
  const faltan = ubicacionesIniciales().filter((u) => !i.ubic.has(u.id)).length
  const movs = [...i.state.movimientos].sort((a, b) => b.entrada.localeCompare(a.entrada) || (b.salida ?? '9').localeCompare(a.salida ?? '9')).slice(0, 60)
  const enPasto = L.activos(i).filter((a) => !i.movAnimal.get(a.id)?.some((m) => !m.salida)).length

  return (
    <div className="page">
      <Card title="Praderas y ubicaciones" icon={<I.Leaf size={20} />} action={
        <span className="inline">
          {faltan > 0 && <button className="btn soft" onClick={() => toast(`${A.cargarUbicaciones(ubicacionesIniciales())} ubicaciones añadidas`)}>Añadir mis ubicaciones iniciales ({faltan})</button>}
          <button className="btn primary" onClick={() => setNueva(true)}><I.Plus size={14} /> Nueva ubicación</button>
        </span>}>
        <Tabs value={tab} onChange={setTab} items={[{ id: 'lista', label: 'Ubicaciones' }, { id: 'calendario', label: 'Calendario de pastoreo' }, { id: 'movimientos', label: 'Movimientos' }]} />

        {tab === 'lista' && (
          <>
            <div className="toolbar"><select value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="">Todos los tipos</option>{TIPOS_UBICACION.map((t) => <option key={t}>{t}</option>)}</select>
              {enPasto > 0 && <small className="muted">{enPasto} animales sin ubicación asignada</small>}</div>
            {lista.length === 0 ? <Empty>Aún no hay ubicaciones. Crea una o añade las iniciales.</Empty> : (
              <div className="ubic-grid">
                {lista.map((u) => {
                  const est = estadoEfectivo(i, u)
                  const d = descanso(i, u)
                  const pr = presentes(i, u.id)
                  const dias = pr.length ? Math.max(...pr.map((x) => diasMov(x.mov))) : undefined
                  return (
                    <button key={u.id} className="ubic-card" onClick={() => verUbicacion(u.id)}>
                      <FotoUbic i={i} ub={u} />
                      <span className="ubic-title"><b>{u.nombre}</b><span className={`pill ${claseEstado(est)}`}>{est}</span></span>
                      <small>{u.tipo}{u.dentroDe ? ` · dentro de ${nombreUbicacion(i, u.dentroDe)}` : ''}</small>
                      <small>{u.superficieTotal !== undefined ? `${fmtNum(u.superficieTotal, 2)} ha` : 'Superficie por indicar'}{u.superficieAprovechable !== undefined ? ` (${fmtNum(u.superficieAprovechable, 2)} aprovechables)` : ''}</small>
                      <small>{pr.length ? `${plural(pr.length, 'animal', 'animales')} · llevan ${dias} días` : d.dias !== undefined ? `Sin animales · descanso: ${d.dias} días` : 'Sin animales'}</small>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
        {tab === 'calendario' && <Calendario i={i} />}
        {tab === 'movimientos' && (movs.length === 0 ? <Empty>Aún no hay movimientos.</Empty> : (
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>Animal</th><th>Ubicación</th><th>Entrada</th><th>Salida</th><th>Días</th><th>Obs.</th></tr></thead>
            <tbody>
              {movs.map((m) => { const a = i.animal.get(m.animalId); return (
                <tr key={m.id}><td>{a ? <button className="link" onClick={() => verAnimal(a.id)}>{L.etiqueta(i, a)}</button> : '—'}</td><td><button className="link" onClick={() => verUbicacion(m.ubicacionId)}>{nombreUbicacion(i, m.ubicacionId)}</button></td>
                  <td>{fmtDate(m.entrada)}</td><td>{m.salida ? fmtDate(m.salida) : <span className="pill ok">aquí</span>}</td><td>{diasMov(m)}</td><td>{m.loteNombre ?? m.obs ?? '—'}</td></tr>
              ) })}
            </tbody>
          </table></div>
        ))}
      </Card>
      {nueva && <UbicacionForm i={i} onClose={() => setNueva(false)} onSaved={verUbicacion} />}
      <Toast />
    </div>
  )
}

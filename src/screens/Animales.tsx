import { useMemo, useState } from 'react'
import { A } from '../actions'
import Ficha from '../components/Ficha'
import { AnimalForm, BajaForm, LoteForm } from '../components/forms'
import * as I from '../components/Icons'
import { Avatar, Empty, SexMark, Toast } from '../components/ui'
import * as L from '../logic'
import type { Index } from '../logic'
import { go, verAnimal } from '../router'
import type { Lote } from '../types'
import { ageLabel, fmtDate, fmtNum } from '../util'

const FILTROS = ['Todos', 'Vacas', 'Toros', 'Novillas', 'Terneros', 'Reposición', 'Venta', 'Baja'] as const
type Filtro = (typeof FILTROS)[number]

export function SubTabs({ actual }: { actual: 'animales' | 'lotes' | 'bajas' }) {
  const t = [['animales', 'Animales'], ['lotes', 'Lotes'], ['bajas', 'Bajas']] as const
  return (
    <div className="tabs">
      {t.map(([k, l]) => <button key={k} className={k === actual ? 'on' : ''} onClick={() => go(k)}>{l}</button>)}
    </div>
  )
}

export default function Animales({ i, id }: { i: Index; id?: string }) {
  const [filtro, setFiltro] = useState<Filtro>('Todos')
  const [q, setQ] = useState('')
  const [nuevo, setNuevo] = useState(false)

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase()
    return i.state.animals
      .filter((a) => {
        const baja = i.baja.has(a.id)
        const cat = L.categoria(i, a)
        if (filtro === 'Baja') return baja
        if (baja) return false
        if (filtro === 'Vacas') return cat === 'Vaca'
        if (filtro === 'Toros') return cat === 'Toro'
        if (filtro === 'Novillas') return cat === 'Novilla'
        if (filtro === 'Terneros') return cat === 'Ternero'
        if (filtro === 'Reposición') return a.destino === 'Reposición'
        if (filtro === 'Venta') return a.destino === 'Venta'
        return true
      })
      .filter((a) => {
        if (!t) return true
        const padre = L.nodoRef(i, a.sire).label.toLowerCase()
        const madre = a.dam ? (i.animal.get(a.dam) ? L.etiqueta(i, i.animal.get(a.dam)!).toLowerCase() : '') : ''
        return [a.crotal, a.name, a.num ?? '', padre, madre].some((x) => x.toLowerCase().includes(t))
      })
      .sort((x, y) => (L.categoria(i, x) === 'Vaca' ? 0 : 1) - (L.categoria(i, y) === 'Vaca' ? 0 : 1) || (x.num ?? x.crotal).localeCompare(y.num ?? y.crotal))
  }, [i, filtro, q])

  const sel = id ? i.animal.get(id) : undefined
  const mostrar = sel ?? (!id ? lista[0] : undefined)

  return (
    <div className="animals-wrap">
      <SubTabs actual="animales" />
      <div className={`animals-layout ${id ? 'has-sel' : 'no-sel'}`}>
        <aside className="card list-pane">
          <div className="head"><h2>Mis animales</h2><button className="btn primary" onClick={() => setNuevo(true)}><I.Plus size={14} /> Nuevo</button></div>
          <label className="search"><I.Search size={16} /><input placeholder="Crotal, nombre, padre o madre…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <div className="chips">{FILTROS.map((f) => <button key={f} className={f === filtro ? 'on' : ''} onClick={() => setFiltro(f)}>{f}</button>)}</div>
          <ul className="animal-list">
            {lista.length === 0 && <Empty>Ningún animal coincide.</Empty>}
            {lista.map((a) => {
              const p = L.pesoActual(i, a)
              const er = L.estadoRepro(i, a)
              const b = i.baja.get(a.id)
              const cat = L.categoria(i, a)
              return (
                <li key={a.id}>
                  <button className={`row ${mostrar?.id === a.id ? 'sel' : ''}`} onClick={() => verAnimal(a.id)}>
                    <Avatar i={i} a={a} size={56} />
                    <span className="info">
                      <b>{L.etiqueta(i, a).toUpperCase()} <SexMark sex={a.sex} /></b>
                      <small>{a.crotal}</small>
                      <small>{a.breed} · {ageLabel(a.birth)} · {fmtNum(p?.kg, 0, 'kg')}</small>
                      <small>{b ? `Baja · ${b.motivo}` : [cat, a.destino, er].filter(Boolean).join(' · ')}</small>
                    </span>
                    <I.Chevron size={16} />
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>
        <div className="detail-pane">
          {mostrar ? <Ficha key={mostrar.id} i={i} animal={mostrar} /> : <div className="card"><Empty>{id ? 'No se encuentra este animal.' : 'Aún no hay animales. Pulsa «Nuevo» para crear el primero.'}</Empty></div>}
        </div>
      </div>
      {nuevo && <AnimalForm i={i} onClose={() => setNuevo(false)} onSaved={verAnimal} />}
      <Toast />
    </div>
  )
}

export function Lotes({ i }: { i: Index }) {
  const [edit, setEdit] = useState<Lote | 'nuevo' | null>(null)
  return (
    <div className="page">
      <SubTabs actual="lotes" />
      <section className="card">
        <div className="head"><h2>Lotes</h2><button className="btn primary" onClick={() => setEdit('nuevo')}><I.Plus size={14} /> Nuevo lote</button></div>
        <p className="muted">Cada animal puede pertenecer a un lote (se asigna en «Editar animal»).</p>
        <ul className="lote-list">
          {i.state.lotes.map((l) => {
            const an = L.activos(i).filter((a) => a.loteId === l.id)
            return (
              <li key={l.id}>
                <div className="lote-head">
                  <span className="lote-name"><b>{l.name}</b><span className="muted">{an.length === 1 ? '1 animal' : `${an.length} animales`}</span></span>
                  <span className="lote-actions">
                    <button className="btn soft" onClick={() => setEdit(l)}>Renombrar</button>
                    <button className="x" aria-label={`Eliminar el lote ${l.name}`} onClick={() => confirm(`¿Eliminar el lote "${l.name}"? Los animales quedarán sin lote.`) && A.deleteLote(l.id)}>×</button>
                  </span>
                </div>
                {an.length > 0 && <div className="lote-animals">{an.map((a) => <button key={a.id} className="chip-link" onClick={() => verAnimal(a.id)}>{L.etiqueta(i, a)}</button>)}</div>}
              </li>
            )
          })}
        </ul>
      </section>
      {edit && <LoteForm lote={edit === 'nuevo' ? undefined : edit} onClose={() => setEdit(null)} />}
      <Toast />
    </div>
  )
}

export function Bajas({ i }: { i: Index }) {
  const [baja, setBaja] = useState(false)
  const lista = [...i.state.bajas].sort((a, b) => b.fecha.localeCompare(a.fecha))
  const total = lista.reduce((s, b) => s + (b.precio ?? 0), 0)
  const activos = L.activos(i)
  const [sel, setSel] = useState('')
  const animal = i.animal.get(sel)
  return (
    <div className="page">
      <SubTabs actual="bajas" />
      <section className="card">
        <div className="head"><h2>Historial de bajas</h2>
          <span className="inline">
            <select value={sel} onChange={(e) => setSel(e.target.value)}><option value="">Dar de baja a…</option>{activos.map((a) => <option key={a.id} value={a.id}>{L.etiqueta(i, a)}</option>)}</select>
            <button className="btn primary" disabled={!sel} onClick={() => setBaja(true)}>Registrar baja</button>
          </span>
        </div>
        <p className="muted">Los animales dados de baja se conservan: siguen apareciendo en la genealogía y en el historial.</p>
        {lista.length === 0 ? <Empty>No hay bajas registradas.</Empty> : (
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>Animal</th><th>Fecha</th><th>Motivo</th><th>Precio</th><th>Comprador</th><th>Observaciones</th><th></th></tr></thead>
            <tbody>
              {lista.map((b) => {
                const a = i.animal.get(b.animalId)
                return (
                  <tr key={b.id}>
                    <td>{a ? <button className="link" onClick={() => verAnimal(a.id)}>{L.etiqueta(i, a)}</button> : '—'}</td>
                    <td>{fmtDate(b.fecha)}</td><td>{b.motivo}</td><td>{b.precio ? `${b.precio.toLocaleString('es-ES')} €` : '—'}</td><td>{b.comprador ?? '—'}</td><td>{b.obs ?? '—'}</td>
                    <td><button className="btn soft" onClick={() => { A.reactivar(b.animalId) }}>Reactivar</button></td>
                  </tr>
                )
              })}
            </tbody>
            {total > 0 && <tfoot><tr><td colSpan={3}>Total ventas registradas</td><td colSpan={4}><b>{total.toLocaleString('es-ES')} €</b></td></tr></tfoot>}
          </table></div>
        )}
      </section>
      {baja && animal && <BajaForm i={i} animal={animal} onClose={() => { setBaja(false); setSel('') }} />}
      <Toast />
    </div>
  )
}

import { useState } from 'react'
import { A } from '../actions'
import { SanidadForm } from '../components/forms'
import * as I from '../components/Icons'
import { Card, Empty, Toast } from '../components/ui'
import * as L from '../logic'
import type { Index } from '../logic'
import { verAnimal } from '../router'
import { avisosTodos } from '../ubicaciones'
import { TIPOS_SANIDAD } from '../types'
import type { Sanidad as S } from '../types'
import { fmtDate } from '../util'

const GRUPOS: { tipo: L.Aviso['tipo']; titulo: string }[] = [
  { tipo: 'vacuna', titulo: 'Vacunas próximas' },
  { tipo: 'desparasitacion', titulo: 'Desparasitaciones próximas' },
  { tipo: 'revision', titulo: 'Revisiones pendientes' },
  { tipo: 'tratamiento', titulo: 'Tratamientos activos / que terminan' },
  { tipo: 'incidencia', titulo: 'Incidencias recientes' },
  { tipo: 'pradera', titulo: 'Praderas y ubicaciones' },
]

export default function Sanidad({ i }: { i: Index }) {
  const [form, setForm] = useState<S | 'nuevo' | null>(null)
  const [tipo, setTipo] = useState('')
  const [q, setQ] = useState('')
  const av = avisosTodos(i)
  const lista = [...i.state.sanidad]
    .filter((x) => (!tipo || x.tipo === tipo) && (!q.trim() || (i.animal.get(x.animalId) ? L.etiqueta(i, i.animal.get(x.animalId)!) : '').toLowerCase().includes(q.trim().toLowerCase()) || (x.producto ?? '').toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
  return (
    <div className="page">
      <Card title="Avisos sanitarios" icon={<I.Bell size={20} />} action={<button className="btn primary" onClick={() => setForm('nuevo')}><I.Plus size={14} /> Añadir actuación</button>}>
        <div className="aviso-groups">
          {GRUPOS.map((g) => {
            const l = av.filter((a) => a.tipo === g.tipo)
            return (
              <div key={g.tipo} className="aviso-group">
                <h4>{g.titulo} <span className="badge soft">{l.length}</span></h4>
                {l.length === 0 ? <small className="muted">Nada pendiente</small> : <ul>{l.map((a, k) => <li key={k}><button className="link" onClick={() => a.animalId && verAnimal(a.animalId)}>{a.texto}</button>{a.fecha && <small> · {fmtDate(a.fecha)}</small>}</li>)}</ul>}
              </div>
            )
          })}
        </div>
      </Card>
      <Card title="Registro sanitario" icon={<I.Cross size={20} />}>
        <div className="toolbar">
          <label className="search"><I.Search size={16} /><input placeholder="Buscar por animal o producto…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}><option value="">Todos los tipos</option>{TIPOS_SANIDAD.map((t) => <option key={t}>{t}</option>)}</select>
        </div>
        {lista.length === 0 ? <Empty>No hay actuaciones registradas.</Empty> : (
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>Fecha</th><th>Animal</th><th>Tipo</th><th>Producto / dosis</th><th>Duración</th><th>Veterinario</th><th>Próxima</th><th>Observaciones</th><th></th></tr></thead>
            <tbody>
              {lista.map((x) => {
                const a = i.animal.get(x.animalId)
                return (
                  <tr key={x.id}>
                    <td>{fmtDate(x.fecha)}</td><td>{a ? <button className="link" onClick={() => verAnimal(a.id)}>{L.etiqueta(i, a)}</button> : '—'}</td>
                    <td>{x.tipo}{L.tratamientoActivo(x) && <span className="pill">En curso</span>}</td><td>{[x.producto, x.dosis].filter(Boolean).join(' · ') || '—'}</td>
                    <td>{x.duracionDias ? `${x.duracionDias} días` : '—'}</td><td>{x.veterinario ?? '—'}</td><td>{fmtDate(x.proxima)}</td><td>{x.obs ?? '—'}</td>
                    <td className="nowrap"><button className="btn soft" onClick={() => setForm(x)}>Editar</button> <button className="x" aria-label="Eliminar" onClick={() => confirm('¿Eliminar esta actuación?') && A.deleteSanidad(x.id)}>×</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        )}
      </Card>
      {form && <SanidadForm i={i} item={form === 'nuevo' ? undefined : form} onClose={() => setForm(null)} />}
      <Toast />
    </div>
  )
}

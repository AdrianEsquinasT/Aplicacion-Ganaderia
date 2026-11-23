import { useMemo, useState } from 'react'
import { PesoForm } from '../components/forms'
import { BarChart, LineChart, seriesColor } from '../components/charts'
import * as I from '../components/Icons'
import { Card, Empty, Kpi, Tabs, Toast } from '../components/ui'
import * as L from '../logic'
import type { Index } from '../logic'
import { verAnimal } from '../router'
import { ageLabel, fmtDate, fmtNum, monthsBetween, today, year } from '../util'

type Tab = 'indicadores' | 'pesajes'
const sel = (v: string, set: (s: string) => void, opts: [string, string][], vacio: string) => (
  <select value={v} onChange={(e) => set(e.target.value)}><option value="">{vacio}</option>{opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
)
const mes = (x: number) => `${Math.round(x)} m`

export default function Produccion({ i }: { i: Index }) {
  const [tab, setTab] = useState<Tab>('indicadores')
  const [f, setF] = useState({ year: '', vaca: '', toro: '', sex: '', lote: '', raza: '' })
  const [pesoDe, setPesoDe] = useState<string | null>(null)
  const [cmp, setCmp] = useState<string[]>(() => i.state.animals.filter((a) => (i.pesajes.get(a.id)?.length ?? 0) >= 4).slice(0, 3).map((a) => a.id))
  const filtro: L.FiltroProd = { year: f.year ? Number(f.year) : undefined, vacaId: f.vaca || undefined, toroRef: f.toro || undefined, sex: (f.sex || undefined) as 'F' | 'M' | undefined, loteId: f.lote || undefined, raza: f.raza || undefined }
  const s = L.statsProduccion(i, filtro)
  const anios = useMemo(() => [...new Set(i.state.animals.filter((a) => i.partoDeCria.has(a.id)).map((a) => year(a.birth)))].sort((a, b) => a - b), [i])
  const serie = anios.map((y) => ({ y, s: L.statsProduccion(i, { ...filtro, year: y }) }))
  const vacas = i.state.animals.filter((a) => a.sex === 'F' && (i.hijos.get(a.id)?.length ?? 0) > 0)
  const padres = [...i.state.sementales.map((x) => [x.id, `Semental ${x.name}`] as [string, string]), ...i.state.animals.filter((a) => a.sex === 'M' && (i.hijos.get(a.id)?.length ?? 0) > 0).map((a) => [a.id, L.etiqueta(i, a)] as [string, string])]
  const porPadre = L.mediaPor(i, 'padre', filtro)
  const porMadre = L.mediaPor(i, 'madre', filtro)
  const recientes = [...i.state.pesajes].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 25)
  const conPeso = i.state.animals.filter((a) => (i.pesajes.get(a.id)?.length ?? 0) >= 2)
  const animal = pesoDe ? i.animal.get(pesoDe) : undefined
  const [nuevoPeso, setNuevoPeso] = useState('')
  const activos = L.activos(i)

  return (
    <div className="page">
      <Card title="Pesajes y producción" icon={<I.Scale size={20} />} action={<span className="inline"><select value={nuevoPeso} onChange={(e) => setNuevoPeso(e.target.value)}><option value="">Animal…</option>{activos.map((a) => <option key={a.id} value={a.id}>{L.etiqueta(i, a)}</option>)}</select><button className="btn primary" disabled={!nuevoPeso} onClick={() => setPesoDe(nuevoPeso)}><I.Plus size={14} /> Añadir peso</button></span>}>
        <Tabs value={tab} onChange={setTab} items={[{ id: 'indicadores', label: 'Indicadores' }, { id: 'pesajes', label: 'Pesajes' }]} />
        {tab === 'indicadores' && (
          <>
            <div className="toolbar filters">
              {sel(f.year, (v) => setF({ ...f, year: v }), anios.map((y) => [String(y), String(y)]), 'Año')}
              {sel(f.vaca, (v) => setF({ ...f, vaca: v }), vacas.map((a) => [a.id, L.etiqueta(i, a)]), 'Vaca')}
              {sel(f.toro, (v) => setF({ ...f, toro: v }), padres, 'Toro / semental')}
              {sel(f.sex, (v) => setF({ ...f, sex: v }), [['M', 'Machos'], ['F', 'Hembras']], 'Sexo')}
              {sel(f.lote, (v) => setF({ ...f, lote: v }), i.state.lotes.map((l) => [l.id, l.name]), 'Lote')}
              {sel(f.raza, (v) => setF({ ...f, raza: v }), i.state.config.breeds.map((b) => [b, b]), 'Raza')}
              <button className="btn ghost" onClick={() => setF({ year: '', vaca: '', toro: '', sex: '', lote: '', raza: '' })}>Limpiar</button>
            </div>
            <div className="kpis">
              <Kpi label="Terneros incluidos" value={s.n} />
              <Kpi label="Peso medio al nacimiento" value={fmtNum(s.nacimiento, 1, 'kg')} />
              <Kpi label="Peso medio al destete" value={fmtNum(s.destete, 0, 'kg')} />
              <Kpi label="Ganancia media diaria" value={fmtNum(s.gmd, 0, 'g/día')} sub="nacimiento → destete" />
              <Kpi label="Kg de ternero / vaca / año" value={fmtNum(L.kgTerneroPorVaca(i, filtro.year ?? year(today()) - 1), 0, 'kg')} sub={`año ${filtro.year ?? year(today()) - 1}`} />
              <Kpi label="Destete machos / hembras" value={`${fmtNum(s.destetePorSexo.M, 0)} / ${fmtNum(s.destetePorSexo.F, 0)} kg`} />
            </div>
            <div className="cols2">
              <div><h4>Peso al destete por año de nacimiento (kg)</h4><BarChart data={serie.map((x) => ({ label: String(x.y), value: x.s.destete }))} unit="kg" /></div>
              <div><h4>Peso al nacimiento por año (kg)</h4><BarChart data={serie.map((x) => ({ label: String(x.y), value: x.s.nacimiento }))} unit="kg" color="#b8812f" dec={1} /></div>
            </div>
            <div className="cols2">
              <div><h4>Peso medio por padre</h4>{porPadre.length === 0 ? <Empty>Sin datos</Empty> : <div className="table-wrap"><table className="tbl"><thead><tr><th>Padre</th><th>Hijos</th><th>Nac.</th><th>Destete</th></tr></thead><tbody>{porPadre.map((x) => <tr key={x.id}><td>{x.nombre}</td><td>{x.n}</td><td>{fmtNum(x.nacimiento, 1)}</td><td>{fmtNum(x.destete, 0)}</td></tr>)}</tbody></table></div>}</div>
              <div><h4>Peso medio por madre</h4>{porMadre.length === 0 ? <Empty>Sin datos</Empty> : <div className="table-wrap"><table className="tbl"><thead><tr><th>Madre</th><th>Hijos</th><th>Nac.</th><th>Destete</th></tr></thead><tbody>{porMadre.map((x) => <tr key={x.id} className="click" onClick={() => verAnimal(x.id)}><td>{x.nombre}</td><td>{x.n}</td><td>{fmtNum(x.nacimiento, 1)}</td><td>{fmtNum(x.destete, 0)}</td></tr>)}</tbody></table></div>}</div>
            </div>
          </>
        )}
        {tab === 'pesajes' && (
          <>
            <h4>Comparación entre animales (peso según la edad)</h4>
            <div className="toolbar">
              <select value="" onChange={(e) => e.target.value && setCmp([...new Set([...cmp, e.target.value])].slice(0, 5))}><option value="">+ Añadir animal a la comparación</option>{conPeso.map((a) => <option key={a.id} value={a.id}>{L.etiqueta(i, a)}</option>)}</select>
              {cmp.map((id, k) => { const a = i.animal.get(id); return a ? <span key={id} className="chip-x" style={{ borderColor: seriesColor(k) }}>{L.etiqueta(i, a)} <button onClick={() => setCmp(cmp.filter((x) => x !== id))} aria-label="Quitar">×</button></span> : null })}
            </div>
            <LineChart
              series={cmp.map((id, k) => { const a = i.animal.get(id)!; return { name: L.etiqueta(i, a), color: seriesColor(k), points: (i.pesajes.get(id) ?? []).map((p) => ({ x: monthsBetween(a.birth, p.fecha), y: p.kg })) } })}
              xFormat={mes} yUnit="kg" height={220} empty="Elige uno o más animales con al menos un pesaje." />
            <h4>Últimos pesajes</h4>
            <div className="table-wrap"><table className="tbl"><thead><tr><th>Fecha</th><th>Animal</th><th>Peso</th><th>Edad</th><th>Tipo</th><th>Observaciones</th></tr></thead><tbody>
              {recientes.map((p) => { const a = i.animal.get(p.animalId); return a ? <tr key={p.id} className="click" onClick={() => verAnimal(a.id)}><td>{fmtDate(p.fecha)}</td><td>{L.etiqueta(i, a)}</td><td>{p.kg} kg</td><td>{ageLabel(a.birth, p.fecha)}</td><td>{p.tipo}</td><td>{p.obs ?? '—'}</td></tr> : null })}
            </tbody></table></div>
          </>
        )}
      </Card>
      {animal && <PesoForm i={i} animal={animal} onClose={() => { setPesoDe(null); setNuevoPeso('') }} />}
      <Toast />
    </div>
  )
}

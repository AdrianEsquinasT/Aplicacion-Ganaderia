import { useState } from 'react'
import { DescTable } from '../components/Ficha'
import Pedigree from '../components/Pedigree'
import { Card, Empty, SexMark } from '../components/ui'
import * as I from '../components/Icons'
import * as L from '../logic'
import type { Index } from '../logic'
import { go, verAnimal } from '../router'
import { fmtNum } from '../util'

export default function Genealogia({ i, id }: { i: Index; id?: string }) {
  const [gens, setGens] = useState(3)
  const [q, setQ] = useState('')
  const todos = [...i.state.animals].sort((a, b) => L.etiqueta(i, a).localeCompare(L.etiqueta(i, b), 'es', { numeric: true }))
  const sem = id ? i.semental.get(id) : undefined
  const animal = id ? i.animal.get(id) : undefined
  const sel = animal ?? (sem ? undefined : todos.find((a) => L.categoria(i, a) === 'Vaca') ?? todos[0])
  const root = sem ? L.nodoRef(i, { kind: 'semental', id: sem.id }) : sel ? L.nodoAnimal(i, sel) : undefined
  const hijos = sem ? L.hijosDe(i, sem.id) : sel ? L.hijosDe(i, sel.id) : []
  const coincidencias = q.trim() ? todos.filter((a) => `${a.name} ${a.crotal} ${a.num ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())) : todos

  return (
    <div className="page">
      <Card title="Genealogía" icon={<I.Tree size={20} />}>
        <div className="toolbar">
          <label className="search"><I.Search size={16} /><input placeholder="Buscar animal…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <select value={sem ? `s:${sem.id}` : sel?.id ?? ''} onChange={(e) => go('genealogia', e.target.value.replace(/^s:/, ''))}>
            <optgroup label="Animales">{coincidencias.map((a) => <option key={a.id} value={a.id}>{L.etiqueta(i, a)}{i.baja.has(a.id) ? ' (baja)' : ''}</option>)}</optgroup>
            <optgroup label="Sementales del catálogo">{i.state.sementales.map((s) => <option key={s.id} value={`s:${s.id}`}>{s.name}</option>)}</optgroup>
          </select>
          <label className="inline">Generaciones <select value={gens} onChange={(e) => setGens(Number(e.target.value))}><option value={2}>2 (padres)</option><option value={3}>3 (abuelos)</option><option value={4}>4 (bisabuelos)</option></select></label>
        </div>
        {root ? <Pedigree i={i} root={root} generations={gens} /> : <Empty>No hay animales todavía.</Empty>}
        <p className="muted small">El árbol se construye con el padre y la madre registrados en cada animal. Si algún progenitor no está registrado aparece como «Información no registrada». Los animales dados de baja se mantienen.</p>
      </Card>

      <Card title="Descendencia" icon={<I.Cow size={20} />} action={sel && <button className="btn soft" onClick={() => verAnimal(sel.id)}>Abrir ficha <I.Chevron size={14} /></button>}>
        {root && hijos.length > 0 && (() => {
          const d = L.resumenDescendencia(i, (sem?.id ?? sel?.id) as string)
          return <div className="chips-stats"><span><b>{d.total}</b> hijos</span><span><b>{d.machos}</b> machos <SexMark sex="M" /></span><span><b>{d.hembras}</b> hembras <SexMark sex="F" /></span><span><b>{d.vivos}</b> vivos</span><span><b>{d.reposicion}</b> reposición</span><span><b>{d.vendidos}</b> vendidos</span><span><b>{d.bajas}</b> de baja</span><span>Peso nac. medio <b>{fmtNum(d.pesoNac, 1, 'kg')}</b></span><span>Destete medio <b>{fmtNum(d.pesoDestete, 0, 'kg')}</b></span></div>
        })()}
        <DescTable i={i} hijos={hijos} conPadres />
      </Card>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { AnimalForm, CicloForm, PartoForm, PesoForm, SanidadForm } from '../components/forms'
import { FotoSheet } from '../components/Ficha'
import { LineChart } from '../components/charts'
import Donut from '../components/Donut'
import * as I from '../components/Icons'
import Pedigree from '../components/Pedigree'
import { Avatar, Empty, SexMark, Toast } from '../components/ui'
import * as L from '../logic'
import type { Index } from '../logic'
import { go, verAnimal } from '../router'
import type { Animal, Category } from '../types'
import { ageLabel, fmtDate, fmtNum } from '../util'

type Modal = null | 'peso' | 'ciclo' | 'parto' | 'sanidad' | 'foto' | 'edit' | 'nuevo'
const FILTROS: { label: string; cat?: Category }[] = [{ label: 'Todas' }, { label: 'Vacas', cat: 'Vaca' }, { label: 'Toros', cat: 'Toro' }, { label: 'Novillas', cat: 'Novilla' }, { label: 'Terneros', cat: 'Ternero' }]
const AVISO_ICON: Record<L.Aviso['tipo'], (p: { size?: number }) => JSX.Element> = { parto: I.Calendar, vacuna: I.Syringe, desparasitacion: I.Drops, revision: I.Calendar, 'sin-gestar': I.Heart, incidencia: I.Bell, decision: I.Tag, tratamiento: I.Cross }
const dmy = (x: number) => { const d = new Date(x); return `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCFullYear()).slice(2)}` }

/** Cifras de la explotación que van dentro de la cabecera. */
export function HeroStats({ i }: { i: Index }) {
  const rs = L.resumenRebano(i)
  const st = L.statsRepro(i)
  const item = (n: number, l: string) => <div><I.Cow size={30} /><b>{n}</b><span>{l}</span></div>
  return (
    <div className="stats">
      {item(rs.vacas, 'Vacas')}
      {item(rs.toros, 'Toros')}
      {item(rs.novillas, 'Novillas')}
      {item(rs.terneros, 'Terneros')}
      <div className="hl" title="Cubriciones con resultado conocido que terminaron en parto"><I.Scale size={28} /><b>{fmtNum(st.tasaPartos, 0, '%')}</b><span>Tasa de partos</span></div>
    </div>
  )
}

export default function Inicio({ i }: { i: Index }) {
  const [filtro, setFiltro] = useState(0)
  const [q, setQ] = useState('')
  const [selId, setSelId] = useState<string>()
  const [modal, setModal] = useState<Modal>(null)
  const act = L.activos(i)

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase()
    const cat = FILTROS[filtro].cat
    return act
      .filter((a) => (!cat || L.categoria(i, a) === cat) && (!t || `${a.name} ${a.crotal} ${a.num ?? ''}`.toLowerCase().includes(t)))
      .sort((x, y) => (L.categoria(i, x) === 'Vaca' ? 0 : 1) - (L.categoria(i, y) === 'Vaca' ? 0 : 1) || (x.num ?? x.crotal).localeCompare(y.num ?? y.crotal))
  }, [i, act, filtro, q])

  const a: Animal | undefined = (selId ? i.animal.get(selId) : undefined) ?? act.find((x) => L.categoria(i, x) === 'Vaca' && L.estadoRepro(i, x) === 'Gestante') ?? act[0]
  const av = L.avisos(i)

  if (!a) {
    return (
      <div className="page"><section className="card"><Empty>Aún no hay animales. Crea el primero para ver aquí el resumen de tu ganadería.</Empty><button className="btn primary" onClick={() => setModal('nuevo')}><I.Plus size={14} /> Nuevo animal</button></section>
        {modal === 'nuevo' && <AnimalForm i={i} onClose={() => setModal(null)} onSaved={verAnimal} />}<Toast /></div>
    )
  }

  const cat = L.categoria(i, a)
  const comp = L.composicion(i, a)
  const estado = L.estadoRepro(i, a)
  const global = L.indicesInternos(i, a).find((x) => x.clave === 'global')?.valor
  const peso = L.pesoActual(i, a)
  const pesos = i.pesajes.get(a.id) ?? []
  const ciclos = i.ciclos.get(a.id) ?? []
  const ciclo = ciclos[ciclos.length - 1]
  const ultIA = [...ciclos].reverse().find((c) => c.ia || c.monta)
  const sem = ultIA?.ia?.sementalId ? i.semental.get(ultIA.ia.sementalId)?.name : ultIA?.monta?.toroId && i.animal.get(ultIA.monta.toroId) ? L.etiqueta(i, i.animal.get(ultIA.monta.toroId)!) : undefined
  const esVaca = a.sex === 'F' && (cat === 'Vaca' || cat === 'Novilla')
  const hijos = L.hijosDe(i, a.id)
  const san = (i.sanidad.get(a.id) ?? []).slice(0, 4)
  const lote = a.loteId ? i.lote.get(a.loteId)?.name : undefined
  const hoy = new Date().toISOString().slice(0, 10)
  const pasos = ciclo
    ? [
        { l: 'CIDR', f: ciclo.cidr?.fecha }, { l: 'Retirada', f: ciclo.retirada?.fecha }, { l: 'PG', f: ciclo.pg?.fecha },
        { l: ciclo.metodo === 'Monta natural' ? 'Monta' : 'IA', f: ciclo.ia?.fecha ?? ciclo.monta?.entrada }, { l: 'Diag.', f: ciclo.diag?.fecha },
      ]
    : []

  const acciones: { t: string; ic: (p: { size?: number }) => JSX.Element; fn: () => void; solo?: boolean }[] = [
    { t: 'Añadir peso', ic: I.Scale, fn: () => setModal('peso') },
    { t: 'Registrar parto', ic: I.Cow, fn: () => setModal('parto'), solo: esVaca },
    { t: 'Nueva estrategia reproductiva', ic: I.Calendar, fn: () => setModal('ciclo'), solo: esVaca },
    { t: 'Añadir actuación sanitaria', ic: I.Cross, fn: () => setModal('sanidad') },
    { t: 'Añadir fotografía', ic: I.Camera, fn: () => setModal('foto') },
    { t: 'Ver genealogía', ic: I.Tree, fn: () => go('genealogia', a.id) },
  ].filter((x) => x.solo !== false)

  return (
    <div className="dash">
      <section className="card d-list">
        <div className="head"><h2>Mis animales</h2><button className="btn soft" onClick={() => setModal('nuevo')} aria-label="Nuevo animal"><I.Plus size={14} /></button></div>
        <label className="search"><I.Search size={16} /><input placeholder="Buscar por crotal o nombre…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <div className="chips">{FILTROS.map((f, k) => <button key={f.label} className={k === filtro ? 'on' : ''} onClick={() => setFiltro(k)}>{f.label}</button>)}</div>
        <ul className="animal-list">
          {lista.length === 0 && <Empty>Sin resultados.</Empty>}
          {lista.slice(0, 5).map((x) => {
            const p = L.pesoActual(i, x)
            return (
              <li key={x.id}>
                <button className={`row ${x.id === a.id ? 'sel' : ''}`} onClick={() => setSelId(x.id)}>
                  <Avatar i={i} a={x} size={50} />
                  <span className="info"><b>{L.etiqueta(i, x)} <SexMark sex={x.sex} /></b><small>{x.crotal}</small><small>{fmtNum(p?.kg, 0, 'kg')} · {L.estadoRepro(i, x) ?? L.categoria(i, x)}</small></span>
                  <I.Chevron size={16} />
                </button>
              </li>
            )
          })}
        </ul>
        <button className="btn soft wide" onClick={() => go('animales')}>Ver los {lista.length} animales <I.Chevron size={14} /></button>
      </section>

      <div className="dash-main">
      <div className="dash-row r1">
      <section className="card d-feat">
        <div className="photo"><Avatar i={i} a={a} size={230} /><button className="cam" aria-label="Añadir fotografía" onClick={() => setModal('foto')}><I.Camera size={18} /></button></div>
        <div className="facts">
          <div className="title">
            <h2>{L.etiqueta(i, a)} <SexMark sex={a.sex} /></h2>
            <div className="score"><I.Star size={22} /><b>{global ? `${global.toFixed(1).replace('.', ',')} / 10` : '—'}</b><small>Índices internos</small></div>
          </div>
          <div className="tags"><span className="tag">{cat === 'Vaca' ? 'Reproductora' : cat}</span>{estado && <span className="tag light">{estado}</span>}{a.destino && <span className="tag light">{a.destino}</span>}</div>
          <dl className="info-list">
            <div><I.Tag size={18} /><dt>Crotal:</dt><dd>{a.crotal}</dd></div>
            <div><I.Calendar size={18} /><dt>Nacimiento:</dt><dd>{fmtDate(a.birth)} ({ageLabel(a.birth)})</dd></div>
            <div><I.Scale size={18} /><dt>Peso actual:</dt><dd>{peso ? `${peso.kg} kg` : '—'}</dd></div>
            <div><I.Pulse size={18} /><dt>Condición corporal:</dt><dd>{a.condition ? `${a.condition}/5` : '—'}</dd></div>
            <div><I.Pin size={18} /><dt>Lote:</dt><dd>{lote ?? '—'}</dd></div>
          </dl>
        </div>
        <div className="breed">
          <h4>Composición racial</h4>
          <Donut breed={comp.shares} />
          <button className="btn soft" onClick={() => setModal('edit')}><I.Edit size={14} /> Editar animal</button>
          <button className="btn ghost" onClick={() => verAnimal(a.id)}>Ficha completa</button>
        </div>
      </section>

      <section className="card d-quick">
        <h2>Acciones rápidas</h2>
        {acciones.map((x) => <button key={x.t} onClick={x.fn}><span className="ico"><x.ic size={18} /></span>{x.t}</button>)}
      </section>

      </div>
      <div className="dash-row r2">
      <section className="card d-repro">
        <h3><I.Heart size={22} /> Reproducción {estado && <span className={`pill ${estado === 'Gestante' ? 'ok' : ''}`}>{estado}</span>}</h3>
        {esVaca ? (
          <ul className="kv-icons">
            <li><I.Calendar size={16} /> Última inseminación: <b>{fmtDate(ultIA?.ia?.fecha ?? ultIA?.monta?.entrada)}</b></li>
            <li><I.Cow size={16} /> Semental: <b>{sem ?? '—'}</b></li>
            <li><I.Calendar size={16} /> Diagnóstico: <b>{fmtDate(ciclo?.diag?.fecha)}</b></li>
            <li><I.Calendar size={16} /> Próximo parto: <b>{fmtDate(L.proximoParto(i, a))}</b></li>
          </ul>
        ) : <p className="muted">{a.sex === 'M' ? `${hijos.length} hijos registrados.` : 'Sin datos reproductivos.'}</p>}
        <button className="btn soft" onClick={() => verAnimal(a.id)}>Ver detalles <I.Chevron size={14} /></button>
      </section>

      <section className="card d-estr">
        <h3><I.Syringe size={22} /> Estrategia reproductiva{ciclo ? ` (${ciclo.label})` : ''}</h3>
        {ciclo ? (
          <ol className="steps">
            {pasos.map((p) => {
              const hecho = !!p.f && p.f <= hoy
              return <li key={p.l}><span className={hecho ? 'done' : ''}>{hecho ? <I.Check size={18} /> : <I.Calendar size={18} />}</span><b>{p.l}</b><small>{p.f ? fmtDate(p.f).slice(0, 5) : '—'}</small></li>
            })}
          </ol>
        ) : <p className="muted">{esVaca ? 'Sin estrategia registrada.' : 'No aplica.'}</p>}
        {esVaca && <button className="btn soft" onClick={() => setModal('ciclo')}><I.Plus size={14} /> Nueva estrategia</button>}
      </section>

      <section className="card d-peso">
        <div className="head"><h3><I.Scale size={22} /> Peso</h3><button className="btn soft" onClick={() => setModal('peso')}><I.Plus size={14} /> Añadir peso</button></div>
        <p className="big">{peso ? `${peso.kg} kg` : '—'}</p>
        {peso && <p className="muted">Último pesaje: {fmtDate(peso.fecha)}</p>}
        <LineChart width={300} height={130} series={[{ name: 'Peso', color: '#4f7a3a', points: pesos.map((p) => ({ x: Date.parse(p.fecha), y: p.kg })) }]} xFormat={dmy} yUnit="kg" empty="Aún no hay pesajes." />
      </section>

      </div>
      <div className="dash-row r3">
      <section className="card d-gen">
        <div className="head"><h3><I.Tree size={22} /> Genealogía</h3><button className="btn soft" onClick={() => go('genealogia', a.id)}>Ver árbol completo <I.Chevron size={14} /></button></div>
        <Pedigree i={i} root={L.nodoAnimal(i, a)} generations={3} compact />
      </section>

      <section className="card d-desc">
        <div className="head"><h3><I.Cow size={22} /> Descendencia</h3><button className="btn soft" onClick={() => verAnimal(a.id)}>Ver todos <I.Chevron size={14} /></button></div>
        {hijos.length === 0 ? <Empty>Sin descendencia registrada.</Empty> : (
          <div className="calves">
            {[...hijos].reverse().slice(0, 3).map((c) => (
              <button key={c.id} className="calf" onClick={() => verAnimal(c.id)}>
                <Avatar i={i} a={c} size={84} />
                <b>{L.etiqueta(i, c)}</b><small>({c.sex === 'M' ? 'Macho' : 'Hembra'})</small><small>{fmtDate(c.birth)}</small>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="card d-san">
        <div className="head"><h3><I.Cross size={22} /> Sanidad</h3><button className="btn soft" onClick={() => setModal('sanidad')}><I.Plus size={14} /> Añadir</button></div>
        {san.length === 0 ? <Empty>Sin registros.</Empty> : <ul className="log">{san.map((s) => <li key={s.id}><span>{fmtDate(s.fecha)}</span><div>{s.tipo}{s.producto ? ` · ${s.producto}` : s.obs ? ` – ${s.obs}` : ''}</div></li>)}</ul>}
      </section>

      </div>
      <div className="dash-row r4">
      <section className="card d-avisos">
        <div className="head"><h3><I.Bell size={22} /> Avisos</h3>{av.length > 0 && <span className="badge">{av.length}</span>}</div>
        {av.length === 0 ? <small className="muted">Todo al día.</small> : (
          <ul className="avisos">
            {av.slice(0, 5).map((x, k) => { const Ico = AVISO_ICON[x.tipo]; return <li key={k} className={x.urgente ? 'urg' : ''}><Ico size={18} /><button className="link" onClick={() => x.animalId && setSelId(x.animalId)}>{x.texto}</button></li> })}
          </ul>
        )}
        <button className="btn wide gold" onClick={() => go('sanidad')}>Ver todos los avisos <I.Chevron size={14} /></button>
      </section>

      </div>
      </div>

      {modal === 'peso' && <PesoForm i={i} animal={a} onClose={() => setModal(null)} />}
      {modal === 'ciclo' && <CicloForm i={i} vaca={a} onClose={() => setModal(null)} />}
      {modal === 'parto' && <PartoForm i={i} vacaId={a.id} onClose={() => setModal(null)} onSaved={verAnimal} />}
      {modal === 'sanidad' && <SanidadForm i={i} animalId={a.id} onClose={() => setModal(null)} />}
      {modal === 'foto' && <FotoSheet i={i} animal={a} onClose={() => setModal(null)} />}
      {modal === 'edit' && <AnimalForm i={i} animal={a} onClose={() => setModal(null)} />}
      {modal === 'nuevo' && <AnimalForm i={i} onClose={() => setModal(null)} onSaved={verAnimal} />}
      <Toast />
    </div>
  )
}

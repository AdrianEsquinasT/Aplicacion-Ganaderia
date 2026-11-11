import { useMemo, useState } from 'react'
import { CicloForm, PartoForm } from '../components/forms'
import * as I from '../components/Icons'
import { Card, Empty, Sheet, Tabs, Toast } from '../components/ui'
import * as L from '../logic'
import type { Index } from '../logic'
import { verAnimal } from '../router'
import { daysBetween, fmtDate, fmtNum, today, year } from '../util'

type Tab = 'estado' | 'cubriciones' | 'partos'

function ElegirVaca({ i, onPick, onClose }: { i: Index; onPick: (id: string) => void; onClose: () => void }) {
  const vacas = i.state.animals.filter((a) => a.sex === 'F' && !i.baja.has(a.id) && ['Vaca', 'Novilla'].includes(L.categoria(i, a)))
  const [v, setV] = useState(vacas[0]?.id ?? '')
  return (
    <Sheet title="Nueva estrategia reproductiva" sub="¿Para qué vaca?" onClose={onClose}>
      <div className="form-grid">
        <label className="fld full"><span>Vaca</span><select value={v} onChange={(e) => setV(e.target.value)}>{vacas.map((a) => <option key={a.id} value={a.id}>{L.etiqueta(i, a)}</option>)}</select></label>
        <div className="full form-actions"><span className="grow" /><button className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn primary" disabled={!v} onClick={() => onPick(v)}>Continuar</button></div>
      </div>
    </Sheet>
  )
}

export default function Reproduccion({ i }: { i: Index }) {
  const [tab, setTab] = useState<Tab>('estado')
  const [anio, setAnio] = useState('')
  const [parto, setParto] = useState(false)
  const [elegir, setElegir] = useState(false)
  const [nueva, setNueva] = useState<string>()
  const cfg = i.state.config
  const hembras = useMemo(() => i.state.animals.filter((a) => !i.baja.has(a.id) && ['Vaca', 'Novilla'].includes(L.categoria(i, a)) && a.sex === 'F'), [i])
  const st = L.statsRepro(i)
  const ciclos = [...i.state.ciclos].sort((a, b) => L.cicloStart(b).localeCompare(L.cicloStart(a))).filter((c) => !anio || year(L.cicloStart(c)) === Number(anio))
  const partos = [...i.state.partos].map((p) => ({ p, c: i.animal.get(p.calfId)! })).filter((x) => x.c).sort((a, b) => b.c.birth.localeCompare(a.c.birth))
  const anios = [...new Set(i.state.ciclos.map((c) => year(L.cicloStart(c))))].sort((a, b) => b - a)
  const nombre = (id?: string) => (id && i.animal.get(id) ? L.etiqueta(i, i.animal.get(id)!) : '—')
  const padreCiclo = (c: (typeof ciclos)[number]) => (c.ia?.sementalId ? `Semental ${i.semental.get(c.ia.sementalId)?.name ?? '—'}` : c.monta?.toroId ? nombre(c.monta.toroId) : '—')
  const vacaNueva = nueva ? i.animal.get(nueva) : undefined

  return (
    <div className="page">
      <Card title="Reproducción" icon={<I.Heart size={20} />} action={
        <span className="inline"><button className="btn primary" onClick={() => setParto(true)}><I.Plus size={14} /> Nuevo parto</button><button className="btn soft" onClick={() => setElegir(true)}><I.Plus size={14} /> Nueva estrategia</button></span>}>
        <div className="kpis">
          <div className="kpi"><small>Gestantes</small><b>{st.gestantes}</b></div>
          <div className="kpi"><small>Vacías</small><b>{st.vacias}</b></div>
          <div className="kpi"><small>Pendientes de diagnóstico</small><b>{st.pendientes}</b></div>
          <div className="kpi"><small>Próximo parto</small><b>{st.proximos[0] ? fmtDate(st.proximos[0].f) : '—'}</b><small className="muted">{st.proximos[0] ? L.etiqueta(i, st.proximos[0].a) : ''}</small></div>
        </div>
        <Tabs value={tab} onChange={setTab} items={[{ id: 'estado', label: 'Estado de las vacas' }, { id: 'cubriciones', label: 'Cubriciones y ciclos' }, { id: 'partos', label: 'Partos' }]} />

        {tab === 'estado' && (hembras.length === 0 ? <Empty>No hay vacas ni novillas.</Empty> : (
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>Vaca</th><th>Estado</th><th>Última cubrición</th><th>Semental / toro</th><th>Parto previsto</th><th>Último parto</th><th>Días</th><th>Partos</th></tr></thead>
            <tbody>
              {hembras.map((a) => {
                const u = [...(i.ciclos.get(a.id) ?? [])].reverse().find((c) => c.ia || c.monta)
                const up = L.ultimoParto(i, a)
                const est = L.estadoRepro(i, a)
                return (
                  <tr key={a.id} className="click" onClick={() => verAnimal(a.id)}>
                    <td><b>{L.etiqueta(i, a)}</b></td>
                    <td><span className={`pill ${est === 'Gestante' ? 'ok' : ''}`}>{est}</span></td>
                    <td>{fmtDate(u?.ia?.fecha ?? u?.monta?.entrada)}</td><td>{u ? padreCiclo(u) : '—'}</td>
                    <td>{fmtDate(L.proximoParto(i, a))}</td><td>{fmtDate(up?.birth)}</td><td>{up ? daysBetween(up.birth, today()) : '—'}</td><td>{L.partosTotal(i, a)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>
        ))}

        {tab === 'cubriciones' && (
          <>
            <div className="toolbar"><label className="inline">Año <select value={anio} onChange={(e) => setAnio(e.target.value)}><option value="">Todos</option>{anios.map((y) => <option key={y}>{y}</option>)}</select></label></div>
            {ciclos.length === 0 ? <Empty>No hay ciclos registrados.</Empty> : (
              <div className="table-wrap"><table className="tbl">
                <thead><tr><th>Vaca</th><th>Ciclo</th><th>Tipo</th><th>Semental / toro</th><th>Entrada / IA</th><th>Salida</th><th>Diagnóstico</th><th>Resultado</th><th>Parto previsto</th><th>Obs.</th></tr></thead>
                <tbody>
                  {ciclos.map((c) => (
                    <tr key={c.id} className="click" onClick={() => verAnimal(c.vacaId)}>
                      <td><b>{nombre(c.vacaId)}</b></td><td>{c.label}</td><td>{c.metodo === 'Monta natural' ? 'Monta natural' : 'Inseminación'}</td><td>{padreCiclo(c)}</td>
                      <td>{fmtDate(c.ia?.fecha ?? c.monta?.entrada)}</td><td>{fmtDate(c.monta?.salida)}</td><td>{c.diag ? `${fmtDate(c.diag.fecha)}` : '—'}</td>
                      <td>{L.resultadoCiclo(c)}</td><td>{fmtDate(L.resultadoCiclo(c) === 'Gestante' ? L.fechaPrevistaParto(c, cfg.gestacionDias) : undefined)}</td><td>{c.obs ?? c.monta?.obs ?? c.ia?.obs ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            )}
            <p className="muted small">Pulsa una fila para abrir la ficha de esa vaca.</p>
          </>
        )}

        {tab === 'partos' && (partos.length === 0 ? <Empty>No hay partos registrados.</Empty> : (
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>Fecha</th><th>Madre</th><th>Padre</th><th>Cría</th><th>Sexo</th><th>Peso nac.</th><th>Facilidad</th><th>Tipo</th><th>Cría / madre</th><th>Incidencias</th></tr></thead>
            <tbody>
              {partos.map(({ p, c }) => (
                <tr key={p.id} className="click" onClick={() => verAnimal(c.id)}>
                  <td>{fmtDate(c.birth)}</td><td>{nombre(c.dam)}</td><td>{L.nodoRef(i, c.sire).label}</td><td><b>{c.name || '—'}</b><br /><small className="muted">{c.crotal}</small></td>
                  <td>{c.sex === 'M' ? 'Macho' : 'Hembra'}</td><td>{fmtNum(L.pesoTipo(i, c.id, 'nacimiento')?.kg, 0, 'kg')}</td><td>{p.facilidad}</td><td>{p.tipo}</td><td>{p.estadoCria ?? '—'} / {p.estadoMadre ?? '—'}</td><td>{p.incidencias ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        ))}
      </Card>
      {parto && <PartoForm i={i} onClose={() => setParto(false)} onSaved={verAnimal} />}
      {elegir && <ElegirVaca i={i} onClose={() => setElegir(false)} onPick={(id) => { setElegir(false); setNueva(id) }} />}
      {vacaNueva && <CicloForm i={i} vaca={vacaNueva} onClose={() => setNueva(undefined)} />}
      <Toast />
    </div>
  )
}

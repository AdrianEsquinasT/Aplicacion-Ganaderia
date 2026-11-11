import { BarChart } from '../components/charts'
import * as I from '../components/Icons'
import { Card, Kpi, Toast } from '../components/ui'
import * as L from '../logic'
import type { Index } from '../logic'
import { go, verAnimal } from '../router'
import { fmtDate, fmtNum, today, year } from '../util'

const ICONO: Record<L.Aviso['tipo'], (p: { size?: number }) => JSX.Element> = {
  parto: I.Cow, vacuna: I.Syringe, desparasitacion: I.Drops, revision: I.Calendar, 'sin-gestar': I.Heart, incidencia: I.Bell, decision: I.Tag, tratamiento: I.Cross,
}

export default function Inicio({ i }: { i: Index }) {
  const rs = L.resumenRebano(i)
  const st = L.statsRepro(i)
  const pr = L.statsProduccion(i)
  const av = L.avisos(i)
  const cuenta = (t: L.Aviso['tipo']) => av.filter((a) => a.tipo === t).length
  const anios = L.seriePorAnio(i, (y) => y).map((x) => x.year).filter((y) => y >= 2019)
  const act = L.activos(i)
  const tratamientos = i.state.sanidad.filter((x) => L.tratamientoActivo(x)).length
  const kg = L.kgTerneroPorVaca(i, year(today()) - 1)

  return (
    <div className="page home">
      <section className="card summary">
        <div className="tiles">
          <Kpi label="Total animales" value={rs.total} />
          <Kpi label="Vacas reproductoras" value={rs.vacas} />
          <Kpi label="Toros" value={rs.toros} />
          <Kpi label="Novillas" value={rs.novillas} />
          <Kpi label="Terneros" value={rs.terneros} />
          <Kpi label="Destinados a venta" value={rs.venta} />
          <Kpi label="Destinados a reposición" value={rs.reposicion} />
        </div>
      </section>

      <div className="home-grid">
        <Card title="Reproducción" icon={<I.Heart size={20} />} action={<button className="btn soft" onClick={() => go('reproduccion')}>Ver <I.Chevron size={14} /></button>}>
          <div className="kpis">
            <Kpi label="Tasa de partos" value={fmtNum(st.tasaPartos, 0, '%')} />
            <Kpi label="Vacas gestantes" value={st.gestantes} />
            <Kpi label="Vacas vacías" value={st.vacias} />
            <Kpi label="Intervalo entre partos" value={fmtNum(st.intervalo, 0, 'días')} />
            <Kpi label="Abortos" value={st.abortos} />
            <Kpi label="Cubriciones" value={st.cubriciones} />
          </div>
          <h4>Próximos partos</h4>
          {st.proximos.length === 0 ? <small className="muted">Ninguno previsto.</small> : <ul className="mini-list">{st.proximos.slice(0, 4).map((x) => <li key={x.a.id}><button className="link" onClick={() => verAnimal(x.a.id)}>{L.etiqueta(i, x.a)}</button><span>{fmtDate(x.f)}</span></li>)}</ul>}
        </Card>

        <Card title="Producción" icon={<I.Scale size={20} />} action={<button className="btn soft" onClick={() => go('produccion')}>Ver <I.Chevron size={14} /></button>}>
          <div className="kpis">
            <Kpi label="Peso medio al nacimiento" value={fmtNum(pr.nacimiento, 1, 'kg')} />
            <Kpi label="Peso medio al destete" value={fmtNum(pr.destete, 0, 'kg')} />
            <Kpi label="Ganancia media" value={fmtNum(pr.gmd, 0, 'g/día')} />
            <Kpi label="Kg ternero / vaca / año" value={fmtNum(kg, 0, 'kg')} sub={`año ${year(today()) - 1}`} />
          </div>
          <h4>Evolución del peso al destete (kg)</h4>
          <BarChart height={130} data={anios.map((y) => ({ label: String(y), value: L.statsProduccion(i, { year: y }).destete }))} />
        </Card>

        <Card title="Sanidad" icon={<I.Cross size={20} />} action={<button className="btn soft" onClick={() => go('sanidad')}>Ver <I.Chevron size={14} /></button>}>
          <div className="kpis">
            <Kpi label="Vacunas pendientes" value={cuenta('vacuna')} />
            <Kpi label="Desparasitaciones pendientes" value={cuenta('desparasitacion')} />
            <Kpi label="Tratamientos activos" value={tratamientos} />
            <Kpi label="Revisiones pendientes" value={cuenta('revision')} />
            <Kpi label="Incidencias sanitarias" value={cuenta('incidencia')} sub="últimos 30 días" />
          </div>
        </Card>

        <Card title={`Avisos (${av.length})`} icon={<I.Bell size={20} />} className="avisos-card">
          {av.length === 0 ? <small className="muted">Todo al día.</small> : (
            <ul className="avisos">
              {av.slice(0, 9).map((a, k) => {
                const Ico = ICONO[a.tipo]
                return <li key={k} className={a.urgente ? 'urg' : ''}><Ico size={18} /><button className="link" onClick={() => a.animalId && verAnimal(a.animalId)}>{a.texto}</button>{a.fecha && <small>{fmtDate(a.fecha)}</small>}</li>
              })}
            </ul>
          )}
          {av.length > 9 && <small className="muted">y {av.length - 9} avisos más (ver Sanidad y Reproducción)</small>}
        </Card>

        <Card title="Evolución anual de partos" icon={<I.Pie size={20} />} action={<button className="btn soft" onClick={() => go('estadisticas')}>Estadísticas <I.Chevron size={14} /></button>}>
          <BarChart height={140} data={anios.map((y) => ({ label: String(y), value: L.statsRepro(i, y).partos }))} />
        </Card>

        <Card title="Animales" icon={<I.Cow size={20} />} action={<button className="btn soft" onClick={() => go('animales')}>Ver todos <I.Chevron size={14} /></button>}>
          <ul className="mini-list">
            {act.filter((a) => L.categoria(i, a) === 'Vaca').slice(0, 5).map((a) => <li key={a.id}><button className="link" onClick={() => verAnimal(a.id)}>{L.etiqueta(i, a)}</button><span>{L.estadoRepro(i, a)}</span></li>)}
          </ul>
        </Card>
      </div>
      <Toast />
    </div>
  )
}

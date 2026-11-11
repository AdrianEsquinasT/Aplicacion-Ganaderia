import { BarChart } from '../components/charts'
import * as I from '../components/Icons'
import { Card, Kpi } from '../components/ui'
import * as L from '../logic'
import type { Index } from '../logic'
import { avg, fmtNum, monthsBetween, today, year } from '../util'

export default function Estadisticas({ i }: { i: Index }) {
  const st = L.statsRepro(i)
  const prod = L.statsProduccion(i)
  const rs = L.resumenRebano(i)
  const años = L.seriePorAnio(i, (y) => y).map((x) => x.year).filter((y) => y >= 2019)
  const por = <T,>(fn: (y: number) => T) => años.map((y) => ({ label: String(y), v: fn(y) }))
  const vacasAct = L.vacasReproductoras(i)
  const edades = vacasAct.map((a) => monthsBetween(a.birth, today()) / 12)
  const primerServicio = i.state.animals.filter((a) => a.sex === 'F').map((a) => { const c = (i.ciclos.get(a.id) ?? []).find((x) => x.ia || x.monta); return c ? monthsBetween(a.birth, c.ia?.fecha ?? c.monta?.entrada ?? today()) : undefined }).filter((x): x is number => x !== undefined)
  const bajasVaca = (y: number) => i.state.bajas.filter((b) => year(b.fecha) === y && i.animal.get(b.animalId)?.sex === 'F' && L.partosTotal(i, i.animal.get(b.animalId)!) > 0).length
  return (
    <div className="page">
      <Card title="Reproducción" icon={<I.Heart size={20} />}>
        <div className="kpis">
          <Kpi label="Tasa de gestación" value={fmtNum(st.tasaGestacion, 0, '%')} sub="ciclos con diagnóstico gestante" />
          <Kpi label="Tasa de partos" value={fmtNum(st.tasaPartos, 0, '%')} sub="cubriciones cerradas que acabaron en parto" />
          <Kpi label="Intervalo entre partos" value={fmtNum(st.intervalo, 0, 'días')} />
          <Kpi label="Edad al primer parto" value={fmtNum(st.edadPrimerParto, 0, 'meses')} />
          <Kpi label="Partos por vaca" value={fmtNum(st.partosPorVaca, 1)} />
          <Kpi label="Abortos" value={st.abortos} />
          <Kpi label="Partos asistidos" value={`${st.asistidos} de ${st.partos}`} />
        </div>
        <div className="cols2">
          <div><h4>Partos por año</h4><BarChart data={por((y) => L.statsRepro(i, y).partos).map((d) => ({ label: d.label, value: d.v }))} /></div>
          <div><h4>Tasa de gestación por año (%)</h4><BarChart data={por((y) => L.statsRepro(i, y).tasaGestacion).map((d) => ({ label: d.label, value: d.v }))} color="#b8812f" /></div>
        </div>
      </Card>
      <Card title="Producción" icon={<I.Scale size={20} />}>
        <div className="kpis">
          <Kpi label="Peso al nacimiento" value={fmtNum(prod.nacimiento, 1, 'kg')} />
          <Kpi label="Peso al destete" value={fmtNum(prod.destete, 0, 'kg')} />
          <Kpi label="Ganancia diaria" value={fmtNum(prod.gmd, 0, 'g/día')} />
          <Kpi label="Kg de ternero / vaca / año" value={fmtNum(L.kgTerneroPorVaca(i, year(today()) - 1), 0, 'kg')} sub={`año ${year(today()) - 1}`} />
        </div>
        <div className="cols2">
          <div><h4>Peso al destete por año (kg)</h4><BarChart data={por((y) => L.statsProduccion(i, { year: y }).destete).map((d) => ({ label: d.label, value: d.v }))} /></div>
          <div><h4>Ganancia diaria por año (g/día)</h4><BarChart data={por((y) => L.statsProduccion(i, { year: y }).gmd).map((d) => ({ label: d.label, value: d.v }))} color="#b8812f" /></div>
        </div>
      </Card>
      <Card title="Reposición" icon={<I.Tree size={20} />}>
        <div className="kpis">
          <Kpi label="Novillas disponibles" value={rs.novillas} />
          <Kpi label="Novillas seleccionadas" value={L.activos(i).filter((a) => L.categoria(i, a) === 'Novilla' && a.destino === 'Reposición').length} sub="destino Reposición" />
          <Kpi label="Edad media al primer servicio" value={fmtNum(avg(primerServicio), 0, 'meses')} />
        </div>
      </Card>
      <Card title="Longevidad" icon={<I.Calendar size={20} />}>
        <div className="kpis">
          <Kpi label="Edad media de las vacas" value={fmtNum(avg(edades), 1, 'años')} />
          <Kpi label="Partos por vaca" value={fmtNum(st.partosPorVaca, 1)} />
        </div>
        <h4>Vacas dadas de baja por año</h4>
        <BarChart data={por(bajasVaca).map((d) => ({ label: d.label, value: d.v }))} color="#7a5a3a" />
      </Card>
    </div>
  )
}

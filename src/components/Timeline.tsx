import type { Index } from '../logic'
import { resultadoCiclo } from '../logic'
import type { Ciclo } from '../types'
import { fmtDate } from '../util'
import { etiqueta } from '../logic'

interface Paso {
  label: string
  fecha?: string
  hora?: string
  detalle?: string
}

export function pasosCiclo(i: Index, c: Ciclo): Paso[] {
  const sem = c.ia?.sementalId ? i.semental.get(c.ia.sementalId) : undefined
  const toro = c.monta?.toroId ? i.animal.get(c.monta.toroId) : undefined
  const pasos: Paso[] = [
    { label: 'CIDR colocado', fecha: c.cidr?.fecha, hora: c.cidr?.hora, detalle: c.cidr?.obs },
    { label: 'CIDR retirado', fecha: c.retirada?.fecha, hora: c.retirada?.hora, detalle: c.retirada?.obs },
    { label: 'Prostaglandina', fecha: c.pg?.fecha, hora: c.pg?.hora, detalle: [c.pg?.producto, c.pg?.dosis].filter(Boolean).join(' · ') || c.pg?.obs },
  ]
  if (c.metodo === 'Monta natural') {
    pasos.push({ label: 'Monta natural', fecha: c.monta?.entrada, detalle: [toro ? etiqueta(i, toro) : undefined, c.monta?.salida ? `salida ${fmtDate(c.monta.salida)}` : undefined].filter(Boolean).join(' · ') })
  } else {
    pasos.push({ label: 'Inseminación', fecha: c.ia?.fecha, hora: c.ia?.hora, detalle: [sem ? `Semental ${sem.name}` : undefined, c.ia?.tipoSemen, c.ia?.tecnico].filter(Boolean).join(' · ') })
  }
  pasos.push({ label: 'Diagnóstico de gestación', fecha: c.diag?.fecha, detalle: [c.diag?.resultado, c.diag?.metodo].filter(Boolean).join(' · ') })
  return pasos
}

const BADGE: Record<string, string> = { Gestante: 'ok', Parto: 'ok', Vacía: 'bad', Aborto: 'bad', 'Pendiente de diagnóstico': 'wait', 'En protocolo': 'wait', Dudosa: 'wait' }

/** Línea temporal visual de un ciclo reproductivo. */
export default function Timeline({ i, ciclo, prevista }: { i: Index; ciclo: Ciclo; prevista?: string }) {
  const res = resultadoCiclo(ciclo)
  return (
    <ol className="timeline">
      {pasosCiclo(i, ciclo).map((p) => (
        <li key={p.label} className={p.fecha ? 'done' : 'pending'}>
          <span className="dot" />
          <div>
            <b>{p.label}</b>
            <span className="when">{p.fecha ? `${fmtDate(p.fecha)}${p.hora ? ' · ' + p.hora : ''}` : 'Pendiente'}</span>
            {p.detalle && <small>{p.detalle}</small>}
          </div>
        </li>
      ))}
      {ciclo.aborto && (
        <li className="done"><span className="dot bad" /><div><b>Aborto</b><span className="when">{fmtDate(ciclo.aborto.fecha)}</span></div></li>
      )}
      <li className="result">
        <span className={`badge-res ${BADGE[res] ?? ''}`}>{res === 'Gestante' ? 'GESTANTE ✅' : res === 'Parto' ? 'PARTO ✅' : res === 'Vacía' ? 'VACÍA' : res.toUpperCase()}</span>
        {res === 'Gestante' && prevista && <small>Parto previsto: <b>{fmtDate(prevista)}</b></small>}
      </li>
    </ol>
  )
}

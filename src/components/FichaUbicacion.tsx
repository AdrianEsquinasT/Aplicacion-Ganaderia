import { useState } from 'react'
import { A } from '../actions'
import * as L from '../logic'
import type { Index } from '../logic'
import { go, verAnimal, verUbicacion } from '../router'
import type { Ubicacion } from '../types'
import { avisosUbicaciones, carga, descanso, diasMov, diasTotalesOcupacion, esPasto, estadoEfectivo, laboresAprovechamiento, presentes, ultimoAprovechamiento, usosPastoreo } from '../ubicaciones'
import { fmtDate, fmtNum } from '../util'
import { FotoUbicacionForm, LaborForm, LlevarForm, SalidaForm, UbicacionForm, VisitaForm } from './formsUbic'
import * as I from './Icons'
import { Avatar, Card, Empty, Kpi, toast } from './ui'

type Modal = null | 'edit' | 'llevar' | 'salida' | 'visita' | 'labor' | 'foto'

export const claseEstado = (e: string) => (e === 'Ocupada' ? 'ok' : e === 'En descanso' ? 'wait' : e === 'No pastable' ? 'off' : '')

export function FotoUbic({ i, ub, className = '' }: { i: Index; ub: Ubicacion; className?: string }) {
  const f = ub.mainPhotoId ? i.photo.get(ub.mainPhotoId)?.data : undefined
  return f ? <img className={`ubic-img ${className}`} src={f} alt={ub.nombre} /> : <span className={`ubic-img ph-box ${className}`}><I.Leaf size={40} /></span>
}

export default function FichaUbicacion({ i, ub }: { i: Index; ub: Ubicacion }) {
  const [modal, setModal] = useState<Modal>(null)
  const [cmpA, setCmpA] = useState('')
  const [cmpB, setCmpB] = useState('')
  const cfg = i.state.config
  const pr = presentes(i, ub.id)
  const estado = estadoEfectivo(i, ub)
  const d = descanso(i, ub)
  const ult = ultimoAprovechamiento(i, ub)
  const c = carga(i, ub)
  const usos = usosPastoreo(i, ub.id)
  const labores = i.labores.get(ub.id) ?? []
  const visitas = i.visitas.get(ub.id) ?? []
  const v = visitas[0]
  const fotos = i.state.photos.filter((p) => p.ownerId === ub.id).sort((a, b) => (b.fecha ?? '').localeCompare(a.fecha ?? ''))
  const hijas = i.state.ubicaciones.filter((u) => u.dentroDe === ub.id)
  const padre = ub.dentroDe ? i.ubic.get(ub.dentroDe) : undefined
  const avisos = avisosUbicaciones(i).filter((a) => a.texto.includes(ub.nombre))
  const total = (i.movUbic.get(ub.id) ?? []).length
  const forraje = laboresAprovechamiento(i, ub.id).reduce((s, x) => s + (x.produccionKg ?? 0), 0)
  const minDesc = cfg.diasDescansoMin ?? 30
  const fa = fotos.find((f) => f.id === cmpA)
  const fb = fotos.find((f) => f.id === cmpB)
  const sigpac = [ub.poligono && `Polígono ${ub.poligono}`, ub.parcela && `Parcela ${ub.parcela}`, ub.recinto && `Recinto ${ub.recinto}`].filter(Boolean).join(' · ')
  const lugar = [ub.municipio, ub.provincia, ub.zona].filter(Boolean).join(' · ')

  return (
    <div className="ficha">
      <button className="back-link" onClick={() => go('ubicaciones')}>← Praderas y ubicaciones</button>

      <section className="card hero-card">
        <div className="photo"><FotoUbic i={i} ub={ub} /><button className="cam" aria-label="Añadir fotografía" onClick={() => setModal('foto')}><I.Camera size={18} /></button></div>
        <div className="id">
          <h2>{ub.nombre}</h2>
          <div className="tags"><span className="tag">{ub.tipo}</span><span className={`pill ${claseEstado(estado)}`}>{estado}</span>{padre && <button className="tag light" onClick={() => verUbicacion(padre.id)}>Dentro de {padre.nombre}</button>}</div>
          <div className="stat-row">
            <div><small>Superficie total</small><b>{ub.superficieTotal !== undefined ? `${fmtNum(ub.superficieTotal, 2)} ha` : '—'}</b></div>
            <div><small>Superficie aprovechable</small><b>{ub.superficieAprovechable !== undefined ? `${fmtNum(ub.superficieAprovechable, 2)} ha` : 'Sin indicar'}</b></div>
            <div><small>Animales ahora</small><b>{pr.length}</b></div>
          </div>
          <dl className="info">
            <div><dt>Localización</dt><dd>{lugar || '—'}</dd></div>
            <div><dt>SIGPAC</dt><dd>{sigpac || '—'}</dd></div>
            {ub.obs && <div><dt>Observaciones</dt><dd>{ub.obs}</dd></div>}
          </dl>
        </div>
      </section>

      <div className="actions-bar">
        <button className="btn primary" onClick={() => setModal('llevar')}><I.Plus size={16} /> Llevar animales a esta ubicación</button>
        {pr.length > 0 && <button className="btn soft" onClick={() => setModal('salida')}>Registrar salida</button>}
        {esPasto(ub) && <button className="btn soft" onClick={() => setModal('visita')}><I.Leaf size={16} /> Valorar el terreno</button>}
        {esPasto(ub) && <button className="btn soft" onClick={() => setModal('labor')}>Añadir trabajo o aprovechamiento</button>}
        <button className="btn soft" onClick={() => setModal('edit')}><I.Edit size={16} /> Editar</button>
        <button className="btn ghost danger" onClick={() => { if (confirm(`¿Eliminar «${ub.nombre}»?`)) { if (A.deleteUbicacion(ub.id)) { toast('Ubicación eliminada'); go('ubicaciones') } else toast('No se puede eliminar: tiene historial de movimientos') } }}>Eliminar</button>
      </div>

      {avisos.length > 0 && <div className="card notice-card"><ul className="avisos">{avisos.map((a, k) => <li key={k} className={a.urgente ? 'urg' : ''}><I.Bell size={18} />{a.texto}</li>)}</ul></div>}

      <div className="ficha-grid">
        <Card title="Animales presentes" icon={<I.Cow size={20} />} className="g-pres">
          {pr.length === 0 ? <Empty>No hay animales en esta ubicación.</Empty> : (
            <div className="table-wrap"><table className="tbl"><thead><tr><th></th><th>Animal</th><th>Entrada</th><th>Tiempo allí</th></tr></thead><tbody>
              {pr.map(({ a, mov }) => <tr key={a.id} className="click" onClick={() => verAnimal(a.id)}><td><Avatar i={i} a={a} size={34} /></td><td><b>{L.etiqueta(i, a)}</b></td><td>{fmtDate(mov.entrada)}{mov.horaEntrada ? ` · ${mov.horaEntrada}` : ''}</td><td>{diasMov(mov)} días</td></tr>)}
            </tbody></table></div>
          )}
          {esPasto(ub) && (
            <div className="carga">
              <h4>Carga ganadera orientativa</h4>
              {c.porHa !== undefined ? <p><b>{fmtNum(c.porHa, 2)}</b> animales por hectárea <small className="muted">(sobre la superficie {c.base})</small>{c.kgVivoHa !== undefined && <> · <b>{fmtNum(c.kgVivoHa, 0)}</b> kg de peso vivo por hectárea</>}</p> : <p className="muted">{c.animales === 0 ? 'Sin animales presentes.' : 'Indica la superficie para calcular la carga.'}</p>}
              {c.sinPeso && <small className="muted">Algún animal no tiene peso registrado, así que no se calcula el peso vivo por hectárea.</small>}
              <p className="notice">Es solo una cifra de referencia. <b>No indica cuántos animales admite la parcela</b>: eso depende de datos técnicos (producción de pasto, estación, tipo de animal) que esta aplicación no estima.</p>
            </div>
          )}
        </Card>

        <Card title="Control de aprovechamiento" icon={<I.Calendar size={20} />} className="g-aprov">
          <div className="kpis">
            <Kpi label="Días totales de ocupación" value={diasTotalesOcupacion(i, ub.id)} sub={usos.length === 1 ? '1 estancia' : `${usos.length} estancias`} />
            <Kpi label="Último aprovechamiento" value={fmtDate(ult.fecha)} sub={ult.tipo ?? ''} />
            <Kpi label="Descanso" value={d.ocupada ? 'Ocupada' : d.dias !== undefined ? `${d.dias} días` : '—'} sub={d.ocupada ? 'con animales ahora' : d.ultimaSalida ? `desde la salida del ${fmtDate(d.ultimaSalida)}${d.dias! < minDesc ? ` (mínimo configurado: ${minDesc})` : ''}` : 'sin salidas registradas'} />
            {forraje > 0 && <Kpi label="Forraje registrado" value={forraje >= 1000 ? `${fmtNum(forraje / 1000, 2)} t` : `${fmtNum(forraje)} kg`} />}
          </div>
          <h4>Pastoreo</h4>
          {usos.length === 0 ? <Empty>Aún no hay entradas de ganado.</Empty> : (
            <div className="table-wrap"><table className="tbl"><thead><tr><th>Entrada</th><th>Salida</th><th>Animales</th><th>Días</th><th>Obs.</th></tr></thead><tbody>
              {usos.slice(0, 12).map((u) => <tr key={u.clave}><td>{fmtDate(u.entrada)}</td><td>{u.salida ? fmtDate(u.salida) : <span className="pill ok">en curso</span>}</td>
                <td><b>{u.animales.length}</b> · {u.lote ?? u.animales.slice(0, 3).map((a) => a.name || a.crotal.slice(-4)).join(', ')}{!u.lote && u.animales.length > 3 ? '…' : ''}</td><td>{u.dias}</td><td>{u.obs ?? '—'}</td></tr>)}
            </tbody></table></div>
          )}
          <h4>Trabajos y aprovechamientos</h4>
          {labores.length === 0 ? <Empty>Sin trabajos registrados (desbroce, abonado, resiembra, siega…).</Empty> : (
            <div className="table-wrap"><table className="tbl"><thead><tr><th>Fecha</th><th>Tipo</th><th>Producción</th><th>Obs.</th><th></th></tr></thead><tbody>
              {labores.map((l) => <tr key={l.id}><td>{fmtDate(l.fecha)}</td><td>{l.tipo}</td><td>{l.produccionKg ? (l.produccionKg >= 1000 ? `${fmtNum(l.produccionKg / 1000, 2)} t` : `${fmtNum(l.produccionKg)} kg`) : '—'}</td><td>{l.obs ?? '—'}</td><td><button className="x" aria-label="Eliminar" onClick={() => confirm('¿Eliminar este registro?') && A.deleteLabor(l.id)}>×</button></td></tr>)}
            </tbody></table></div>
          )}
        </Card>

        {esPasto(ub) && (
          <Card title="Calidad y características del pasto" icon={<I.Leaf size={20} />} action={<button className="btn soft" onClick={() => setModal('visita')}><I.Plus size={14} /> Valorar</button>} className="g-calidad">
            {!v ? <Empty>Aún no has valorado este terreno. Pulsa «Valorar» cuando lo visites.</Empty> : (
              <>
                <p className="muted small">Última valoración: {fmtDate(v.fecha)}</p>
                <ul className="kv">
                  <li><span>Calidad general</span><b>{v.calidad ?? '—'}</b></li><li><span>Cantidad de hierba</span><b>{v.cantidad ?? '—'}</b></li>
                  <li><span>Estado del pasto</span><b>{v.estadoPasto ?? '—'}</b></li><li><span>Humedad del terreno</span><b>{v.humedad ?? '—'}</b></li>
                  <li><span>Composición vegetal</span><b>{v.composicion?.length ? v.composicion.join(', ') : '—'}</b></li><li><span>Malas hierbas</span><b>{v.malasHierbas ?? '—'}</b></li>
                  <li><span>Cierre</span><b className={v.cierre === 'Necesita revisión' ? 'warn' : ''}>{v.cierre ?? '—'}</b></li><li><span>Agua disponible</span><b>{v.agua === undefined ? '—' : v.agua ? 'Sí' : 'No'}</b></li>
                  <li><span>Sombra</span><b>{v.sombra ?? '—'}</b></li>{v.obs && <li><span>Observaciones</span><b>{v.obs}</b></li>}
                </ul>
              </>
            )}
            {visitas.length > 1 && (
              <details className="more"><summary>Historial de valoraciones ({visitas.length})</summary>
                <div className="table-wrap"><table className="tbl"><thead><tr><th>Fecha</th><th>Calidad</th><th>Hierba</th><th>Pasto</th><th>Humedad</th><th>Cierre</th><th></th></tr></thead><tbody>
                  {visitas.map((x) => <tr key={x.id}><td>{fmtDate(x.fecha)}</td><td>{x.calidad ?? '—'}</td><td>{x.cantidad ?? '—'}</td><td>{x.estadoPasto ?? '—'}</td><td>{x.humedad ?? '—'}</td><td>{x.cierre ?? '—'}</td><td><button className="x" aria-label="Eliminar" onClick={() => confirm('¿Eliminar esta valoración?') && A.deleteVisita(x.id)}>×</button></td></tr>)}
                </tbody></table></div>
              </details>
            )}
          </Card>
        )}

        <Card title="Fotografías por fecha" icon={<I.Camera size={20} />} action={<button className="btn soft" onClick={() => setModal('foto')}><I.Plus size={14} /> Añadir</button>} className="g-fotos">
          {fotos.length === 0 ? <Empty>Sin fotografías. Añade fotos con su fecha para comparar cómo evoluciona la pradera a lo largo del año.</Empty> : (
            <>
              <div className="gallery">
                {fotos.map((p) => (
                  <figure key={p.id}><img src={p.data} alt={`${ub.nombre} ${fmtDate(p.fecha)}`} />
                    <figcaption><span>{fmtDate(p.fecha)}</span>{p.id === ub.mainPhotoId ? <span>★ Principal</span> : <button onClick={() => A.setPhotoUbic(p.id, ub.id)}>Principal</button>}<button onClick={() => confirm('¿Eliminar la fotografía?') && A.deletePhoto(p.id)}>Eliminar</button></figcaption>
                  </figure>
                ))}
              </div>
              {fotos.length > 1 && (
                <div className="compare">
                  <h4>Comparar dos fechas</h4>
                  <div className="toolbar">
                    <select value={cmpA} onChange={(e) => setCmpA(e.target.value)}><option value="">Primera foto…</option>{fotos.map((f) => <option key={f.id} value={f.id}>{fmtDate(f.fecha)}</option>)}</select>
                    <select value={cmpB} onChange={(e) => setCmpB(e.target.value)}><option value="">Segunda foto…</option>{fotos.map((f) => <option key={f.id} value={f.id}>{fmtDate(f.fecha)}</option>)}</select>
                  </div>
                  {fa && fb && <div className="compare-pair"><figure><img src={fa.data} alt="" /><figcaption>{fmtDate(fa.fecha)}</figcaption></figure><figure><img src={fb.data} alt="" /><figcaption>{fmtDate(fb.fecha)}</figcaption></figure></div>}
                </div>
              )}
            </>
          )}
        </Card>

        {hijas.length > 0 && (
          <Card title="Zonas dentro de esta ubicación" icon={<I.Pin size={20} />}>
            <ul className="mini-list">{hijas.map((h) => <li key={h.id}><button className="link" onClick={() => verUbicacion(h.id)}>{h.nombre}</button><span>{presentes(i, h.id).length === 1 ? '1 animal' : `${presentes(i, h.id).length} animales`}</span></li>)}</ul>
          </Card>
        )}

        <Card title="Historial de movimientos" icon={<I.Pulse size={20} />} className="g-hist">
          {total === 0 ? <Empty>Sin movimientos todavía.</Empty> : (
            <div className="table-wrap"><table className="tbl"><thead><tr><th>Animal</th><th>Entrada</th><th>Salida</th><th>Días</th><th>Obs.</th></tr></thead><tbody>
              {[...(i.movUbic.get(ub.id) ?? [])].reverse().slice(0, 30).map((m) => { const a = i.animal.get(m.animalId); return <tr key={m.id}><td>{a ? <button className="link" onClick={() => verAnimal(a.id)}>{L.etiqueta(i, a)}</button> : '—'}</td><td>{fmtDate(m.entrada)}</td><td>{m.salida ? fmtDate(m.salida) : <span className="pill ok">aquí</span>}</td><td>{diasMov(m)}</td><td>{m.loteNombre ?? m.obs ?? '—'}</td></tr> })}
            </tbody></table></div>
          )}
        </Card>
      </div>

      {modal === 'edit' && <UbicacionForm i={i} ubicacion={ub} onClose={() => setModal(null)} />}
      {modal === 'llevar' && <LlevarForm i={i} ub={ub} onClose={() => setModal(null)} />}
      {modal === 'salida' && <SalidaForm i={i} ub={ub} onClose={() => setModal(null)} />}
      {modal === 'visita' && <VisitaForm ub={ub} previa={v} onClose={() => setModal(null)} />}
      {modal === 'labor' && <LaborForm ub={ub} onClose={() => setModal(null)} />}
      {modal === 'foto' && <FotoUbicacionForm ub={ub} onClose={() => setModal(null)} />}
    </div>
  )
}

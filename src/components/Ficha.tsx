import { useState } from 'react'
import { A } from '../actions'
import * as L from '../logic'
import type { Index } from '../logic'
import { go, verAnimal } from '../router'
import type { Animal, Ciclo, TipoFoto } from '../types'
import { ageLabel, avg, daysBetween, fmtDate, fmtNum, today } from '../util'
import { AnimalForm, BajaForm, CicloForm, PartoForm, PesoForm, SanidadForm } from './forms'
import { LineChart } from './charts'
import Donut from './Donut'
import * as I from './Icons'
import Pedigree from './Pedigree'
import Timeline from './Timeline'
import { Avatar, Card, Empty, FormActions, Field, PhotoPicker, ScoreBar, SexMark, Sheet, toast } from './ui'

type Modal = null | 'edit' | 'peso' | 'ciclo' | 'ciclo-edit' | 'parto' | 'sanidad' | 'foto' | 'baja'

const dmy = (iso: number) => {
  const d = new Date(iso)
  return `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCFullYear()).slice(2)}`
}

export function FotoSheet({ i, animal, onClose }: { i: Index; animal: Animal; onClose: () => void }) {
  const [data, setData] = useState<string>()
  const [tipo, setTipo] = useState<TipoFoto>('adicional')
  const [principal, setPrincipal] = useState(!animal.mainPhotoId)
  return (
    <Sheet title="Añadir fotografía" sub={L.etiqueta(i, animal)} onClose={onClose}>
      <form className="form-grid" onSubmit={(e) => { e.preventDefault(); if (!data) return toast('Elige una fotografía'); A.addPhoto(animal.id, principal ? 'principal' : tipo, data, principal); toast('Fotografía añadida'); onClose() }}>
        <div className="full"><PhotoPicker value={data} onChange={setData} label="Elegir o hacer fotografía" /></div>
        <Field label="Tipo de foto"><select value={tipo} onChange={(e) => setTipo(e.target.value as TipoFoto)}><option value="adicional">Adicional</option><option value="perfil">Perfil</option><option value="lateral">Lateral</option><option value="identificacion">Identificación (crotal)</option></select></Field>
        <label className="check"><input type="checkbox" checked={principal} onChange={(e) => setPrincipal(e.target.checked)} /> Usar como foto principal</label>
        <div className="full"><FormActions onCancel={onClose} /></div>
      </form>
    </Sheet>
  )
}

export function DescTable({ i, hijos, conPadres }: { i: Index; hijos: Animal[]; conPadres?: boolean }) {
  if (!hijos.length) return <Empty>Sin descendencia registrada.</Empty>
  return (
    <div className="table-wrap">
      <table className="tbl">
        <thead>
          <tr><th></th><th>Crotal</th><th>Sexo</th><th>Nacimiento</th>{conPadres && <><th>Padre</th><th>Madre</th></>}<th>Peso nac.</th><th>Destete</th><th>Último peso</th><th>Estado</th></tr>
        </thead>
        <tbody>
          {hijos.map((h) => {
            const b = i.baja.get(h.id)
            return (
              <tr key={h.id} className="click" onClick={() => verAnimal(h.id)}>
                <td><Avatar i={i} a={h} size={34} /></td>
                <td><b>{h.name || '—'}</b><br /><small className="muted">{h.crotal}</small></td>
                <td><SexMark sex={h.sex} /></td>
                <td>{fmtDate(h.birth)}</td>
                {conPadres && <><td>{L.nodoRef(i, h.sire).label}</td><td>{h.dam && i.animal.get(h.dam) ? L.etiqueta(i, i.animal.get(h.dam)!) : '—'}</td></>}
                <td>{fmtNum(L.pesoTipo(i, h.id, 'nacimiento')?.kg, 0, 'kg')}</td>
                <td>{fmtNum(L.pesoTipo(i, h.id, 'destete')?.kg, 0, 'kg')}</td>
                <td>{fmtNum(L.pesoActual(i, h)?.kg, 0, 'kg')}</td>
                <td>{b ? <span className="pill off">Baja · {b.motivo}</span> : <span className="pill">{h.destino ?? 'Activo'}</span>}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function Ficha({ i, animal: a }: { i: Index; animal: Animal }) {
  const [modal, setModal] = useState<Modal>(null)
  const [cicloSel, setCicloSel] = useState<string>()
  const [verTodo, setVerTodo] = useState(false)
  const cfg = i.state.config
  const cat = L.categoria(i, a)
  const baja = i.baja.get(a.id)
  const pesos = i.pesajes.get(a.id) ?? []
  const peso = L.pesoActual(i, a)
  const comp = L.composicion(i, a)
  const estado = L.estadoRepro(i, a)
  const ciclos = i.ciclos.get(a.id) ?? []
  const ciclo: Ciclo | undefined = ciclos.find((c) => c.id === cicloSel) ?? ciclos[ciclos.length - 1]
  const hijos = L.hijosDe(i, a.id)
  const indices = L.indicesInternos(i, a)
  const hist = L.historial(i, a)
  const lote = a.loteId ? i.lote.get(a.loteId)?.name : undefined
  const esVaca = a.sex === 'F' && (cat === 'Vaca' || cat === 'Novilla')
  const ultParto = esVaca ? L.ultimoParto(i, a) : undefined
  const interval = esVaca ? L.intervaloPartos(i, a) : undefined
  const ultIA = [...ciclos].reverse().find((c) => c.ia || c.monta)
  const sem = ultIA?.ia?.sementalId ? i.semental.get(ultIA.ia.sementalId)?.name : ultIA?.monta?.toroId && i.animal.get(ultIA.monta.toroId) ? L.etiqueta(i, i.animal.get(ultIA.monta.toroId)!) : undefined
  const abierto = ciclos.length ? L.resultadoCiclo(ciclos[ciclos.length - 1]) === 'En protocolo' : false
  const desc = L.resumenDescendencia(i, a.id)
  const fotos = i.state.photos.filter((p) => p.ownerId === a.id)
  const nombre = L.etiqueta(i, a)

  return (
    <div className="ficha">
      <button className="back" onClick={() => go('animales')}>← Mis animales</button>

      <section className="card hero-card">
        <div className="photo">
          <Avatar i={i} a={a} size={240} />
          <button className="cam" aria-label="Añadir fotografía" onClick={() => setModal('foto')}><I.Camera size={18} /></button>
        </div>
        <div className="id">
          <div className="title">
            <h2>{nombre.toUpperCase()} <SexMark sex={a.sex} /></h2>
          </div>
          <div className="tags">
            <span className="tag">{cat}</span>
            <span className="tag light">{comp.shares.length === 1 ? `100 % ${comp.shares[0].breed}` : comp.shares.map((s) => `${Math.round(s.pct)} % ${s.breed}`).join(' · ')}</span>
            {estado && <span className={`tag ${estado === 'Gestante' ? 'ok' : 'light'}`}>{estado}</span>}
            {a.destino && <span className="tag light">{a.destino}</span>}
            {baja && <span className="tag bad">Baja · {baja.motivo}</span>}
          </div>
          <div className="stat-row">
            <div><small>Peso actual</small><b>{peso ? `${peso.kg} kg` : '—'}</b></div>
            <div><small>Último pesaje</small><b>{peso ? fmtDate(peso.fecha) : '—'}</b></div>
            <div><small>Edad</small><b>{ageLabel(a.birth, baja?.fecha ?? today())}</b></div>
          </div>
          <dl className="info">
            <div><dt>Crotal</dt><dd>{a.crotal}</dd></div>
            <div><dt>Nombre</dt><dd>{a.name || '—'}</dd></div>
            <div><dt>Identificación oficial</dt><dd>{a.officialId ?? '—'}</dd></div>
            <div><dt>Sexo</dt><dd>{a.sex === 'F' ? 'Hembra' : 'Macho'}</dd></div>
            <div><dt>Raza</dt><dd>{a.breed}</dd></div>
            <div><dt>Nacimiento</dt><dd>{fmtDate(a.birth)}</dd></div>
            <div><dt>Explotación</dt><dd>{a.explotacion ?? cfg.nombre}</dd></div>
            <div><dt>Lote</dt><dd>{lote ?? '—'}</dd></div>
            <div><dt>Estado actual</dt><dd>{baja ? 'Baja' : 'Activo'}</dd></div>
            <div><dt>Fecha de alta</dt><dd>{fmtDate(a.entryDate ?? a.birth)}</dd></div>
            {baja && <div><dt>Fecha de baja</dt><dd>{fmtDate(baja.fecha)}</dd></div>}
            <div><dt>Condición corporal</dt><dd>{a.condition ? `${a.condition}/5` : '—'}</dd></div>
          </dl>
        </div>
        <div className="breed">
          <h4>Composición racial</h4>
          <Donut breed={comp.shares} />
          <small className="muted center">{comp.calculada ? 'Calculada a partir de sus progenitores. No es una certificación oficial de raza.' : 'Registrada o declarada. No es una certificación oficial de raza.'}</small>
        </div>
      </section>

      <div className="actions-bar">
        <button className="btn primary" onClick={() => setModal('edit')}><I.Edit size={16} /> Editar animal</button>
        <button className="btn soft" onClick={() => setModal('peso')}><I.Scale size={16} /> Añadir peso</button>
        {esVaca && <button className="btn soft" onClick={() => setModal('ciclo')}><I.Heart size={16} /> Nueva estrategia reproductiva</button>}
        {esVaca && <button className="btn soft" onClick={() => setModal('parto')}><I.Cow size={16} /> Registrar parto</button>}
        <button className="btn soft" onClick={() => setModal('sanidad')}><I.Cross size={16} /> Añadir actuación sanitaria</button>
        <button className="btn soft" onClick={() => setModal('foto')}><I.Camera size={16} /> Añadir fotografía</button>
        <button className="btn soft" onClick={() => go('genealogia', a.id)}><I.Tree size={16} /> Ver genealogía</button>
        {baja ? <button className="btn ghost" onClick={() => { A.reactivar(a.id); toast('Animal reactivado') }}>Reactivar</button> : <button className="btn ghost danger" onClick={() => setModal('baja')}>Dar de baja</button>}
      </div>

      <div className="ficha-grid">
        <Card title="Peso" icon={<I.Scale size={20} />} action={<button className="btn soft" onClick={() => setModal('peso')}><I.Plus size={14} /> Añadir peso</button>} className="g-peso">
          <div className="stat-row small"><div><small>Peso actual</small><b>{peso ? `${peso.kg} kg` : '—'}</b></div><div><small>Último pesaje</small><b>{peso ? fmtDate(peso.fecha) : '—'}</b></div><div><small>Ganancia entre los 2 últimos pesajes</small><b>{fmtNum(L.gananciaDiaria(i, a.id), 0, 'g/día')}</b></div></div>
          <LineChart series={[{ name: 'Peso', color: '#4f7a3a', points: pesos.map((p) => ({ x: Date.parse(p.fecha), y: p.kg })) }]} xFormat={dmy} yUnit="kg" empty="Aún no hay pesajes registrados." />
          {pesos.length > 0 && (
            <details className="more"><summary>Historial de pesajes ({pesos.length})</summary>
              <div className="table-wrap"><table className="tbl"><thead><tr><th>Fecha</th><th>Peso</th><th>Edad</th><th>Tipo</th><th></th></tr></thead><tbody>
                {[...pesos].reverse().map((p) => (
                  <tr key={p.id}><td>{fmtDate(p.fecha)}</td><td>{p.kg} kg</td><td>{ageLabel(a.birth, p.fecha)}</td><td>{p.tipo}{p.obs ? ` · ${p.obs}` : ''}</td><td><button className="x" aria-label="Eliminar pesaje" onClick={() => confirm('¿Eliminar este pesaje?') && A.deletePesaje(p.id)}>×</button></td></tr>
                ))}
              </tbody></table></div>
            </details>
          )}
        </Card>

        {(esVaca || ciclos.length > 0) && (
          <Card title="Reproducción" icon={<I.Heart size={20} />} className="g-repro">
            <ul className="kv">
              <li><span>Estado actual</span><b>{estado ?? '—'}</b></li>
              <li><span>Última cubrición / inseminación</span><b>{ultIA ? fmtDate(ultIA.ia?.fecha ?? ultIA.monta?.entrada) : '—'}</b></li>
              <li><span>Método</span><b>{ultIA ? (ultIA.metodo === 'Monta natural' ? 'Monta natural' : 'Inseminación artificial') : '—'}</b></li>
              <li><span>Semental / toro utilizado</span><b>{sem ?? '—'}</b></li>
              <li><span>Fecha prevista de parto</span><b>{fmtDate(L.proximoParto(i, a))}</b></li>
              <li><span>Último parto</span><b>{ultParto ? `${fmtDate(ultParto.birth)} (${ultParto.sex === 'M' ? 'macho' : 'hembra'}${L.pesoTipo(i, ultParto.id, 'nacimiento') ? ', ' + L.pesoTipo(i, ultParto.id, 'nacimiento')!.kg + ' kg' : ''})` : '—'}</b></li>
              <li><span>Días desde el último parto</span><b>{ultParto ? daysBetween(ultParto.birth, today()) : '—'}</b></li>
              <li><span>Número de partos</span><b>{L.partosTotal(i, a)}{a.partosPrevios ? ` (${a.partosPrevios} anteriores a la app)` : ''}</b></li>
              <li><span>Número de abortos</span><b>{L.nAbortos(i, a)}</b></li>
              <li><span>Intervalo medio entre partos</span><b>{interval ? `${Math.round(interval)} días` : '—'}</b></li>
              <li><span>Próxima cubrición</span><b>{abierto ? 'En protocolo' : estado === 'Vacía' ? 'Sin planificar' : '—'}</b></li>
            </ul>
          </Card>
        )}

        {(esVaca || ciclos.length > 0) && (
          <Card title="Estrategia reproductiva" icon={<I.Syringe size={20} />} action={<button className="btn soft" onClick={() => setModal('ciclo')}><I.Plus size={14} /> Nueva</button>} className="g-estrategia">
            {ciclo ? (
              <>
                <div className="pills">
                  {ciclos.map((c) => <button key={c.id} className={c.id === ciclo.id ? 'on' : ''} onClick={() => setCicloSel(c.id)}>{c.label}</button>)}
                </div>
                <Timeline i={i} ciclo={ciclo} prevista={L.fechaPrevistaParto(ciclo, cfg.gestacionDias)} />
                <div className="row-actions">
                  <button className="btn soft" onClick={() => setModal('ciclo-edit')}><I.Edit size={14} /> Editar ciclo</button>
                  <button className="btn ghost danger" onClick={() => confirm(`¿Eliminar "${ciclo.label}"?`) && (A.deleteCiclo(ciclo.id), setCicloSel(undefined))}>Eliminar</button>
                </div>
                <details className="more"><summary>Historial reproductivo ({ciclos.length} ciclos)</summary>
                  <div className="table-wrap"><table className="tbl"><thead><tr><th>Ciclo</th><th>Método</th><th>Fecha</th><th>Semental / toro</th><th>Resultado</th></tr></thead><tbody>
                    {[...ciclos].reverse().map((c) => (
                      <tr key={c.id} className="click" onClick={() => setCicloSel(c.id)}>
                        <td>{c.label}</td><td>{c.metodo === 'Monta natural' ? 'Monta' : 'IA'}</td><td>{fmtDate(c.ia?.fecha ?? c.monta?.entrada)}</td>
                        <td>{c.ia?.sementalId ? i.semental.get(c.ia.sementalId)?.name : c.monta?.toroId ? i.animal.get(c.monta.toroId)?.name : '—'}</td><td>{L.resultadoCiclo(c)}</td>
                      </tr>
                    ))}
                  </tbody></table></div>
                </details>
              </>
            ) : <Empty>Esta vaca aún no tiene ciclos reproductivos. Pulsa «Nueva» para registrar CIDR, retirada, prostaglandina, inseminación y diagnóstico.</Empty>}
          </Card>
        )}

        <Card title="Genealogía" icon={<I.Tree size={20} />} action={<button className="btn soft" onClick={() => go('genealogia', a.id)}>Árbol completo <I.Chevron size={14} /></button>} className="g-gen">
          <Pedigree i={i} root={L.nodoAnimal(i, a)} generations={3} />
        </Card>

        <Card title="Descendencia" icon={<I.Cow size={20} />} className="g-desc">
          {hijos.length > 0 && (
            <div className="chips-stats">
              <span><b>{desc.total}</b> hijos</span><span><b>{desc.machos}</b> machos</span><span><b>{desc.hembras}</b> hembras</span>
              <span><b>{desc.vivos}</b> vivos</span><span><b>{desc.reposicion}</b> reposición</span><span><b>{desc.vendidos}</b> vendidos</span><span><b>{desc.bajas}</b> de baja</span>
            </div>
          )}
          <DescTable i={i} hijos={hijos} />
        </Card>

        {a.sex === 'M' && hijos.length > 0 && (
          <Card title="Información de su descendencia" icon={<I.Pulse size={20} />} className="g-toro">
            <ul className="kv">
              <li><span>Número de hijos / hijas</span><b>{desc.machos} / {desc.hembras}</b></li>
              <li><span>Partos producidos</span><b>{desc.partos}</b></li>
              <li><span>Peso medio al nacimiento</span><b>{fmtNum(desc.pesoNac, 1, 'kg')}</b></li>
              <li><span>Peso medio al destete</span><b>{fmtNum(desc.pesoDestete, 0, 'kg')}</b></li>
              <li><span>Facilidad de parto de sus hijas (0-10)</span><b>{desc.facilidadHijas === undefined ? 'Datos insuficientes' : fmtNum(desc.facilidadHijas, 1)}</b></li>
              <li><span>Descendientes usados como reproductores</span><b>{desc.reproductores}</b></li>
            </ul>
          </Card>
        )}

        <Card title="Sanidad" icon={<I.Cross size={20} />} action={<button className="btn soft" onClick={() => setModal('sanidad')}><I.Plus size={14} /> Añadir</button>} className="g-san">
          {(i.sanidad.get(a.id) ?? []).length === 0 ? <Empty>Sin actuaciones sanitarias.</Empty> : (
            <ul className="log">
              {(i.sanidad.get(a.id) ?? []).slice(0, 8).map((s) => (
                <li key={s.id}><span>{fmtDate(s.fecha)}</span><div><b>{s.tipo}</b>{s.producto ? ` · ${s.producto}` : ''}{s.obs ? ` – ${s.obs}` : ''}{L.tratamientoActivo(s) && <span className="pill">En curso</span>}{s.proxima && <small> Próxima: {fmtDate(s.proxima)}</small>}</div></li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Valoración del animal" icon={<I.Star size={20} />} className="g-val">
          <p className="notice">Índices internos de la explotación, calculados solo con los datos registrados. <b>No son valores genéticos oficiales.</b></p>
          <ul className="scores">
            {indices.map((x) => <ScoreBar key={x.clave} nombre={x.nombre} valor={x.valor} detalle={x.detalle} destacado={x.clave === 'global'} />)}
          </ul>
          <small className="muted">Pasa el ratón (o mantén pulsado) sobre cada índice para ver cómo se calcula.</small>
        </Card>

        <Card title="Datos físicos y observaciones" icon={<I.Pulse size={20} />} className="g-fis">
          <ul className="kv">
            <li><span>Condición corporal</span><b>{a.condition ? `${a.condition}/5` : '—'}</b></li>
            <li><span>Altura</span><b>{a.height ? `${a.height} cm` : '—'}</b></li>
            <li><span>Observaciones morfológicas</span><b>{a.morfologia ?? '—'}</b></li>
            <li><span>Observaciones</span><b>{a.obs ?? '—'}</b></li>
          </ul>
        </Card>

        <Card title="Fotografías" icon={<I.Camera size={20} />} action={<button className="btn soft" onClick={() => setModal('foto')}><I.Plus size={14} /> Añadir</button>} className="g-fotos">
          {fotos.length === 0 ? <Empty>Sin fotografías.</Empty> : (
            <div className="gallery">
              {fotos.map((p) => (
                <figure key={p.id}>
                  <img src={p.data} alt={p.tipo} />
                  <figcaption>
                    <span>{p.id === a.mainPhotoId ? '★ Principal' : p.tipo}</span>
                    {p.id !== a.mainPhotoId && <button onClick={() => A.setMainPhoto(a.id, p.id)}>Principal</button>}
                    <button onClick={() => confirm('¿Eliminar la fotografía?') && A.deletePhoto(p.id)}>Eliminar</button>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </Card>

        <Card title="Historial" icon={<I.Calendar size={20} />} className="g-hist">
          <ol className="history">
            {(verTodo ? [...hist].reverse() : [...hist].reverse().slice(0, 10)).map((e, k) => (
              <li key={k}><span>{fmtDate(e.fecha)}</span><em>{e.tipo}</em>{e.texto}</li>
            ))}
          </ol>
          {hist.length > 10 && <button className="btn soft" onClick={() => setVerTodo(!verTodo)}>{verTodo ? 'Ver menos' : `Ver todo el historial (${hist.length})`}</button>}
          <small className="muted">Media de peso de la explotación: {fmtNum(avg(i.state.animals.map((x) => L.pesoActual(i, x)?.kg).filter((v): v is number => v !== undefined)), 0, 'kg')}</small>
        </Card>
      </div>

      {modal === 'edit' && <AnimalForm i={i} animal={a} onClose={() => setModal(null)} />}
      {modal === 'peso' && <PesoForm i={i} animal={a} onClose={() => setModal(null)} />}
      {modal === 'ciclo' && <CicloForm i={i} vaca={a} onClose={() => setModal(null)} />}
      {modal === 'ciclo-edit' && ciclo && <CicloForm i={i} vaca={a} ciclo={ciclo} onClose={() => setModal(null)} />}
      {modal === 'parto' && <PartoForm i={i} vacaId={a.id} onClose={() => setModal(null)} onSaved={(id) => verAnimal(id)} />}
      {modal === 'sanidad' && <SanidadForm i={i} animalId={a.id} onClose={() => setModal(null)} />}
      {modal === 'foto' && <FotoSheet i={i} animal={a} onClose={() => setModal(null)} />}
      {modal === 'baja' && <BajaForm i={i} animal={a} onClose={() => setModal(null)} />}
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { avisos, herdStats, initialAnimals } from './data'
import type { Animal, Category } from './data'
import { ageLabel, fmtDate } from './util'
import * as I from './components/Icons'
import WeightChart from './components/WeightChart'
import Donut from './components/Donut'
import Modal from './components/Modal'
import type { ModalKind } from './components/Modal'

const STORAGE_KEY = 'ganaderia-demo-v1'
const FILTERS: { label: string; cat?: Category }[] = [
  { label: 'Todas' },
  { label: 'Vacas', cat: 'Vaca' },
  { label: 'Toros', cat: 'Toro' },
  { label: 'Novillas', cat: 'Novilla' },
  { label: 'Terneros', cat: 'Ternero' },
]
const NAV = [
  { label: 'Mi Ganadería', icon: I.Home },
  { label: 'Mis Animales', icon: I.Cow },
  { label: 'Reproducción', icon: I.Heart },
  { label: 'Catálogo de Sementales', icon: I.Book },
  { label: 'Genealogía', icon: I.Tree },
  { label: 'Pesajes y Producción', icon: I.Scale },
  { label: 'Sanidad', icon: I.Cross },
  { label: 'Estadísticas', icon: I.Pie },
  { label: 'Configuración', icon: I.Gear },
]
const BOTTOM = ['Inicio', 'Animales', 'Reproducción', 'Genealogía', 'Producción', 'Sanidad', 'Estadísticas']
const AVISO_ICON: Record<string, (p: { size?: number }) => JSX.Element> = {
  calendar: I.Calendar,
  syringe: I.Syringe,
  drops: I.Drops,
}

function load(): Animal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Animal[]
  } catch {
    /* sin almacenamiento: usamos los datos de ejemplo */
  }
  return initialAnimals
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function Avatar({ animal, photo, size = 52 }: { animal: Animal; photo?: string; size?: number }) {
  if (photo) return <img className="avatar" style={{ width: size, height: size }} src={photo} alt={animal.name} />
  return (
    <span className={`avatar ph ${animal.sex === 'M' ? 'male' : ''}`} style={{ width: size, height: size }}>
      <I.Cow size={size * 0.7} />
    </span>
  )
}

const SexMark = ({ sex }: { sex: 'F' | 'M' }) => (
  <span className={sex === 'F' ? 'sex f' : 'sex m'} title={sex === 'F' ? 'Hembra' : 'Macho'}>
    {sex === 'F' ? '♀' : '♂'}
  </span>
)

export default function App() {
  const [animals, setAnimals] = useState<Animal[]>(load)
  const [selectedId, setSelectedId] = useState(animals[0]?.id ?? '')
  const [filter, setFilter] = useState(0)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<ModalKind | null>(null)
  const [section, setSection] = useState('Mi Ganadería')
  const [photos, setPhotos] = useState<Record<string, string>>({})
  const [toast, setToast] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const genealogyRef = useRef<HTMLElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(animals))
    } catch {
      /* ignorar */
    }
  }, [animals])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const list = useMemo(() => {
    const cat = FILTERS[filter].cat
    const q = query.trim().toLowerCase()
    return animals.filter(
      (a) =>
        (!cat || a.category === cat) &&
        (!q || a.name.toLowerCase().includes(q) || a.crotal.toLowerCase().includes(q)),
    )
  }, [animals, filter, query])

  const animal = animals.find((a) => a.id === selectedId) ?? animals[0]
  const update = (fn: (a: Animal) => Animal) =>
    setAnimals((all) => all.map((a) => (a.id === animal.id ? fn(a) : a)))

  const handleSubmit = (v: Record<string, string>) => {
    if (modal === 'peso') {
      update((a) => ({
        ...a,
        weights: [...a.weights, { date: v.date, kg: Number(v.kg) }].sort((x, y) => x.date.localeCompare(y.date)),
      }))
      setToast('Peso registrado')
    } else if (modal === 'tratamiento') {
      update((a) => ({ ...a, health: [{ date: v.date, text: v.text }, ...a.health].sort((x, y) => y.date.localeCompare(x.date)) }))
      setToast('Tratamiento añadido')
    } else if (modal === 'parto') {
      update((a) => ({
        ...a,
        offspring: [{ name: v.name, sex: v.sex as 'Macho' | 'Hembra', birth: v.date }, ...a.offspring],
        repro: a.repro ? { ...a.repro, state: 'Reproductora', nextBirth: '—' } : a.repro,
        tags: a.tags.filter((t) => t !== 'Gestante'),
        statusTag: 'Reproductora',
      }))
      setToast('Parto registrado')
    } else if (modal === 'estrategia') {
      const d = v.date
      update((a) => ({
        ...a,
        strategy: {
          title: `Estrategia reproductiva (Ciclo ${d.slice(0, 4)})`,
          steps: [
            { label: 'CIDR', date: d, done: false },
            { label: 'Retirada', date: addDays(d, 8), done: false },
            { label: 'PG', date: addDays(d, 8), done: false },
            { label: 'IA', date: addDays(d, 10), done: false },
            { label: 'Diag.', date: addDays(d, 25), done: false },
          ],
        },
      }))
      setToast('Estrategia creada')
    }
    setModal(null)
  }

  const toggleStep = (i: number) =>
    update((a) =>
      a.strategy
        ? { ...a, strategy: { ...a.strategy, steps: a.strategy.steps.map((s, j) => (j === i ? { ...s, done: !s.done } : s)) } }
        : a,
    )

  const onPhoto = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPhotos((p) => ({ ...p, [animal.id]: String(reader.result) }))
    reader.readAsDataURL(file)
    setToast('Fotografía añadida (solo en esta sesión de la maqueta)')
  }

  const resetDemo = () => {
    setAnimals(initialAnimals)
    setSelectedId(initialAnimals[0].id)
    setToast('Datos de ejemplo restaurados')
  }

  const lastWeight = animal.weights[animal.weights.length - 1]
  const goSection = (s: string) => setSection(s)
  const home = section === 'Mi Ganadería' || section === 'Mis Animales'

  const quick: { label: string; icon: (p: { size?: number }) => JSX.Element; run: () => void }[] = [
    { label: 'Añadir peso', icon: I.Scale, run: () => setModal('peso') },
    { label: 'Registrar parto', icon: I.Cow, run: () => setModal('parto') },
    { label: 'Nueva estrategia reproductiva', icon: I.Calendar, run: () => setModal('estrategia') },
    { label: 'Añadir tratamiento', icon: I.Cross, run: () => setModal('tratamiento') },
    { label: 'Añadir fotografía', icon: I.Camera, run: () => fileRef.current?.click() },
    { label: 'Ver genealogía', icon: I.Tree, run: () => genealogyRef.current?.scrollIntoView({ behavior: 'smooth' }) },
  ]

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <I.CowOutline size={96} />
          <strong>Mi Ganadería</strong>
          <span>Limusín</span>
        </div>
        <nav>
          {NAV.map((n) => (
            <button key={n.label} className={section === n.label ? 'active' : ''} onClick={() => goSection(n.label)}>
              <n.icon size={20} />
              {n.label}
            </button>
          ))}
        </nav>
        <p className="motto">Crianza hoy,<br />calidad mañana</p>
      </aside>

      <main className="main">
        <header className="hero">
          <div>
            <h1>Mi Ganadería</h1>
            <p>Explotación de vacuno de carne</p>
          </div>
          <div className="stats">
            <div><I.Cow size={34} /><b>{herdStats.vacas}</b><span>Vacas</span></div>
            <div><I.Cow size={34} /><b>{herdStats.toros}</b><span>Toros</span></div>
            <div><I.Cow size={34} /><b>{herdStats.novillas}</b><span>Novillas</span></div>
            <div><I.Cow size={34} /><b>{herdStats.terneros}</b><span>Terneros</span></div>
            <div className="hl"><I.Scale size={30} /><b>{herdStats.tasaPartos} %</b><span>Tasa de partos</span></div>
          </div>
          <div className="hero-icons">
            <button aria-label="Avisos" onClick={() => setToast('Tienes 5 avisos pendientes')}><I.Bell size={22} /><i className="dot" /></button>
            <button aria-label="Perfil" onClick={resetDemo} title="Restaurar datos de ejemplo"><I.User size={24} /></button>
          </div>
        </header>

        {!home ? (
          <section className="card soon">
            <h2>{section}</h2>
            <p>Sección en preparación. Esta maqueta solo muestra la página de inicio.</p>
            <button className="btn primary" onClick={() => goSection('Mi Ganadería')}>Volver al inicio</button>
          </section>
        ) : (
          <div className="grid">
            <section className="card list">
              <h2>Mis Animales</h2>
              <label className="search">
                <I.Search size={16} />
                <input placeholder="Buscar por crotal o nombre…" value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
              <div className="chips">
                {FILTERS.map((f, i) => (
                  <button key={f.label} className={i === filter ? 'on' : ''} onClick={() => setFilter(i)}>
                    {f.label}
                  </button>
                ))}
              </div>
              <ul>
                {list.length === 0 && <li className="muted pad">Sin resultados.</li>}
                {list.map((a) => (
                  <li key={a.id}>
                    <button className={`row ${a.id === animal.id ? 'sel' : ''}`} onClick={() => setSelectedId(a.id)}>
                      <Avatar animal={a} photo={photos[a.id]} size={50} />
                      <span className="info">
                        <b>
                          {a.category === 'Vaca' ? `Vaca ${a.num} – ${a.name}` : a.name} <SexMark sex={a.sex} />
                        </b>
                        <small>{a.crotal}</small>
                        <small>
                          {lastWeightOf(a)} kg · {a.statusTag}
                        </small>
                      </span>
                      <I.Chevron size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card detail">
              <div className="photo">
                <Avatar animal={animal} photo={photos[animal.id]} size={200} />
                <button className="cam" aria-label="Añadir fotografía" onClick={() => fileRef.current?.click()}>
                  <I.Camera size={18} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
              </div>
              <div className="facts">
                <div className="title">
                  <h2>
                    {animal.category === 'Vaca' ? `Vaca ${animal.num} – ${animal.name}` : animal.name} <SexMark sex={animal.sex} />
                  </h2>
                  <div className="score"><I.Star size={22} /> <b>{animal.score.toString().replace('.', ',')} / 10</b><small>Índices internos</small></div>
                </div>
                <div className="tags">
                  {animal.tags.map((t, i) => (
                    <span key={t} className={`tag ${i === 1 ? 'light' : ''}`}>{t}</span>
                  ))}
                </div>
                <dl>
                  <div><I.Tag size={18} /><dt>Crotal:</dt><dd>{animal.crotal}</dd></div>
                  <div><I.Calendar size={18} /><dt>Nacimiento:</dt><dd>{fmtDate(animal.birth)} ({ageLabel(animal.birth)})</dd></div>
                  <div><I.Scale size={18} /><dt>Peso actual:</dt><dd>{lastWeight ? `${lastWeight.kg} kg` : '—'}</dd></div>
                  <div><I.Pulse size={18} /><dt>Condición corporal:</dt><dd>{animal.condition}/5</dd></div>
                  <div><I.Pin size={18} /><dt>Lote:</dt><dd>{animal.lot}</dd></div>
                </dl>
              </div>
              <div className="breed">
                <h3>Composición racial</h3>
                <Donut breed={animal.breed} />
                <button className="btn soft" onClick={() => setToast('Edición de ficha: pendiente de definir')}>
                  <I.Edit size={14} /> Editar animal
                </button>
              </div>
            </section>

            <section className="card quick">
              <h2>Acciones rápidas</h2>
              {quick.map((q) => (
                <button key={q.label} onClick={q.run}>
                  <span className="ico"><q.icon size={18} /></span>
                  {q.label}
                </button>
              ))}
            </section>

            <section className="card repro">
              <h3><I.Heart size={22} /> Reproducción {animal.repro && <span className="pill">{animal.repro.state}</span>}</h3>
              {animal.repro ? (
                <ul className="kv">
                  <li><I.Calendar size={16} /> Última inseminación: <b>{fmtDate(animal.repro.lastIA)}</b></li>
                  <li><I.Cow size={16} /> Semental: <b>{animal.repro.semen}</b></li>
                  <li><I.Calendar size={16} /> Diagnóstico: <b>{fmtDate(animal.repro.diag)}</b></li>
                  <li><I.Calendar size={16} /> Próximo parto: <b>{fmtDate(animal.repro.nextBirth)}</b></li>
                </ul>
              ) : (
                <p className="muted">{animal.sex === 'M' ? 'Estado: ' + animal.statusTag : 'Sin datos reproductivos.'}</p>
              )}
              <button className="btn soft" onClick={() => setToast('Detalles de reproducción: pendiente de definir')}>
                Ver detalles <I.Chevron size={14} />
              </button>
            </section>

            <section className="card strategy">
              <h3><I.Syringe size={22} /> {animal.strategy ? animal.strategy.title : 'Estrategia reproductiva'}</h3>
              {animal.strategy ? (
                <ol className="steps">
                  {animal.strategy.steps.map((s, i) => (
                    <li key={s.label + i}>
                      <button className={s.done ? 'done' : ''} onClick={() => toggleStep(i)} aria-label={`${s.label}: ${s.done ? 'hecho' : 'pendiente'}`}>
                        {s.done ? <I.Check size={18} /> : <I.Calendar size={18} />}
                      </button>
                      <b>{s.label}</b>
                      <small>{fmtDate(s.date).slice(0, 5)}</small>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="muted">Sin estrategia activa.</p>
              )}
            </section>

            <section className="card weight">
              <div className="head">
                <h3><I.Scale size={22} /> Peso</h3>
                <button className="btn soft" onClick={() => setModal('peso')}><I.Plus size={14} /> Añadir peso</button>
              </div>
              <p className="big">{lastWeight ? `${lastWeight.kg} kg` : '—'}</p>
              {lastWeight && <p className="muted">Último pesaje: {fmtDate(lastWeight.date)}</p>}
              <WeightChart data={animal.weights} />
            </section>

            <section className="card gene" ref={genealogyRef}>
              <div className="head">
                <h3><I.Tree size={22} /> Genealogía</h3>
                <button className="btn soft" onClick={() => setToast('Árbol completo: pendiente de definir')}>Ver árbol completo <I.Chevron size={14} /></button>
              </div>
              <div className="tree">
                <span className="node">{animal.sireParents[0]}</span>
                <span className="node">{animal.sireParents[1]}</span>
                <span className="node self"><I.Cow size={22} /> {animal.category === 'Vaca' ? `Vaca ${animal.num} –` : ''} {animal.name}</span>
                <span className="node">{animal.damParents[0]}</span>
                <span className="node">{animal.damParents[1]}</span>
              </div>
              <p className="muted small">Padre: {animal.sire} · Madre: {animal.dam}</p>
            </section>

            <section className="card offspring">
              <div className="head">
                <h3><I.Cow size={22} /> Descendencia</h3>
                <button className="btn soft" onClick={() => setToast('Listado completo: pendiente de definir')}>Ver todos <I.Chevron size={14} /></button>
              </div>
              {animal.offspring.length === 0 ? (
                <p className="muted">Sin descendencia registrada.</p>
              ) : (
                <div className="calves">
                  {animal.offspring.slice(0, 3).map((c) => (
                    <figure key={c.name + c.birth}>
                      <span className="avatar ph" style={{ width: '100%', height: 84 }}><I.Cow size={46} /></span>
                      <figcaption>
                        <b>{c.name}</b>
                        <small>({c.sex})</small>
                        <small>{fmtDate(c.birth)}</small>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
            </section>

            <section className="card health">
              <div className="head">
                <h3><I.Cross size={22} /> Sanidad</h3>
                <button className="btn soft" onClick={() => setToast('Historial sanitario: pendiente de definir')}>Ver historial <I.Chevron size={14} /></button>
              </div>
              <ul className="log">
                {animal.health.slice(0, 4).map((h, i) => (
                  <li key={h.date + h.text + i}><span>{fmtDate(h.date)}</span>{h.text}</li>
                ))}
                {animal.health.length === 0 && <li className="muted">Sin registros.</li>}
              </ul>
            </section>

            <section className="card avisos">
              <h3><I.Bell size={22} /> Avisos <span className="badge">2</span></h3>
              <ul>
                {avisos.map((a) => {
                  const Ico = AVISO_ICON[a.icon]
                  return (
                    <li key={a.text}><Ico size={20} />{a.text}</li>
                  )
                })}
              </ul>
              <button className="btn soft wide" onClick={() => setToast('Centro de avisos: pendiente de definir')}>
                Ver todos los avisos <I.Chevron size={14} />
              </button>
            </section>
          </div>
        )}
      </main>

      <nav className="bottom" aria-label="Navegación principal">
        {BOTTOM.map((b, i) => {
          const icons = [I.Home, I.Cow, I.Heart, I.Tree, I.Scale, I.Cross, I.Pie]
          const Ico = icons[i]
          const target = NAV.find((n) => n.label.includes(b.slice(0, 5)))?.label ?? 'Mi Ganadería'
          const active = i === 0 ? home : section === target
          return (
            <button key={b} className={active ? 'on' : ''} onClick={() => goSection(i === 0 ? 'Mi Ganadería' : target)}>
              <Ico size={22} />
              <span>{b}</span>
            </button>
          )
        })}
      </nav>

      {modal && <Modal kind={modal} animalName={animal.name} onClose={() => setModal(null)} onSubmit={handleSubmit} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

function lastWeightOf(a: Animal): number | string {
  return a.weights.length ? a.weights[a.weights.length - 1].kg : '—'
}

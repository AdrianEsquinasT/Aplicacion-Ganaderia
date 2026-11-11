import { useEffect, useState } from 'react'
import * as I from './components/Icons'
import { Toast } from './components/ui'
import { fotoAnimal } from './logic'
import { go, useRoute } from './router'
import type { Screen } from './router'
import Animales, { Bajas, Lotes } from './screens/Animales'
import Catalogo from './screens/Catalogo'
import Config from './screens/Config'
import Estadisticas from './screens/Estadisticas'
import Genealogia from './screens/Genealogia'
import Inicio, { HeroStats } from './screens/Inicio'
import Resumen from './screens/Resumen'
import * as L from './logic'
import Produccion from './screens/Produccion'
import Reproduccion from './screens/Reproduccion'
import Sanidad from './screens/Sanidad'
import { initStore, useIndex } from './store'

const NAV: { s: Screen; label: string; icon: (p: { size?: number }) => JSX.Element }[] = [
  { s: 'inicio', label: 'Mi Ganadería', icon: I.Home },
  { s: 'resumen', label: 'Mi Resumen', icon: I.Pulse },
  { s: 'animales', label: 'Mis Animales', icon: I.Cow },
  { s: 'reproduccion', label: 'Reproducción', icon: I.Heart },
  { s: 'catalogo', label: 'Catálogo de Sementales', icon: I.Book },
  { s: 'genealogia', label: 'Genealogía', icon: I.Tree },
  { s: 'produccion', label: 'Producción', icon: I.Scale },
  { s: 'sanidad', label: 'Sanidad', icon: I.Cross },
  { s: 'estadisticas', label: 'Estadísticas', icon: I.Pie },
  { s: 'config', label: 'Configuración', icon: I.Gear },
]
const BOTTOM: { s: Screen; label: string; short?: string; icon: (p: { size?: number }) => JSX.Element }[] = [
  { s: 'inicio', label: 'Inicio', icon: I.Home },
  { s: 'resumen', label: 'Resumen', icon: I.Pulse },
  { s: 'animales', label: 'Animales', icon: I.Cow },
  { s: 'reproduccion', label: 'Reproducción', short: 'Repro.', icon: I.Heart },
  { s: 'genealogia', label: 'Genealogía', short: 'Árbol', icon: I.Tree },
  { s: 'produccion', label: 'Producción', short: 'Pesos', icon: I.Scale },
  { s: 'sanidad', label: 'Sanidad', icon: I.Cross },
  { s: 'estadisticas', label: 'Estadísticas', short: 'Datos', icon: I.Pie },
]
const grupo = (s: Screen): Screen => (s === 'lotes' || s === 'bajas' ? 'animales' : s)

function Shell() {
  const i = useIndex()
  const r = useRoute()
  const cfg = i.state.config
  const logo = fotoAnimal(i, { mainPhotoId: cfg.logoPhotoId })
  const act = grupo(r.screen)
  const nAvisos = L.avisos(i).length

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          {logo ? <img src={logo} alt="" /> : <I.CowOutline size={96} />}
          <strong>{cfg.nombre}</strong>
          <span>{cfg.localizacion}</span>
        </div>
        <nav>
          {NAV.map((n) => (
            <button key={n.s} className={act === n.s ? 'active' : ''} onClick={() => go(n.s)}><n.icon size={20} />{n.label}</button>
          ))}
        </nav>
        <p className="motto">Crianza hoy,<br />calidad mañana</p>
      </aside>

      <main className="main">
        <header className="hero">
          <div>
            <h1>{r.screen === 'inicio' ? cfg.nombre.toUpperCase() : NAV.find((n) => n.s === act)?.label}</h1>
            <p>{r.screen === 'inicio' ? `Explotación de vacuno${cfg.localizacion ? ' · ' + cfg.localizacion : ''}` : cfg.nombre}</p>
          </div>
          {r.screen === 'inicio' && <HeroStats i={i} />}
          <div className="hero-icons">
            <button aria-label={`Avisos (${nAvisos})`} onClick={() => go('sanidad')}><I.Bell size={22} />{nAvisos > 0 && <i className="dot">{nAvisos > 9 ? '9+' : nAvisos}</i>}</button>
            <button aria-label="Configuración" onClick={() => go('config')}><I.Gear size={22} /></button>
          </div>
        </header>

        <>
            {r.screen === 'inicio' && <Inicio i={i} />}
            {r.screen === 'resumen' && <Resumen i={i} />}
            {r.screen === 'animales' && <Animales i={i} id={r.id} />}
            {r.screen === 'lotes' && <Lotes i={i} />}
            {r.screen === 'bajas' && <Bajas i={i} />}
            {r.screen === 'reproduccion' && <Reproduccion i={i} />}
            {r.screen === 'catalogo' && <Catalogo i={i} id={r.id} />}
            {r.screen === 'genealogia' && <Genealogia i={i} id={r.id} />}
            {r.screen === 'produccion' && <Produccion i={i} />}
            {r.screen === 'sanidad' && <Sanidad i={i} />}
            {r.screen === 'estadisticas' && <Estadisticas i={i} />}
            {r.screen === 'config' && <Config i={i} />}
        </>
      </main>

      <nav className="bottom" aria-label="Navegación principal">
        {BOTTOM.map((b) => (
          <button key={b.s} className={act === b.s ? 'on' : ''} onClick={() => go(b.s)}><b.icon size={22} /><span className="l-full">{b.label}</span><span className="l-short">{b.short ?? b.label}</span></button>
        ))}
      </nav>
      <Toast />
    </div>
  )
}

export default function App() {
  const [listo, setListo] = useState(false)
  useEffect(() => {
    void initStore().then(() => setListo(true))
  }, [])
  if (!listo) return <div className="loading">Cargando…</div>
  return <Shell />
}

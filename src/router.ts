import { useEffect, useState } from 'react'

export type Screen = 'inicio' | 'animales' | 'lotes' | 'bajas' | 'reproduccion' | 'catalogo' | 'genealogia' | 'produccion' | 'sanidad' | 'estadisticas' | 'config'
const SCREENS: Screen[] = ['inicio', 'animales', 'lotes', 'bajas', 'reproduccion', 'catalogo', 'genealogia', 'produccion', 'sanidad', 'estadisticas', 'config']

export interface Route {
  screen: Screen
  id?: string
}

function read(): Route {
  const [, s, id] = window.location.hash.split('/')
  const screen = SCREENS.includes(s as Screen) ? (s as Screen) : 'inicio'
  return { screen, id: id ? decodeURIComponent(id) : undefined }
}

export function go(screen: Screen, id?: string) {
  window.location.hash = `#/${screen}${id ? '/' + encodeURIComponent(id) : ''}`
}
export const verAnimal = (id: string) => go('animales', id)

export function useRoute(): Route {
  const [r, setR] = useState<Route>(read)
  useEffect(() => {
    const f = () => {
      setR(read())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return r
}

// Cálculos sobre praderas, ubicaciones y movimientos. Nada de esto se guarda: sale de los movimientos.
import * as L from './logic'
import type { Aviso, Index } from './logic'
import type { Animal, EstadoUbicacion, Labor, Movimiento, Ubicacion } from './types'
import { daysBetween, today } from './util'

const PASTO = ['Pradera propia', 'Pradera comunal', 'Monte']
/** Las praderas, comunales y montes se pastorean y rotan; las naves y patios no. */
export const esPasto = (u: Ubicacion) => PASTO.includes(u.tipo)

export const diasMov = (m: Movimiento, ref = today()) => Math.max(0, daysBetween(m.entrada, m.salida ?? ref))

/** Ubicación actual de un animal = su movimiento sin salida. */
export function movimientoAbierto(i: Index, animalId: string): Movimiento | undefined {
  const l = i.movAnimal.get(animalId) ?? []
  for (let k = l.length - 1; k >= 0; k--) if (!l[k].salida) return l[k]
  return undefined
}
export function ubicacionActual(i: Index, a: Animal): { mov: Movimiento; ub?: Ubicacion } | undefined {
  const mov = movimientoAbierto(i, a.id)
  return mov ? { mov, ub: i.ubic.get(mov.ubicacionId) } : undefined
}

export function presentes(i: Index, ubId: string): { a: Animal; mov: Movimiento }[] {
  const out: { a: Animal; mov: Movimiento }[] = []
  for (const m of i.movUbic.get(ubId) ?? []) {
    if (m.salida) continue
    const a = i.animal.get(m.animalId)
    if (a && !L.isBaja(i, a)) out.push({ a, mov: m })
  }
  return out.sort((x, y) => x.mov.entrada.localeCompare(y.mov.entrada))
}

export type EstadoEfectivo = 'Ocupada' | EstadoUbicacion
export function estadoEfectivo(i: Index, u: Ubicacion): EstadoEfectivo {
  if (u.estado === 'No pastable') return 'No pastable'
  return presentes(i, u.id).length ? 'Ocupada' : u.estado
}

/** Pastoreo: días desde la última salida. Si hay animales ahora, no hay descanso. */
export function descanso(i: Index, u: Ubicacion, ref = today()) {
  if (presentes(i, u.id).length) return { ocupada: true as const }
  const salidas = (i.movUbic.get(u.id) ?? []).map((m) => m.salida).filter((x): x is string => !!x).sort()
  const ultimaSalida = salidas[salidas.length - 1]
  return { ocupada: false as const, ultimaSalida, dias: ultimaSalida ? daysBetween(ultimaSalida, ref) : undefined }
}

export interface Uso {
  clave: string
  entrada: string
  salida?: string
  horaEntrada?: string
  animales: Animal[]
  lote?: string
  dias: number
  obs?: string
}
/** Estancias agrupadas por operación (los animales que entraron y salieron juntos son un solo uso). */
export function usosPastoreo(i: Index, ubId: string, ref = today()): Uso[] {
  const g = new Map<string, Uso>()
  for (const m of i.movUbic.get(ubId) ?? []) {
    const a = i.animal.get(m.animalId)
    if (!a) continue
    const clave = `${m.grupoId ?? m.id}|${m.salida ?? ''}`
    const u = g.get(clave)
    if (u) u.animales.push(a)
    else g.set(clave, { clave, entrada: m.entrada, salida: m.salida, horaEntrada: m.horaEntrada, animales: [a], lote: m.loteNombre, dias: diasMov(m, ref), obs: m.obs })
  }
  return [...g.values()].sort((x, y) => y.entrada.localeCompare(x.entrada))
}

/** Días con al menos un animal en [desde, hasta): días transcurridos, sin contar dos veces los solapes. */
function diasOcupados(movs: Movimiento[], desde: string, hasta: string, ref: string): number {
  const tramos = movs
    .map((m) => [m.entrada, m.salida ?? ref] as const)
    .filter(([e, s]) => e < hasta && s > desde)
    .map(([e, s]) => [e < desde ? desde : e, s > hasta ? hasta : s] as [string, string])
    .sort((x, y) => x[0].localeCompare(y[0]))
  let total = 0
  let fin = ''
  for (const [e, s] of tramos) {
    if (!fin || e >= fin) {
      total += daysBetween(e, s)
      fin = s
    } else if (s > fin) {
      total += daysBetween(fin, s)
      fin = s
    }
  }
  return total
}

export function diasTotalesOcupacion(i: Index, ubId: string, ref = today()): number {
  const l = i.movUbic.get(ubId) ?? []
  if (!l.length) return 0
  return diasOcupados(l, l[0].entrada, ref, ref)
}

export function laboresAprovechamiento(i: Index, ubId: string): Labor[] {
  return (i.labores.get(ubId) ?? []).filter((x) => ['Siega', 'Heno', 'Silo'].includes(x.tipo))
}

export function ultimoAprovechamiento(i: Index, u: Ubicacion, ref = today()): { fecha?: string; tipo?: string } {
  const pastoreo = presentes(i, u.id).length ? ref : descanso(i, u, ref).ultimaSalida
  const l = laboresAprovechamiento(i, u.id)[0]
  if (l && (!pastoreo || l.fecha > pastoreo)) return { fecha: l.fecha, tipo: l.tipo }
  return pastoreo ? { fecha: pastoreo, tipo: 'Pastoreo' } : {}
}

/** Carga orientativa. NO indica cuántos animales admite la parcela: eso exige datos técnicos. */
export function carga(i: Index, u: Ubicacion) {
  const pr = presentes(i, u.id)
  const ha = u.superficieAprovechable ?? u.superficieTotal
  const base = u.superficieAprovechable ? ('aprovechable' as const) : u.superficieTotal ? ('total' as const) : undefined
  const pesos = pr.map((x) => L.pesoActual(i, x.a)?.kg)
  const todosConPeso = pr.length > 0 && pesos.every((p) => p !== undefined)
  const kg = todosConPeso ? (pesos as number[]).reduce((a, b) => a + b, 0) : undefined
  return {
    animales: pr.length,
    ha,
    base,
    porHa: ha && pr.length ? pr.length / ha : undefined,
    kgVivoHa: ha && kg ? kg / ha : undefined,
    sinPeso: pr.length > 0 && !todosConPeso,
  }
}

export const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/** Para cada pradera y mes del año: días de ocupación y lotes que pasaron. */
export function calendario(i: Index, anio: number, ref = today()) {
  const filas = i.state.ubicaciones.filter(esPasto).map((u) => {
    const movs = i.movUbic.get(u.id) ?? []
    const meses = MESES.map((_, k) => {
      const desde = `${anio}-${String(k + 1).padStart(2, '0')}-01`
      const hasta = k === 11 ? `${anio + 1}-01-01` : `${anio}-${String(k + 2).padStart(2, '0')}-01`
      const dentro = movs.filter((m) => m.entrada < hasta && (m.salida ?? ref) > desde)
      const lotes = new Set<string>()
      for (const m of dentro) {
        if (m.loteNombre) lotes.add(m.loteNombre)
        else {
          const a = i.animal.get(m.animalId)
          const l = a?.loteId ? i.lote.get(a.loteId)?.name : undefined
          if (l) lotes.add(l)
        }
      }
      return { dias: diasOcupados(movs, desde, hasta, ref), lotes: [...lotes], animales: new Set(dentro.map((m) => m.animalId)).size }
    })
    return { u, meses }
  })
  return filas
}

export function avisosUbicaciones(i: Index, ref = today()): Aviso[] {
  const cfg = i.state.config
  const maxOcup = cfg.diasAvisoOcupacion ?? 30
  const minDesc = cfg.diasDescansoMin ?? 30
  const out: Aviso[] = []
  for (const u of i.state.ubicaciones) {
    const pr = presentes(i, u.id)
    const v = i.visitas.get(u.id)?.[0]
    if (esPasto(u) && pr.length) {
      const dias = Math.max(...pr.map((x) => diasMov(x.mov, ref)))
      if (dias >= maxOcup) out.push({ tipo: 'pradera', texto: `Llevan ${dias} días en ${u.nombre}`, fecha: undefined, urgente: dias >= maxOcup * 1.5 })
    }
    if (esPasto(u) && !pr.length && u.estado !== 'No pastable') {
      const d = descanso(i, u, ref)
      if (!d.ocupada && d.dias !== undefined && d.dias < minDesc) out.push({ tipo: 'pradera', texto: `${u.nombre}: en descanso (${d.dias} de ${minDesc} días)` })
    }
    if (v?.cierre === 'Necesita revisión') out.push({ tipo: 'pradera', texto: `Revisar cierre: ${u.nombre}`, fecha: v.fecha })
    if (v?.agua === false && pr.length) out.push({ tipo: 'pradera', texto: `Revisar agua: ${u.nombre} (hay animales y no hay agua)`, fecha: v.fecha, urgente: true })
  }
  return out
}

/** Avisos de salud y reproducción + los de praderas. */
export function avisosTodos(i: Index, ref = today()): Aviso[] {
  // los urgentes primero; después, por fecha (los que no tienen fecha, al final)
  return [...L.avisos(i, ref), ...avisosUbicaciones(i, ref)].sort((a, b) => Number(!!b.urgente) - Number(!!a.urgente) || (a.fecha ?? '9').localeCompare(b.fecha ?? '9'))
}

export function nombreUbicacion(i: Index, id?: string): string {
  const u = id ? i.ubic.get(id) : undefined
  return u ? u.nombre : '—'
}

/** Días acumulados de un animal en cada ubicación (historial de praderas). */
export function diasPorUbicacion(i: Index, animalId: string, ref = today()): { ub?: Ubicacion; dias: number }[] {
  const m = new Map<string, number>()
  for (const x of i.movAnimal.get(animalId) ?? []) m.set(x.ubicacionId, (m.get(x.ubicacionId) ?? 0) + diasMov(x, ref))
  return [...m].map(([id, dias]) => ({ ub: i.ubic.get(id), dias })).sort((a, b) => b.dias - a.dias)
}

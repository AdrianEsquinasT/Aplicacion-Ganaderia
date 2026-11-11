// Todo lo que se CALCULA a partir de los datos registrados. Nada de esto se guarda.
import type { Animal, BreedShare, Category, Ciclo, Parto, Pesaje, Photo, Ref, Sanidad, Semental, State, Baja, Lote } from './types'
import { addDays, avg, clamp, daysBetween, fmtDate, monthsBetween, today, year } from './util'

export interface Index {
  state: State
  animal: Map<string, Animal>
  semental: Map<string, Semental>
  photo: Map<string, Photo>
  lote: Map<string, Lote>
  pesajes: Map<string, Pesaje[]> // por animal, orden cronológico
  ciclos: Map<string, Ciclo[]> // por vaca, orden cronológico
  partoDeCria: Map<string, Parto>
  hijos: Map<string, Animal[]> // por id de madre/padre (animal) o semental
  sanidad: Map<string, Sanidad[]> // por animal, más reciente primero
  baja: Map<string, Baja>
  nPartos: Map<string, number>
}

function push<T>(m: Map<string, T[]>, k: string, v: T) {
  const a = m.get(k)
  if (a) a.push(v)
  else m.set(k, [v])
}

export function cicloStart(c: Ciclo): string {
  return c.cidr?.fecha ?? c.retirada?.fecha ?? c.pg?.fecha ?? c.ia?.fecha ?? c.monta?.entrada ?? c.diag?.fecha ?? '0000-00-00'
}

export function buildIndex(s: State): Index {
  const animal = new Map(s.animals.map((a) => [a.id, a]))
  const pesajes = new Map<string, Pesaje[]>()
  for (const p of s.pesajes) push(pesajes, p.animalId, p)
  for (const l of pesajes.values()) l.sort((a, b) => a.fecha.localeCompare(b.fecha))
  const ciclos = new Map<string, Ciclo[]>()
  for (const c of s.ciclos) push(ciclos, c.vacaId, c)
  for (const l of ciclos.values()) l.sort((a, b) => cicloStart(a).localeCompare(cicloStart(b)))
  const partoDeCria = new Map(s.partos.map((p) => [p.calfId, p]))
  const hijos = new Map<string, Animal[]>()
  const nPartos = new Map<string, number>()
  for (const a of s.animals) {
    if (a.dam) push(hijos, a.dam, a)
    if (a.sire) push(hijos, a.sire.id, a)
    if (a.dam && partoDeCria.has(a.id)) nPartos.set(a.dam, (nPartos.get(a.dam) ?? 0) + 1)
  }
  for (const l of hijos.values()) l.sort((a, b) => a.birth.localeCompare(b.birth))
  const sanidad = new Map<string, Sanidad[]>()
  for (const x of s.sanidad) push(sanidad, x.animalId, x)
  for (const l of sanidad.values()) l.sort((a, b) => b.fecha.localeCompare(a.fecha))
  return {
    state: s,
    animal,
    semental: new Map(s.sementales.map((x) => [x.id, x])),
    photo: new Map(s.photos.map((p) => [p.id, p])),
    lote: new Map(s.lotes.map((l) => [l.id, l])),
    pesajes,
    ciclos,
    partoDeCria,
    hijos,
    sanidad,
    baja: new Map(s.bajas.map((b) => [b.animalId, b])),
    nPartos,
  }
}

// ---------- animal ----------
export const isBaja = (i: Index, a: Animal) => i.baja.has(a.id)

export function partosTotal(i: Index, a: Animal): number {
  return (i.nPartos.get(a.id) ?? 0) + (a.partosPrevios ?? 0)
}

export function categoria(i: Index, a: Animal, ref = today()): Category {
  const m = monthsBetween(a.birth, ref)
  if (m < 12) return 'Ternero'
  if (a.sex === 'M') return 'Toro'
  return partosTotal(i, a) > 0 ? 'Vaca' : 'Novilla'
}

export function pesoActual(i: Index, a: Animal): Pesaje | undefined {
  const l = i.pesajes.get(a.id)
  return l?.[l.length - 1]
}
export function pesoTipo(i: Index, id: string, tipo: Pesaje['tipo']): Pesaje | undefined {
  return i.pesajes.get(id)?.find((p) => p.tipo === tipo)
}

export const numero = (a: Animal) => a.num || a.crotal.slice(-3)
export function etiqueta(i: Index, a: Animal): string {
  const c = categoria(i, a)
  const n = c === 'Ternero' ? (a.sex === 'F' ? 'Ternera' : 'Ternero') : c
  return `${n} ${numero(a)}${a.name ? ' – ' + a.name : ''}`
}

export function fotoAnimal(i: Index, a: { mainPhotoId?: string }): string | undefined {
  return a.mainPhotoId ? i.photo.get(a.mainPhotoId)?.data : undefined
}

// ---------- progenitores y genealogía ----------
export interface PNode {
  kind: 'animal' | 'semental' | 'texto' | 'vacio'
  animal?: Animal
  semental?: Semental
  label: string
  sub?: string
  sire?: Ref
  dam?: string
  sireName?: string
  damName?: string
}

export function nodoAnimal(i: Index, a: Animal): PNode {
  return { kind: 'animal', animal: a, label: etiqueta(i, a), sub: `${a.crotal} · ${a.breed}`, sire: a.sire, dam: a.dam }
}
export function nodoRef(i: Index, r?: Ref): PNode {
  if (!r) return { kind: 'vacio', label: 'Información no registrada' }
  if (r.kind === 'animal') {
    const a = i.animal.get(r.id)
    return a ? nodoAnimal(i, a) : { kind: 'vacio', label: 'Información no registrada' }
  }
  const s = i.semental.get(r.id)
  return s
    ? { kind: 'semental', semental: s, label: `Semental ${s.name}`, sub: s.officialId ?? s.breed, sireName: s.sireName, damName: s.damName }
    : { kind: 'vacio', label: 'Información no registrada' }
}
export function nodoMadre(i: Index, id?: string): PNode {
  return nodoRef(i, id ? { kind: 'animal', id } : undefined)
}
/** [padre, madre] de un nodo. Los sementales solo conocen sus padres como texto informativo. */
export function progenitores(i: Index, n: PNode): [PNode, PNode] {
  if (n.kind === 'animal') return [nodoRef(i, n.sire), nodoMadre(i, n.dam)]
  if (n.kind === 'semental') {
    const t = (x?: string): PNode => (x ? { kind: 'texto', label: x } : { kind: 'vacio', label: 'Información no registrada' })
    return [t(n.sireName), t(n.damName)]
  }
  return [{ kind: 'vacio', label: 'Información no registrada' }, { kind: 'vacio', label: 'Información no registrada' }]
}

export function hijosDe(i: Index, id: string): Animal[] {
  return i.hijos.get(id) ?? []
}

// ---------- composición racial (calculada, no es una certificación oficial) ----------
function merge(a: BreedShare[], b: BreedShare[]): BreedShare[] {
  const m = new Map<string, number>()
  for (const x of a) m.set(x.breed, (m.get(x.breed) ?? 0) + x.pct / 2)
  for (const x of b) m.set(x.breed, (m.get(x.breed) ?? 0) + x.pct / 2)
  return [...m].map(([breed, pct]) => ({ breed, pct })).sort((x, y) => y.pct - x.pct)
}
export function composicion(i: Index, a: Animal, depth = 0): { shares: BreedShare[]; calculada: boolean } {
  if (a.compositionManual?.length) return { shares: a.compositionManual, calculada: false }
  if (depth < 5 && a.dam && a.sire) {
    const dam = i.animal.get(a.dam)
    const sireA = a.sire.kind === 'animal' ? i.animal.get(a.sire.id) : undefined
    const sireS = a.sire.kind === 'semental' ? i.semental.get(a.sire.id) : undefined
    if (dam && (sireA || sireS)) {
      const ds = composicion(i, dam, depth + 1).shares
      const ss = sireA ? composicion(i, sireA, depth + 1).shares : [{ breed: sireS!.breed, pct: 100 }]
      return { shares: merge(ds, ss), calculada: true }
    }
  }
  return { shares: [{ breed: a.breed, pct: 100 }], calculada: false }
}
export function razaPrincipal(shares: BreedShare[]): string {
  return shares[0]?.breed ?? ''
}

// ---------- reproducción ----------
export type EstadoRepro = 'Gestante' | 'Vacía' | 'Pendiente de diagnóstico' | 'Seca' | 'En protocolo'
export type ResultadoCiclo = 'Parto' | 'Aborto' | 'Gestante' | 'Vacía' | 'Dudosa' | 'Pendiente de diagnóstico' | 'En protocolo'

export function resultadoCiclo(c: Ciclo): ResultadoCiclo {
  if (c.partoId) return 'Parto'
  if (c.aborto) return 'Aborto'
  if (c.diag) return c.diag.resultado === 'Dudosa' ? 'Pendiente de diagnóstico' : c.diag.resultado
  if (c.ia || c.monta) return 'Pendiente de diagnóstico'
  return 'En protocolo'
}

export function fechaPrevistaParto(c: Ciclo, gest: number): string | undefined {
  if (c.fechaPrevista) return c.fechaPrevista
  if (c.ia?.fecha) return addDays(c.ia.fecha, gest)
  if (c.monta?.entrada) {
    const e = c.monta.entrada
    const s = c.monta.salida
    return addDays(s ? addDays(e, Math.round(daysBetween(e, s) / 2)) : e, gest)
  }
  return undefined
}

export function ultimoCiclo(i: Index, id: string): Ciclo | undefined {
  const l = i.ciclos.get(id)
  return l?.[l.length - 1]
}

export function estadoRepro(i: Index, a: Animal): EstadoRepro | undefined {
  const c = categoria(i, a)
  if (a.sex !== 'F' || (c !== 'Vaca' && c !== 'Novilla')) return undefined
  if (a.seca) return 'Seca'
  const u = ultimoCiclo(i, a.id)
  if (!u) return 'Vacía'
  const r = resultadoCiclo(u)
  if (r === 'Gestante') return 'Gestante'
  if (r === 'Pendiente de diagnóstico') return 'Pendiente de diagnóstico'
  if (r === 'En protocolo') return 'En protocolo'
  return 'Vacía'
}

export function proximoParto(i: Index, a: Animal): string | undefined {
  const u = ultimoCiclo(i, a.id)
  if (!u || resultadoCiclo(u) !== 'Gestante') return undefined
  return fechaPrevistaParto(u, i.state.config.gestacionDias)
}

export function ultimoParto(i: Index, a: Animal): Animal | undefined {
  return (i.hijos.get(a.id) ?? []).filter((h) => h.dam === a.id && i.partoDeCria.has(h.id)).slice(-1)[0]
}

export function intervaloPartos(i: Index, a: Animal): number | undefined {
  const f = (i.hijos.get(a.id) ?? []).filter((h) => h.dam === a.id && i.partoDeCria.has(h.id)).map((h) => h.birth)
  if (f.length < 2) return undefined
  const ds: number[] = []
  for (let k = 1; k < f.length; k++) ds.push(daysBetween(f[k - 1], f[k]))
  return avg(ds)
}

export function nAbortos(i: Index, a: Animal): number {
  return (i.ciclos.get(a.id) ?? []).filter((c) => c.aborto).length
}

// ---------- índices internos (NO son valores genéticos oficiales) ----------
export interface IndiceInterno {
  clave: string
  nombre: string
  valor: number | null // 0-10; null = datos insuficientes
  detalle: string
}
const FAC: Record<string, number> = { Fácil: 10, Normal: 8, Difícil: 4, 'Muy difícil': 2 }
export const facScore = (p: Parto): number => (p.tipo === 'Cesárea' ? 2 : (FAC[p.facilidad] ?? 8))

function mediaHerd(i: Index, fn: (a: Animal) => number | undefined): number | undefined {
  return avg(i.state.animals.map(fn).filter((x): x is number => x !== undefined))
}
function pesoDestetesCrias(i: Index, a: Animal): number[] {
  return (i.hijos.get(a.id) ?? [])
    .filter((h) => h.dam === a.id)
    .map((h) => pesoTipo(i, h.id, 'destete')?.kg)
    .filter((x): x is number => x !== undefined)
}

export function indicesInternos(i: Index, a: Animal): IndiceInterno[] {
  const out: IndiceInterno[] = []
  const interval = intervaloPartos(i, a)
  const ciclos = (i.ciclos.get(a.id) ?? []).filter((c) => c.diag)
  let fert: number | null = null
  let fertD = 'Necesita al menos 2 partos o ciclos con diagnóstico'
  if (interval !== undefined) {
    fert = clamp(10 - (interval - 365) / 15, 1, 10)
    fertD = `Intervalo medio entre partos: ${Math.round(interval)} días`
  } else if (ciclos.length >= 2) {
    const g = ciclos.filter((c) => c.diag?.resultado === 'Gestante').length
    fert = (g / ciclos.length) * 10
    fertD = `${g} de ${ciclos.length} ciclos con diagnóstico gestante`
  }
  out.push({ clave: 'fertilidad', nombre: 'Fertilidad', valor: fert, detalle: fertD })

  const facs = (i.hijos.get(a.id) ?? [])
    .filter((h) => h.dam === a.id)
    .map((h) => i.partoDeCria.get(h.id))
    .filter((p): p is Parto => !!p)
    .map(facScore)
  out.push({
    clave: 'facilidad',
    nombre: 'Facilidad de parto',
    valor: facs.length ? avg(facs)! : null,
    detalle: facs.length ? `${facs.length} partos registrados` : 'Sin partos registrados',
  })

  const dest = pesoDestetesCrias(i, a)
  const herdDest = mediaHerd(i, (x) => avg(pesoDestetesCrias(i, x)))
  let apt: number | null = null
  if (dest.length && herdDest) apt = clamp(5 + ((avg(dest)! - herdDest) / herdDest) * 25, 1, 10)
  out.push({
    clave: 'materna',
    nombre: 'Aptitud materna',
    valor: apt,
    detalle: dest.length ? `Peso medio al destete de sus crías: ${Math.round(avg(dest)!)} kg (media de la explotación: ${Math.round(herdDest ?? 0)} kg)` : 'Sin pesos al destete de sus crías',
  })

  const gmd = (h: Animal) => {
    const n = pesoTipo(i, h.id, 'nacimiento')
    const d = pesoTipo(i, h.id, 'destete')
    return n && d && d.fecha > n.fecha ? ((d.kg - n.kg) / daysBetween(n.fecha, d.fecha)) * 1000 : undefined
  }
  const gm = (x: Animal) =>
    avg((i.hijos.get(x.id) ?? []).filter((h) => h.dam === x.id).map(gmd).filter((v): v is number => v !== undefined))
  const mine = gm(a)
  const herdG = mediaHerd(i, gm)
  out.push({
    clave: 'produccion',
    nombre: 'Producción de los terneros',
    valor: mine !== undefined && herdG ? clamp(5 + ((mine - herdG) / herdG) * 25, 1, 10) : null,
    detalle: mine !== undefined ? `Ganancia diaria media de sus crías: ${Math.round(mine)} g/día` : 'Sin pesos de nacimiento y destete de sus crías',
  })

  const np = partosTotal(i, a)
  out.push({
    clave: 'longevidad',
    nombre: 'Longevidad',
    valor: np > 0 ? clamp((np / 8) * 10, 1, 10) : null,
    detalle: np > 0 ? `${np} partos (referencia: 8 partos = 10)` : 'Aún sin partos',
  })

  const lim = new Date()
  lim.setFullYear(lim.getFullYear() - 2)
  const limIso = lim.toISOString().slice(0, 10)
  const inc = (i.sanidad.get(a.id) ?? []).filter((x) => ['Enfermedad', 'Incidencia', 'Cirugía'].includes(x.tipo) && x.fecha >= limIso).length
  out.push({
    clave: 'sanidad',
    nombre: 'Sanidad',
    valor: clamp(10 - inc * 1.5, 1, 10),
    detalle: `${inc} incidencias sanitarias en los últimos 2 años`,
  })

  out.push({
    clave: 'manejo',
    nombre: 'Comportamiento / manejabilidad',
    valor: a.manejabilidad ?? null,
    detalle: a.manejabilidad ? 'Valor introducido por la ganadera' : 'Sin valorar (se introduce en Editar animal)',
  })

  const vals = out.map((x) => x.valor).filter((x): x is number => x !== null)
  out.push({
    clave: 'global',
    nombre: 'Valoración global',
    valor: vals.length >= 2 ? avg(vals)! : null,
    detalle: vals.length >= 2 ? `Media de ${vals.length} índices con datos` : 'Datos insuficientes',
  })
  return out
}

// ---------- sanidad / avisos ----------
export function tratamientoActivo(x: Sanidad, ref = today()): boolean {
  return x.tipo === 'Tratamiento' && !!x.duracionDias && addDays(x.fecha, x.duracionDias) >= ref && x.fecha <= ref
}
export function finTratamiento(x: Sanidad): string | undefined {
  return x.duracionDias ? addDays(x.fecha, x.duracionDias) : undefined
}

export interface Aviso {
  tipo: 'parto' | 'vacuna' | 'desparasitacion' | 'revision' | 'sin-gestar' | 'incidencia' | 'decision' | 'tratamiento'
  texto: string
  animalId?: string
  fecha?: string
  urgente?: boolean
}

export function avisos(i: Index, ref = today()): Aviso[] {
  const cfg = i.state.config
  const lim = addDays(ref, cfg.avisoDias)
  const out: Aviso[] = []
  const activos = i.state.animals.filter((a) => !isBaja(i, a))
  for (const a of activos) {
    const pp = proximoParto(i, a)
    if (pp && pp <= lim) out.push({ tipo: 'parto', texto: `Parto previsto: ${etiqueta(i, a)}`, animalId: a.id, fecha: pp, urgente: pp <= addDays(ref, 15) })
    // vacas que llevan demasiado tiempo sin quedar gestantes
    if (categoria(i, a) === 'Vaca' && estadoRepro(i, a) !== 'Gestante' && estadoRepro(i, a) !== 'Seca') {
      const up = ultimoParto(i, a)
      if (up && daysBetween(up.birth, ref) > cfg.diasSinGestar) {
        out.push({ tipo: 'sin-gestar', texto: `${etiqueta(i, a)}: ${daysBetween(up.birth, ref)} días desde el parto sin gestar`, animalId: a.id })
      }
    }
    // decisión reposición/descarte
    const cs = (i.ciclos.get(a.id) ?? []).slice(-2)
    if (categoria(i, a) === 'Vaca' && cs.length === 2 && cs.every((c) => resultadoCiclo(c) === 'Vacía')) {
      out.push({ tipo: 'decision', texto: `${etiqueta(i, a)}: 2 ciclos vacíos seguidos, valorar descarte`, animalId: a.id })
    }
    if (categoria(i, a) === 'Novilla' && !a.destino && monthsBetween(a.birth, ref) >= 18) {
      out.push({ tipo: 'decision', texto: `${etiqueta(i, a)}: decidir reposición o venta`, animalId: a.id })
    }
    for (const x of i.sanidad.get(a.id) ?? []) {
      if (tratamientoActivo(x, ref)) out.push({ tipo: 'tratamiento', texto: `${etiqueta(i, a)}: tratamiento en curso (${x.producto ?? x.obs ?? 'sin detalle'}), termina el ${fmtDate(finTratamiento(x))}`, animalId: a.id, fecha: finTratamiento(x) })
      if ((x.tipo === 'Enfermedad' || x.tipo === 'Incidencia') && daysBetween(x.fecha, ref) <= 30 && daysBetween(x.fecha, ref) >= 0) {
        out.push({ tipo: 'incidencia', texto: `${etiqueta(i, a)}: ${x.tipo.toLowerCase()} (${x.obs ?? x.producto ?? 'sin detalle'})`, animalId: a.id, fecha: x.fecha })
      }
    }
    // próximas actuaciones: solo se avisa de la última de cada tipo (si no, repetiría las antiguas)
    const vistos = new Set<string>()
    for (const x of i.sanidad.get(a.id) ?? []) {
      if (vistos.has(x.tipo)) continue
      vistos.add(x.tipo)
      if (!x.proxima || x.proxima > lim) continue
      const tipo = x.tipo === 'Vacunación' ? 'vacuna' : x.tipo.startsWith('Desparasitación') ? 'desparasitacion' : x.tipo === 'Revisión' ? 'revision' : undefined
      if (!tipo) continue
      const etq = tipo === 'vacuna' ? 'Vacuna' : tipo === 'desparasitacion' ? 'Desparasitación' : 'Revisión'
      out.push({ tipo, texto: `${etq} pendiente: ${etiqueta(i, a)}`, animalId: a.id, fecha: x.proxima, urgente: x.proxima < ref })
    }
  }
  return out.sort((a, b) => (a.fecha ?? '9').localeCompare(b.fecha ?? '9'))
}

// ---------- estadísticas ----------
export function activos(i: Index): Animal[] {
  return i.state.animals.filter((a) => !isBaja(i, a))
}

export function resumenRebano(i: Index) {
  const act = activos(i)
  const cat = (c: Category) => act.filter((a) => categoria(i, a) === c).length
  return {
    total: act.length,
    vacas: cat('Vaca'),
    toros: cat('Toro'),
    novillas: cat('Novilla'),
    terneros: cat('Ternero'),
    venta: act.filter((a) => a.destino === 'Venta').length,
    reposicion: act.filter((a) => a.destino === 'Reposición').length,
  }
}

export function vacasReproductoras(i: Index): Animal[] {
  return activos(i).filter((a) => categoria(i, a) === 'Vaca')
}

export interface FiltroProd {
  year?: number
  vacaId?: string
  toroRef?: string // id de toro o semental
  sex?: 'F' | 'M'
  loteId?: string
  raza?: string
}

/** Terneros (hijos con parto registrado) que cumplen el filtro. */
export function crias(i: Index, f: FiltroProd = {}): Animal[] {
  return i.state.animals.filter((c) => {
    if (!i.partoDeCria.has(c.id)) return false
    if (f.year && year(c.birth) !== f.year) return false
    if (f.vacaId && c.dam !== f.vacaId) return false
    if (f.toroRef && c.sire?.id !== f.toroRef) return false
    if (f.sex && c.sex !== f.sex) return false
    if (f.loteId && c.loteId !== f.loteId) return false
    if (f.raza && c.breed !== f.raza) return false
    return true
  })
}

/** Ganancia diaria (g/día) entre los dos últimos pesajes. */
export function gananciaDiaria(i: Index, id: string): number | undefined {
  const l = i.pesajes.get(id)
  if (!l || l.length < 2) return undefined
  const a = l[l.length - 2]
  const b = l[l.length - 1]
  const d = daysBetween(a.fecha, b.fecha)
  return d > 0 ? ((b.kg - a.kg) / d) * 1000 : undefined
}

export function statsProduccion(i: Index, f: FiltroProd = {}) {
  const cs = crias(i, f)
  const nac = cs.map((c) => pesoTipo(i, c.id, 'nacimiento')?.kg).filter((x): x is number => x !== undefined)
  const dest = cs.map((c) => pesoTipo(i, c.id, 'destete')?.kg).filter((x): x is number => x !== undefined)
  const gmd = cs
    .map((c) => {
      const n = pesoTipo(i, c.id, 'nacimiento')
      const d = pesoTipo(i, c.id, 'destete')
      return n && d && d.fecha > n.fecha ? ((d.kg - n.kg) / daysBetween(n.fecha, d.fecha)) * 1000 : undefined
    })
    .filter((x): x is number => x !== undefined)
  const sexo = (s: 'F' | 'M') => avg(cs.filter((c) => c.sex === s).map((c) => pesoTipo(i, c.id, 'destete')?.kg).filter((x): x is number => x !== undefined))
  return {
    n: cs.length,
    nacimiento: avg(nac),
    destete: avg(dest),
    gmd: avg(gmd),
    destetePorSexo: { F: sexo('F'), M: sexo('M') },
    kgTotalDestete: dest.reduce((a, b) => a + b, 0),
  }
}

export function kgTerneroPorVaca(i: Index, y: number): number | undefined {
  const cows = vacasReproductoras(i).length
  if (!cows) return undefined
  const s = statsProduccion(i, { year: y })
  return s.kgTotalDestete ? s.kgTotalDestete / cows : undefined
}

export function mediaPor(i: Index, por: 'padre' | 'madre', f: FiltroProd = {}): { id: string; nombre: string; n: number; destete?: number; nacimiento?: number }[] {
  const g = new Map<string, Animal[]>()
  for (const c of crias(i, f)) {
    const k = por === 'padre' ? c.sire?.id : c.dam
    if (k) push(g, k, c)
  }
  return [...g].map(([id, cs]) => ({
    id,
    nombre: por === 'madre' ? (i.animal.get(id) ? etiqueta(i, i.animal.get(id)!) : id) : (i.animal.get(id) ? etiqueta(i, i.animal.get(id)!) : `Semental ${i.semental.get(id)?.name ?? id}`),
    n: cs.length,
    destete: avg(cs.map((c) => pesoTipo(i, c.id, 'destete')?.kg).filter((x): x is number => x !== undefined)),
    nacimiento: avg(cs.map((c) => pesoTipo(i, c.id, 'nacimiento')?.kg).filter((x): x is number => x !== undefined)),
  }))
}

export function statsRepro(i: Index, y?: number) {
  const cows = vacasReproductoras(i)
  const estados = cows.map((a) => estadoRepro(i, a))
  const ciclos = i.state.ciclos.filter((c) => !y || year(cicloStart(c)) === y)
  const cub = ciclos.filter((c) => c.ia || c.monta)
  const conDiag = cub.filter((c) => c.diag && c.diag.resultado !== 'Dudosa')
  const gest = conDiag.filter((c) => c.diag!.resultado === 'Gestante')
  const partos = i.state.partos.filter((p) => {
    const c = i.animal.get(p.calfId)
    return c && (!y || year(c.birth) === y)
  })
  // Tasa de partos: de las cubriciones con resultado ya conocido (parto, aborto o vacía),
  // el % que terminó en parto.
  const cerradas = cub.filter((c) => c.partoId || c.aborto || c.diag?.resultado === 'Vacía')
  const ints = cows.map((a) => intervaloPartos(i, a)).filter((x): x is number => x !== undefined)
  // Edad al primer parto: solo vacas cuyo primer parto está registrado en la aplicación
  const prim = i.state.animals
    .filter((a) => a.sex === 'F' && !a.partosPrevios)
    .map((a) => {
      const h = (i.hijos.get(a.id) ?? []).filter((x) => x.dam === a.id && i.partoDeCria.has(x.id))[0]
      return h ? monthsBetween(a.birth, h.birth) : undefined
    })
    .filter((x): x is number => x !== undefined)
  return {
    gestantes: estados.filter((e) => e === 'Gestante').length,
    vacias: estados.filter((e) => e === 'Vacía').length,
    pendientes: estados.filter((e) => e === 'Pendiente de diagnóstico').length,
    tasaGestacion: conDiag.length ? (gest.length / conDiag.length) * 100 : undefined,
    tasaPartos: cerradas.length ? (cerradas.filter((c) => c.partoId).length / cerradas.length) * 100 : undefined,
    intervalo: avg(ints),
    abortos: ciclos.filter((c) => c.aborto).length,
    cubriciones: cub.length,
    asistidos: partos.filter((p) => p.tipo !== 'Normal').length,
    partos: partos.length,
    edadPrimerParto: avg(prim),
    partosPorVaca: avg(cows.map((a) => partosTotal(i, a))),
    proximos: cows
      .map((a) => ({ a, f: proximoParto(i, a) }))
      .filter((x): x is { a: Animal; f: string } => !!x.f)
      .sort((x, z) => x.f.localeCompare(z.f)),
  }
}

export function seriePorAnio<T>(i: Index, fn: (y: number) => T, desde?: number): { year: number; v: T }[] {
  const ys = new Set<number>()
  for (const a of i.state.animals) ys.add(year(a.birth))
  for (const c of i.state.ciclos) ys.add(year(cicloStart(c)))
  const arr = [...ys].filter((y) => y > 1990).sort()
  const y0 = desde ?? arr[0]
  const y1 = Math.max(...arr, year(today()))
  const out: { year: number; v: T }[] = []
  for (let y = y0; y <= y1; y++) out.push({ year: y, v: fn(y) })
  return out
}

/** Eventos de la vida del animal, en orden cronológico (historial). */
export interface Evento {
  fecha: string
  tipo: string
  texto: string
}
export function historial(i: Index, a: Animal): Evento[] {
  const ev: Evento[] = [{ fecha: a.birth, tipo: 'Nacimiento', texto: 'Nacimiento' }]
  const madre = a.dam ? i.animal.get(a.dam) : undefined
  if (madre) ev[0].texto = `Nacimiento (madre: ${etiqueta(i, madre)})`
  if (a.entryDate && a.entryDate !== a.birth) ev.push({ fecha: a.entryDate, tipo: 'Alta', texto: 'Alta en la explotación' })
  for (const p of i.pesajes.get(a.id) ?? []) ev.push({ fecha: p.fecha, tipo: 'Peso', texto: `${p.kg} kg${p.tipo !== 'control' ? ` (${p.tipo})` : ''}` })
  for (const c of i.ciclos.get(a.id) ?? []) {
    const sem = c.ia?.sementalId ? i.semental.get(c.ia.sementalId)?.name : undefined
    if (c.cidr) ev.push({ fecha: c.cidr.fecha, tipo: 'Reproducción', texto: `${c.label}: CIDR colocado` })
    if (c.retirada) ev.push({ fecha: c.retirada.fecha, tipo: 'Reproducción', texto: `${c.label}: CIDR retirado` })
    if (c.pg) ev.push({ fecha: c.pg.fecha, tipo: 'Reproducción', texto: `${c.label}: prostaglandina` })
    if (c.ia) ev.push({ fecha: c.ia.fecha, tipo: 'Reproducción', texto: `${c.label}: inseminación${sem ? ' con ' + sem : ''}` })
    if (c.monta?.entrada) ev.push({ fecha: c.monta.entrada, tipo: 'Reproducción', texto: `${c.label}: monta natural${c.monta.toroId && i.animal.get(c.monta.toroId) ? ' con ' + etiqueta(i, i.animal.get(c.monta.toroId)!) : ''}` })
    if (c.diag?.fecha) ev.push({ fecha: c.diag.fecha, tipo: 'Reproducción', texto: `${c.label}: diagnóstico ${c.diag.resultado.toLowerCase()}` })
    if (c.aborto) ev.push({ fecha: c.aborto.fecha, tipo: 'Reproducción', texto: `${c.label}: aborto` })
  }
  for (const h of i.hijos.get(a.id) ?? []) {
    if (h.dam === a.id && i.partoDeCria.has(h.id)) ev.push({ fecha: h.birth, tipo: 'Parto', texto: `Parto: ${etiqueta(i, h)} (${h.sex === 'M' ? 'macho' : 'hembra'})` })
  }
  for (const s of i.sanidad.get(a.id) ?? []) ev.push({ fecha: s.fecha, tipo: 'Sanidad', texto: `${s.tipo}${s.producto ? ': ' + s.producto : ''}${s.obs ? ' – ' + s.obs : ''}` })
  const b = i.baja.get(a.id)
  if (b) ev.push({ fecha: b.fecha, tipo: 'Baja', texto: `Baja: ${b.motivo}${b.precio ? ' (' + b.precio + ' €)' : ''}` })
  return ev.sort((x, y) => x.fecha.localeCompare(y.fecha))
}

/** Resumen de la descendencia de un animal (padre o madre) o de un semental. */
export function resumenDescendencia(i: Index, id: string) {
  const hs = hijosDe(i, id)
  const conParto = hs.filter((h) => i.partoDeCria.has(h.id))
  const hijas = hs.filter((h) => h.sex === 'F')
  const facHijas = hijas
    .flatMap((h) => (i.hijos.get(h.id) ?? []).filter((c) => c.dam === h.id).map((c) => i.partoDeCria.get(c.id)))
    .filter((p): p is Parto => !!p)
    .map(facScore)
  return {
    total: hs.length,
    machos: hs.filter((h) => h.sex === 'M').length,
    hembras: hijas.length,
    vivos: hs.filter((h) => !isBaja(i, h)).length,
    reposicion: hs.filter((h) => h.destino === 'Reposición' && !isBaja(i, h)).length,
    vendidos: hs.filter((h) => i.baja.get(h.id)?.motivo === 'Venta').length,
    bajas: hs.filter((h) => isBaja(i, h)).length,
    partos: conParto.length,
    pesoNac: avg(hs.map((h) => pesoTipo(i, h.id, 'nacimiento')?.kg).filter((x): x is number => x !== undefined)),
    pesoDestete: avg(hs.map((h) => pesoTipo(i, h.id, 'destete')?.kg).filter((x): x is number => x !== undefined)),
    facilidadHijas: facHijas.length ? avg(facHijas) : undefined,
    reproductores: hs.filter((h) => (h.sex === 'F' && partosTotal(i, h) > 0) || (h.sex === 'M' && categoria(i, h) === 'Toro' && !isBaja(i, h))).length,
  }
}

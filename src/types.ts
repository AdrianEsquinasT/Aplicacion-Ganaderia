// MODELO DE DATOS
// Principio: cada dato vive en UN solo sitio. Lo demás se deriva (ver logic.ts).
//  - Padre/madre se guardan solo en el animal hijo. La descendencia se calcula.
//  - Un parto no guarda madre/padre/sexo/fecha/crotal: se leen del ternero (calfId).
//  - El peso actual es el último pesaje; el peso al nacer/destete son pesajes con tipo.
//  - Un animal dado de baja NO se borra: tiene un registro de baja y sigue en la genealogía.

export type Sex = 'F' | 'M'
export type Category = 'Vaca' | 'Toro' | 'Novilla' | 'Ternero'

/** Referencia a un progenitor: un animal de la explotación o un semental del catálogo. */
export interface Ref {
  kind: 'animal' | 'semental'
  id: string
}

export interface BreedShare {
  breed: string
  pct: number
}

export interface Animal {
  id: string
  crotal: string
  num?: string // número de manejo de la ganadera (ej. 125 en "Vaca 125")
  name: string
  officialId?: string
  sex: Sex
  breed: string // raza declarada (por defecto la de la explotación)
  compositionManual?: BreedShare[] // si se conoce; si no, se calcula de los progenitores
  birth: string // YYYY-MM-DD
  entryDate?: string // fecha de alta en la explotación
  explotacion?: string
  sire?: Ref
  dam?: string // id de animal
  loteId?: string
  destino?: 'Reposición' | 'Venta'
  condition?: number // condición corporal 1-5
  height?: number // cm
  morfologia?: string
  obs?: string
  seca?: boolean
  manejabilidad?: number // 1-10, lo introduce la ganadera
  partosPrevios?: number // partos anteriores a usar la app (sin ternero registrado)
  mainPhotoId?: string
  collarProveedor?: string // preparado para un collar GPS (sin integración todavía)
  collarGps?: string
}

export interface Semental {
  id: string
  name: string
  officialId?: string
  breed: string
  procedencia?: string
  caracteristicas?: string
  genetica?: string
  obs?: string
  sireName?: string // pedigrí informativo
  damName?: string
  photoId?: string
}

export interface Step {
  fecha: string
  hora?: string
  obs?: string
}

export type ResultadoDiag = 'Gestante' | 'Vacía' | 'Dudosa'
export type Metodo = 'Inseminación artificial' | 'Monta natural'

/** Un ciclo reproductivo de una vaca (una vaca tiene muchos a lo largo de su vida). */
export interface Ciclo {
  id: string
  vacaId: string
  label: string
  metodo: Metodo
  cidr?: Step
  retirada?: Step
  pg?: Step & { producto?: string; dosis?: string }
  ia?: Step & { sementalId?: string; tipoSemen?: string; tecnico?: string }
  monta?: { toroId?: string; entrada?: string; salida?: string; obs?: string }
  diag?: { fecha?: string; resultado: ResultadoDiag; metodo?: string; obs?: string }
  aborto?: { fecha: string; obs?: string }
  partoId?: string
  fechaPrevista?: string // manual; si no, se calcula
  obs?: string
}

export type TipoParto = 'Normal' | 'Asistido' | 'Cesárea'
export type Facilidad = 'Fácil' | 'Normal' | 'Difícil' | 'Muy difícil'

export interface Parto {
  id: string
  calfId: string // fuente de: madre, padre, sexo, fecha, crotal
  tipo: TipoParto
  facilidad: Facilidad
  incidencias?: string
  estadoMadre?: string
  estadoCria?: string
  obs?: string
  cicloId?: string
}

export interface Pesaje {
  id: string
  animalId: string
  fecha: string
  kg: number
  tipo: 'nacimiento' | 'destete' | 'control'
  obs?: string
}

export const TIPOS_SANIDAD = [
  'Vacunación',
  'Desparasitación interna',
  'Desparasitación externa',
  'Tratamiento',
  'Cirugía',
  'Revisión',
  'Enfermedad',
  'Incidencia',
  'Otro',
] as const
export type TipoSanidad = (typeof TIPOS_SANIDAD)[number]

export interface Sanidad {
  id: string
  animalId: string
  fecha: string
  tipo: TipoSanidad
  producto?: string
  dosis?: string
  duracionDias?: number
  veterinario?: string
  obs?: string
  proxima?: string // próxima vacuna/revisión/desparasitación
}

export interface Lote {
  id: string
  name: string
}

export type MotivoBaja = 'Venta' | 'Muerte' | 'Sacrificio' | 'Otro'
export interface Baja {
  id: string
  animalId: string
  fecha: string
  motivo: MotivoBaja
  precio?: number
  comprador?: string
  obs?: string
}

export type TipoFoto = 'principal' | 'perfil' | 'lateral' | 'identificacion' | 'adicional'
export interface Photo {
  id: string
  ownerId: string // animal, semental, ubicación o 'config'
  fecha?: string // fecha de la foto (para comparar la evolución de una pradera)
  tipo: TipoFoto
  data: string // dataURL ya reducida
}

export interface Config {
  id: 'config'
  nombre: string
  localizacion: string
  breeds: string[]
  razaPorDefecto: string
  gestacionDias: number // para calcular la fecha prevista de parto
  diasSinGestar: number // aviso: días desde el parto sin quedar gestante
  avisoDias: number // ventana de avisos (partos, vacunas...)
  diasAvisoOcupacion?: number // aviso «llevan N días en esta pradera» (por defecto 30)
  diasDescansoMin?: number // días de descanso tras una salida antes de volver a usarla (por defecto 30)
  logoPhotoId?: string
}

// ---------------------------------------------------------------- praderas y ubicaciones
export const TIPOS_UBICACION = ['Pradera propia', 'Pradera comunal', 'Monte', 'Patio', 'Nave', 'Otro'] as const
export type TipoUbicacion = (typeof TIPOS_UBICACION)[number]
export type EstadoUbicacion = 'Disponible' | 'En descanso' | 'Reservada' | 'No pastable'

/** Pradera, monte, patio o nave. «Ocupada» no se guarda: se deduce de los animales presentes. */
export interface Ubicacion {
  id: string
  nombre: string
  tipo: TipoUbicacion
  dentroDe?: string // zona dentro de otra ubicación (p. ej. una zona de los pastos comunales)
  municipio?: string
  provincia?: string
  zona?: string
  poligono?: string
  parcela?: string
  recinto?: string
  superficieTotal?: number // ha
  superficieAprovechable?: number // ha realmente disponibles para el ganado (distinta de la total)
  estado: EstadoUbicacion
  mainPhotoId?: string
  obs?: string
}

export const CALIDADES = ['Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'] as const
export const CANTIDADES = ['Escasa', 'Media', 'Abundante'] as const
export const ESTADOS_PASTO = ['Corto', 'Óptimo', 'Pasado', 'Seco'] as const
export const HUMEDADES = ['Seco', 'Adecuado', 'Húmedo', 'Encharcado'] as const
export const COMPOSICIONES = ['Ray-grass', 'Trébol', 'Poa', 'Llantén', 'Otras'] as const
export const NIVELES = ['Baja', 'Media', 'Alta'] as const
export const SOMBRAS = ['Ninguna', 'Poca', 'Abundante'] as const

/** Valoración del terreno en una visita. La última visita es la valoración actual; el resto, el historial. */
export interface Visita {
  id: string
  ubicacionId: string
  fecha: string
  calidad?: (typeof CALIDADES)[number]
  cantidad?: (typeof CANTIDADES)[number]
  estadoPasto?: (typeof ESTADOS_PASTO)[number]
  humedad?: (typeof HUMEDADES)[number]
  composicion?: string[]
  malasHierbas?: (typeof NIVELES)[number]
  cierre?: 'Bueno' | 'Necesita revisión'
  agua?: boolean
  sombra?: (typeof SOMBRAS)[number]
  obs?: string
}

/** Estancia de UN animal en una ubicación. Sin salida = está ahí ahora. Nunca se borra: es el historial. */
export interface Movimiento {
  id: string
  animalId: string
  ubicacionId: string
  entrada: string
  horaEntrada?: string
  salida?: string
  horaSalida?: string
  obs?: string
  grupoId?: string // los animales movidos en una misma operación comparten grupo
  loteNombre?: string // si se movió un lote completo
}

export const TIPOS_LABOR = ['Siega', 'Heno', 'Silo', 'Desbroce', 'Abonado', 'Resiembra', 'Mantenimiento', 'Otro'] as const
export type TipoLabor = (typeof TIPOS_LABOR)[number]
/** Trabajos y aprovechamientos que no son pastoreo (el pastoreo sale de los movimientos). */
export interface Labor {
  id: string
  ubicacionId: string
  fecha: string
  tipo: TipoLabor
  produccionKg?: number // forraje producido, si se conoce
  obs?: string
}

export interface State {
  ubicaciones: Ubicacion[]
  movimientos: Movimiento[]
  visitas: Visita[]
  labores: Labor[]
  animals: Animal[]
  sementales: Semental[]
  ciclos: Ciclo[]
  partos: Parto[]
  pesajes: Pesaje[]
  sanidad: Sanidad[]
  lotes: Lote[]
  bajas: Baja[]
  photos: Photo[]
  config: Config
}

export const COLLECTIONS = [
  'ubicaciones',
  'movimientos',
  'visitas',
  'labores',
  'animals',
  'sementales',
  'ciclos',
  'partos',
  'pesajes',
  'sanidad',
  'lotes',
  'bajas',
  'photos',
] as const
export type CollectionName = (typeof COLLECTIONS)[number]

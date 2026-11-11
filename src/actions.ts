// Todas las escrituras pasan por aquí. Las relaciones se mantienen automáticamente.
import { buildIndex, composicion, razaPrincipal } from './logic'
import { mutate, getState, replaceState } from './store'
import { makeSeed } from './seed'
import { uid } from './util'
import type { Animal, Baja, Ciclo, Config, Facilidad, Lote, Parto, Pesaje, Photo, Ref, Sanidad, Semental, Sex, State, TipoFoto, TipoParto } from './types'

function upsert<T extends { id: string }>(arr: T[], x: T): T[] {
  return arr.some((y) => y.id === x.id) ? arr.map((y) => (y.id === x.id ? x : y)) : [...arr, x]
}

export interface NuevoAnimal {
  animal: Animal
  photo?: string
  pesoInicial?: { fecha: string; kg: number }
}

export const A = {
  /** Crea o edita un animal. Padre/madre se guardan solo aquí; el resto se deriva. */
  saveAnimal(a: Animal, photo?: string) {
    mutate((s) => {
      let photos = s.photos
      let animal = a
      if (photo) {
        const p: Photo = { id: uid(), ownerId: a.id, tipo: 'principal', data: photo }
        photos = [...photos, p]
        animal = { ...a, mainPhotoId: p.id }
      }
      return { ...s, animals: upsert(s.animals, animal), photos }
    })
  },

  addPesaje(p: Omit<Pesaje, 'id'>) {
    mutate((s) => ({ ...s, pesajes: [...s.pesajes, { ...p, id: uid() }] }))
  },
  deletePesaje(id: string) {
    mutate((s) => ({ ...s, pesajes: s.pesajes.filter((p) => p.id !== id) }))
  },

  saveCiclo(c: Ciclo) {
    mutate((s) => ({ ...s, ciclos: upsert(s.ciclos, c) }))
  },
  deleteCiclo(id: string) {
    mutate((s) => ({
      ...s,
      ciclos: s.ciclos.filter((c) => c.id !== id),
      partos: s.partos.map((p) => (p.cicloId === id ? { ...p, cicloId: undefined } : p)),
    }))
  },

  saveSanidad(x: Sanidad) {
    mutate((s) => ({ ...s, sanidad: upsert(s.sanidad, x) }))
  },
  deleteSanidad(id: string) {
    mutate((s) => ({ ...s, sanidad: s.sanidad.filter((x) => x.id !== id) }))
  },

  saveSemental(x: Semental, photo?: string) {
    mutate((s) => {
      let photos = s.photos
      let sem = x
      if (photo) {
        const p: Photo = { id: uid(), ownerId: x.id, tipo: 'principal', data: photo }
        photos = [...photos.filter((f) => f.id !== x.photoId), p]
        sem = { ...x, photoId: p.id }
      }
      return { ...s, sementales: upsert(s.sementales, sem), photos }
    })
  },

  saveLote(l: Lote) {
    mutate((s) => ({ ...s, lotes: upsert(s.lotes, l) }))
  },
  deleteLote(id: string) {
    mutate((s) => ({
      ...s,
      lotes: s.lotes.filter((l) => l.id !== id),
      animals: s.animals.map((a) => (a.loteId === id ? { ...a, loteId: undefined } : a)),
    }))
  },

  /** Baja: el animal NO se borra; sigue en genealogía e historial. */
  darDeBaja(b: Omit<Baja, 'id'>) {
    mutate((s) => ({ ...s, bajas: [...s.bajas.filter((x) => x.animalId !== b.animalId), { ...b, id: uid() }] }))
  },
  reactivar(animalId: string) {
    mutate((s) => ({ ...s, bajas: s.bajas.filter((b) => b.animalId !== animalId) }))
  },

  addPhoto(ownerId: string, tipo: TipoFoto, data: string, principal = false) {
    mutate((s) => {
      const p: Photo = { id: uid(), ownerId, tipo, data }
      const hasMain = s.animals.find((a) => a.id === ownerId)?.mainPhotoId
      const setMain = principal || !hasMain
      return {
        ...s,
        photos: [...s.photos, p],
        animals: s.animals.map((a) => (a.id === ownerId && setMain ? { ...a, mainPhotoId: p.id } : a)),
        sementales: s.sementales.map((x) => (x.id === ownerId && (principal || !x.photoId) ? { ...x, photoId: p.id } : x)),
        config: ownerId === 'config' ? { ...s.config, logoPhotoId: p.id } : s.config,
      }
    })
  },
  setMainPhoto(animalId: string, photoId: string) {
    mutate((s) => ({ ...s, animals: s.animals.map((a) => (a.id === animalId ? { ...a, mainPhotoId: photoId } : a)) }))
  },
  deletePhoto(id: string) {
    mutate((s) => {
      const ph = s.photos.find((p) => p.id === id)
      if (!ph) return s
      const rest = s.photos.filter((p) => p.id !== id)
      const next = rest.find((p) => p.ownerId === ph.ownerId)?.id
      return {
        ...s,
        photos: rest,
        animals: s.animals.map((a) => (a.mainPhotoId === id ? { ...a, mainPhotoId: next } : a)),
        sementales: s.sementales.map((x) => (x.photoId === id ? { ...x, photoId: next } : x)),
        config: s.config.logoPhotoId === id ? { ...s.config, logoPhotoId: undefined } : s.config,
      }
    })
  },

  saveConfig(c: Config) {
    mutate((s) => ({ ...s, config: c }))
  },

  /**
   * Registrar un parto: crea el ternero y lo enlaza con madre y padre, guarda el peso
   * al nacer, cierra el ciclo reproductivo y (si nace muerto) registra la baja.
   * Devuelve el id del ternero.
   */
  registrarParto(inp: {
    damId: string
    fecha: string
    sire?: Ref
    sex: Sex
    crotal: string
    num?: string
    name?: string
    pesoNac?: number
    tipo: TipoParto
    facilidad: Facilidad
    incidencias?: string
    estadoMadre?: string
    estadoCria?: string
    obs?: string
    cicloId?: string
    photo?: string
  }): string {
    const calfId = uid()
    mutate((s) => {
      const dam = s.animals.find((a) => a.id === inp.damId)
      if (!dam) return s
      // ciclo asociado: el indicado o el último abierto de la madre
      const abiertos = s.ciclos.filter((c) => c.vacaId === dam.id && !c.partoId && !c.aborto && (c.ia || c.monta))
      const ciclo = s.ciclos.find((c) => c.id === inp.cicloId) ?? abiertos[abiertos.length - 1]
      let sire = inp.sire
      if (!sire && ciclo?.ia?.sementalId) sire = { kind: 'semental', id: ciclo.ia.sementalId }
      if (!sire && ciclo?.monta?.toroId) sire = { kind: 'animal', id: ciclo.monta.toroId }
      const loteTerneros = s.lotes.find((l) => l.name.toLowerCase() === 'terneros')?.id
      let calf: Animal = {
        id: calfId,
        crotal: inp.crotal,
        num: inp.num,
        name: inp.name ?? '',
        sex: inp.sex,
        breed: dam.breed,
        birth: inp.fecha,
        entryDate: inp.fecha,
        explotacion: dam.explotacion,
        sire,
        dam: dam.id,
        loteId: loteTerneros,
      }
      const photos = inp.photo ? [{ id: uid(), ownerId: calfId, tipo: 'principal' as TipoFoto, data: inp.photo }] : []
      if (photos[0]) calf = { ...calf, mainPhotoId: photos[0].id }
      const parto: Parto = {
        id: uid(),
        calfId,
        tipo: inp.tipo,
        facilidad: inp.facilidad,
        incidencias: inp.incidencias,
        estadoMadre: inp.estadoMadre,
        estadoCria: inp.estadoCria,
        obs: inp.obs,
        cicloId: ciclo?.id,
      }
      const pesajes = inp.pesoNac ? [...s.pesajes, { id: uid(), animalId: calfId, fecha: inp.fecha, kg: inp.pesoNac, tipo: 'nacimiento' as const }] : s.pesajes
      const bajas = inp.estadoCria === 'Nacido muerto' ? [...s.bajas, { id: uid(), animalId: calfId, fecha: inp.fecha, motivo: 'Muerte' as const, obs: 'Nacido muerto' }] : s.bajas
      let next: State = {
        ...s,
        animals: [...s.animals, calf],
        partos: [...s.partos, parto],
        pesajes,
        bajas,
        photos: [...s.photos, ...photos],
        ciclos: ciclo ? s.ciclos.map((c) => (c.id === ciclo.id ? { ...c, partoId: parto.id } : c)) : s.ciclos,
      }
      // la raza del ternero se calcula a partir de sus progenitores
      const idx = buildIndex(next)
      const raza = razaPrincipal(composicion(idx, calf).shares)
      if (raza && raza !== calf.breed) next = { ...next, animals: next.animals.map((a) => (a.id === calfId ? { ...a, breed: raza } : a)) }
      return next
    })
    return calfId
  },

  exportJSON(): string {
    return JSON.stringify({ version: 2, exportado: new Date().toISOString(), data: getState() })
  },
  async importJSON(text: string) {
    const j = JSON.parse(text)
    const d = j.data as State
    if (!d || !Array.isArray(d.animals) || !d.config) throw new Error('El archivo no es una copia válida')
    await replaceState(d)
  },
  async restaurarDemo() {
    await replaceState(makeSeed())
  },
}

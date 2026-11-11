// Persistencia en IndexedDB (funciona sin conexión). Un almacén por colección,
// con escritura por diferencias: solo se guardan los registros que cambian.
import { COLLECTIONS } from './types'
import type { State } from './types'

const DB_NAME = 'ganaderia-v2'
const STORES = [...COLLECTIONS, 'config'] as const

let dbp: Promise<IDBDatabase> | null = null
function open(): Promise<IDBDatabase> {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        for (const s of STORES) {
          if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s, { keyPath: 'id' })
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbp
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export async function loadState(): Promise<State | null> {
  const db = await open()
  const out: Record<string, unknown[]> = {}
  await Promise.all(
    STORES.map(
      (s) =>
        new Promise<void>((resolve, reject) => {
          const r = db.transaction(s).objectStore(s).getAll()
          r.onsuccess = () => {
            out[s] = r.result
            resolve()
          }
          r.onerror = () => reject(r.error)
        }),
    ),
  )
  if (!out.config.length) return null
  return { ...(out as unknown as Omit<State, 'config'>), config: out.config[0] } as State
}

let chain: Promise<unknown> = Promise.resolve()

/** Guarda solo lo que ha cambiado entre dos estados. Las escrituras van en cola. */
export function persistDiff(prev: State, next: State): Promise<unknown> {
  chain = chain
    .then(async () => {
      const db = await open()
      const names = STORES.filter((s) => (s === 'config' ? prev.config !== next.config : prev[s] !== next[s]))
      if (!names.length) return
      const tx = db.transaction(names, 'readwrite')
      for (const n of names) {
        const store = tx.objectStore(n)
        if (n === 'config') {
          store.put(next.config)
          continue
        }
        const before = new Map((prev[n] as { id: string }[]).map((x) => [x.id, x]))
        const after = next[n] as { id: string }[]
        const seen = new Set<string>()
        for (const rec of after) {
          seen.add(rec.id)
          if (before.get(rec.id) !== rec) store.put(rec)
        }
        for (const id of before.keys()) if (!seen.has(id)) store.delete(id)
      }
      await done(tx)
    })
    .catch((e) => console.error('Error guardando datos', e))
  return chain
}

export async function replaceAll(next: State): Promise<void> {
  const db = await open()
  const tx = db.transaction([...STORES], 'readwrite')
  for (const s of STORES) tx.objectStore(s).clear()
  for (const s of COLLECTIONS) for (const rec of next[s]) tx.objectStore(s).put(rec)
  tx.objectStore('config').put(next.config)
  await done(tx)
}

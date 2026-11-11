import { useSyncExternalStore } from 'react'
import { loadState, persistDiff, replaceAll } from './db'
import { buildIndex } from './logic'
import type { Index } from './logic'
import { makeSeed } from './seed'
import type { State } from './types'

let state: State | null = null
let cache: { s: State; i: Index } | null = null
let persistOk = true
const subs = new Set<() => void>()
const notify = () => subs.forEach((f) => f())

export function storageOk(): boolean {
  return persistOk
}

export async function initStore(): Promise<void> {
  try {
    const s = await loadState()
    if (s) state = s
    else {
      state = makeSeed()
      await replaceAll(state)
    }
  } catch (e) {
    console.error('IndexedDB no disponible: los datos no se guardarán', e)
    persistOk = false
    state = makeSeed()
  }
  notify()
}

export function getState(): State {
  return state as State
}

export function getIndex(): Index {
  const s = getState()
  if (!cache || cache.s !== s) cache = { s, i: buildIndex(s) }
  return cache.i
}

export function mutate(fn: (s: State) => State): void {
  const prev = state as State
  const next = fn(prev)
  if (next === prev) return
  state = next
  notify()
  if (persistOk) void persistDiff(prev, next)
}

export async function replaceState(next: State): Promise<void> {
  if (persistOk) await replaceAll(next)
  state = next
  notify()
}

const subscribe = (f: () => void) => {
  subs.add(f)
  return () => {
    subs.delete(f)
  }
}

/** Devuelve el índice con todas las relaciones; se recalcula solo cuando cambian los datos. */
export function useIndex(): Index {
  useSyncExternalStore(subscribe, getState)
  return getIndex()
}

import type * as React from 'react'
import { progenitores } from '../logic'
import type { Index, PNode } from '../logic'
import { verAnimal, go } from '../router'
import { SexMark } from './ui'

function Node({ n, role, self, i }: { n: PNode; role?: 'M' | 'F'; self?: boolean; i: Index }) {
  const open = () => {
    if (n.animal) verAnimal(n.animal.id)
    else if (n.semental) go('catalogo', n.semental.id)
  }
  const clickable = !!n.animal || !!n.semental
  const cls = `pnode ${n.kind} ${self ? 'self' : ''} ${n.animal && i.baja.has(n.animal.id) ? 'baja' : ''}`
  return (
    <button className={cls} onClick={open} disabled={!clickable} title={clickable ? 'Abrir ficha' : undefined}>
      {role && <small className="role">{role === 'M' ? <><SexMark sex="M" /> Padre</> : <><SexMark sex="F" /> Madre</>}</small>}
      <b>{n.label}</b>
      {n.sub && <small>{n.sub}</small>}
      {n.animal && i.baja.has(n.animal.id) && <small className="baja-tag">Baja</small>}
    </button>
  )
}

function Branch({ n, depth, i, role }: { n: PNode; depth: number; i: Index; role?: 'M' | 'F' }) {
  const [padre, madre] = depth > 0 && n.kind !== 'vacio' && n.kind !== 'texto' ? progenitores(i, n) : [undefined, undefined]
  return (
    <div className="ped">
      {padre && madre && (
        <div className="ped-parents">
          <Branch n={padre} depth={depth - 1} i={i} role="M" />
          <Branch n={madre} depth={depth - 1} i={i} role="F" />
        </div>
      )}
      <Node n={n} i={i} role={role} self={!role} />
    </div>
  )
}

/** Árbol genealógico dinámico: se construye con los campos padre/madre de cada animal. */
export default function Pedigree({ i, root, generations = 3, compact }: { i: Index; root: PNode; generations?: number; compact?: boolean }) {
  return (
    <div className="pedigree-scroll">
      <div className={`pedigree ${compact ? 'compact' : ''}`} style={{ '--n': Math.pow(2, generations - 1) } as React.CSSProperties}>
        <Branch n={root} depth={generations - 1} i={i} />
      </div>
    </div>
  )
}

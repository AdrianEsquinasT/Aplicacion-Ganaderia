import { useState } from 'react'
import { SementalForm } from '../components/forms'
import * as I from '../components/Icons'
import { DescTable } from '../components/Ficha'
import { Card, Empty, Sheet, Toast } from '../components/ui'
import * as L from '../logic'
import type { Index } from '../logic'
import { go } from '../router'
import type { Semental } from '../types'
import { fmtNum } from '../util'

export default function Catalogo({ i, id }: { i: Index; id?: string }) {
  const [edit, setEdit] = useState<Semental | 'nuevo' | null>(null)
  const sel = id ? i.semental.get(id) : undefined
  return (
    <div className="page">
      <Card title="Catálogo de sementales" icon={<I.Book size={20} />} action={<button className="btn primary" onClick={() => setEdit('nuevo')}><I.Plus size={14} /> Nuevo semental</button>}>
        <p className="muted">Sementales cuyo semen se compra para inseminación. Al registrar una inseminación se elige uno de aquí y queda vinculado como padre de la futura cría.</p>
        {i.state.sementales.length === 0 ? <Empty>Aún no hay sementales en el catálogo.</Empty> : (
          <div className="sem-grid">
            {i.state.sementales.map((s) => {
              const f = s.photoId ? i.photo.get(s.photoId)?.data : undefined
              const hijos = L.hijosDe(i, s.id)
              const usos = i.state.ciclos.filter((c) => c.ia?.sementalId === s.id).length
              return (
                <button key={s.id} className="sem-card" onClick={() => go('catalogo', s.id)}>
                  {f ? <img src={f} alt={s.name} /> : <span className="ph-box"><I.Cow size={44} /></span>}
                  <b>{s.name}</b>
                  <small>{s.officialId ?? 'Sin identificación'} · {s.breed}</small>
                  <small>{s.procedencia ?? '—'}</small>
                  <small>{usos} inseminaciones · {hijos.length} hijos nacidos</small>
                </button>
              )
            })}
          </div>
        )}
      </Card>
      {sel && (
        <Sheet title={`Semental ${sel.name}`} sub={sel.officialId} onClose={() => go('catalogo')} wide>
          <div className="sem-detail">
            {sel.photoId && i.photo.get(sel.photoId) && <img src={i.photo.get(sel.photoId)!.data} alt={sel.name} />}
            <ul className="kv">
              <li><span>Raza</span><b>{sel.breed}</b></li><li><span>Procedencia</span><b>{sel.procedencia ?? '—'}</b></li>
              <li><span>Padre / madre</span><b>{sel.sireName ?? '—'} / {sel.damName ?? '—'}</b></li>
              <li><span>Características</span><b>{sel.caracteristicas ?? '—'}</b></li><li><span>Información genética</span><b>{sel.genetica ?? '—'}</b></li><li><span>Observaciones</span><b>{sel.obs ?? '—'}</b></li>
            </ul>
          </div>
          {(() => { const d = L.resumenDescendencia(i, sel.id); return <div className="chips-stats"><span><b>{d.total}</b> hijos</span><span><b>{d.machos}</b> machos</span><span><b>{d.hembras}</b> hembras</span><span>Peso nac. <b>{fmtNum(d.pesoNac, 1, 'kg')}</b></span><span>Destete <b>{fmtNum(d.pesoDestete, 0, 'kg')}</b></span><span>Facilidad de parto de sus hijas <b>{d.facilidadHijas === undefined ? 'sin datos' : fmtNum(d.facilidadHijas, 1)}</b></span></div> })()}
          <DescTable i={i} hijos={L.hijosDe(i, sel.id)} conPadres />
          <div className="form-actions"><button className="btn soft" onClick={() => { setEdit(sel); go('catalogo') }}>Editar</button><span className="grow" /><button className="btn primary" onClick={() => go('catalogo')}>Cerrar</button></div>
        </Sheet>
      )}
      {edit && <SementalForm i={i} semental={edit === 'nuevo' ? undefined : edit} onClose={() => setEdit(null)} />}
      <Toast />
    </div>
  )
}

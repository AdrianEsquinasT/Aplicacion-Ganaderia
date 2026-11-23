import { useRef, useState } from 'react'
import { A } from '../actions'
import * as I from '../components/Icons'
import { Card, Field, PhotoPicker, Toast, toast } from '../components/ui'
import { storageOk } from '../store'
import type { Index } from '../logic'
import { today } from '../util'

export default function Config({ i }: { i: Index }) {
  const c = i.state.config
  const [nueva, setNueva] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const set = (p: Partial<typeof c>) => A.saveConfig({ ...c, ...p })
  const logo = c.logoPhotoId ? i.photo.get(c.logoPhotoId)?.data : undefined

  const exportar = () => {
    const blob = new Blob([A.exportJSON()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `copia-ganaderia-${today()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    toast('Copia de seguridad descargada')
  }
  const importar = async (f?: File) => {
    if (!f) return
    if (!confirm('Se sustituirán TODOS los datos actuales por los de la copia. ¿Continuar?')) return
    try {
      await A.importJSON(await f.text())
      toast('Copia restaurada')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo leer la copia')
    }
  }

  return (
    <div className="page">
      <Card title="Mi ganadería" icon={<I.Gear size={20} />}>
        <div className="form-grid">
          <div className="full"><PhotoPicker value={logo} onChange={(d) => A.addPhoto('config', 'principal', d, true)} label="Logo o fotografía de la ganadería" /></div>
          <Field label="Nombre de la ganadería"><input value={c.nombre} onChange={(e) => set({ nombre: e.target.value })} /></Field>
          <Field label="Localización"><input value={c.localizacion} onChange={(e) => set({ localizacion: e.target.value })} /></Field>
          <Field label="Raza por defecto en animales nuevos"><select value={c.razaPorDefecto} onChange={(e) => set({ razaPorDefecto: e.target.value })}>{c.breeds.map((b) => <option key={b}>{b}</option>)}</select></Field>
        </div>
      </Card>
      <Card title="Razas disponibles">
        <p className="muted">Puedes elegir la raza de cada animal; si en el futuro haces cruces, la composición racial se calcula a partir de los progenitores.</p>
        <div className="chips-edit">{c.breeds.map((b) => <span key={b} className="chip-x">{b}{c.breeds.length > 1 && <button aria-label={`Quitar ${b}`} onClick={() => set({ breeds: c.breeds.filter((x) => x !== b), razaPorDefecto: c.razaPorDefecto === b ? c.breeds.find((x) => x !== b)! : c.razaPorDefecto })}>×</button>}</span>)}</div>
        <form className="inline" onSubmit={(e) => { e.preventDefault(); const n = nueva.trim(); if (n && !c.breeds.includes(n)) set({ breeds: [...c.breeds, n] }); setNueva('') }}>
          <input placeholder="Añadir raza…" value={nueva} onChange={(e) => setNueva(e.target.value)} /><button className="btn soft">Añadir</button>
        </form>
      </Card>
      <Card title="Parámetros de cálculo y avisos">
        <div className="form-grid">
          <Field label="Días de gestación" hint="Para calcular la fecha prevista de parto desde la inseminación"><input type="number" min="250" max="320" value={c.gestacionDias} onChange={(e) => set({ gestacionDias: Number(e.target.value) || 280 })} /></Field>
          <Field label="Aviso «sin gestar» (días desde el parto)"><input type="number" min="30" value={c.diasSinGestar} onChange={(e) => set({ diasSinGestar: Number(e.target.value) || 120 })} /></Field>
          <Field label="Aviso «llevan N días en la pradera»" hint="Días de ocupación a partir de los cuales se avisa"><input type="number" min="1" value={c.diasAvisoOcupacion ?? 30} onChange={(e) => set({ diasAvisoOcupacion: Number(e.target.value) || 30 })} /></Field>
          <Field label="Descanso mínimo de una pradera (días)" hint="Es un valor tuyo, no una recomendación agronómica"><input type="number" min="0" value={c.diasDescansoMin ?? 30} onChange={(e) => set({ diasDescansoMin: Number(e.target.value) || 0 })} /></Field>
          <Field label="Ventana de avisos (días por adelantado)"><input type="number" min="7" value={c.avisoDias} onChange={(e) => set({ avisoDias: Number(e.target.value) || 90 })} /></Field>
        </div>
      </Card>
      <Card title="Copia de seguridad" icon={<I.Book size={20} />}>
        {!storageOk() && <p className="notice bad">⚠ Este navegador no permite guardar datos: lo que introduzcas se perderá al cerrar. Usa la copia de seguridad.</p>}
        <p className="muted">Los datos se guardan solo en este dispositivo. <b>Haz copias con frecuencia</b>: si pierdes o cambias el móvil, la copia es lo único que permite recuperarlos.</p>
        <div className="row-actions">
          <button className="btn primary" onClick={exportar}>Descargar copia (.json)</button>
          <button className="btn soft" onClick={() => file.current?.click()}>Restaurar desde copia</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { void importar(e.target.files?.[0]); e.target.value = '' }} />
        </div>
      </Card>
      <Card title="Datos de ejemplo">
        <p className="muted">La aplicación incluye animales ficticios para probar. Cuando quieras empezar con tus datos reales, borra los de ejemplo.</p>
        <div className="row-actions">
          <button className="btn ghost danger" onClick={() => confirm('Se borrarán TODOS los animales y registros. ¿Empezar desde cero?') && A.empezarVacio().then(() => toast('Datos borrados'))}>Empezar con la ganadería vacía</button>
          <button className="btn ghost" onClick={() => confirm('Se sustituirán todos los datos por los de ejemplo. ¿Continuar?') && A.restaurarDemo().then(() => toast('Datos de ejemplo restaurados'))}>Restaurar datos de ejemplo</button>
        </div>
      </Card>
      <Toast />
    </div>
  )
}

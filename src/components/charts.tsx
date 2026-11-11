export interface Serie {
  name: string
  color: string
  points: { x: number; y: number }[]
}
const COLORS = ['#4f7a3a', '#b8812f', '#3b86c6', '#a14d8b', '#7a5a3a']
export const seriesColor = (k: number) => COLORS[k % COLORS.length]

function nice(min: number, max: number): [number, number] {
  if (min === max) return [min - 1, max + 1]
  const span = max - min
  const step = Math.pow(10, Math.floor(Math.log10(span)))
  return [Math.floor(min / step) * step, Math.ceil(max / step) * step]
}

export function LineChart({ series, xFormat, yUnit = '', height = 180, empty = 'Sin datos suficientes' }: { series: Serie[]; xFormat: (x: number) => string; yUnit?: string; height?: number; empty?: string }) {
  const pts = series.flatMap((s) => s.points)
  if (!pts.length) return <p className="muted empty">{empty}</p>
  const W = 380
  const pad = { l: 40, r: 12, t: 10, b: 24 }
  const [y0, y1] = nice(Math.min(...pts.map((p) => p.y)), Math.max(...pts.map((p) => p.y)))
  const xs = pts.map((p) => p.x)
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const X = (x: number) => (x1 === x0 ? (W + pad.l - pad.r) / 2 : pad.l + ((x - x0) / (x1 - x0)) * (W - pad.l - pad.r))
  const Y = (y: number) => pad.t + (1 - (y - y0) / (y1 - y0 || 1)) * (height - pad.t - pad.b)
  const yt = [y0, (y0 + y1) / 2, y1]
  const xt = x1 === x0 ? [x0] : [0, 1, 2, 3].map((k) => x0 + ((x1 - x0) * k) / 3)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${height}`} className="chart" role="img">
        {yt.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={Y(t)} y2={Y(t)} stroke="#d8ccb2" strokeDasharray="3 3" />
            <text x={pad.l - 5} y={Y(t) + 3} textAnchor="end" fontSize="9" fill="#6b6a55">{Math.round(t * 10) / 10}</text>
          </g>
        ))}
        {xt.map((t) => (
          <text key={t} x={X(t)} y={height - 8} textAnchor="middle" fontSize="9" fill="#6b6a55">{xFormat(t)}</text>
        ))}
        {series.map((s) => {
          const sorted = [...s.points].sort((a, b) => a.x - b.x)
          const line = sorted.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ')
          return (
            <g key={s.name}>
              {series.length === 1 && sorted.length > 1 && <polygon points={`${X(sorted[0].x)},${height - pad.b} ${line} ${X(sorted[sorted.length - 1].x)},${height - pad.b}`} fill={s.color} opacity="0.13" />}
              {sorted.length > 1 && <polyline points={line} fill="none" stroke={s.color} strokeWidth="2" />}
              {sorted.map((p) => (
                <circle key={p.x} cx={X(p.x)} cy={Y(p.y)} r="3.5" fill={s.color}>
                  <title>{`${s.name}: ${Math.round(p.y * 10) / 10} ${yUnit} (${xFormat(p.x)})`}</title>
                </circle>
              ))}
            </g>
          )
        })}
      </svg>
      {series.length > 1 && (
        <ul className="legend row">
          {series.map((s) => (
            <li key={s.name}><span style={{ background: s.color }} /> {s.name}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function BarChart({ data, unit = '', color = '#4f7a3a', height = 150, dec = 0 }: { data: { label: string; value: number | undefined }[]; unit?: string; color?: string; height?: number; dec?: number }) {
  const vals = data.map((d) => d.value).filter((v): v is number => v !== undefined)
  if (!vals.length) return <p className="muted empty">Sin datos suficientes</p>
  const max = Math.max(...vals, 1)
  const W = Math.max(260, data.length * 44)
  const pad = { t: 16, b: 20 }
  const bw = Math.min(30, (W / data.length) * 0.6)
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="chart" role="img">
      {data.map((d, k) => {
        const cx = (W / data.length) * (k + 0.5)
        const h = d.value === undefined ? 0 : (d.value / max) * (height - pad.t - pad.b)
        return (
          <g key={d.label}>
            {d.value !== undefined && <rect x={cx - bw / 2} y={height - pad.b - h} width={bw} height={h} rx="3" fill={color}><title>{`${d.label}: ${d.value.toFixed(dec)} ${unit}`}</title></rect>}
            {d.value !== undefined && <text x={cx} y={height - pad.b - h - 4} textAnchor="middle" fontSize="9" fill="#4a4a35">{d.value.toFixed(dec)}</text>}
            <text x={cx} y={height - 6} textAnchor="middle" fontSize="9" fill="#6b6a55">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

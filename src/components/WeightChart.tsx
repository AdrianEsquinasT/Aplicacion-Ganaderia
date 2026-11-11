import { fmtDate } from '../util'

interface Props {
  data: { date: string; kg: number }[]
}

export default function WeightChart({ data }: Props) {
  const W = 250
  const H = 150
  const pad = { l: 34, r: 12, t: 10, b: 24 }
  if (data.length === 0) return <p className="muted">Sin pesajes registrados.</p>

  const kgs = data.map((d) => d.kg)
  const min = Math.floor((Math.min(...kgs) - 20) / 50) * 50
  const max = Math.ceil((Math.max(...kgs) + 20) / 50) * 50
  const x = (i: number) =>
    data.length === 1 ? (W + pad.l - pad.r) / 2 : pad.l + (i * (W - pad.l - pad.r)) / (data.length - 1)
  const y = (v: number) => pad.t + (1 - (v - min) / (max - min || 1)) * (H - pad.t - pad.b)
  const line = data.map((d, i) => `${x(i)},${y(d.kg)}`).join(' ')
  const area = `${x(0)},${H - pad.b} ${line} ${x(data.length - 1)},${H - pad.b}`
  const ticks = [min, min + (max - min) / 2, max]
  const short = (iso: string) => {
    const [yy, mm] = iso.split('-')
    return `${mm}/${yy.slice(2)}`
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Evolución del peso">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#d8ccb2" strokeDasharray="3 3" />
          <text x={pad.l - 6} y={y(t) + 3} textAnchor="end" fontSize="9" fill="#6b6a55">
            {Math.round(t)}
          </text>
        </g>
      ))}
      <polygon points={area} fill="#4f7a3a" opacity="0.15" />
      <polyline points={line} fill="none" stroke="#4f7a3a" strokeWidth="2" />
      {data.map((d, i) => (
        <g key={d.date + i}>
          <circle cx={x(i)} cy={y(d.kg)} r="3.5" fill="#4f7a3a">
            <title>{`${fmtDate(d.date)}: ${d.kg} kg`}</title>
          </circle>
          {(data.length <= 6 || i % 2 === 0) && (
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="#6b6a55">
              {short(d.date)}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

'use client'
import { useMemo, useState } from 'react'
import { fmtUSD } from '@/lib/api'
import clsx from 'clsx'

type Timeframe = '1W' | '1M' | '3M' | 'ALL'
type Series = 'inflow' | 'outflow' | 'net'

interface Point {
  label: string
  value: number
}

function buildSmoothPath(coords: Array<{ x: number; y: number }>) {
  if (coords.length === 0) return ''
  if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`
  let d = `M ${coords[0].x} ${coords[0].y}`
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i]
    const p1 = coords[i + 1]
    const cx = (p0.x + p1.x) / 2
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`
  }
  return d
}

export function MoneyFlowChart({ transactions }: { transactions: any[] }) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M')
  const [series, setSeries] = useState<Series>('inflow')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const points: Point[] = useMemo(() => {
    const now = new Date()
    const daysMap: Record<Timeframe, number> = {
      '1W': 7,
      '1M': 30,
      '3M': 90,
      ALL: 180,
    }
    const bucketCount = timeframe === '1W' ? 7 : timeframe === '1M' ? 6 : 6
    const spanDays = daysMap[timeframe]
    const bucketMs = (spanDays * 24 * 60 * 60 * 1000) / bucketCount
    const startMs = now.getTime() - spanDays * 24 * 60 * 60 * 1000

    const buckets: Point[] = Array.from({ length: bucketCount }, (_, idx) => {
      const bucketStart = new Date(startMs + idx * bucketMs)
      const label =
        timeframe === '1W'
          ? bucketStart.toLocaleDateString('en-US', { weekday: 'short' })
          : bucketStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return { label, value: 0 }
    })

    for (const tx of transactions) {
      if (tx.status === 'failed' || tx.status === 'cancelled') continue
      const t = new Date(tx.createdAt).getTime()
      if (Number.isNaN(t)) continue
      if (timeframe !== 'ALL' && t < startMs) continue

      const rel = Math.max(0, t - startMs)
      const bIdx = Math.min(bucketCount - 1, Math.floor(rel / bucketMs))
      const amt = Number(tx.amount) || 0
      const isCredit = tx.type === 'credit'

      if (series === 'inflow' && isCredit) buckets[bIdx].value += amt
      else if (series === 'outflow' && !isCredit) buckets[bIdx].value += amt
      else if (series === 'net') buckets[bIdx].value += isCredit ? amt : -amt
    }

    return buckets
  }, [transactions, timeframe, series])

  const hasActivity = points.some(p => p.value !== 0)
  const values = points.map(p => p.value)
  const minVal = Math.min(0, ...values)
  const maxVal = Math.max(100, ...values)
  const range = Math.max(1, maxVal - minVal)

  const W = 620
  const H = 200
  const padX = 28
  const padTop = 36
  const padBottom = 32
  const innerW = W - padX * 2
  const innerH = H - padTop - padBottom

  const coords = points.map((p, i) => {
    const x = padX + (points.length > 1 ? (i / (points.length - 1)) * innerW : innerW / 2)
    const normalized = hasActivity ? (p.value - minVal) / range : 0.28
    const y = padTop + innerH - normalized * innerH
    return { x, y, ...p }
  })

  const defaultIdx = useMemo(() => {
    if (!hasActivity) return Math.max(0, coords.length - 1)
    let best = 0
    for (let i = 1; i < coords.length; i++) {
      if (coords[i].value >= coords[best].value) best = i
    }
    return best
  }, [coords, hasActivity])

  const activeIdx = selectedIdx !== null && selectedIdx < coords.length ? selectedIdx : defaultIdx
  const activePoint = coords[activeIdx] || coords[0]

  const linePath = buildSmoothPath(coords)
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${H - padBottom} L ${coords[0].x} ${H - padBottom} Z`
      : ''

  const seriesTotal = points.reduce((acc, p) => acc + p.value, 0)

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="font-display font-bold text-base sm:text-lg text-[#002B5B]">Money Flow</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EBF2FF] text-[#0052CC]">
              {series === 'inflow' ? 'Inflow' : series === 'outflow' ? 'Outflow' : 'Net Flow'}: {fmtUSD(seriesTotal)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {hasActivity ? 'Tap or hover any point to inspect period volume' : 'Activity builds automatically as you transact'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Series Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-[#F4F7FC] border border-slate-200/70">
            {([
              { id: 'inflow', label: 'In' },
              { id: 'outflow', label: 'Out' },
              { id: 'net', label: 'Net' },
            ] as const).map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setSeries(s.id); setSelectedIdx(null) }}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer',
                  series === s.id ? 'bg-white text-[#002B5B] shadow-sm' : 'text-slate-500 hover:text-[#002B5B]'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Timeframe Pills */}
          <div className="inline-flex p-1 rounded-xl bg-[#F4F7FC] border border-slate-200/70">
            {(['1W', '1M', '3M', 'ALL'] as const).map(tf => (
              <button
                key={tf}
                type="button"
                onClick={() => { setTimeframe(tf); setSelectedIdx(null) }}
                className={clsx(
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer',
                  timeframe === tf ? 'bg-[#0052CC] text-white shadow-sm' : 'text-slate-500 hover:text-[#002B5B]'
                )}
              >
                {tf === 'ALL' ? 'All' : tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Spline Area Chart */}
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[200px] sm:h-[220px] select-none overflow-visible">
          <defs>
            <linearGradient id="brbAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0052CC" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0052CC" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="brbLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#0052CC" />
              <stop offset="100%" stopColor="#002B5B" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines */}
          {[0.25, 0.5, 0.75, 1].map((step, i) => {
            const y = padTop + innerH * (1 - step)
            return (
              <line
                key={i}
                x1={padX}
                y1={y}
                x2={W - padX}
                y2={y}
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            )
          })}

          {/* Baseline */}
          <line
            x1={padX}
            y1={H - padBottom}
            x2={W - padX}
            y2={H - padBottom}
            stroke="#E2E8F0"
            strokeWidth="1"
          />

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#brbAreaGrad)" />}

          {/* Smooth Spline Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#brbLineGrad)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}

          {/* Active Dashed Guide */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={activePoint.y}
              x2={activePoint.x}
              y2={H - padBottom}
              stroke="#0052CC"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              strokeOpacity="0.55"
            />
          )}

          {/* Data Nodes + Hit Targets + X-Axis Labels */}
          {coords.map((pt, i) => {
            const isActive = i === activeIdx
            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setSelectedIdx(i)}
                onClick={() => setSelectedIdx(i)}
              >
                <rect
                  x={pt.x - innerW / (coords.length * 2)}
                  y={0}
                  width={innerW / coords.length}
                  height={H}
                  fill="transparent"
                />
                {isActive && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="10"
                    fill="#0052CC"
                    fillOpacity="0.16"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? '5.5' : '3.5'}
                  fill={isActive ? '#0052CC' : '#FFFFFF'}
                  stroke="#0052CC"
                  strokeWidth="2.5"
                />
                <text
                  x={pt.x}
                  y={H - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isActive ? '700' : '500'}
                  fill={isActive ? '#002B5B' : '#94A3B8'}
                >
                  {pt.label}
                </text>
              </g>
            )
          })}

          {/* Floating Dark Navy Tooltip Pill (PayDay signature callout) */}
          {activePoint && (
            <g
              transform={`translate(${Math.min(Math.max(activePoint.x, 76), W - 76)}, ${Math.max(18, activePoint.y - 16)})`}
            >
              <rect
                x="-66"
                y="-26"
                width="132"
                height="28"
                rx="10"
                fill="#001F42"
              />
              <text
                x="0"
                y="-8"
                textAnchor="middle"
                fontSize="11.5"
                fontWeight="700"
                fill="#FFFFFF"
              >
                {fmtUSD(activePoint.value)}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}

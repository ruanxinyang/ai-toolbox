type Point = { day: string; count: number }

const WEEKDAY = ["日", "一", "二", "三", "四", "五", "六"]

function weekdayLabel(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`)
  return WEEKDAY[date.getUTCDay()]
}

function dayLabel(iso: string): string {
  return iso.slice(8) // DD
}

/**
 * Tiny SVG bar chart for last-N-days call counts. Zero deps, server-renderable
 * (pure presentational). Hover tooltip via native <title>.
 */
export function TrendChart({ data, ariaLabel }: { data: Point[]; ariaLabel: string }) {
  const days = data.length
  if (days === 0) return null

  const max = Math.max(...data.map((d) => d.count), 1)
  const total = data.reduce((acc, d) => acc + d.count, 0)
  const padding = { top: 12, right: 8, bottom: 24, left: 8 }
  const width = 320
  const height = 120
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  const barGap = 6
  const barWidth = (innerWidth - barGap * (days - 1)) / days

  return (
    <figure className="flex flex-col gap-2" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={ariaLabel}>
        <defs>
          <linearGradient id="trend-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.541 0.281 293.009)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="oklch(0.541 0.281 293.009)" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Baseline */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="currentColor"
          strokeOpacity="0.1"
          className="text-foreground"
        />

        {data.map((d, i) => {
          const h = total === 0 ? 0 : (d.count / max) * innerHeight
          const x = padding.left + i * (barWidth + barGap)
          const y = height - padding.bottom - h
          const isToday = i === days - 1
          return (
            <g key={d.day}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(h, 1)}
                rx={2}
                fill="url(#trend-grad)"
                opacity={isToday ? 1 : 0.7}
              >
                <title>
                  {d.day} · {d.count.toLocaleString()} 次
                </title>
              </rect>
              {d.count > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 3}
                  textAnchor="middle"
                  className="fill-current font-mono text-[9px]"
                  fill="currentColor"
                >
                  {d.count}
                </text>
              )}
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 14}
                textAnchor="middle"
                className="fill-current font-mono text-[10px]"
                fill="currentColor"
                opacity="0.55"
              >
                {weekdayLabel(d.day)}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 24}
                textAnchor="middle"
                className="fill-current font-mono text-[8px]"
                fill="currentColor"
                opacity="0.4"
              >
                {dayLabel(d.day)}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="text-muted-foreground text-center font-mono text-[10px]">
        最近 {days} 天 · 总计 {total.toLocaleString()} 次
      </figcaption>
    </figure>
  )
}

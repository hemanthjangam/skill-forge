import { useMemo } from 'react'

interface StreakHeatmapProps {
  data: { date: string; count: number }[]
  days?: number
}

export function StreakHeatmap({ data, days = 182 }: StreakHeatmapProps) {
  const activityMap = useMemo(() => {
    const map = new Map<string, number>()
    data.forEach((item) => map.set(item.date, item.count))
    return map
  }, [data])

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - (days - 1))

    const normalizedStart = new Date(start)
    const startDay = (normalizedStart.getDay() + 6) % 7
    normalizedStart.setDate(normalizedStart.getDate() - startDay)

    const cells: Array<{ date: string; count: number; isCurrentRange: boolean } | null> = []
    const labels: Array<{ label: string; weekIndex: number }> = []

    for (let cursor = new Date(normalizedStart); cursor <= today; cursor.setDate(cursor.getDate() + 1)) {
      const iso = toLocalDateKey(cursor)
      const inRange = cursor >= start
      const cell = {
        date: iso,
        count: activityMap.get(iso) ?? 0,
        isCurrentRange: inRange,
      }

      if (cursor.getDate() === 1 && cells.length > 0) {
        labels.push({
          label: cursor.toLocaleString('en-US', { month: 'short' }),
          weekIndex: Math.floor(cells.length / 7),
        })
      }

      cells.push(cell)
    }

    const splitWeeks: Array<Array<{ date: string; count: number; isCurrentRange: boolean } | null>> = []
    for (let i = 0; i < cells.length; i += 7) {
      splitWeeks.push(cells.slice(i, i + 7))
    }

    return { weeks: splitWeeks, monthLabels: labels }
  }, [activityMap, days])

  const getColor = (count: number, isCurrentRange: boolean) => {
    if (!isCurrentRange) return 'bg-transparent'
    if (count === 0) return 'bg-zinc-200 dark:bg-zinc-800'
    if (count < 2) return 'bg-emerald-200 dark:bg-emerald-950'
    if (count < 4) return 'bg-emerald-400 dark:bg-emerald-700'
    if (count < 6) return 'bg-emerald-500 dark:bg-emerald-500'
    return 'bg-emerald-700 dark:bg-emerald-300'
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-max space-y-3">
        <div className="relative ml-8 h-4 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
          {monthLabels.map((item) => (
            <span
              key={`${item.label}-${item.weekIndex}`}
              className="absolute top-0"
              style={{ left: `${item.weekIndex * 18}px` }}
            >
              {item.label}
            </span>
          ))}
        </div>
        <div className="flex items-start gap-2">
          <div className="grid h-[90px] grid-rows-7 gap-1 pt-1 text-[10px] text-muted-foreground/70">
            <span className="h-3">M</span>
            <span className="h-3" />
            <span className="h-3">W</span>
            <span className="h-3" />
            <span className="h-3">F</span>
            <span className="h-3" />
            <span className="h-3" />
          </div>
          <div className="flex min-h-[90px] gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={`week-${weekIndex}`} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  if (!day) return <div key={`empty-${weekIndex}-${dayIndex}`} className="h-3.5 w-3.5 rounded-[4px] opacity-0" />

                  return (
                    <div
                      key={day.date}
                      className={`h-3.5 w-3.5 rounded-[4px] ${getColor(day.count, day.isCurrentRange)} transition-all duration-200 hover:scale-[1.18] hover:ring-2 hover:ring-emerald-300/60`}
                      title={`${day.count} knowledge check${day.count === 1 ? '' : 's'} on ${day.date}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-1 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 4, 6].map((value) => (
            <div key={value} className={`h-3.5 w-3.5 rounded-[4px] ${getColor(value, true)}`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

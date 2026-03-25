'use client'

import { useMemo, useState } from 'react'
import type { TimelineMemory } from '@/actions/memories'
import { YearsView } from './YearsView'
import { MonthsView } from './MonthsView'
import { DaysView } from './DaysView'

// ── Types ─────────────────────────────────────────────────────────────────

export interface DayGroup {
  day: number
  memories: TimelineMemory[]
}

export interface MonthGroup {
  month: number // 1–12
  totalCount: number
  previewUrls: string[]
  dayGroups: DayGroup[]
}

export interface YearGroup {
  year: number
  totalCount: number
  previewUrls: string[] // up to 3, for the photo strip
  monthGroups: MonthGroup[]
}

type Level = 'years' | 'months' | 'days'

// ── Grouping ──────────────────────────────────────────────────────────────

function groupMemories(memories: TimelineMemory[]): YearGroup[] {
  // Build nested year → month → day maps
  const yearMap = new Map<number, Map<number, Map<number, TimelineMemory[]>>>()

  for (const m of memories) {
    const [y, mo, d] = m.start_date.split('-').map(Number)
    if (!yearMap.has(y)) yearMap.set(y, new Map())
    const monthMap = yearMap.get(y)!
    if (!monthMap.has(mo)) monthMap.set(mo, new Map())
    const dayMap = monthMap.get(mo)!
    if (!dayMap.has(d)) dayMap.set(d, [])
    dayMap.get(d)!.push(m)
  }

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => b - a) // newest year first
    .map(([year, monthMap]) => {
      const monthGroups: MonthGroup[] = Array.from(monthMap.entries())
        .sort(([a], [b]) => b - a) // newest month first
        .map(([month, dayMap]) => {
          const dayGroups: DayGroup[] = Array.from(dayMap.entries())
            .sort(([a], [b]) => b - a) // newest day first
            .map(([day, mems]) => ({ day, memories: mems }))

          const allMems = dayGroups.flatMap((dg) => dg.memories)
          const previewUrls = allMems
            .map((m) => m.previewUrl)
            .filter(Boolean)
            .slice(0, 4) as string[]

          return { month, totalCount: allMems.length, previewUrls, dayGroups }
        })

      const previewUrls = monthGroups
        .flatMap((mg) => mg.previewUrls)
        .slice(0, 3)

      return {
        year,
        totalCount: monthGroups.reduce((s, mg) => s + mg.totalCount, 0),
        previewUrls,
        monthGroups,
      }
    })
}

// ── Component ─────────────────────────────────────────────────────────────

interface Props {
  memories: TimelineMemory[]
}

export function TimelineClient({ memories }: Props) {
  const [level, setLevel] = useState<Level>('years')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  const yearGroups = useMemo(() => groupMemories(memories), [memories])

  // Derive current data from selection
  const currentYear = yearGroups.find((y) => y.year === selectedYear) ?? null
  const currentMonth =
    currentYear?.monthGroups.find((m) => m.month === selectedMonth) ?? null

  // Animate on every level / selection change
  const viewKey = `${level}-${selectedYear}-${selectedMonth}`

  function goToYear(year: number) {
    setSelectedYear(year)
    setSelectedMonth(null)
    setLevel('months')
  }

  function goToMonth(month: number) {
    setSelectedMonth(month)
    setLevel('days')
  }

  function goBack() {
    if (level === 'days') {
      setSelectedMonth(null)
      setLevel('months')
    } else if (level === 'months') {
      setSelectedYear(null)
      setLevel('years')
    }
  }

  return (
    <div key={viewKey} className="animate-timeline-in">
      {level === 'years' && (
        <YearsView yearGroups={yearGroups} onSelectYear={goToYear} />
      )}

      {level === 'months' && currentYear && (
        <MonthsView
          year={currentYear}
          onSelectMonth={goToMonth}
          onBack={goBack}
        />
      )}

      {level === 'days' && currentMonth && selectedYear !== null && (
        <DaysView
          month={currentMonth}
          year={selectedYear}
          onBack={goBack}
        />
      )}
    </div>
  )
}

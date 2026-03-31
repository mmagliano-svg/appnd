/**
 * Narrative period detection for the Timeline.
 *
 * Groups events into named "period blocks" using time-proximity heuristics.
 * Pure function — no DB access, no side effects.
 *
 * Design rules:
 *   - Only events (no end_date) are considered; structural periods are excluded
 *   - A period requires ≥ 2 memories
 *   - Grouping window: 21 days between consecutive events
 *   - Title is derived from location + season, max 4 words
 *   - O(n log n) due to sort, O(n) thereafter
 */

import type { TimelineMemory } from '@/actions/memories'

// ── Types ──────────────────────────────────────────────────────────────────

export interface TimelinePeriod {
  id: string
  title: string
  startDate: string   // ISO date of first memory
  endDate: string     // ISO date of last memory
  memoryIds: string[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

function daysBetween(isoA: string, isoB: string): number {
  const a = new Date(isoA.split('T')[0]).getTime()
  const b = new Date(isoB.split('T')[0]).getTime()
  return Math.round(Math.abs(b - a) / 86_400_000)
}

function italianSeason(month: number, year: string): string {
  if (month >= 6 && month <= 8)  return `Estate ${year}`
  if (month >= 3 && month <= 5)  return `Primavera ${year}`
  if (month >= 9 && month <= 11) return `Autunno ${year}`
  return `Inverno ${year}`
}

// ── Title generation ───────────────────────────────────────────────────────

function buildPeriodTitle(group: TimelineMemory[]): string {
  // Count non-null locations
  const locCounts = new Map<string, number>()
  for (const m of group) {
    const loc = m.location_name?.trim()
    if (loc) locCounts.set(loc, (locCounts.get(loc) ?? 0) + 1)
  }

  let dominantLoc: string | null = null
  if (locCounts.size > 0) {
    const [topLoc, topCount] = Array.from(locCounts.entries()).sort((a, b) => b[1] - a[1])[0]
    // Dominant = appears in more than half the group
    if (topCount / group.length > 0.5) dominantLoc = topLoc
  }

  const firstDate = group[0].start_date
  const year      = firstDate.split('-')[0]
  const month     = parseInt(firstDate.split('-')[1])
  const season    = italianSeason(month, year)

  if (dominantLoc) {
    // "Roma · Estate 2023" — location anchors, season + year give temporal context
    return `${dominantLoc} · ${season}`
  }

  // No dominant location — season already includes year (e.g. "Estate 2023")
  return season
}

// ── Core grouping ──────────────────────────────────────────────────────────

/**
 * Groups events into narrative periods using a 21-day proximity window.
 *
 * Returns periods sorted ascending by startDate.
 * Each period carries the IDs of its member memories so callers can build
 * a fast memoryId → periodTitle lookup.
 */
export function getTimelinePeriods(memories: TimelineMemory[]): TimelinePeriod[] {
  // Events only — structural periods (with end_date) are excluded
  const events = memories
    .filter((m) => !m.end_date)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  const periods: TimelinePeriod[] = []
  let group: TimelineMemory[] = []

  function flush() {
    if (group.length < 2) return
    periods.push({
      id:        `np-${group[0].start_date}-${group[group.length - 1].start_date}`,
      title:     buildPeriodTitle(group),
      startDate: group[0].start_date,
      endDate:   group[group.length - 1].start_date,
      memoryIds: group.map((m) => m.id),
    })
  }

  for (const mem of events) {
    if (group.length === 0) {
      group.push(mem)
      continue
    }
    const gap = daysBetween(group[group.length - 1].start_date, mem.start_date)
    if (gap <= 21) {
      group.push(mem)
    } else {
      flush()
      group = [mem]
    }
  }
  flush()

  return periods
}

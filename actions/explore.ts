'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import {
  FIXED_CALENDAR_ANCHORS,
  isMemoryMatchingFixedAnchor,
  dayMonthFromDate,
  dayMonthFromBirthDate,
} from '@/lib/utils/anchors'

// ── Private helper ─────────────────────────────────────────────────────────

async function authedClient() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return { supabase, user: user! }
}

// ── Search ─────────────────────────────────────────────────────────────────

export interface SearchMemory {
  id: string
  title: string
  start_date: string
  location_name: string | null
}

export async function getSearchableMemories(): Promise<SearchMemory[]> {
  const { supabase, user } = await authedClient()

  const { data } = await supabase
    .from('memories')
    .select('id, title, start_date, location_name')
    .eq('created_by', user.id)
    .order('start_date', { ascending: false })

  return (data ?? []).map((m) => ({
    id:            m.id as string,
    title:         m.title as string,
    start_date:    m.start_date as string,
    location_name: (m.location_name ?? null) as string | null,
  }))
}

// ── Recurring moments ──────────────────────────────────────────────────────

export interface RecurringMomentItem {
  id: string
  label: string
  count: number
  href: string
  kind: 'fixed' | 'birthday'
}

/**
 * Returns ALL recurring moments (fixed anchors + birthdays) with memory counts.
 * Sorted: items with count > 0 first (by count desc), then count = 0 (by label).
 */
export async function getRecurringMoments(): Promise<RecurringMomentItem[]> {
  const { supabase, user } = await authedClient()

  const { data: memRows } = await supabase
    .from('memories')
    .select('start_date')
    .eq('created_by', user.id)
  const memDates = (memRows ?? []).map((m) => m.start_date as string)

  const results: RecurringMomentItem[] = []

  // Fixed calendar anchors
  for (const anchor of FIXED_CALENDAR_ANCHORS) {
    const count = memDates.filter((d) => isMemoryMatchingFixedAnchor(d, anchor)).length
    results.push({
      id:    anchor.id,
      label: anchor.label,
      count,
      href:  `/timeline?anchor=${anchor.id}`,
      kind:  'fixed',
    })
  }

  // Birthday anchors
  const { data: people } = await supabase
    .from('people')
    .select('id, name, birth_date')
    .eq('owner_id', user.id)
    .not('birth_date', 'is', null)

  for (const p of people ?? []) {
    if (!p.birth_date) continue
    const birthMmDd = dayMonthFromBirthDate(p.birth_date as string)
    const count     = birthMmDd
      ? memDates.filter((d) => dayMonthFromDate(d) === birthMmDd).length
      : 0
    results.push({
      id:    `birthday_${p.id as string}`,
      label: `Compleanno di ${p.name as string}`,
      count,
      href:  `/people/${p.id as string}/momenti/compleanno`,
      kind:  'birthday',
    })
  }

  return results.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return a.label.localeCompare(b.label)
  })
}

// ── Connections (clusters) ─────────────────────────────────────────────────

export interface ExploreCluster {
  label: string
  count: number
  href: string
}

/**
 * Detects up to 3 clusters from the user's memories.
 * Priority:
 *   1. Person + location (same person, same place, count ≥ 2)
 *   2. Recurring location (same place across ≥ 2 distinct years)
 */
export async function getExploreConnections(): Promise<ExploreCluster[]> {
  const { supabase, user } = await authedClient()

  const clusters: ExploreCluster[] = []

  // ── 1. Person + location ──────────────────────────────────────────────────
  const { data: links } = await supabase
    .from('memory_people')
    .select('person_id, memory_id')
    .eq('added_by', user.id)

  if ((links ?? []).length > 0) {
    const allMemIds = Array.from(new Set((links ?? []).map((l) => l.memory_id as string)))

    const { data: mems } = await supabase
      .from('memories')
      .select('id, location_name, start_date')
      .in('id', allMemIds)
      .not('location_name', 'is', null)

    const memLocMap = new Map<string, { location: string; year: number }>()
    for (const m of mems ?? []) {
      if (m.location_name) {
        memLocMap.set(m.id as string, {
          location: (m.location_name as string).trim(),
          year:     parseInt((m.start_date as string).split('-')[0]),
        })
      }
    }

    const personIds = Array.from(new Set((links ?? []).map((l) => l.person_id as string)))
    const { data: persons } = await supabase
      .from('people')
      .select('id, name')
      .in('id', personIds)
    const personNameMap = new Map<string, string>(
      (persons ?? []).map((p) => [p.id as string, p.name as string]),
    )

    // Group by (person_id, location), track years
    const plMap = new Map<string, { personId: string; location: string; count: number; years: Set<number> }>()
    for (const l of links ?? []) {
      const mem = memLocMap.get(l.memory_id as string)
      if (!mem) continue
      const key   = `${l.person_id as string}::${mem.location}`
      const entry = plMap.get(key)
      if (entry) { entry.count++; entry.years.add(mem.year) }
      else        { plMap.set(key, { personId: l.person_id as string, location: mem.location, count: 1, years: new Set([mem.year]) }) }
    }

    const currentYear = new Date().getFullYear()
    const plClusters: ExploreCluster[] = Array.from(plMap.values())
      .filter((c) => c.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((c) => {
        const name       = personNameMap.get(c.personId) ?? 'qualcuno'
        const timeLabel  = (c.years.size === 1 && c.years.has(currentYear)) ? 'quest\'anno' : 'nel tempo'
        return {
          label: `${name} e ${c.location} — ${c.count} moment${c.count === 1 ? 'o' : 'i'} ${timeLabel}`,
          count: c.count,
          href:  `/people/${c.personId}`,
        }
      })

    clusters.push(...plClusters)
  }

  if (clusters.length >= 3) return clusters

  // ── 2. Recurring location (same place, ≥ 2 distinct years) ───────────────
  const { data: locRows } = await supabase
    .from('memories')
    .select('location_name, start_date')
    .eq('created_by', user.id)
    .not('location_name', 'is', null)

  const locYearMap = new Map<string, Set<number>>()
  for (const r of locRows ?? []) {
    const loc  = (r.location_name as string).trim()
    const year = parseInt((r.start_date as string).split('-')[0])
    const set  = locYearMap.get(loc) ?? new Set<number>()
    set.add(year)
    locYearMap.set(loc, set)
  }

  const recurringLoc: ExploreCluster[] = Array.from(locYearMap.entries())
    .filter(([, years]) => years.size >= 2)
    .sort(([, a], [, b]) => b.size - a.size)
    .slice(0, 3 - clusters.length)
    .map(([loc, years]) => ({
      label: `${years.size} ritorni a ${loc}`,
      count: years.size,
      href:  `/places/${encodeURIComponent(loc)}`,
    }))

  return [...clusters, ...recurringLoc].slice(0, 3)
}

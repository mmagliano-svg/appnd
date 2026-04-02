'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getTopPeople } from '@/actions/persons'
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
  title: string      // e.g. "Lalli × Brescia"
  subtitle: string   // e.g. "Il tuo pattern più forte"
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

    const plClusters: ExploreCluster[] = Array.from(plMap.values())
      .filter((c) => c.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((c) => {
        const name = personNameMap.get(c.personId) ?? 'qualcuno'
        const sub  = (c.count >= 5 || c.years.size >= 3)
          ? 'Il tuo pattern più forte'
          : c.count >= 3
          ? 'Momenti ricorrenti'
          : 'Connessione in crescita'
        return {
          title:    `${name} × ${c.location}`,
          subtitle: sub,
          count:    c.count,
          href:     `/people/${c.personId}`,
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
    .map(([loc, years]) => {
      const sub = years.size >= 4 ? 'Un ritorno costante'
        : years.size >= 3 ? 'Ci torni spesso'
        : 'Un posto che torna'
      return {
        title:    loc,
        subtitle: sub,
        count:    years.size,
        href:     `/places/${encodeURIComponent(loc)}`,
      }
    })

  return [...clusters, ...recurringLoc].slice(0, 3)
}

// ── Ranking engine ─────────────────────────────────────────────────────────

export interface RankedPlace {
  place:      string
  count:      number
  yearsCount: number
  score:      number
  isTopPlace: boolean
}

export interface RankedPerson {
  id:              string
  name:            string
  avatarUrl:       string | null
  previewPhotoUrl: string | null
  memoryCount:     number
  firstMemoryDate: string | null
  lastMemoryDate:  string | null
  yearsSpan:       number
  score:           number
}

export interface RankedRecurring {
  id:    string
  label: string
  count: number
  href:  string
  kind:  'fixed' | 'birthday'
  score: number
}

export interface RankedConnection {
  title:      string
  subtitle:   string
  count:      number
  yearsCount: number
  score:      number
  href:       string
}

export type HeroKind = 'place' | 'person' | 'recurring'

export interface HeroCandidate {
  kind:       HeroKind
  subject:    string
  href:       string
  score:      number
  count:      number
  yearsCount: number
  yearsSpan:  number
  isBirthday: boolean
}

export interface RankedExploreResult {
  hero: { primary: HeroCandidate | null; secondary: HeroCandidate | null }
  people:      RankedPerson[]
  places:      RankedPlace[]
  recurring:   RankedRecurring[]
  connections: RankedConnection[]
}

/**
 * Single entry-point for the Explore ranking engine.
 * Fetches all raw data in parallel, applies scoring, and returns
 * structured arrays ready for UI rendering.
 *
 * Score formulae (from spec):
 *   place      = memoryCount + yearsCount × 2
 *   person     = memoryCount + yearsSpan × 2
 *   recurring  = count × 2 + (2 if birthday)
 *   connection = count + yearsCount × 2
 */
export async function getExploreRanked(): Promise<RankedExploreResult> {
  const { supabase, user } = await authedClient()

  // ── Parallel fetch ─────────────────────────────────────────────────────────
  const [memParts, allPeople, recurring, connLinks] = await Promise.all([
    // Memory location + date — needed for place scoring (yearsCount)
    supabase
      .from('memory_participants')
      .select('memories(location_name, start_date)')
      .eq('user_id', user.id)
      .not('joined_at', 'is', null),
    // People with memoryCount, firstMemoryDate, lastMemoryDate
    getTopPeople(50),
    // Fixed anchors + birthdays with counts
    getRecurringMoments(),
    // Person × memory links — needed for connection clusters
    supabase
      .from('memory_people')
      .select('person_id, memory_id')
      .eq('added_by', user.id),
  ])

  // ── PLACES ─────────────────────────────────────────────────────────────────
  // score = memoryCount + yearsCount × 2
  type MemLoc = { location_name: string | null; start_date: string }
  const memLocs: MemLoc[] = (memParts.data ?? [])
    .map((p) => p.memories as MemLoc | null)
    .filter(Boolean) as MemLoc[]

  const locMap = new Map<string, { count: number; years: Set<number> }>()
  for (const m of memLocs) {
    if (!m.location_name) continue
    const loc  = m.location_name.trim()
    const year = parseInt(m.start_date.split('-')[0])
    const e    = locMap.get(loc) ?? { count: 0, years: new Set<number>() }
    e.count++
    e.years.add(year)
    locMap.set(loc, e)
  }

  const sortedPlaces: RankedPlace[] = Array.from(locMap.entries())
    .map(([place, { count, years }]) => {
      const yearsCount = years.size
      return { place, count, yearsCount, score: count + yearsCount * 2, isTopPlace: false }
    })
    .sort((a, b) => b.score - a.score)

  if (sortedPlaces.length > 0) sortedPlaces[0].isTopPlace = true
  const rankedPlaces = sortedPlaces.slice(0, 6)

  // ── PEOPLE ─────────────────────────────────────────────────────────────────
  // score = memoryCount + yearsSpan × 2   filter: memoryCount >= 2
  const rankedPeople: RankedPerson[] = allPeople
    .filter((p) => p.memoryCount >= 2)
    .map((p) => {
      const lastYear  = p.lastMemoryDate  ? parseInt(p.lastMemoryDate.split('-')[0])  : 0
      const firstYear = p.firstMemoryDate ? parseInt(p.firstMemoryDate.split('-')[0]) : lastYear
      const yearsSpan = (lastYear && firstYear) ? lastYear - firstYear : 0
      return {
        id:              p.id,
        name:            p.name,
        avatarUrl:       p.avatarUrl,
        previewPhotoUrl: p.previewPhotoUrl,
        memoryCount:     p.memoryCount,
        firstMemoryDate: p.firstMemoryDate,
        lastMemoryDate:  p.lastMemoryDate,
        yearsSpan,
        score: p.memoryCount + yearsSpan * 2,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  // ── RECURRING ──────────────────────────────────────────────────────────────
  // score = count × 2 + (2 if birthday)   filter: count >= 2
  const rankedRecurring: RankedRecurring[] = recurring
    .filter((m) => m.count >= 2)
    .map((m) => ({
      id:    m.id,
      label: m.label,
      count: m.count,
      href:  m.href,
      kind:  m.kind,
      score: m.count * 2 + (m.kind === 'birthday' ? 2 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)

  // ── CONNECTIONS ────────────────────────────────────────────────────────────
  // score = count + yearsCount × 2   filter: count >= 2
  let rankedConnections: RankedConnection[] = []
  const links = connLinks.data ?? []

  if (links.length > 0) {
    const memIds = Array.from(new Set(links.map((l) => l.memory_id as string)))

    const { data: mems } = await supabase
      .from('memories')
      .select('id, location_name, start_date')
      .in('id', memIds)
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

    const personIds = Array.from(new Set(links.map((l) => l.person_id as string)))
    const { data: personsData } = await supabase
      .from('people')
      .select('id, name')
      .in('id', personIds)
    const personNameMap = new Map<string, string>(
      (personsData ?? []).map((p) => [p.id as string, p.name as string]),
    )

    const plMap = new Map<string, {
      personId: string; location: string; count: number; years: Set<number>
    }>()
    for (const l of links) {
      const mem = memLocMap.get(l.memory_id as string)
      if (!mem) continue
      const key   = `${l.person_id as string}::${mem.location}`
      const entry = plMap.get(key)
      if (entry) { entry.count++; entry.years.add(mem.year) }
      else        { plMap.set(key, { personId: l.person_id as string, location: mem.location, count: 1, years: new Set([mem.year]) }) }
    }

    rankedConnections = Array.from(plMap.values())
      .filter((c) => c.count >= 2)
      .map((c) => {
        const yearsCount = c.years.size
        const name     = personNameMap.get(c.personId) ?? 'qualcuno'
        const subtitle = (c.count >= 5 || yearsCount >= 3) ? 'Il tuo pattern più forte'
          : c.count >= 3 ? 'Momenti ricorrenti'
          : 'Connessione in crescita'
        return {
          title:    `${name} × ${c.location}`,
          subtitle,
          count:    c.count,
          yearsCount,
          score:    c.count + yearsCount * 2,
          href:     `/people/${c.personId}`,
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }

  // ── HERO SELECTION ─────────────────────────────────────────────────────────
  // Candidates filtered by minimum thresholds, sorted by score.
  // Ties broken by kind priority: place > person > recurring.
  const KIND_PRIORITY: Record<HeroKind, number> = { place: 0, person: 1, recurring: 2 }
  const heroCandidates: HeroCandidate[] = []

  // Place candidates — filter: count >= 3
  for (const p of sortedPlaces.filter((pl) => pl.count >= 3)) {
    heroCandidates.push({
      kind: 'place', subject: p.place,
      href: `/places/${encodeURIComponent(p.place)}`,
      score: p.score, count: p.count, yearsCount: p.yearsCount, yearsSpan: 0, isBirthday: false,
    })
  }

  // Person candidates — filter: memoryCount >= 4
  for (const p of allPeople.filter((p) => p.memoryCount >= 4)) {
    const lastYear  = p.lastMemoryDate  ? parseInt(p.lastMemoryDate.split('-')[0])  : 0
    const firstYear = p.firstMemoryDate ? parseInt(p.firstMemoryDate.split('-')[0]) : lastYear
    const yearsSpan = (lastYear && firstYear) ? lastYear - firstYear : 0
    heroCandidates.push({
      kind: 'person', subject: p.name.trim().split(/\s+/)[0],
      href: `/people/${p.id}`,
      score: p.memoryCount + yearsSpan * 2, count: p.memoryCount,
      yearsCount: 0, yearsSpan, isBirthday: false,
    })
  }

  // Recurring candidates — filter: count >= 3
  for (const m of recurring.filter((m) => m.count >= 3)) {
    heroCandidates.push({
      kind: 'recurring', subject: m.label,
      href: m.href,
      score: m.count * 2 + (m.kind === 'birthday' ? 2 : 0),
      count: m.count, yearsCount: 0, yearsSpan: 0, isBirthday: m.kind === 'birthday',
    })
  }

  heroCandidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind]
  })

  // Deduplicate and cap at 2
  const seen   = new Set<string>()
  const heroSelected: HeroCandidate[] = []
  for (const c of heroCandidates) {
    if (heroSelected.length >= 2) break
    const key = `${c.kind}:${c.subject}`
    if (!seen.has(key)) { seen.add(key); heroSelected.push(c) }
  }

  return {
    hero:        { primary: heroSelected[0] ?? null, secondary: heroSelected[1] ?? null },
    people:      rankedPeople,
    places:      rankedPlaces,
    recurring:   rankedRecurring,
    connections: rankedConnections,
  }
}

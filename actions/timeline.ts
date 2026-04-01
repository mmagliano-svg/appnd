'use server'

import { createServerClient } from '@/lib/supabase/server'

// ── Shared types ──────────────────────────────────────────────────────────

export interface YearSummary {
  year: number
  totalCount: number
  previewUrls: string[] // up to 3, for collage
}

export interface MonthSummary {
  month: number // 1–12
  totalCount: number
  previewUrls: string[] // up to 2
}

export interface TimelineEvent {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  location_name: string | null
  previewUrl: string | null
  isPeriod: boolean
}

export interface TimelineDayGroup {
  day: number
  events: TimelineEvent[]
}

// ── Shared helper: fetch user memory rows + resolve preview photos ─────────

type MemRow = {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  location_name: string | null
}

async function fetchUserMemories(userId: string): Promise<{
  memories: MemRow[]
  photoMap: Map<string, string>
}> {
  const supabase = await createServerClient()

  const { data } = await supabase
    .from('memory_participants')
    .select(`memories ( id, title, description, start_date, end_date, location_name )`)
    .eq('user_id', userId)
    .not('joined_at', 'is', null)

  if (!data) return { memories: [], photoMap: new Map() }

  const memories = data
    .map((p) => p.memories as MemRow | null)
    .filter(Boolean) as MemRow[]

  const memoryIds = memories.map((m) => m.id)
  const photoMap = new Map<string, string>()

  if (memoryIds.length > 0) {
    const { data: photos } = await supabase
      .from('memory_contributions')
      .select('memory_id, media_url, created_at')
      .eq('content_type', 'photo')
      .in('memory_id', memoryIds)
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })

    for (const p of photos ?? []) {
      if (!photoMap.has(p.memory_id) && p.media_url) {
        photoMap.set(p.memory_id, p.media_url as string)
      }
    }
  }

  return { memories, photoMap }
}

// ── getTimelineYears ──────────────────────────────────────────────────────

export async function getTimelineYears(): Promise<YearSummary[]> {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return []

  const { memories, photoMap } = await fetchUserMemories(user.id)

  // Group by year
  const yearMap = new Map<number, { count: number; previewUrls: string[] }>()

  for (const m of memories) {
    const year = Number(m.start_date.split('-')[0])
    if (!yearMap.has(year)) yearMap.set(year, { count: 0, previewUrls: [] })
    const entry = yearMap.get(year)!
    entry.count++
    if (entry.previewUrls.length < 3) {
      const url = photoMap.get(m.id)
      if (url) entry.previewUrls.push(url)
    }
  }

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => b - a) // newest first
    .map(([year, { count, previewUrls }]) => ({
      year,
      totalCount: count,
      previewUrls,
    }))
}

// ── getTimelineMonthsForYear ──────────────────────────────────────────────

export async function getTimelineMonthsForYear(year: number): Promise<MonthSummary[]> {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return []

  const { memories, photoMap } = await fetchUserMemories(user.id)

  // Filter to this year, group by month
  const monthMap = new Map<number, { count: number; previewUrls: string[] }>()

  for (const m of memories) {
    const [y, mo] = m.start_date.split('-').map(Number)
    if (y !== year) continue
    if (!monthMap.has(mo)) monthMap.set(mo, { count: 0, previewUrls: [] })
    const entry = monthMap.get(mo)!
    entry.count++
    if (entry.previewUrls.length < 2) {
      const url = photoMap.get(m.id)
      if (url) entry.previewUrls.push(url)
    }
  }

  return Array.from(monthMap.entries())
    .sort(([a], [b]) => b - a) // newest month first
    .map(([month, { count, previewUrls }]) => ({
      month,
      totalCount: count,
      previewUrls,
    }))
}

// ── getYearStoryData ──────────────────────────────────────────────────────
// Returns all (non-period) memories for a year with tags + categories for
// getYearHighlight, and resolved preview photos.

export interface YearStoryMemory {
  id: string
  title: string
  description: string | null
  start_date: string
  location_name: string | null
  previewUrl: string | null
  tags: string[]
  categories: string[]
  category: string | null
}

export async function getYearStoryData(year: number): Promise<YearStoryMemory[]> {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return []

  const { data } = await supabase
    .from('memory_participants')
    .select(`memories ( id, title, description, start_date, end_date, location_name, tags, categories, category )`)
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)

  if (!data) return []

  type FullRow = {
    id: string; title: string; description: string | null
    start_date: string; end_date: string | null; location_name: string | null
    tags: string[] | null; categories: string[] | null; category: string | null
  }

  const all = data.map((p) => p.memories as FullRow | null).filter(Boolean) as FullRow[]

  // Events only (no periods), filtered to requested year
  const yearMems = all.filter((m) => {
    const y = parseInt(m.start_date.split('-')[0])
    return y === year && !m.end_date
  })

  if (yearMems.length === 0) return []

  // Resolve one preview photo per memory
  const ids = yearMems.map((m) => m.id)
  const photoMap = new Map<string, string>()
  const { data: photos } = await supabase
    .from('memory_contributions')
    .select('memory_id, media_url, created_at')
    .eq('content_type', 'photo')
    .in('memory_id', ids)
    .not('media_url', 'is', null)
    .order('created_at', { ascending: false })

  for (const p of photos ?? []) {
    if (!photoMap.has(p.memory_id) && p.media_url) {
      photoMap.set(p.memory_id, p.media_url as string)
    }
  }

  return yearMems
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      start_date: m.start_date,
      location_name: m.location_name,
      previewUrl: photoMap.get(m.id) ?? null,
      tags: m.tags ?? [],
      categories: m.categories ?? [],
      category: m.category,
    }))
}

// ── getTimelineEventsForMonth ─────────────────────────────────────────────

export async function getTimelineEventsForMonth(
  year: number,
  month: number
): Promise<TimelineDayGroup[]> {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return []

  const { memories, photoMap } = await fetchUserMemories(user.id)

  // Filter to this year + month, group by day
  const dayMap = new Map<number, TimelineEvent[]>()

  for (const m of memories) {
    const [y, mo, d] = m.start_date.split('-').map(Number)
    if (y !== year || mo !== month) continue
    if (!dayMap.has(d)) dayMap.set(d, [])
    dayMap.get(d)!.push({
      id: m.id,
      title: m.title,
      description: m.description,
      start_date: m.start_date,
      end_date: m.end_date,
      location_name: m.location_name,
      previewUrl: photoMap.get(m.id) ?? null,
      isPeriod: Boolean(m.end_date),
    })
  }

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a - b) // ascending day order
    .map(([day, events]) => ({ day, events }))
}

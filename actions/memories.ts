'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { generateInviteToken } from '@/lib/utils/invite'
import { normalizeTags } from '@/lib/utils/tags'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export interface CreateMemoryInput {
  title: string
  start_date: string
  end_date?: string
  parent_period_id?: string | null
  location_name?: string
  description?: string
  category?: string        // kept for backward compat — prefer categories[]
  categories?: string[]
  tags?: string[]
  is_anniversary?: boolean
  is_first_time?: boolean
  group_id?: string | null
  sharing_status?: 'private' | 'shared'
}

export interface UpdateMemoryInput {
  id: string
  title: string
  start_date: string
  end_date?: string
  parent_period_id?: string | null
  location_name?: string
  description?: string
  category?: string        // kept for backward compat — prefer categories[]
  categories?: string[]
  tags?: string[]
  is_anniversary?: boolean
  is_first_time?: boolean
  sharing_status?: 'private' | 'shared'
}

// Non-redirecting version — returns memory ID, caller handles navigation
export async function createMemoryReturnId(input: CreateMemoryInput): Promise<string> {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/auth/login')

  const { data: memory, error: memoryError } = await supabase
    .from('memories')
    .insert({
      title: input.title.trim(),
      happened_at: input.start_date,
      start_date: input.start_date,
      end_date: input.end_date || null,
      parent_period_id: input.parent_period_id ?? null,
      location_name: input.location_name?.trim() || null,
      description: input.description?.trim() || null,
      categories: input.categories ?? (input.category ? [input.category] : []),
      category: (input.categories ?? [])[0] ?? input.category ?? null,
      tags: normalizeTags(input.tags ?? []),
      is_anniversary: input.is_anniversary ?? false,
      is_first_time: input.is_first_time ?? false,
      created_by: user!.id,
      group_id: input.group_id ?? null,
      sharing_status: input.sharing_status ?? 'private',
    })
    .select('id')
    .single()

  if (memoryError || !memory) {
    throw new Error('Impossibile creare il ricordo. Riprova.')
  }

  // Add creator as participant
  await supabase.from('memory_participants').insert({
    memory_id: memory.id,
    user_id: user!.id,
    invite_token: generateInviteToken(),
    joined_at: new Date().toISOString(),
  })

  // If memory belongs to a group, auto-add all other joined group members
  if (input.group_id) {
    const admin = createAdminClient()
    const { data: groupMembers } = await admin
      .from('group_members')
      .select('user_id')
      .eq('group_id', input.group_id)
      .not('user_id', 'is', null)
      .not('joined_at', 'is', null)
      .neq('user_id', user!.id)

    if (groupMembers && groupMembers.length > 0) {
      await admin.from('memory_participants').insert(
        groupMembers.map((m) => ({
          memory_id: memory.id,
          user_id: m.user_id!,
          joined_at: new Date().toISOString(),
          invite_token: generateInviteToken(),
        }))
      )
    }
  }

  return memory.id
}

export async function createMemory(input: CreateMemoryInput) {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/auth/login')

  const { data: memory, error: memoryError } = await supabase
    .from('memories')
    .insert({
      title: input.title.trim(),
      happened_at: input.start_date,
      start_date: input.start_date,
      end_date: input.end_date || null,
      parent_period_id: input.parent_period_id ?? null,
      location_name: input.location_name?.trim() || null,
      description: input.description?.trim() || null,
      categories: input.categories ?? (input.category ? [input.category] : []),
      category: (input.categories ?? [])[0] ?? input.category ?? null,
      tags: normalizeTags(input.tags ?? []),
      created_by: user.id,
    })
    .select('id')
    .single()

  if (memoryError || !memory) {
    throw new Error('Impossibile creare il ricordo. Riprova.')
  }

  const { error: participantError } = await supabase
    .from('memory_participants')
    .insert({
      memory_id: memory.id,
      user_id: user.id,
      invite_token: generateInviteToken(),
      joined_at: new Date().toISOString(),
    })

  if (participantError) {
    throw new Error('Errore interno. Riprova.')
  }

  redirect(`/memories/${memory.id}`)
}

export async function updateMemory(input: UpdateMemoryInput) {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/auth/login')

  // Only the creator can edit
  const { data: memory } = await supabase
    .from('memories')
    .select('created_by')
    .eq('id', input.id)
    .single()

  if (!memory || memory.created_by !== user.id) {
    throw new Error('Non hai i permessi per modificare questo ricordo.')
  }

  const { error } = await supabase
    .from('memories')
    .update({
      title: input.title.trim(),
      happened_at: input.start_date,
      start_date: input.start_date,
      end_date: input.end_date || null,
      parent_period_id: input.parent_period_id ?? null,
      location_name: input.location_name?.trim() || null,
      description: input.description?.trim() || null,
      categories: input.categories ?? (input.category ? [input.category] : []),
      category: (input.categories ?? [])[0] ?? input.category ?? null,
      tags: normalizeTags(input.tags ?? []),
      ...(input.sharing_status !== undefined ? { sharing_status: input.sharing_status } : {}),
    })
    .eq('id', input.id)

  if (error) {
    throw new Error('Impossibile aggiornare il ricordo. Riprova.')
  }

  revalidatePath(`/memories/${input.id}`)
  redirect(`/memories/${input.id}`)
}

export async function deleteMemory(id: string) {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/auth/login')

  // Only creator can delete
  const { data: memory } = await supabase
    .from('memories')
    .select('created_by')
    .eq('id', id)
    .single()

  if (!memory || memory.created_by !== user.id) {
    throw new Error('Non hai i permessi per eliminare questo ricordo.')
  }

  // Use admin client to bypass RLS and delete child rows first (FK constraints)
  const admin = createAdminClient()

  await admin.from('memory_invites').delete().eq('memory_id', id)
  await admin.from('memory_media').delete().eq('memory_id', id)
  await admin.from('memory_contributions').delete().eq('memory_id', id)
  await admin.from('memory_people').delete().eq('memory_id', id)
  await admin.from('memory_participants').delete().eq('memory_id', id)

  const { error } = await admin
    .from('memories')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error('Impossibile eliminare il ricordo. Riprova.')
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function getUserMemories() {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/auth/login')

  const { data, error } = await supabase
    .from('memory_participants')
    .select(`
      memory_id,
      joined_at,
      memories (
        id,
        title,
        start_date,
        end_date,
        parent_period_id,
        location_name,
        description,
        category,
        categories,
        tags,
        is_anniversary,
        is_first_time,
        created_by,
        created_at,
        memory_contributions ( id, media_url, content_type )
      )
    `)
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)
    .order('joined_at', { ascending: false })

  if (error) throw new Error(`Impossibile caricare i ricordi. Dettaglio: ${error.message}`)

  return data
    .map((p) => p.memories)
    .filter(Boolean)
    .sort((a, b) => {
      if (!a || !b) return 0
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    }) as Array<{
      id: string
      title: string
      start_date: string
      end_date: string | null
      parent_period_id: string | null
      location_name: string | null
      description: string | null
      category: string | null
      categories: string[]
      tags: string[]
      is_anniversary: boolean
      is_first_time: boolean
      created_by: string
      created_at: string
      memory_contributions: { id: string; media_url: string | null; content_type: string }[]
    }>
}

export async function getAllUserTags(): Promise<string[]> {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return []

  const { data } = await supabase
    .from('memory_participants')
    .select(`
      memories ( tags )
    `)
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)

  if (!data) return []

  const allTags = data
    .flatMap((p) => (p.memories as { tags: string[] } | null)?.tags ?? [])
    .filter(Boolean)

  // Return unique tags sorted alphabetically
  return Array.from(new Set(allTags)).sort()
}

// ── Esplora ───────────────────────────────────────────────────────────────

export interface ExploreTag {
  tag: string
  count: number
  previewUrl: string | null
}

export interface ExplorePlace {
  place: string
  count: number
  previewUrl: string | null
  // Reserved for future map integration
  lat: null
  lng: null
}

export interface ExploreCategory {
  value: string
  count: number
}

export interface ExploreData {
  topTags: ExploreTag[]
  topPlaces: ExplorePlace[]
  categories: ExploreCategory[]
}

export async function getExploreData(): Promise<ExploreData> {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { topTags: [], topPlaces: [], categories: [] }

  // Fetch memories with id so we can cross-reference photos
  const { data } = await supabase
    .from('memory_participants')
    .select(`memories ( id, tags, location_name, category, categories )`)
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)

  if (!data) return { topTags: [], topPlaces: [], categories: [] }

  type MemoryRow = { id: string; tags: string[]; location_name: string | null; category: string | null; categories: string[] }
  const memories = data
    .map((p) => p.memories as MemoryRow | null)
    .filter(Boolean) as MemoryRow[]

  const memoryIds = memories.map((m) => m.id)

  // Fetch latest photo per memory from contributions
  const photoMap = new Map<string, string>() // memoryId → mediaUrl
  if (memoryIds.length > 0) {
    const { data: photos } = await supabase
      .from('memory_contributions')
      .select('memory_id, media_url, created_at')
      .eq('content_type', 'photo')
      .in('memory_id', memoryIds)
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })

    if (photos) {
      for (const photo of photos) {
        if (!photoMap.has(photo.memory_id) && photo.media_url) {
          photoMap.set(photo.memory_id, photo.media_url as string)
        }
      }
    }
  }

  // Top tags by frequency + preview from latest memory with a photo
  const tagData: Record<string, { count: number; previewUrl: string | null }> = {}
  for (const m of memories) {
    for (const t of m.tags ?? []) {
      if (!tagData[t]) tagData[t] = { count: 0, previewUrl: null }
      tagData[t].count++
      if (!tagData[t].previewUrl) {
        tagData[t].previewUrl = photoMap.get(m.id) ?? null
      }
    }
  }
  const topTags = Object.entries(tagData)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 8)
    .map(([tag, { count, previewUrl }]) => ({ tag, count, previewUrl }))

  // Unique places by frequency + preview
  const placeData: Record<string, { count: number; previewUrl: string | null }> = {}
  for (const m of memories) {
    if (m.location_name?.trim()) {
      const p = m.location_name.trim()
      if (!placeData[p]) placeData[p] = { count: 0, previewUrl: null }
      placeData[p].count++
      if (!placeData[p].previewUrl) {
        placeData[p].previewUrl = photoMap.get(m.id) ?? null
      }
    }
  }
  const topPlaces = Object.entries(placeData)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 8)
    .map(([place, { count, previewUrl }]) => ({ place, count, previewUrl, lat: null, lng: null }))

  // Categories with count — use the multi-category array, fall back to legacy single field
  const categoryCounts: Record<string, number> = {}
  for (const m of memories) {
    const cats = m.categories?.length ? m.categories : (m.category ? [m.category] : [])
    for (const cat of cats) {
      categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1
    }
  }
  const categories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([value, count]) => ({ value, count }))

  return { topTags, topPlaces, categories }
}

// ── Timeline ──────────────────────────────────────────────────────────────

export interface TimelineMemory {
  id: string
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  location_name: string | null
  category: string | null   // legacy — use categories[]
  categories: string[]
  tags: string[]
  is_anniversary: boolean
  is_first_time: boolean
  parent_period_id: string | null
  previewUrl: string | null
}

// Fetches all user memories (flat) with one photo preview per memory.
// Grouping (year/month/day) is done client-side — no extra API calls needed.
export async function getTimelineMemories(): Promise<TimelineMemory[]> {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return []

  // Step 1 — get IDs of memories the user has actually joined (deduplicated)
  const { data: participantRows } = await supabase
    .from('memory_participants')
    .select('memory_id')
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)

  const memoryIds = Array.from(new Set((participantRows ?? []).map((r) => r.memory_id as string)))
  if (memoryIds.length === 0) return []

  // Step 2 — fetch memories directly (avoids JOIN type coercion issues)
  type MemRow = {
    id: string
    title: string
    description: string | null
    start_date: string
    end_date: string | null
    location_name: string | null
    category: string | null
    categories: string[]
    tags: string[]
    is_anniversary: boolean
    is_first_time: boolean
    parent_period_id: string | null
  }

  const { data: memoriesData } = await supabase
    .from('memories')
    .select('id, title, description, start_date, end_date, location_name, category, categories, tags, is_anniversary, is_first_time, parent_period_id')
    .in('id', memoryIds)

  const memories = (memoriesData ?? []) as MemRow[]

  // DEBUG — remove after fixing period detection
  console.log('[Timeline] total:', memories.length,
    '| periods (end_date≠null):', memories.filter(m => Boolean(m.end_date)).length,
    '| sample end_dates:', memories.slice(0, 5).map(m => `${m.title}→${m.end_date}`).join(', ')
  )

  // Resolve preview photo for each memory
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

  return memories
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      start_date: m.start_date,
      end_date: m.end_date,
      location_name: m.location_name,
      category: m.category,
      categories: m.categories?.length ? m.categories : (m.category ? [m.category] : []),
      tags: m.tags ?? [],
      is_anniversary: m.is_anniversary,
      is_first_time: m.is_first_time,
      parent_period_id: m.parent_period_id ?? null,
      previewUrl: photoMap.get(m.id) ?? null,
    }))
}

// ── On This Day ───────────────────────────────────────────────────────────

export interface OnThisDayMemory {
  id: string
  title: string
  start_date: string
  end_date: string | null
  previewUrl: string | null
}

// Returns memories whose start_date day+month matches today, across all years
export async function getOnThisDayMemories(): Promise<OnThisDayMemory[]> {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return []

  const today = new Date()
  const todayMonth = today.getMonth() + 1 // 1–12
  const todayDay = today.getDate()

  const { data } = await supabase
    .from('memory_participants')
    .select(`memories ( id, title, start_date, end_date )`)
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)

  if (!data) return []

  type MemRow = { id: string; title: string; start_date: string; end_date: string | null }
  const memories = data
    .map((p) => p.memories as MemRow | null)
    .filter(Boolean) as MemRow[]

  // Filter by same day + month regardless of year
  const matched = memories.filter((m) => {
    const [, mm, dd] = m.start_date.split('-').map(Number)
    return mm === todayMonth && dd === todayDay
  })

  if (matched.length === 0) return []

  // Fetch preview photos
  const ids = matched.map((m) => m.id)
  const { data: photos } = await supabase
    .from('memory_contributions')
    .select('memory_id, media_url, created_at')
    .eq('content_type', 'photo')
    .in('memory_id', ids)
    .not('media_url', 'is', null)
    .order('created_at', { ascending: false })

  const photoMap = new Map<string, string>()
  for (const p of photos ?? []) {
    if (!photoMap.has(p.memory_id) && p.media_url) {
      photoMap.set(p.memory_id, p.media_url as string)
    }
  }

  // Sort newest year first
  return matched
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map((m) => ({
      id: m.id,
      title: m.title,
      start_date: m.start_date,
      end_date: m.end_date,
      previewUrl: photoMap.get(m.id) ?? null,
    }))
}

// ── Periods ───────────────────────────────────────────────────────────────

export interface PeriodSummary {
  id: string
  title: string
  start_date: string
  end_date: string   // '9999-12-31' = still ongoing
}

// Returns all periods the user participates in, sorted by start_date desc.
// Periods are identified by having end_date set (non-null).
// Ongoing periods use the sentinel value '9999-12-31'.
export async function getUserPeriods(): Promise<PeriodSummary[]> {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return []

  const { data } = await supabase
    .from('memory_participants')
    .select(`
      memories ( id, title, start_date, end_date )
    `)
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)

  if (!data) return []

  return data
    .map((p) => p.memories as { id: string; title: string; start_date: string; end_date: string | null } | null)
    .filter((m): m is PeriodSummary => m !== null && m.end_date !== null)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
}

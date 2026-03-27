'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────────────────────

export interface PersonSummary {
  userId: string
  displayName: string
  sharedCount: number
  avatarUrl: string | null
  lastMemoryDate: string | null
  firstMemoryDate: string | null
  previewPhotoUrl: string | null   // photo from most recent shared memory
}

export interface SharedMemory {
  id: string
  title: string
  start_date: string
  end_date: string | null
  location_name: string | null
  category: string | null
  categories: string[]
  description: string | null
  is_first_time: boolean
  is_anniversary: boolean
  previewUrl: string | null
}

export interface SharedMemoriesResult {
  otherUser: { id: string; displayName: string }
  memories: SharedMemory[]
  stats: {
    totalCount: number
    firstDate: string | null
    uniqueLocations: number
    allPhotos: string[]   // up to 12 — for the photo strip
  }
}

// ── All people you share memories with ────────────────────────────────────

export async function getSharedPeople(): Promise<PersonSummary[]> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // My joined memory IDs
  const { data: myParts } = await supabase
    .from('memory_participants')
    .select('memory_id')
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)

  const myIds = (myParts ?? []).map((p) => p.memory_id)
  if (myIds.length === 0) return []

  // All OTHER joined participants in those memories (with memory_id for date mapping)
  const { data: others } = await supabase
    .from('memory_participants')
    .select('user_id, memory_id')
    .neq('user_id', user.id)
    .not('user_id', 'is', null)
    .not('joined_at', 'is', null)
    .in('memory_id', myIds)

  if (!others || others.length === 0) return []

  // Fetch memory dates for all shared memories
  const allSharedMemIds = Array.from(new Set(others.map((p) => p.memory_id)))
  const { data: memDates } = await supabase
    .from('memories')
    .select('id, start_date')
    .in('id', allSharedMemIds)

  const memDateMap = new Map((memDates ?? []).map((m) => [m.id, m.start_date]))

  // Count + first/last dates per person
  const countMap    = new Map<string, number>()
  const lastDateMap = new Map<string, string>()
  const firstDateMap = new Map<string, string>()
  const lastMemIdMap = new Map<string, string>()   // person → most recent memory id

  for (const p of others) {
    if (!p.user_id) continue
    const date = memDateMap.get(p.memory_id)
    countMap.set(p.user_id, (countMap.get(p.user_id) ?? 0) + 1)
    if (date) {
      const lastDate = lastDateMap.get(p.user_id)
      if (!lastDate || date > lastDate) {
        lastDateMap.set(p.user_id, date)
        lastMemIdMap.set(p.user_id, p.memory_id)
      }
      const firstDate = firstDateMap.get(p.user_id)
      if (!firstDate || date < firstDate) firstDateMap.set(p.user_id, date)
    }
  }

  // Fetch user profiles (avatar included)
  const userIds = Array.from(countMap.keys())
  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, email, avatar_url')
    .in('id', userIds)

  // Fetch one preview photo per person (from their most recent shared memory)
  const lastMemIds = Array.from(new Set(Array.from(lastMemIdMap.values())))
  const { data: previewPhotos } = await supabase
    .from('memory_contributions')
    .select('memory_id, media_url')
    .eq('content_type', 'photo')
    .in('memory_id', lastMemIds)
    .not('media_url', 'is', null)
    .order('created_at', { ascending: true })

  // First photo per memory
  const previewPhotoMap = new Map<string, string>()
  for (const p of previewPhotos ?? []) {
    if (p.media_url && !previewPhotoMap.has(p.memory_id)) {
      previewPhotoMap.set(p.memory_id, p.media_url)
    }
  }

  return (users ?? [])
    .map((u) => {
      const lastMemId = lastMemIdMap.get(u.id)
      return {
        userId: u.id,
        displayName: u.display_name ?? u.email,
        sharedCount: countMap.get(u.id) ?? 0,
        avatarUrl: u.avatar_url ?? null,
        lastMemoryDate: lastDateMap.get(u.id) ?? null,
        firstMemoryDate: firstDateMap.get(u.id) ?? null,
        previewPhotoUrl: lastMemId ? (previewPhotoMap.get(lastMemId) ?? null) : null,
      }
    })
    .sort((a, b) => b.sharedCount - a.sharedCount)
}

// ── Full data for the NOI page ─────────────────────────────────────────────

export async function getSharedMemoriesWithUser(
  otherUserId: string,
): Promise<SharedMemoriesResult | null> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch other user info
  const { data: otherUser } = await supabase
    .from('users')
    .select('id, display_name, email')
    .eq('id', otherUserId)
    .single()

  if (!otherUser) return null

  const otherName = otherUser.display_name ?? otherUser.email
  const emptyResult: SharedMemoriesResult = {
    otherUser: { id: otherUser.id, displayName: otherName },
    memories: [],
    stats: { totalCount: 0, firstDate: null, uniqueLocations: 0, allPhotos: [] },
  }

  // My joined memory IDs
  const { data: myParts } = await supabase
    .from('memory_participants')
    .select('memory_id')
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)

  const myIds = (myParts ?? []).map((p) => p.memory_id)
  if (myIds.length === 0) return emptyResult

  // IDs also joined by the other user
  const { data: sharedParts } = await supabase
    .from('memory_participants')
    .select('memory_id')
    .eq('user_id', otherUserId)
    .not('joined_at', 'is', null)
    .in('memory_id', myIds)

  const sharedIds = (sharedParts ?? []).map((p) => p.memory_id)
  if (sharedIds.length === 0) return emptyResult

  // Fetch memories — oldest first to read the arc of the relationship
  const { data: mems } = await supabase
    .from('memories')
    .select(
      'id, title, start_date, end_date, location_name, category, categories, description, is_first_time, is_anniversary',
    )
    .in('id', sharedIds)
    .order('start_date', { ascending: true })

  if (!mems || mems.length === 0) return emptyResult

  // Resolve photos — oldest first so the strip reads chronologically
  const photoMap = new Map<string, string>()
  const allPhotos: string[] = []

  const { data: photos } = await supabase
    .from('memory_contributions')
    .select('memory_id, media_url, created_at')
    .eq('content_type', 'photo')
    .in('memory_id', sharedIds)
    .not('media_url', 'is', null)
    .order('created_at', { ascending: true })

  for (const p of photos ?? []) {
    if (!p.media_url) continue
    allPhotos.push(p.media_url)
    if (!photoMap.has(p.memory_id)) photoMap.set(p.memory_id, p.media_url)
  }

  // Stats
  const uniqueLocations = new Set(
    mems.filter((m) => m.location_name).map((m) => m.location_name!),
  ).size

  return {
    otherUser: { id: otherUser.id, displayName: otherName },
    memories: mems.map((m) => ({
      id: m.id,
      title: m.title,
      start_date: m.start_date,
      end_date: m.end_date,
      location_name: m.location_name,
      category: m.category,
      categories: (m.categories as string[] | null)?.length ? (m.categories as string[]) : (m.category ? [m.category] : []),
      description: m.description,
      is_first_time: m.is_first_time,
      is_anniversary: m.is_anniversary,
      previewUrl: photoMap.get(m.id) ?? null,
    })),
    stats: {
      totalCount: mems.length,
      firstDate: mems[0]?.start_date ?? null,
      uniqueLocations,
      allPhotos: allPhotos.slice(0, 12),
    },
  }
}

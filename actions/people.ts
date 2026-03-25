'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────────────────────

export interface PersonSummary {
  userId: string
  displayName: string
  sharedCount: number
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

  // All OTHER joined participants in those memories
  const { data: others } = await supabase
    .from('memory_participants')
    .select('user_id')
    .neq('user_id', user.id)
    .not('user_id', 'is', null)
    .not('joined_at', 'is', null)
    .in('memory_id', myIds)

  if (!others || others.length === 0) return []

  // Count shared memories per person
  const countMap = new Map<string, number>()
  for (const p of others) {
    if (!p.user_id) continue
    countMap.set(p.user_id, (countMap.get(p.user_id) ?? 0) + 1)
  }

  // Fetch names
  const userIds = Array.from(countMap.keys())
  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, email')
    .in('id', userIds)

  return (users ?? [])
    .map((u) => ({
      userId: u.id,
      displayName: u.display_name ?? u.email,
      sharedCount: countMap.get(u.id) ?? 0,
    }))
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

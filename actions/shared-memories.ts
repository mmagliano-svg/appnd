'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SharedContribution {
  id: string
  author_user_id: string
  author_name: string
  body: string
  created_at: string
}

export interface SharedMemoryDetail {
  id: string
  title: string
  start_date: string
  location_name: string | null
  anchor_id: string | null
  owner_user_id: string
  contributions: SharedContribution[]
  participant_count: number
}

// ── createSharedMemory ────────────────────────────────────────────────────────

/**
 * Creates a shared_memory, adds participants, saves the creator's first
 * contribution (if description present), and links memories.shared_memory_id.
 * Called after createMemoryReturnId succeeds.
 */
export async function createSharedMemory({
  memoryId,
  title,
  start_date,
  location_name,
  anchor_id,
  participantPersonIds,
  creatorBody,
}: {
  memoryId: string
  title: string
  start_date: string
  location_name?: string | null
  anchor_id?: string | null
  participantPersonIds: string[]
  creatorBody?: string | null
}): Promise<string> {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/auth/login')

  // 1. Create shared_memory
  const { data: sm, error: smError } = await supabase
    .from('shared_memories')
    .insert({
      owner_user_id: user.id,
      title: title.trim(),
      start_date,
      location_name: location_name?.trim() || null,
      anchor_id: anchor_id || null,
    })
    .select('id')
    .single()

  if (smError || !sm) throw new Error('Impossibile creare il ricordo condiviso.')

  // 2. Resolve linked_user_id for each person and insert participants
  if (participantPersonIds.length > 0) {
    const { data: persons } = await supabase
      .from('people')
      .select('id, linked_user_id')
      .in('id', participantPersonIds)

    const rows = (persons ?? []).map((p) => ({
      shared_memory_id: sm.id,
      person_id: p.id,
      linked_user_id: (p as { id: string; linked_user_id: string | null }).linked_user_id ?? null,
      role: 'participant' as const,
      invite_status: 'pending' as const,
      added_by_user_id: user.id,
    }))

    if (rows.length > 0) {
      await supabase.from('shared_memory_participants').insert(rows)
    }
  }

  // 3. Creator's first contribution — from memory description
  if (creatorBody?.trim()) {
    await supabase.from('shared_memory_contributions').insert({
      shared_memory_id: sm.id,
      author_user_id: user.id,
      body: creatorBody.trim(),
    })
  }

  // 4. Link memory → shared_memory
  await supabase
    .from('memories')
    .update({ shared_memory_id: sm.id })
    .eq('id', memoryId)
    .eq('created_by', user.id)

  revalidatePath(`/memories/${memoryId}`)
  return sm.id
}

// ── getSharedMemoryDetail ─────────────────────────────────────────────────────

export async function getSharedMemoryDetail(
  sharedMemoryId: string
): Promise<SharedMemoryDetail | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [
    { data: sm },
    { data: contributions },
    { data: participants },
  ] = await Promise.all([
    supabase
      .from('shared_memories')
      .select('id, title, start_date, location_name, anchor_id, owner_user_id')
      .eq('id', sharedMemoryId)
      .single(),
    supabase
      .from('shared_memory_contributions')
      .select('id, author_user_id, body, created_at')
      .eq('shared_memory_id', sharedMemoryId)
      .order('created_at', { ascending: true }),
    supabase
      .from('shared_memory_participants')
      .select('id')
      .eq('shared_memory_id', sharedMemoryId),
  ])

  if (!sm) return null

  // Resolve author names
  const authorIds = Array.from(new Set((contributions ?? []).map((c) => c.author_user_id)))
  const authorMap = new Map<string, string>()
  if (authorIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name, email')
      .in('id', authorIds)
    for (const u of users ?? []) {
      authorMap.set(u.id, u.display_name ?? u.email?.split('@')[0] ?? 'Utente')
    }
  }

  return {
    id: sm.id,
    title: sm.title,
    start_date: sm.start_date,
    location_name: sm.location_name,
    anchor_id: sm.anchor_id,
    owner_user_id: sm.owner_user_id,
    contributions: (contributions ?? []).map((c) => ({
      id: c.id,
      author_user_id: c.author_user_id,
      author_name: authorMap.get(c.author_user_id) ?? 'Utente',
      body: c.body,
      created_at: c.created_at,
    })),
    participant_count: (participants ?? []).length,
  }
}

// ── addSharedMemoryContribution ───────────────────────────────────────────────

export async function addSharedMemoryContribution(
  sharedMemoryId: string,
  body: string
): Promise<void> {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/auth/login')

  const { error } = await supabase.from('shared_memory_contributions').insert({
    shared_memory_id: sharedMemoryId,
    author_user_id: user.id,
    body: body.trim(),
  })

  if (error) throw new Error('Impossibile aggiungere il ricordo. Riprova.')

  revalidatePath(`/shared/${sharedMemoryId}/add`)
}

// ── getSharedMemoriesForPerson ────────────────────────────────────────────────

export async function getSharedMemoriesForPerson(
  personId: string
): Promise<Array<{ id: string; title: string; start_date: string; contribution_count: number }>> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: participantRows } = await supabase
    .from('shared_memory_participants')
    .select('shared_memory_id')
    .eq('person_id', personId)

  if (!participantRows || participantRows.length === 0) return []

  const ids = participantRows.map((r) => r.shared_memory_id)

  const [{ data: sms }, { data: contribs }] = await Promise.all([
    supabase
      .from('shared_memories')
      .select('id, title, start_date')
      .in('id', ids)
      .order('start_date', { ascending: false }),
    supabase
      .from('shared_memory_contributions')
      .select('shared_memory_id')
      .in('shared_memory_id', ids),
  ])

  const countMap = new Map<string, number>()
  for (const c of contribs ?? []) {
    countMap.set(c.shared_memory_id, (countMap.get(c.shared_memory_id) ?? 0) + 1)
  }

  return (sms ?? []).map((sm) => ({
    id: sm.id,
    title: sm.title,
    start_date: sm.start_date,
    contribution_count: countMap.get(sm.id) ?? 0,
  }))
}

// ── getHomeSharedMoments ──────────────────────────────────────────────────────

export interface HomeSharedMoment {
  id: string
  title: string
  signal: string
  participant_count: number
  contribution_count: number
}

/**
 * Returns up to 3 shared memories where the current user is a participant.
 * Used on the Home screen — caller should hide the section if result is empty.
 */
export async function getHomeSharedMoments(): Promise<HomeSharedMoment[]> {
  // DEBUG: force visible items to verify UI rendering — remove flag to restore live data
  const DEBUG_SHARED_MOMENTS = true
  if (DEBUG_SHARED_MOMENTS) {
    return [
      {
        id: 'test-1',
        title: 'Festa di compleanno Margherita',
        signal: 'Bea ha aggiunto qualcosa',
        participant_count: 3,
        contribution_count: 2,
      },
      {
        id: 'test-2',
        title: 'Weekend in montagna',
        signal: 'Manca ancora qualcuno',
        participant_count: 2,
        contribution_count: 0,
      },
    ]
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Shared memory ids where user is a participant
  const { data: partRows } = await supabase
    .from('shared_memory_participants')
    .select('shared_memory_id')
    .eq('linked_user_id', user.id)

  const smIds = (partRows ?? []).map((r) => r.shared_memory_id)
  if (smIds.length === 0) return []

  // Fetch memory titles
  const { data: smRows } = await supabase
    .from('shared_memories')
    .select('id, title')
    .in('id', smIds)
    .order('created_at', { ascending: false })
    .limit(3)

  if (!smRows || smRows.length === 0) return []

  const ids = smRows.map((r) => r.id)

  // Participant + contribution counts + latest contributor in parallel
  const [{ data: allParts }, { data: allContribs }] = await Promise.all([
    supabase.from('shared_memory_participants').select('shared_memory_id').in('shared_memory_id', ids),
    supabase
      .from('shared_memory_contributions')
      .select('shared_memory_id, author_user_id, created_at')
      .in('shared_memory_id', ids)
      .order('created_at', { ascending: false }),
  ])

  const partCounts = new Map<string, number>()
  for (const r of allParts ?? []) {
    partCounts.set(r.shared_memory_id, (partCounts.get(r.shared_memory_id) ?? 0) + 1)
  }
  const contribCounts = new Map<string, number>()
  const latestAuthorId = new Map<string, string>() // smId → most recent author_user_id
  for (const r of allContribs ?? []) {
    contribCounts.set(r.shared_memory_id, (contribCounts.get(r.shared_memory_id) ?? 0) + 1)
    if (!latestAuthorId.has(r.shared_memory_id)) {
      latestAuthorId.set(r.shared_memory_id, r.author_user_id)
    }
  }

  // Resolve display names for latest authors who aren't the current user
  const externalAuthorIds = Array.from(
    new Set(Array.from(latestAuthorId.values()).filter((id) => id !== user.id))
  )
  const authorNameMap = new Map<string, string>()
  if (externalAuthorIds.length > 0) {
    const { data: authorRows } = await supabase
      .from('users')
      .select('id, display_name, email')
      .in('id', externalAuthorIds)
    for (const u of authorRows ?? []) {
      authorNameMap.set(
        u.id,
        u.display_name ?? u.email?.split('@')[0] ?? 'Qualcuno',
      )
    }
  }

  return smRows.map((sm) => {
    const lastId = latestAuthorId.get(sm.id)
    const signal =
      lastId && lastId !== user.id && authorNameMap.has(lastId)
        ? `${authorNameMap.get(lastId)} ha aggiunto qualcosa`
        : `${partCounts.get(sm.id) ?? 0} persone coinvolte`
    return {
      id: sm.id,
      title: sm.title,
      signal,
      participant_count: partCounts.get(sm.id) ?? 0,
      contribution_count: contribCounts.get(sm.id) ?? 0,
    }
  })
}

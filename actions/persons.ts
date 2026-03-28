'use server'

import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { RelationshipType } from '@/lib/supabase/types'
export type { RelationshipType }

// ── Types ──────────────────────────────────────────────────────────────────

export interface SimplePerson {
  id: string
  name: string
  avatarUrl: string | null
}

export interface Person extends SimplePerson {
  status: 'ghost' | 'invited' | 'active'
  memoryCount: number
  firstMemoryDate: string | null
  lastMemoryDate: string | null
  previewPhotoUrl: string | null
}

export interface PersonMemory {
  id: string
  title: string
  start_date: string
  location_name: string | null
  category: string | null
  categories: string[]
  previewUrl: string | null
  sharingStatus: 'private' | 'shared'
}

export interface PersonGroup {
  id: string
  name: string
}

export interface PersonDetail {
  id: string
  name: string
  firstName: string | null
  lastName: string | null
  nicknames: string[]
  avatarUrl: string | null
  relationLabel: string | null
  shortBio: string | null
  howWeMet: string | null
  sharedContext: string | null
  relationshipType: RelationshipType | null
  claimStatus: 'none' | 'claimable' | 'invited' | 'claimed'
  status: 'ghost' | 'invited' | 'active'
  linkedUserId: string | null
  groups: PersonGroup[]
  memories: PersonMemory[]
  stats: {
    totalCount: number
    firstDate: string | null
    uniqueLocations: number
    allPhotos: string[]
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function authedClient() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return { supabase, user: user! }
}

// ── Actions ────────────────────────────────────────────────────────────────

/** Lightweight list for autocomplete — id, name, avatar only */
export async function getPersonsSimple(): Promise<SimplePerson[]> {
  const { supabase, user } = await authedClient()

  const { data } = await supabase
    .from('people')
    .select('id, name, avatar_url')
    .eq('owner_id', user.id)
    .order('name', { ascending: true })

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    avatarUrl: p.avatar_url ?? null,
  }))
}

/** Full list with memory counts — for /people page */
export async function getAllPersons(): Promise<Person[]> {
  const { supabase, user } = await authedClient()

  const { data: persons } = await supabase
    .from('people')
    .select('id, name, avatar_url, status')
    .eq('owner_id', user.id)
    .order('name', { ascending: true })

  if (!persons || persons.length === 0) return []

  const personIds = persons.map((p) => p.id)

  // Count memories per person
  const { data: links } = await supabase
    .from('memory_people')
    .select('person_id, memory_id')
    .in('person_id', personIds)
    .eq('added_by', user.id)

  const countMap = new Map<string, number>()
  const memIdsMap = new Map<string, string[]>()
  for (const l of links ?? []) {
    countMap.set(l.person_id, (countMap.get(l.person_id) ?? 0) + 1)
    const arr = memIdsMap.get(l.person_id) ?? []
    arr.push(l.memory_id)
    memIdsMap.set(l.person_id, arr)
  }

  // Last memory date per person
  const allMemIds = Array.from(new Set((links ?? []).map((l) => l.memory_id)))
  const { data: mems } = allMemIds.length
    ? await supabase
        .from('memories')
        .select('id, start_date')
        .in('id', allMemIds)
    : { data: [] }

  const memDateMap = new Map((mems ?? []).map((m) => [m.id, m.start_date]))

  const lastDateMap  = new Map<string, string>()
  const firstDateMap = new Map<string, string>()
  const lastMemIdMap = new Map<string, string>()
  for (const [pid, mids] of Array.from(memIdsMap.entries())) {
    let best: string | null = null
    let first: string | null = null
    let bestMid: string | null = null
    for (const mid of mids) {
      const d = memDateMap.get(mid)
      if (d) {
        if (!best || d > best) { best = d; bestMid = mid }
        if (!first || d < first) first = d
      }
    }
    if (best) lastDateMap.set(pid, best)
    if (first) firstDateMap.set(pid, first)
    if (bestMid) lastMemIdMap.set(pid, bestMid)
  }

  // Preview photos
  const lastMemIds = Array.from(new Set(Array.from(lastMemIdMap.values())))
  const { data: photos } = lastMemIds.length
    ? await supabase
        .from('memory_contributions')
        .select('memory_id, media_url')
        .eq('content_type', 'photo')
        .in('memory_id', lastMemIds)
        .not('media_url', 'is', null)
        .order('created_at', { ascending: true })
    : { data: [] }

  const previewMap = new Map<string, string>()
  for (const p of photos ?? []) {
    if (p.media_url && !previewMap.has(p.memory_id)) previewMap.set(p.memory_id, p.media_url)
  }

  return persons
    .map((p) => {
      const lastMid = lastMemIdMap.get(p.id)
      return {
        id: p.id,
        name: p.name,
        avatarUrl: p.avatar_url ?? null,
        status: (p.status ?? 'ghost') as Person['status'],
        memoryCount: countMap.get(p.id) ?? 0,
        firstMemoryDate: firstDateMap.get(p.id) ?? null,
        lastMemoryDate: lastDateMap.get(p.id) ?? null,
        previewPhotoUrl: lastMid ? (previewMap.get(lastMid) ?? null) : null,
      }
    })
    .sort((a, b) => b.memoryCount - a.memoryCount)
}

/** Create ghost person or return existing one with same name (case-insensitive) */
export async function createOrGetPerson(name: string): Promise<SimplePerson> {
  const { supabase, user } = await authedClient()

  const normalized = name.trim()

  // Try to find existing (Supabase unique index is on lower(name))
  const { data: existing } = await supabase
    .from('people')
    .select('id, name, avatar_url')
    .eq('owner_id', user.id)
    .ilike('name', normalized)
    .maybeSingle()

  if (existing) {
    return { id: existing.id, name: existing.name, avatarUrl: existing.avatar_url ?? null }
  }

  const { data: created, error } = await supabase
    .from('people')
    .insert({ owner_id: user.id, name: normalized, status: 'ghost' })
    .select('id, name, avatar_url')
    .single()

  if (error || !created) throw new Error(`Impossibile creare persona: ${error?.message}`)

  return { id: created.id, name: created.name, avatarUrl: created.avatar_url ?? null }
}

/** Full detail page data for a person */
export async function getPersonDetail(personId: string): Promise<PersonDetail | null> {
  const { supabase, user } = await authedClient()

  // Verify ownership
  const { data: person } = await supabase
    .from('people')
    .select('id, name, first_name, last_name, nicknames, avatar_url, relation_label, short_bio, how_we_met, shared_context, relationship_type, claim_status, status, linked_user_id, group_ids')
    .eq('id', personId)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!person) return null

  // Resolve group associations (RLS ensures only groups the current user belongs to are returned)
  const rawGroupIds = (person.group_ids ?? []) as string[]
  const personGroups: PersonGroup[] = []
  if (rawGroupIds.length > 0) {
    const { data: groupRows } = await supabase
      .from('groups')
      .select('id, name')
      .in('id', rawGroupIds)
    for (const g of groupRows ?? []) personGroups.push({ id: g.id, name: g.name })
  }

  // Their memories
  const { data: links } = await supabase
    .from('memory_people')
    .select('memory_id')
    .eq('person_id', personId)
    .eq('added_by', user.id)

  const memIds = (links ?? []).map((l) => l.memory_id)
  if (memIds.length === 0) {
    return {
      id: person.id,
      name: person.name,
      firstName: person.first_name ?? null,
      lastName: person.last_name ?? null,
      nicknames: (person.nicknames as string[] | null) ?? [],
      avatarUrl: person.avatar_url ?? null,
      relationLabel: person.relation_label ?? null,
      shortBio: person.short_bio ?? null,
      howWeMet: person.how_we_met ?? null,
      sharedContext: person.shared_context ?? null,
      relationshipType: (person.relationship_type ?? null) as RelationshipType | null,
      claimStatus: (person.claim_status ?? 'none') as PersonDetail['claimStatus'],
      status: (person.status ?? 'ghost') as PersonDetail['status'],
      linkedUserId: person.linked_user_id ?? null,
      groups: personGroups,
      memories: [],
      stats: { totalCount: 0, firstDate: null, uniqueLocations: 0, allPhotos: [] },
    }
  }

  const { data: mems } = await supabase
    .from('memories')
    .select('id, title, start_date, location_name, category, categories, sharing_status')
    .in('id', memIds)
    .order('start_date', { ascending: true })

  // Photos
  const { data: photos } = await supabase
    .from('memory_contributions')
    .select('memory_id, media_url')
    .eq('content_type', 'photo')
    .in('memory_id', memIds)
    .not('media_url', 'is', null)
    .order('created_at', { ascending: true })

  const photoMap = new Map<string, string>()
  const allPhotos: string[] = []
  for (const p of photos ?? []) {
    if (!p.media_url) continue
    allPhotos.push(p.media_url)
    if (!photoMap.has(p.memory_id)) photoMap.set(p.memory_id, p.media_url)
  }

  const uniqueLocations = new Set(
    (mems ?? []).filter((m) => m.location_name).map((m) => m.location_name!)
  ).size

  return {
    id: person.id,
    name: person.name,
    firstName: person.first_name ?? null,
    lastName: person.last_name ?? null,
    nickname: person.nickname ?? null,
    avatarUrl: person.avatar_url ?? null,
    relationLabel: person.relation_label ?? null,
    shortBio: person.short_bio ?? null,
    howWeMet: person.how_we_met ?? null,
    sharedContext: person.shared_context ?? null,
    relationshipType: (person.relationship_type ?? null) as RelationshipType | null,
    claimStatus: (person.claim_status ?? 'none') as PersonDetail['claimStatus'],
    status: (person.status ?? 'ghost') as PersonDetail['status'],
    linkedUserId: person.linked_user_id ?? null,
    groups: personGroups,
    memories: (mems ?? []).map((m) => ({
      id: m.id,
      title: m.title,
      start_date: m.start_date,
      location_name: m.location_name ?? null,
      category: m.category ?? null,
      categories: (m.categories as string[] | null) ?? (m.category ? [m.category] : []),
      previewUrl: photoMap.get(m.id) ?? null,
      sharingStatus: ((m.sharing_status as string | null) ?? 'private') as 'private' | 'shared',
    })),
    stats: {
      totalCount: (mems ?? []).length,
      firstDate: (mems ?? [])[0]?.start_date ?? null,
      uniqueLocations,
      allPhotos: allPhotos.slice(0, 12),
    },
  }
}

/** Replace all people tagged on a memory */
export async function setMemoryPeople(
  memoryId: string,
  personIds: string[],
): Promise<void> {
  const { supabase, user } = await authedClient()

  // Delete existing
  await supabase
    .from('memory_people')
    .delete()
    .eq('memory_id', memoryId)
    .eq('added_by', user.id)

  if (personIds.length === 0) return

  const rows = personIds.map((pid) => ({
    memory_id: memoryId,
    person_id: pid,
    added_by: user.id,
  }))

  const { error } = await supabase.from('memory_people').insert(rows)
  if (error) throw new Error(`Impossibile salvare persone: ${error.message}`)
}

/** Get people tagged on a memory */
export async function getMemoryPeople(memoryId: string): Promise<SimplePerson[]> {
  const { supabase } = await authedClient()

  const { data } = await supabase
    .from('memory_people')
    .select('person_id, people(id, name, avatar_url)')
    .eq('memory_id', memoryId)

  return (data ?? [])
    .map((row) => {
      const p = Array.isArray(row.people) ? row.people[0] : row.people
      if (!p) return null
      return {
        id: (p as { id: string }).id,
        name: (p as { name: string }).name,
        avatarUrl: (p as { avatar_url: string | null }).avatar_url ?? null,
      }
    })
    .filter((p): p is SimplePerson => p !== null)
}

// ── searchPeople ───────────────────────────────────────────────────────────

/** Search people by name fragment (case-insensitive). Used for autocomplete. */
export async function searchPeople(query: string): Promise<SimplePerson[]> {
  const { supabase, user } = await authedClient()

  const { data } = await supabase
    .from('people')
    .select('id, name, avatar_url')
    .eq('owner_id', user.id)
    .ilike('name', `%${query.trim()}%`)
    .order('name', { ascending: true })
    .limit(10)

  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    avatarUrl: p.avatar_url ?? null,
  }))
}

// ── getPersonById ──────────────────────────────────────────────────────────

/** Alias for getPersonDetail — returns full person + their memories. */
export async function getPersonById(personId: string): Promise<PersonDetail | null> {
  return getPersonDetail(personId)
}

// ── getMomentsByPersonId ───────────────────────────────────────────────────

/** Returns just the memory list for a person, without the wrapper. */
export async function getMomentsByPersonId(personId: string): Promise<PersonMemory[]> {
  const detail = await getPersonDetail(personId)
  return detail?.memories ?? []
}

// ── getTopPeople ───────────────────────────────────────────────────────────

/** Top N people ordered by memory count — for Home / Esplora widgets. */
export async function getTopPeople(limit = 6): Promise<Person[]> {
  const all = await getAllPersons()  // already sorted by memoryCount desc
  return all.slice(0, limit)
}

// ── updatePerson ───────────────────────────────────────────────────────────

export interface UpdatePersonInput {
  name?: string
  firstName?: string | null
  lastName?: string | null
  nicknames?: string[]
  avatarUrl?: string | null
  relationshipType?: RelationshipType | null
  relationLabel?: string | null
  shortBio?: string | null
  howWeMet?: string | null
  sharedContext?: string | null
  claimStatus?: 'none' | 'claimable' | 'invited' | 'claimed'
  groupIds?: string[]
}

/** Update editable identity fields for a person the current user owns. */
export async function updatePerson(
  personId: string,
  input: UpdatePersonInput,
): Promise<void> {
  const { supabase, user } = await authedClient()

  const patch: Record<string, unknown> = {}
  if (input.name             !== undefined) patch.name              = input.name.trim()
  if (input.firstName        !== undefined) patch.first_name        = input.firstName?.trim()        || null
  if (input.lastName         !== undefined) patch.last_name         = input.lastName?.trim()         || null
  if (input.nicknames        !== undefined) patch.nicknames         = input.nicknames
  if (input.avatarUrl        !== undefined) patch.avatar_url        = input.avatarUrl
  if (input.relationshipType !== undefined) patch.relationship_type = input.relationshipType
  if (input.relationLabel    !== undefined) patch.relation_label    = input.relationLabel?.trim()    || null
  if (input.shortBio         !== undefined) patch.short_bio         = input.shortBio?.trim()         || null
  if (input.howWeMet         !== undefined) patch.how_we_met        = input.howWeMet?.trim()         || null
  if (input.sharedContext    !== undefined) patch.shared_context    = input.sharedContext?.trim()    || null
  if (input.claimStatus      !== undefined) patch.claim_status      = input.claimStatus
  if (input.groupIds         !== undefined) patch.group_ids         = input.groupIds

  const { error } = await supabase
    .from('people')
    .update(patch)
    .eq('id', personId)
    .eq('owner_id', user.id)

  if (error) throw new Error(`Impossibile aggiornare persona: ${error.message}`)
}

'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { generateInviteToken } from '@/lib/utils/invite'
import { redirect } from 'next/navigation'

// All types and constants live in lib/constants/groups — safe for client import.
// Server actions re-export them so server code has one import source.
export {
  GROUP_TYPES,
  type GroupType,
  type GroupSummary,
  type GroupMember,
  type GroupMemory,
  type GroupDetail,
  type PublicGroupPreview,
} from '@/lib/constants/groups'

// Local alias used in this file only
import type {
  GroupSummary,
  GroupMember,
  GroupMemory,
  GroupDetail,
  PublicGroupPreview,
} from '@/lib/constants/groups'

// ── Create group ──────────────────────────────────────────────────────────

export async function createGroup(name: string, type: string): Promise<string> {
  const supabase = await createServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/auth/login')

  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name: name.trim(), type, created_by: user.id })
    .select('id')
    .single()

  if (groupError || !group) throw new Error('Impossibile creare il gruppo. Riprova.')

  // Add creator as admin member (use admin client — group_members RLS requires existing membership)
  const admin = createAdminClient()
  await admin.from('group_members').insert({
    group_id: group.id,
    user_id: user.id,
    joined_at: new Date().toISOString(),
    role: 'admin',
  })

  return group.id
}

// ── Get all groups the current user belongs to ────────────────────────────

export async function getUserGroups(): Promise<GroupSummary[]> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)

  if (!memberships || memberships.length === 0) return []
  const groupIds = memberships.map((m) => m.group_id)

  const { data: groups } = await supabase
    .from('groups')
    .select('id, name, type, invite_token')
    .in('id', groupIds)
    .order('created_at', { ascending: false })

  if (!groups || groups.length === 0) return []

  const results: GroupSummary[] = []

  for (const g of groups) {
    const [
      { data: memberRows, count: memberCount },
      { count: memoryCount },
    ] = await Promise.all([
      supabase
        .from('group_members')
        .select('users ( display_name, email )', { count: 'exact' })
        .eq('group_id', g.id)
        .not('joined_at', 'is', null),
      supabase
        .from('memories')
        .select('id', { count: 'exact', head: true })
        .eq('group_id', g.id),
    ])

    const previewMembers = (memberRows ?? []).slice(0, 4).map((m) => {
      const u = m.users as unknown as { display_name: string | null; email: string } | null
      return { displayName: u?.display_name ?? u?.email ?? '?' }
    })

    results.push({
      id: g.id,
      name: g.name,
      type: g.type,
      memberCount: memberCount ?? 0,
      memoryCount: memoryCount ?? 0,
      previewMembers,
      inviteToken: g.invite_token,
    })
  }

  return results
}

// ── Get full group detail (requires membership) ───────────────────────────

export async function getGroupDetail(groupId: string): Promise<GroupDetail | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: group } = await supabase
    .from('groups')
    .select('id, name, type, created_by, invite_token')
    .eq('id', groupId)
    .single()

  if (!group) return null

  const [{ data: memberRows }, { data: memRows }] = await Promise.all([
    supabase
      .from('group_members')
      .select('id, user_id, joined_at, role, users ( display_name, email )')
      .eq('group_id', groupId)
      .not('joined_at', 'is', null)
      .order('joined_at', { ascending: true }),
    supabase
      .from('memories')
      .select('id, title, start_date, end_date, location_name, category, categories')
      .eq('group_id', groupId)
      .is('end_date', null)
      .order('start_date', { ascending: false }),
  ])

  const members: GroupMember[] = (memberRows ?? []).map((m) => {
    const u = m.users as unknown as { display_name: string | null; email: string } | null
    return {
      id: m.id,
      userId: m.user_id,
      displayName: u?.display_name ?? u?.email ?? '?',
      role: m.role,
      joinedAt: m.joined_at,
    }
  })

  // Resolve first photo per memory
  const memIds = (memRows ?? []).map((m) => m.id)
  const photoMap = new Map<string, string>()
  if (memIds.length > 0) {
    const { data: photos } = await supabase
      .from('memory_contributions')
      .select('memory_id, media_url')
      .in('memory_id', memIds)
      .eq('content_type', 'photo')
      .not('media_url', 'is', null)
      .order('created_at', { ascending: true })

    for (const p of photos ?? []) {
      if (p.media_url && !photoMap.has(p.memory_id)) {
        photoMap.set(p.memory_id, p.media_url)
      }
    }
  }

  const memories: GroupMemory[] = (memRows ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    startDate: m.start_date,
    locationName: m.location_name,
    categories: (m.categories as string[] | null)?.length
      ? (m.categories as string[])
      : m.category ? [m.category] : [],
    previewUrl: photoMap.get(m.id) ?? null,
  }))

  return {
    id: group.id,
    name: group.name,
    type: group.type,
    createdBy: group.created_by,
    inviteToken: group.invite_token,
    members,
    memories,
  }
}

// ── Public group preview (no auth needed) ────────────────────────────────

export async function getGroupByInviteToken(token: string): Promise<PublicGroupPreview | null> {
  const admin = createAdminClient()

  const { data: group } = await admin
    .from('groups')
    .select('id, name, type, created_by')
    .eq('invite_token', token)
    .single()

  if (!group) return null

  const [{ data: memberRows, count }, { data: creator }] = await Promise.all([
    admin
      .from('group_members')
      .select('users ( display_name, email )', { count: 'exact' })
      .eq('group_id', group.id)
      .not('joined_at', 'is', null),
    admin
      .from('users')
      .select('display_name, email')
      .eq('id', group.created_by)
      .single(),
  ])

  const previewMembers = (memberRows ?? []).slice(0, 4).map((m) => {
    const u = m.users as unknown as { display_name: string | null; email: string } | null
    return { displayName: u?.display_name ?? u?.email ?? '?' }
  })

  return {
    id: group.id,
    name: group.name,
    type: group.type,
    memberCount: count ?? 0,
    previewMembers,
    inviterName: creator?.display_name ?? creator?.email ?? 'Qualcuno',
  }
}

// ── Join group via invite token ───────────────────────────────────────────

export async function joinGroup(token: string): Promise<{ groupId: string; error?: string }> {
  const supabase = await createServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect(`/auth/login?next=/g/${token}`)

  const admin = createAdminClient()

  const { data: group } = await admin
    .from('groups')
    .select('id')
    .eq('invite_token', token)
    .single()

  if (!group) return { groupId: '', error: 'Gruppo non trovato o link non valido.' }

  // Idempotent: check existing membership
  const { data: existing } = await admin
    .from('group_members')
    .select('id, joined_at')
    .eq('group_id', group.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing?.joined_at) {
    return { groupId: group.id } // already a member
  }

  if (existing) {
    await admin
      .from('group_members')
      .update({ joined_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await admin.from('group_members').insert({
      group_id: group.id,
      user_id: user.id,
      joined_at: new Date().toISOString(),
      role: 'member',
    })
  }

  // Auto-add user to all existing group memories (as participant)
  const { data: groupMemories } = await admin
    .from('memories')
    .select('id')
    .eq('group_id', group.id)

  if (groupMemories && groupMemories.length > 0) {
    const { data: existingParts } = await admin
      .from('memory_participants')
      .select('memory_id')
      .eq('user_id', user.id)
      .in('memory_id', groupMemories.map((m) => m.id))

    const alreadyIn = new Set((existingParts ?? []).map((p) => p.memory_id))
    const toAdd = groupMemories.filter((m) => !alreadyIn.has(m.id))

    if (toAdd.length > 0) {
      await admin.from('memory_participants').insert(
        toAdd.map((m) => ({
          memory_id: m.id,
          user_id: user.id,
          joined_at: new Date().toISOString(),
          invite_token: generateInviteToken(),
        }))
      )
    }
  }

  return { groupId: group.id }
}

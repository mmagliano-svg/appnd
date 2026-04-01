'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import {
  FIXED_CALENDAR_ANCHORS,
  daysUntilFixedAnchor,
  daysUntilBirthday,
  dayMonthFromDate,
  dayMonthFromBirthDate,
  isMemoryMatchingFixedAnchor,
} from '@/lib/utils/anchors'

// ── Types ─────────────────────────────────────────────────────────────────

export type HomeNudgeType = 'birthday' | 'anchor' | 'inactive' | 'recent'

export interface HomeNudge {
  type: HomeNudgeType
  title: string
  subtitle?: string
  cta?: string
  href?: string
}

export type UpcomingMomentKind = 'birthday' | 'fixed_anchor'

export interface UpcomingMomentResult {
  kind: UpcomingMomentKind
  /** Unique stable id for deduplication / routing */
  id: string
  /** Italian display label (person name for birthdays, anchor label for fixed) */
  label: string
  daysUntil: number
  memoryCount: number
  /** Only set when kind === 'birthday' */
  personId?: string
  personName?: string
}

// ── Private helper ─────────────────────────────────────────────────────────

async function authedClient() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  return { supabase, user: user! }
}

// ── Action ─────────────────────────────────────────────────────────────────

/**
 * Returns up to 3 upcoming emotional moments within `windowDays` from today.
 * Combines birthday anchors (from stored people) and fixed calendar anchors.
 * Sorted ascending by daysUntil.
 * memoryCount for each item is derived from the user's real memories (no AI).
 */
export async function getUpcomingMoments(windowDays = 30): Promise<UpcomingMomentResult[]> {
  const { supabase, user } = await authedClient()
  const today = new Date()

  // Single query: all memory start_dates for this user (for counting)
  const { data: memRows } = await supabase
    .from('memories')
    .select('start_date')
    .eq('created_by', user.id)

  const memDates = (memRows ?? []).map((m) => m.start_date as string)

  const results: UpcomingMomentResult[] = []

  // ── Fixed calendar anchors ──────────────────────────────────────────────
  for (const anchor of FIXED_CALENDAR_ANCHORS) {
    const days = daysUntilFixedAnchor(anchor, today)
    if (days > windowDays) continue

    const count = memDates.filter((d) => isMemoryMatchingFixedAnchor(d, anchor)).length

    results.push({
      kind:        'fixed_anchor',
      id:          anchor.id,
      label:       anchor.label,
      daysUntil:   days,
      memoryCount: count,
    })
  }

  // ── Birthday anchors ────────────────────────────────────────────────────
  const { data: people } = await supabase
    .from('people')
    .select('id, name, birth_date')
    .eq('owner_id', user.id)
    .not('birth_date', 'is', null)

  for (const p of people ?? []) {
    if (!p.birth_date) continue
    const days = daysUntilBirthday(p.birth_date as string, today)
    if (days > windowDays) continue

    const birthMmDd = dayMonthFromBirthDate(p.birth_date as string)
    const count = birthMmDd
      ? memDates.filter((d) => dayMonthFromDate(d) === birthMmDd).length
      : 0

    results.push({
      kind:        'birthday',
      id:          `birthday_${p.id}`,
      label:       p.name as string,
      daysUntil:   days,
      memoryCount: count,
      personId:    p.id as string,
      personName:  p.name as string,
    })
  }

  // Sort ascending by daysUntil, return max 3
  return results.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 3)
}

// ── Nudge ──────────────────────────────────────────────────────────────────

/**
 * Returns a single soft nudge for the Home screen, or null.
 * Priority: upcoming birthday (≤5d) → upcoming anchor (≤7d) → recent memory (≤48h) → inactive (>7d)
 */
export async function getHomeNudge(): Promise<HomeNudge | null> {
  const { supabase, user } = await authedClient()
  const today = new Date()

  // ── 1. Upcoming birthday within 5 days ──────────────────────────────────
  const { data: people } = await supabase
    .from('people')
    .select('id, name, birth_date')
    .eq('owner_id', user.id)
    .not('birth_date', 'is', null)

  for (const p of people ?? []) {
    if (!p.birth_date) continue
    const days = daysUntilBirthday(p.birth_date as string, today)
    if (days <= 5) {
      return {
        type: 'birthday',
        title: `Sta tornando il compleanno di ${p.name as string}`,
        subtitle: 'Cosa avete fatto gli altri anni?',
        cta: 'Aggiungi qualcosa per quel giorno',
        href: '/memories/new',
      }
    }
  }

  // ── 2. Upcoming fixed anchor within 7 days — pick the closest one ────────
  const closestAnchor = FIXED_CALENDAR_ANCHORS
    .map((anchor) => ({ anchor, days: daysUntilFixedAnchor(anchor, today) }))
    .filter(({ days }) => days <= 7)
    .sort((a, b) => a.days - b.days)[0] ?? null

  if (closestAnchor) {
    return {
      type: 'anchor',
      title: `Sta tornando ${closestAnchor.anchor.label}`,
      subtitle: 'Hai già dei ricordi di questo momento?',
      cta: 'Vuoi ricordarlo anche quest\'anno?',
      href: '/memories/new',
    }
  }

  // ── 3 & 4. Most recent memory (for recent / inactive checks) ────────────
  const { data: latest } = await supabase
    .from('memories')
    .select('created_at')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latest?.created_at) {
    const msAgo    = today.getTime() - new Date(latest.created_at as string).getTime()
    const hoursAgo = msAgo / (1_000 * 60 * 60)
    const daysAgo  = hoursAgo / 24

    // 3. Recent: created within last 48h
    if (hoursAgo <= 48) {
      return {
        type: 'recent',
        title: 'Hai appena fermato un momento',
        subtitle: 'Vuoi aggiungerne un altro?',
        cta: 'Continua da qui',
        href: '/memories/new',
      }
    }

    // 4. Inactive: nothing created in last 7 days
    if (daysAgo > 7) {
      return {
        type: 'inactive',
        title: `È da un po' che non aggiungi un momento`,
        subtitle: `C'è qualcosa che vale la pena ricordare?`,
        cta: 'Riparti da un momento',
        href: '/memories/new',
      }
    }
  }

  return null
}

// ── Memory Signals ─────────────────────────────────────────────────────────

export interface MemorySignal {
  text: string
  subtext?: string
  href: string
}

export interface MemorySignalsResult {
  primary?: MemorySignal | null
  newContribution: MemorySignal | null
  incompleteMemory: MemorySignal | null
  memoryRecall: MemorySignal | null
}

/**
 * Returns up to three in-app signals for the Home screen.
 * Priority (for display): newContribution → incompleteMemory → memoryRecall.
 * All signals are recomputed on each call — no persistence.
 */
export async function getMemorySignals(): Promise<MemorySignalsResult> {
  const { supabase, user } = await authedClient()
  const today = new Date()

  let newContribution: MemorySignal | null = null
  let incompleteMemory: MemorySignal | null = null
  let memoryRecall: MemorySignal | null = null

  // ── Shared memory ids where current user is a participant ─────────────────
  const { data: participantRows } = await supabase
    .from('shared_memory_participants')
    .select('shared_memory_id')
    .eq('linked_user_id', user.id)

  const smIds = (participantRows ?? []).map((r) => r.shared_memory_id)

  if (smIds.length > 0) {
    // ── Signal 1: new contribution from others in last 48h ──────────────────
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const { data: contribRows } = await supabase
      .from('shared_memory_contributions')
      .select('id, shared_memory_id, author_user_id')
      .in('shared_memory_id', smIds)
      .neq('author_user_id', user.id)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(1)

    const latest = contribRows?.[0] ?? null
    if (latest) {
      const { data: authorRow } = await supabase
        .from('users')
        .select('display_name, email')
        .eq('id', latest.author_user_id)
        .maybeSingle()
      const name =
        authorRow?.display_name ??
        authorRow?.email?.split('@')[0] ??
        'Qualcuno'
      newContribution = {
        text: `${name} ha aggiunto qualcosa`,
        href: `/shared/${latest.shared_memory_id}`,
      }
    }

    // ── Signal 2: incomplete shared memory (participants ≥ 2, contributions ≤ 1) ─
    const [{ data: partRows }, { data: allContribRows }] = await Promise.all([
      supabase
        .from('shared_memory_participants')
        .select('shared_memory_id')
        .in('shared_memory_id', smIds),
      supabase
        .from('shared_memory_contributions')
        .select('shared_memory_id')
        .in('shared_memory_id', smIds),
    ])

    const partCounts = new Map<string, number>()
    for (const r of partRows ?? []) {
      partCounts.set(r.shared_memory_id, (partCounts.get(r.shared_memory_id) ?? 0) + 1)
    }
    const contribCounts = new Map<string, number>()
    for (const r of allContribRows ?? []) {
      contribCounts.set(r.shared_memory_id, (contribCounts.get(r.shared_memory_id) ?? 0) + 1)
    }

    const incompleteId = smIds.find(
      (id) => (partCounts.get(id) ?? 0) >= 2 && (contribCounts.get(id) ?? 0) <= 1,
    ) ?? null

    if (incompleteId) {
      incompleteMemory = {
        text: 'Manca ancora qualcuno',
        href: `/shared/${incompleteId}`,
      }
    }
  }

  // ── Signal 3: memory recall ───────────────────────────────────────────────
  // Fixed anchor within next 5 days
  const closestAnchor = FIXED_CALENDAR_ANCHORS
    .map((anchor) => ({ anchor, days: daysUntilFixedAnchor(anchor, today) }))
    .filter(({ days }) => days <= 5)
    .sort((a, b) => a.days - b.days)[0] ?? null

  if (closestAnchor) {
    memoryRecall = {
      text: 'Questo momento torna',
      href: `/timeline?anchor=${closestAnchor.anchor.id}`,
    }
  } else {
    // Past memory with same day/month as today
    const mm = today.getMonth() + 1
    const dd = today.getDate()
    const { data: memRows } = await supabase
      .from('memories')
      .select('id, start_date')
      .eq('created_by', user.id)
      .is('end_date', null)

    const sameDay = (memRows ?? []).find((m) => {
      const parts = m.start_date.split('-')
      return parseInt(parts[1]) === mm && parseInt(parts[2]) === dd
    }) ?? null

    if (sameDay) {
      memoryRecall = {
        text: 'Questo momento torna',
        href: `/memories/${sameDay.id}`,
      }
    }
  }

  // Recent shared activity is the highest-priority signal (feeds black primary card)
  return {
    primary: newContribution,
    newContribution: null,
    incompleteMemory,
    memoryRecall,
  }
}

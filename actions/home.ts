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

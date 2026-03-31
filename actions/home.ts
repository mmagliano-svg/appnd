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

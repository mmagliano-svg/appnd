/**
 * Follow-up Engine V1
 *
 * After a memory, period, or cluster is created, suggests the next
 * most useful step to enrich the user's life graph. Uses existing
 * data only — no AI, no new backend.
 *
 * Follow-ups are structured objects (not just strings) with id, kind,
 * text, and priority so the UI can decide how many to show and which
 * one to emphasise.
 *
 * Three classes:
 *   1. STRUCTURAL  — fill a missing data dimension (place, people, date)
 *   2. NARRATIVE   — expand the story (add another moment, link to period)
 *   3. SOCIAL      — bring someone else in (invite, share)
 *
 * Priority: 1 (highest) to 5 (lowest). The caller sorts by priority
 * and picks the top N.
 */

import type { PromptEntity } from './prompt-types'

// ── Types ──────────────────────────────────────────────────────────────────

export type FollowUpKind = 'structural' | 'narrative' | 'social'

export interface FollowUpSuggestion {
  /** Stable id for deduplication and analytics */
  id: string
  kind: FollowUpKind
  /** User-facing Italian text */
  text: string
  /** 1 (highest) to 5 (lowest). Caller sorts by this. */
  priority: number
}

// ── Input shapes ───────────────────────────────────────────────────────────

interface MemoryShape {
  title: string
  location_name: string | null
  description: string | null
  /** Whether any people/participants are attached */
  hasPeople?: boolean
  /** Whether this memory is shared with others */
  isShared?: boolean
  /** Parent period id (if linked to a chapter) */
  parentPeriodId?: string | null
}

interface PeriodShape {
  title: string
  location_name: string | null
  description: string | null
  /** Number of child moments currently inside this period */
  childEventCount?: number
  hasPeople?: boolean
}

// ── Memory follow-ups ──────────────────────────────────────────────────────

export function getFollowUpsForMemory(
  memory: MemoryShape,
  sourcePrompt?: PromptEntity | null,
): FollowUpSuggestion[] {
  const suggestions: FollowUpSuggestion[] = []

  // ── Structural — fill missing dimensions ──────────────────────────
  if (!memory.location_name) {
    suggestions.push({
      id: 'mem-add-place',
      kind: 'structural',
      text: 'Dove eri?',
      priority: 1,
    })
  }

  if (!memory.hasPeople && (sourcePrompt?.targets.people || !sourcePrompt)) {
    suggestions.push({
      id: 'mem-add-people',
      kind: 'structural',
      text: 'Chi era con te?',
      priority: 1,
    })
  }

  if (!memory.description?.trim()) {
    suggestions.push({
      id: 'mem-add-description',
      kind: 'structural',
      text: "C'è qualcos'altro che ricordi di quel giorno?",
      priority: 2,
    })
  }

  // ── Narrative — expand the story ──────────────────────────────────
  if (!memory.parentPeriodId) {
    suggestions.push({
      id: 'mem-link-period',
      kind: 'narrative',
      text: 'Faceva parte di un periodo della tua vita?',
      priority: 3,
    })
  }

  suggestions.push({
    id: 'mem-another-similar',
    kind: 'narrative',
    text: "Ce n'è stato un altro simile?",
    priority: 3,
  })

  suggestions.push({
    id: 'mem-what-after',
    kind: 'narrative',
    text: 'È successo qualcosa dopo?',
    priority: 4,
  })

  // ── Social — invite / share ───────────────────────────────────────
  if (!memory.isShared && memory.hasPeople) {
    suggestions.push({
      id: 'mem-invite',
      kind: 'social',
      text: 'Vuoi coinvolgere chi era con te?',
      priority: 2,
    })
  }

  if (memory.isShared) {
    suggestions.push({
      id: 'mem-ask-detail',
      kind: 'social',
      text: 'Qualcuno potrebbe aggiungere un dettaglio?',
      priority: 3,
    })
  }

  return suggestions.sort((a, b) => a.priority - b.priority)
}

// ── Period follow-ups ──────────────────────────────────────────────────────

export function getFollowUpsForPeriod(
  period: PeriodShape,
  sourcePrompt?: PromptEntity | null,
): FollowUpSuggestion[] {
  const suggestions: FollowUpSuggestion[] = []

  // ── Structural ────────────────────────────────────────────────────
  if (!period.location_name) {
    suggestions.push({
      id: 'per-add-place',
      kind: 'structural',
      text: 'Dove vivevi in quel periodo?',
      priority: 1,
    })
  }

  if (!period.description?.trim()) {
    suggestions.push({
      id: 'per-add-description',
      kind: 'structural',
      text: "Com'era la tua vita in quei giorni?",
      priority: 2,
    })
  }

  if (!period.hasPeople && sourcePrompt?.targets.people) {
    suggestions.push({
      id: 'per-add-people',
      kind: 'structural',
      text: "Chi c'era con te in quel periodo?",
      priority: 1,
    })
  }

  // ── Narrative ─────────────────────────────────────────────────────
  const hasChildEvents = (period.childEventCount ?? 0) > 0
  suggestions.push({
    id: 'per-add-moment',
    kind: 'narrative',
    text: hasChildEvents
      ? 'Ti ricordi un altro momento di questo periodo?'
      : 'Ricordi un momento preciso di quel periodo?',
    priority: hasChildEvents ? 3 : 1, // first moment is highest priority
  })

  suggestions.push({
    id: 'per-what-changed',
    kind: 'narrative',
    text: 'Cosa è cambiato dopo quel periodo?',
    priority: 4,
  })

  // ── Social ────────────────────────────────────────────────────────
  if (period.hasPeople) {
    suggestions.push({
      id: 'per-invite',
      kind: 'social',
      text: 'Qualcuno potrebbe raccontare quel periodo in modo diverso?',
      priority: 3,
    })
  }

  return suggestions.sort((a, b) => a.priority - b.priority)
}

// ── Cluster follow-ups ─────────────────────────────────────────────────────

export function getFollowUpsForCluster(
  anchorLabel: string | null,
  existingMomentCount: number,
  _sourcePrompt?: PromptEntity | null,
): FollowUpSuggestion[] {
  const suggestions: FollowUpSuggestion[] = []
  const label = anchorLabel ?? 'questo'

  // ── Narrative (always the primary action for clusters) ────────────
  if (existingMomentCount === 0) {
    suggestions.push({
      id: 'clu-first-moment',
      kind: 'narrative',
      text: `Qual è il primo momento a ${label} che ti viene in mente?`,
      priority: 1,
    })
  } else {
    suggestions.push({
      id: 'clu-another-moment',
      kind: 'narrative',
      text: `Ti ricordi un altro momento a ${label}?`,
      priority: 1,
    })
  }

  suggestions.push({
    id: 'clu-first-time',
    kind: 'narrative',
    text: `Quando è stata la prima volta a ${label}?`,
    priority: 2,
  })

  suggestions.push({
    id: 'clu-last-time',
    kind: 'narrative',
    text: `E l'ultima volta? Quando?`,
    priority: 3,
  })

  // ── Social ────────────────────────────────────────────────────────
  suggestions.push({
    id: 'clu-who-was-there',
    kind: 'social',
    text: "Chi era con te quelle volte?",
    priority: 3,
  })

  return suggestions.sort((a, b) => a.priority - b.priority)
}

// ── Convenience: top N follow-ups ──────────────────────────────────────────

/**
 * Returns the top N follow-up suggestions for any entity type.
 * Already sorted by priority. Default N = 3.
 */
export function topFollowUps(suggestions: FollowUpSuggestion[], n = 3): FollowUpSuggestion[] {
  return suggestions.slice(0, n)
}

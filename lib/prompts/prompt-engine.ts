/**
 * Prompt System V1 — Engine
 *
 * Selects the single best prompt to show based on user context.
 * Pure function, no AI, no network calls, no randomness dependency
 * beyond Math.random for tie-breaking.
 *
 * Selection pipeline:
 *   1. Exclude recently shown prompts (rolling window)
 *   2. Exclude 'rare' frequency prompts 70% of the time
 *   3. Prefer moment prompts for new users (few memories)
 *   4. Boost prompts in categories the user hasn't explored yet
 *   5. Score remaining candidates by emotionalWeight + variety bonus
 *   6. Pick the top scorer (random tie-break)
 */

import { PROMPT_LIBRARY } from './prompt-library'
import type { PromptEntity, PromptEngineInput } from './prompt-types'

/**
 * Returns the single best prompt for the current context.
 * Deterministic given the same input (except for random tie-breaking).
 */
export function getNextPrompt(input: PromptEngineInput): PromptEntity {
  const { memoryCount, periodCount, recentPromptIds, existingCategories = [] } = input

  // ── 1. Exclude recently shown ──────────────────────────────────────────
  let pool = PROMPT_LIBRARY.filter((p) => !recentPromptIds.includes(p.id))
  if (pool.length === 0) pool = PROMPT_LIBRARY // safety: if all shown, reset

  // ── 2. Filter rare prompts most of the time ────────────────────────────
  const allowRare = Math.random() < 0.3
  if (!allowRare) {
    const filtered = pool.filter((p) => p.frequency !== 'rare')
    if (filtered.length > 0) pool = filtered
  }

  // ── 3. Kind preference based on user maturity ──────────────────────────
  // New users (< 3 memories): strongly prefer moments (easiest to create)
  // Growing users (3–10): balanced, slight moment preference
  // Mature users (10+): any kind, slight period/cluster preference
  const kindWeights: Record<string, number> = { moment: 1, period: 1, cluster: 1 }
  if (memoryCount < 3) {
    kindWeights.moment = 3
    kindWeights.period = 0.5
    kindWeights.cluster = 0.3
  } else if (memoryCount < 10) {
    kindWeights.moment = 2
    kindWeights.period = 1
    kindWeights.cluster = 0.8
  } else {
    kindWeights.moment = 1
    kindWeights.period = 1.5
    kindWeights.cluster = 1.2
  }

  // ── 4–5. Score each candidate ──────────────────────────────────────────
  const ps = input.profileSignals
  const scored = pool.map((p) => {
    let score = (p.emotionalWeight ?? 3) // base: 1–5

    // Kind preference
    score *= kindWeights[p.kind] ?? 1

    // Category variety bonus: prompts in categories the user hasn't
    // explored yet get a boost so the feed feels broad, not narrow.
    if (!existingCategories.includes(p.category)) {
      score += 2
    }

    // ── Profile signal boosts (V1.5) ──────────────────────────────
    if (ps) {
      // If user has children, boost family prompts
      if (ps.hasChildren && p.category === 'family') {
        score += 2
      }
      // If user has a long relationship, boost relationship prompts
      if (ps.hasLongRelationship && p.category === 'relationships') {
        score += 1.5
      }
      // If prompt text mentions a place the user revisits, boost it
      if (ps.repeatedPlaces?.length) {
        const promptLower = p.text.toLowerCase()
        if (ps.repeatedPlaces.some((place) => promptLower.includes(place.toLowerCase()))) {
          score += 1
        }
      }
      // If user has key themes, boost matching category prompts
      if (ps.keyThemes?.length && ps.keyThemes.includes(p.category)) {
        score += 1
      }
    }

    // Small random jitter for tie-breaking (0–0.99)
    score += Math.random()

    return { prompt: p, score }
  })

  // ── 6. Pick the top scorer ─────────────────────────────────────────────
  scored.sort((a, b) => b.score - a.score)
  return scored[0].prompt
}

/**
 * Build the destination URL for a prompt based on its kind.
 * Mirrors the old getPromptHref but works with PromptEntity.
 */
export function getPromptHref(prompt: PromptEntity): string {
  const encoded = encodeURIComponent(prompt.text)
  const idParam = `&promptId=${prompt.id}`
  switch (prompt.kind) {
    case 'moment':
      return `/memories/new?prompt=${encoded}&source=prompt${idParam}`
    case 'period':
      return `/periods/new?prompt=${encoded}${idParam}`
    case 'cluster':
      return `/clusters/new?prompt=${encoded}${idParam}`
  }
}

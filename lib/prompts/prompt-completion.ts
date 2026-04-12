/**
 * Prompt System V1 — Completion Helpers
 *
 * Lightweight checks that determine whether a prompt has been
 * "answered" by an existing memory, period, or cluster anchor.
 * Used to avoid re-showing prompts the user has already acted on.
 *
 * V1 is purely heuristic — checks title similarity and basic
 * structural presence. No AI.
 */

import type { PromptEntity } from './prompt-types'

/**
 * Minimal memory shape needed for completion checks.
 * Matches what getUserMemories() already returns.
 */
interface MemoryLike {
  title: string
  start_date: string
  end_date: string | null
  location_name: string | null
  description: string | null
}

/**
 * True if the user has a memory whose title substantially overlaps
 * with the prompt text (> 40% of prompt words appear in the title,
 * case-insensitive). This is a rough "did they already answer this?"
 * heuristic, not a semantic match.
 */
function titleOverlap(promptText: string, memoryTitle: string): boolean {
  const promptWords = promptText.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
  if (promptWords.length === 0) return false
  const titleLower = memoryTitle.toLowerCase()
  const matchCount = promptWords.filter((w) => titleLower.includes(w)).length
  return matchCount / promptWords.length > 0.4
}

/**
 * Check whether a moment prompt has been completed — i.e. the user
 * already has a memory that looks like a response to this prompt.
 */
export function isMemoryPromptCompleted(
  prompt: PromptEntity,
  memories: MemoryLike[],
): boolean {
  return memories.some((m) => !m.end_date && titleOverlap(prompt.text, m.title))
}

/**
 * Check whether a period prompt has been completed — the user has a
 * period (memory with end_date) whose title overlaps with the prompt.
 */
export function isPeriodPromptCompleted(
  prompt: PromptEntity,
  memories: MemoryLike[],
): boolean {
  return memories.some((m) => m.end_date && titleOverlap(prompt.text, m.title))
}

/**
 * Check whether a cluster prompt has been completed — the user has
 * 2+ memories sharing the same location or a title that overlaps
 * with the prompt. V1 uses location as the primary cluster signal.
 */
export function isClusterPromptCompleted(
  prompt: PromptEntity,
  memories: MemoryLike[],
): boolean {
  // If 2+ memories share a location, the cluster likely exists
  const locationCounts = new Map<string, number>()
  for (const m of memories) {
    if (!m.location_name) continue
    locationCounts.set(
      m.location_name,
      (locationCounts.get(m.location_name) ?? 0) + 1,
    )
  }
  let hasCluster = false
  locationCounts.forEach((count) => {
    if (count >= 2) hasCluster = true
  })
  if (hasCluster) return true

  // Fallback: title overlap with 2+ memories
  const matchCount = memories.filter((m) => titleOverlap(prompt.text, m.title)).length
  return matchCount >= 2
}

/**
 * Prompt System V1 — Follow-up Helpers
 *
 * Returns lightweight arrays of follow-up questions that can be
 * shown after a memory/period/cluster is created (or during
 * creation as guided hints). These are NOT rendered everywhere
 * yet — this file just provides the engine helpers.
 *
 * Each function takes a minimal entity shape and returns 2–4
 * contextual follow-up strings in Italian.
 */

import type { PromptEntity } from './prompt-types'

interface MinimalMemory {
  title: string
  location_name: string | null
  description: string | null
}

/**
 * Follow-ups for a just-created moment.
 * Guides the user toward filling the structured dimensions
 * the prompt targeted: time, place, people, theme.
 */
export function getMemoryFollowups(
  memory: MinimalMemory,
  sourcePrompt?: PromptEntity | null,
): string[] {
  const followups: string[] = []

  // If the prompt targeted people and the memory doesn't mention anyone
  if (sourcePrompt?.targets.people) {
    followups.push('Chi era con te?')
  }

  // Location gap
  if (!memory.location_name) {
    followups.push('Dove eri?')
  }

  // Description gap
  if (!memory.description?.trim()) {
    followups.push("C'è qualcos'altro che ricordi di quel giorno?")
  }

  // General continuation
  followups.push('Ti ricordi un altro momento simile?')

  return followups.slice(0, 4)
}

/**
 * Follow-ups for a just-created period.
 * Encourages the user to attach child moments and fill gaps.
 */
export function getPeriodFollowups(
  period: MinimalMemory,
  sourcePrompt?: PromptEntity | null,
): string[] {
  const followups: string[] = []

  if (!period.location_name) {
    followups.push('Dove vivevi in quel periodo?')
  }

  if (!period.description?.trim()) {
    followups.push("Com'era la tua vita in quei giorni?")
  }

  // Encourage adding child moments
  followups.push('Ricordi un momento preciso di quel periodo?')

  if (sourcePrompt?.targets.people) {
    followups.push("Chi c'era con te in quel periodo?")
  }

  followups.push('Faceva parte di un periodo della tua vita?')

  return followups.slice(0, 4)
}

/**
 * Follow-ups for a just-started cluster.
 * Encourages the user to add more moments to the group.
 */
export function getClusterFollowups(
  anchorLabel: string | null,
  _sourcePrompt?: PromptEntity | null,
): string[] {
  const followups: string[] = []

  if (anchorLabel) {
    followups.push(`Quante volte sei stato a ${anchorLabel}?`)
    followups.push(`La prima volta a ${anchorLabel} — quando?`)
  }

  followups.push('Ti ricordi un altro momento come questo?')
  followups.push('Quando è successo per la prima volta?')

  return followups.slice(0, 4)
}

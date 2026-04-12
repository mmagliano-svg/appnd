/**
 * Prompt Contextualization V2
 *
 * Given a selected PromptEntity and the user's ProfileSignals, returns
 * a more specific prompt text when confidence is high. Falls back to
 * the original text when no strong signal exists.
 *
 * Rules:
 *   - Never generates new prompts from scratch
 *   - Never uses AI
 *   - Only adapts when a clear, safe substitution exists
 *   - Keeps the language natural and short
 *   - Returns the ORIGINAL text if nothing contextualizes cleanly
 */

import type { PromptEntity } from './prompt-types'

interface ContextSignals {
  childNames?: string[]
  repeatedPlaces?: string[]
  keyThemes?: string[]
  hasChildren?: boolean
  hasLongRelationship?: boolean
}

/**
 * Attempt to make a prompt more personal using profile signals.
 * Returns { text, wasContextualized } so the caller knows whether
 * the prompt was adapted or kept as-is.
 */
export function contextualizePrompt(
  prompt: PromptEntity,
  signals: ContextSignals | undefined,
): { text: string; wasContextualized: boolean } {
  if (!signals) return { text: prompt.text, wasContextualized: false }

  const childName = signals.childNames?.[0]
  const topPlace = signals.repeatedPlaces?.[0]
  const original = prompt.text

  // ── Family + child name ──────────────────────────────────────────────
  // "Dove eri il primo Natale che ricordi davvero?"
  //  → "Dove eri il primo Natale con {childName}?"
  if (prompt.category === 'family' && childName && signals.hasChildren) {
    // Only contextualize if the prompt doesn't already mention a specific name
    if (!original.includes(childName)) {
      // Pattern: prompts ending with "?" that mention a generic event
      if (original.includes('primo') || original.includes('prima')) {
        const adapted = original.replace(
          /\?\s*$/,
          ` con ${childName}?`,
        )
        if (adapted !== original) return { text: adapted, wasContextualized: true }
      }

      // Pattern: "il giorno in cui è nato qualcuno" → "il giorno in cui è nato {childName}"
      if (original.includes('qualcuno di importante')) {
        return {
          text: original.replace('qualcuno di importante per te', childName),
          wasContextualized: true,
        }
      }

      // Pattern: "un compleanno di famiglia" → "un compleanno di {childName}"
      if (original.includes('compleanno di famiglia')) {
        return {
          text: original.replace('compleanno di famiglia', `compleanno di ${childName}`),
          wasContextualized: true,
        }
      }
    }
  }

  // ── Cluster/travel + repeated place ──────────────────────────────────
  // "C'è una città in cui sei tornato più volte nella vita?"
  //  → "Cosa ti riporta spesso a {topPlace}?"
  if (topPlace && (prompt.category === 'travel' || prompt.category === 'home')) {
    if (prompt.kind === 'cluster') {
      // Replace the generic cluster question with a specific one
      if (original.includes('città in cui sei tornato')) {
        return {
          text: `Cosa ti riporta spesso a ${topPlace}?`,
          wasContextualized: true,
        }
      }
      if (original.includes('posto in cui tornavi')) {
        return {
          text: `Cosa ti legava a ${topPlace}?`,
          wasContextualized: true,
        }
      }
    }

    // Moment travel prompts: if we have a place, append it
    if (prompt.kind === 'moment' && !original.toLowerCase().includes(topPlace.toLowerCase())) {
      // "Dove sei andato nel tuo primo viaggio da solo?"
      // Only if the prompt is about going somewhere (avoid forcing on "childhood room" etc.)
      if (original.includes('viaggio') || original.includes('aereo') || original.includes('treno')) {
        // Don't append — just keep original. Forcing a place into a "first trip" prompt
        // feels wrong if they went somewhere else. Only cluster prompts get place injection.
      }
    }
  }

  // ── Relationship + long relationship signal ──────────────────────────
  // "Dove vi siete conosciuti quando è iniziata la tua relazione più lunga?"
  //  → "Dove vi siete conosciuti quando è iniziata la vostra storia?"
  if (signals.hasLongRelationship && prompt.category === 'relationships') {
    if (original.includes('relazione più lunga')) {
      return {
        text: original.replace('la tua relazione più lunga', 'la vostra storia'),
        wasContextualized: true,
      }
    }
    // "la prima casa che hai condiviso con qualcuno"
    // → "la prima casa che avete condiviso"
    if (original.includes('condiviso con qualcuno')) {
      return {
        text: original.replace('hai condiviso con qualcuno', 'avete condiviso'),
        wasContextualized: true,
      }
    }
  }

  // ── Home + repeated place ────────────────────────────────────────────
  // "Ti ricordi tutte le case in cui hai vissuto?"
  //  → "Ti ricordi tutte le case prima di {topPlace}?"
  if (topPlace && prompt.category === 'home' && prompt.kind === 'cluster') {
    if (original.includes('tutte le case')) {
      return {
        text: `Ti ricordi tutte le case prima di ${topPlace}?`,
        wasContextualized: true,
      }
    }
  }

  // ── No strong signal → keep original ─────────────────────────────────
  return { text: original, wasContextualized: false }
}

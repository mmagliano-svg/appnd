/**
 * Prompt Contextualization V2.1
 *
 * Adapts a selected PromptEntity using ProfileSignals to make it
 * more personal. Falls back to the original when no safe adaptation
 * exists.
 *
 * STRICT QUALITY RULE (V2.1):
 *   A contextualized prompt must be STRICTLY BETTER than the base.
 *   "Better" means: more personal AND equally clear AND equally
 *   structured AND equally answerable.
 *
 *   If the candidate is vaguer, less structured, or sounds synthetic,
 *   we discard it and return the original unchanged.
 *
 * Allowed transformations:
 *   - Inject a proper name into a slot that already expects one
 *     ("qualcuno di importante" → "Federico")
 *   - Replace a generic phrase with a personal equivalent that keeps
 *     the same structure ("la tua relazione più lunga" → "la vostra storia")
 *
 * Disallowed transformations:
 *   - Rewriting the entire sentence into a different structure
 *   - Appending contextual phrases that change the question's scope
 *   - Replacing a concrete question with a vague/poetic one
 */

import type { PromptEntity } from './prompt-types'

interface ContextSignals {
  childNames?: string[]
  repeatedPlaces?: string[]
  keyThemes?: string[]
  hasChildren?: boolean
  hasLongRelationship?: boolean
}

export function contextualizePrompt(
  prompt: PromptEntity,
  signals: ContextSignals | undefined,
): { text: string; wasContextualized: boolean } {
  if (!signals) return { text: prompt.text, wasContextualized: false }

  const childName = signals.childNames?.[0]
  const original = prompt.text

  // ── Family + child name: safe slot injections only ───────────────────
  //
  // These work because the base prompt already has a generic placeholder
  // ("qualcuno", "di famiglia") that the name replaces 1:1. The question
  // structure stays identical.
  if (prompt.category === 'family' && childName && signals.hasChildren) {
    if (original.includes(childName)) {
      // Already mentions the name — skip
    } else if (original.includes('qualcuno di importante per te')) {
      // "il giorno in cui è nato qualcuno di importante per te"
      //  → "il giorno in cui è nato Federico"
      return {
        text: original.replace('qualcuno di importante per te', childName),
        wasContextualized: true,
      }
    } else if (original.includes('compleanno di famiglia')) {
      // "un compleanno di famiglia che non dimentichi"
      //  → "un compleanno di Federico che non dimentichi"
      return {
        text: original.replace('compleanno di famiglia', `compleanno di ${childName}`),
        wasContextualized: true,
      }
    }
    // NOTE: the V2 "primo/prima + append con {name}?" rule is REMOVED.
    // It produced results like "Dove eri il primo Natale che ricordi
    // davvero con Federico?" which sounds unnatural (the "con" clashes
    // with the sentence structure in most cases).
  }

  // ── Relationship: minimal phrase swap ────────────────────────────────
  //
  // These work because the replacement is shorter/warmer and keeps the
  // exact same question skeleton.
  if (signals.hasLongRelationship && prompt.category === 'relationships') {
    if (original.includes('la tua relazione più lunga')) {
      // "quando è iniziata la tua relazione più lunga"
      //  → "quando è iniziata la vostra storia"
      return {
        text: original.replace('la tua relazione più lunga', 'la vostra storia'),
        wasContextualized: true,
      }
    }
    if (original.includes('hai condiviso con qualcuno')) {
      // "la prima casa che hai condiviso con qualcuno"
      //  → "la prima casa che avete condiviso"
      return {
        text: original.replace('hai condiviso con qualcuno', 'avete condiviso'),
        wasContextualized: true,
      }
    }
  }

  // ── REMOVED contextualizations (V2.1 quality gate) ──────────────────
  //
  // The following V2 rules are intentionally removed because the
  // candidates were weaker than the base prompts:
  //
  // ❌ "C'è una città in cui sei tornato più volte?" → "Cosa ti riporta spesso a Roma?"
  //    Reason: replaces a concrete, structured question with a vague poetic one.
  //    The base already works perfectly and leads to place + time data.
  //
  // ❌ "C'è un posto in cui tornavi sempre?" → "Cosa ti legava a Roma?"
  //    Reason: too abstract. The user doesn't know how to answer "cosa ti legava".
  //
  // ❌ "Ti ricordi tutte le case in cui hai vissuto?" → "Ti ricordi tutte le case prima di Roma?"
  //    Reason: "prima di Roma" changes the semantic scope. The base prompt asks
  //    about ALL houses; the adapted version asks only about the subset before
  //    one specific city, which is a different (narrower) question.
  //
  // ❌ "Dove eri il primo Natale?" → "Dove eri il primo Natale con {childName}?"
  //    Reason: "con" appended to the end sounds mechanical. The first Christmas
  //    might not have involved the child at all.

  // ── No strong signal → keep original ─────────────────────────────────
  return { text: prompt.text, wasContextualized: false }
}

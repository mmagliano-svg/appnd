/**
 * Prompt System V1 — Core Types
 *
 * Defines the shape of a structured prompt entity. This is the
 * foundation for the prompt engine, library, completion helpers,
 * and follow-up helpers.
 */

export type PromptKind = 'moment' | 'period' | 'cluster'

export type PromptCategory =
  | 'relationships'
  | 'home'
  | 'travel'
  | 'work'
  | 'sports'
  | 'events'
  | 'family'
  | 'friends'

/**
 * What structured data this prompt naturally leads to.
 * true = the prompt strongly implies this dimension.
 * false/undefined = not implied (user may still fill it).
 */
export interface PromptTargets {
  time?: boolean
  place?: boolean
  people?: boolean
  theme?: boolean
}

/**
 * A single structured prompt entity.
 */
export interface PromptEntity {
  /** Stable unique id (kebab-case, e.g. 'rel-first-date') */
  id: string
  /** moment / period / cluster */
  kind: PromptKind
  /** Life-area category */
  category: PromptCategory
  /** The user-facing prompt text (Italian) */
  text: string
  /** Short realistic title example for moment prompts (shown as "es. ...") */
  example?: string
  /** Which structured dimensions this prompt naturally targets */
  targets: PromptTargets
  /** 1–5 emotional weight. Higher = more likely to surface for users with fewer memories. */
  emotionalWeight?: number
  /** 'rare' prompts appear less frequently. Default is 'normal'. */
  frequency?: 'normal' | 'rare'
}

/**
 * Lightweight context passed to the prompt engine so it can make
 * informed decisions without needing a full DB query.
 */
export interface PromptEngineInput {
  /** Total memory count (events only, no periods) */
  memoryCount: number
  /** Total period count */
  periodCount: number
  /** IDs of recently shown prompts (rolling window) */
  recentPromptIds: string[]
  /** Categories the user already has memories in (for variety) */
  existingCategories?: string[]
  /** Profile signals extracted from the user's memories (optional V1.5) */
  profileSignals?: {
    hasChildren?: boolean
    hasLongRelationship?: boolean
    keyThemes?: string[]
    repeatedPlaces?: string[]
    keyPeople?: string[]
  }
}

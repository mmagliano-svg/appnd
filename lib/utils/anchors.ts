/**
 * Memory anchor detection.
 *
 * Derives recurring emotional moments purely from memory date + person birth dates.
 * No user tagging required — everything is computed from stored data.
 *
 * Designed to be future-extensible:
 *   - Add keys to FIXED_CALENDAR_ANCHORS for new occasions (Easter, etc.)
 *   - Call detectAnchors() from Home prompts, timeline views, or notification triggers
 */

// ── Types ─────────────────────────────────────────────────────────────────

export type AnchorType = 'birthday' | 'fixed'

export interface MemoryAnchor {
  type: AnchorType
  /** Stable unique key — use for deduplication and future filtering */
  key: string
  /** Italian display label */
  label: string
  personId?: string
  personName?: string
}

export interface PersonBirthRef {
  id: string
  name: string
  /** Stored as 'MM-DD' or 'YYYY-MM-DD'. null if not set. */
  birthDate: string | null
}

// ── Fixed calendar anchors ────────────────────────────────────────────────

/**
 * MM-DD → Italian label.
 * Extend here to add new occasions — no other code changes needed.
 */
export const FIXED_CALENDAR_ANCHORS: Record<string, string> = {
  '12-24': 'Vigilia di Natale',
  '12-25': 'Natale',
  '12-31': 'Capodanno',
  '01-01': "Primo dell'anno",
  '05-01': 'Primo Maggio',
  '08-15': 'Ferragosto',
}

// ── Extraction helpers ────────────────────────────────────────────────────

/**
 * Extract 'MM-DD' from a full ISO date string ('YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ssZ').
 * Used for memory happened_at / start_date values from the DB.
 */
export function dayMonthFromDate(isoDate: string): string {
  const base = isoDate.split('T')[0]   // strip time if present
  const parts = base.split('-')
  return `${parts[1]}-${parts[2]}`
}

/**
 * Extract 'MM-DD' from a stored birth_date value.
 * Accepts:
 *   'MM-DD'      — year unknown (returns as-is)
 *   'YYYY-MM-DD' — full date (returns last two segments)
 * Returns null if the value is empty or unrecognised.
 */
export function dayMonthFromBirthDate(birthDate: string): string | null {
  if (!birthDate) return null
  const parts = birthDate.trim().split('-')
  if (parts.length === 2) return birthDate.trim()            // MM-DD
  if (parts.length === 3) return `${parts[1]}-${parts[2]}`  // YYYY-MM-DD
  return null
}

/**
 * Format a birth_date value for human-readable Italian display.
 *   'MM-DD'       → '6 marzo'
 *   'YYYY-MM-DD'  → '6 marzo 1990'
 */
export function formatBirthDate(birthDate: string): string {
  const MONTHS = [
    '', 'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
    'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
  ]
  const parts = birthDate.trim().split('-')
  if (parts.length === 2) {
    const month = parseInt(parts[0], 10)
    const day   = parseInt(parts[1], 10)
    return `${day} ${MONTHS[month] ?? ''}`
  }
  if (parts.length === 3) {
    const year  = parts[0]
    const month = parseInt(parts[1], 10)
    const day   = parseInt(parts[2], 10)
    return `${day} ${MONTHS[month] ?? ''} ${year}`
  }
  return birthDate
}

// ── Upcoming birthday ─────────────────────────────────────────────────────

/**
 * Days from `today` until the next occurrence of this person's birthday.
 * Returns 0 if today is the birthday, 1–364 otherwise.
 * Returns Infinity if birth_date is unrecognised.
 */
export function daysUntilBirthday(birthDate: string, today: Date = new Date()): number {
  const mmDd = dayMonthFromBirthDate(birthDate)
  if (!mmDd) return Infinity
  const [mm, dd] = mmDd.split('-').map(Number)

  const y = today.getFullYear()
  const todayMidnight = new Date(y, today.getMonth(), today.getDate())
  const thisYear      = new Date(y,     mm - 1, dd)
  const nextYear      = new Date(y + 1, mm - 1, dd)

  const diffThis = Math.round((thisYear.getTime() - todayMidnight.getTime()) / 86_400_000)
  return diffThis >= 0 ? diffThis : Math.round((nextYear.getTime() - todayMidnight.getTime()) / 86_400_000)
}

// ── Edit-form helpers ─────────────────────────────────────────────────────

/**
 * Parse a stored birth_date value into independent edit-form fields.
 * Accepts 'MM-DD' (year unknown) or 'YYYY-MM-DD' (year known).
 * Always returns strings — empty string means "not set".
 */
export function parseBirthDate(birthDate: string): { day: string; month: string; year: string } {
  if (!birthDate) return { day: '', month: '', year: '' }
  const parts = birthDate.trim().split('-')
  if (parts.length === 2) return { month: parts[0], day: parts[1], year: '' }  // MM-DD
  if (parts.length === 3) return { year: parts[0], month: parts[1], day: parts[2] }  // YYYY-MM-DD
  return { day: '', month: '', year: '' }
}

/**
 * Assemble edit-form fields back into a storable birth_date value.
 * Returns null if day or month is missing (incomplete = no date set).
 */
export function assembleBirthDate(day: string, month: string, year: string): string | null {
  if (!day || !month) return null
  return year ? `${year}-${month}-${day}` : `${month}-${day}`
}

// ── Core detection ────────────────────────────────────────────────────────

/**
 * Given a memory date and its linked people, return all matching anchors.
 * Pure function — no side effects, no DB access.
 *
 * Usage:
 *   const anchors = detectAnchors(memory.start_date, taggedPeople)
 */
export function detectAnchors(
  memoryDate: string,
  people: PersonBirthRef[],
): MemoryAnchor[] {
  const anchors: MemoryAnchor[] = []
  const mm_dd = dayMonthFromDate(memoryDate)

  // Fixed calendar moments
  const fixedLabel = FIXED_CALENDAR_ANCHORS[mm_dd]
  if (fixedLabel) {
    anchors.push({ type: 'fixed', key: `fixed:${mm_dd}`, label: fixedLabel })
  }

  // Birthday matches
  for (const person of people) {
    if (!person.birthDate) continue
    const personMmDd = dayMonthFromBirthDate(person.birthDate)
    if (personMmDd === mm_dd) {
      anchors.push({
        type: 'birthday',
        key: `birthday:${person.id}`,
        label: `Compleanno di ${person.name}`,
        personId: person.id,
        personName: person.name,
      })
    }
  }

  return anchors
}

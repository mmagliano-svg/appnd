/**
 * Age System V1
 *
 * Computes the user's age at a given date or across a date range.
 * Returns null when no birth date is available — the feature is
 * safely no-op without schema changes.
 *
 * Birth date source: users table does NOT have birth_date yet.
 * When it's added, pass it through from the profile query.
 * Until then, callers pass null and the functions return null.
 */

/**
 * Returns the user's age (in whole years) at a given date.
 * Returns null if birthDate is not available.
 */
export function getAgeAt(
  date: string,
  birthDate: string | null | undefined,
): number | null {
  if (!birthDate) return null
  const d = new Date(date)
  const b = new Date(birthDate)
  if (isNaN(d.getTime()) || isNaN(b.getTime())) return null

  let age = d.getFullYear() - b.getFullYear()
  const monthDiff = d.getMonth() - b.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && d.getDate() < b.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}

/**
 * Returns a formatted age string for a date range (period).
 *
 * Examples:
 *   - "16–18 anni"  (start + end)
 *   - "da 16 anni"  (start only, no end)
 *   - "34 anni"     (start === end age)
 *
 * Returns null if birthDate is not available.
 */
export function getAgeRange(
  startDate: string,
  endDate: string | null | undefined,
  birthDate: string | null | undefined,
): string | null {
  const startAge = getAgeAt(startDate, birthDate)
  if (startAge === null) return null

  if (!endDate) {
    return `da ${startAge} anni`
  }

  const endAge = getAgeAt(endDate, birthDate)
  if (endAge === null) return `${startAge} anni`

  if (startAge === endAge) return `${startAge} anni`
  return `${startAge}–${endAge} anni`
}

/**
 * Formats age for inline display in metadata rows.
 * Returns "· 34 anni" or null.
 */
export function formatAgeInline(
  date: string,
  birthDate: string | null | undefined,
): string | null {
  const age = getAgeAt(date, birthDate)
  if (age === null) return null
  return `${age} anni`
}

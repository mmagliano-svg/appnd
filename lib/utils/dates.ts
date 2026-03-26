/**
 * Format a memory date range for display.
 *
 * Rules:
 * - No end_date (single day):        "4 ottobre 2015"
 * - Same month period:               "agosto 1998"
 * - Cross-month, same year:          "1 ago – 15 set 1998"
 * - Cross-year:                      "dicembre 2023 – gennaio 2024"
 */
export function formatMemoryDate(startDate: string, endDate: string | null): string {
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)

  if (!endDate) {
    return start.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const [ey, em, ed] = endDate.split('-').map(Number)
  const end = new Date(ey, em - 1, ed)

  // Same month and year → "agosto 1998"
  if (sy === ey && sm === em) {
    return start.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  }

  // Same year, different months → "1 ago – 15 set 1998"
  if (sy === ey) {
    const s = start.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
    const e = end.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${s} – ${e}`
  }

  // Different years → "dicembre 2023 – gennaio 2024"
  const s = start.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  const e = end.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  return `${s} – ${e}`
}

/**
 * Short format for card previews.
 * - Single day:          "4 ott"
 * - Same month period:   "ago 1998"
 * - Cross-month period:  "ago – set 1998"
 * - Cross-year period:   "dic '23 – gen '24"
 */
export function formatMemoryDateShort(startDate: string, endDate: string | null): string {
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)

  if (!endDate) {
    return start.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
  }

  const [ey, em, ed] = endDate.split('-').map(Number)
  const end = new Date(ey, em - 1, ed)

  if (sy === ey && sm === em) {
    return start.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })
  }

  if (sy === ey) {
    const s = start.toLocaleDateString('it-IT', { month: 'short' })
    const e = end.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })
    return `${s} – ${e}`
  }

  const s = start.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })
  const e = end.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })
  return `${s} – ${e}`
}

/**
 * Full format for the memory detail page.
 * Single days include the weekday ("lunedì 4 ottobre 2015").
 * Periods use the same format as formatMemoryDate.
 */
export function formatMemoryDateFull(startDate: string, endDate: string | null): string {
  if (!endDate) {
    const [y, m, d] = startDate.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
  return formatMemoryDate(startDate, endDate)
}

/**
 * Prominent uppercase display for period memory cards.
 * "GEN 2004 — LUG 2008"
 * Same month: "AGO 1998"
 */
// Sentinel value used for ongoing (no end date) periods
export const ONGOING_SENTINEL = '9999-12-31'

export function formatPeriodDisplay(startDate: string, endDate: string): string {
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)

  const fmt = (date: Date, opts: Intl.DateTimeFormatOptions) =>
    date
      .toLocaleDateString('it-IT', opts)
      .replace(/\./g, '')   // remove dots from abbreviations
      .toUpperCase()

  const startFmt = fmt(start, { month: 'short', year: 'numeric' })

  // Sentinel = ongoing period
  if (endDate >= '9999-01-01') return `${startFmt} — oggi`

  const [ey, em, ed] = endDate.split('-').map(Number)
  const end = new Date(ey, em - 1, ed)

  // Same month and year → "AGO 1998"
  if (sy === ey && sm === em) return startFmt

  // Same year → "AGO — SET 1998"  (omit year from start)
  if (sy === ey) {
    return `${fmt(start, { month: 'short' })} — ${fmt(end, { month: 'short', year: 'numeric' })}`
  }

  // Different years → "GEN 2004 — LUG 2008"
  return `${startFmt} — ${fmt(end, { month: 'short', year: 'numeric' })}`
}

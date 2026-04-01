/**
 * Generates a short, emotional sentence summarising what a year represents.
 * Max 5–6 words. No punctuation at the end. Soft, not declarative.
 *
 * Priority:
 *   A. Dominant person name (from titles, if the same first name appears ≥2×)
 *   B. Dominant theme from categories/tags (top 1–2)
 *   C. Both person + theme → combined
 *   D. Very few memories → soft fallback
 */

// ── Italian labels for known category values ───────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  famiglia: 'famiglia',
  viaggi:   'viaggi',
  amici:    'amici',
  eventi:   'feste',
  lavoro:   'lavoro',
  sport:    'sport',
  scuola:   'scuola',
  altro:    'momenti speciali',
}

// ── Name extraction from titles ────────────────────────────────────────────
// Very lightweight: looks for capitalised tokens that are likely proper names
// (2+ chars, not all-uppercase, not a common Italian word).

const COMMON_WORDS = new Set([
  'di', 'il', 'la', 'le', 'lo', 'i', 'gli', 'un', 'una', 'del', 'della',
  'nel', 'nella', 'con', 'per', 'tra', 'fra', 'su', 'al', 'alla',
  'questo', 'questa', 'mio', 'mia', 'miei', 'mie',
  'cena', 'gita', 'viaggio', 'festa', 'vacanza', 'compleanno',
  'estate', 'natale', 'capodanno', 'pasqua', 'weekend',
])

function extractNames(titles: string[]): string[] {
  const counts = new Map<string, number>()
  for (const title of titles) {
    const words = title.split(/\s+/)
    for (const raw of words) {
      const w = raw.replace(/[^a-zA-ZÀ-ÿ]/g, '')
      if (
        w.length >= 2 &&
        w[0] === w[0].toUpperCase() &&
        w[0] !== w[0].toLowerCase() && // actually capitalised
        !COMMON_WORDS.has(w.toLowerCase()) &&
        w !== w.toUpperCase() // not an acronym
      ) {
        counts.set(w, (counts.get(w) ?? 0) + 1)
      }
    }
  }
  // Only names that appear in 2+ titles
  return Array.from(counts.entries())
    .filter(([, n]) => n >= 2)
    .sort(([, a], [, b]) => b - a)
    .map(([name]) => name)
}

// ── Main export ────────────────────────────────────────────────────────────

export function getYearHighlight({
  count,
  tags,
  categories,
  titles,
}: {
  count: number
  tags: string[]
  categories: string[]
  titles: string[]
}): string {
  // D. Very few memories
  if (count === 1) return 'un momento speciale'
  if (count <= 2) return 'piccoli ricordi'

  // Build frequency map of themes (categories + tags, lowercased)
  const themeCounts = new Map<string, number>()
  const allThemes = [
    ...categories.map((c) => c.toLowerCase()),
    ...tags.map((t) => t.toLowerCase()),
  ]
  for (const t of allThemes) {
    if (CATEGORY_LABELS[t]) {
      themeCounts.set(t, (themeCounts.get(t) ?? 0) + 1)
    }
  }

  const topThemes = Array.from(themeCounts.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([key]) => CATEGORY_LABELS[key])
    .filter(Boolean)

  // A/C. Dominant person
  const names = extractNames(titles)
  const dominantName = names[0] ?? null

  // C. Person + dominant theme
  if (dominantName && topThemes.length > 0) {
    return `${topThemes[0]} con ${dominantName}`
  }

  // A. Person only
  if (dominantName) {
    return `l'anno di ${dominantName}`
  }

  // B. Theme(s)
  if (topThemes.length >= 2) {
    return `${topThemes[0]} e ${topThemes[1]}`
  }
  if (topThemes.length === 1) {
    return topThemes[0]
  }

  // D. Generic fallback
  return 'momenti insieme'
}

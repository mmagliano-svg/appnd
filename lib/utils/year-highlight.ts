/**
 * Generates a short, emotional sentence summarising what a year represents.
 * Max 5–6 words. No punctuation at the end. Soft, not declarative.
 *
 * Priority:
 *   1. Dominant person name → "l'anno di {Nome}"
 *   2. Person + dominant category → "viaggi con {Nome}"
 *   3. Two dominant categories → "feste e amici"
 *   4. One dominant category → "viaggi"
 *   5. Fallback (varied) → "momenti insieme"
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

// ── Varied fallback pools ──────────────────────────────────────────────────

const SINGLE_FALLBACKS = [
  'un momento che conta',
  '· un ricordo importante',
  'qualcosa da ricordare',
]

const FEW_FALLBACKS = [
  'piccoli ricordi',
  'momenti sparsi',
  'momenti insieme',
]

const DEFAULT_FALLBACKS = [
  'momenti insieme',
  'frammenti di vita',
]

/** Picks from an array using the year as a stable seed (no randomness on re-render). */
function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

// ── Name extraction from titles ────────────────────────────────────────────
// Lightweight: finds capitalised tokens that are likely proper names
// (2+ chars, not all-uppercase, not a common Italian word).

const COMMON_WORDS = new Set([
  'di', 'il', 'la', 'le', 'lo', 'i', 'gli', 'un', 'una', 'del', 'della',
  'nel', 'nella', 'con', 'per', 'tra', 'fra', 'su', 'al', 'alla',
  'questo', 'questa', 'mio', 'mia', 'miei', 'mie',
  'cena', 'gita', 'viaggio', 'festa', 'vacanza', 'compleanno',
  'estate', 'natale', 'capodanno', 'pasqua', 'weekend', 'primo', 'prima',
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
        w[0] !== w[0].toLowerCase() &&   // actually capitalised
        !COMMON_WORDS.has(w.toLowerCase()) &&
        w !== w.toUpperCase()             // not an acronym
      ) {
        counts.set(w, (counts.get(w) ?? 0) + 1)
      }
    }
  }
  // Only names that appear in 2+ titles → strong signal
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
  year = 0,
}: {
  count: number
  tags: string[]
  categories: string[]
  titles: string[]
  year?: number
}): string {
  // 5. Fallback — very few memories
  if (count === 1) return pick(SINGLE_FALLBACKS, year)
  if (count <= 2)  return pick(FEW_FALLBACKS, year)

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

  // 1 + 2. Dominant person
  const names = extractNames(titles)
  const dominantName = names[0] ?? null

  // 1. Person only (no clear category)
  if (dominantName && topThemes.length === 0) {
    return `l'anno di ${dominantName}`
  }

  // 2. Person + dominant category
  if (dominantName && topThemes.length > 0) {
    return `${topThemes[0]} con ${dominantName}`
  }

  // 3. Two categories
  if (topThemes.length >= 2) {
    return `${topThemes[0]} e ${topThemes[1]}`
  }

  // 4. One category
  if (topThemes.length === 1) {
    return topThemes[0]
  }

  // 5. Generic fallback (varied)
  return pick(DEFAULT_FALLBACKS, year)
}

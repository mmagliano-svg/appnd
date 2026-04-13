/**
 * Profile Signals Engine V1
 *
 * Extracts high-value life signals from existing user data (memories,
 * periods, categories, places, titles). Pure rule-based, no AI, no
 * new backend queries.
 *
 * The output powers:
 *   - Prompt personalization (which prompts are most relevant?)
 *   - Clustering (what life themes does this user have?)
 *   - Resurfacing (what places/people keep coming back?)
 *   - Future meaning engine
 *
 * Input: the same memory array already fetched by getUserMemories().
 * Output: a flat ProfileSignals object.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface ProfileSignals {
  /** The user's most frequent place — likely their home base */
  homePlace: string | null
  /** Places that appear in 2+ memories (most frequent first) */
  repeatedPlaces: string[]
  /** All unique places the user has memories in */
  keyPlaces: string[]
  /** Recurring categories/themes (appear in 2+ memories) */
  keyThemes: string[]
  /** Names extracted from titles that look like child references */
  childNames: string[]
  /** Names extracted from titles that look like relationship references */
  relationshipNames: string[]
  /** Names extracted from titles that look like school references */
  schoolNames: string[]
  /** Names extracted from titles that look like work references */
  workNames: string[]
  /** Names extracted from titles that look like sport references */
  sportNames: string[]
  /** Names of people that appear most frequently across memory titles */
  keyPeople: string[]
  /** True if any child-related signal is found */
  hasChildren: boolean
  /** True if user has a relationship period longer than 1 year */
  hasLongRelationship: boolean
  /** Total memory count (events) */
  memoryCount: number
  /** Total period count */
  periodCount: number
  /** Distinct categories the user has */
  existingCategories: string[]
}

// ── Input type (matches getUserMemories() shape) ───────────────────────────

interface MemoryInput {
  title: string
  start_date: string
  end_date: string | null
  location_name: string | null
  category: string | null
  categories: string[]
  tags: string[]
  description: string | null
}

// ── Keyword lists for extraction ───────────────────────────────────────────

const CHILD_KEYWORDS = ['figlio', 'figlia', 'nascita', 'nato', 'nata', 'gravidanza', 'parto', 'battesimo', 'neonato']
const RELATIONSHIP_KEYWORDS = ['fidanzata', 'fidanzato', 'moglie', 'marito', 'compagna', 'compagno', 'relazione', 'amore', 'sposato', 'sposata', 'matrimonio', 'nozze']
const SCHOOL_KEYWORDS = ['scuola', 'liceo', 'università', 'laurea', 'esame', 'diploma', 'compagni', 'professore', 'classe']
const WORK_KEYWORDS = ['lavoro', 'ufficio', 'azienda', 'colloquio', 'stipendio', 'capo', 'collega', 'dimissioni']
const SPORT_KEYWORDS = ['allenamento', 'partita', 'squadra', 'allenatore', 'torneo', 'gara', 'campo', 'palestra']

/**
 * Extract proper-noun-looking words from a title that appear right
 * after a keyword. Very rough heuristic — catches patterns like
 * "Nascita di Federico", "Matrimonio di Marta".
 */
function extractNameAfterKeyword(title: string, keywords: string[]): string[] {
  const names: string[] = []
  const lower = title.toLowerCase()
  for (const kw of keywords) {
    const idx = lower.indexOf(kw)
    if (idx < 0) continue
    // Look for "di <Name>" after the keyword
    const after = title.slice(idx + kw.length)
    const match = after.match(/\s+(?:di\s+)?([A-Z][a-zàáèéìíòóùú]+)/)
    if (match) names.push(match[1])
  }
  return names
}

/**
 * Extract capitalized names from all titles (rough: any capitalized
 * word that isn't the first word and isn't a common Italian stopword).
 */
const ITALIAN_STOPWORDS = new Set([
  'Il', 'La', 'Lo', 'Le', 'Li', 'Un', 'Una', 'Uno',
  'Di', 'Da', 'In', 'Con', 'Su', 'Per', 'Tra', 'Fra',
  'Che', 'Non', 'Ma', 'Anche', 'Dove', 'Quando', 'Come',
  'Primo', 'Prima', 'Ultimo', 'Ultima',
])

function extractPeopleNames(titles: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const title of titles) {
    const words = title.split(/\s+/)
    for (let i = 1; i < words.length; i++) {
      const w = words[i].replace(/[.,;:!?'"()]/g, '')
      if (w.length < 2) continue
      if (!/^[A-Z]/.test(w)) continue
      if (ITALIAN_STOPWORDS.has(w)) continue
      counts.set(w, (counts.get(w) ?? 0) + 1)
    }
  }
  return counts
}

// ── Main extraction function ───────────────────────────────────────────────

/**
 * Extract profile signals from an array of memories. Pure function,
 * no side effects, no network calls. Designed to run on the same
 * data getUserMemories() already returns.
 */
export function extractProfileSignals(memories: MemoryInput[]): ProfileSignals {
  const events = memories.filter((m) => !m.end_date)
  const periods = memories.filter((m) => m.end_date)
  const allTitles = memories.map((m) => m.title)

  // ── Places ────────────────────────────────────────────────────────
  const placeCounts = new Map<string, number>()
  for (const m of memories) {
    if (!m.location_name) continue
    const loc = m.location_name.trim()
    if (!loc) continue
    placeCounts.set(loc, (placeCounts.get(loc) ?? 0) + 1)
  }

  const keyPlaces: string[] = []
  const repeatedPlaces: string[] = []
  placeCounts.forEach((count, place) => {
    keyPlaces.push(place)
    if (count >= 2) repeatedPlaces.push(place)
  })
  // Sort by frequency desc
  repeatedPlaces.sort((a, b) => (placeCounts.get(b) ?? 0) - (placeCounts.get(a) ?? 0))

  // Home place = most frequent place (likely the user's base)
  let homePlace: string | null = null
  let homePlaceCount = 0
  placeCounts.forEach((count, place) => {
    if (count > homePlaceCount) {
      homePlaceCount = count
      homePlace = place
    }
  })

  // ── Categories / themes ───────────────────────────────────────────
  const catCounts = new Map<string, number>()
  for (const m of memories) {
    const cats = m.categories?.length ? m.categories : m.category ? [m.category] : []
    for (const cat of cats) {
      catCounts.set(cat, (catCounts.get(cat) ?? 0) + 1)
    }
  }
  const existingCategories: string[] = []
  const keyThemes: string[] = []
  catCounts.forEach((count, cat) => {
    existingCategories.push(cat)
    if (count >= 2) keyThemes.push(cat)
  })

  // ── Name extraction from titles ───────────────────────────────────
  const childNames = Array.from(new Set(
    allTitles.flatMap((t) => extractNameAfterKeyword(t, CHILD_KEYWORDS))
  ))
  const relationshipNames = Array.from(new Set(
    allTitles.flatMap((t) => extractNameAfterKeyword(t, RELATIONSHIP_KEYWORDS))
  ))
  const schoolNames = Array.from(new Set(
    allTitles.flatMap((t) => extractNameAfterKeyword(t, SCHOOL_KEYWORDS))
  ))
  const workNames = Array.from(new Set(
    allTitles.flatMap((t) => extractNameAfterKeyword(t, WORK_KEYWORDS))
  ))
  const sportNames = Array.from(new Set(
    allTitles.flatMap((t) => extractNameAfterKeyword(t, SPORT_KEYWORDS))
  ))

  // ── Key people (most frequently mentioned proper names) ───────────
  const peopleCounts = extractPeopleNames(allTitles)
  const keyPeople: string[] = []
  peopleCounts.forEach((count, name) => {
    if (count >= 2) keyPeople.push(name)
  })
  keyPeople.sort((a, b) => (peopleCounts.get(b) ?? 0) - (peopleCounts.get(a) ?? 0))

  // ── Boolean signals ───────────────────────────────────────────────
  const hasChildren = childNames.length > 0 ||
    allTitles.some((t) => CHILD_KEYWORDS.some((kw) => t.toLowerCase().includes(kw)))

  const hasLongRelationship = periods.some((p) => {
    if (!p.end_date) return false
    const cats = p.categories?.length ? p.categories : p.category ? [p.category] : []
    const isRelCat = cats.some((c) =>
      c.toLowerCase().includes('relazione') || c.toLowerCase().includes('amore')
    )
    if (!isRelCat) {
      // Fallback: check title
      const titleLower = p.title.toLowerCase()
      if (!RELATIONSHIP_KEYWORDS.some((kw) => titleLower.includes(kw))) return false
    }
    const startMs = new Date(p.start_date).getTime()
    const endMs = new Date(p.end_date).getTime()
    const oneYearMs = 365 * 24 * 60 * 60 * 1000
    return (endMs - startMs) > oneYearMs
  })

  return {
    homePlace,
    repeatedPlaces,
    keyPlaces,
    keyThemes,
    childNames,
    relationshipNames,
    schoolNames,
    workNames,
    sportNames,
    keyPeople,
    hasChildren,
    hasLongRelationship,
    memoryCount: events.length,
    periodCount: periods.length,
    existingCategories,
  }
}

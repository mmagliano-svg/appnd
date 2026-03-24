/**
 * Normalizes a single tag: lowercase, trim, no spaces, only alphanumeric + Italian accents.
 * Returns empty string if result is invalid (caller must filter).
 */
export function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9àèéìíîòóùúäëïöü]/gi, '')
}

/**
 * Normalizes an array of tags: deduplicates, removes empty, preserves order.
 */
export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const tag of tags) {
    const normalized = normalizeTag(tag)
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized)
      result.push(normalized)
    }
  }
  return result
}

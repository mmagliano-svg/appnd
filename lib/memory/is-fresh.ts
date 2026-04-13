/**
 * Determines whether a memory was just created (within the last N minutes).
 * Used to gate the post-creation follow-up UI without relying on fragile
 * URL search parameters.
 */
export function isFresh(createdAt: string, minutes = 5): boolean {
  const created = new Date(createdAt).getTime()
  if (isNaN(created)) return false
  const now = Date.now()
  return now - created < minutes * 60 * 1000
}

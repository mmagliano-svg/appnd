/**
 * Core Macro Categories V1
 *
 * Stable top-level life categories that apply to both memories and
 * periods. This is the single source of truth for category options
 * across the product.
 *
 * These are NOT tags — they are structural categories that reflect
 * the architecture of a human life:
 *   family, relationships, friends, education, work, travel, health, life
 */

export interface CoreCategory {
  id: string
  /** Italian label shown in UI */
  label: string
  /** Optional short Italian description */
  description?: string
}

export const CORE_CATEGORIES: CoreCategory[] = [
  { id: 'family',        label: 'Famiglia',     description: 'Genitori, figli, parenti' },
  { id: 'relationships', label: 'Relazioni',    description: 'Storie, legami, amori' },
  { id: 'friends',       label: 'Amici',        description: 'Amicizie, gruppi, compagni' },
  { id: 'education',     label: 'Istruzione',   description: 'Scuola, università, formazione' },
  { id: 'work',          label: 'Lavoro',       description: 'Carriera, progetti, colleghi' },
  { id: 'travel',        label: 'Viaggi',       description: 'Luoghi, avventure, scoperte' },
  { id: 'health',        label: 'Salute',       description: 'Corpo, sport, benessere' },
  { id: 'life',          label: 'Vita',         description: 'Momenti che non rientrano altrove' },
]

/** Look up a core category by id. */
export function getCoreCategoryById(id: string | null | undefined): CoreCategory | null {
  if (!id) return null
  return CORE_CATEGORIES.find((c) => c.id === id) ?? null
}

/** All category ids as a flat string array — for type guards / filtering. */
export const CORE_CATEGORY_IDS = CORE_CATEGORIES.map((c) => c.id)

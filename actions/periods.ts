'use server'

import { createMemoryReturnId } from '@/actions/memories'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PROTOTYPE SEAM — Period persistence
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This file isolates the current assumption that a "period" is persisted
 * as a row in the `memories` table with `end_date` set. That coupling is
 * an existing schema decision (migration 0006_period_columns.sql) and
 * many places in the codebase already depend on it.
 *
 * The Prompt Taxonomy V1 introduced /periods/new as a distinct creation
 * flow. To keep the data-model decision deferrable, all period
 * persistence goes through THIS wrapper — nowhere else in the prompt
 * flow touches the memories table directly for period creation.
 *
 * When we later decide to promote Period to a first-class entity
 * (its own table, its own routes, its own detail page), ONLY the
 * body of this function needs to change. Callers stay the same:
 *
 *   - /periods/new submit handler
 *   - (future) any other place that creates a period
 *
 * DO NOT inline this logic back into the page. The whole point is
 * that product code doesn't know how a period is stored.
 *
 * See: .claude/plans/synthetic-booping-snowglobe.md
 *      (tech note: "Period persistence")
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface CreatePeriodPrototypeInput {
  title: string
  start_date: string
  end_date?: string
  location_name?: string
  description?: string
  categories?: string[]
}

export interface CreatePeriodPrototypeResult {
  /** Stable identifier for the created period. */
  id: string
  /** Where the UI should navigate after creation. */
  href: string
}

/**
 * PROTOTYPE: creates a period using the legacy memory-with-end_date shape.
 *
 * Replace the body (not the signature) when Period becomes a real entity.
 * The returned `href` may later change from `/memories/:id` to `/periods/:id`.
 */
export async function createPeriodPrototype(
  input: CreatePeriodPrototypeInput,
): Promise<CreatePeriodPrototypeResult> {
  const id = await createMemoryReturnId({
    title: input.title,
    start_date: input.start_date,
    end_date: input.end_date,
    location_name: input.location_name,
    description: input.description,
    categories: input.categories,
  })

  return {
    id,
    href: `/memories/${id}`,
  }
}

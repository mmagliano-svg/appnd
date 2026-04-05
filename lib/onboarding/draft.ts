// Shared types and constants for the pre-auth onboarding draft flow.
// Imported by both /onboarding/create and /onboarding/restore.

export interface MemoryDraft {
  title: string
  description: string
  start_date: string
}

export const DRAFT_KEY = 'appnd_ob_draft'

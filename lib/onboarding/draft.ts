// Shared types and constants for the pre-auth onboarding draft flow.
// Imported by /create/photo, /create/text, and /onboarding/restore.

/**
 * A person the user says was in the moment.
 * `value` is free text — can be a name, a full name, or an email address.
 * At restore time we detect emails (contain "@") and create invites for those.
 */
export interface DraftPerson {
  value: string
}

export interface MemoryDraft {
  title: string
  description: string
  start_date: string
  /**
   * Compressed base64 data-URL (JPEG) from /create/photo.
   * Absent in text-only drafts.
   */
  image_data_url?: string
  /**
   * People the user added in the create flow ("Chi era con te?").
   * Those whose value looks like an email will receive invites at restore time.
   */
  people?: DraftPerson[]
}

export const DRAFT_KEY = 'appnd_ob_draft'

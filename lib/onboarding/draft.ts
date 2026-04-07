// Shared types and constants for the pre-auth onboarding draft flow.
// Imported by both /onboarding/create and /onboarding/restore.

export interface MemoryDraft {
  title: string
  description: string
  start_date: string
  /**
   * Compressed base64 data-URL (JPEG) of the photo selected in /create/photo.
   * Stored so the image survives the auth-email redirect.
   * Absent in text-only drafts (from /create/text or /onboarding/create).
   */
  image_data_url?: string
}

export const DRAFT_KEY = 'appnd_ob_draft'

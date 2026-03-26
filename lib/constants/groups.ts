// Shared constants + types — safe to import in BOTH server and client components.
// Never add 'use server' or 'use client' to this file.

export const GROUP_TYPES = [
  { value: 'couple',  label: 'Coppia',   emoji: '💑' },
  { value: 'family',  label: 'Famiglia', emoji: '👨‍👩‍👧‍👦' },
  { value: 'friends', label: 'Amici',    emoji: '🫂' },
  { value: 'trip',    label: 'Viaggio',  emoji: '✈️' },
  { value: 'other',   label: 'Altro',    emoji: '◎' },
] as const

export type GroupType = (typeof GROUP_TYPES)[number]['value']

// ── Shared TypeScript types ───────────────────────────────────────────────
// Defined here so client components never need to import from actions/groups.ts

export interface GroupSummary {
  id: string
  name: string
  type: string
  memberCount: number
  memoryCount: number
  previewMembers: Array<{ displayName: string }>
  inviteToken: string
}

export interface GroupMember {
  id: string
  userId: string | null
  displayName: string
  role: string
  joinedAt: string | null
}

export interface GroupMemory {
  id: string
  title: string
  startDate: string
  locationName: string | null
  categories: string[]
  previewUrl: string | null
}

export interface GroupDetail {
  id: string
  name: string
  type: string
  createdBy: string
  inviteToken: string
  members: GroupMember[]
  memories: GroupMemory[]
}

export interface PublicGroupPreview {
  id: string
  name: string
  type: string
  memberCount: number
  previewMembers: Array<{ displayName: string }>
  inviterName: string
}

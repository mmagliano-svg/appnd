import Link from 'next/link'
import { TimelineHighlight } from './TimelineHighlight'

// ── Types ─────────────────────────────────────────────────────────────────

export interface TimelineFragment {
  id: string
  content_type: string
  text_content: string | null
  media_url: string | null
  caption: string | null
  created_at: string
  author_id: string
  users?: { display_name?: string | null; email?: string | null; avatar_url?: string | null } | null
}

export interface TimelineParticipant {
  userId: string
  name: string
  avatarUrl?: string | null
}

interface MemoryTimelineProps {
  contributions: TimelineFragment[]
  happenedAt: string
  heroContributionId: string | null
  userId: string | null
  memoryId: string
  highlightLast?: boolean
  participants?: TimelineParticipant[]
}

// ── Helpers ───────────────────────────────────────────────────────────────

function getDiffDays(createdAt: string, happenedAt: string): number {
  return Math.floor(
    (new Date(createdAt).getTime() - new Date(happenedAt).getTime()) /
      (1000 * 60 * 60 * 24),
  )
}

function getGroupLabel(diffDays: number): string {
  if (diffDays <= 0)   return 'Quel giorno'
  if (diffDays === 1)  return 'Il giorno dopo'
  if (diffDays <= 6)   return 'Qualche giorno dopo'
  if (diffDays <= 13)  return 'Una settimana dopo'
  if (diffDays <= 27)  return 'Qualche settimana dopo'
  if (diffDays <= 59)  return 'Un mese dopo'
  if (diffDays <= 179) return 'Qualche mese dopo'
  if (diffDays <= 364) return 'Quasi un anno dopo'
  if (diffDays <= 729) return 'Un anno dopo'
  return `${Math.floor(diffDays / 365)} anni dopo`
}

/**
 * Personalized micro-label for the first fragment of each time group.
 * Varies by whether the fragment is the current user's or someone else's.
 */
function getMicroLabel(
  isAbsoluteFirst: boolean,
  isFirstOfGroup: boolean,
  diffDays: number,
  isOwn: boolean,
  firstName: string,
): string | null {
  if (isAbsoluteFirst) return null         // handled by origin mark
  if (!isFirstOfGroup) return null
  if (!isOwn) {
    if (diffDays > 180) return `${firstName} è tornato su questo momento`
    return `A ${firstName} è tornato in mente`
  }
  if (diffDays > 180) return 'Lo hai rivissuto'
  return 'Ti è tornato in mente'
}

function formatFragmentDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function firstName(name: string): string {
  return name.split(/\s+/)[0]
}

/**
 * Stable hash derived from a fragment id.
 * Drives deterministic rendering variation — never random.
 */
function idHash(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) & 0xffff
  }
  return h
}

/**
 * Identity line shown below others' contributions.
 * Cycles through 3 variants based on id hash.
 */
function getIdentityLine(name: string, hash: number): string {
  const templates = [
    `Ricordato da ${name}`,
    `Aggiunto da ${name}`,
    `Visto da ${name}`,
  ]
  return templates[hash % 3]
}

// ── Component ─────────────────────────────────────────────────────────────

export function MemoryTimeline({
  contributions,
  happenedAt,
  heroContributionId,
  userId,
  memoryId,
  highlightLast,
  participants = [],
}: MemoryTimelineProps) {
  const visible = contributions.filter(
    (c) =>
      c.id !== heroContributionId &&
      (c.content_type === 'photo' ||
        c.content_type === 'text' ||
        c.content_type === 'note'),
  )

  // ── Multi-perspective detection ──────────────────────────────────────────
  type Contributor = { authorId: string; firstName: string; ini: string; avatarUrl: string | null }
  const contributorMap = new Map<string, Contributor>()
  for (const c of visible) {
    if (!contributorMap.has(c.author_id)) {
      const name = c.users?.display_name ?? c.users?.email?.split('@')[0] ?? 'Anonimo'
      contributorMap.set(c.author_id, {
        authorId: c.author_id,
        firstName: firstName(name),
        ini: initials(name),
        avatarUrl: c.users?.avatar_url ?? null,
      })
    }
  }
  const uniqueContributors = Array.from(contributorMap.values())
  const isMultiPerspective = uniqueContributors.length >= 2
  const singleContributorWithOthers =
    uniqueContributors.length === 1 && participants.length >= 2

  // ── Empty state ──────────────────────────────────────────────────────────
  if (visible.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-[15px] text-muted-foreground/40 italic leading-relaxed">
          È ancora tutto qui.
        </p>
        <p className="text-[12px] text-muted-foreground/25 leading-relaxed mt-3 max-w-[220px] mx-auto">
          Ma potrebbe non restare così
        </p>
      </div>
    )
  }

  // ── Group by relative time ────────────────────────────────────────────────
  type RawGroup = { label: string; items: TimelineFragment[] }
  const rawGroups: RawGroup[] = []
  const labelToGroup = new Map<string, RawGroup>()

  for (const c of visible) {
    const label = getGroupLabel(getDiffDays(c.created_at, happenedAt))
    if (!labelToGroup.has(label)) {
      const g: RawGroup = { label, items: [] }
      rawGroups.push(g)
      labelToGroup.set(label, g)
    }
    labelToGroup.get(label)!.items.push(c)
  }

  // Pre-compute per-fragment metadata
  const lastVisibleId = visible[visible.length - 1].id
  const firstVisibleId = visible[0].id

  type FragmentVariant = 'normal' | 'dim' | 'spacious'

  type ProcessedFragment = TimelineFragment & {
    microLabel: string | null
    isFirst: boolean
    isLast: boolean
    variant: FragmentVariant
    isOwn: boolean
    authorFirstName: string
    authorIni: string
    authorDisplayName: string
    authorAvatarUrl: string | null
    showIdentityLayer: boolean
  }

  const groups = rawGroups.map((group, gi) => ({
    label: group.label,
    items: group.items.map((c, fi): ProcessedFragment => {
      const hash = idHash(c.id)
      const variant: FragmentVariant =
        hash % 4 === 0 ? 'spacious' : hash % 7 === 0 ? 'dim' : 'normal'
      const isOwn = c.author_id === userId
      const displayName = c.users?.display_name ?? c.users?.email?.split('@')[0] ?? 'Anonimo'
      const diffDays = getDiffDays(c.created_at, happenedAt)
      return {
        ...c,
        microLabel: getMicroLabel(
          gi === 0 && fi === 0,
          fi === 0,
          diffDays,
          isOwn,
          firstName(displayName),
        ),
        isFirst: c.id === firstVisibleId,
        isLast: c.id === lastVisibleId,
        variant,
        isOwn,
        authorFirstName: firstName(displayName),
        authorIni: initials(displayName),
        authorDisplayName: displayName,
        authorAvatarUrl: c.users?.avatar_url ?? null,
        // Show identity layer for others' fragments ~70% of the time,
        // but never on consecutive fragments by the same author.
        showIdentityLayer: !isOwn && hash % 10 > 2 && (fi === 0 || group.items[fi - 1]?.author_id !== c.author_id),
      }
    }),
  }))

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* Scroll + glow when returning from contribute */}
      <TimelineHighlight active={!!highlightLast} />

      {/* Timeline — left-padded for the continuity line */}
      <div className="relative pl-6">

        {/* Continuous vertical line — very soft, fades out at top and bottom */}
        <div
          className="absolute left-[11px] top-0 bottom-24 w-px pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.05) 12%, rgba(0,0,0,0.05) 78%, transparent 100%)',
          }}
        />

        {groups.map((group, gi) => (
          <div key={group.label} className={`relative ${gi > 0 ? 'mt-24' : ''}`}>

            {/* Chapter label — emotional, lowercase italic */}
            <p className="text-[13px] italic text-muted-foreground/45 mb-10 leading-none">
              {group.label.toLowerCase()}
            </p>

            {/* Fragments — read like diary paragraphs */}
            <div className="space-y-16">
              {group.items.map((c) => (
                <div
                  key={c.id}
                  id={c.isLast ? 'fragment-latest' : undefined}
                  data-fade-in
                  className="relative"
                >
                  <div className="space-y-3">

                    {/* Micro byline for others — who + when */}
                    {!c.isOwn && (
                      <p className="text-[11px] text-muted-foreground/45 leading-none">
                        {c.authorFirstName} · {formatFragmentDate(c.created_at)}
                      </p>
                    )}

                    {/* Own fragment: just the date */}
                    {c.isOwn && (
                      <p className="text-[11px] text-muted-foreground/35 leading-none">
                        {formatFragmentDate(c.created_at)}
                      </p>
                    )}

                    {/* Photo — borderless, no card, just the image */}
                    {c.content_type === 'photo' && c.media_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.media_url}
                        alt={c.caption ?? ''}
                        className="w-full rounded-xl object-cover"
                        style={{ maxHeight: '320px' }}
                        loading="lazy"
                        draggable={false}
                      />
                    )}

                    {/* Caption — as prose under the photo */}
                    {c.content_type === 'photo' && c.caption && (
                      <p className="text-[15px] leading-relaxed text-foreground/60 whitespace-pre-wrap">
                        {c.caption}
                      </p>
                    )}

                    {/* Text contribution — reads as diary paragraph */}
                    {c.content_type === 'text' && c.text_content && (
                      <p className="text-[16px] leading-[1.7] text-foreground/82 whitespace-pre-wrap">
                        {c.text_content}
                      </p>
                    )}

                    {/* Note contribution — softer italic, no box */}
                    {c.content_type === 'note' && c.text_content && (
                      <p className="text-[15px] leading-relaxed text-foreground/60 whitespace-pre-wrap italic">
                        {c.text_content}
                      </p>
                    )}

                  </div>
                </div>
              ))}
            </div>

          </div>
        ))}

      </div>

      {/* ── Closing chapter — "E poi?" — soft fade-in, no hard border ── */}
      <div
        data-fade-in
        className="mt-32 pt-20 text-center relative"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.015) 100%)',
        }}
      >
        <p className="text-[20px] font-semibold text-foreground/78 leading-tight">
          E poi?
        </p>
        <p className="text-[15px] text-muted-foreground/55 leading-relaxed mt-3">
          Questo momento può continuare a vivere
        </p>
        <p className="text-[12px] text-muted-foreground/35 leading-relaxed mt-7 max-w-[280px] mx-auto">
          Ogni ricordo cresce quando qualcuno aggiunge qualcosa
        </p>
        <Link
          href={`/memories/${memoryId}/contribute`}
          className="inline-flex items-center mt-9 rounded-full bg-foreground text-background px-7 py-3.5 text-sm font-medium hover:bg-foreground/90 active:scale-[0.99] transition-all"
        >
          Continua questo momento
        </Link>
      </div>

    </div>
  )
}

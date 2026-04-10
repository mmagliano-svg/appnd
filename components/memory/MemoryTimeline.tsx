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
      <div className="py-16 text-center space-y-3">
        <p className="text-3xl text-muted-foreground/[0.10] select-none">◯</p>
        <p className="text-sm text-muted-foreground/40">È ancora tutto qui</p>
        <p className="text-xs text-muted-foreground/28 max-w-[200px] mx-auto leading-relaxed">
          Ma potrebbe non restare così
        </p>
        <Link
          href={`/memories/${memoryId}/contribute`}
          className="inline-block mt-3 text-xs text-muted-foreground/40 hover:text-foreground border border-border/30 rounded-full px-4 py-2 transition-colors hover:border-foreground/20"
        >
          Aggiungi il primo dettaglio
        </Link>
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
    <div className="mt-12">

      {/* Scroll + glow when returning from contribute */}
      <TimelineHighlight active={!!highlightLast} />

      {/* Section header */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/32">
          Questo momento nel tempo
        </p>
        <p className="text-[11px] text-muted-foreground/20 mt-1.5">
          {isMultiPerspective
            ? 'Ognuno lo ricorda a modo suo'
            : 'Ogni dettaglio aggiunge qualcosa'}
        </p>
      </div>

      {/* ── Perspective summary (multi-perspective only) ── */}
      {isMultiPerspective && (
        <div className="mb-10 rounded-2xl bg-foreground/[0.03] px-4 py-4">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/32 mb-0.5">
            Lo avete vissuto così
          </p>
          <p className="text-[10px] text-muted-foreground/50 leading-tight mb-3.5">
            Ognuno a modo suo
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            {uniqueContributors.map(({ authorId, firstName: fn }) => (
              <span key={authorId} className="text-[11px] text-foreground/45">{fn}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Single contributor hint (social nudge) ── */}
      {singleContributorWithOthers && (
        <div className="mb-10 text-center space-y-1.5">
          <p className="text-xs text-muted-foreground/35">
            Solo tu hai aggiunto qualcosa
          </p>
          <p className="text-[11px] text-muted-foreground/22">
            Chiedi anche agli altri
          </p>
        </div>
      )}

      {/* Timeline — pl-6 (24px) positions content; line+dots center at ~12px */}
      <div className="relative pl-6">

        {/* Continuous vertical line — fades out toward the bottom */}
        <div
          className="absolute left-[11px] top-2 bottom-16 w-px pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.07) 0%, rgba(0,0,0,0.07) 70%, transparent 100%)',
          }}
        />

        {groups.map((group, gi) => (
          <div key={group.label} className={`relative ${gi > 0 ? 'mt-24' : ''}`}>

            {/* Group label */}
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/32 mb-8 leading-none">
              {group.label}
            </p>

            {/* Fragments */}
            <div className="space-y-14">
              {group.items.map((c) => (
                <div
                  key={c.id}
                  id={c.isLast ? 'fragment-latest' : undefined}
                  data-fade-in
                  className={`relative${c.variant === 'spacious' ? ' mt-3' : ''}`}
                >
                  {/* Content wrapper — all fragments share the same light treatment */}
                  <div className="space-y-2.5">

                    {/* Others: first name header only */}
                    {!c.isOwn && (
                      <span className="text-[11px] font-medium text-foreground/40 leading-none">
                        {c.authorFirstName}
                      </span>
                    )}

                    {/* Origin mark — first fragment only */}
                    {c.isFirst && (
                      <p className="text-[9px] text-muted-foreground/22 uppercase tracking-[0.16em] leading-none">
                        Da qui è iniziato
                      </p>
                    )}

                    {/* Micro-label — first of each group (personalized) */}
                    {c.microLabel && (
                      <p className="text-[9px] text-muted-foreground/25 uppercase tracking-[0.14em] leading-none">
                        {c.microLabel}
                      </p>
                    )}

                    {/* Date line — no name (identity is in header/layer) */}
                    <p className="text-[10px] text-muted-foreground/28 leading-none">
                      {formatFragmentDate(c.created_at)}
                    </p>

                    {/* Photo */}
                    {c.content_type === 'photo' && c.media_url && (
                      <div className="rounded-2xl overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.media_url}
                          alt={c.caption ?? ''}
                          className="w-full object-cover"
                          style={{ maxHeight: '280px' }}
                          loading="lazy"
                          draggable={false}
                        />
                      </div>
                    )}

                    {/* Caption */}
                    {c.content_type === 'photo' && c.caption && (
                      <p className="text-sm leading-relaxed text-foreground/58 whitespace-pre-wrap italic">
                        {c.caption}
                      </p>
                    )}

                    {/* Text contribution */}
                    {c.content_type === 'text' && c.text_content && (
                      <p className="text-base leading-relaxed text-foreground/80 whitespace-pre-wrap">
                        {c.text_content}
                      </p>
                    )}

                    {/* Note contribution */}
                    {c.content_type === 'note' && c.text_content && (
                      <div className="rounded-xl bg-muted/20 px-4 py-3">
                        <p className="text-sm leading-relaxed text-foreground/65 whitespace-pre-wrap italic">
                          {c.text_content}
                        </p>
                      </div>
                    )}

                    {/* Identity layer — others only, ~70% of time */}
                    {c.showIdentityLayer && (
                      <p className="text-[9px] text-muted-foreground/20 leading-none mt-1">
                        {getIdentityLine(c.authorFirstName, idHash(c.id))}
                      </p>
                    )}

                    {/* Continue action */}
                    <Link
                      href={`/memories/${memoryId}/contribute`}
                      className="inline-block text-[10px] text-muted-foreground/20 hover:text-muted-foreground/50 transition-colors mt-0.5"
                    >
                      Continua da qui
                    </Link>

                  </div>
                </div>
              ))}
            </div>

          </div>
        ))}

      </div>

      {/* ── Closing chapter — "E poi?" ── */}
      <div className="mt-28 pt-16 border-t border-border/[0.07] text-center">
        <p className="text-lg font-semibold text-foreground/80 leading-tight">
          E poi?
        </p>
        <p className="text-sm text-muted-foreground/50 leading-relaxed mt-2">
          Questo momento può continuare a vivere
        </p>
        <p className="text-[11px] text-muted-foreground/30 leading-relaxed mt-6 max-w-[260px] mx-auto">
          Ogni ricordo cresce quando qualcuno aggiunge qualcosa
        </p>
        <Link
          href={`/memories/${memoryId}/contribute`}
          className="inline-flex items-center mt-7 rounded-2xl bg-foreground text-background px-6 py-3.5 text-sm font-medium hover:bg-foreground/90 active:scale-[0.99] transition-all"
        >
          Continua questo momento
        </Link>
      </div>

    </div>
  )
}

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
  users?: { display_name?: string | null; email?: string | null } | null
}

interface MemoryTimelineProps {
  contributions: TimelineFragment[]
  happenedAt: string
  heroContributionId: string | null
  userId: string | null
  memoryId: string
  highlightLast?: boolean
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

function getMicroLabel(
  isAbsoluteFirst: boolean,
  isFirstOfGroup: boolean,
  diffDays: number,
): string | null {
  if (isAbsoluteFirst) return 'Hai iniziato questo momento'
  if (!isFirstOfGroup) return null
  if (diffDays > 180)  return 'Lo hai rivissuto'
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

// ── Component ─────────────────────────────────────────────────────────────

export function MemoryTimeline({
  contributions,
  happenedAt,
  heroContributionId,
  userId,
  memoryId,
  highlightLast,
}: MemoryTimelineProps) {
  const visible = contributions.filter(
    (c) =>
      c.id !== heroContributionId &&
      (c.content_type === 'photo' ||
        c.content_type === 'text' ||
        c.content_type === 'note'),
  )

  // ── Empty state ──────────────────────────────────────────────────────────
  if (visible.length === 0) {
    return (
      <div className="py-14 text-center space-y-2.5">
        <p className="text-3xl text-muted-foreground/[0.12] select-none">◯</p>
        <p className="text-sm text-muted-foreground/45">È ancora tutto qui</p>
        <p className="text-xs text-muted-foreground/30 max-w-[200px] mx-auto leading-relaxed">
          Ma potrebbe non restare così
        </p>
        <Link
          href={`/memories/${memoryId}/contribute`}
          className="inline-block mt-2 text-xs text-muted-foreground/45 hover:text-foreground border border-border/35 rounded-full px-4 py-2 transition-colors hover:border-foreground/20"
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

  // Pre-compute micro-labels and last-fragment marker
  const lastVisibleId = visible[visible.length - 1].id

  type ProcessedFragment = TimelineFragment & {
    microLabel: string | null
    isLast: boolean
  }

  const groups = rawGroups.map((group, gi) => ({
    label: group.label,
    items: group.items.map((c, fi): ProcessedFragment => ({
      ...c,
      microLabel: getMicroLabel(
        gi === 0 && fi === 0,
        fi === 0,
        getDiffDays(c.created_at, happenedAt),
      ),
      isLast: c.id === lastVisibleId,
    })),
  }))

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mt-10">

      {/* Scroll + glow when returning from contribute */}
      <TimelineHighlight active={!!highlightLast} />

      {/* Section header */}
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/35">
          Questo momento nel tempo
        </p>
        <p className="text-[11px] text-muted-foreground/22 mt-1">
          Ogni dettaglio aggiunge qualcosa
        </p>
      </div>

      {/* Timeline — pl-6 (24px) positions content; line+dots center at ~12px */}
      <div className="relative pl-6">

        {/* Continuous vertical line */}
        <div className="absolute left-[11px] top-2 bottom-12 w-px bg-foreground/[0.07] pointer-events-none" />

        {groups.map((group, gi) => (
          <div key={group.label} className={`relative ${gi > 0 ? 'mt-16' : ''}`}>

            {/* Group marker — open circle */}
            <div className="absolute left-[6px] top-[3px] w-3 h-3 rounded-full bg-background border-[1.5px] border-foreground/[0.22] pointer-events-none" />

            {/* Group label */}
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground/35 mb-7 leading-none">
              {group.label}
            </p>

            {/* Fragments */}
            <div className="space-y-9">
              {group.items.map((c) => {
                const authorName =
                  c.users?.display_name ?? c.users?.email ?? 'Anonimo'
                const isOwn = c.author_id === userId

                return (
                  <div
                    key={c.id}
                    id={c.isLast ? 'fragment-latest' : undefined}
                    data-fade-in
                    className="relative"
                  >
                    {/* Fragment dot — small, filled */}
                    <div className="absolute left-[8px] top-[9px] w-2 h-2 rounded-full bg-foreground/[0.18] ring-[2px] ring-background pointer-events-none" />

                    <div className="space-y-2">

                      {/* Micro-label (first of group only, very subtle) */}
                      {c.microLabel && (
                        <p className="text-[9px] text-muted-foreground/28 uppercase tracking-[0.14em] leading-none">
                          {c.microLabel}
                        </p>
                      )}

                      {/* Author (if not own) + date */}
                      <div className="flex items-center gap-2">
                        {!isOwn && (
                          <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center text-[8px] font-bold text-background shrink-0">
                            {initials(authorName)}
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground/30 leading-none">
                          {!isOwn ? `${authorName} · ` : ''}
                          {formatFragmentDate(c.created_at)}
                        </p>
                      </div>

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
                        <p className="text-sm leading-relaxed text-foreground/60 whitespace-pre-wrap italic">
                          {c.caption}
                        </p>
                      )}

                      {/* Text contribution */}
                      {c.content_type === 'text' && c.text_content && (
                        <p className="text-base leading-relaxed text-foreground/82 whitespace-pre-wrap">
                          {c.text_content}
                        </p>
                      )}

                      {/* Note contribution */}
                      {c.content_type === 'note' && c.text_content && (
                        <div className="rounded-xl bg-muted/35 px-4 py-3">
                          <p className="text-sm leading-relaxed text-foreground/70 whitespace-pre-wrap italic">
                            {c.text_content}
                          </p>
                        </div>
                      )}

                      {/* Subtle per-fragment continue action */}
                      <Link
                        href={`/memories/${memoryId}/contribute`}
                        className="inline-block text-[10px] text-muted-foreground/22 hover:text-muted-foreground/55 transition-colors mt-0.5"
                      >
                        Continua da qui →
                      </Link>

                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        ))}

      </div>

      {/* ── End of timeline — natural continuation loop ── */}
      <div className="mt-14 pt-8 border-t border-border/10 text-center space-y-2">
        <p className="text-base font-medium text-foreground/75">E poi?</p>
        <p className="text-sm text-muted-foreground/40">Cosa è successo dopo?</p>
        <Link
          href={`/memories/${memoryId}/contribute`}
          className="inline-flex items-center mt-3 rounded-2xl bg-foreground text-background px-5 py-3 text-sm font-medium hover:bg-foreground/90 active:scale-[0.99] transition-all"
        >
          Aggiungi cosa è successo
        </Link>
      </div>

    </div>
  )
}

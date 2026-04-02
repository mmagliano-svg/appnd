import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getPersonDetail, getClaimablePerson, type RelationshipType } from '@/actions/persons'
import { getSharedMemoriesWithUser } from '@/actions/people'
import { getSharedMemoriesForPerson } from '@/actions/shared-memories'
import { getCategoryByValue } from '@/lib/constants/categories'
import { dayMonthFromDate, dayMonthFromBirthDate, formatBirthDate } from '@/lib/utils/anchors'
import { ClaimPersonButton } from '@/components/people/ClaimPersonButton'

const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  family:       'Famiglia',
  partner:      'Partner',
  child:        'Figlio/a',
  parent:       'Padre/Madre',
  sibling:      'Fratello/Sorella',
  friend:       'Amico/a',
  colleague:    'Collega',
  acquaintance: 'Conoscente',
  other:        'Altro',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function formatYear(d: string) { return new Date(d).getFullYear() }

function formatDayMonth(d: string) {
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
}

function formatFirstDate(d: string) {
  return new Date(d).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
}

/**
 * SPEC §2 — Dynamic insight sentence shown once in hero.
 * Returns null if no strong signal (prefer silence over generic copy).
 */
function personPageInsight(totalCount: number, yearsSpan: number, lastYear: number): string | null {
  const currentYear = new Date().getFullYear()
  if (totalCount >= 8)                             return 'La persona con cui passi più tempo'
  if (totalCount >= 5 && lastYear === currentYear) return 'Con te spesso negli ultimi tempi'
  if (yearsSpan >= 3)                              return 'Una presenza costante nella tua storia'
  if (totalCount >= 3)                             return 'Torna spesso nella tua storia'
  return null
}

/**
 * SPEC §1 — Shared-location insight label (in person page locations list).
 * Replaces raw counts with meaning.
 */
function sharedLocationInsight(count: number): string {
  if (count >= 4) return 'Dove siete stati più volte'
  if (count >= 3) return 'Un posto che torna'
  if (count >= 2) return 'Ci siete stati insieme'
  return 'Una volta'
}

/**
 * SPEC §3 — Birthday insight label.
 */
function birthdayInsight(count: number): string {
  if (count >= 3) return 'Ci sei sempre'
  if (count >= 2) return 'Torna ogni anno'
  return 'Un appuntamento fisso'
}

/** Wraps how_we_met in a natural Italian phrase unless user already wrote one. */
function narrativeHowWeMet(text: string): string {
  const t = text.trim()
  const l = t.toLowerCase()
  if (
    l.startsWith('vi siete') || l.startsWith('ci siamo') ||
    l.startsWith('siamo') || l.startsWith('abbiamo') ||
    l.startsWith('ci conosciamo') || l.startsWith('vi conoscete')
  ) return t
  return 'Vi siete conosciuti ' + t.charAt(0).toLowerCase() + t.slice(1)
}

/** Wraps shared_context in a natural Italian phrase unless user already wrote one. */
function narrativeSharedContext(text: string): string {
  const t = text.trim()
  const l = t.toLowerCase()
  if (
    l.startsWith('vi unisce') || l.startsWith('vi uniscono') ||
    l.startsWith('condividete') || l.startsWith('avete in comune')
  ) return t
  return 'Vi unisce ' + t.charAt(0).toLowerCase() + t.slice(1)
}

// ── Shared UI ──────────────────────────────────────────────────────────────

function BackButton() {
  return (
    <Link
      href="/people"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
      </svg>
      Persone
    </Link>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-bold text-foreground mb-4">{children}</h2>
  )
}

function MemoryRow({ memory }: {
  memory: { id: string; title: string; start_date: string; location_name: string | null; category: string | null; previewUrl?: string | null; sharingStatus?: 'private' | 'shared' }
}) {
  const catInfo = getCategoryByValue(memory.category)
  return (
    <Link
      href={`/memories/${memory.id}`}
      className="flex gap-3 rounded-2xl bg-muted/30 border border-border/40 hover:border-foreground/15 hover:bg-muted/50 transition-all group active:scale-[0.99] overflow-hidden"
    >
      <div className="w-24 shrink-0 self-stretch bg-muted overflow-hidden rounded-l-2xl">
        {memory.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={memory.previewUrl} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" loading="lazy" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 py-3.5 pr-4 min-w-0">
        {catInfo && <p className="text-xs text-muted-foreground mb-1">{catInfo.emoji} {catInfo.label}</p>}
        <p className="font-semibold text-sm leading-snug line-clamp-2 mb-1">{memory.title}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{formatDayMonth(memory.start_date)}</span>
          {memory.location_name && (
            <><span className="text-border">·</span><span className="truncate">{memory.location_name}</span></>
          )}
        </div>
        {memory.sharingStatus === 'shared' && (
          <p className="text-[10px] text-muted-foreground/40 mt-1">♡ storia condivisa</p>
        )}
      </div>
    </Link>
  )
}

function TimelineByYear<T extends { id: string; start_date: string }>({
  items,
  renderItem,
  emptyNote,
}: {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  emptyNote: string
}) {
  const byYear: Record<number, T[]> = {}
  for (const item of items) {
    const y = formatYear(item.start_date)
    if (!byYear[y]) byYear[y] = []
    byYear[y].push(item)
  }
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b)

  if (items.length === 0) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-4xl">🌱</p>
        <p className="text-sm text-muted-foreground">{emptyNote}</p>
        <Link href="/memories/new" className="inline-flex items-center gap-2 mt-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium">
          Crea un ricordo
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {years.map((year) => (
        <div key={year}>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">{year}</span>
            <div className="flex-1 border-t border-border/40" />
          </div>
          <div className="space-y-3">
            {byYear[year].map((item) => renderItem(item))}
          </div>
        </div>
      ))}
      <div className="text-center pt-4 pb-2">
        <p className="text-xs text-muted-foreground/40 italic">
          {items.length === 1 ? 'Un momento insieme.' : `${items.length} momenti scritti insieme.`}
        </p>
      </div>
    </div>
  )
}

// ── Person entity view (people table) ─────────────────────────────────────

async function PersonEntityView({ id }: { id: string }) {
  const person = await getPersonDetail(id)
  if (!person) return null

  const sharedMoments = await getSharedMemoriesForPerson(id)

  const ini = initials(person.name)
  const sorted = person.memories  // ascending by start_date

  // Hero memory: most recent with photo, fallback to most recent
  const heroMemory =
    [...sorted].reverse().find((m) => m.previewUrl) ??
    (sorted.length > 0 ? sorted[sorted.length - 1] : null)

  // Derive shared locations from memories
  const locationMap = new Map<string, number>()
  for (const m of sorted) {
    if (m.location_name) {
      locationMap.set(m.location_name, (locationMap.get(m.location_name) ?? 0) + 1)
    }
  }
  const locations = Array.from(locationMap.entries()).sort((a, b) => b[1] - a[1])

  // Compact relationship summary line
  const summaryParts: string[] = []
  if (person.stats.totalCount > 0)
    summaryParts.push(`${person.stats.totalCount} moment${person.stats.totalCount === 1 ? 'o' : 'i'}`)
  if (locations.length > 0)
    summaryParts.push(`${locations.length} luogh${locations.length === 1 ? 'o' : 'i'}`)
  if (person.stats.firstDate)
    summaryParts.push(`insieme dal ${formatFirstDate(person.stats.firstDate)}`)

  const hasLegame = !!(person.howWeMet || person.sharedContext || person.groups.length > 0)
  const fullName = [person.firstName, person.lastName].filter(Boolean).join(' ')

  // Dynamic insight — computed once, shown in hero
  const heroLastYear  = sorted.length > 0 ? new Date(sorted[sorted.length - 1].start_date).getFullYear() : 0
  const heroFirstYear = sorted.length > 0 ? new Date(sorted[0].start_date).getFullYear() : heroLastYear
  const heroYearsSpan = heroLastYear && heroFirstYear ? heroLastYear - heroFirstYear : 0
  const heroInsight   = personPageInsight(person.stats.totalCount, heroYearsSpan, heroLastYear)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-28">

        {/* ── Top bar ── */}
        <div className="px-4 pt-6 pb-2 flex items-center justify-between">
          <BackButton />
          <Link
            href={`/people/${id}/edit`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Modifica
          </Link>
        </div>

        {/* ══ SECTION 1 — HERO / IDENTITÀ ══════════════════════════════════ */}
        <div className="px-4 pt-6 pb-10 flex flex-col items-center text-center">

          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-foreground flex items-center justify-center overflow-hidden mb-5 shrink-0">
            {person.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.avatarUrl} alt={person.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold tracking-tight text-background">{ini}</span>
            )}
          </div>

          {/* Eyebrow */}
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
            La tua storia con
          </p>

          {/* Name */}
          <h1 className="text-3xl font-bold tracking-tight leading-tight mb-1">{person.name}</h1>

          {/* Full name — if set and different from display name */}
          {fullName && fullName.toLowerCase() !== person.name.toLowerCase() && (
            <p className="text-sm text-muted-foreground/60 mb-1">{fullName}</p>
          )}

          {/* Nicknames */}
          {person.nicknames.length > 0 && (
            <p className="text-xs text-muted-foreground/40 italic mb-2">
              {person.nicknames.map((n) => `"${n}"`).join(' · ')}
            </p>
          )}

          {/* Relationship type pill */}
          {person.relationshipType && (
            <span className="inline-block rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground mb-2">
              {RELATIONSHIP_LABELS[person.relationshipType]}
            </span>
          )}

          {/* Relation label */}
          {person.relationLabel && (
            <p className="text-sm text-muted-foreground mb-1">{person.relationLabel}</p>
          )}

          {/* Short bio */}
          {person.shortBio && (
            <p className="text-sm text-foreground/70 leading-relaxed max-w-xs mt-1">{person.shortBio}</p>
          )}

          {/* Compact relationship summary */}
          {summaryParts.length > 0 && (
            <p className="text-xs text-muted-foreground/40 mt-5 tracking-wide">
              {summaryParts.join(' · ')}
            </p>
          )}

          {/* Dynamic insight — shown only when signal is strong enough */}
          {heroInsight && (
            <p className="text-xs text-muted-foreground/55 italic mt-2">
              {heroInsight}
            </p>
          )}

          {/* Membership badge */}
          {person.status === 'active' && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">✓ Attivo su Appnd</p>
          )}
          {person.status === 'invited' && person.claimStatus !== 'claimed' && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Invitato su Appnd</p>
          )}

          {/* Claim button — shown when person is not yet linked to any account */}
          {person.claimStatus !== 'claimed' && !person.linkedUserId && (
            <ClaimPersonButton
              personId={person.id}
              personName={person.name}
              hasNicknames={person.nicknames.length > 0}
              hasBirthYear={
                person.birthDate !== null &&
                person.birthDate.length === 10 // YYYY-MM-DD
              }
            />
          )}
        </div>

        {/* ══ SECTION 2 — IL VOSTRO LEGAME ══════════════════════════════════ */}
        {hasLegame && (
          <div className="px-4 pb-10">
            <div className="border-t border-border/30 mb-6" />
            <SectionTitle>Il vostro legame</SectionTitle>
            <div className="space-y-2">
              {person.howWeMet && (
                <p className="text-sm leading-relaxed text-foreground/75">
                  {narrativeHowWeMet(person.howWeMet)}
                </p>
              )}
              {person.sharedContext && (
                <p className="text-sm leading-relaxed text-foreground/75">
                  {narrativeSharedContext(person.sharedContext)}
                </p>
              )}
              {person.groups.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {person.groups.map((g) => (
                    <span
                      key={g.id}
                      className="rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ SECTION 3 — LUOGHI ════════════════════════════════════════════ */}
        {locations.length > 0 && (
          <div className="px-4 pb-10">
            <div className="border-t border-border/30 mb-6" />
            <SectionTitle>Luoghi della vostra storia</SectionTitle>
            <div className="space-y-2.5">
              {locations.map(([loc, count]) => (
                <div key={loc} className="flex items-center justify-between gap-4">
                  <span className="text-sm leading-snug">{loc}</span>
                  <span className="text-[10px] text-muted-foreground/50 shrink-0">
                    {sharedLocationInsight(count)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ SECTION 4 — MOMENTI IMPORTANTI ══════════════════════════════ */}
        {person.birthDate && (() => {
          const birthMmDd = dayMonthFromBirthDate(person.birthDate!)
          const birthdayCount = birthMmDd
            ? person.memories.filter((m) => dayMonthFromDate(m.start_date) === birthMmDd).length
            : 0
          return (
            <div className="px-4 pb-10">
              <div className="border-t border-border/30 mb-6" />
              <SectionTitle>Momenti importanti</SectionTitle>
              <Link
                href={`/people/${id}/momenti/compleanno`}
                className="flex items-center justify-between min-h-[44px] py-1 group"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-sm select-none" aria-hidden>🎂</span>
                  <div>
                    <p className="text-sm font-medium">
                      Compleanno · {formatBirthDate(person.birthDate!)}
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-0.5">
                      {birthdayInsight(birthdayCount)}
                    </p>
                  </div>
                </div>
                <svg
                  className="w-4 h-4 text-muted-foreground/20 group-hover:text-muted-foreground/45 transition-colors shrink-0"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            </div>
          )
        })()}

        {/* ══ SECTION 5 — LA VOSTRA STORIA ══════════════════════════════════ */}
        <div className="px-4">
          <div className="border-t border-border/30 mb-6" />

          {/* Hero memory — emotional anchor */}
          {heroMemory && (
            <div className="mb-10">
              <p className="text-xs text-muted-foreground/50 uppercase tracking-widest mb-3">
                Il momento più recente
              </p>
              <Link
                href={`/memories/${heroMemory.id}`}
                className="block rounded-2xl overflow-hidden border border-border/40 hover:border-foreground/20 active:scale-[0.99] transition-all group"
              >
                {heroMemory.previewUrl && (
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={heroMemory.previewUrl}
                      alt={heroMemory.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="eager"
                      draggable={false}
                    />
                  </div>
                )}
                <div className="px-4 py-3.5">
                  <p className="font-semibold text-sm leading-snug line-clamp-2 mb-1">{heroMemory.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDayMonth(heroMemory.start_date)}</span>
                    {heroMemory.location_name && (
                      <><span className="text-border">·</span><span className="truncate">{heroMemory.location_name}</span></>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Timeline */}
          <SectionTitle>I vostri momenti insieme</SectionTitle>
          <TimelineByYear
            items={sorted}
            renderItem={(m) => <MemoryRow key={m.id} memory={m} />}
            emptyNote={`Ancora nessun ricordo con ${person.name}. Crea un momento e aggiungilo nella sezione "Con chi eri?".`}
          />
        </div>

        {/* ══ SECTION 6 — MOMENTI CONDIVISI ════════════════════════════════ */}
        {sharedMoments.length > 0 && (
          <div className="px-4 pt-2 pb-10">
            <div className="border-t border-border/30 mb-6" />
            <SectionTitle>Momenti condivisi</SectionTitle>
            <div className="space-y-3">
              {sharedMoments.map((sm) => (
                <Link
                  key={sm.id}
                  href={`/shared/${sm.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-muted/30 border border-border/40 hover:border-foreground/15 hover:bg-muted/50 px-4 py-3.5 transition-all group active:scale-[0.99]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug line-clamp-1">{sm.title}</p>
                    <p className="text-xs text-muted-foreground/55 mt-0.5">
                      {formatDayMonth(sm.start_date)}
                      {sm.contribution_count > 0 && (
                        <span className="ml-2 text-muted-foreground/40">
                          · {sm.contribution_count} version{sm.contribution_count === 1 ? 'e' : 'i'}
                        </span>
                      )}
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 text-muted-foreground/20 group-hover:text-muted-foreground/45 transition-colors shrink-0"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  )
}

// ── Registered user view (NOI — fallback) ─────────────────────────────────

async function RegisteredUserView({ userId, currentUserId }: { userId: string; currentUserId: string }) {
  if (userId === currentUserId) return null
  const result = await getSharedMemoriesWithUser(userId)
  if (!result) return null

  const { otherUser, memories, stats } = result
  const ini = initials(otherUser.displayName)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-28">

        <div className="px-4 pt-6 pb-2">
          <BackButton />
        </div>

        {/* Hero */}
        <div className="px-4 pt-6 pb-10 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-foreground flex items-center justify-center shrink-0 mb-5">
            <span className="text-3xl font-bold tracking-tight text-background">{ini}</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">La tua storia con</p>
          <h1 className="text-3xl font-bold tracking-tight leading-tight mb-4">{otherUser.displayName}</h1>

          {memories.length > 0 && (
            <p className="text-xs text-muted-foreground/40 tracking-wide">
              {[
                `${stats.totalCount} moment${stats.totalCount === 1 ? 'o' : 'i'}`,
                stats.uniqueLocations > 0 ? `${stats.uniqueLocations} luogh${stats.uniqueLocations === 1 ? 'o' : 'i'}` : null,
                stats.firstDate ? `insieme dal ${formatFirstDate(stats.firstDate)}` : null,
              ].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {stats.allPhotos.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-2 px-4 mb-8" style={{ scrollbarWidth: 'none' }}>
            {stats.allPhotos.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover" loading="lazy" draggable={false} />
            ))}
          </div>
        )}

        <div className="px-4">
          <div className="border-t border-border/30 mb-6" />
          <SectionTitle>I vostri momenti</SectionTitle>
          <TimelineByYear
            items={memories}
            renderItem={(m) => <MemoryRow key={m.id} memory={m} />}
            emptyNote={`Ancora nessun ricordo con ${otherUser.displayName}.`}
          />
        </div>

      </div>
    </main>
  )
}

// ── Non-owner claim view ───────────────────────────────────────────────────

/**
 * Shown when the current user is NOT the owner of the person record
 * but the person is unclaimed and they want to say "this is me".
 */
async function ClaimablePersonView({ personId }: { personId: string }) {
  const person = await getClaimablePerson(personId)
  if (!person) return null

  const ini = person.name.trim().split(/\s+/).length >= 2
    ? (person.name.trim().split(/\s+/)[0][0] + person.name.trim().split(/\s+/)[1][0]).toUpperCase()
    : person.name.slice(0, 2).toUpperCase()

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-28">

        <div className="pt-6 pb-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
        </div>

        <div className="pt-12 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-foreground flex items-center justify-center mb-6">
            <span className="text-3xl font-bold text-background">{ini}</span>
          </div>

          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">
            Profilo non collegato
          </p>
          <h1 className="text-3xl font-bold tracking-tight mb-3">{person.name}</h1>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-8">
            Questo profilo non è ancora collegato a un account Appnd.
            Se sei {person.name}, puoi collegare il tuo account adesso.
          </p>

          <ClaimPersonButton
            personId={person.id}
            personName={person.name}
            hasNicknames={person.hasNicknames}
            hasBirthYear={person.hasBirthYear}
          />
        </div>

      </div>
    </main>
  )
}

// ── Router ─────────────────────────────────────────────────────────────────

export default async function PersonPage({ params }: { params: { personId: string } }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // 1. Owner's full entity view
  const personView = await PersonEntityView({ id: params.personId })
  if (personView) return personView

  // 2. Registered user — shared memories (NOI view)
  const userView = await RegisteredUserView({ userId: params.personId, currentUserId: user.id })
  if (userView) return userView

  // 3. Non-owner — claimable ghost person
  const claimView = await ClaimablePersonView({ personId: params.personId })
  if (claimView) return claimView

  notFound()
}

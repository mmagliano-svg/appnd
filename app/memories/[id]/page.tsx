import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { DeleteButton } from '@/components/memory/DeleteButton'
import { getCategoryByValue } from '@/lib/constants/categories'
import { formatMemoryDateFull, formatMemoryDate, formatPeriodDisplay } from '@/lib/utils/dates'
import { getMessages } from '@/actions/messages'
import { getLikeState } from '@/actions/likes'
import { MemoryChat } from '@/components/memory/MemoryChat'
import { MemoryActions } from '@/components/memory/MemoryActions'
import { RemoveParticipantButton } from '@/components/memory/RemoveParticipantButton'
import { ScrollToTop } from '@/components/memory/ScrollToTop'

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default async function MemoryPage({ params, searchParams }: { params: { id: string }; searchParams: { contributed?: string } }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: memory } = await supabase
    .from('memories')
    .select(`
      *,
      memory_participants (
        id,
        user_id,
        invited_email,
        joined_at,
        users ( id, display_name, email )
      ),
      memory_contributions (
        id,
        content_type,
        text_content,
        media_url,
        caption,
        created_at,
        author_id,
        users ( id, display_name, email )
      )
    `)
    .eq('id', params.id)
    .single()

  if (!memory) notFound()

  const isParticipant = memory.memory_participants.some(
    (p) => p.user_id === user?.id && p.joined_at
  )
  if (!isParticipant) notFound()

  const isCreator = memory.created_by === user?.id

  const [initialMessages, initialLikes] = await Promise.all([
    getMessages(params.id),
    getLikeState(params.id),
  ])
  const contributions = [...memory.memory_contributions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const participants = memory.memory_participants.filter((p) => p.joined_at)
  const tags: string[] = (memory as { tags?: string[] }).tags ?? []
  const category = (memory as { category?: string | null }).category
  const memoryCats: string[] = (() => {
    const cats = (memory as { categories?: string[] }).categories
    if (cats?.length) return cats
    return category ? [category] : []
  })()
  const catInfo = getCategoryByValue(memoryCats[0] ?? null)
  const isFirstTime = (memory as { is_first_time?: boolean }).is_first_time ?? false
  const isAnniversary = (memory as { is_anniversary?: boolean }).is_anniversary ?? false
  const sharingStatus = (memory as { sharing_status?: string }).sharing_status ?? 'private'

  const hasOwnContribution = contributions.some((c) => c.author_id === user?.id)

  // Fetch creator name — used for contextual line shown to invited (non-creator) participants
  let creatorName: string | null = null
  if (!isCreator && sharingStatus === 'shared') {
    const { data: creatorRow } = await supabase
      .from('users')
      .select('display_name, email')
      .eq('id', memory.created_by)
      .maybeSingle()
    creatorName = creatorRow?.display_name ?? creatorRow?.email?.split('@')[0] ?? null
  }

  const memoryEndDate = (memory as { end_date?: string | null }).end_date ?? null
  const memoryStartDate = (memory as { start_date?: string }).start_date ?? memory.happened_at
  const memoryParentPeriodId = (memory as { parent_period_id?: string | null }).parent_period_id ?? null
  const isPeriod = Boolean(memoryEndDate)

  // Hero photo — first photo contribution chronologically
  const heroContribution = contributions.find(
    (c) => c.content_type === 'photo' && c.media_url
  ) ?? null
  const heroPhoto = heroContribution?.media_url ?? null

  // Fetch child events if this is a period
  const { data: childEventsData } = isPeriod
    ? await supabase
        .from('memories')
        .select('id, title, start_date, location_name, category')
        .eq('parent_period_id', memory.id)
        .is('end_date', null)
        .order('start_date', { ascending: true })
    : { data: [] }
  const childEvents = (childEventsData ?? []) as Array<{
    id: string; title: string; start_date: string; location_name: string | null; category: string | null
  }>

  // Fetch parent period if this is an event with a parent
  const parentPeriod = !isPeriod && memoryParentPeriodId
    ? await supabase
        .from('memories')
        .select('id, title, start_date, end_date')
        .eq('id', memoryParentPeriodId)
        .single()
        .then(({ data }) => data as { id: string; title: string; start_date: string; end_date: string } | null)
    : null

  // ── Period (chapter) layout ─────────────────────────────────────────────
  if (isPeriod) {
    return (
      <main className="min-h-screen bg-background">
        {/* Top bar */}
        <div className="max-w-lg mx-auto px-4 pt-6 pb-2 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
            I tuoi ricordi
          </Link>
          {isCreator && (
            <div className="flex items-center gap-1">
              <Link
                href={`/memories/${params.id}/edit`}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Modifica
              </Link>
              <DeleteButton memoryId={params.id} />
            </div>
          )}
        </div>

        <div className="max-w-lg mx-auto px-4 pb-32">

          {/* ── Chapter header ── */}
          <div className="pt-8 pb-8 border-b border-border/30">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-4">
              Capitolo
            </p>
            <h1 className="text-4xl font-bold tracking-tight leading-tight mb-4">
              {memory.title}
            </h1>
            <p className="text-xl font-semibold text-muted-foreground tabular-nums">
              {formatPeriodDisplay(memoryStartDate, memoryEndDate!)}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-7">
              <div>
                <p className="text-3xl font-bold tabular-nums leading-none">{childEvents.length}</p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  moment{childEvents.length !== 1 ? 'i' : 'o'}
                </p>
              </div>
              {memory.location_name && (
                <>
                  <div className="w-px h-10 bg-border" />
                  <div>
                    <p className="text-sm font-semibold">{memory.location_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">luogo</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Moments list ── */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                I momenti
              </p>
              <Link
                href={`/memories/new?period=${memory.id}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                + Aggiungi
              </Link>
            </div>

            {childEvents.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <p className="text-3xl">○</p>
                <p className="text-sm font-medium">Nessun momento ancora.</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Aggiungi i momenti vissuti durante questo periodo della tua vita.
                </p>
                <Link
                  href={`/memories/new?period=${memory.id}`}
                  className="inline-flex items-center gap-2 mt-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  + Aggiungi momento
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {childEvents.map((ev) => {
                  const evCat = getCategoryByValue(ev.category)
                  return (
                    <li key={ev.id}>
                      <Link
                        href={`/memories/${ev.id}`}
                        className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card hover:border-foreground/20 hover:bg-accent/20 px-4 py-3.5 transition-all group"
                      >
                        <div className="min-w-0 flex-1">
                          {evCat && (
                            <p className="text-xs text-muted-foreground mb-0.5">
                              {evCat.emoji} {evCat.label}
                            </p>
                          )}
                          <p className="text-sm font-semibold leading-snug truncate">{ev.title}</p>
                          {ev.location_name && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              📍 {ev.location_name}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground shrink-0">
                          {formatMemoryDate(ev.start_date, null)}
                        </p>
                        <svg
                          className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 transition-colors"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* ── Contributions (photos/notes) — if any ── */}
          {contributions.length > 0 && (
            <div className="pt-8 mt-8 border-t border-border/30">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-6">
                Note e foto
              </p>
              <div className="space-y-8">
                {contributions.map((c) => {
                  const authorData = (c as {
                    users?: { display_name?: string | null; email?: string | null }
                  }).users
                  const authorName = authorData?.display_name ?? authorData?.email ?? 'Anonimo'
                  const isOwn = c.author_id === user?.id
                  const ini = initials(authorName)

                  if (c.content_type === 'photo' && c.media_url) {
                    return (
                      <div key={c.id} className="-mx-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={c.media_url}
                          alt={c.caption ?? ''}
                          className="w-full object-cover"
                          style={{ maxHeight: '360px' }}
                          loading="lazy"
                          draggable={false}
                        />
                        {c.caption && (
                          <p className="px-4 pt-2 text-sm text-foreground/70 italic">{c.caption}</p>
                        )}
                        <div className="flex items-center gap-2 px-4 mt-1.5">
                          <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center text-[9px] font-bold text-background shrink-0">
                            {ini}
                          </div>
                          <span className="text-xs text-muted-foreground">{isOwn ? 'Tu' : authorName}</span>
                        </div>
                      </div>
                    )
                  }

                  if ((c.content_type === 'text' || c.content_type === 'note') && c.text_content) {
                    return (
                      <div key={c.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center text-[9px] font-bold text-background shrink-0">
                            {ini}
                          </div>
                          <span className="text-xs font-medium">{isOwn ? 'Tu' : authorName}</span>
                        </div>
                        <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap pl-8">
                          {c.text_content}
                        </p>
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <ScrollToTop />

      {/* ── Hero block ── */}
      <div className={`relative w-full ${heroPhoto ? 'aspect-[4/3] max-h-[420px]' : 'pt-14'} bg-muted overflow-hidden`}>
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhoto}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
        ) : null}

        {/* Gradient overlay (always — stronger when no photo) */}
        <div
          className="absolute inset-0"
          style={{
            background: heroPhoto
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.86) 100%)'
              : 'none',
          }}
        />

        {/* Top bar — overlaid on hero */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-6 z-10">
          <Link
            href="/dashboard"
            className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
              heroPhoto
                ? 'text-white/45 hover:text-white/80 drop-shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
            I tuoi ricordi
          </Link>
          {isCreator && (
            <div className="flex items-center gap-1">
              <Link
                href={`/memories/${params.id}/edit`}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  heroPhoto
                    ? 'text-white/40 hover:text-white/70 hover:bg-white/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                Modifica
              </Link>
              <DeleteButton memoryId={params.id} />
            </div>
          )}
        </div>

        {/* Hero caption — bottom of hero when photo exists */}
        {heroPhoto && (
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-7 z-10">
            {memoryCats.length > 0 && (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-1.5">
                {memoryCats.map((cv) => {
                  const ci = getCategoryByValue(cv)
                  return ci ? (
                    <p key={cv} className="text-xs font-semibold uppercase tracking-widest text-white/60">
                      {ci.emoji} {ci.label}
                    </p>
                  ) : null
                })}
              </div>
            )}
            <h1 className="text-2xl font-bold tracking-tight leading-tight text-white drop-shadow-sm">
              {memory.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5">
              <span className="text-xs text-white/65">
                {formatMemoryDateFull(memoryStartDate, memoryEndDate)}
              </span>
              {memory.location_name && (
                <>
                  <span className="text-white/30">·</span>
                  <span className="text-xs text-white/65">{memory.location_name}</span>
                </>
              )}
            </div>
            {/* Badges */}
            {(isFirstTime || isAnniversary || sharingStatus === 'shared') && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {isFirstTime && (
                  <span className="text-[9px] font-semibold rounded-full bg-amber-400/20 border border-amber-300/40 px-2 py-0.5 text-amber-200">
                    ✦ Prima volta
                  </span>
                )}
                {isAnniversary && (
                  <span className="text-[9px] font-semibold rounded-full bg-violet-400/20 border border-violet-300/40 px-2 py-0.5 text-violet-200">
                    ↺ Ricorrenza
                  </span>
                )}
                {sharingStatus === 'shared' && (
                  <span className="text-[9px] font-semibold rounded-full bg-white/10 border border-white/20 px-2 py-0.5 text-white/60">
                    ♡ Parte della vostra storia
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="max-w-lg mx-auto px-4 pb-32">

        {/* Success feedback after contribution */}
        {searchParams.contributed === '1' && (
          <p className="pt-4 text-xs text-muted-foreground">
            ✓ Il tuo ricordo è stato aggiunto.
          </p>
        )}

        {/* Title block — only when no hero photo */}
        {!heroPhoto && (
          <div className="pt-6 pb-6 border-b border-border/50">
            {memoryCats.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {memoryCats.map((cv) => {
                  const ci = getCategoryByValue(cv)
                  return ci ? (
                    <Link
                      key={cv}
                      href={`/dashboard?category=${ci.value}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span>{ci.emoji}</span>
                      <span className="uppercase tracking-wider">{ci.label}</span>
                    </Link>
                  ) : null
                })}
              </div>
            )}
            <div className="flex items-start gap-3">
              <h1 className="text-3xl font-bold tracking-tight leading-tight flex-1">
                {memory.title}
              </h1>
              {(isFirstTime || isAnniversary || sharingStatus === 'shared') && (
                <div className="flex flex-col gap-1 mt-1 shrink-0">
                  {isFirstTime && (
                    <span className="text-[9px] font-semibold rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400">
                      ✦ Prima volta
                    </span>
                  )}
                  {isAnniversary && (
                    <span className="text-[9px] font-semibold rounded-full bg-violet-50 border border-violet-200 px-2 py-0.5 text-violet-700 dark:bg-violet-950/40 dark:border-violet-800 dark:text-violet-400">
                      ↺ Ricorrenza
                    </span>
                  )}
                  {sharingStatus === 'shared' && (
                    <span className="text-[9px] font-semibold rounded-full bg-muted border border-border px-2 py-0.5 text-muted-foreground">
                      ♡ Parte della vostra storia
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-3">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatMemoryDateFull(memoryStartDate, memoryEndDate)}
              </span>
              {memory.location_name && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {memory.location_name}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Contextual invite line — shown to non-creators in shared memories */}
        {!isCreator && creatorName && (
          <p className="text-xs text-muted-foreground pt-4 pb-1">
            {creatorName} ha salvato questo momento con te.
          </p>
        )}


        {/* ── Description ── */}
        {memory.description && (
          <div className={`${heroPhoto ? 'pt-8' : 'pt-5'} pb-5 border-b border-border/50`}>
            <p className="text-base text-foreground/80 leading-[1.8] whitespace-pre-wrap">
              {memory.description}
            </p>
          </div>
        )}

        {/* ── Tags ── */}
        {tags.length > 0 && (
          <div className="py-4 border-b border-border/50">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="inline-flex items-center rounded-full border border-border bg-background hover:bg-accent hover:border-foreground/20 px-3 py-1.5 text-xs font-medium text-foreground/70 hover:text-foreground transition-all"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Actions (like · chat · people) — after content ── */}
        <MemoryActions
          memoryId={params.id}
          initialLikes={initialLikes}
          participantCount={participants.length}
        />

        {/* ── Parent period ── */}
        {parentPeriod && (
          <div className="py-4 border-b border-border/50">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Parte di
            </p>
            <Link
              href={`/memories/${parentPeriod.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border hover:border-foreground/20 bg-background hover:bg-accent/30 px-4 py-3 transition-all group"
            >
              <div>
                <p className="text-sm font-medium">{parentPeriod.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatPeriodDisplay(parentPeriod.start_date, parentPeriod.end_date)}
                </p>
              </div>
              <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* ── Participants ── */}
        {participants.length > 0 && (
          <div id="memory-participants" className="py-4 border-b border-border/50">
            <div className="flex items-center gap-2 flex-wrap">
              {participants.map((p) => {
                const name = p.users?.display_name ?? p.users?.email ?? p.invited_email ?? '?'
                const ini = initials(name)
                const isMe = p.user_id === user?.id
                const canRemove = isCreator && !isMe

                // Shared chip interior
                const chipInner = (
                  <>
                    <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center text-[10px] font-bold text-background">
                      {ini}
                    </div>
                    <span className="text-xs font-medium">{isMe ? 'Tu' : name}</span>
                    {canRemove && (
                      <RemoveParticipantButton
                        memoryId={params.id}
                        participantId={p.id}
                        participantName={name}
                      />
                    )}
                  </>
                )

                if (!isMe && p.user_id) {
                  return (
                    <div key={p.id} className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-secondary hover:bg-accent transition-colors">
                      <Link href={`/people/${p.user_id}`} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center text-[10px] font-bold text-background">
                          {ini}
                        </div>
                        <span className="text-xs font-medium">{name}</span>
                      </Link>
                      {canRemove && (
                        <RemoveParticipantButton
                          memoryId={params.id}
                          participantId={p.id}
                          participantName={name}
                        />
                      )}
                    </div>
                  )
                }

                return (
                  <div key={p.id} className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-secondary">
                    {chipInner}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Child events (periods only) ── */}
        {isPeriod && (
          <div className="py-5 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Momenti · {childEvents.length}
              </p>
              <Link
                href={`/memories/new?period=${memory.id}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                + Aggiungi
              </Link>
            </div>
            {childEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                Nessun momento collegato a questo periodo.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {childEvents.map((ev) => {
                  const evCat = getCategoryByValue(ev.category)
                  return (
                    <li key={ev.id}>
                      <Link
                        href={`/memories/${ev.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border hover:border-foreground/20 bg-card hover:bg-accent/30 px-4 py-3 transition-all group"
                      >
                        <div className="min-w-0">
                          {evCat && (
                            <p className="text-xs text-muted-foreground mb-0.5">
                              {evCat.emoji} {evCat.label}
                            </p>
                          )}
                          <p className="text-sm font-medium truncate">{ev.title}</p>
                          {ev.location_name && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">📍 {ev.location_name}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatMemoryDate(ev.start_date, null)}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {/* ── Contributions — narrative ── */}
        <div id="contributi" className="pt-8">

          {contributions.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <p className="text-3xl">✦</p>
              {isCreator ? (
                <>
                  <p className="text-sm text-muted-foreground/60 font-normal italic">Ancora nessun racconto.</p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Aggiungi i tuoi pensieri, foto o note su questo momento.
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Ancora nessun contributo.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {contributions.map((c) => {
                // Skip hero photo — already shown as the page hero above
                if (c.id === heroContribution?.id) return null

                const authorData = (c as {
                  users?: { display_name?: string | null; email?: string | null }
                }).users
                const authorName = authorData?.display_name ?? authorData?.email ?? 'Anonimo'
                const isOwn = c.author_id === user?.id
                const ini = initials(authorName)

                /* ── Photo contribution ── */
                if (c.content_type === 'photo' && c.media_url) {
                  return (
                    <div key={c.id} className="-mx-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.media_url}
                        alt={c.caption ?? ''}
                        className="w-full object-cover"
                        style={{ maxHeight: '480px' }}
                        loading="lazy"
                        draggable={false}
                      />
                      <div className="px-4 pt-3 flex items-start justify-between gap-3">
                        <div>
                          {c.caption && (
                            <p className="text-sm text-foreground/80 italic leading-relaxed">
                              {c.caption}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center text-[9px] font-bold text-background shrink-0">
                              {ini}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {isOwn ? 'Tu' : authorName}
                            </span>
                            <span className="text-muted-foreground/30">·</span>
                            <span className="text-xs text-muted-foreground/50">
                              {formatDateTime(c.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                }

                /* ── Text contribution — journal style ── */
                if (c.content_type === 'text' && c.text_content) {
                  return (
                    <div key={c.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-foreground flex items-center justify-center text-xs font-bold text-background shrink-0">
                          {ini}
                        </div>
                        <div>
                          <p className="text-xs font-semibold leading-none">
                            {isOwn ? 'Tu' : authorName}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatDateTime(c.created_at)}
                          </p>
                        </div>
                      </div>
                      <p className="text-base leading-relaxed text-foreground/85 whitespace-pre-wrap pl-9">
                        {c.text_content}
                      </p>
                    </div>
                  )
                }

                /* ── Note contribution — distinct bg ── */
                if (c.content_type === 'note' && c.text_content) {
                  return (
                    <div key={c.id} className="rounded-2xl bg-muted/50 border border-border/40 px-5 py-4 space-y-2.5">
                      <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap italic">
                        {c.text_content}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center text-[9px] font-bold text-background shrink-0">
                          {ini}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {isOwn ? 'Tu' : authorName}
                        </span>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-xs text-muted-foreground/50">
                          {formatDateTime(c.created_at)}
                        </span>
                      </div>
                    </div>
                  )
                }

                /* ── Fallback ── */
                return null
              })}
            </div>
          )}
        </div>

        {/* Soft nudge — no CTA, FAB handles it */}
        {contributions.length > 0 && !hasOwnContribution && (
          <div className="mt-10 text-center">
            <p className="text-xs text-muted-foreground/60 italic">E tu, come lo ricordi?</p>
          </div>
        )}

        {/* ── Chat ── */}
        <div className="mt-8">
          <MemoryChat
            memoryId={params.id}
            currentUserId={user!.id}
            initialMessages={initialMessages}
          />
        </div>

      </div>

      {/* ── FAB — floating contribute button ── */}
      <div className="fixed bottom-6 right-4 z-50 max-w-lg" style={{ right: 'max(1rem, calc((100vw - 32rem) / 2 + 1rem))' }}>
        <Link
          href={`/memories/${params.id}/contribute`}
          className="flex items-center gap-2.5 rounded-full bg-foreground text-background pl-5 pr-6 py-3.5 text-sm font-semibold shadow-xl hover:bg-foreground/90 active:scale-95 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Aggiungi la tua versione
        </Link>
      </div>

    </main>
  )
}

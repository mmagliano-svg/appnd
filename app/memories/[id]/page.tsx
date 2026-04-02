import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getCategoryByValue } from '@/lib/constants/categories'
import { formatMemoryDateFull, formatMemoryDate, formatPeriodDisplay } from '@/lib/utils/dates'
import { getMessages } from '@/actions/messages'
import { InlineContribute } from '@/components/memory/InlineContribute'
import { ScrollToTop } from '@/components/memory/ScrollToTop'
import { MemoryScrollEffects } from '@/components/memory/MemoryScrollEffects'
import { getAnchorLabel } from '@/lib/utils/anchors'
import { getSharedMemoryDetail } from '@/actions/shared-memories'
import { ShareButton } from '@/components/memory/ShareButton'
import { ImageCard } from '@/components/memory/ImageCard'
import { MoreMenu } from '@/components/memory/MoreMenu'
import { ContentActions } from '@/components/memory/ContentActions'
import { ImportanceStars } from '@/components/memory/ImportanceStars'

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

  // Tagged people from address book (memory_people → people)
  const { data: rawTaggedPeople } = await supabase
    .from('memory_people')
    .select('person_id, people(id, name, linked_user_id)')
    .eq('memory_id', params.id)

  // Memory text thread — loaded server-side, passed to ContentActions
  const rawMessages = await getMessages(params.id)
  const textThreadComments = rawMessages.map((m) => {
    const name = m.author.display_name ?? m.author.email.split('@')[0] ?? 'Anonimo'
    const isMe = m.author_id === user?.id
    return {
      id: m.id,
      authorName: isMe ? 'Tu' : name,
      authorInitials: initials(name),
      text: m.content,
    }
  })

  const dbImportance = (memory as { importance?: number | null }).importance
  const importanceLevel: number = dbImportance ?? ((isFirstTime || isAnniversary) ? 4 : sharingStatus === 'shared' ? 3 : 2)

  // Unified people list: all participants + all contributors, deduped by userId
  type PersonOnMemory = { key: string; name: string; ini: string; isMe: boolean; status: 'accepted' | 'invited' | null }
  const peopleOnMemory: PersonOnMemory[] = []
  const seenUserIds = new Set<string>()

  // 1. Formal participants (joined or pending invite)
  for (const p of memory.memory_participants) {
    if (p.user_id) {
      if (seenUserIds.has(p.user_id)) continue
      seenUserIds.add(p.user_id)
      const name = p.users?.display_name ?? p.users?.email ?? '?'
      peopleOnMemory.push({
        key: p.id,
        name,
        ini: initials(name),
        isMe: p.user_id === user?.id,
        status: p.joined_at ? 'accepted' : 'invited',
      })
    } else if (p.invited_email) {
      // Pending invite — no account yet
      peopleOnMemory.push({
        key: p.id,
        name: p.invited_email,
        ini: initials(p.invited_email),
        isMe: false,
        status: 'invited',
      })
    }
  }

  // 2. Contributors not already in participant list
  for (const c of contributions) {
    if (!c.author_id || seenUserIds.has(c.author_id)) continue
    seenUserIds.add(c.author_id)
    const authorData = (c as { users?: { display_name?: string | null; email?: string | null } }).users
    const name = authorData?.display_name ?? authorData?.email ?? 'Anonimo'
    peopleOnMemory.push({
      key: `contrib:${c.author_id}`,
      name,
      ini: initials(name),
      isMe: c.author_id === user?.id,
      status: null,
    })
  }

  // 3. Message authors not already captured above
  for (const m of rawMessages) {
    if (!m.author_id || seenUserIds.has(m.author_id)) continue
    seenUserIds.add(m.author_id)
    const name = m.author.display_name ?? m.author.email.split('@')[0] ?? 'Anonimo'
    peopleOnMemory.push({
      key: `msg:${m.author_id}`,
      name,
      ini: initials(name),
      isMe: m.author_id === user?.id,
      status: null,
    })
  }

  // 4. Tagged people from address book (memory_people → people)
  // Covers ghost contacts (linked_user_id = NULL) not present in any other source
  const seenPersonIds = new Set<string>()
  for (const row of rawTaggedPeople ?? []) {
    const person = Array.isArray(row.people) ? row.people[0] : row.people
    if (!person) continue
    const p = person as { id: string; name: string; linked_user_id: string | null }
    if (p.linked_user_id) {
      // Person has an account — skip if already shown via participants / contributions
      if (seenUserIds.has(p.linked_user_id)) continue
      seenUserIds.add(p.linked_user_id)
      peopleOnMemory.push({
        key: `tagged-user:${p.id}`,
        name: p.name,
        ini: initials(p.name),
        isMe: p.linked_user_id === user?.id,
        status: null,
      })
    } else {
      // Ghost person — deduplicate by person_id (no user_id to track)
      if (seenPersonIds.has(p.id)) continue
      seenPersonIds.add(p.id)
      peopleOnMemory.push({
        key: `ghost:${p.id}`,
        name: p.name,
        ini: initials(p.name),
        isMe: false,
        status: null,
      })
    }
  }

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
  const anchorLabel = getAnchorLabel((memory as { anchor_id?: string | null }).anchor_id)
  const memorySharedId = (memory as { shared_memory_id?: string | null }).shared_memory_id ?? null

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

  // Fetch shared memory perspectives (if any)
  const sharedMemory = !isPeriod && memorySharedId
    ? await getSharedMemoryDetail(memorySharedId)
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
            <MoreMenu
              memoryId={params.id}
              editHref={`/memories/${params.id}/edit`}
            />
          )}
        </div>

        <div className="max-w-lg mx-auto px-4 pb-24">

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
                      <div key={c.id} data-fade-in className="-mx-4">
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
      <MemoryScrollEffects />

      {/* ── Hero block ── */}
      <div id="memory-hero" className={`relative w-full ${heroPhoto ? 'aspect-[4/3] max-h-[420px]' : 'h-14'} bg-muted overflow-hidden`}>
        {heroPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroPhoto}
            alt=""
            id="memory-hero-img" className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
          />
        ) : null}

        {/* Gradient overlay — top only, for control readability */}
        {heroPhoto && (
          <div
            id="memory-hero-gradient"
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, transparent 42%)',
            }}
          />
        )}

        {/* Top bar — overlaid on hero */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-6 z-10">
          <Link
            href="/dashboard"
            className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
              heroPhoto
                ? 'text-white/90 hover:text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
            I tuoi ricordi
          </Link>
          <div className="flex items-center gap-0.5">
            <ShareButton
              title={memory.title}
              url={`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/memories/${params.id}`}
              heroMode={!!heroPhoto}
            />
            {isCreator && (
              <MoreMenu
                memoryId={params.id}
                editHref={`/memories/${params.id}/edit`}
                heroMode={!!heroPhoto}
              />
            )}
          </div>
        </div>

      </div>

      {/* ── Emotional line under hero ── */}
      <p className="max-w-lg mx-auto px-5 text-xs text-muted-foreground/35 mt-2">
        Questo momento è ancora qui
      </p>

      {/* ── Hero image actions — like only ── */}
      {heroPhoto && (
        <div className="max-w-lg mx-auto px-4">
          <ContentActions likeOnly />
        </div>
      )}

      {/* ── Shared memory — primary block, immediately after hero ── */}
      {sharedMemory && (
        <div className="max-w-lg mx-auto px-4 mt-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
            Questo momento continua
          </div>
          <Link
            href={`/shared/${sharedMemory.id}`}
            className="block rounded-2xl bg-black text-white px-4 py-4 hover:opacity-90 transition-opacity active:scale-[0.99]"
          >
            <div className="text-sm font-semibold">Vedi cosa stanno aggiungendo →</div>
          </Link>
        </div>
      )}

      {/* ── Body ── */}
      <div className="max-w-lg mx-auto px-4 pb-24">

        {/* Success feedback after contribution */}
        {searchParams.contributed === '1' && (
          <p className="pt-4 text-xs text-muted-foreground">
            ✓ Il tuo ricordo è stato aggiunto.
          </p>
        )}

        {/* ── Memory meta — always shown below hero ── */}
        <div className="pt-5 pb-4 border-b border-border/30">
          {/* Category tags */}
          {memoryCats.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {memoryCats.map((cv) => {
                const ci = getCategoryByValue(cv)
                return ci ? (
                  <Link
                    key={cv}
                    href={`/dashboard?category=${ci.value}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <span>{ci.emoji}</span>
                    <span className="uppercase tracking-wider">{ci.label}</span>
                  </Link>
                ) : null
              })}
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl font-semibold tracking-tight leading-tight">
            {memory.title}
          </h1>

          {/* Date · Place */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-base text-muted-foreground mt-2">
            <span>{formatMemoryDateFull(memoryStartDate, memoryEndDate)}</span>
            {memory.location_name && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span>{memory.location_name}</span>
              </>
            )}
            {anchorLabel && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-sm">{anchorLabel}</span>
              </>
            )}
          </div>

          {/* Importance + badges row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <ImportanceStars
              memoryId={params.id}
              initialValue={importanceLevel}
              isCreator={isCreator}
            />
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

          {/* Con chi eri — before description */}
          {peopleOnMemory.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">
                Con chi eri
              </p>
              <div className="flex items-start gap-3 flex-wrap">
                {peopleOnMemory.map((p) => (
                  <div key={p.key} className="flex flex-col items-center gap-1 shrink-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold ${
                      p.status === 'accepted' || p.status === null
                        ? 'bg-foreground text-background'
                        : 'bg-muted border border-dashed border-border text-muted-foreground'
                    }`}>
                      {p.ini}
                    </div>
                    <span className="text-[10px] text-foreground/70 leading-none max-w-[48px] truncate text-center">
                      {p.isMe ? 'Tu' : p.name.split(' ')[0]}
                    </span>
                    {p.status === 'invited' && (
                      <span className="text-[8px] text-muted-foreground/40 uppercase tracking-wide leading-none">
                        invitato
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/40 mt-2">
                Anche loro potrebbero ricordarlo in modo diverso
              </p>
            </div>
          )}

          {/* Description */}
          {memory.description && (
            <>
              <p className="text-[10px] text-muted-foreground/35 mt-4 mb-0.5">Ti ricordi quando...</p>
              <p data-fade-in className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {memory.description}
              </p>
            </>
          )}

          {/* Text block interactions — persisted to memory_messages */}
          <ContentActions
            memoryId={params.id}
            initialComments={textThreadComments}
          />
        </div>

        {/* Contextual invite line — shown to non-creators in shared memories */}
        {!isCreator && creatorName && (
          <p className="text-xs text-muted-foreground pt-3 pb-0">
            {creatorName} ha salvato questo momento con te.
          </p>
        )}

        {/* ── Tags ── */}
        {tags.length > 0 && (
          <div className="pb-3">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="inline-flex items-center rounded-full border border-border/50 bg-transparent hover:bg-accent hover:border-foreground/20 px-3 py-1 text-xs text-muted-foreground/60 hover:text-foreground transition-all"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Shared perspectives ── */}
        {sharedMemory && sharedMemory.contributions.length > 0 && (
          <div className="mt-6">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
              Cose aggiunte da chi c'era
            </div>
            <div className="space-y-4">
              {sharedMemory.contributions.slice(0, 3).map((c) => (
                <div key={c.id}>
                  <div className="text-xs text-muted-foreground/60 mb-1">{c.author_name}</div>
                  <div className="text-sm leading-relaxed text-foreground/80">{c.body}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <Link
                href={`/shared/${sharedMemory.id}?from=${params.id}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Vedi tutto →
              </Link>
              <Link
                href={`/shared/${sharedMemory.id}/add?from=${params.id}`}
                className="bg-black text-white text-sm px-4 py-2 rounded-full hover:opacity-90 transition-opacity active:scale-[0.99]"
              >
                Aggiungi qualcosa
              </Link>
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

        {/* ── Inline contribute — main interaction ── */}
        {!hasOwnContribution && (
          <InlineContribute memoryId={params.id} />
        )}

        {/* ── Contributions — narrative ── */}
        <div id="contributi" className="pt-4">

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
            <div className="space-y-5">
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
                    <ImageCard
                      key={c.id}
                      src={c.media_url}
                      alt={c.caption ?? ''}
                      caption={c.caption}
                      comments={[]}
                    />
                  )
                }

                /* ── Text contribution — journal style ── */
                if (c.content_type === 'text' && c.text_content) {
                  return (
                    <div key={c.id} data-fade-in className="space-y-3">
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
                    <div key={c.id} data-fade-in className="rounded-2xl bg-muted/50 border border-border/40 px-5 py-4 space-y-2.5">
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

      </div>

      {/* ── FAB — photo contribute ── */}
      <div className="fixed bottom-6 z-50" style={{ right: 'max(1rem, calc((100vw - 32rem) / 2 + 1rem))' }}>
        <Link
          href={`/memories/${params.id}/contribute`}
          className="flex items-center gap-2 rounded-full bg-black border border-black text-white px-4 py-2.5 text-xs font-medium shadow-sm hover:bg-black/85 active:scale-95 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Continua questo momento
        </Link>
      </div>

    </main>
  )
}

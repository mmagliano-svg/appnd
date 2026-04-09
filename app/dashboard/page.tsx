import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getUserMemories } from '@/actions/memories'
import { getTopPeople } from '@/actions/persons'
import { getUpcomingMoments, getMemorySignals } from '@/actions/home'
import { getHomeSharedMoments } from '@/actions/shared-memories'
import { HomeTopBar } from '@/components/home/HomeTopBar'
import { HomeHero, type HeroMemory } from '@/components/home/HomeHero'
import { FeaturedMemory, type FeaturedMemoryData } from '@/components/home/FeaturedMemory'
import { MemorySignals } from '@/components/home/MemorySignals'
import { SharedMoments } from '@/components/home/SharedMoments'
import { ContinueStory, type StoryMemory } from '@/components/home/ContinueStory'
import { LifeClusters, type ClusterItem } from '@/components/home/LifeClusters'
import { UpcomingMoments } from '@/components/home/UpcomingMoments'
import { HeroContributionPreview } from '@/components/home/HeroContributionPreview'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, avatar_url, email')
    .eq('id', user.id)
    .single()

  const [memoriesRaw, peopleRaw, upcomingMoments, signals, sharedMoments] = await Promise.all([
    getUserMemories(),
    getTopPeople(9),
    getUpcomingMoments(30),
    getMemorySignals(),
    getHomeSharedMoments(),
  ])

  if (memoriesRaw.length === 0) redirect('/onboarding')

  const displayName = profile?.display_name ?? profile?.email ?? user.email ?? ''
  const avatarUrl = (profile as { avatar_url?: string | null } | null)?.avatar_url ?? null

  // Helper: first photo URL from contributions
  function previewUrl(
    memory: { memory_contributions: { media_url: string | null; content_type: string }[] },
  ): string | null {
    return (
      memory.memory_contributions.find(
        (c) => c.content_type === 'photo' && c.media_url,
      )?.media_url ?? null
    )
  }

  const events = memoriesRaw.filter((m) => !m.end_date)
  const periods = memoriesRaw.filter((m) => Boolean(m.end_date))

  // ── Hero — single dominant card ────────────────────────────────────────────
  // Best: most recent event with a photo; fallback to most recent event
  const heroSource =
    events.find((m) => previewUrl(m) !== null) ?? events[0] ?? null
  const heroMemory: HeroMemory | null = heroSource
    ? {
        id: heroSource.id,
        title: heroSource.title,
        start_date: heroSource.start_date,
        end_date: heroSource.end_date ?? null,
        location_name: heroSource.location_name ?? null,
        previewUrl: previewUrl(heroSource),
      }
    : null

  // ── Hero memory state — drives dynamic copy and CTA ──────────────────────
  // Lightweight count query: contributions on the hero memory by others in the
  // last 24 h.  Only fires when a hero exists; falls back to false otherwise.
  const heroHasContributions = (heroSource?.memory_contributions.length ?? 0) > 0
  let heroHasNewContribs = false
  if (heroSource) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('memory_contributions')
      .select('id', { count: 'exact', head: true })
      .eq('memory_id', heroSource.id)
      .neq('author_id', user.id)
      .gte('created_at', cutoff)
    heroHasNewContribs = (count ?? 0) > 0
  }

  // When there are new contributions from others, fetch the latest one for preview
  let heroLatestContrib: {
    authorName: string
    contentType: string
    textContent: string | null
    mediaUrl: string | null
  } | null = null

  if (heroHasNewContribs && heroSource) {
    const { data: latestContrib } = await supabase
      .from('memory_contributions')
      .select('content_type, text_content, media_url, created_at, users ( display_name, email )')
      .eq('memory_id', heroSource.id)
      .neq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (latestContrib) {
      const contribUser = latestContrib.users as { display_name?: string | null; email?: string | null } | null
      heroLatestContrib = {
        authorName: contribUser?.display_name ?? contribUser?.email?.split('@')[0] ?? 'Qualcuno',
        contentType: latestContrib.content_type,
        textContent: latestContrib.text_content,
        mediaUrl: latestContrib.media_url,
      }
    }
  }

  const heroCaption = heroHasNewContribs
    ? 'Questo momento non è più solo tuo'
    : heroHasContributions
    ? 'Hai iniziato qualcosa'
    : 'È ancora tutto qui'

  const heroCtaLabel = heroHasNewContribs
    ? 'Scopri cosa è cambiato →'
    : heroHasContributions
    ? 'Continua questo momento →'
    : 'Aggiungi qualcosa di oggi →'

  // ── First-time state: user has exactly one moment ─────────────────────────
  // Show a focused, directional layout instead of the full dashboard experience.
  // Disappears naturally once the user creates a second memory.
  if (memoriesRaw.length === 1 && heroMemory) {
    return (
      <main className="min-h-screen bg-background pb-28">
        <div className="max-w-[1100px] mx-auto">
          <HomeTopBar displayName={displayName} avatarUrl={avatarUrl} />
          <div className="space-y-5 pt-1">

            {/* Intro headline */}
            <div className="px-5">
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: 'rgba(17,17,17,0.30)' }}
              >
                Il tuo primo momento
              </p>
              <h2
                className="text-[26px] font-semibold tracking-[-0.02em] leading-tight"
                style={{ color: '#111111' }}
              >
                Hai iniziato da qui
              </h2>
              <p
                className="text-[14px] mt-1.5 leading-snug"
                style={{ color: 'rgba(17,17,17,0.38)' }}
              >
                Ogni storia inizia con un momento.
              </p>
            </div>

            {/* Dominant memory card — reuses HomeHero which handles its own padding */}
            <HomeHero
              memory={heroMemory}
              displayName={displayName}
              ctaLabel={heroCtaLabel}
              caption={heroCaption}
              highlighted={heroHasNewContribs}
            />
            {heroHasNewContribs && heroLatestContrib && heroMemory && (
              <HeroContributionPreview
                memoryId={heroMemory.id}
                authorName={heroLatestContrib.authorName}
                contentType={heroLatestContrib.contentType}
                textContent={heroLatestContrib.textContent}
                mediaUrl={heroLatestContrib.mediaUrl}
              />
            )}

            {/* Next-step action cards */}
            <div className="px-4 space-y-3 pb-4">
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                style={{ color: 'rgba(17,17,17,0.28)' }}
              >
                Da qui può crescere
              </p>
              <Link
                href={`/memories/${heroMemory.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4 active:scale-[0.985] transition-transform"
                style={{ background: '#6B5FE8', color: 'white' }}
              >
                <div>
                  <p className="text-[15px] font-medium leading-none">Aggiungi un dettaglio</p>
                  <p className="text-[12px] mt-1 opacity-60">Qualcosa che non vuoi dimenticare</p>
                </div>
                <span className="text-xl opacity-40 shrink-0 select-none" aria-hidden>✦</span>
              </Link>
              <Link
                href={`/memories/${heroMemory.id}`}
                className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4 active:scale-[0.985] transition-transform"
                style={{
                  background: 'white',
                  border:     '1px solid rgba(17,17,17,0.08)',
                  color:      '#111111',
                  boxShadow:  '0 1px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div>
                  <p className="text-[15px] font-medium leading-none">Invita chi era con te</p>
                  <p className="text-[12px] mt-1" style={{ color: '#ABABAB' }}>
                    Per sentire anche il loro punto di vista
                  </p>
                </div>
                <span className="text-lg opacity-25 shrink-0 select-none" aria-hidden>○</span>
              </Link>
            </div>

          </div>
        </div>
      </main>
    )
  }

  // ── Featured Memory — "Da rivivere ora" ───────────────────────────────────
  // Best candidate: most contributions (activity proxy), excluding hero
  const featuredSource = (() => {
    const candidates = events.filter((m) => m.id !== heroSource?.id)
    if (candidates.length === 0) return heroSource
    return [...candidates].sort(
      (a, b) => b.memory_contributions.length - a.memory_contributions.length,
    )[0]
  })()

  const featuredSubtext = (() => {
    if (!featuredSource) return "Non lo apri da un po'"
    const cnt = featuredSource.memory_contributions.length
    if (cnt >= 4) return 'Ti è rimasto molto'
    if (cnt >= 2) return 'Qualcuno ha aggiunto qualcosa'
    return "Non lo apri da un po'"
  })()

  const featuredMemory: FeaturedMemoryData | null = featuredSource
    ? {
        id: featuredSource.id,
        title: featuredSource.title,
        previewUrl: previewUrl(featuredSource),
        subtext: featuredSubtext,
      }
    : null

  // ── Continue Story ─────────────────────────────────────────────────────────
  // Exclude the hero memory so it doesn't appear twice
  const continueMemories: StoryMemory[] = events
    .filter((m) => m.id !== heroSource?.id)
    .slice(0, 6)
    .map((m) => ({
      id: m.id,
      title: m.title,
      start_date: m.start_date,
      end_date: m.end_date ?? null,
      previewUrl: previewUrl(m),
    }))

  // ── Life Clusters ──────────────────────────────────────────────────────────
  // People — deduplicate preview images so no two people share the same photo.
  // Priority per person: avatarUrl (profile photo) → unique previewPhotoUrl → null (initials)
  const usedPreviewUrls = new Set<string>()
  const peopleClusters: ClusterItem[] = peopleRaw.slice(0, 3).map((p) => {
    // Profile avatar is person-specific — always use it if present
    if (p.avatarUrl) {
      usedPreviewUrls.add(p.avatarUrl)
      return { id: p.id, label: p.name, count: p.memoryCount ?? 0, href: `/people/${p.id}`, previewUrl: p.avatarUrl }
    }
    // Use memory preview only if not already claimed by an earlier person
    if (p.previewPhotoUrl && !usedPreviewUrls.has(p.previewPhotoUrl)) {
      usedPreviewUrls.add(p.previewPhotoUrl)
      return { id: p.id, label: p.name, count: p.memoryCount ?? 0, href: `/people/${p.id}`, previewUrl: p.previewPhotoUrl }
    }
    // Fallback: no image — ClusterCard will render initials
    return { id: p.id, label: p.name, count: p.memoryCount ?? 0, href: `/people/${p.id}`, previewUrl: null }
  })

  // Places — most frequent locations with preview
  const placeMap = new Map<string, { count: number; previewUrl: string | null }>()
  for (const m of events) {
    if (!m.location_name) continue
    const entry = placeMap.get(m.location_name)
    if (entry) {
      entry.count++
    } else {
      placeMap.set(m.location_name, { count: 1, previewUrl: previewUrl(m) })
    }
  }
  const placesClusters: ClusterItem[] = Array.from(placeMap.entries())
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 3)
    .map(([name, entry]) => ({
      id: name,
      label: name,
      count: entry.count,
      href: `/places/${encodeURIComponent(name)}`,
      previewUrl: entry.previewUrl,
    }))

  // Chapters (periods)
  const chapterClusters: ClusterItem[] = periods.slice(0, 3).map((p) => ({
    id: p.id,
    label: p.title,
    count: events.filter((e) => e.parent_period_id === p.id).length,
    href: `/memories/${p.id}`,
    previewUrl: previewUrl(p),
  }))

  return (
    <main className="min-h-screen bg-background pb-28">
      <div className="max-w-[1100px] mx-auto">

        <HomeTopBar displayName={displayName} avatarUrl={avatarUrl} />

        <div className="space-y-10 pt-1">

          {/* Hero + featured + signals — immediate emotional tone */}
          <div className="space-y-4">
            <HomeHero
              memory={heroMemory}
              displayName={displayName}
              ctaLabel={heroCtaLabel}
              caption={heroCaption}
              highlighted={heroHasNewContribs}
            />
            {heroHasNewContribs && heroLatestContrib && heroMemory && (
              <HeroContributionPreview
                memoryId={heroMemory.id}
                authorName={heroLatestContrib.authorName}
                contentType={heroLatestContrib.contentType}
                textContent={heroLatestContrib.textContent}
                mediaUrl={heroLatestContrib.mediaUrl}
              />
            )}
            {featuredMemory && <FeaturedMemory memory={featuredMemory} />}
            <MemorySignals signals={signals} />
          </div>

          {/* Social layer — shared moments */}
          <SharedMoments moments={sharedMoments} />

          {/* Continuation — open memories */}
          {continueMemories.length > 0 && (
            <ContinueStory memories={continueMemories} />
          )}

          {/* Time depth — recurring moments */}
          <UpcomingMoments moments={upcomingMoments} />

          {/* Life context — clusters */}
          <LifeClusters
            people={peopleClusters}
            places={placesClusters}
            chapters={chapterClusters}
          />

        </div>
      </div>
    </main>
  )
}

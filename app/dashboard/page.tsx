import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getUserMemories } from '@/actions/memories'
import { getRepeatedPattern } from '@/actions/home'
import { HomeTopBar } from '@/components/home/HomeTopBar'
import { HomeHero, type HeroMemory } from '@/components/home/HomeHero'
import { MemoryTimelineFeed, type FeedMemory } from '@/components/home/MemoryTimelineFeed'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, avatar_url, email')
    .eq('id', user.id)
    .single()

  const [memoriesRaw, repeatedPattern] = await Promise.all([
    getUserMemories(),
    getRepeatedPattern(),
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

  // ── Hero — single dominant card ────────────────────────────────────────────
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
  if (memoriesRaw.length === 1 && heroMemory) {
    return (
      <main className="min-h-screen bg-background pb-28">
        <div className="max-w-[1100px] mx-auto">
          <HomeTopBar displayName={displayName} avatarUrl={avatarUrl} />
          <div className="space-y-5 pt-1">

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

            <HomeHero
              memory={heroMemory}
              displayName={displayName}
              ctaLabel={heroCtaLabel}
              caption={heroCaption}
              highlighted={heroHasNewContribs}
            />

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

  // ── Build feed data ────────────────────────────────────────────────────────
  // Chronological descending list of memories, excluding the hero (which is
  // rendered separately on top). Capped at 30 to keep the page fast.
  // Each memory carries the importance signals MemoryTimelineFeed uses to
  // decide rendering size (large / medium / small).
  const feedMemories: FeedMemory[] = memoriesRaw
    .filter((m) => m.id !== heroSource?.id)
    .sort(
      (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
    )
    .slice(0, 30)
    .map((m) => {
      const photoCount = m.memory_contributions.filter(
        (c) => c.content_type === 'photo' && c.media_url,
      ).length
      return {
        id: m.id,
        title: m.title,
        start_date: m.start_date,
        end_date: m.end_date ?? null,
        location_name: m.location_name ?? null,
        previewUrl: previewUrl(m),
        photoCount,
        hasDescription: Boolean((m.description ?? '').trim()),
        isFirstTime: Boolean(m.is_first_time),
        isAnniversary: Boolean(m.is_anniversary),
        isPartOfPeriod: Boolean(m.parent_period_id),
      }
    })

  return (
    <main className="min-h-screen bg-background pb-28">
      <div className="max-w-[1100px] mx-auto">

        <HomeTopBar displayName={displayName} avatarUrl={avatarUrl} />

        <div className="pt-1">
          {/* Hero — the entry point into the user's life */}
          <HomeHero
            memory={heroMemory}
            displayName={displayName}
            ctaLabel={heroCtaLabel}
            caption={heroCaption}
            highlighted={heroHasNewContribs}
          />

          {/* Living timeline — one continuous narrative flow */}
          <MemoryTimelineFeed
            memories={feedMemories}
            pattern={repeatedPattern}
          />
        </div>
      </div>
    </main>
  )
}

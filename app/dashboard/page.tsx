import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getUserMemories } from '@/actions/memories'
import { getTopPeople } from '@/actions/persons'
import { getUpcomingMoments, getMemorySignals } from '@/actions/home'
import { getHomeSharedMoments } from '@/actions/shared-memories'
import { HomeTopBar } from '@/components/home/HomeTopBar'
import { HomeHero, type HeroMemory } from '@/components/home/HomeHero'
import { MemorySignals } from '@/components/home/MemorySignals'
import { SharedMoments } from '@/components/home/SharedMoments'
import { ContinueStory, type StoryMemory } from '@/components/home/ContinueStory'
import { LifeClusters, type ClusterItem } from '@/components/home/LifeClusters'
import { UpcomingMoments } from '@/components/home/UpcomingMoments'

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
  // People
  const peopleClusters: ClusterItem[] = peopleRaw.slice(0, 3).map((p) => ({
    id: p.id,
    label: p.name,
    count: p.memoryCount ?? 0,
    href: `/people/${p.id}`,
    previewUrl: p.previewPhotoUrl ?? p.avatarUrl ?? null,
  }))

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

        <div className="space-y-8 pt-1">

          <HomeHero memory={heroMemory} displayName={displayName} />

          <MemorySignals signals={signals} />

          <SharedMoments moments={sharedMoments} />

          {continueMemories.length > 0 && (
            <ContinueStory memories={continueMemories} />
          )}

          <UpcomingMoments moments={upcomingMoments} />

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

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getUserMemories } from '@/actions/memories'
import { getTopPeople } from '@/actions/persons'
import { HomeTopBar } from '@/components/home/HomeTopBar'
import { HomeHeroCarousel, type HeroMemory } from '@/components/home/HomeHeroCarousel'
import { HomeStats } from '@/components/home/HomeStats'
import { ContinueStory, type StoryMemory } from '@/components/home/ContinueStory'
import { SharedMemories, type SharedMemory } from '@/components/home/SharedMemories'
import { LifeClusters, type ClusterItem } from '@/components/home/LifeClusters'
import { AllMemoriesList, type ListMemory } from '@/components/home/AllMemoriesList'

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, avatar_url, email')
    .eq('id', user.id)
    .single()

  const [memoriesRaw, peopleRaw] = await Promise.all([
    getUserMemories(),
    getTopPeople(9),
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

  // ── Hero carousel ──────────────────────────────────────────────────────────
  // Prefer memories with photos; fill up to 5 from the rest
  const withPhoto = events.filter((m) => previewUrl(m) !== null)
  const withoutPhoto = events.filter((m) => previewUrl(m) === null)
  const heroMemories: HeroMemory[] = [...withPhoto, ...withoutPhoto]
    .slice(0, 5)
    .map((m) => ({
      id: m.id,
      title: m.title,
      start_date: m.start_date,
      end_date: m.end_date ?? null,
      location_name: m.location_name ?? null,
      previewUrl: previewUrl(m),
    }))

  // ── Stats ──────────────────────────────────────────────────────────────────
  const uniquePlaces = new Set(
    memoriesRaw.filter((m) => m.location_name).map((m) => m.location_name!),
  ).size

  // ── Continue Story ─────────────────────────────────────────────────────────
  const continueMemories: StoryMemory[] = events.slice(0, 6).map((m) => ({
    id: m.id,
    title: m.title,
    start_date: m.start_date,
    end_date: m.end_date ?? null,
    previewUrl: previewUrl(m),
  }))

  // ── Shared With You ────────────────────────────────────────────────────────
  const sharedRaw = memoriesRaw.filter((m) => m.created_by !== user.id)
  let sharedMemories: SharedMemory[] = []

  if (sharedRaw.length > 0) {
    const creatorIds = Array.from(new Set(sharedRaw.map((m) => m.created_by)))
    const { data: creators } = await supabase
      .from('users')
      .select('id, display_name, email')
      .in('id', creatorIds)
    const creatorMap = new Map(
      (creators ?? []).map((c) => [
        c.id,
        c.display_name ?? c.email?.split('@')[0] ?? 'Qualcuno',
      ]),
    )
    sharedMemories = sharedRaw.slice(0, 5).map((m) => ({
      id: m.id,
      title: m.title,
      start_date: m.start_date,
      end_date: m.end_date ?? null,
      previewUrl: previewUrl(m),
      sharedBy: creatorMap.get(m.created_by) ?? 'Qualcuno',
    }))
  }

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

  // ── All Memories list ──────────────────────────────────────────────────────
  const allMemories: ListMemory[] = events.map((m) => ({
    id: m.id,
    title: m.title,
    start_date: m.start_date,
    end_date: m.end_date ?? null,
    location_name: m.location_name ?? null,
    category: m.category ?? null,
    categories: m.categories as string[] | null,
    previewUrl: previewUrl(m),
  }))

  return (
    <main className="min-h-screen bg-background pb-28">

      <HomeTopBar displayName={displayName} avatarUrl={avatarUrl} />

      <div className="space-y-8 pt-1">

        <HomeHeroCarousel memories={heroMemories} />

        <HomeStats
          momentCount={events.length}
          chapterCount={periods.length}
          placeCount={uniquePlaces}
          peopleCount={peopleRaw.length}
        />

        <ContinueStory memories={continueMemories} />

        {sharedMemories.length > 0 && (
          <SharedMemories memories={sharedMemories} />
        )}

        <LifeClusters
          people={peopleClusters}
          places={placesClusters}
          chapters={chapterClusters}
        />

        <AllMemoriesList memories={allMemories} />

      </div>
    </main>
  )
}

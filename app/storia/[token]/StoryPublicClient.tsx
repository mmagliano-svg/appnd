'use client'

import Link from 'next/link'
import type { PublicStoryData } from '@/actions/stories'

const MONTHS_IT = [
  'Gennaio','Febbraio','Marzo','Aprile','Maggio',
  'Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre',
]

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function StoryPublicClient({ story }: { story: PublicStoryData }) {
  const monthName = MONTHS_IT[story.month - 1]
  const coverMemory = story.memories.find((m) => m.photoUrl)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">

        {/* ── Cover ── */}
        {coverMemory?.photoUrl ? (
          <div className="relative w-full aspect-[4/3]">
            <img
              src={coverMemory.photoUrl}
              alt={story.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-2">
                {story.authorName}
              </p>
              <h1 className="text-3xl font-bold text-white leading-tight">
                {monthName} {story.year}
              </h1>
              <p className="text-white/70 text-sm mt-1">
                {story.memories.length} moment{story.memories.length === 1 ? 'o' : 'i'} vissuti
              </p>
            </div>
          </div>
        ) : (
          <div className="px-6 pt-12 pb-8 border-b border-border">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/40 mb-3">
              {story.authorName}
            </p>
            <h1 className="text-4xl font-bold leading-tight mb-2">
              {monthName} {story.year}
            </h1>
            <p className="text-muted-foreground">
              {story.memories.length} moment{story.memories.length === 1 ? 'o' : 'i'} vissuti
            </p>
          </div>
        )}

        {/* ── Memories ── */}
        <div className="px-6 py-8 space-y-8">
          {story.memories.map((memory, i) => (
            <div key={memory.id} className="space-y-3">
              {/* Photo */}
              {memory.photoUrl && (
                <div className="rounded-2xl overflow-hidden">
                  <img
                    src={memory.photoUrl}
                    alt={memory.title}
                    className="w-full object-cover max-h-72"
                  />
                </div>
              )}

              {/* Content */}
              <div>
                <p className="text-xs text-muted-foreground/50 mb-1">
                  {formatDate(memory.start_date)}
                  {memory.location_name && ` · ${memory.location_name}`}
                </p>
                <h2 className="font-bold text-lg leading-snug mb-1">
                  {memory.title}
                </h2>
                {memory.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {memory.description}
                  </p>
                )}
              </div>

              {/* Divider between moments */}
              {i < story.memories.length - 1 && (
                <div className="border-b border-border/50 pt-2" />
              )}
            </div>
          ))}
        </div>

        {/* ── CTA ── */}
        <div className="px-6 pb-16">
          <div className="rounded-2xl bg-foreground text-background p-6 text-center">
            <p className="text-sm font-semibold mb-1">
              Anche tu hai una storia da raccontare.
            </p>
            <p className="text-sm text-background/60 mb-5">
              Appnd ti aiuta a conservare i momenti che contano, prima che spariscano.
            </p>
            <Link
              href="/"
              className="inline-block rounded-full bg-background text-foreground px-6 py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Inizia la tua storia →
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}

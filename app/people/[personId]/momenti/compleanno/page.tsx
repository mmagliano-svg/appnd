import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBirthdayMemories } from '@/actions/persons'
import { getCategoryByValue } from '@/lib/constants/categories'

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDayMonth(d: string) {
  return new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })
}

// ── Components ─────────────────────────────────────────────────────────────

function MemoryRow({ memory }: {
  memory: {
    id: string
    title: string
    start_date: string
    location_name: string | null
    category: string | null
    previewUrl: string | null
  }
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
          <img
            src={memory.previewUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 py-3.5 pr-4 min-w-0">
        {catInfo && (
          <p className="text-xs text-muted-foreground mb-1">{catInfo.emoji} {catInfo.label}</p>
        )}
        <p className="font-semibold text-sm leading-snug line-clamp-2 mb-1">{memory.title}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>{formatDayMonth(memory.start_date)}</span>
          {memory.location_name && (
            <>
              <span className="text-border">·</span>
              <span className="truncate">{memory.location_name}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function BirthdayMemoriesPage({
  params,
}: {
  params: { personId: string }
}) {
  const result = await getBirthdayMemories(params.personId)

  // If person doesn't exist or has no birth date, 404
  if (!result.personName) notFound()

  const { personName, memories } = result

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-28">

        {/* Back */}
        <div className="pt-6 pb-2">
          <Link
            href={`/people/${params.personId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
            {personName}
          </Link>
        </div>

        {/* Header */}
        <div className="pt-8 pb-10">
          <h1 className="text-2xl font-bold tracking-tight leading-tight">
            Compleanni con {personName}
          </h1>
        </div>

        {/* Content */}
        {memories.length === 0 ? (
          <div className="text-center py-16 space-y-1">
            <p className="text-sm text-muted-foreground/60">La tua storia inizia qui.</p>
            <p className="text-sm text-muted-foreground/40">Aggiungi un ricordo per questo momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {memories.map((m) => (
              <MemoryRow key={m.id} memory={m} />
            ))}
          </div>
        )}

      </div>
    </main>
  )
}

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSharedMemoryDetail } from '@/actions/shared-memories'
import { getAnchorLabel } from '@/lib/utils/anchors'
import { formatMemoryDate } from '@/lib/utils/dates'

export default async function SharedMemoryPage({
  params,
  searchParams,
}: {
  params: { sharedMemoryId: string }
  searchParams: { from?: string }
}) {
  const sm = await getSharedMemoryDetail(params.sharedMemoryId)
  if (!sm) notFound()

  const anchorLabel = getAnchorLabel(sm.anchor_id)
  const fromMemoryId = searchParams.from ?? null
  const backHref = fromMemoryId ? `/memories/${fromMemoryId}` : '/dashboard'

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-32">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pt-6 pb-8">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
            </svg>
            Indietro
          </Link>
        </div>

        {/* ── Title block ── */}
        <div className="pb-7 border-b border-border/30">
          <h1 className="text-3xl font-bold tracking-tight leading-tight mb-2">
            {sm.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground/65">
            <span>{formatMemoryDate(sm.start_date, null)}</span>
            {sm.location_name && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span>{sm.location_name}</span>
              </>
            )}
            {anchorLabel && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <span>{anchorLabel}</span>
              </>
            )}
          </div>
        </div>

        {/* ── Contributions ── */}
        <div className="pt-8">
          <p className="text-sm text-muted-foreground/70 mb-4">
            Qui potete continuare questo ricordo insieme
          </p>
          <p className="text-xs text-muted-foreground/60 mb-6">
            Cose aggiunte da chi c'era
          </p>
          <div className="space-y-8">
            {sm.contributions.length === 0 ? (
              <p className="text-sm text-muted-foreground/50">
                Ancora nessun ricordo aggiunto.
              </p>
            ) : (
              sm.contributions.map((c) => (
                <div key={c.id} className="space-y-1">
                  <p className="text-xs text-muted-foreground/60">
                    aggiunto da {c.author_name}
                  </p>
                  <p className="text-[15px] text-foreground/85 leading-[1.8] whitespace-pre-wrap">
                    {c.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="pt-12 border-t border-border/30 mt-10">
          <Link
            href={`/shared/${params.sharedMemoryId}/add?from=${fromMemoryId ?? ''}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground/55 hover:text-foreground/80 transition-colors min-h-[44px]"
          >
            Aggiungi qualcosa →
          </Link>
        </div>

      </div>
    </main>
  )
}

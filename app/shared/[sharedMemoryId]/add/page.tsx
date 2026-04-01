import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getSharedMemoryDetail } from '@/actions/shared-memories'
import { AddContributionForm } from '@/components/shared/AddContributionForm'
import { getAnchorLabel } from '@/lib/utils/anchors'
import { formatMemoryDate } from '@/lib/utils/dates'

export default async function AddSharedContributionPage({
  params,
  searchParams,
}: {
  params: { sharedMemoryId: string }
  searchParams: { from?: string }
}) {
  const sm = await getSharedMemoryDetail(params.sharedMemoryId)
  if (!sm) notFound()

  const fromMemoryId = searchParams.from ?? null
  const anchorLabel = getAnchorLabel(sm.anchor_id)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-24">

        {/* ── Header ── */}
        <div className="flex items-center justify-between pt-6 pb-8">
          <Link
            href={fromMemoryId ? `/memories/${fromMemoryId}` : '/dashboard'}
            className="w-11 h-11 -ml-2 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Indietro"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <p className="text-sm font-semibold">Il tuo ricordo</p>
          <div className="w-11" />
        </div>

        {/* ── Shared memory context ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight leading-tight mb-1.5">
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

        {/* ── Existing contributors (ghost list) ── */}
        {sm.contributions.length > 0 && (
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">
              Già raccontato da
            </p>
            <div className="flex flex-wrap gap-2">
              {sm.contributions.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground/[0.05] px-3 py-1.5 text-xs text-muted-foreground/70"
                >
                  {c.author_name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Contribution form ── */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            Come lo ricordi tu?
          </p>
          <AddContributionForm
            sharedMemoryId={params.sharedMemoryId}
            fromMemoryId={fromMemoryId}
          />
        </div>

      </div>
    </main>
  )
}

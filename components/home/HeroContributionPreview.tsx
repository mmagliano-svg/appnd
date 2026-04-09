import Link from 'next/link'

interface HeroContributionPreviewProps {
  memoryId: string
  authorName: string
  contentType: string
  textContent: string | null
  mediaUrl: string | null
}

export function HeroContributionPreview({
  memoryId,
  authorName,
  contentType,
  textContent,
  mediaUrl,
}: HeroContributionPreviewProps) {
  return (
    <div className="px-4">
      <div
        className="rounded-2xl px-5 py-4"
        style={{
          background: 'rgba(107,95,232,0.06)',
          border: '1px solid rgba(107,95,232,0.12)',
        }}
      >
        {/* Signal line */}
        <p className="text-[11px] font-semibold text-muted-foreground/50 mb-2.5">
          {authorName} ha aggiunto qualcosa
        </p>

        {/* Content preview */}
        {contentType === 'photo' && mediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt=""
            className="w-full aspect-video rounded-xl object-cover mb-3"
            style={{ maxHeight: 120 }}
            loading="lazy"
            draggable={false}
          />
        ) : textContent ? (
          <p className="text-sm text-foreground/70 leading-relaxed line-clamp-2 mb-3">
            {textContent}
          </p>
        ) : null}

        {/* CTAs */}
        <div className="flex items-center gap-2.5">
          <Link
            href={`/memories/${memoryId}/contribute`}
            className="rounded-full px-4 py-2 text-xs font-medium text-white active:scale-[0.97] transition-transform"
            style={{ background: '#6B5FE8' }}
          >
            Rispondi anche tu
          </Link>
          <Link
            href={`/memories/${memoryId}`}
            className="rounded-full px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Apri il momento
          </Link>
        </div>
      </div>
    </div>
  )
}

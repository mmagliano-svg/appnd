import { TransitionLink } from '@/components/ui/transition-link'

export interface FeaturedMemoryData {
  id: string
  title: string
  previewUrl: string | null
  subtext: string
}

// Maps the subtext label to a micro hook line shown above the title.
// Same data, different emotional register — one is a label, one is a whisper.
function getMicroHook(subtext: string): string {
  if (subtext === 'Ti è rimasto molto')            return 'Ti è rimasto qualcosa lì'
  if (subtext === 'Qualcuno ha aggiunto qualcosa') return 'Potrebbe valere la pena tornarci'
  return "Non lo apri da un po'"
}

export function FeaturedMemory({ memory }: { memory: FeaturedMemoryData }) {
  const microHook = getMicroHook(memory.subtext)

  return (
    <div className="px-4 space-y-2">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/28">
        Da rivivere ora
      </p>
      <TransitionLink
        href={`/memories/${memory.id}`}
        className="relative block w-full rounded-2xl overflow-hidden bg-muted active:scale-[0.99] transition-transform"
        style={{ aspectRatio: '16/9' }}
      >
        {memory.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={memory.previewUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-800 dark:to-neutral-900" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/28 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6">
          {/* Micro hook — whisper above the title */}
          <p className="text-[10px] text-white/28 mb-1 leading-none italic">
            {microHook}
          </p>
          <p className="text-white text-[17px] font-semibold leading-snug line-clamp-2 tracking-tight">
            {memory.title}
          </p>
          <p className="text-white/38 text-[11px] mt-3 tracking-wide">
            Rivivi questo momento
          </p>
        </div>
      </TransitionLink>
    </div>
  )
}

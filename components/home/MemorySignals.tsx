import Link from 'next/link'
import type { MemorySignalsResult } from '@/actions/home'

interface Props {
  signals: MemorySignalsResult
}

export function MemorySignals({ signals }: Props) {
  // primary overrides all (used for debug / forced signals)
  // otherwise: newContribution → incompleteMemory → memoryRecall
  const active =
    signals.primary ??
    signals.newContribution ??
    signals.incompleteMemory ??
    signals.memoryRecall ??
    null

  if (!active) return null

  const subtitle =
    active.subtext ??
    (signals.newContribution  ? 'Memoria condivisa'   :
     signals.incompleteMemory ? 'Momento incompleto'  :
                                'Ricordo passato')

  return (
    <div className="px-4">
      <Link
        href={active.href}
        className="block rounded-2xl bg-foreground/[0.06] px-4 py-4 hover:bg-foreground/[0.09] transition-colors active:scale-[0.99]"
      >
        <p className="text-base font-semibold">{active.text}</p>
        <p className="text-sm text-muted-foreground/70 mt-1">{subtitle}</p>
      </Link>
    </div>
  )
}

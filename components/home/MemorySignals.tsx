import Link from 'next/link'
import type { MemorySignalsResult } from '@/actions/home'

interface Props {
  signals: MemorySignalsResult
}

export function MemorySignals({ signals }: Props) {
  // Priority: newContribution → incompleteMemory → memoryRecall
  const active =
    signals.newContribution ??
    signals.incompleteMemory ??
    signals.memoryRecall ??
    null

  if (!active) return null

  const subtitle =
    signals.newContribution  ? 'Memoria condivisa'   :
    signals.incompleteMemory ? 'Momento incompleto'  :
                               'Ricordo passato'

  return (
    <div className="px-4">
      <Link
        href={active.href}
        className="block rounded-2xl bg-foreground/[0.04] px-4 py-3 hover:bg-foreground/[0.07] transition-colors active:scale-[0.99]"
      >
        <p className="text-sm font-medium">{active.text}</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">{subtitle}</p>
      </Link>
    </div>
  )
}

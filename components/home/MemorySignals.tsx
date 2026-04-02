import Link from 'next/link'
import type { MemorySignalsResult } from '@/actions/home'

interface Props {
  signals: MemorySignalsResult
}

type SignalCard = {
  signal: { text: string; subtext?: string; href: string }
  label: string
  sublabel: string
}

export function MemorySignals({ signals }: Props) {
  const cards: SignalCard[] = []

  if (signals.primary) {
    cards.push({
      signal: signals.primary,
      label: 'Qualcosa è cambiato',
      sublabel: 'Vedi cosa è successo',
    })
  }
  if (signals.newContribution) {
    cards.push({
      signal: signals.newContribution,
      label: 'Nuovo',
      sublabel: 'Vedi cosa è successo',
    })
  }
  if (signals.incompleteMemory) {
    cards.push({
      signal: signals.incompleteMemory,
      label: 'Aperto',
      sublabel: 'Manca ancora qualcosa',
    })
  }
  if (signals.memoryRecall) {
    cards.push({
      signal: signals.memoryRecall,
      label: 'Ritorna',
      sublabel: 'Era questo periodo',
    })
  }

  if (cards.length === 0) return null

  return (
    <div className="px-4 space-y-2">
      {cards.map((card, i) => (
        <Link
          key={i}
          href={card.signal.href}
          className="block rounded-2xl bg-foreground/[0.05] px-4 py-4 hover:bg-foreground/[0.08] transition-colors active:scale-[0.99]"
        >
          <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/40 mb-1.5">
            {card.label}
          </p>
          <p className="text-sm font-medium leading-snug">{card.signal.text}</p>
          <p className="text-xs text-muted-foreground/50 mt-0.5">{card.sublabel}</p>
          <p className="text-xs text-muted-foreground/45 mt-3">Rivivi →</p>
        </Link>
      ))}
    </div>
  )
}

import Link from 'next/link'
import { HomeMemoryPrompt } from './HomeMemoryPrompt'
import type { RepeatedPattern } from '@/actions/home'

/**
 * MemoryTimelineFeed
 *
 * A single continuous vertical flow that replaces the old dashboard
 * sections. Mixes five block types into one chronological narrative
 * so the home feels like "scrolling a life", not using an app.
 *
 * Block types:
 *   1. memory    — a single moment (title, date, location)
 *   2. period    — a life chapter with duration (2018–2020)
 *   3. pattern   — a repeated place/people/category ("3 volte a Londra")
 *   4. continue  — a soft "questo momento può continuare" nudge
 *   5. prompt    — one rare memory activation prompt
 *
 * The composition is deterministic (not a feed that changes on every
 * refresh). Patterns and prompts are interleaved at fixed rhythm
 * positions so the user builds a mental map of the flow.
 */

export interface FeedMemory {
  id: string
  title: string
  start_date: string
  end_date: string | null
  location_name: string | null
  previewUrl: string | null
}

type TimelineBlock =
  | { kind: 'memory'; memory: FeedMemory }
  | { kind: 'period'; period: FeedMemory }
  | { kind: 'pattern'; pattern: RepeatedPattern }
  | { kind: 'continue'; memory: FeedMemory }
  | { kind: 'prompt' }

interface MemoryTimelineFeedProps {
  memories: FeedMemory[]
  pattern: RepeatedPattern | null
}

// ── Formatting helpers ──────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatYear(dateStr: string): string {
  return String(new Date(dateStr).getFullYear())
}

function formatPeriodRange(start: string, end: string | null): string {
  const startY = formatYear(start)
  if (!end) return `${startY}–oggi`
  const endY = formatYear(end)
  return startY === endY ? startY : `${startY}–${endY}`
}

// ── Block composition ──────────────────────────────────────────────────────

/**
 * Takes the raw memory list + optional pattern and interleaves them
 * into a single TimelineBlock[] following a fixed rhythm.
 *
 * Rhythm:
 *   - memories flow in chronological order (desc)
 *   - after the 3rd memory: insert pattern block (if present)
 *   - after the 8th memory: insert prompt block
 *   - after the 14th memory: insert continue block
 *   - after the 20th memory: insert a second pattern block (if present)
 *
 * Memories with end_date render as period blocks in place.
 */
function composeBlocks(memories: FeedMemory[], pattern: RepeatedPattern | null): TimelineBlock[] {
  const blocks: TimelineBlock[] = []
  const limit = Math.min(memories.length, 30)

  let patternInsertedCount = 0
  let promptInserted = false
  let continueInserted = false

  for (let i = 0; i < limit; i++) {
    const m = memories[i]
    if (m.end_date) {
      blocks.push({ kind: 'period', period: m })
    } else {
      blocks.push({ kind: 'memory', memory: m })
    }

    const position = i + 1 // 1-indexed

    if (position === 3 && pattern && patternInsertedCount === 0) {
      blocks.push({ kind: 'pattern', pattern })
      patternInsertedCount++
    }

    if (position === 8 && !promptInserted) {
      blocks.push({ kind: 'prompt' })
      promptInserted = true
    }

    if (position === 14 && !continueInserted && m) {
      blocks.push({ kind: 'continue', memory: m })
      continueInserted = true
    }
  }

  // If the list was very short (< 8) we still want one prompt in view
  if (!promptInserted && limit >= 3) {
    blocks.push({ kind: 'prompt' })
  }

  return blocks
}

// ── Individual block components ─────────────────────────────────────────────

function MemoryBlock({ memory }: { memory: FeedMemory }) {
  return (
    <Link
      href={`/memories/${memory.id}`}
      className="block group py-1"
    >
      <div className="flex gap-4">
        {memory.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={memory.previewUrl}
            alt=""
            className="w-20 h-20 rounded-xl object-cover shrink-0"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-muted shrink-0" />
        )}
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <p className="text-[15px] font-semibold text-foreground/85 leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
            {memory.title}
          </p>
          <p className="text-[11px] text-muted-foreground/50 mt-1.5">
            {formatDate(memory.start_date)}
            {memory.location_name && <span> · {memory.location_name}</span>}
          </p>
        </div>
      </div>
    </Link>
  )
}

function PeriodBlock({ period }: { period: FeedMemory }) {
  return (
    <Link
      href={`/memories/${period.id}`}
      className="block group py-1"
    >
      <p className="text-[10px] text-muted-foreground/35 lowercase tracking-wide">
        capitolo
      </p>
      <p className="text-[19px] font-semibold text-foreground/90 leading-tight mt-1.5 group-hover:text-foreground transition-colors">
        {period.title}
      </p>
      <p className="text-[12px] text-muted-foreground/50 mt-1">
        {formatPeriodRange(period.start_date, period.end_date)}
        {period.location_name && <span> · {period.location_name}</span>}
      </p>
      <p className="text-[12px] text-muted-foreground/55 mt-3 group-hover:text-foreground transition-colors">
        Vedi questo periodo →
      </p>
    </Link>
  )
}

function PatternBlock({ pattern }: { pattern: RepeatedPattern }) {
  const sentence =
    pattern.kind === 'location'
      ? `Sei stato ${pattern.count} volte a ${pattern.label}.`
      : `Hai salvato ${pattern.count} momenti in ${pattern.label}.`

  return (
    <div className="py-2">
      <p className="text-[10px] text-muted-foreground/35 lowercase tracking-wide">
        questo torna
      </p>
      <p className="text-[17px] font-medium text-foreground/85 leading-snug mt-1.5">
        {sentence}
      </p>
      <div className="flex items-center gap-5 mt-3">
        <Link
          href={pattern.href}
          className="text-[12px] text-foreground/70 hover:text-foreground transition-colors"
        >
          Rivedili →
        </Link>
        <Link
          href="/memories/new"
          className="text-[12px] text-muted-foreground/55 hover:text-foreground transition-colors"
        >
          Aggiungine un altro
        </Link>
      </div>
    </div>
  )
}

function ContinueBlock({ memory }: { memory: FeedMemory }) {
  return (
    <div className="py-2">
      <p className="text-[15px] italic text-foreground/55 leading-snug">
        Questo momento può continuare.
      </p>
      <Link
        href={`/memories/${memory.id}`}
        className="inline-block mt-3 text-[12px] text-foreground/70 hover:text-foreground transition-colors"
      >
        Continua →
      </Link>
    </div>
  )
}

// ── The feed itself ─────────────────────────────────────────────────────────

export function MemoryTimelineFeed({ memories, pattern }: MemoryTimelineFeedProps) {
  const blocks = composeBlocks(memories, pattern)

  if (blocks.length === 0) return null

  return (
    <div className="mt-10 space-y-10">
      {blocks.map((block, idx) => {
        switch (block.kind) {
          case 'memory':
            return (
              <div key={`mem-${block.memory.id}-${idx}`} className="px-5">
                <MemoryBlock memory={block.memory} />
              </div>
            )
          case 'period':
            return (
              <div key={`per-${block.period.id}-${idx}`} className="px-5">
                <PeriodBlock period={block.period} />
              </div>
            )
          case 'pattern':
            return (
              <div key={`pat-${idx}`} className="px-5">
                <PatternBlock pattern={block.pattern} />
              </div>
            )
          case 'continue':
            return (
              <div key={`con-${block.memory.id}-${idx}`} className="px-5">
                <ContinueBlock memory={block.memory} />
              </div>
            )
          case 'prompt':
            // HomeMemoryPrompt renders its own px-4 wrapper — let it handle its own padding
            return <HomeMemoryPrompt key={`pro-${idx}`} />
        }
      })}
    </div>
  )
}

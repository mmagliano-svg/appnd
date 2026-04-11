import Link from 'next/link'
import { HomeMemoryPrompt } from './HomeMemoryPrompt'
import type { RepeatedPattern } from '@/actions/home'

/**
 * MemoryTimelineFeed
 *
 * A single continuous vertical flow that replaces the old dashboard
 * sections. Every memory carries an importance score that drives its
 * rendering size (LARGE / MEDIUM / SMALL), so the eye weights some
 * moments more than others instead of reading the feed as a uniform
 * list of rows.
 *
 * Block types:
 *   1. memory    — a single moment, rendered in one of three sizes
 *   2. period    — a life chapter with duration (2018–2020)
 *   3. pattern   — a repeated place/people/category
 *   4. continue  — a soft "questo momento può continuare" nudge
 *   5. prompt    — one rare memory activation prompt
 *
 * Importance scoring is pure client-side, rule-based, no AI, no extra
 * queries. It reads only data already returned by getUserMemories.
 */

export interface FeedMemory {
  id: string
  title: string
  start_date: string
  end_date: string | null
  location_name: string | null
  previewUrl: string | null
  // ── Importance signals (from existing memory data) ──────────────────────
  photoCount: number
  hasDescription: boolean
  isFirstTime: boolean
  isAnniversary: boolean
  isPartOfPeriod: boolean
}

type MemorySize = 'large' | 'medium' | 'small'

type TimelineBlock =
  | { kind: 'memory'; memory: FeedMemory; size: MemorySize }
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

// ── Importance scoring ─────────────────────────────────────────────────────

/**
 * Rule-based score from 0 to 8 based on already-available memory signals.
 * No new backend, no AI. Higher score → visually larger rendering.
 */
function importanceScore(m: FeedMemory): number {
  let score = 0
  if (m.previewUrl) score += 2            // has hero image
  if (m.photoCount >= 2) score += 1       // has multiple photos
  if (m.hasDescription) score += 1        // the user took time to write
  if (m.isFirstTime) score += 2           // "first time" is always important
  if (m.isAnniversary) score += 1         // anniversaries recur with weight
  if (m.isPartOfPeriod) score += 1        // linked to a life chapter
  return score
}

function memorySize(m: FeedMemory): MemorySize {
  const score = importanceScore(m)
  if (score >= 5) return 'large'
  if (score >= 2) return 'medium'
  return 'small'
}

// ── Block composition ──────────────────────────────────────────────────────

/**
 * Interleaves memories, patterns, prompts and continue nudges into one flow.
 *
 * Order stays chronological for most items (users expect time to flow). The
 * importance layer operates on SIZE, not position — so a key moment is still
 * at its real date but the eye sees it first because it occupies more space.
 *
 * Fixed rhythm slots:
 *   - after the 3rd memory: insert pattern block (if present)
 *   - after the 8th memory: insert prompt block
 *   - after the 14th memory: insert continue block (anchored to that memory)
 */
function composeBlocks(memories: FeedMemory[], pattern: RepeatedPattern | null): TimelineBlock[] {
  const blocks: TimelineBlock[] = []
  const limit = Math.min(memories.length, 30)

  let patternInserted = false
  let promptInserted = false
  let continueInserted = false

  for (let i = 0; i < limit; i++) {
    const m = memories[i]
    if (m.end_date) {
      blocks.push({ kind: 'period', period: m })
    } else {
      blocks.push({ kind: 'memory', memory: m, size: memorySize(m) })
    }

    const position = i + 1 // 1-indexed

    if (position === 3 && pattern && !patternInserted) {
      blocks.push({ kind: 'pattern', pattern })
      patternInserted = true
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

  // If the list is short, make sure one prompt is still present.
  if (!promptInserted && limit >= 3) {
    blocks.push({ kind: 'prompt' })
  }

  return blocks
}

// ── Memory blocks — three visual sizes ──────────────────────────────────────

function LargeMemoryBlock({ memory }: { memory: FeedMemory }) {
  return (
    <Link href={`/memories/${memory.id}`} className="block group">
      {memory.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={memory.previewUrl}
          alt=""
          className="w-full rounded-2xl object-cover"
          style={{ aspectRatio: '4/3', maxHeight: 420 }}
          loading="lazy"
          draggable={false}
        />
      ) : (
        <div className="w-full rounded-2xl bg-muted" style={{ aspectRatio: '4/3', maxHeight: 420 }} />
      )}
      <div className="mt-4">
        <p className="text-[21px] font-semibold text-foreground/90 leading-tight group-hover:text-foreground transition-colors">
          {memory.title}
        </p>
        <p className="text-[12px] text-muted-foreground/55 mt-1.5">
          {formatDate(memory.start_date)}
          {memory.location_name && <span> · {memory.location_name}</span>}
        </p>
      </div>
    </Link>
  )
}

// Medium blocks have three layout variants so the feed doesn't read as a
// uniform list of identical rows. Variant is derived deterministically from
// the block's sequential index (1 in 3 is text-only) and a stable hash of the
// memory id (drives weight + extra spacing).
type MediumVariant = {
  layout: 'thumb' | 'text'
  weight: 'medium' | 'semibold'
  extraTopSpacing: boolean
}

function idHash(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) & 0xffff
  }
  return h
}

function computeMediumVariant(index: number, id: string): MediumVariant {
  // Every 3rd medium item becomes text-only (stronger title, no thumbnail).
  const layout: MediumVariant['layout'] = index % 3 === 2 ? 'text' : 'thumb'
  // Alternate weight between adjacent thumb items so they don't stack identically.
  const weight: MediumVariant['weight'] = index % 2 === 0 ? 'semibold' : 'medium'
  // ~20 % of items get a slightly larger top margin — irregular cadence.
  const extraTopSpacing = idHash(id) % 5 === 0
  return { layout, weight, extraTopSpacing }
}

function MediumMemoryBlock({ memory, variant }: { memory: FeedMemory; variant: MediumVariant }) {
  if (variant.layout === 'text') {
    // Text-only variant — no thumbnail, stronger title, a touch more air.
    return (
      <Link href={`/memories/${memory.id}`} className="block group py-1">
        <p className="text-[18px] font-semibold text-foreground/88 leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
          {memory.title}
        </p>
        <p className="text-[12px] text-muted-foreground/55 mt-1.5">
          {formatDate(memory.start_date)}
          {memory.location_name && <span> · {memory.location_name}</span>}
        </p>
      </Link>
    )
  }

  // Thumb variant — standard 96px thumbnail, variable title weight.
  const titleWeight = variant.weight === 'semibold' ? 'font-semibold' : 'font-medium'
  return (
    <Link href={`/memories/${memory.id}`} className="block group">
      <div className="flex gap-4">
        {memory.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={memory.previewUrl}
            alt=""
            className="w-24 h-24 rounded-xl object-cover shrink-0"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="w-24 h-24 rounded-xl bg-muted shrink-0" />
        )}
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <p className={`text-[16px] ${titleWeight} text-foreground/85 leading-snug line-clamp-2 group-hover:text-foreground transition-colors`}>
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

function SmallMemoryBlock({ memory }: { memory: FeedMemory }) {
  // SMALL = quiet memory, not irrelevant data.
  // Readable body text, honest metadata, room to breathe.
  return (
    <Link href={`/memories/${memory.id}`} className="block group py-2">
      <p className="text-[16px] font-medium text-foreground/80 leading-snug line-clamp-1 group-hover:text-foreground transition-colors">
        {memory.title}
      </p>
      <p className="text-[13px] text-muted-foreground/65 mt-1">
        {formatDate(memory.start_date)}
        {memory.location_name && <span> · {memory.location_name}</span>}
      </p>
    </Link>
  )
}

// ── Period block ───────────────────────────────────────────────────────────

function PeriodBlock({ period }: { period: FeedMemory }) {
  // Period = structural chapter in the user's life, not a memory item.
  // Clean text block: larger title, more visible date range, lighter
  // CTA. The chapter rhythm (extra top margin) lives on the outer
  // wrapper in the feed render loop.
  return (
    <Link href={`/memories/${period.id}`} className="block group">
      <p className="text-[23px] font-semibold text-foreground/90 leading-[1.15] tracking-tight group-hover:text-foreground transition-colors">
        {period.title}
      </p>
      <p className="text-[13px] text-muted-foreground/65 mt-2">
        {formatPeriodRange(period.start_date, period.end_date)}
        {period.location_name && <span> · {period.location_name}</span>}
      </p>
      <p className="text-[11px] italic text-muted-foreground/40 mt-4 group-hover:text-muted-foreground/70 transition-colors">
        Vedi →
      </p>
    </Link>
  )
}

// ── Pattern block ──────────────────────────────────────────────────────────

function PatternBlock({ pattern }: { pattern: RepeatedPattern }) {
  // Narrative copy — no "questo torna" eyebrow, no raw count sentence.
  const sentence =
    pattern.kind === 'location'
      ? `${pattern.label} torna spesso nella tua vita.`
      : `${pattern.label} continua a tornare.`

  return (
    <div>
      <p className="text-[18px] italic text-foreground/75 leading-snug">
        {sentence}
      </p>
      <div className="flex items-center gap-5 mt-4">
        <Link
          href={pattern.href}
          className="text-[13px] text-foreground/70 hover:text-foreground transition-colors"
        >
          Rivedili →
        </Link>
        <Link
          href="/memories/new"
          className="text-[13px] text-muted-foreground/55 hover:text-foreground transition-colors"
        >
          Aggiungine un altro
        </Link>
      </div>
    </div>
  )
}

// ── Continue block ─────────────────────────────────────────────────────────

function ContinueBlock({ memory }: { memory: FeedMemory }) {
  return (
    <div>
      <p className="text-[15px] italic text-foreground/55 leading-snug">
        Questo momento può continuare.
      </p>
      <Link
        href={`/memories/${memory.id}`}
        className="inline-block mt-3 text-[13px] text-foreground/70 hover:text-foreground transition-colors"
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

  // Pre-compute the variant for each medium block so the layout feels
  // alive and irregular. Counter is per-medium, not per-block, so the
  // 1-in-3 text-only cadence is stable regardless of periods/patterns
  // interleaved in the flow.
  const mediumVariants = new Map<string, MediumVariant>()
  let mediumIndex = 0
  for (const b of blocks) {
    if (b.kind === 'memory' && b.size === 'medium') {
      mediumVariants.set(b.memory.id, computeMediumVariant(mediumIndex, b.memory.id))
      mediumIndex++
    }
  }

  return (
    <div className="mt-14 space-y-14">
      {blocks.map((block, idx) => {
        switch (block.kind) {
          case 'memory': {
            const variant =
              block.size === 'medium' ? mediumVariants.get(block.memory.id) : undefined
            const wrapperClass = variant?.extraTopSpacing ? 'px-5 pt-4' : 'px-5'
            return (
              <div key={`mem-${block.memory.id}-${idx}`} className={wrapperClass}>
                {block.size === 'large' && <LargeMemoryBlock memory={block.memory} />}
                {block.size === 'medium' && variant && (
                  <MediumMemoryBlock memory={block.memory} variant={variant} />
                )}
                {block.size === 'small' && <SmallMemoryBlock memory={block.memory} />}
              </div>
            )
          }
          case 'period':
            // Chapter break — extra vertical air above and below so the
            // period visually separates from the memories around it.
            return (
              <div key={`per-${block.period.id}-${idx}`} className="px-5 pt-10 pb-4">
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
            // HomeMemoryPrompt renders its own px-4 wrapper.
            return <HomeMemoryPrompt key={`pro-${idx}`} />
        }
      })}
    </div>
  )
}

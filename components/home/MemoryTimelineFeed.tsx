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
  // ── Grouping signals ───────────────────────────────────────────────────
  tags: string[]
}

type MemorySize = 'large' | 'medium' | 'small'

type TimelineBlock =
  | { kind: 'memory'; memory: FeedMemory; size: MemorySize }
  | { kind: 'period'; period: FeedMemory }
  | { kind: 'pattern'; pattern: RepeatedPattern }
  | { kind: 'continue'; memory: FeedMemory }
  | { kind: 'prompt' }
  | { kind: 'cluster'; lead: FeedMemory; continuations: FeedMemory[] }

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
 * Whole-word-ish check against a keyword list. Handles Italian accents
 * correctly and avoids false positives like "primavera" for "prima".
 */
const IMPORTANCE_KEYWORDS = [
  'nascita',
  'matrimonio',
  'primo',
  'prima',
  'figlio',
  'figlia',
  'papà',
  'papa',
  'mamma',
]

/**
 * Hard-override keywords — ANY title containing one of these phrases is
 * forced to LARGE unconditionally, regardless of score. These represent
 * life-defining moments that must NEVER be rendered at small or medium.
 */
const HARD_LARGE_PHRASES = [
  'nascita',
  'prima foto',
  'matrimonio',
  'primo',
  'prima',
  'gravidanza',
]

function hasImportanceKeyword(title: string): boolean {
  const normalized = title.toLowerCase()
  const LETTER_RE = /[a-zàáèéìíòóùú]/
  const isBoundary = (c: string) => c === '' || !LETTER_RE.test(c)

  for (const kw of IMPORTANCE_KEYWORDS) {
    let from = 0
    while (from <= normalized.length) {
      const idx = normalized.indexOf(kw, from)
      if (idx < 0) break
      const before = idx === 0 ? '' : normalized[idx - 1]
      const after = idx + kw.length >= normalized.length ? '' : normalized[idx + kw.length]
      if (isBoundary(before) && isBoundary(after)) return true
      from = idx + 1
    }
  }
  return false
}

function isHardLarge(title: string): boolean {
  const normalized = title.toLowerCase()
  return HARD_LARGE_PHRASES.some((phrase) => normalized.includes(phrase))
}

/**
 * Rule-based score. Semantic meaning weighs more than structural
 * signals so life-defining events always surface above photogenic
 * but minor ones.
 *
 * Weight philosophy:
 *   - semantic keywords:  +3  (was +2)  — life events are the story
 *   - isFirstTime flag:   +3  (was +2)  — "firsts" define chapters
 *   - photo:              +1  (was +2)  — nice but not the point
 *   - description:        +1  (unchanged)
 *   - multi-photo:        removed — doesn't indicate importance
 *   - user emphasis (!):  +1  (unchanged)
 */
function importanceScore(m: FeedMemory): number {
  let score = 0
  // ── Structural signals (lighter) ─────────────────────────────────
  if (m.previewUrl) score += 1            // has a photo
  if (m.hasDescription) score += 1        // the user took time to write
  if (m.isAnniversary) score += 1         // anniversaries recur with weight
  if (m.isPartOfPeriod) score += 1        // linked to a life chapter
  // ── Meaning-first signals (heavier) ──────────────────────────────
  if (m.isFirstTime) score += 3           // "first time" defines life chapters
  if (hasImportanceKeyword(m.title)) score += 3   // life-defining events
  if (m.title.includes('!')) score += 1            // user's own emphasis
  return score
}

function memorySize(m: FeedMemory): MemorySize {
  // ── Hard priority override — life-defining titles are always LARGE ──
  if (isHardLarge(m.title)) return 'large'

  const score = importanceScore(m)
  if (score >= 4) return 'large'
  if (score >= 2) return 'medium'
  return 'small'
}

/**
 * Score used when the rhythm pass needs to PROMOTE a memory to LARGE
 * because we've gone too many steps without a visually heavy anchor.
 * Overweights photos and strong titles vs the base importance score,
 * and also honours the semantic keyword boost so a birth or wedding
 * wins over an unrelated photo memory during the dry-spell fix.
 */
function promotionScore(m: FeedMemory): number {
  return (
    (isHardLarge(m.title) ? 10 : 0) +          // hard-large titles always win promotion
    (hasImportanceKeyword(m.title) ? 3 : 0) +  // life-defining events
    (m.isFirstTime ? 3 : 0) +                  // "firsts" define chapters
    (m.previewUrl ? 2 : 0) +                   // photos help LARGE render well
    (m.title.length >= 20 ? 1 : 0) +           // long title ≈ user took care naming it
    (m.hasDescription ? 1 : 0) +
    (m.isAnniversary ? 1 : 0) +
    (m.isPartOfPeriod ? 1 : 0) +
    (m.title.includes('!') ? 1 : 0)
  )
}

// ── Rhythm enforcement ─────────────────────────────────────────────────────

/**
 * After composition, walks the block list and guarantees that no more than
 * 4 consecutive non-heavy blocks (small or medium memories) appear in a row.
 * A "heavy" block is a pattern, a period, or a large memory — anything that
 * naturally anchors the eye.
 *
 * When the streak of non-heavy blocks hits 5, we promote the highest-
 * -promotionScore medium/small memory within that window to LARGE. This
 * preserves chronological order (nothing moves) and simply rewrites the
 * display size of one block.
 *
 * Result: the feed reads as paragraphs with rhythmic anchors, not a flat
 * list of identical rows.
 */
function isHeavyBlock(b: TimelineBlock): boolean {
  if (b.kind === 'period' || b.kind === 'pattern' || b.kind === 'cluster') return true
  if (b.kind === 'memory' && b.size === 'large') return true
  return false
}

function enforceRhythm(blocks: TimelineBlock[]): TimelineBlock[] {
  const result = blocks.slice() // mutate a copy
  const MAX_STREAK = 4 // promote when a 5th non-heavy block would appear

  let streakStart = 0 // index where the current non-heavy streak began

  for (let i = 0; i < result.length; i++) {
    const b = result[i]

    if (isHeavyBlock(b)) {
      streakStart = i + 1
      continue
    }

    // Non-heavy blocks (memory medium/small, continue, prompt) extend the streak.
    const streakLen = i - streakStart + 1
    if (streakLen <= MAX_STREAK) continue

    // We have 5 consecutive non-heavy blocks — promote the best memory
    // within this window to LARGE. Prefer the LATEST tied block so the
    // visual anchor lands at the end of the dry spell.
    let bestIdx = -1
    let bestScore = -1
    for (let j = streakStart; j <= i; j++) {
      const candidate = result[j]
      if (candidate.kind !== 'memory') continue
      if (candidate.size === 'large') continue // shouldn't happen post-reset
      const s = promotionScore(candidate.memory)
      if (s >= bestScore) {
        bestScore = s
        bestIdx = j
      }
    }

    if (bestIdx >= 0) {
      const chosen = result[bestIdx]
      if (chosen.kind === 'memory') {
        result[bestIdx] = { ...chosen, size: 'large' }
        // The promoted block is now heavy → restart the streak right after it.
        streakStart = bestIdx + 1
      }
    }
  }

  return result
}

// ── Life-event cluster detection ───────────────────────────────────────────

/**
 * Keywords that hint a memory belongs to a life-defining event arc — the
 * same list used in importanceScore, plus broader topic words.
 */
const EVENT_ARC_KEYWORDS = [
  'nascita', 'nato', 'nata', 'gravidanza', 'parto',
  'matrimonio', 'nozze', 'sposato', 'sposata',
  'primo', 'prima',
  'figlio', 'figlia',
  'battesimo', 'cresima', 'laurea',
  'trasloco', 'casa nuova',
  'viaggio', 'vacanza', 'vacanze',
]

/** How many days can separate two memories and still be part of the same arc. */
const ARC_TIME_WINDOW_MS = 180 * 24 * 60 * 60 * 1000 // ±6 months

/**
 * Extracts a cheap "topic fingerprint" from a memory: lowercased title
 * words that are in the arc keyword list. Returns an empty array if the
 * memory doesn't match any arc topic — those memories are standalone.
 */
function arcTopics(m: FeedMemory): string[] {
  const normalized = m.title.toLowerCase()
  const hits: string[] = []
  for (const kw of EVENT_ARC_KEYWORDS) {
    if (normalized.includes(kw)) hits.push(kw)
  }
  return hits
}

/**
 * Two memories share an arc when:
 *  1. At least one arc keyword appears in BOTH titles, OR
 *  2. They share the same non-null location_name.
 * AND they are within 6 months of each other.
 */
function sharesArc(a: FeedMemory, b: FeedMemory): boolean {
  const timeDiff = Math.abs(new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
  if (timeDiff > ARC_TIME_WINDOW_MS) return false

  // Same location?
  if (a.location_name && a.location_name === b.location_name) return true

  // Shared keyword?
  const topicsA = arcTopics(a)
  if (topicsA.length === 0) return false
  const topicsB = arcTopics(b)
  return topicsA.some((t) => topicsB.includes(t))
}

/**
 * Pre-pass: walks the chronological memory list and groups consecutive
 * memories that share a life-event arc. Returns a mixed array of
 * standalone memories and cluster objects. Clusters of 1 are emitted
 * as standalone. Preserves chronological order.
 */
type ClusterOrStandalone =
  | { type: 'standalone'; memory: FeedMemory }
  | { type: 'cluster'; lead: FeedMemory; continuations: FeedMemory[] }

function detectClusters(memories: FeedMemory[]): ClusterOrStandalone[] {
  const result: ClusterOrStandalone[] = []
  let i = 0

  while (i < memories.length) {
    const m = memories[i]
    // Skip periods — they render their own block type.
    if (m.end_date) {
      result.push({ type: 'standalone', memory: m })
      i++
      continue
    }

    // Try to start a cluster from this memory.
    const group = [m]
    let j = i + 1
    while (j < memories.length && group.length < 5) {
      const next = memories[j]
      if (next.end_date) break // don't absorb periods
      if (sharesArc(m, next)) {
        group.push(next)
        j++
      } else {
        break
      }
    }

    if (group.length >= 2) {
      result.push({ type: 'cluster', lead: group[0], continuations: group.slice(1) })
      i = j
    } else {
      result.push({ type: 'standalone', memory: m })
      i++
    }
  }

  return result
}

// ── Block composition ──────────────────────────────────────────────────────

/**
 * Interleaves memories, patterns, prompts and continue nudges into one flow.
 * Now also detects life-event clusters so related memories render as a single
 * visual group (lead = LARGE, continuations = compact inline list with a
 * connector line).
 */
function composeBlocks(memories: FeedMemory[], pattern: RepeatedPattern | null): TimelineBlock[] {
  const blocks: TimelineBlock[] = []
  const items = detectClusters(memories.slice(0, 30))

  let patternInserted = false
  let promptInserted = false
  let continueInserted = false
  let memoryCount = 0

  for (const item of items) {
    if (item.type === 'cluster') {
      blocks.push({ kind: 'cluster', lead: item.lead, continuations: item.continuations })
      memoryCount += 1 + item.continuations.length
    } else {
      const m = item.memory
      if (m.end_date) {
        blocks.push({ kind: 'period', period: m })
      } else {
        blocks.push({ kind: 'memory', memory: m, size: memorySize(m) })
      }
      memoryCount++
    }

    if (memoryCount >= 3 && pattern && !patternInserted) {
      blocks.push({ kind: 'pattern', pattern })
      patternInserted = true
    }

    if (memoryCount >= 8 && !promptInserted) {
      blocks.push({ kind: 'prompt' })
      promptInserted = true
    }

    if (memoryCount >= 14 && !continueInserted) {
      const lastMem = item.type === 'cluster' ? item.lead : item.memory
      blocks.push({ kind: 'continue', memory: lastMem })
      continueInserted = true
    }
  }

  if (!promptInserted && memoryCount >= 3) {
    blocks.push({ kind: 'prompt' })
  }

  return enforceRhythm(blocks)
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
  // Still present in the story — visible title, honest metadata, room to breathe.
  return (
    <Link href={`/memories/${memory.id}`} className="block group py-3">
      <p className="text-[16px] font-semibold text-foreground/82 leading-snug line-clamp-2 group-hover:text-foreground transition-colors">
        {memory.title}
      </p>
      <p className="text-[13px] text-muted-foreground/60 mt-1.5">
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

// ── Cluster block — life-event arc ──────────────────────────────────────────

function ClusterBlock({ lead, continuations }: { lead: FeedMemory; continuations: FeedMemory[] }) {
  return (
    <div className="space-y-6">
      {/* Lead memory — always rendered at LARGE scale */}
      <LargeMemoryBlock memory={lead} />

      {/* Continuations — compact inline list, visually subordinate */}
      <div className="pl-4 border-l-2 border-border/20 space-y-4">
        {continuations.map((c) => (
          <Link key={c.id} href={`/memories/${c.id}`} className="block group">
            <p className="text-[14px] text-foreground/70 leading-snug group-hover:text-foreground transition-colors">
              {c.title}
            </p>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">
              {formatDate(c.start_date)}
              {c.location_name && <span> · {c.location_name}</span>}
            </p>
          </Link>
        ))}
      </div>

      {/* Connector */}
      <p className="text-[13px] italic text-muted-foreground/45">
        Questo momento può continuare.
      </p>
    </div>
  )
}

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
    <div className="mt-8 space-y-14">
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
          case 'cluster':
            return (
              <div key={`clu-${block.lead.id}-${idx}`} className="px-5">
                <ClusterBlock lead={block.lead} continuations={block.continuations} />
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

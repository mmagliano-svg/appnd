'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import type { TimelineMemory } from '@/actions/memories'
import { CATEGORIES } from '@/lib/constants/categories'
import { getYearHighlight } from '@/lib/utils/year-highlight'

import { getTimelinePeriods } from '@/lib/utils/timeline-periods'

// ── Types ──────────────────────────────────────────────────────────────────

type Level = 'years' | 'months' | 'days'

interface DayGroup {
  day: number
  memories: TimelineMemory[]
}

interface MonthGroup {
  month: number
  totalCount: number
  previewUrls: string[]
  dayGroups: DayGroup[]
}

interface YearGroup {
  year: number
  totalCount: number
  previewUrls: string[]   // [0] = main, [1][2] = secondary
  highlight: string       // short emotional phrase, e.g. "viaggi e amici"
  monthGroups: MonthGroup[]
}

// ── Constants ──────────────────────────────────────────────────────────────

const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile',
  'Maggio', 'Giugno', 'Luglio', 'Agosto',
  'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

const DAYS_FULL = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']

// ── Grouping ───────────────────────────────────────────────────────────────

function groupMemories(memories: TimelineMemory[]): YearGroup[] {
  const yearMap = new Map<number, Map<number, Map<number, TimelineMemory[]>>>()

  for (const m of memories) {
    const [y, mo, d] = m.start_date.split('-').map(Number)
    if (!yearMap.has(y)) yearMap.set(y, new Map())
    const monthMap = yearMap.get(y)!
    if (!monthMap.has(mo)) monthMap.set(mo, new Map())
    const dayMap = monthMap.get(mo)!
    if (!dayMap.has(d)) dayMap.set(d, [])
    dayMap.get(d)!.push(m)
  }

  return Array.from(yearMap.entries())
    .sort(([a], [b]) => b - a)
    .map(([year, monthMap]) => {
      const monthGroups: MonthGroup[] = Array.from(monthMap.entries())
        .sort(([a], [b]) => b - a)
        .map(([month, dayMap]) => {
          const dayGroups: DayGroup[] = Array.from(dayMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([day, mems]) => ({ day, memories: mems }))
          const allMems = dayGroups.flatMap((dg) => dg.memories)
          const previewUrls = allMems
            .map((m) => m.previewUrl)
            .filter(Boolean)
            .slice(0, 2) as string[]
          return { month, totalCount: allMems.length, previewUrls, dayGroups }
        })

      const previewUrls = monthGroups
        .flatMap((mg) => mg.previewUrls)
        .slice(0, 3)

      const allYearMems = monthGroups.flatMap((mg) => mg.dayGroups.flatMap((dg) => dg.memories))
      const totalCount  = monthGroups.reduce((s, mg) => s + mg.totalCount, 0)
      const highlight   = getYearHighlight({
        count:      totalCount,
        tags:       allYearMems.flatMap((m) => m.tags),
        categories: allYearMems.flatMap((m) => m.categories.length ? m.categories : (m.category ? [m.category] : [])),
        titles:     allYearMems.map((m) => m.title),
        year,
      })

      return {
        year,
        totalCount,
        previewUrls,
        highlight,
        monthGroups,
      }
    })
}

// ── Animation config ───────────────────────────────────────────────────────

// Standard ease-out: smooth deceleration, no overshoot
const EASE_ZOOM   = [0.25, 0.46, 0.45, 0.94] as const
const EASE_RETURN = [0.22, 1, 0.36, 1] as const

const VIEW_DURATION  = 0.18
const PHOTO_SPRING   = { type: 'spring' as const, stiffness: 440, damping: 42 }

// View-level transition — subtle scale + fade, no hard cut
// forward  = drill in  (slight zoom in from below)
// backward = drill out (slight zoom out)
function viewVariants(dir: 'forward' | 'backward') {
  if (dir === 'forward') {
    return {
      initial: { opacity: 0, scale: 0.97, y: 6 },
      animate: { opacity: 1, scale: 1,    y: 0 },
      exit:    { opacity: 0, scale: 1.02, y: 0 },
    }
  }
  return {
    initial: { opacity: 0, scale: 1.02, y: 0 },
    animate: { opacity: 1, scale: 1,    y: 0 },
    exit:    { opacity: 0, scale: 0.97, y: 6 },
  }
}

// Stagger: children cascade in after the view zoom lands
const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
}

const staggerItem = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.24, ease: EASE_RETURN },
  },
}

// ── Shared photo tile ──────────────────────────────────────────────────────
// layoutId makes Framer Motion morph this element between its two positions
// (year card → months hero, month card → days hero).

function PhotoTile({
  src,
  layoutId,
  className,
}: {
  src: string | null
  layoutId: string
  className?: string
}) {
  return (
    <motion.div
      layoutId={layoutId}
      className={`bg-muted ${className ?? ''}`}
      transition={PHOTO_SPRING}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          draggable={false}
        />
      ) : null}
    </motion.div>
  )
}

// ── View: Years ────────────────────────────────────────────────────────────
// Time-first: years only, no chapter cards. Each year = full-width image card.

function YearsView({
  groups,
}: {
  groups: YearGroup[]
}) {
  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center py-16">
        Nessun ricordo ancora.
      </p>
    )
  }

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {groups.map((item, idx) => {
        const { year, totalCount, previewUrls, highlight } = item
        const mainUrl       = previewUrls[0] ?? null
        const secondaryUrls = previewUrls.slice(1, 3)
        // Hero = most recent year (first in desc-sorted list)
        const isHero = idx === 0
        const cardH  = isHero ? 'h-72' : 'h-56'

        return (
          <motion.div key={year} variants={staggerItem}>
            <Link
              href={`/timeline/${year}`}
              className="w-full block focus:outline-none active:scale-[0.985] transition-transform duration-150"
            >
              {/* ⚠ overflow-hidden is on the inner wrapper, not the button,
                  so the layoutId photo can animate freely across views */}
              <div className={`relative ${cardH} rounded-3xl overflow-hidden bg-muted`}>

                {/* Collage: dominant left + secondary stack right */}
                {mainUrl && secondaryUrls.length > 0 ? (
                  <div className="flex gap-0.5 h-full">
                    <PhotoTile
                      src={mainUrl}
                      layoutId={`year-photo-${year}`}
                      className="flex-[2] overflow-hidden"
                    />
                    <div className="flex-none w-[90px] flex flex-col gap-0.5">
                      {secondaryUrls.map((url, i) => (
                        <div key={i} className="flex-1 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                            draggable={false}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <PhotoTile
                    src={mainUrl}
                    layoutId={`year-photo-${year}`}
                    className="w-full h-full overflow-hidden"
                  />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                {/* Year + count — bottom left */}
                <div className="absolute bottom-0 left-0 px-5 pb-5 z-10">
                  <p className={`font-bold text-white tracking-tight leading-none tabular-nums ${isHero ? 'text-4xl' : 'text-3xl'}`}>
                    {year}
                  </p>
                  <p className="text-sm text-white/75 mt-1.5 font-medium">
                    {totalCount} {totalCount === 1 ? 'momento' : 'momenti'}
                  </p>
                  <p className="text-white/85 text-sm font-medium mt-1 drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">
                    {highlight}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ── View: Months ───────────────────────────────────────────────────────────

function MonthsView({
  yearGroup,
  onSelect,
}: {
  yearGroup: YearGroup
  onSelect: (month: number) => void
}) {
  const heroUrl = yearGroup.previewUrls[0] ?? null

  return (
    <div>
      {/* Hero — the year's main photo morphs from the card thumbnail into this */}
      <PhotoTile
        src={heroUrl}
        layoutId={`year-photo-${yearGroup.year}`}
        className="w-full h-52 rounded-2xl overflow-hidden mb-6"
      />

      {/* Month cards stagger in after the hero lands */}
      <motion.div
        className="space-y-3"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {yearGroup.monthGroups.map(({ month, totalCount, previewUrls }) => {
          const photoUrl = previewUrls[0] ?? null

          return (
            <motion.div key={month} variants={staggerItem}>
              <button
                onClick={() => onSelect(month)}
                className="relative w-full block rounded-2xl bg-muted group focus:outline-none active:scale-[0.985] transition-transform duration-150"
                style={{ aspectRatio: '16 / 7' }}
              >
                {/* Photo layer — absolute, clipped inside its own wrapper */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  {photoUrl ? (
                    <PhotoTile
                      src={photoUrl}
                      layoutId={`month-photo-${yearGroup.year}-${month}`}
                      className="absolute inset-0 w-full h-full overflow-hidden"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-muted-foreground/10 to-muted" />
                  )}
                  {/* Gradient — slightly stronger for legibility */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/82 via-black/50 to-transparent" />
                </div>

                {/* Label */}
                <div className="absolute inset-0 flex items-center px-5 z-10">
                  <div>
                    <p className="text-white text-2xl font-extrabold tracking-tight leading-none">
                      {MONTHS_IT[month - 1]}
                    </p>
                    <p className="text-white/60 text-sm mt-2 font-medium">
                      {totalCount === 1 ? 'Un momento vissuto' : `${totalCount} momenti vissuti`}
                    </p>
                  </div>
                </div>

                <div className="absolute right-4 inset-y-0 flex items-center z-10">
                  <svg
                    className="w-5 h-5 text-white/40 group-hover:text-white/75 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.75}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}

// ── View: Days ─────────────────────────────────────────────────────────────

function DaysView({
  monthGroup,
  year,
  memIdToPeriod,
}: {
  monthGroup: MonthGroup
  year: number
  memIdToPeriod: Map<string, string>
}) {
  const heroUrl = monthGroup.previewUrls[0] ?? null

  return (
    <div>
      {/* Hero — the month's photo morphs from its card into this */}
      {heroUrl && (
        <PhotoTile
          src={heroUrl}
          layoutId={`month-photo-${year}-${monthGroup.month}`}
          className="w-full h-44 rounded-2xl overflow-hidden mb-6"
        />
      )}

      {/* Micro intro */}
      <div className="mb-8 mt-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/40 mb-1.5">
          {MONTHS_IT[monthGroup.month - 1]} {year}
        </p>
        <p className="text-sm text-muted-foreground/60 leading-snug">
          I momenti di questo mese
        </p>
      </div>

      {/* Day groups stagger in */}
      <motion.div
        className="space-y-14"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {(() => {
          let lastPeriodTitle = ''
          let isFirstPeriod   = true
          return monthGroup.dayGroups.map(({ day, memories }) => {
          const date        = new Date(year, monthGroup.month - 1, day)
          const dayOfWeek   = DAYS_FULL[date.getDay()]
          const monthName   = MONTHS_IT[monthGroup.month - 1].toLowerCase()

          const periodTitle      = memIdToPeriod.get(memories[0]?.id ?? '')
          const showPeriodHeader = !!periodTitle && periodTitle !== lastPeriodTitle
          if (periodTitle) lastPeriodTitle = periodTitle
          const isFirst = isFirstPeriod
          if (showPeriodHeader) isFirstPeriod = false

          return (
            <motion.div key={day} variants={staggerItem}>
              {showPeriodHeader && (
                <div className={isFirst ? 'mb-5' : 'mt-12 mb-5'}>
                  <div className="w-full h-px bg-foreground/10 mb-3" />
                  <p className="text-xs font-semibold tracking-wide text-foreground/80">
                    {periodTitle}
                  </p>
                </div>
              )}
              <div className="flex items-baseline gap-2 mb-5">
                <span className="text-2xl font-bold tabular-nums leading-none">{day}</span>
                <span className="text-sm text-muted-foreground font-medium">
                  {monthName} · {dayOfWeek}
                </span>
              </div>

              <div className="space-y-3">
                {memories.map((m) =>
                  m.previewUrl ? (
                    <Link
                      key={m.id}
                      href={`/memories/${m.id}`}
                      className="block rounded-2xl overflow-hidden bg-muted group active:scale-[0.99] transition-transform"
                    >
                      <div className="aspect-[16/9] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.previewUrl}
                          alt=""
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          loading="lazy"
                          draggable={false}
                        />
                      </div>
                      <div className="p-4 space-y-1">
                        <div className="flex items-start gap-2">
                          <p className="font-semibold text-base leading-snug line-clamp-2 flex-1">
                            {m.title}
                          </p>
                          <div className="flex flex-col gap-1 shrink-0 mt-0.5">
                            {m.end_date && (
                              <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 border border-border rounded-full px-2 py-0.5">
                                Periodo
                              </span>
                            )}
                            {m.is_first_time && (
                              <span className="text-[9px] font-semibold rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400">
                                ✦ Prima volta
                              </span>
                            )}
                            {m.is_anniversary && (
                              <span className="text-[9px] font-semibold rounded-full bg-violet-50 border border-violet-200 px-2 py-0.5 text-violet-700 dark:bg-violet-950/40 dark:border-violet-800 dark:text-violet-400">
                                ↺ Ricorrenza
                              </span>
                            )}
                          </div>
                        </div>
                        {m.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {m.description}
                          </p>
                        )}
                        {m.location_name && (
                          <p className="text-xs text-muted-foreground/60 flex items-center gap-1">
                            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {m.location_name}
                          </p>
                        )}
                      </div>
                    </Link>
                  ) : m.end_date ? (
                    <Link
                      key={m.id}
                      href={`/memories/${m.id}`}
                      className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-muted/20 hover:bg-muted/40 active:scale-[0.99] transition-all group"
                    >
                      <div className="w-1 self-stretch rounded-full bg-foreground/15 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
                          Periodo
                        </p>
                        <p className="font-semibold text-sm leading-snug">{m.title}</p>
                        {m.location_name && (
                          <p className="text-xs text-muted-foreground/60 mt-1 truncate">
                            {m.location_name}
                          </p>
                        )}
                      </div>
                      <svg
                        className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 transition-colors"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ) : (
                    <Link
                      key={m.id}
                      href={`/memories/${m.id}`}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-muted/40 hover:bg-muted/70 active:scale-[0.99] transition-all group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-muted shrink-0 flex items-center justify-center">
                        <svg className="w-4 h-4 text-muted-foreground/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate leading-tight">{m.title}</p>
                        {m.location_name && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{m.location_name}</p>
                        )}
                      </div>
                      <svg
                        className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground shrink-0 transition-colors"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )
                )}
              </div>
            </motion.div>
          )
        })
        })()}
      </motion.div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

interface Props {
  memories: TimelineMemory[]
  /** When set, the timeline is in anchor-filter mode: custom title, subtitle, no category chips */
  anchorLabel?: string
}

export function TimelineAnimated({ memories, anchorLabel }: Props) {
  const [level,           setLevel]           = useState<Level>('years')
  const [selectedYear,    setSelectedYear]    = useState<number | null>(null)
  const [selectedMonth,   setSelectedMonth]   = useState<number | null>(null)
  const [dir,             setDir]             = useState<'forward' | 'backward'>('forward')
  const [activeCategory,  setActiveCategory]  = useState<string | null>(null)

  // ── Scroll position store ──────────────────────────────────────────────
  const scrollStore   = useRef<Record<string, number>>({})
  const pendingScroll = useRef<number | null>(null)

  useEffect(() => {
    if (pendingScroll.current !== null) {
      const target = pendingScroll.current
      pendingScroll.current = null
      requestAnimationFrame(() => {
        window.scrollTo({ top: target, behavior: 'instant' })
      })
    }
  }, [level])

  // ── Data ───────────────────────────────────────────────────────────────

  // Periods = memories with an end_date; events = all others
  const allPeriods = useMemo(() => memories.filter((m) => Boolean(m.end_date)), [memories])
  const allEvents  = useMemo(() => memories.filter((m) => !m.end_date), [memories])

  // Count how many events belong to each period
  const childCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of allEvents) {
      if (e.parent_period_id) {
        counts[e.parent_period_id] = (counts[e.parent_period_id] ?? 0) + 1
      }
    }
    return counts
  }, [allEvents])

  // Categories actually present in the dataset (events only, for filter chips)
  const usedCategories = useMemo(() => {
    const used = new Set(allEvents.flatMap((m) => m.categories.length ? m.categories : (m.category ? [m.category] : [])))
    return CATEGORIES.filter((c) => used.has(c.value))
  }, [allEvents])

  // Apply category filter to events only (periods always shown)
  const filteredEvents = useMemo(() => {
    if (!activeCategory) return allEvents
    return allEvents.filter((m) => {
      const cats = m.categories.length ? m.categories : (m.category ? [m.category] : [])
      return cats.includes(activeCategory)
    })
  }, [allEvents, activeCategory])

  const yearGroups   = useMemo(() => groupMemories(filteredEvents), [filteredEvents])
  const currentYear  = yearGroups.find((y) => y.year === selectedYear) ?? null
  const currentMonth = currentYear?.monthGroups.find((m) => m.month === selectedMonth) ?? null

  // Narrative period labels — memoryId → periodTitle, for DaysView injection
  const memIdToPeriod = useMemo<Map<string, string>>(() => {
    const map = new Map<string, string>()
    for (const p of getTimelinePeriods(filteredEvents)) {
      for (const id of p.memoryIds) map.set(id, p.title)
    }
    return map
  }, [filteredEvents])

  // ── Navigation ─────────────────────────────────────────────────────────

  const goToYear = useCallback((year: number) => {
    scrollStore.current['years'] = window.scrollY
    setDir('forward')
    setSelectedYear(year)
    setSelectedMonth(null)
    setLevel('months')
    pendingScroll.current = 0          // forward: start from top of months view
  }, [])

  const goToMonth = useCallback(
    (month: number) => {
      if (selectedYear !== null) {
        scrollStore.current[`months-${selectedYear}`] = window.scrollY
      }
      setDir('forward')
      setSelectedMonth(month)
      setLevel('days')
      pendingScroll.current = 0        // forward: start from top of days view
    },
    [selectedYear],
  )

  const goBack = useCallback(() => {
    setDir('backward')
    if (level === 'days') {
      pendingScroll.current = scrollStore.current[`months-${selectedYear}`] ?? 0
      setSelectedMonth(null)
      setLevel('months')
    } else {
      pendingScroll.current = scrollStore.current['years'] ?? 0
      setSelectedYear(null)
      setLevel('years')
    }
  }, [level, selectedYear])

  // Jump straight to years from any depth (used by breadcrumb)
  const jumpToYears = useCallback(() => {
    setDir('backward')
    pendingScroll.current = scrollStore.current['years'] ?? 0
    setSelectedYear(null)
    setSelectedMonth(null)
    setLevel('years')
  }, [])

  // ── Header text ────────────────────────────────────────────────────────

  const title =
    level === 'years'  ? (anchorLabel ?? 'Timeline')
    : level === 'months' ? String(selectedYear)
    : MONTHS_IT[(selectedMonth ?? 1) - 1]

  const subtitle = level === 'days' ? String(selectedYear) : undefined

  // ── Render ─────────────────────────────────────────────────────────────

  const vars = viewVariants(dir)

  return (
    <LayoutGroup>
      {/* ── Dynamic header ───────────────────────────────────────────────── */}
      <div className="pt-10 pb-6">

        {/* Back button — visible when not at root */}
        <AnimatePresence mode="wait">
          {level !== 'years' && (
            <motion.button
              key="back-btn"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.14 }}
              onClick={goBack}
              className="flex items-center gap-1 mb-3 text-muted-foreground hover:text-foreground transition-colors -ml-0.5"
              aria-label="Indietro"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">
                {level === 'months' ? 'Tutti gli anni' : String(selectedYear)}
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Title + subtitle */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.h1
              key={title}
              initial={{ opacity: 0, y: dir === 'forward' ? -8 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{   opacity: 0, y: dir === 'forward' ?  8 : -8 }}
              transition={{ duration: 0.14, ease: 'easeInOut' }}
              className="text-3xl font-bold tracking-tight leading-none"
            >
              {title}
            </motion.h1>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {level === 'years' && (
              <motion.p
                key="subtitle-years"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                className="text-sm text-muted-foreground mt-1.5"
              >
                {anchorLabel
                  ? 'I ricordi che tornano in questo momento.'
                  : activeCategory
                    ? `${usedCategories.find(c => c.value === activeCategory)?.label ?? activeCategory} · filtrando`
                    : 'La tua storia nel tempo.'}
              </motion.p>
            )}
            {level === 'months' && (
              <motion.p
                key="subtitle-months"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                className="text-sm text-muted-foreground mt-1.5"
              >
                Scegli un mese
              </motion.p>
            )}
            {level === 'days' && selectedYear && (
              <motion.p
                key={`subtitle-days-${selectedYear}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                className="text-sm text-muted-foreground mt-1.5"
              >
                {selectedYear}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Breadcrumb — visible when not at root ────────────────────────── */}
      <AnimatePresence>
        {level !== 'years' && (
          <motion.nav
            key={`breadcrumb-${level}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/50 mb-5"
            aria-label="Percorso"
          >
            <button
              onClick={jumpToYears}
              className="hover:text-muted-foreground transition-colors"
            >
              Timeline
            </button>
            <span>›</span>
            {level === 'months' && (
              <span className="text-foreground/60 font-medium">{selectedYear}</span>
            )}
            {level === 'days' && (
              <>
                <button
                  onClick={goBack}
                  className="hover:text-muted-foreground transition-colors"
                >
                  {selectedYear}
                </button>
                <span>›</span>
                <span className="text-foreground/60 font-medium">
                  {MONTHS_IT[(selectedMonth ?? 1) - 1]}
                </span>
              </>
            )}
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ── Category filter chips — years level only ─────────────────────── */}
      <AnimatePresence>
        {level === 'years' && !anchorLabel && usedCategories.length >= 2 && (
          <motion.div
            key="cat-filters"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex gap-2 overflow-x-auto pb-5 -mx-4 px-4"
            style={{ scrollbarWidth: 'none' }}
          >
            <button
              onClick={() => setActiveCategory(null)}
              className={`flex-none rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                !activeCategory
                  ? 'bg-black text-white'
                  : 'bg-muted text-foreground/70 hover:text-foreground'
              }`}
            >
              Tutti
            </button>
            {usedCategories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(activeCategory === cat.value ? null : cat.value)}
                className={`flex-none rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  activeCategory === cat.value
                    ? 'bg-black text-white'
                    : 'bg-muted text-foreground/70 hover:text-foreground'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Level views — shared-element zoom ───────────────────────────── */}
      {/*
        mode="popLayout": both old and new views are briefly in the DOM
        at the same time, which is what makes layoutId photo transitions work —
        Framer Motion can read both positions and animate between them.
      */}
      <AnimatePresence mode="popLayout" custom={dir}>
        {level === 'years' && (
          <motion.div
            key="years"
            {...vars}
            transition={{ duration: VIEW_DURATION, ease: EASE_ZOOM }}
          >
            {anchorLabel && yearGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-16 pb-8 text-center gap-3">
                <p className="text-muted-foreground text-sm">Ancora nessun ricordo.</p>
                <p className="text-muted-foreground/50 text-xs">Questo momento può iniziare da qui.</p>
                <Link
                  href="/memories/new"
                  className="mt-2 rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-foreground/[0.05] transition-colors"
                >
                  Crea un ricordo
                </Link>
              </div>
            ) : (
              <YearsView
                groups={yearGroups}
              />
            )}
          </motion.div>
        )}

        {level === 'months' && currentYear && (
          <motion.div
            key="months"
            {...vars}
            transition={{ duration: VIEW_DURATION, ease: EASE_ZOOM }}
          >
            <MonthsView yearGroup={currentYear} onSelect={goToMonth} />
          </motion.div>
        )}

        {level === 'days' && currentMonth && selectedYear !== null && (
          <motion.div
            key="days"
            {...vars}
            transition={{ duration: VIEW_DURATION, ease: EASE_ZOOM }}
          >
            <DaysView monthGroup={currentMonth} year={selectedYear} memIdToPeriod={memIdToPeriod} />
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  )
}

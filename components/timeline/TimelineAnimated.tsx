'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import type { TimelineMemory } from '@/actions/memories'

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
  monthGroups: MonthGroup[]
}

// ── Constants ──────────────────────────────────────────────────────────────

const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile',
  'Maggio', 'Giugno', 'Luglio', 'Agosto',
  'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
]

const DAYS_SHORT = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']

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

      return {
        year,
        totalCount: monthGroups.reduce((s, mg) => s + mg.totalCount, 0),
        previewUrls,
        monthGroups,
      }
    })
}

// ── Animation config ───────────────────────────────────────────────────────

// Custom easing: fast start, decelerate — mimics native iOS zoom
const EASE_ZOOM   = [0.32, 0.72, 0, 1] as const
const EASE_RETURN = [0.22, 1, 0.36, 1] as const

const VIEW_DURATION  = 0.3
const PHOTO_SPRING   = { type: 'spring' as const, stiffness: 440, damping: 42 }

// View-level transition: forward = zoom IN (content emerges from depth)
//                        backward = zoom OUT (content recedes into depth)
function viewVariants(dir: 'forward' | 'backward') {
  if (dir === 'forward') {
    return {
      initial: { opacity: 0, scale: 0.91, y: 16 },
      animate: { opacity: 1, scale: 1,    y: 0  },
      exit:    { opacity: 0, scale: 1.06, y: 0  },
    }
  }
  return {
    initial: { opacity: 0, scale: 1.06, y: 0  },
    animate: { opacity: 1, scale: 1,    y: 0  },
    exit:    { opacity: 0, scale: 0.91, y: 16 },
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

function YearsView({
  groups,
  onSelect,
}: {
  groups: YearGroup[]
  onSelect: (year: number) => void
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
      className="space-y-3"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {groups.map(({ year, totalCount, previewUrls }, index) => {
        const mainUrl        = previewUrls[0] ?? null
        const secondaryUrls  = previewUrls.slice(1, 3)
        const isHero         = index === 0
        const collageH       = isHero ? 'h-72' : 'h-44'

        return (
          <motion.div key={year} variants={staggerItem}>
            <button
              onClick={() => onSelect(year)}
              // ⚠ No overflow-hidden here — the photo wrapper clips itself.
              // This lets layoutId animate the photo tile without being clipped
              // by the card's border-radius while it morphs to the months hero.
              className="w-full block text-left rounded-2xl bg-muted group focus:outline-none active:scale-[0.985] transition-transform duration-150"
            >
              {/* Photo section — clips to rounded-top only */}
              <div className={`${collageH} rounded-t-2xl overflow-hidden`}>
                {secondaryUrls.length > 0 && mainUrl ? (
                  <div className="flex gap-0.5 h-full">
                    <PhotoTile
                      src={mainUrl}
                      layoutId={`year-photo-${year}`}
                      className="flex-[1.8] overflow-hidden"
                    />
                    <div className="flex-none w-[88px] flex flex-col gap-0.5">
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
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3.5">
                <div>
                  <p
                    className={`font-bold tracking-tight tabular-nums leading-none ${
                      isHero ? 'text-3xl' : 'text-2xl'
                    }`}
                  >
                    {year}
                  </p>
                  <p
                    className={`text-muted-foreground ${
                      isHero ? 'text-sm mt-1.5' : 'text-xs mt-1'
                    }`}
                  >
                    {totalCount} {totalCount === 1 ? 'momento' : 'momenti'}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-muted-foreground/35 group-hover:text-muted-foreground/60 transition-colors"
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
                  {/* Gradient so text is legible on any photo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
                </div>

                {/* Label */}
                <div className="absolute inset-0 flex items-center px-5 z-10">
                  <div>
                    <p className="text-white text-2xl font-bold tracking-tight leading-none">
                      {MONTHS_IT[month - 1]}
                    </p>
                    <p className="text-white/55 text-sm mt-1.5">
                      {totalCount} {totalCount === 1 ? 'momento' : 'momenti'}
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
}: {
  monthGroup: MonthGroup
  year: number
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

      {/* Day groups stagger in */}
      <motion.div
        className="space-y-10"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {monthGroup.dayGroups.map(({ day, memories }) => {
          const date     = new Date(year, monthGroup.month - 1, day)
          const dayLabel = DAYS_SHORT[date.getDay()]

          return (
            <motion.div key={day} variants={staggerItem}>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold tabular-nums">{day}</span>
                <span className="text-sm text-muted-foreground">{dayLabel}</span>
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
        })}
      </motion.div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

interface Props {
  memories: TimelineMemory[]
}

export function TimelineAnimated({ memories }: Props) {
  const [level,         setLevel]         = useState<Level>('years')
  const [selectedYear,  setSelectedYear]  = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [dir,           setDir]           = useState<'forward' | 'backward'>('forward')

  // ── Scroll position store ──────────────────────────────────────────────
  // Save the scroll offset before navigating forward; restore it when going back.
  const scrollStore   = useRef<Record<string, number>>({})
  const pendingScroll = useRef<number | null>(null)

  // Runs after every level change — restores the saved scroll position.
  useEffect(() => {
    if (pendingScroll.current !== null) {
      const target = pendingScroll.current
      pendingScroll.current = null
      // rAF: wait for the DOM to paint the new level before scrolling
      requestAnimationFrame(() => {
        window.scrollTo({ top: target, behavior: 'instant' })
      })
    }
  }, [level])

  // ── Data ───────────────────────────────────────────────────────────────
  const yearGroups   = useMemo(() => groupMemories(memories), [memories])
  const currentYear  = yearGroups.find((y) => y.year === selectedYear) ?? null
  const currentMonth = currentYear?.monthGroups.find((m) => m.month === selectedMonth) ?? null

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

  // ── Header text ────────────────────────────────────────────────────────

  const title =
    level === 'years'  ? 'Timeline'
    : level === 'months' ? String(selectedYear)
    : MONTHS_IT[(selectedMonth ?? 1) - 1]

  const subtitle = level === 'days' ? String(selectedYear) : undefined

  // ── Render ─────────────────────────────────────────────────────────────

  const vars = viewVariants(dir)

  return (
    <LayoutGroup>
      {/* ── Dynamic header ───────────────────────────────────────────────── */}
      <div className="pt-10 pb-8 flex items-center gap-3 min-h-[88px]">
        {/* Back button slides in/out */}
        <AnimatePresence mode="wait">
          {level !== 'years' && (
            <motion.button
              key="back-btn"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              onClick={goBack}
              className="flex-none text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1"
              aria-label="Indietro"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1">
          {/* Title slides up (forward) or down (backward) */}
          <AnimatePresence mode="wait">
            <motion.h1
              key={title}
              initial={{ opacity: 0, y: dir === 'forward' ? -10 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{   opacity: 0, y: dir === 'forward' ?  10 : -10 }}
              transition={{ duration: 0.16, ease: 'easeInOut' }}
              className="text-3xl font-bold tracking-tight leading-none"
            >
              {title}
            </motion.h1>
          </AnimatePresence>

          {/* Static subtitle for year level */}
          {level === 'years' && (
            <p className="text-sm text-muted-foreground mt-1.5">
              La tua storia nel tempo.
            </p>
          )}

          {/* Year sub-label visible when inside a month */}
          <AnimatePresence mode="wait">
            {subtitle && (
              <motion.p
                key={subtitle}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{   opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-sm text-muted-foreground mt-1"
              >
                {subtitle}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

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
            <YearsView groups={yearGroups} onSelect={goToYear} />
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
            <DaysView monthGroup={currentMonth} year={selectedYear} />
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  )
}

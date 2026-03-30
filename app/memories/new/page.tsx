'use client'

import { Suspense, useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createMemoryReturnId, getAllUserTags, getUserPeriods, type PeriodSummary } from '@/actions/memories'
import { getUserGroups, type GroupSummary } from '@/actions/groups'
import { addMediaContribution } from '@/actions/contributions'
import { setMemoryPeople } from '@/actions/persons'
import { PeopleSelector } from '@/components/people/PeopleSelector'
import type { SimplePerson } from '@/actions/persons'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/lib/constants/categories'
import { TagInput } from '@/components/memory/TagInput'
import { getPromptForCategory } from '@/lib/constants/prompts'

function NewMemoryForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const titleRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [uploadStep, setUploadStep] = useState('')
  const [error, setError] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [periods, setPeriods] = useState<PeriodSummary[]>([])
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedPeople, setSelectedPeople] = useState<SimplePerson[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [memoryType, setMemoryType] = useState<'day' | 'period'>('day')
  const [isOngoing, setIsOngoing] = useState(false)
  const [isAnniversary, setIsAnniversary] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')

  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)

  const periodFromUrl = searchParams.get('period')
  const groupFromUrl  = searchParams.get('group')

  useEffect(() => {
    getAllUserTags().then(setAllTags).catch(() => {})
    getUserPeriods().then((loaded) => {
      setPeriods(loaded)
    }).catch(() => {})
    getUserGroups().then((loaded) => {
      setGroups(loaded)
      if (groupFromUrl && loaded.some((g) => g.id === groupFromUrl)) {
        setSelectedGroupId(groupFromUrl)
      }
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-detect the most specific period containing startDate
  const suggestedPeriod = useMemo((): PeriodSummary | null => {
    if (memoryType === 'period' || !startDate || periods.length === 0) return null
    const matches = periods.filter(
      (p) => startDate >= p.start_date && startDate <= p.end_date
    )
    if (matches.length === 0) return null
    return matches.sort(
      (a, b) =>
        (new Date(a.end_date).getTime() - new Date(a.start_date).getTime()) -
        (new Date(b.end_date).getTime() - new Date(b.start_date).getTime())
    )[0]
  }, [startDate, periods, memoryType])

  // Auto-resolved period: URL param takes priority, then date-based suggestion
  const autoParentPeriodId: string | null =
    periodFromUrl ?? suggestedPeriod?.id ?? null

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const isVideo = file.type.startsWith('video/')
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
    setMediaType(isVideo ? 'video' : 'image')
    setError('')
    setTimeout(() => titleRef.current?.focus(), 100)
  }

  function clearMedia() {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUploadStep('')

    const form = new FormData(e.currentTarget)

    try {
      setUploadStep('Creazione ricordo…')
      const memoryId = await createMemoryReturnId({
        title: form.get('title') as string,
        start_date: startDate,
        end_date: memoryType === 'period'
          ? (isOngoing ? '9999-12-31' : endDate || undefined)
          : undefined,
        // Auto-associate period based on date — no manual selection
        parent_period_id: memoryType === 'day' ? autoParentPeriodId : null,
        location_name: form.get('location_name') as string,
        description: form.get('description') as string,
        categories,
        tags,
        is_anniversary: isAnniversary,
        is_first_time: isFirstTime,
        group_id: memoryType === 'day' ? selectedGroupId : null,
      })

      if (selectedPeople.length > 0) {
        await setMemoryPeople(memoryId, selectedPeople.map((p) => p.id))
      }

      if (mediaFile) {
        setUploadStep('Caricamento foto…')
        const supabase = createClient()
        const ext = mediaFile.name.split('.').pop() ?? 'jpg'
        const path = `${memoryId}/${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('memory-media')
          .upload(path, mediaFile, { upsert: false })
        if (uploadError) {
          router.push(`/memories/${memoryId}`)
          return
        }
        const { data: { publicUrl } } = supabase.storage
          .from('memory-media')
          .getPublicUrl(path)
        setUploadStep('Salvataggio…')
        await addMediaContribution(memoryId, publicUrl)
      }

      if (selectedPeople.length > 0) {
        router.push(`/memories/${memoryId}/share`)
      } else {
        router.push(`/memories/${memoryId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Qualcosa è andato storto. Riprova.')
      setLoading(false)
      setUploadStep('')
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const isPeriod = memoryType === 'period'

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-24">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-6 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-11 h-11 -ml-2 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Indietro"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <p className="text-sm font-semibold">Nuovo ricordo</p>
          <div className="w-11" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* ══ ZONA PRINCIPALE ════════════════════════════════════════ */}
          <div className="space-y-5">

            {/* Photo */}
            {!mediaPreview ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-36 rounded-3xl bg-muted/40 hover:bg-muted/60 transition-colors flex flex-col items-center justify-center gap-2"
              >
                <svg className="w-7 h-7 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-muted-foreground/70">Aggiungi una foto</span>
              </button>
            ) : (
              <div className="relative">
                {mediaType === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaPreview}
                    alt=""
                    className="w-full rounded-3xl object-cover max-h-72"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    className="w-full rounded-3xl max-h-72"
                    controls
                    playsInline
                  />
                )}
                <button
                  type="button"
                  onClick={clearMedia}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                  aria-label="Rimuovi media"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/mov,video/quicktime"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Title */}
            <input
              ref={titleRef}
              id="title"
              name="title"
              type="text"
              placeholder="Come vuoi ricordarlo?"
              required
              autoFocus
              className="w-full bg-transparent text-2xl font-bold placeholder:text-muted-foreground/30 focus:outline-none border-b border-border pb-3 leading-snug tracking-tight"
            />

            {/* Date */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  {isPeriod ? 'Quanto è durato?' : 'Quando è successo?'}
                </p>
                <div className="flex rounded-lg border border-border overflow-hidden text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => { setMemoryType('day'); setEndDate('') }}
                    className={`px-3 py-1.5 font-medium transition-colors ${
                      !isPeriod ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    Giorno
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemoryType('period')}
                    className={`px-3 py-1.5 font-medium transition-colors border-l border-border ${
                      isPeriod ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    Periodo
                  </button>
                </div>
              </div>

              {!isPeriod ? (
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={today}
                  required
                  className="w-full bg-transparent text-base text-foreground focus:outline-none border-b border-border pb-2.5 min-h-[44px]"
                />
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Dal</p>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={today}
                        required
                        className="w-full bg-transparent text-sm text-foreground focus:outline-none border-b border-border pb-2 min-h-[44px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Al</p>
                      {isOngoing ? (
                        <div className="flex items-center min-h-[44px] rounded-xl border border-foreground bg-foreground px-3">
                          <span className="text-sm font-medium text-background">ancora in corso</span>
                        </div>
                      ) : (
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate}
                          max={today}
                          className="w-full bg-transparent text-sm text-foreground focus:outline-none border-b border-border pb-2 min-h-[44px]"
                        />
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsOngoing((v) => !v); setEndDate('') }}
                    className={`flex items-center gap-2 text-sm min-h-[44px] transition-colors ${
                      isOngoing ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      isOngoing ? 'bg-foreground border-foreground' : 'border-border'
                    }`}>
                      {isOngoing && (
                        <svg className="w-2.5 h-2.5 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    Ancora in corso
                  </button>
                </div>
              )}

              {/* Auto period hint — subtle, non-editable */}
              {suggestedPeriod && !isPeriod && (
                <p className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
                  <span>↳</span>
                  Parte di <span className="font-medium text-muted-foreground">{suggestedPeriod.title}</span>
                </p>
              )}
            </div>
          </div>

          {/* ── Divider: optional enrichment ─────────────────────── */}
          <p className="text-sm text-muted-foreground/50 text-center">
            Aggiungi altri dettagli (facoltativo)
          </p>

          {/* ══ ZONA ARRICCHIMENTO ═════════════════════════════════════ */}
          <div className="space-y-7">

            {/* Con chi */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Chi era con te?
              </p>
              <PeopleSelector onChange={setSelectedPeople} />
            </div>

            {/* Luogo */}
            <div className="space-y-1.5">
              <label htmlFor="location_name" className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Dove eri?
              </label>
              <input
                id="location_name"
                name="location_name"
                type="text"
                placeholder="Es. Roma, Trastevere"
                className="w-full bg-transparent text-base placeholder:text-muted-foreground/40 focus:outline-none border-b border-border pb-2.5"
              />
            </div>

            {/* Categorie */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Di che tipo è?
              </p>
              <div
                className="flex gap-2 overflow-x-auto pb-1"
                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
              >
                {CATEGORIES.map((cat) => {
                  const active = categories.includes(cat.value)
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() =>
                        setCategories((prev) =>
                          prev.includes(cat.value)
                            ? prev.filter((c) => c !== cat.value)
                            : [...prev, cat.value],
                        )
                      }
                      className={`shrink-0 flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all min-h-[44px] ${
                        active
                          ? 'border-foreground bg-foreground text-background'
                          : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Classification */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                Questo momento è…
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsFirstTime((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all min-h-[44px] ${
                    isFirstTime
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                  }`}
                >
                  ✦ Prima volta
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnniversary((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all min-h-[44px] ${
                    isAnniversary
                      ? 'border-foreground bg-foreground text-background'
                      : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                  }`}
                >
                  ↺ Ricorrenza
                </button>
              </div>
              {isAnniversary && (
                <p className="text-xs text-muted-foreground/60 px-1">
                  Tornerà in evidenza ogni anno nella stessa data.
                </p>
              )}
            </div>

            {/* Racconto */}
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                  Il racconto
                </p>
                <span className="text-[10px] text-muted-foreground/40 italic">facoltativo</span>
              </div>
              <textarea
                id="description"
                name="description"
                placeholder={getPromptForCategory(categories[0] || null)}
                rows={4}
                className="w-full rounded-2xl border border-border/50 bg-muted/20 px-4 py-3 text-base placeholder:text-muted-foreground/40 focus:outline-none focus:border-border focus:bg-background transition-colors resize-none leading-relaxed"
              />
            </div>

          </div>

          {/* ══ SEZIONE AVANZATA (collassata) ═════════════════════════ */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors min-h-[44px]"
            >
              {showAdvanced ? (
                <>Nascondi dettagli <span className="text-xs">↑</span></>
              ) : (
                <>Altri dettagli <span className="text-xs">→</span></>
              )}
            </button>

            {showAdvanced && (
              <div className="space-y-7 mt-5">

                {/* Connessioni / Tag */}
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Connessioni
                  </p>
                  <TagInput
                    value={tags}
                    onChange={setTags}
                    suggestions={allTags}
                    placeholder="Luoghi, temi, parole chiave…"
                  />
                </div>

                {/* Gruppo */}
                {memoryType === 'day' && groups.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                      Gruppo
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedGroupId(null)}
                        className={`rounded-full px-4 py-2 text-sm font-medium border transition-all min-h-[44px] ${
                          selectedGroupId === null
                            ? 'bg-foreground text-background border-foreground'
                            : 'border-border text-muted-foreground hover:border-foreground/30'
                        }`}
                      >
                        Nessun gruppo
                      </button>
                      {groups.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setSelectedGroupId(g.id)}
                          className={`rounded-full px-4 py-2 text-sm font-medium border transition-all min-h-[44px] ${
                            selectedGroupId === g.id
                              ? 'bg-foreground text-background border-foreground'
                              : 'border-border text-muted-foreground hover:border-foreground/30'
                          }`}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                    {selectedGroupId && (() => {
                      const sg = groups.find((g) => g.id === selectedGroupId)
                      return sg ? (
                        <p className="text-xs text-muted-foreground/60 px-1">
                          Tutti i {sg.memberCount} membri di &ldquo;{sg.name}&rdquo; avranno accesso automatico.
                        </p>
                      ) : null
                    })()}
                  </div>
                )}

              </div>
            )}
          </div>

          {/* ── Error ── */}
          {error && (
            <p className="text-sm text-destructive px-1">{error}</p>
          )}

          {/* ── Primary CTA ── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-foreground text-background py-4 text-base font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (uploadStep || 'Salvataggio…') : 'Salva questo momento'}
          </button>

        </form>
      </div>
    </main>
  )
}

export default function NewMemoryPage() {
  return (
    <Suspense>
      <NewMemoryForm />
    </Suspense>
  )
}

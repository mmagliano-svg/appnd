'use client'

import { Suspense, useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createMemoryReturnId, getAllUserTags, getUserPeriods, type PeriodSummary } from '@/actions/memories'
import { getUserGroups, type GroupSummary } from '@/actions/groups'
import { addMediaContribution } from '@/actions/contributions'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CATEGORIES } from '@/lib/constants/categories'
import { TagInput } from '@/components/memory/TagInput'
import { formatPeriodDisplay } from '@/lib/utils/dates'
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
  const [parentPeriodId, setParentPeriodId] = useState<string | null>(null)
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  // Date type state
  const [memoryType, setMemoryType] = useState<'day' | 'period'>('day')
  const [isOngoing, setIsOngoing] = useState(false)

  // Memory classification
  const [isAnniversary, setIsAnniversary] = useState(false)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')

  // Media state
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)

  const periodFromUrl = searchParams.get('period')
  const groupFromUrl  = searchParams.get('group')

  useEffect(() => {
    getAllUserTags().then(setAllTags).catch(() => {})
    getUserPeriods().then((loaded) => {
      setPeriods(loaded)
      if (periodFromUrl && loaded.some((p) => p.id === periodFromUrl)) {
        setParentPeriodId(periodFromUrl)
      }
    }).catch(() => {})
    getUserGroups().then((loaded) => {
      setGroups(loaded)
      if (groupFromUrl && loaded.some((g) => g.id === groupFromUrl)) {
        setSelectedGroupId(groupFromUrl)
      }
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-suggest: find the most specific period containing startDate
  const suggestedPeriod = useMemo(() => {
    if (memoryType === 'period' || !startDate || periods.length === 0) return null
    const matches = periods.filter(
      (p) => startDate >= p.start_date && startDate <= p.end_date
    )
    if (matches.length === 0) return null
    // Return the shortest (most specific) matching period
    return matches.sort(
      (a, b) =>
        (new Date(a.end_date).getTime() - new Date(a.start_date).getTime()) -
        (new Date(b.end_date).getTime() - new Date(b.start_date).getTime())
    )[0]
  }, [startDate, periods, memoryType])

  // Warning if selected period range doesn't contain startDate
  const outOfRange = useMemo(() => {
    if (!parentPeriodId || !startDate) return false
    const sel = periods.find((p) => p.id === parentPeriodId)
    if (!sel) return false
    return startDate < sel.start_date || startDate > sel.end_date
  }, [parentPeriodId, startDate, periods])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const isVideo = file.type.startsWith('video/')
    setMediaFile(file)
    setMediaPreview(URL.createObjectURL(file))
    setMediaType(isVideo ? 'video' : 'image')
    setError('')

    // Auto-focus title after selecting media
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
      // 1 — Create memory (no redirect)
      setUploadStep('Creazione ricordo…')
      const memoryId = await createMemoryReturnId({
        title: form.get('title') as string,
        start_date: startDate,
        end_date: memoryType === 'period'
          ? (isOngoing ? '9999-12-31' : endDate || undefined)
          : undefined,
        parent_period_id: memoryType === 'day' ? parentPeriodId : null,
        location_name: form.get('location_name') as string,
        description: form.get('description') as string,
        categories,
        tags,
        is_anniversary: isAnniversary,
        is_first_time: isFirstTime,
        group_id: memoryType === 'day' ? selectedGroupId : null,
      })

      // 2 — Upload media if present
      if (mediaFile) {
        setUploadStep('Caricamento foto…')
        const supabase = createClient()
        const ext = mediaFile.name.split('.').pop() ?? 'jpg'
        const path = `${memoryId}/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('memory-media')
          .upload(path, mediaFile, { upsert: false })

        if (uploadError) {
          // Memory was created — navigate anyway, media upload failed silently
          router.push(`/memories/${memoryId}`)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('memory-media')
          .getPublicUrl(path)

        // 3 — Save as contribution
        setUploadStep('Salvataggio…')
        await addMediaContribution(memoryId, publicUrl)
      }

      // After creating a moment (not a period), go to share flow
      if (memoryType === 'day') {
        router.push(`/memories/${memoryId}/share?new=1`)
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
  const hasMedia = Boolean(mediaFile)
  const isPeriod = memoryType === 'period'

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pb-16">

        {/* Header */}
        <div className="pt-6 pb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Indietro
          </button>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Nuovo ricordo</h1>
          <p className="text-sm text-muted-foreground">
            {hasMedia ? 'Il momento è catturato. Dagli un nome.' : 'Cattura il momento prima che sfugga.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── MEDIA PICKER — in cima ── */}
          <div>
            {!mediaPreview ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-2xl border-2 border-dashed border-border hover:border-foreground/30 bg-muted/10 hover:bg-muted/20 transition-all flex flex-col items-center justify-center gap-3 py-10"
              >
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                  <svg className="w-7 h-7 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Cattura questo momento</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tocca per aggiungere una foto o video</p>
                </div>
              </button>
            ) : (
              <div className="relative">
                {mediaType === 'image' ? (
                  <img
                    src={mediaPreview}
                    alt="Anteprima"
                    className="w-full rounded-2xl object-cover max-h-80"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    className="w-full rounded-2xl max-h-80"
                    controls
                    playsInline
                  />
                )}
                <button
                  type="button"
                  onClick={clearMedia}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center text-sm hover:bg-black/80 transition-colors"
                  aria-label="Rimuovi media"
                >
                  ✕
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
          </div>

          {/* ── TITOLO ── */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Titolo <span className="text-muted-foreground font-normal">*</span>
            </Label>
            <Input
              ref={titleRef}
              id="title"
              name="title"
              placeholder="Come chiami questo momento?"
              required
              autoFocus={!hasMedia}
              className="text-base"
            />
          </div>

          {/* ── DETTAGLI SECONDARI (meno prominenti se c'è media) ── */}
          <div className={`space-y-6 transition-opacity duration-300 ${hasMedia ? 'opacity-80' : ''}`}>

            {/* Data */}
            <div className="space-y-3">
              {/* Type toggle + label */}
              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm font-medium">
                  {isPeriod ? 'Quanto è durato?' : 'Quando è successo?'}{' '}
                  <span className="text-muted-foreground font-normal">*</span>
                </Label>
                <div className="flex rounded-lg border border-border overflow-hidden text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => { setMemoryType('day'); setEndDate('') }}
                    className={`px-3 py-1.5 font-medium transition-colors ${
                      !isPeriod
                        ? 'bg-foreground text-background'
                        : 'bg-background text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    Giorno
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemoryType('period')}
                    className={`px-3 py-1.5 font-medium transition-colors border-l border-border ${
                      isPeriod
                        ? 'bg-foreground text-background'
                        : 'bg-background text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    Periodo
                  </button>
                </div>
              </div>

              {/* Date picker(s) */}
              {!isPeriod ? (
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={today}
                  required
                />
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Dal</p>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        max={today}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Al</p>
                      {isOngoing ? (
                        <div className="flex items-center h-10 rounded-xl border border-foreground bg-foreground px-3">
                          <span className="text-sm font-medium text-background">ancora in corso</span>
                        </div>
                      ) : (
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate}
                          max={today}
                        />
                      )}
                    </div>
                  </div>
                  {/* Ongoing toggle */}
                  <button
                    type="button"
                    onClick={() => { setIsOngoing((v) => !v); setEndDate('') }}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      isOngoing
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground'
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
                    Ancora in corso (nessuna data di fine)
                  </button>
                </div>
              )}
            </div>

            {/* Tipo di momento */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Questo momento è…</Label>
              <div className="flex gap-2 flex-wrap">
                {/* Prima volta */}
                <button
                  type="button"
                  onClick={() => setIsFirstTime((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    isFirstTime
                      ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-700'
                      : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                  }`}
                >
                  <span className="text-base leading-none">✦</span>
                  Prima volta
                </button>

                {/* Anniversario */}
                <button
                  type="button"
                  onClick={() => setIsAnniversary((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    isAnniversary
                      ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-700'
                      : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                  }`}
                >
                  <span className="text-base leading-none">↺</span>
                  Ricorrenza
                </button>
              </div>
              {isAnniversary && (
                <p className="text-xs text-muted-foreground">
                  Questo ricordo tornerà in evidenza ogni anno nella stessa data.
                </p>
              )}
            </div>

            {/* Luogo */}
            <div className="space-y-2">
              <Label htmlFor="location_name" className="text-sm font-medium">
                Dove eravate?
              </Label>
              <Input
                id="location_name"
                name="location_name"
                placeholder="Es. Roma, Trastevere"
              />
            </div>

            {/* Categorie — multi-select */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Capitoli della vita</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Puoi selezionarne più di uno.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
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
                      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition-all text-left ${
                        active
                          ? 'border-foreground bg-foreground text-background font-medium'
                          : 'border-border hover:border-foreground/30 hover:bg-accent/50'
                      }`}
                    >
                      <span className="text-base">{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tag */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Connessioni</Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Persone, luoghi, temi — tutto ciò che collega questo momento agli altri.
              </p>
              <TagInput
                value={tags}
                onChange={setTags}
                suggestions={allTags}
                placeholder="Es. Luca, Sardegna, estate…"
              />
            </div>

            {/* Descrizione con prompt guidato */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="description" className="text-sm font-medium">
                  Il racconto
                </Label>
                <span className="text-[10px] text-muted-foreground/50 italic">
                  facoltativo
                </span>
              </div>
              <textarea
                id="description"
                name="description"
                placeholder={getPromptForCategory(categories[0] || null)}
                rows={5}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground/50 leading-relaxed px-1">
                Scrivi in libertà — anche solo due righe. Questo è il tuo spazio.
              </p>
            </div>

            {/* Periodo di appartenenza */}
            {!isPeriod && periods.length > 0 && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Fa parte di un periodo?</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Collega questo momento a una fase della tua vita.
                  </p>
                </div>

                {/* Auto-suggest banner */}
                {suggestedPeriod && parentPeriodId !== suggestedPeriod.id && (
                  <button
                    type="button"
                    onClick={() => setParentPeriodId(suggestedPeriod.id)}
                    className="w-full flex items-center justify-between gap-3 rounded-xl border border-foreground/20 bg-muted/30 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Suggerito</p>
                      <p className="text-sm font-medium">{suggestedPeriod.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPeriodDisplay(suggestedPeriod.start_date, suggestedPeriod.end_date)}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">Collega →</span>
                  </button>
                )}

                {/* Period list */}
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setParentPeriodId(null)}
                    className={`w-full flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition-all text-left ${
                      parentPeriodId === null
                        ? 'border-foreground bg-foreground text-background font-medium'
                        : 'border-border hover:border-foreground/30 hover:bg-accent/50'
                    }`}
                  >
                    <span>Nessun periodo</span>
                  </button>
                  {periods.map((period) => (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => setParentPeriodId(period.id)}
                      className={`w-full flex items-center justify-between gap-2.5 rounded-xl border px-3.5 py-3 text-sm transition-all text-left ${
                        parentPeriodId === period.id
                          ? 'border-foreground bg-foreground text-background font-medium'
                          : 'border-border hover:border-foreground/30 hover:bg-accent/50'
                      }`}
                    >
                      <span className="truncate">{period.title}</span>
                      <span className={`text-xs shrink-0 ${parentPeriodId === period.id ? 'text-background/70' : 'text-muted-foreground'}`}>
                        {formatPeriodDisplay(period.start_date, period.end_date)}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Out-of-range warning */}
                {outOfRange && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span>⚠</span>
                    La data dell'evento è fuori dal range di questo periodo.
                  </p>
                )}
              </div>
            )}

          </div>

          {/* ── Gruppo ── */}
          {memoryType === 'day' && groups.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Gruppo</label>
                <span className="text-xs text-muted-foreground">(opzionale)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGroupId(null)}
                  className={`rounded-full px-4 py-2 text-sm font-medium border transition-all ${
                    selectedGroupId === null
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-border hover:border-foreground/30 hover:bg-accent/30'
                  }`}
                >
                  Nessun gruppo
                </button>
                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`rounded-full px-4 py-2 text-sm font-medium border transition-all ${
                      selectedGroupId === g.id
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border hover:border-foreground/30 hover:bg-accent/30'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
              {selectedGroupId && (() => {
                const sg = groups.find((g) => g.id === selectedGroupId)
                return sg ? (
                  <p className="text-xs text-muted-foreground px-1">
                    Tutti i {sg.memberCount} membri di "{sg.name}" avranno accesso automatico.
                  </p>
                ) : null
              })()}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full rounded-full py-6 text-base font-medium"
            disabled={loading}
          >
            {loading ? (uploadStep || 'Salvataggio…') : 'Salva il ricordo'}
          </Button>

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

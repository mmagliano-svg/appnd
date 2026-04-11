/**
 * Memory Prompt Library — Taxonomy V1
 *
 * Each prompt is typed as one of three structural entities:
 *
 *   - moment   : a single specific event (first concert, day X, one trip)
 *                → routes to /memories/new
 *
 *   - period   : a phase of life with duration (a relationship, a job,
 *                a school year, a house you lived in)
 *                → routes to /periods/new
 *
 *   - cluster  : a recurring/thematic collection of moments sharing
 *                one anchor (a city visited many times, all weddings,
 *                all Sunday lunches)
 *                → routes to /clusters/new
 *
 * Each prompt implicitly guides the user toward the four Appnd
 * metadata pillars: WHEN, WHERE, WHO, TYPE.
 *
 * Prompts are NOT final titles. The creation pages show the prompt
 * as context and ask the user to give the memory a more specific
 * title of their own.
 */

export type PromptType = 'moment' | 'period' | 'cluster'

export type MemoryPromptCategory =
  | 'relationships'
  | 'home'
  | 'travel'
  | 'work'
  | 'sports'
  | 'events'
  | 'family'
  | 'friends'

export interface Prompt {
  id: string
  text: string
  type: PromptType
  category: MemoryPromptCategory
}

export const PROMPTS: Prompt[] = [
  // ── Relationships ─────────────────────────────────────────────────────────
  // Removed: rel-unspoken-goodbye (introspective, no time/place anchor)
  { id: 'rel-first-sight',       type: 'moment', category: 'relationships', text: 'Dove hai visto per la prima volta la persona che poi è diventata importante per te?' },
  { id: 'rel-longest-start',     type: 'period', category: 'relationships', text: 'Quando è iniziata la tua relazione più lunga — dove vi siete conosciuti?' },
  { id: 'rel-first-date',        type: 'moment', category: 'relationships', text: 'Il primo appuntamento vero che hai avuto — in che città?' },
  { id: 'rel-first-summer',      type: 'period', category: 'relationships', text: 'La prima estate che hai passato con qualcuno a cui tenevi — dove eravate?' },
  { id: 'rel-meeting-parents',   type: 'moment', category: 'relationships', text: 'Quando hai presentato qualcuno ai tuoi per la prima volta — dove siete andati?' },
  { id: 'rel-first-shared-home', type: 'period', category: 'relationships', text: 'La prima casa che hai condiviso con qualcuno — in che città?' },
  { id: 'rel-love-moment',       type: 'moment', category: 'relationships', text: 'Il giorno in cui hai capito di essere innamorato — dove eri?' },

  // ── Home / Places ─────────────────────────────────────────────────────────
  { id: 'home-all-houses',       type: 'cluster', category: 'home', text: 'Ti ricordi tutte le case in cui hai vissuto?' },
  { id: 'home-first-own',        type: 'period',  category: 'home', text: 'La prima casa che hai chiamato “casa tua” — dove era?' },
  { id: 'home-childhood-room',   type: 'period',  category: 'home', text: 'La stanza in cui hai dormito da bambino — in che città vivevi?' },
  { id: 'home-big-move',         type: 'moment',  category: 'home', text: 'Il giorno del trasloco più importante della tua vita — da dove a dove?' },
  { id: 'home-return-spot',      type: 'cluster', category: 'home', text: 'C’è un posto in cui tornavi sempre da bambino?' },
  { id: 'home-first-away',       type: 'period',  category: 'home', text: 'La prima casa lontano dalla famiglia — in che città?' },
  { id: 'home-childhood-block',  type: 'period',  category: 'home', text: 'Il quartiere in cui giocavi da piccolo — chi c’era con te?' },
  { id: 'home-last-real',        type: 'period',  category: 'home', text: 'L’ultima casa in cui hai vissuto a lungo — dove era?' },

  // ── Travel ────────────────────────────────────────────────────────────────
  // Removed: travel-changed-me (introspective, no anchor)
  { id: 'travel-first-alone',    type: 'moment',  category: 'travel', text: 'Il tuo primo viaggio da solo — dove sei andato?' },
  { id: 'travel-first-sea',      type: 'moment',  category: 'travel', text: 'La prima volta che hai visto il mare — con chi eri?' },
  { id: 'travel-same-city',      type: 'cluster', category: 'travel', text: 'C’è una città in cui sei tornato più volte nella vita?' },
  { id: 'travel-train-trip',     type: 'moment',  category: 'travel', text: 'Un viaggio in treno che ricordi ancora — dove stavi andando?' },
  { id: 'travel-first-flight',   type: 'moment',  category: 'travel', text: 'La prima volta che hai preso un aereo — dove stavi andando?' },
  { id: 'travel-one-night',      type: 'moment',  category: 'travel', text: 'Un posto in cui hai dormito una notte sola — dove era?' },
  { id: 'travel-longest',        type: 'moment',  category: 'travel', text: 'Il viaggio più lungo che hai fatto — dove sei andato e con chi?' },

  // ── Work / School ─────────────────────────────────────────────────────────
  { id: 'work-first-day',        type: 'moment',  category: 'work', text: 'Il tuo primo giorno di lavoro — dove eri?' },
  { id: 'work-longest-job',      type: 'period',  category: 'work', text: 'Il lavoro che hai fatto più a lungo — dove e per quanto tempo?' },
  { id: 'work-first-salary',     type: 'moment',  category: 'work', text: 'Il tuo primo stipendio — cosa ci hai comprato?' },
  { id: 'work-best-school',      type: 'period',  category: 'work', text: 'La scuola in cui hai passato più anni — dove era?' },
  { id: 'work-deskmate',         type: 'period',  category: 'work', text: 'Il compagno di banco con cui passavi più tempo — in che scuola?' },
  { id: 'work-first-boss',       type: 'period',  category: 'work', text: 'Il primo capo che hai avuto — dove lavoravate?' },
  { id: 'work-job-switch',       type: 'moment',  category: 'work', text: 'Il giorno in cui hai cambiato lavoro — da cosa a cosa?' },
  { id: 'work-last-school-day',  type: 'moment',  category: 'work', text: 'L’ultimo giorno di scuola — con chi l’hai festeggiato?' },
  { id: 'work-all-jobs',         type: 'cluster', category: 'work', text: 'Ti ricordi tutti i lavori che hai fatto nella tua vita?' },

  // ── Sports / Activities ───────────────────────────────────────────────────
  { id: 'sport-first',           type: 'period',  category: 'sports', text: 'Il primo sport che hai praticato — dove ti allenavi?' },
  { id: 'sport-match',           type: 'moment',  category: 'sports', text: 'Una partita che ricordi ancora — dove si giocava?' },
  { id: 'sport-first-coach',     type: 'period',  category: 'sports', text: 'Il primo allenatore che hai avuto — in che squadra?' },
  { id: 'sport-missed',          type: 'period',  category: 'sports', text: 'Uno sport che hai lasciato — quanto tempo l’hai fatto?' },
  { id: 'sport-first-win',       type: 'moment',  category: 'sports', text: 'La prima volta che hai vinto qualcosa — cosa e dove?' },
  { id: 'sport-mentor',          type: 'period',  category: 'sports', text: 'Chi ti ha insegnato il primo sport — dove vi allenavate?' },

  // ── Events ────────────────────────────────────────────────────────────────
  { id: 'event-all-weddings',    type: 'cluster', category: 'events', text: 'A quanti matrimoni sei stato nella tua vita?' },
  { id: 'event-first-concert',   type: 'moment',  category: 'events', text: 'Il primo concerto a cui sei andato — di chi e dove?' },
  { id: 'event-longest-party',   type: 'moment',  category: 'events', text: 'La festa più lunga della tua vita — dove eravate?' },
  { id: 'event-best-wedding',    type: 'moment',  category: 'events', text: 'Un matrimonio che ricordi ancora — di chi e dove?' },
  { id: 'event-memorable-bday',  type: 'moment',  category: 'events', text: 'Un compleanno che non hai più dimenticato — di chi?' },
  { id: 'event-strange-nye',     type: 'moment',  category: 'events', text: 'Il capodanno più strano che hai passato — dove eri?' },
  { id: 'event-reunion',         type: 'moment',  category: 'events', text: 'Un evento in cui hai rivisto qualcuno dopo anni — quando e dove?' },
  { id: 'event-all-concerts',    type: 'cluster', category: 'events', text: 'Ti ricordi i concerti importanti che hai visto?' },

  // ── Family ────────────────────────────────────────────────────────────────
  { id: 'family-sunday-lunch',   type: 'cluster', category: 'family', text: 'I pranzi della domenica da bambino — chi c’era sempre?' },
  { id: 'family-first-xmas',     type: 'moment',  category: 'family', text: 'Il primo Natale che ricordi davvero — dove eri e chi c’era?' },
  { id: 'family-car-trip',       type: 'moment',  category: 'family', text: 'Un viaggio in macchina con la famiglia — dove stavate andando?' },
  { id: 'family-with-dad',       type: 'moment',  category: 'family', text: 'Un giorno passato da solo con tuo padre — dove siete andati?' },
  { id: 'family-with-mom',       type: 'moment',  category: 'family', text: 'Un giorno passato da solo con tua madre — dove eravate?' },
  { id: 'family-new-life',       type: 'moment',  category: 'family', text: 'Il giorno in cui è nato qualcuno di importante per te — dove eri?' },
  { id: 'family-bday',           type: 'moment',  category: 'family', text: 'Un compleanno di famiglia che non dimentichi — di chi e dove?' },

  // ── Friends / Social Life ─────────────────────────────────────────────────
  { id: 'friends-first',         type: 'period',  category: 'friends', text: 'Il primo amico della tua vita — dove vi siete conosciuti?' },
  { id: 'friends-night',         type: 'moment',  category: 'friends', text: 'Una notte con gli amici diventata un ricordo — dove eravate?' },
  { id: 'friends-social-summer', type: 'period',  category: 'friends', text: 'L’estate in cui hai conosciuto più persone nuove — che anno era?' },
  { id: 'friends-reunion',       type: 'moment',  category: 'friends', text: 'L’ultima volta che hai rivisto un amico d’infanzia — dove?' },
  { id: 'friends-lost-group',    type: 'period',  category: 'friends', text: 'Un gruppo di amici che non esiste più — chi eravate?' },
  { id: 'friends-first-allnight',type: 'moment',  category: 'friends', text: 'La prima volta che sei rimasto fuori tutta la notte — con chi?' },
]

/**
 * Pick a prompt avoiding recently shown ones.
 * Pure function — the component manages the localStorage window.
 */
export function pickPromptFromPool(recentIds: string[]): Prompt {
  const pool = PROMPTS.filter((p) => !recentIds.includes(p.id))
  const source = pool.length > 0 ? pool : PROMPTS
  return source[Math.floor(Math.random() * source.length)] ?? PROMPTS[0]
}

/**
 * Build the destination URL for a prompt based on its type.
 * Handles URL-encoding of the prompt text.
 */
export function getPromptHref(prompt: Prompt): string {
  const encoded = encodeURIComponent(prompt.text)
  const idParam = `&promptId=${prompt.id}`
  switch (prompt.type) {
    case 'moment':
      return `/memories/new?prompt=${encoded}&source=prompt${idParam}`
    case 'period':
      return `/periods/new?prompt=${encoded}${idParam}`
    case 'cluster':
      return `/clusters/new?prompt=${encoded}${idParam}`
  }
}

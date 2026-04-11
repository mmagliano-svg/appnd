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
  { id: 'rel-first-sight',       type: 'moment', category: 'relationships', text: 'Ti ricordi la prima volta che hai visto qualcuno che poi è diventato importante per te?' },
  { id: 'rel-longest-start',     type: 'period', category: 'relationships', text: 'Quando è iniziata la tua relazione più lunga — dove eravate?' },
  { id: 'rel-first-date',        type: 'moment', category: 'relationships', text: 'Il primo appuntamento che ricordi davvero — in che città?' },
  { id: 'rel-unspoken-goodbye',  type: 'moment', category: 'relationships', text: 'C’è un addio che non hai mai raccontato a nessuno?' },
  { id: 'rel-first-summer',      type: 'period', category: 'relationships', text: 'Qual è stata la prima estate vissuta con qualcuno a cui tenevi?' },
  { id: 'rel-meeting-parents',   type: 'moment', category: 'relationships', text: 'Ti ricordi quando hai presentato qualcuno ai tuoi per la prima volta?' },
  { id: 'rel-first-shared-home', type: 'period', category: 'relationships', text: 'La prima casa che hai condiviso con qualcuno — dove era?' },
  { id: 'rel-love-moment',       type: 'moment', category: 'relationships', text: 'Qual è stato il momento in cui hai capito che era amore?' },

  // ── Home / Places ─────────────────────────────────────────────────────────
  { id: 'home-all-houses',       type: 'cluster', category: 'home', text: 'Ti ricordi tutte le case in cui hai vissuto?' },
  { id: 'home-first-own',        type: 'period',  category: 'home', text: 'Qual è stato il primo posto che hai chiamato “casa tua”?' },
  { id: 'home-childhood-room',   type: 'period',  category: 'home', text: 'La stanza della tua infanzia — come la ricordi?' },
  { id: 'home-big-move',         type: 'moment',  category: 'home', text: 'Ti ricordi il giorno del trasloco più importante della tua vita?' },
  { id: 'home-return-spot',      type: 'cluster', category: 'home', text: 'C’è un posto in cui tornavi sempre da bambino?' },
  { id: 'home-first-away',       type: 'period',  category: 'home', text: 'La prima casa lontano dalla famiglia — in che città?' },
  { id: 'home-childhood-block',  type: 'period',  category: 'home', text: 'Il quartiere in cui giocavi da piccolo — chi c’era con te?' },
  { id: 'home-last-real',        type: 'period',  category: 'home', text: 'Qual è l’ultima casa che hai davvero sentito tua?' },

  // ── Travel ────────────────────────────────────────────────────────────────
  { id: 'travel-first-alone',    type: 'moment',  category: 'travel', text: 'Ti ricordi il tuo primo viaggio da solo?' },
  { id: 'travel-changed-me',     type: 'moment',  category: 'travel', text: 'Qual è stato il viaggio che ti ha cambiato qualcosa dentro?' },
  { id: 'travel-first-sea',      type: 'moment',  category: 'travel', text: 'La prima volta che hai visto il mare — con chi eri?' },
  { id: 'travel-same-city',      type: 'cluster', category: 'travel', text: 'C’è una città in cui sei tornato più volte nella vita?' },
  { id: 'travel-train-trip',     type: 'moment',  category: 'travel', text: 'Ti ricordi un viaggio in treno che non dimentichi più?' },
  { id: 'travel-first-flight',   type: 'moment',  category: 'travel', text: 'La prima volta che hai preso un aereo — dove stavi andando?' },
  { id: 'travel-one-night',      type: 'moment',  category: 'travel', text: 'Un posto in cui hai dormito una notte sola — quale?' },
  { id: 'travel-longest',        type: 'moment',  category: 'travel', text: 'Qual è stato il viaggio più lungo che hai mai fatto?' },

  // ── Work / School ─────────────────────────────────────────────────────────
  { id: 'work-first-day',        type: 'moment',  category: 'work', text: 'Ti ricordi il tuo primo giorno di lavoro — dove eri?' },
  { id: 'work-longest-job',      type: 'period',  category: 'work', text: 'Qual è stato il lavoro che hai fatto più a lungo?' },
  { id: 'work-first-salary',     type: 'moment',  category: 'work', text: 'Cosa hai fatto con il tuo primo stipendio?' },
  { id: 'work-best-school',      type: 'period',  category: 'work', text: 'La scuola che ricordi meglio — perché proprio quella?' },
  { id: 'work-deskmate',         type: 'period',  category: 'work', text: 'Chi era il compagno di banco che ti ha segnato di più?' },
  { id: 'work-first-boss',       type: 'period',  category: 'work', text: 'Il primo capo che hai avuto — com’era?' },
  { id: 'work-job-switch',       type: 'moment',  category: 'work', text: 'Ti ricordi il giorno in cui hai cambiato lavoro?' },
  { id: 'work-last-school-day',  type: 'moment',  category: 'work', text: 'L’ultimo giorno di scuola — come l’hai vissuto?' },
  { id: 'work-all-jobs',         type: 'cluster', category: 'work', text: 'Ti ricordi tutti i lavori che hai fatto nella tua vita?' },

  // ── Sports / Activities ───────────────────────────────────────────────────
  { id: 'sport-first',           type: 'period',  category: 'sports', text: 'Ti ricordi il primo sport che hai praticato — e con chi?' },
  { id: 'sport-match',           type: 'moment',  category: 'sports', text: 'Una partita che non dimentichi — quando è stata?' },
  { id: 'sport-first-coach',     type: 'period',  category: 'sports', text: 'Il primo allenatore che ti è rimasto in mente — chi era?' },
  { id: 'sport-missed',          type: 'period',  category: 'sports', text: 'C’è un’attività che hai lasciato e ti manca ancora?' },
  { id: 'sport-first-win',       type: 'moment',  category: 'sports', text: 'La prima volta che hai vinto qualcosa — cosa?' },
  { id: 'sport-mentor',          type: 'period',  category: 'sports', text: 'Chi ti ha insegnato uno sport che ami ancora?' },

  // ── Events ────────────────────────────────────────────────────────────────
  { id: 'event-all-weddings',    type: 'cluster', category: 'events', text: 'A quanti matrimoni sei stato nella tua vita?' },
  { id: 'event-first-concert',   type: 'moment',  category: 'events', text: 'Il primo concerto a cui sei andato — di chi?' },
  { id: 'event-longest-party',   type: 'moment',  category: 'events', text: 'Ti ricordi la festa più lunga della tua vita?' },
  { id: 'event-best-wedding',    type: 'moment',  category: 'events', text: 'Qual è stato il matrimonio più bello a cui hai partecipato?' },
  { id: 'event-memorable-bday',  type: 'moment',  category: 'events', text: 'Una festa di compleanno che ricordi ancora — di chi?' },
  { id: 'event-strange-nye',     type: 'moment',  category: 'events', text: 'Il capodanno più strano che hai passato — dove?' },
  { id: 'event-reunion',         type: 'moment',  category: 'events', text: 'Un evento in cui hai rivisto qualcuno dopo anni — quando?' },
  { id: 'event-all-concerts',    type: 'cluster', category: 'events', text: 'Ti ricordi i concerti importanti della tua vita?' },

  // ── Family ────────────────────────────────────────────────────────────────
  { id: 'family-sunday-lunch',   type: 'cluster', category: 'family', text: 'Ti ricordi i pranzi della domenica da bambino — chi c’era?' },
  { id: 'family-first-xmas',     type: 'moment',  category: 'family', text: 'Il primo Natale che ricordi davvero — dove eri?' },
  { id: 'family-car-trip',       type: 'moment',  category: 'family', text: 'Un viaggio in macchina con la famiglia — che anno era?' },
  { id: 'family-with-dad',       type: 'moment',  category: 'family', text: 'La prima volta che hai fatto qualcosa con tuo padre — cosa?' },
  { id: 'family-with-mom',       type: 'moment',  category: 'family', text: 'Un momento con tua madre che porti ancora dentro — quale?' },
  { id: 'family-new-life',       type: 'moment',  category: 'family', text: 'Ti ricordi il giorno in cui è nato qualcuno di importante per te?' },
  { id: 'family-bday',           type: 'moment',  category: 'family', text: 'Un compleanno di famiglia che non dimentichi — di chi?' },

  // ── Friends / Social Life ─────────────────────────────────────────────────
  { id: 'friends-first',         type: 'period',  category: 'friends', text: 'Ti ricordi il primo amico della tua vita — come vi siete conosciuti?' },
  { id: 'friends-night',         type: 'moment',  category: 'friends', text: 'Una notte con gli amici diventata un ricordo — quando?' },
  { id: 'friends-social-summer', type: 'period',  category: 'friends', text: 'L’estate in cui hai conosciuto più persone nuove — che anno?' },
  { id: 'friends-reunion',       type: 'moment',  category: 'friends', text: 'Ti ricordi l’ultima volta che hai rivisto un amico d’infanzia?' },
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

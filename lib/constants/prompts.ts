// Guided prompts for memory description — drawn from the 252 CHALLENGE
// questions and 2771 QUESTIONS sheets in Mattia's personal research file.
// Shown as rotating placeholder text in the description textarea.

export interface MemoryPrompt {
  text: string
  category?: string   // optional: match to memory category
}

export const MEMORY_PROMPTS: MemoryPrompt[] = [
  // Universal — shown for any memory
  { text: 'Cosa vorresti ricordare di questo momento tra vent\'anni?' },
  { text: 'Com\'eri in questo momento della tua vita? Chi eri?' },
  { text: 'Chi ti ha sorpreso? Chi ti ha deluso? Chi ti ha fatto ridere?' },
  { text: 'Cosa sentivi — con il corpo, non solo con la testa?' },
  { text: 'C\'era qualcosa che non avresti potuto immaginare dieci anni prima?' },
  { text: 'Cosa avresti voluto dire che non hai detto?' },
  { text: 'Qual era l\'odore, la luce, il suono di quel posto?' },
  { text: 'Cosa ha reso questo momento diverso da tutti gli altri?' },
  { text: 'Chi vorresti che potesse rivivere questo momento con te?' },
  { text: 'Cosa ti ha insegnato questa esperienza?' },
  { text: 'Se dovessi descriverlo in tre parole, quali sceglieresti?' },
  { text: 'Cosa stavi pensando mentre succedeva? E cosa pensi adesso?' },
  { text: 'C\'era qualcosa di imperfetto che lo ha reso perfetto?' },
  { text: 'Cosa non tornerà mai più uguale?' },

  // Viaggio / Vacanza
  { text: 'Cosa ti ha sorpreso di quel posto?', category: 'travel' },
  { text: 'Qual è stata la cosa più inaspettata del viaggio?', category: 'travel' },
  { text: 'C\'è un momento preciso in cui hai pensato: questo non lo dimentico?', category: 'travel' },

  // Amore / Relazioni
  { text: 'Cosa hai capito di te in quel momento?', category: 'love' },
  { text: 'Come stavi guardando quella persona?', category: 'love' },
  { text: 'Cosa ti ha fatto capire che era importante?', category: 'love' },

  // Lavoro / Carriera
  { text: 'Cosa hai imparato che non ti aspettavi di imparare?', category: 'work' },
  { text: 'Di cosa vai più fiero in questa fase della tua carriera?', category: 'work' },

  // Famiglia
  { text: 'Cosa vorresti che i tuoi figli sapessero di questo momento?', category: 'family' },
  { text: 'Cosa ti ha trasmesso la tua famiglia che senti ancora oggi?', category: 'family' },

  // Sport / Sfide
  { text: 'Qual è stato il momento in cui hai pensato di mollare — e non l\'hai fatto?', category: 'sport' },
  { text: 'Cosa hai scoperto di te stesso spingendoti oltre i tuoi limiti?', category: 'sport' },
]

/**
 * Returns a prompt for a given category, or a universal one if no match.
 * Rotates deterministically based on the current date so it doesn't
 * change on every keystroke.
 */
export function getPromptForCategory(category?: string | null): string {
  const day = new Date().getDate()

  if (category) {
    const categoryPrompts = MEMORY_PROMPTS.filter(
      (p) => p.category === category
    )
    if (categoryPrompts.length > 0) {
      return categoryPrompts[day % categoryPrompts.length].text
    }
  }

  const universal = MEMORY_PROMPTS.filter((p) => !p.category)
  return universal[day % universal.length].text
}

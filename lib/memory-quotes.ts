// Curated from Mattia's MEMORIES QUOTES collection — 89 quotes about memory
// Used in empty states, onboarding, and anywhere the UI needs emotional resonance.

export interface MemoryQuote {
  text: string
  author: string
}

export const MEMORY_QUOTES: MemoryQuote[] = [
  {
    text: 'La vita non è quella che si è vissuta, ma quella che si ricorda e come la si ricorda per raccontarla.',
    author: 'Gabriel García Márquez',
  },
  {
    text: 'Il ricordo è un modo d\'incontrarsi.',
    author: 'Kahlil Gibran',
  },
  {
    text: 'Abbi cura dei tuoi ricordi, perché non puoi viverli di nuovo.',
    author: 'Bob Dylan',
  },
  {
    text: 'La memoria è il diario che ciascuno di noi porta sempre con sé.',
    author: 'Oscar Wilde',
  },
  {
    text: 'Nessun maggior dolore che ricordarsi del tempo felice nella miseria.',
    author: 'Dante Alighieri',
  },
  {
    text: 'Dove c\'è grande amore ci sono sempre i ricordi.',
    author: 'Willa Cather',
  },
  {
    text: 'I veri paradisi sono i paradisi che abbiamo perduto.',
    author: 'Marcel Proust',
  },
  {
    text: 'Tutti abbiamo le nostre macchine del tempo. Quelle che ci portano indietro si chiamano ricordi. Quelle che ci portano avanti si chiamano sogni.',
    author: 'Jeremy Irons',
  },
  {
    text: 'Il passato non è mai morto. Non è nemmeno passato.',
    author: 'William Faulkner',
  },
  {
    text: 'Amo il ricordo di ciò che ho vissuto più di quanto ami molte cose che vivo.',
    author: 'Gustave Flaubert',
  },
  {
    text: 'La nostalgia è il desiderio di un luogo che non è mai esistito.',
    author: 'Simone Weil',
  },
  {
    text: 'Non sai mai con certezza di avere un ricordo finché non hai bisogno di ricordarlo.',
    author: 'Julian Barnes',
  },
  {
    text: 'I momenti più belli della vita sono troppo brevi per essere descritti e troppo lunghi per essere dimenticati.',
    author: 'Eduardo Galeano',
  },
  {
    text: 'Bisogna sempre avere qualcosa di bello da aspettare.',
    author: 'Paulo Coelho',
  },
  {
    text: 'La vita si capisce guardando indietro, ma si deve vivere guardando avanti.',
    author: 'Søren Kierkegaard',
  },
  {
    text: 'Ricordare è riportare alla vita ciò che il tempo aveva sepolto.',
    author: 'Isabel Allende',
  },
  {
    text: 'Le persone non muoiono mai mentre c\'è qualcuno che le ricorda.',
    author: 'Bob Marley',
  },
  {
    text: 'I ricordi non vivono come le persone vivono. Sono come rami di un albero — si può tagliarne uno ma l\'albero rimane.',
    author: 'Banana Yoshimoto',
  },
]

/**
 * Returns a deterministic quote based on the current day.
 * This means all users see the same quote on the same day,
 * and it doesn't change on re-renders.
 */
export function getDailyQuote(): MemoryQuote {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24),
  )
  return MEMORY_QUOTES[dayOfYear % MEMORY_QUOTES.length]
}

/**
 * Returns a random quote — for use inside useState(() => getRandomQuote())
 * so it's stable per component mount.
 */
export function getRandomQuote(): MemoryQuote {
  return MEMORY_QUOTES[Math.floor(Math.random() * MEMORY_QUOTES.length)]
}

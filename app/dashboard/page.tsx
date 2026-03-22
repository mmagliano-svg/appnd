import Link from 'next/link'
import { getUserMemories } from '@/actions/memories'
import { Button } from '@/components/ui/button'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function DashboardPage() {
  const memories = await getUserMemories()

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <div className="py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">I tuoi ricordi</h1>
          <Link href="/memories/new">
            <Button size="sm">+ Nuovo</Button>
          </Link>
        </div>

        {memories.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">🫧</p>
            <p className="text-muted-foreground text-sm">
              Non hai ancora nessun ricordo.
              <br />
              Inizia creando il primo momento condiviso.
            </p>
            <Link href="/memories/new">
              <Button className="mt-2">Crea il primo ricordo</Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {memories.map((memory) => {
              if (!memory) return null
              const contributionCount = memory.memory_contributions?.length ?? 0
              return (
                <li key={memory.id}>
                  <Link href={`/memories/${memory.id}`}>
                    <div className="rounded-xl border bg-card p-4 hover:bg-accent transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="font-medium text-sm leading-tight">
                            {memory.title}
                          </h2>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(memory.happened_at)}
                            {memory.location_name && ` · ${memory.location_name}`}
                          </p>
                        </div>
                        {contributionCount > 0 && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {contributionCount} contribut{contributionCount === 1 ? 'o' : 'i'}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}

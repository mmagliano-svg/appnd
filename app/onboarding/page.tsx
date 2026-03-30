import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getUserMemories } from '@/actions/memories'
import Link from 'next/link'

export default async function OnboardingPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const memories = await getUserMemories()
  if (memories.length > 0) redirect('/dashboard')

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-12">
        <div className="flex-1 flex flex-col justify-between">
          <div className="flex-1 flex flex-col justify-center">
            <div className="w-12 h-1 rounded-full bg-foreground mb-10" />
            <h1 className="text-4xl font-bold leading-tight tracking-tight mb-5">
              La tua vita è fatta di momenti.{' '}
              <span className="text-muted-foreground/50">
                Non lasciarli sparire.
              </span>
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Appnd ti aiuta a conservarli, organizzarli e riviverli —
              anche con le persone che erano lì con te.
            </p>
          </div>

          <Link
            href="/onboarding/trigger"
            className="w-full rounded-full bg-foreground text-background py-4 text-base font-semibold text-center hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Inizia
          </Link>
        </div>
      </div>
    </main>
  )
}

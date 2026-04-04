import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getUserMemories } from '@/actions/memories'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export const metadata = {
  title: 'Benvenuto — Appnd',
}

export default async function OnboardingPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Authenticated users who already have memories → skip onboarding
  if (user) {
    const memories = await getUserMemories()
    if (memories.length > 0) redirect('/dashboard')
  }

  return <OnboardingFlow />
}

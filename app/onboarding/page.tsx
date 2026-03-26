import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getUserMemories } from '@/actions/memories'
import { OnboardingClient } from './OnboardingClient'

export default async function OnboardingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // If user already has memories, skip onboarding
  const memories = await getUserMemories()
  if (memories.length > 0) redirect('/dashboard')

  return <OnboardingClient />
}

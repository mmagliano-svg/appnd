import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/types'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code  = requestUrl.searchParams.get('code')
  // next and draft are flat top-level params — never nested inside each other
  const next  = requestUrl.searchParams.get('next')  ?? '/dashboard'
  const draft = requestUrl.searchParams.get('draft') ?? ''

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Auto-match: link any pending invites that match this user's email
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const admin = createClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // Find unaccepted invites sent to this email address
        const { data: pendingInvites } = await admin
          .from('memory_participants')
          .select('id')
          .eq('invited_email', user.email.toLowerCase())
          .is('user_id', null)

        if (pendingInvites && pendingInvites.length > 0) {
          const ids = pendingInvites.map((r) => r.id)
          await admin
            .from('memory_participants')
            .update({
              user_id: user.id,
              joined_at: new Date().toISOString(),
            })
            .in('id', ids)
        }
      }

      // Build the final destination URL.
      // If a draft token was passed, append it explicitly to the destination so
      // /onboarding/restore can fetch the server-persisted draft regardless of
      // which browser or app context opened this link.
      const destination = new URL(next, requestUrl.origin)
      if (draft) destination.searchParams.set('draft', draft)

      return NextResponse.redirect(destination)
    }
  }

  return NextResponse.redirect(new URL('/auth/login?error=auth', requestUrl.origin))
}

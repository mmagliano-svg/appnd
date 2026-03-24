'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { generateInviteToken } from '@/lib/utils/invite'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'

export async function createInvite(memoryId: string, email: string) {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/auth/login')

  const { data: participant } = await supabase
    .from('memory_participants')
    .select('id')
    .eq('memory_id', memoryId)
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)
    .single()

  if (!participant) {
    throw new Error('Non sei autorizzato a invitare in questo ricordo.')
  }

  const { data: memory } = await supabase
    .from('memories')
    .select('title')
    .eq('id', memoryId)
    .single()

  const { data: inviter } = await supabase
    .from('users')
    .select('display_name, email')
    .eq('id', user.id)
    .single()

  const token = generateInviteToken()

  const { error: inviteError } = await supabase
    .from('memory_participants')
    .insert({
      memory_id: memoryId,
      invited_email: email.toLowerCase().trim(),
      invite_token: token,
    })

  if (inviteError) {
    throw new Error('Impossibile creare l\'invito. Riprova.')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteUrl = `${appUrl}/invite/${token}`
  const inviterName = inviter?.display_name ?? inviter?.email ?? 'Qualcuno'
  const memoryTitle = memory?.title ?? 'un ricordo condiviso'

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Appnd <noreply@appnd.app>',
      to: email,
      subject: `${inviterName} ti invita a ricordare insieme`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 8px;">Appnd</h1>
          <p style="color: #666; margin-bottom: 24px;">I momenti condivisi diventano ricordi condivisi.</p>
          <p style="margin-bottom: 8px;"><strong>${inviterName}</strong> ti ha invitato a co-costruire un ricordo:</p>
          <p style="font-size: 18px; font-weight: 500; margin-bottom: 24px;">"${memoryTitle}"</p>
          <a href="${inviteUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
            Accetta invito
          </a>
          <p style="margin-top: 24px; color: #999; font-size: 12px;">
            Oppure copia questo link: ${inviteUrl}
          </p>
        </div>
      `,
    })
  }

  return { token, inviteUrl }
}

export async function acceptInvite(token: string) {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect(`/auth/login?next=/invite/${token}`)
  }

  // Use admin client to bypass RLS — invited user's user_id is still NULL
  // so they can't read or update their own invite row via regular client
  const admin = createAdminClient()

  const { data: invite, error: inviteError } = await admin
    .from('memory_participants')
    .select('id, memory_id, joined_at')
    .eq('invite_token', token)
    .single()

  if (inviteError || !invite) {
    throw new Error('Invito non valido o scaduto.')
  }

  if (invite.joined_at) {
    redirect(`/memories/${invite.memory_id}`)
  }

  const { error: updateError } = await admin
    .from('memory_participants')
    .update({
      user_id: user!.id,
      joined_at: new Date().toISOString(),
    })
    .eq('id', invite.id)

  if (updateError) {
    throw new Error('Impossibile accettare l\'invito. Riprova.')
  }

  redirect(`/memories/${invite.memory_id}`)
}

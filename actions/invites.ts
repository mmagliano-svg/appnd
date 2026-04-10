'use server'

import { createServerClient, createAdminClient } from '@/lib/supabase/server'
import { generateInviteToken } from '@/lib/utils/invite'
import { getServerAppUrl } from '@/lib/utils/app-url'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'
import { sendJoinNotification } from '@/lib/email/notifications'

// Generate invite link immediately — email is optional
export async function createInvite(memoryId: string, email?: string) {
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
  const normalizedEmail = email?.toLowerCase().trim() || null

  // Use admin client to bypass RLS for invite insert.
  // The check constraint requires user_id, invited_email, OR display_name
  // to be non-null. When no email is provided (link-only share), populate
  // display_name with a placeholder so the row is valid.
  const admin = createAdminClient()
  const { error: inviteError } = await admin
    .from('memory_participants')
    .insert({
      memory_id: memoryId,
      invited_email: normalizedEmail,
      invite_token: token,
      display_name: normalizedEmail ? null : 'Invitato tramite link',
    })

  if (inviteError) {
    throw new Error('Impossibile creare l\'invito. Riprova.')
  }

  const appUrl = getServerAppUrl()
  const inviteUrl = `${appUrl}/invite/${token}`
  const inviterName = inviter?.display_name ?? inviter?.email ?? 'Qualcuno'
  const memoryTitle = memory?.title ?? 'un ricordo condiviso'

  // Send email only if provided and Resend is configured
  if (normalizedEmail && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Appnd <onboarding@resend.dev>',
      to: normalizedEmail,
      subject: `${inviterName} ti invita a ricordare insieme`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 8px;">Appnd</h1>
          <p style="color: #666; margin-bottom: 24px;">I momenti condivisi diventano ricordi condivisi.</p>
          <p style="margin-bottom: 8px; white-space: pre-line;">C'eri anche tu.<br>Ti ricordi questo momento?</p>
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

  // ── Notify memory creator (fire-and-forget) ──────────────────────────────
  try {
    const [{ data: memory }, { data: joiner }] = await Promise.all([
      admin.from('memories').select('title, created_by').eq('id', invite.memory_id).single(),
      admin.from('users').select('display_name, email').eq('id', user!.id).single(),
    ])

    if (memory && joiner) {
      const { data: creator } = await admin
        .from('users')
        .select('email')
        .eq('id', memory.created_by)
        .single()

      if (creator && creator.email !== joiner.email) {
        await sendJoinNotification({
          recipientEmail: creator.email,
          joinerName: joiner.display_name ?? joiner.email ?? 'Qualcuno',
          memoryTitle: memory.title,
          memoryId: invite.memory_id,
        })
      }
    }
  } catch {
    // Intentionally silent — notification must never break the invite flow
  }

  redirect(`/memories/${invite.memory_id}`)
}

// ── Person-specific shared-story invite ────────────────────────────────────

/**
 * Generate (or reuse) an invite link for a specific person tagged on a shared memory.
 * Route: /join/[token]
 * The person must be in memory_people and owned by the current user.
 */
export async function createMemoryInvite(
  memoryId: string,
  personId: string,
): Promise<{ token: string; inviteUrl: string }> {
  const supabase = await createServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/auth/login')

  // Verify caller participates in this memory
  const { data: participant } = await supabase
    .from('memory_participants')
    .select('id')
    .eq('memory_id', memoryId)
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)
    .maybeSingle()

  if (!participant) throw new Error('Non hai accesso a questo ricordo.')

  // Verify person is tagged on this memory by the caller
  const { data: personLink } = await supabase
    .from('memory_people')
    .select('person_id')
    .eq('memory_id', memoryId)
    .eq('person_id', personId)
    .maybeSingle()

  if (!personLink) throw new Error('Questa persona non è associata al ricordo.')

  const admin = createAdminClient()
  const appUrl = getServerAppUrl()

  // Reuse existing non-expired invite if present
  const { data: existing } = await admin
    .from('memory_invites')
    .select('token')
    .eq('memory_id', memoryId)
    .eq('person_id', personId)
    .neq('status', 'expired')
    .maybeSingle()

  if (existing) {
    return { token: existing.token, inviteUrl: `${appUrl}/join/${existing.token}` }
  }

  const token = generateInviteToken()
  const { error: insertError } = await admin
    .from('memory_invites')
    .insert({
      memory_id: memoryId,
      person_id: personId,
      inviter_user_id: user.id,
      token,
    })

  if (insertError) throw new Error('Impossibile creare l\'invito. Riprova.')

  // Mark memory as shared now that a person-specific invite has been created
  await admin
    .from('memories')
    .update({ sharing_status: 'shared' })
    .eq('id', memoryId)

  return { token, inviteUrl: `${appUrl}/join/${token}` }
}

/**
 * addNameParticipant
 *
 * Creates a name-only participant row on a memory.
 * No email is stored, no invite email is sent.
 * Used when the user adds someone by name only in the create flow.
 *
 * Requires the caller to be an authenticated participant of the memory.
 * Uses the admin client to bypass RLS for the insert.
 */
export async function addNameParticipant(
  memoryId: string,
  name: string,
): Promise<void> {
  const supabase = await createServerClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Non autenticato.')

  const name_trimmed = name.trim()
  if (!name_trimmed) return   // empty — skip silently

  // Verify caller participates in the memory
  const { data: participant } = await supabase
    .from('memory_participants')
    .select('id')
    .eq('memory_id', memoryId)
    .eq('user_id', user.id)
    .not('joined_at', 'is', null)
    .maybeSingle()

  if (!participant) throw new Error('Non sei autorizzato a modificare questo ricordo.')

  const admin = createAdminClient()
  const { error: insertError } = await admin
    .from('memory_participants')
    .insert({
      memory_id:    memoryId,
      display_name: name_trimmed,
      user_id:      null,
      invited_email: null,
      invite_token: generateInviteToken(),  // still required by schema (unique)
      joined_at:    null,                   // not joined — presence-only
    })

  if (insertError) {
    throw new Error('Impossibile aggiungere la persona. Riprova.')
  }
}

export async function removeParticipant(
  memoryId: string,
  participantId: string,
): Promise<{ error?: string }> {
  const supabase = await createServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Non autenticato' }

  // Only the memory creator can remove participants
  const { data: memory } = await supabase
    .from('memories')
    .select('created_by')
    .eq('id', memoryId)
    .single()

  if (!memory || memory.created_by !== user.id) {
    return { error: 'Non autorizzato' }
  }

  // Fetch the participant row to make sure it's for this memory and not the creator
  const admin = createAdminClient()
  const { data: participant } = await admin
    .from('memory_participants')
    .select('id, user_id')
    .eq('id', participantId)
    .eq('memory_id', memoryId)
    .single()

  if (!participant) return { error: 'Partecipante non trovato' }
  if (participant.user_id === user.id) return { error: 'Non puoi rimuovere te stesso' }

  const { error: deleteError } = await admin
    .from('memory_participants')
    .delete()
    .eq('id', participantId)

  if (deleteError) return { error: 'Impossibile rimuovere il partecipante' }

  return {}
}

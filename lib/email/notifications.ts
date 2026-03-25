import { Resend } from 'resend'

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ── Contribution notification ──────────────────────────────────────────────
// Sent to all participants of a memory (except the contributor)
// when someone adds text, a photo, or a note.

export async function sendContributionNotification({
  recipientEmail,
  contributorName,
  memoryTitle,
  memoryId,
  contentType,
}: {
  recipientEmail: string
  contributorName: string
  memoryTitle: string
  memoryId: string
  contentType: 'text' | 'photo' | 'note'
}) {
  if (!process.env.RESEND_API_KEY) return

  const resend = new Resend(process.env.RESEND_API_KEY)
  const memoryUrl = `${appUrl}/memories/${memoryId}`

  const contentLabel =
    contentType === 'photo' ? 'una foto'
    : contentType === 'note' ? 'una nota'
    : 'un ricordo scritto'

  await resend.emails.send({
    from: 'Appnd <onboarding@resend.dev>',
    to: recipientEmail,
    subject: `${contributorName} ha aggiunto ${contentLabel} a "${memoryTitle}"`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #fff; color: #111;">

        <p style="font-size: 13px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #999; margin: 0 0 32px 0;">
          Appnd
        </p>

        <h1 style="font-size: 22px; font-weight: 600; margin: 0 0 8px 0; line-height: 1.3;">
          ${contributorName} ha aggiunto ${contentLabel}
        </h1>

        <p style="font-size: 16px; color: #555; margin: 0 0 32px 0;">
          al ricordo <strong style="color: #111;">"${memoryTitle}"</strong>
        </p>

        <a href="${memoryUrl}"
          style="display: inline-block; background: #111; color: #fff; padding: 13px 28px; border-radius: 100px; text-decoration: none; font-size: 15px; font-weight: 500;">
          Vai al ricordo →
        </a>

        <hr style="border: none; border-top: 1px solid #eee; margin: 40px 0 24px 0;" />

        <p style="font-size: 12px; color: #bbb; margin: 0; line-height: 1.6;">
          Hai ricevuto questa email perché partecipi al ricordo "${memoryTitle}" su Appnd.<br>
          <a href="${appUrl}" style="color: #bbb;">appnd.vercel.app</a>
        </p>

      </div>
    `,
  })
}

/**
 * getServerAppUrl()
 *
 * Returns the correct public base URL for server-side code (Server Actions,
 * API routes, email helpers). Resolution order:
 *
 *  1. NEXT_PUBLIC_APP_URL  — if set and NOT localhost, use it as-is
 *  2. VERCEL_URL           — auto-injected by Vercel on every deployment;
 *                            always equals the actual deployment domain
 *  3. Hardcoded production — last-resort fallback; never localhost
 *
 * Do NOT use this for client-side emailRedirectTo — use window.location.origin
 * there so it follows the actual browser host.
 */
export function getServerAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured && !configured.includes('localhost')) return configured

  // VERCEL_URL is set automatically by Vercel (no protocol, no trailing slash)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`

  return 'https://appnd.vercel.app'
}

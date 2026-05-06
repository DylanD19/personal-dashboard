import { getAuthUrl } from '@/lib/api/google-calendar'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return Response.json(
      { error: 'Google OAuth not configured', clientId: !!clientId, clientSecret: !!clientSecret },
      { status: 503 }
    )
  }
  const url = getAuthUrl()
  redirect(url)
}

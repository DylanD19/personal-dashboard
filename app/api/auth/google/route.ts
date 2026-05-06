import { getAuthUrl } from '@/lib/api/google-calendar'
import { redirect } from 'next/navigation'

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return Response.json({ error: 'Google OAuth not configured' }, { status: 503 })
  }
  const url = getAuthUrl()
  redirect(url)
}

import { createLinkToken } from '@/lib/api/plaid'

export async function POST() {
  if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
    return Response.json({ error: 'Plaid not configured' }, { status: 503 })
  }

  try {
    const link_token = await createLinkToken()
    return Response.json({ link_token })
  } catch (err) {
    console.error('Plaid link token error:', err)
    return Response.json({ error: 'Failed to create link token' }, { status: 500 })
  }
}

import { NextRequest } from 'next/server'
import { getEvents, refreshAccessToken } from '@/lib/api/google-calendar'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const shouldRefresh = req.nextUrl.searchParams.get('refresh') === 'true'

  try {
    const token = await prisma.googleToken.findFirst()

    if (!token) {
      return Response.json({ connected: false, events: [] })
    }

    let accessToken = token.accessToken

    if (shouldRefresh || new Date() > token.expiresAt) {
      const refreshed = await refreshAccessToken(token.refreshToken)
      if (!refreshed.access_token) {
        return Response.json({ connected: true, events: [], error: 'Token refresh failed' })
      }
      await prisma.googleToken.update({
        where: { id: token.id },
        data: {
          accessToken: refreshed.access_token,
          expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
        },
      })
      accessToken = refreshed.access_token
    }

    const events = await getEvents(accessToken)
    return Response.json({ connected: true, events })
  } catch {
    return Response.json({ connected: false, events: [] })
  }
}

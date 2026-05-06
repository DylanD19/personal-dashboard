import { NextRequest } from 'next/server'
import { exchangeCode } from '@/lib/api/google-calendar'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    redirect('/schedule?error=auth_failed')
  }

  const tokens = await exchangeCode(code!)

  if (!tokens.access_token || !tokens.refresh_token) {
    redirect('/schedule?error=no_tokens')
  }

  await prisma.googleToken.upsert({
    where: { id: 'singleton' },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
    create: {
      id: 'singleton',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  })

  redirect('/schedule')
}

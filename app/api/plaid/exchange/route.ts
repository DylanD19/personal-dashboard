import { NextRequest } from 'next/server'
import { exchangePublicToken, getInstitutionName } from '@/lib/api/plaid'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { public_token } = await req.json()

  if (!public_token) {
    return Response.json({ error: 'public_token required' }, { status: 400 })
  }

  try {
    const { access_token, item_id } = await exchangePublicToken(public_token)
    const institutionName = await getInstitutionName(item_id, access_token)

    const item = await prisma.plaidItem.upsert({
      where: { itemId: item_id },
      update: { accessToken: access_token, institutionName },
      create: { accessToken: access_token, itemId: item_id, institutionName },
    })

    return Response.json({ success: true, institution: item.institutionName })
  } catch (err) {
    console.error('Plaid exchange error:', err)
    return Response.json({ error: 'Token exchange failed' }, { status: 500 })
  }
}

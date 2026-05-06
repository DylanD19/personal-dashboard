import { prisma } from '@/lib/prisma'

export async function GET() {
  const items = await prisma.plaidItem.findMany({
    select: { id: true, institutionName: true, lastSync: true },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json(items)
}

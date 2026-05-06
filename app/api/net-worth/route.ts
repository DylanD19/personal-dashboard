import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const snapshots = await prisma.netWorthSnapshot.findMany({
    orderBy: { date: 'desc' },
    take: 24,
  })
  return Response.json(snapshots)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { amount, note } = body

  if (amount === undefined || amount === null) {
    return Response.json({ error: 'amount is required' }, { status: 400 })
  }

  const snapshot = await prisma.netWorthSnapshot.create({
    data: { amount: parseFloat(amount), note: note || null },
  })

  return Response.json(snapshot, { status: 201 })
}

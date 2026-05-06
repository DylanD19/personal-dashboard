import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const transactions = await prisma.transaction.findMany({
    include: { category: true },
    orderBy: { date: 'desc' },
    take: 100,
  })
  return Response.json(transactions)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { amount, description, type, date, categoryId } = body

  if (!amount || !description || !type || !date) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const transaction = await prisma.transaction.create({
    data: {
      amount: parseFloat(amount),
      description: description.trim(),
      type,
      date: new Date(date),
      categoryId: categoryId || null,
    },
    include: { category: true },
  })

  return Response.json(transaction, { status: 201 })
}

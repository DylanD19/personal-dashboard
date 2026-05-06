import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const budgets = await prisma.budget.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json(budgets)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, amount, period = 'MONTHLY', categoryId } = body

  if (!name || !amount) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const budget = await prisma.budget.create({
    data: { name, amount: parseFloat(amount), period, categoryId: categoryId || null },
    include: { category: true },
  })

  return Response.json(budget, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })
  await prisma.budget.delete({ where: { id } })
  return new Response(null, { status: 204 })
}

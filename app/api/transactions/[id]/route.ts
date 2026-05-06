import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/transactions/[id]'>) {
  const { id } = await ctx.params
  const body = await req.json()

  const tx = await prisma.transaction.update({
    where: { id },
    data: {
      ...(body.amount !== undefined && { amount: parseFloat(body.amount) }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
    },
    include: { category: true },
  })

  return Response.json(tx)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/transactions/[id]'>) {
  const { id } = await ctx.params
  await prisma.transaction.delete({ where: { id } })
  return new Response(null, { status: 204 })
}

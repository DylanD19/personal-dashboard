import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, ctx: RouteContext<'/api/todos/[id]'>) {
  const { id } = await ctx.params
  const body = await req.json()

  const todo = await prisma.todo.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.completed !== undefined && { completed: body.completed }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
    },
  })

  return Response.json(todo)
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/todos/[id]'>) {
  const { id } = await ctx.params
  await prisma.todo.delete({ where: { id } })
  return new Response(null, { status: 204 })
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const todos = await prisma.todo.findMany({
    orderBy: [{ completed: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
  })
  return Response.json(todos)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, priority = 'MEDIUM', dueDate } = body

  if (!title?.trim()) {
    return Response.json({ error: 'Title is required' }, { status: 400 })
  }

  const todo = await prisma.todo.create({
    data: {
      title: title.trim(),
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  })

  return Response.json(todo, { status: 201 })
}

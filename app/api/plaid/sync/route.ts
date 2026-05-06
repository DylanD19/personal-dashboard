import { syncTransactions } from '@/lib/api/plaid'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const items = await prisma.plaidItem.findMany()

  if (items.length === 0) {
    return Response.json({ message: 'No banks connected' })
  }

  let totalAdded = 0

  for (const item of items) {
    const data = await syncTransactions(item.accessToken)

    for (const tx of data.added) {
      await prisma.transaction.upsert({
        where: { plaidTxId: tx.transaction_id },
        update: {},
        create: {
          plaidTxId: tx.transaction_id,
          amount: Math.abs(tx.amount),
          description: tx.name,
          type: tx.amount < 0 ? 'INCOME' : 'EXPENSE',
          date: new Date(tx.date),
        },
      })
      totalAdded++
    }

    await prisma.plaidItem.update({
      where: { id: item.id },
      data: { lastSync: new Date() },
    })
  }

  return Response.json({ synced: totalAdded })
}

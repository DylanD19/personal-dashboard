import { getWsjHeadlines, getFinancialNews } from '@/lib/api/newsapi'

export async function GET() {
  const [wsj, financial] = await Promise.all([
    getWsjHeadlines().catch(() => []),
    getFinancialNews().catch(() => []),
  ])
  return Response.json({ wsj, financial })
}

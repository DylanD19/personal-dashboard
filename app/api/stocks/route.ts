import { NextRequest } from 'next/server'
import { getQuote, getTopBottomPerformers, getMarketNews } from '@/lib/api/finnhub'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const type = searchParams.get('type')

  if (type === 'performers') {
    const data = await getTopBottomPerformers()
    return Response.json(data)
  }

  if (type === 'news') {
    const news = await getMarketNews()
    return Response.json({ news })
  }

  const symbol = searchParams.get('symbol')
  if (symbol) {
    const quote = await getQuote(symbol)
    return Response.json({ symbol, quote })
  }

  // Default: return all indices
  const [sp500, nasdaq, dow] = await Promise.all([
    getQuote('^GSPC').catch(() => null),
    getQuote('^IXIC').catch(() => null),
    getQuote('^DJI').catch(() => null),
  ])

  return Response.json({ sp500, nasdaq, dow })
}

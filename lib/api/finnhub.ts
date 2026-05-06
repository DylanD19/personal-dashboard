const BASE = 'https://finnhub.io/api/v1'
const KEY = process.env.FINNHUB_API_KEY

export interface StockQuote {
  c: number   // current price
  d: number   // change
  dp: number  // change percent
  h: number   // high
  l: number   // low
  o: number   // open
  pc: number  // previous close
}

export interface MarketNewsItem {
  category: string
  datetime: number
  headline: string
  id: number
  image: string
  related: string
  source: string
  summary: string
  url: string
}

export interface StockPerformer extends StockQuote {
  symbol: string
}

async function fetchFinnhub(path: string): Promise<unknown> {
  if (!KEY) return null
  try {
    const res = await fetch(`${BASE}${path}&token=${KEY}`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function getQuote(symbol: string): Promise<StockQuote | null> {
  return fetchFinnhub(`/quote?symbol=${encodeURIComponent(symbol)}`) as Promise<StockQuote | null>
}

export async function getMarketNews(category: 'general' | 'forex' | 'crypto' | 'merger' = 'general'): Promise<MarketNewsItem[]> {
  const data = await fetchFinnhub(`/news?category=${category}`)
  return (data as MarketNewsItem[]) || []
}

const WATCH_LIST = [
  'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'NVDA', 'TSLA', 'NFLX',
  'JPM', 'V', 'MA', 'DIS', 'AMD', 'CRM', 'ORCL', 'BRKB',
]

export async function getTopBottomPerformers(): Promise<{ top: StockPerformer[]; bottom: StockPerformer[] }> {
  if (!KEY) return { top: [], bottom: [] }

  const quotes = await Promise.all(
    WATCH_LIST.map(async symbol => {
      const q = await getQuote(symbol)
      return q ? { symbol, ...q } : null
    })
  )

  const valid = quotes.filter((q): q is { symbol: string } & StockQuote => q !== null && !isNaN(q.dp))
  const sorted = [...valid].sort((a, b) => b.dp - a.dp)

  return {
    top: sorted.slice(0, 5),
    bottom: sorted.slice(-5).reverse(),
  }
}

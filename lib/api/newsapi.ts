const BASE = 'https://newsapi.org/v2'
const KEY = process.env.NEWSAPI_KEY

export interface NewsArticle {
  source: { id: string | null; name: string }
  author: string | null
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
}

async function fetchNews(url: string): Promise<NewsArticle[]> {
  if (!KEY) return []
  try {
    const res = await fetch(url, { next: { revalidate: 600 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.articles || []
  } catch {
    return []
  }
}

export async function getWsjHeadlines(): Promise<NewsArticle[]> {
  return fetchNews(
    `${BASE}/top-headlines?sources=the-wall-street-journal&apiKey=${KEY}&pageSize=10`
  )
}

export async function getFinancialNews(): Promise<NewsArticle[]> {
  return fetchNews(
    `${BASE}/everything?q=stock+market+wall+street&language=en&sortBy=publishedAt&apiKey=${KEY}&pageSize=8`
  )
}

export async function getTopHeadlines(): Promise<NewsArticle[]> {
  return fetchNews(
    `${BASE}/top-headlines?country=us&apiKey=${KEY}&pageSize=8`
  )
}

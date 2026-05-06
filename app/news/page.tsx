import { Newspaper, TrendingUp, TrendingDown, ArrowUpRight, BarChart2 } from 'lucide-react'
import { getQuote, getTopBottomPerformers, getMarketNews } from '@/lib/api/finnhub'
import { formatDistanceToNow } from 'date-fns'

export const revalidate = 1800

function fmt(n: number | null | undefined, digits = 2) {
  if (n == null || isNaN(n)) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function IndexCard({ label, value, change, changePct }: {
  label: string; value: number | null; change: number | null; changePct: number | null
}) {
  const up = (changePct ?? 0) >= 0
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
      <p className="text-xs text-zinc-500 font-medium mb-2">{label}</p>
      {value !== null ? (
        <>
          <p className="text-xl font-bold text-zinc-100 tabular-nums">{fmt(value, 0)}</p>
          <div className={`flex items-center gap-1 mt-1 ${up ? 'text-emerald-400' : 'text-red-400'}`}>
            {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span className="text-xs tabular-nums font-semibold">
              {change !== null && `${change >= 0 ? '+' : ''}${fmt(change)}`}
              {changePct !== null && ` · ${changePct >= 0 ? '+' : ''}${fmt(changePct)}%`}
            </span>
          </div>
        </>
      ) : (
        <div className="space-y-2 mt-1">
          <div className="h-6 bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" />
        </div>
      )}
    </div>
  )
}

export default async function NewsPage() {
  const [sp500, nasdaq, dow, performers, generalNews, mergerNews] = await Promise.all([
    getQuote('^GSPC').catch(() => null),
    getQuote('^IXIC').catch(() => null),
    getQuote('^DJI').catch(() => null),
    getTopBottomPerformers().catch(() => ({ top: [], bottom: [] })),
    getMarketNews('general').catch(() => []),
    getMarketNews('merger').catch(() => []),
  ])

  // Combine and deduplicate by id, sort by newest
  const seen = new Set<number>()
  const allNews = [...generalNews, ...mergerNews]
    .filter(item => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
    .sort((a, b) => b.datetime - a.datetime)
    .slice(0, 20)

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Newspaper size={18} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-100">News & Markets</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Live market news · Stocks · Top performers</p>
        </div>
      </div>

      {/* Market Indices */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={14} className="text-amber-400" />
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Market Overview</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <IndexCard label="S&P 500" value={sp500?.c ?? null} change={sp500?.d ?? null} changePct={sp500?.dp ?? null} />
          <IndexCard label="NASDAQ" value={nasdaq?.c ?? null} change={nasdaq?.d ?? null} changePct={nasdaq?.dp ?? null} />
          <IndexCard label="DOW JONES" value={dow?.c ?? null} change={dow?.d ?? null} changePct={dow?.dp ?? null} />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* News feed */}
        <section className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-2">
            <Newspaper size={14} className="text-amber-400" />
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Today&apos;s Market News</h2>
          </div>

          {allNews.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <Newspaper size={32} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-sm font-medium text-zinc-400">No news available</p>
              <p className="text-xs text-zinc-600 mt-1">Add your Finnhub API key to see live market news</p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="divide-y divide-zinc-800">
                {allNews.map(item => (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex gap-4 p-4 hover:bg-zinc-800/50 transition-colors group"
                  >
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt=""
                        className="w-20 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 font-medium leading-snug group-hover:text-white transition-colors line-clamp-2">
                        {item.headline}
                      </p>
                      {item.summary && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.summary}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-zinc-600 font-medium">{item.source}</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-[10px] text-zinc-600">
                          {formatDistanceToNow(new Date(item.datetime * 1000), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight size={13} className="text-zinc-700 group-hover:text-zinc-400 flex-shrink-0 mt-1" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Stocks sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Top Performers */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-emerald-400" />
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Top Gainers</h2>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {performers.top.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-zinc-500">Add Finnhub API key for stock data</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {performers.top.map(stock => (
                    <div key={stock.symbol} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-zinc-400">{stock.symbol.slice(0, 3)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-zinc-200">{stock.symbol}</p>
                        <p className="text-xs text-zinc-500 tabular-nums">${fmt(stock.c)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-400 tabular-nums">+{fmt(stock.dp)}%</p>
                        <p className="text-xs text-zinc-600 tabular-nums">+{fmt(stock.d)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Bottom Performers */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown size={14} className="text-red-400" />
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Top Losers</h2>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {performers.bottom.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-zinc-500">Add Finnhub API key for stock data</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {performers.bottom.map(stock => (
                    <div key={stock.symbol} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-zinc-400">{stock.symbol.slice(0, 3)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-zinc-200">{stock.symbol}</p>
                        <p className="text-xs text-zinc-500 tabular-nums">${fmt(stock.c)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-400 tabular-nums">{fmt(stock.dp)}%</p>
                        <p className="text-xs text-zinc-600 tabular-nums">{fmt(stock.d)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

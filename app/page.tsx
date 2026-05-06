import {
  TrendingUp, TrendingDown, Trophy, Newspaper, CheckSquare2,
  Calendar, ArrowUpRight, Minus, BarChart2
} from 'lucide-react'
import { getCubsGame, getBullsGame, getBearsGame } from '@/lib/api/espn'
import { getQuote } from '@/lib/api/finnhub'
import { getWsjHeadlines } from '@/lib/api/newsapi'
import { prisma } from '@/lib/prisma'
import { refreshAccessToken, getEvents } from '@/lib/api/google-calendar'
import { formatDistanceToNow, format } from 'date-fns'

function fmt(n: number, digits = 2) {
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

function MarketCard({
  label, symbol, value, change, changePct,
}: {
  label: string; symbol: string; value: number | null; change: number | null; changePct: number | null
}) {
  const up = (changePct ?? 0) >= 0
  const color = up ? 'text-emerald-400' : 'text-red-400'
  const Icon = up ? TrendingUp : TrendingDown

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</span>
        <span className="text-[10px] text-zinc-600 font-mono">{symbol}</span>
      </div>
      {value !== null ? (
        <>
          <p className="text-2xl font-bold text-zinc-100 tabular-nums">
            {symbol.startsWith('^') ? fmt(value, 0) : `$${fmt(value)}`}
          </p>
          <div className={`flex items-center gap-1 mt-1.5 ${color}`}>
            <Icon size={13} />
            <span className="text-xs font-semibold tabular-nums">
              {change !== null && `${change >= 0 ? '+' : ''}${fmt(change)}`}
              {changePct !== null && ` (${changePct >= 0 ? '+' : ''}${fmt(changePct)}%)`}
            </span>
          </div>
        </>
      ) : (
        <div className="space-y-2 mt-1">
          <div className="h-7 bg-zinc-800 rounded animate-pulse" />
          <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
        </div>
      )}
    </div>
  )
}

function SportScoreCard({ game, teamId, sport }: { game: ReturnType<typeof getCubsGame> extends Promise<infer T> ? T : never, teamId: string, sport: string }) {
  if (!game) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
          <Trophy size={16} className="text-zinc-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-400">{sport}</p>
          <p className="text-xs text-zinc-600 mt-0.5">No game today</p>
        </div>
      </div>
    )
  }

  const comps = game.competitions[0]?.competitors || []
  const my = comps.find(c => c.team.id === teamId)
  const opp = comps.find(c => c.team.id !== teamId)
  const status = game.status.type

  if (!my || !opp) return null

  const myScore = parseInt(my.score || '0')
  const oppScore = parseInt(opp.score || '0')
  const isWin = my.winner || (!status.completed && myScore > oppScore)
  const isLoss = !my.winner && status.completed && myScore < oppScore

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 font-medium">{sport}</span>
        <span
          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            status.completed
              ? isWin ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'
              : 'bg-amber-900/40 text-amber-400'
          }`}
        >
          {status.completed ? (isWin ? 'W' : isLoss ? 'L' : 'T') : status.description}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-center">
          <p className="text-xs text-zinc-500 mb-0.5">{my.team.abbreviation}</p>
          <p className="text-2xl font-bold text-zinc-100 tabular-nums">{my.score || '–'}</p>
        </div>
        <span className="text-zinc-600 text-sm font-medium">vs</span>
        <div className="text-center">
          <p className="text-xs text-zinc-500 mb-0.5">{opp.team.abbreviation}</p>
          <p className="text-2xl font-bold text-zinc-400 tabular-nums">{opp.score || '–'}</p>
        </div>
      </div>
      <p className="text-[11px] text-zinc-600 mt-2 truncate">{game.shortName}</p>
    </div>
  )
}

export default async function Home() {
  const [cubsGame, bullsGame, bearsGame, sp500, nasdaq, dow, headlines, pendingTodos, calendarEvents] =
    await Promise.all([
      getCubsGame(),
      getBullsGame(),
      getBearsGame(),
      getQuote('^GSPC').catch(() => null),
      getQuote('^IXIC').catch(() => null),
      getQuote('^DJI').catch(() => null),
      getWsjHeadlines().catch(() => []),
      prisma.todo
        .findMany({ where: { completed: false }, orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }], take: 5 })
        .catch(() => []),
      (async () => {
        try {
          const token = await prisma.googleToken.findFirst()
          if (!token) return []
          if (new Date() > token.expiresAt) {
            const refreshed = await refreshAccessToken(token.refreshToken)
            if (!refreshed.access_token) return []
            await prisma.googleToken.update({
              where: { id: token.id },
              data: {
                accessToken: refreshed.access_token,
                expiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
              },
            })
            return getEvents(refreshed.access_token)
          }
          return getEvents(token.accessToken)
        } catch {
          return []
        }
      })(),
    ])

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const priorityColor: Record<string, string> = {
    HIGH: 'text-red-400',
    MEDIUM: 'text-amber-400',
    LOW: 'text-zinc-500',
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">{greeting}, Dylan</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {format(now, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg">
            <span className="text-xs text-zinc-400 tabular-nums">{format(now, 'h:mm a')}</span>
          </div>
        </div>
      </div>

      {/* Market Overview */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={15} className="text-violet-400" />
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Markets</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MarketCard label="S&P 500" symbol="^GSPC" value={sp500?.c ?? null} change={sp500?.d ?? null} changePct={sp500?.dp ?? null} />
          <MarketCard label="NASDAQ" symbol="^IXIC" value={nasdaq?.c ?? null} change={nasdaq?.d ?? null} changePct={nasdaq?.dp ?? null} />
          <MarketCard label="DOW" symbol="^DJI" value={dow?.c ?? null} change={dow?.d ?? null} changePct={dow?.dp ?? null} />
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-3">Today&apos;s Summary</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <CheckSquare2 size={13} className="text-pink-400" /> Todos
                </span>
                <span className="font-semibold text-zinc-100">{pendingTodos.length} pending</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Calendar size={13} className="text-indigo-400" /> Events
                </span>
                <span className="font-semibold text-zinc-100">{calendarEvents.length} upcoming</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <Newspaper size={13} className="text-amber-400" /> Headlines
                </span>
                <span className="font-semibold text-zinc-100">{headlines.length} articles</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sports Scores */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={15} className="text-cyan-400" />
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Today&apos;s Scores</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SportScoreCard game={cubsGame} teamId="16" sport="Cubs · MLB" />
          <SportScoreCard game={bullsGame} teamId="4" sport="Bulls · NBA" />
          <SportScoreCard game={bearsGame} teamId="3" sport="Bears · NFL" />
        </div>
      </section>

      {/* News + Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Headlines */}
        <section className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Newspaper size={15} className="text-amber-400" />
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Top Headlines</h2>
            </div>
            <a href="/news" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ArrowUpRight size={11} />
            </a>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {headlines.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-zinc-500">Add your NewsAPI key to see headlines</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {headlines.slice(0, 6).map((article, i) => (
                  <a
                    key={i}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 p-4 hover:bg-zinc-800/50 transition-colors group"
                  >
                    <span className="text-xs text-zinc-600 tabular-nums mt-0.5 font-mono">{String(i + 1).padStart(2, '0')}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 font-medium leading-snug group-hover:text-white transition-colors line-clamp-2">
                        {article.title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {article.source.name} · {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                      </p>
                    </div>
                    <ArrowUpRight size={13} className="text-zinc-700 group-hover:text-zinc-400 transition-colors flex-shrink-0 mt-0.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Calendar + Todos */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upcoming Events */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-indigo-400" />
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Upcoming</h2>
              </div>
              <a href="/schedule" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                View all <ArrowUpRight size={11} />
              </a>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {calendarEvents.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-zinc-500">Connect Google Calendar to see events</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {calendarEvents.slice(0, 4).map((event: import('@/lib/api/google-calendar').CalendarEvent) => {
                    const start = event.start.dateTime || event.start.date
                    return (
                      <div key={event.id} className="flex items-start gap-3 p-3">
                        <div className="w-1 h-full rounded-full bg-indigo-500 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-200 font-medium truncate">{event.summary}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {start ? format(new Date(start), 'MMM d · h:mm a') : 'All day'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Quick Todos */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare2 size={15} className="text-pink-400" />
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">To-Do</h2>
              </div>
              <a href="/todos" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
                View all <ArrowUpRight size={11} />
              </a>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {pendingTodos.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-zinc-500">All clear!</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {pendingTodos.map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 p-3">
                      <Minus size={12} className={priorityColor[todo.priority]} />
                      <p className="text-sm text-zinc-300 flex-1 truncate">{todo.title}</p>
                      {todo.dueDate && (
                        <span className="text-[10px] text-zinc-600 flex-shrink-0">
                          {format(todo.dueDate, 'MMM d')}
                        </span>
                      )}
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

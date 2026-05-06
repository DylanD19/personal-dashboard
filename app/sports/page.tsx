'use client'

import { useState, useEffect } from 'react'
import { Trophy, RefreshCw, ArrowUpRight, Calendar, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

type Team = {
  id: string
  displayName: string
  abbreviation: string
  logo: string
  color: string
}

type Game = {
  id: string
  date: string
  shortName: string
  name: string
  status: { type: { name: string; description: string; completed: boolean; state: string }; displayClock: string; period: number }
  competitions: Array<{ competitors: Array<{ team: Team; score: string; homeAway: 'home' | 'away'; winner?: boolean; records?: Array<{ name: string; summary: string }> }> }>
}

type NewsItem = {
  headline: string
  description?: string
  published: string
  images?: Array<{ url: string }>
  links?: { web?: { href: string } }
}

type SportData = {
  game: Game | null
  news: NewsItem[]
  loading: boolean
}

const TEAMS = {
  cubs:  { id: '16', name: 'Chicago Cubs',  sport: 'baseball/mlb',     abbr: 'CHC', primaryColor: '#0E3386', accentColor: '#CC3433' },
  bears: { id: '3',  name: 'Chicago Bears', sport: 'football/nfl',     abbr: 'CHI', primaryColor: '#0B162A', accentColor: '#C83803' },
  bulls: { id: '4',  name: 'Chicago Bulls', sport: 'basketball/nba',   abbr: 'CHI', primaryColor: '#CE1141', accentColor: '#000000' },
}

type TeamKey = keyof typeof TEAMS

function ScoreCard({ game, teamId }: { game: Game | null; teamId: string }) {
  if (!game) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
        <p className="text-zinc-500 text-sm">No game scheduled today</p>
      </div>
    )
  }

  const comps = game.competitions[0]?.competitors || []
  const my = comps.find(c => c.team.id === teamId)
  const opp = comps.find(c => c.team.id !== teamId)
  if (!my || !opp) return null

  const myScore = parseInt(my.score || '0')
  const oppScore = parseInt(opp.score || '0')
  const status = game.status.type
  const isWin = my.winner || (!status.completed && myScore > oppScore)

  const record = my.records?.find(r => r.name === 'overall' || r.name === 'All Splits')?.summary

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-zinc-500 font-medium">
          {format(new Date(game.date), 'MMM d, yyyy')}
        </span>
        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
          status.state === 'in' ? 'bg-emerald-900/40 text-emerald-400 animate-pulse' :
          status.completed
            ? isWin ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'
            : 'bg-zinc-800 text-zinc-400'
        }`}>
          {status.state === 'in' ? `LIVE · ${status.description}` : status.completed ? (isWin ? 'WIN' : 'LOSS') : 'UPCOMING'}
        </span>
      </div>

      <div className="flex items-center justify-between py-2">
        <div className="flex flex-col items-center gap-2 flex-1">
          {my.team.logo ? (
            <img src={my.team.logo} alt={my.team.displayName} className="w-16 h-16 object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
              <span className="text-2xl font-black text-zinc-400">{my.team.abbreviation}</span>
            </div>
          )}
          <p className="text-sm font-semibold text-zinc-200">{my.team.abbreviation}</p>
          <p className="text-4xl font-black text-zinc-100 tabular-nums">{my.score || '–'}</p>
          {record && <p className="text-xs text-zinc-500">{record}</p>}
        </div>

        <div className="flex flex-col items-center gap-1 px-4">
          <span className="text-zinc-600 text-lg font-bold">VS</span>
          {status.state === 'in' && (
            <span className="text-xs text-amber-400 font-mono">
              {game.status.displayClock}
              {game.status.period > 0 && ` · P${game.status.period}`}
            </span>
          )}
        </div>

        <div className="flex flex-col items-center gap-2 flex-1">
          {opp.team.logo ? (
            <img src={opp.team.logo} alt={opp.team.displayName} className="w-16 h-16 object-contain opacity-80" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
              <span className="text-2xl font-black text-zinc-500">{opp.team.abbreviation}</span>
            </div>
          )}
          <p className="text-sm font-semibold text-zinc-400">{opp.team.abbreviation}</p>
          <p className="text-4xl font-black text-zinc-400 tabular-nums">{opp.score || '–'}</p>
          <p className="text-xs text-zinc-600">
            {opp.records?.find(r => r.name === 'overall' || r.name === 'All Splits')?.summary}
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-500 mt-3">{game.name}</p>
    </div>
  )
}

function NewsCard({ items }: { items: NewsItem[] }) {
  if (items.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
        <p className="text-sm text-zinc-500">No recent news</p>
      </div>
    )
  }
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="divide-y divide-zinc-800">
        {items.map((item, i) => (
          <a
            key={i}
            href={item.links?.web?.href || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-4 hover:bg-zinc-800/50 transition-colors group"
          >
            {item.images?.[0]?.url && (
              <img src={item.images[0].url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-200 font-medium leading-snug group-hover:text-white transition-colors line-clamp-2">
                {item.headline}
              </p>
              {item.description && (
                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{item.description}</p>
              )}
              <p className="text-[10px] text-zinc-600 mt-1">
                {new Date(item.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <ArrowUpRight size={13} className="text-zinc-700 group-hover:text-zinc-400 flex-shrink-0 mt-1" />
          </a>
        ))}
      </div>
    </div>
  )
}

export default function SportsPage() {
  const [activeTab, setActiveTab] = useState<TeamKey>('cubs')
  const [data, setData] = useState<Record<TeamKey, SportData>>({
    cubs:  { game: null, news: [], loading: true },
    bears: { game: null, news: [], loading: true },
    bulls: { game: null, news: [], loading: true },
  })

  useEffect(() => {
    const team = TEAMS[activeTab]
    if (!data[activeTab].loading) return

    Promise.all([
      fetch(`/api/sports?sport=${team.sport}&teamId=${team.id}`).then(r => r.json()).catch(() => ({ game: null })),
      fetch(`/api/sports?sport=${team.sport}&teamId=${team.id}&type=news`).then(r => r.json()).catch(() => ({ articles: [] })),
    ]).then(([gameData, newsData]) => {
      setData(prev => ({
        ...prev,
        [activeTab]: { game: gameData.game, news: newsData.articles || [], loading: false },
      }))
    })
  }, [activeTab])

  const refresh = () => {
    setData(prev => ({ ...prev, [activeTab]: { ...prev[activeTab], loading: true } }))
  }

  const current = data[activeTab]
  const teamInfo = TEAMS[activeTab]

  const tabs: { key: TeamKey; label: string; emoji: string }[] = [
    { key: 'cubs',  label: 'Cubs',  emoji: '⚾' },
    { key: 'bulls', label: 'Bulls', emoji: '🏀' },
    { key: 'bears', label: 'Bears', emoji: '🏈' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Trophy size={18} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Sports</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Cubs · Bears · Bulls</p>
          </div>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
        >
          <RefreshCw size={12} className={current.loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 w-fit">
        {tabs.map(({ key, label, emoji }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>{emoji}</span>
            {label}
          </button>
        ))}
      </div>

      {current.loading ? (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-pulse">
            <div className="h-32 bg-zinc-800 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
                <div className="h-16 bg-zinc-800 rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Score */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-cyan-400" />
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Today&apos;s Game</h2>
            </div>
            <ScoreCard game={current.game} teamId={teamInfo.id} />
          </div>

          {/* News */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={14} className="text-cyan-400" />
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Latest News</h2>
            </div>
            <NewsCard items={current.news} />
          </div>
        </div>
      )}
    </div>
  )
}

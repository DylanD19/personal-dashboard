'use client'

import { useState, useEffect } from 'react'
import { Calendar, Plus, ExternalLink, Clock, MapPin, RefreshCw, LogIn } from 'lucide-react'
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns'

type CalEvent = {
  id: string
  summary: string
  description?: string
  location?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  htmlLink: string
  colorId?: string
}

const COLOR_MAP: Record<string, string> = {
  '1': '#a4bdfc', '2': '#7ae28c', '3': '#dbadff', '4': '#ff887c',
  '5': '#fbd75b', '6': '#ffb878', '7': '#46d6db', '8': '#e1e1e1',
  '9': '#5484ed', '10': '#51b749', '11': '#dc2127',
}

function groupByDate(events: CalEvent[]) {
  const groups: Record<string, CalEvent[]> = {}
  events.forEach(e => {
    const raw = e.start.dateTime || e.start.date || ''
    const key = raw.split('T')[0]
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  })
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
}

function dateLabel(dateStr: string) {
  const d = parseISO(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  if (isThisWeek(d)) return format(d, 'EEEE')
  return format(d, 'MMMM d, yyyy')
}

function EventCard({ event }: { event: CalEvent }) {
  const start = event.start.dateTime
  const isAllDay = !event.start.dateTime
  const color = event.colorId ? COLOR_MAP[event.colorId] : '#8b5cf6'

  return (
    <div className="flex gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors group">
      <div className="w-1 rounded-full flex-shrink-0 self-stretch" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
          {event.summary}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
          {!isAllDay && start && (
            <span className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock size={11} />
              {format(parseISO(start), 'h:mm a')}
              {event.end.dateTime && ` – ${format(parseISO(event.end.dateTime), 'h:mm a')}`}
            </span>
          )}
          {isAllDay && (
            <span className="text-xs text-zinc-500">All day</span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-zinc-500 truncate">
              <MapPin size={11} />
              {event.location}
            </span>
          )}
        </div>
        {event.description && (
          <p className="text-xs text-zinc-600 mt-1 line-clamp-1">{event.description}</p>
        )}
      </div>
      <a
        href={event.htmlLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-zinc-700 hover:text-zinc-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
      >
        <ExternalLink size={13} />
      </a>
    </div>
  )
}

export default function SchedulePage() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [connected, setConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetch('/api/calendar')
      .then(r => r.json())
      .then(data => {
        setConnected(data.connected)
        setEvents(data.events || [])
        setLoading(false)
      })
      .catch(() => { setConnected(false); setLoading(false) })
  }, [])

  const handleConnect = () => {
    window.location.href = '/api/auth/google'
  }

  const handleSync = async () => {
    setSyncing(true)
    const res = await fetch('/api/calendar?refresh=true')
    const data = await res.json()
    setEvents(data.events || [])
    setSyncing(false)
  }

  const grouped = groupByDate(events)
  const todayEvents = events.filter(e => {
    const d = e.start.dateTime || e.start.date || ''
    return d.startsWith(format(new Date(), 'yyyy-MM-dd'))
  })

  return (
    <div className="p-6 space-y-6 max-w-[900px]">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Calendar size={18} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Schedule</h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {connected ? `${events.length} upcoming events` : 'Google Calendar'}
            </p>
          </div>
        </div>
        {connected && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            Sync
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-1/2 mb-2" />
              <div className="h-3 bg-zinc-800 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : !connected ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center">
          <Calendar size={40} className="text-zinc-700 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-zinc-300 mb-2">Connect Google Calendar</h2>
          <p className="text-sm text-zinc-500 mb-6 max-w-sm mx-auto">
            Connect your Google account to see your upcoming events, meetings, and schedule.
          </p>
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <LogIn size={16} />
            Connect Google Calendar
          </button>
        </div>
      ) : (
        <>
          {/* Today's Summary */}
          {todayEvents.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Today — {format(new Date(), 'MMMM d')}</h2>
              </div>
              <div className="space-y-2">
                {todayEvents.map(e => <EventCard key={e.id} event={e} />)}
              </div>
            </section>
          )}

          {/* Grouped upcoming */}
          {grouped.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-sm text-zinc-500">No upcoming events in the next 30 days</p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([dateKey, dayEvents]) => {
                const isToday = dateKey === format(new Date(), 'yyyy-MM-dd')
                if (isToday) return null
                return (
                  <section key={dateKey}>
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                      {dateLabel(dateKey)}
                      <span className="ml-2 text-zinc-600 normal-case">{format(parseISO(dateKey), 'MMMM d')}</span>
                    </h2>
                    <div className="space-y-2">
                      {dayEvents.map(e => <EventCard key={e.id} event={e} />)}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

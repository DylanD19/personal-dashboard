const BASE = 'https://site.api.espn.com/apis/site/v2/sports'

export interface EspnCompetitor {
  team: { id: string; displayName: string; abbreviation: string; logo: string; color: string }
  score: string
  homeAway: 'home' | 'away'
  winner?: boolean
  records?: Array<{ name: string; summary: string }>
}

export interface EspnGame {
  id: string
  date: string
  name: string
  shortName: string
  status: {
    type: { name: string; description: string; completed: boolean; state: string }
    displayClock: string
    period: number
  }
  competitions: Array<{ competitors: EspnCompetitor[] }>
}

export interface EspnNewsItem {
  headline: string
  description?: string
  published: string
  images?: Array<{ url: string; width?: number }>
  links?: { web?: { href: string } }
  categories?: Array<{ description?: string }>
}

async function fetchEspn(url: string) {
  try {
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function findTeam(events: EspnGame[], teamId: string): EspnGame | null {
  return (
    events.find(e =>
      e.competitions[0]?.competitors.some(c => c.team.id === teamId)
    ) || null
  )
}

export async function getCubsGame(): Promise<EspnGame | null> {
  const data = await fetchEspn(`${BASE}/baseball/mlb/scoreboard`)
  return data?.events ? findTeam(data.events, '16') : null
}

export async function getBearsGame(): Promise<EspnGame | null> {
  const data = await fetchEspn(`${BASE}/football/nfl/scoreboard`)
  return data?.events ? findTeam(data.events, '3') : null
}

export async function getBullsGame(): Promise<EspnGame | null> {
  const data = await fetchEspn(`${BASE}/basketball/nba/scoreboard`)
  return data?.events ? findTeam(data.events, '4') : null
}

export async function getCubsNews(): Promise<EspnNewsItem[]> {
  const data = await fetchEspn(`${BASE}/baseball/mlb/news?team=16&limit=6`)
  return data?.articles || []
}

export async function getBearsNews(): Promise<EspnNewsItem[]> {
  const data = await fetchEspn(`${BASE}/football/nfl/news?team=3&limit=6`)
  return data?.articles || []
}

export async function getBullsNews(): Promise<EspnNewsItem[]> {
  const data = await fetchEspn(`${BASE}/basketball/nba/news?team=4&limit=6`)
  return data?.articles || []
}

export async function getCubsSchedule() {
  const data = await fetchEspn(`${BASE}/baseball/mlb/teams/16/schedule`)
  return data?.events || []
}

export async function getBearsSchedule() {
  const data = await fetchEspn(`${BASE}/football/nfl/teams/3/schedule`)
  return data?.events || []
}

export async function getBullsSchedule() {
  const data = await fetchEspn(`${BASE}/basketball/nba/teams/4/schedule`)
  return data?.events || []
}

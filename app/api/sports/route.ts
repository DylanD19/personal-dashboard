import { NextRequest } from 'next/server'

const BASE = 'https://site.api.espn.com/apis/site/v2/sports'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const sport = searchParams.get('sport') || 'baseball/mlb'
  const teamId = searchParams.get('teamId')
  const type = searchParams.get('type')

  if (!teamId) {
    return Response.json({ error: 'teamId required' }, { status: 400 })
  }

  if (type === 'news') {
    const res = await fetch(`${BASE}/${sport}/news?team=${teamId}&limit=6`, {
      next: { revalidate: 600 },
    })
    const data = await res.json()
    return Response.json({ articles: data.articles || [] })
  }

  // Get scoreboard and find team's game
  const res = await fetch(`${BASE}/${sport}/scoreboard`, {
    next: { revalidate: 120 },
  })
  const data = await res.json()
  const game =
    (data.events || []).find((e: { competitions: Array<{ competitors: Array<{ team: { id: string } }> }> }) =>
      e.competitions[0]?.competitors.some((c) => c.team.id === teamId)
    ) || null

  return Response.json({ game })
}

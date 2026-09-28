import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

/** Le nombre de personnes du vote « Je viens » : 0 = pas concerné,
 *  1 = seul, 2–5 = accompagné. Hors bornes → 1. */
function bornePersonnes(n: unknown): number {
  const v = Number(n)
  if (!Number.isFinite(v)) return 1
  return Math.min(5, Math.max(1, Math.round(v)))
}

// POST /api/polls/:id/vote — voter ou changer de vote
export async function POST(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const { memberId, choice, personnes } = await req.json()
    if (!memberId || !choice)
      return NextResponse.json({ error: 'memberId et choice requis' }, { status: 400 })

    const poll = await db.poll.findUnique({ where: { id } })
    if (!poll) return NextResponse.json({ error: 'Sondage introuvable' }, { status: 404 })
    if (poll.closesAt && new Date(poll.closesAt) < new Date())
      return NextResponse.json({ error: 'Ce sondage est fermé' }, { status: 410 })

    /* Le compteur de personnes n'a de sens que sur une réponse « venue » ;
       ailleurs il vaut zéro — on ne compte pas des absents. */
    const nPersonnes =
      typeof personnes === 'number' && personnes > 0 ? bornePersonnes(personnes) : 0

    const existing = await db.pollVote.findUnique({
      where: { pollId_memberId: { pollId: id, memberId } },
    })

    if (existing) {
      if (existing.choice === choice && existing.personnes === nPersonnes) {
        await db.pollVote.delete({ where: { id: existing.id } })
        return NextResponse.json({ removed: true })
      }
      const vote = await db.pollVote.update({
        where: { id: existing.id },
        data: { choice, personnes: nPersonnes },
        include: { member: true },
      })
      return NextResponse.json(vote)
    }

    const vote = await db.pollVote.create({
      data: { pollId: id, memberId, choice, personnes: nPersonnes },
      include: { member: true },
    })
    return NextResponse.json(vote, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

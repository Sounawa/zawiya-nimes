import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

/** Normalise les apostrophes typographiques — les votes « Inch’Allah »
 *  doivent survivre à une édition des options « Inch'Allah ». */
function normChoix(s: string): string {
  return s
    .replace(/[\u2018\u2019']/g, "'")
    .trim()
    .toLowerCase()
}

// DELETE /api/polls/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    await db.poll.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Sondage introuvable' }, { status: 404 })
  }
}

// PATCH /api/polls/:id — modifier question / options, fermer / rouvrir
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()

    const data: {
      closesAt?: Date | null
      question?: string
      options?: string
    } = {}
    if (body.closesAt !== undefined)
      data.closesAt = body.closesAt ? new Date(body.closesAt) : null
    if (typeof body.question === 'string' && body.question.trim())
      data.question = body.question.trim()
    if (Array.isArray(body.options)) {
      const opts = body.options
        .map((o: unknown) => String(o).trim())
        .filter(Boolean)
      if (opts.length < 2) {
        return NextResponse.json(
          { error: 'Au moins deux réponses sont requises' },
          { status: 400 }
        )
      }
      data.options = JSON.stringify(opts)
    }

    const poll = await db.poll.update({ where: { id }, data })

    /* Les votes pointant vers une réponse supprimée sont perdus */
    if (data.options) {
      const nouvelles = JSON.parse(data.options) as string[]
      const orphelins = nouvelles.length ? nouvelles.map(normChoix) : []
      const votes = await db.pollVote.findMany({ where: { pollId: id } })
      const aSupprimer = votes
        .filter((v) => !orphelins.includes(normChoix(v.choice)))
        .map((v) => v.id)
      if (aSupprimer.length) {
        await db.pollVote.deleteMany({ where: { id: { in: aSupprimer } } })
      }
    }

    return NextResponse.json(poll)
  } catch {
    return NextResponse.json({ error: 'Sondage introuvable' }, { status: 404 })
  }
}

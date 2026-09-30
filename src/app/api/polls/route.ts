import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'
import { exiger } from '@/lib/auth-serveur'
import { envoyerPush } from '@/lib/push'

// GET /api/polls — tous les sondages
export async function GET() {
  try {
    const polls = await db.poll.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        votes: { include: { member: true } },
        meeting: true,
        creator: true,
      },
    })
    return NextResponse.json(polls)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/polls — créer un sondage (frères de Nîmes)
export async function POST(req: Request) {
  try {
    const { membre, refus } = await exiger(req, 'sondages.creer')
    if (refus) return refus
    const body = await req.json()
    if (!body.question)
      return NextResponse.json({ error: 'Question requise' }, { status: 400 })
    const options = Array.isArray(body.options) && body.options.length
      ? body.options.filter((o: unknown) => typeof o === 'string' && o.trim())
      : ['Je viens', 'Je ne viens pas']
    const poll = await db.poll.create({
      data: {
        question: body.question,
        meetingId: body.meetingId || null,
        options: JSON.stringify(options),
        multiple: !!body.multiple,
        closesAt: body.closesAt ? new Date(body.closesAt) : null,
        createdBy: body.createdBy || null,
      },
      include: {
        votes: { include: { member: true } },
        meeting: true,
        creator: true,
      },
    })
    await journaliser({
      kind: 'POLL',
      action: 'CREATE',
      label: `Sondage publié — « ${poll.question} »`,
      actor: body.actor || null,
    })
    /* ——— Notification téléphone : UNIQUEMENT à la création d'un
       sondage, pour prévenir la communauté d'un ijtimâ' — comme
       les annonces. Le créateur n'est pas prévenu de sa propre
       question. —— */
    const corpsNotif =
      poll.question.length > 120 ? `${poll.question.slice(0, 120)}…` : poll.question
    await envoyerPush(
      { titre: '🗳️ Nouveau sondage', corps: corpsNotif, section: 'sondages' },
      { membreExclu: membre?.id ?? null }
    )
    return NextResponse.json(poll, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

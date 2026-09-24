import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

// POST /api/polls — créer un sondage
export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.question)
      return NextResponse.json({ error: 'Question requise' }, { status: 400 })
    const options = Array.isArray(body.options) && body.options.length
      ? body.options.filter((o: unknown) => typeof o === 'string' && o.trim())
      : ['Je viens', 'Je ne viens pas', "Inch'Allah"]
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
    return NextResponse.json(poll, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

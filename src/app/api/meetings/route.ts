import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'
import { exiger } from '@/lib/auth-serveur'

// GET /api/meetings — toutes les réunions (avec présences & membres)
export async function GET() {
  try {
    const meetings = await db.meeting.findMany({
      orderBy: { date: 'asc' },
      include: {
        attendances: { include: { member: true } },
        polls: { include: { votes: { include: { member: true } } } },
      },
    })
    return NextResponse.json(meetings)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/meetings — rédiger un ijtima' (frères de Nîmes)
export async function POST(req: Request) {
  try {
    const { refus } = await exiger(req, 'reunions.rediger')
    if (refus) return refus
    const body = await req.json()
    if (!body.title || !body.date)
      return NextResponse.json({ error: 'Titre et date requis' }, { status: 400 })
    const meeting = await db.meeting.create({
      data: {
        title: body.title,
        icon: body.icon || null,
        city: body.city || null,
        address: body.address || null,
        date: new Date(body.date),
        startTime: body.startTime || null,
        endTime: body.endTime || null,
        announcement: body.announcement || null,
        word: body.word || null,
        program: body.program ? JSON.stringify(body.program) : null,
      },
    })
    await journaliser({
      kind: 'MEETING',
      action: 'CREATE',
      label: `Réunion « ${meeting.title} » publiée`,
      actor: body.actor || null,
    })
    return NextResponse.json(meeting, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

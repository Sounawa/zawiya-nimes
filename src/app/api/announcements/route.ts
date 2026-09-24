import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/announcements
export async function GET() {
  try {
    const announcements = await db.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(announcements)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/announcements
export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.text) return NextResponse.json({ error: 'Texte requis' }, { status: 400 })
    const announcement = await db.announcement.create({
      data: {
        title: body.title || null,
        text: body.text,
        color: body.color === 'CORAIL' ? 'CORAIL' : 'VERT',
      },
    })
    return NextResponse.json(announcement, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

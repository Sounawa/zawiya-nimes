import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'

// GET /api/content?section=ADHKAR — contenus par section
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const section = searchParams.get('section')
    const where = section ? { section } : {}
    const items = await db.contentItem.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })
    return NextResponse.json(items)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/content — ajouter un contenu
export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (!body.section || !body.title)
      return NextResponse.json({ error: 'Section et titre requis' }, { status: 400 })
    // Placer en fin de liste de sa section
    const dernier = await db.contentItem.findFirst({
      where: { section: body.section },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const item = await db.contentItem.create({
      data: {
        section: body.section,
        title: body.title,
        subtitle: body.subtitle || null,
        body: body.body || null,
        url: body.url || null,
        icon: body.icon || '✦',
        time: body.time || null,
        order: (dernier?.order ?? -1) + 1,
      },
    })
    await journaliser({
      kind: 'CONTENT',
      action: 'CREATE',
      label: `Contenu ajouté — « ${item.title} »`,
      actor: body.actor || null,
    })
    return NextResponse.json(item, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

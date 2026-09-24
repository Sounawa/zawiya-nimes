import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'

// GET /api/members — liste des membres avec stats
export async function GET() {
  try {
    const members = await db.member.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { contributions: true, attendances: true } },
      },
    })
    return NextResponse.json(members)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/members — ajouter un membre
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = (body.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Prénom requis' }, { status: 400 })
    const exists = await db.member.findUnique({ where: { name } })
    if (exists) return NextResponse.json({ error: 'Ce prénom existe déjà' }, { status: 409 })
    const member = await db.member.create({
      data: { name, role: body.role || 'ADMIN' },
    })
    await journaliser({
      kind: 'MEMBER',
      action: 'CREATE',
      label: `${member.name} a rejoint la zawiya`,
      actor: body.actor || member.name,
    })
    return NextResponse.json(member, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

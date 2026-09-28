import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'
import { membreAppeleur } from '@/lib/auth-serveur'
import { peut } from '@/lib/permissions'

const VILLES = ['NIMES', 'MONTPELLIER']

// GET /api/members — liste des membres (avec zawiya, rôle et stats)
export async function GET() {
  try {
    const members = await db.member.findMany({
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { contributions: true, attendances: true } },
      },
    })
    return NextResponse.json(members)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/members — s'inscrire soi-même : prénom + zawiya → membre
// Le rôle est toujours MEMBER : seuls le trésorier et le référent sont
// nommés par le référent dans les réglages.
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = (body.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Prénom requis' }, { status: 400 })
    const city = VILLES.includes(body.ville ?? body.city)
      ? (body.ville ?? body.city)
      : 'NIMES'

    /* Un rôle explicite ne peut être posé que par le référent */
    let role = 'MEMBER'
    if (body.role && body.role !== 'MEMBER') {
      const appelant = await membreAppeleur(req)
      if (!appelant || !peut(appelant.city, appelant.role, 'membres.gerer')) {
        return NextResponse.json(
          { error: 'Seul le référent de la zaouia peut attribuer un rôle.' },
          { status: 403 }
        )
      }
      role = body.role
    }

    const exists = await db.member.findUnique({ where: { name_city: { name, city } } })
    if (exists)
      return NextResponse.json(
        { error: `Sidi ${name} est déjà inscrit à la zawiya choisie` },
        { status: 409 }
      )

    const member = await db.member.create({
      data: { name, city, role },
    })
    await journaliser({
      kind: 'MEMBER',
      action: 'CREATE',
      label: `${member.name} a rejoint la zawiya de ${city === 'MONTPELLIER' ? 'Montpellier' : 'Nîmes'}`,
      actor: body.actor || member.name,
    })
    return NextResponse.json(member, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

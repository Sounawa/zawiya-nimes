import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'
import { membreAppeleur } from '@/lib/auth-serveur'
import { peut } from '@/lib/permissions'

const VILLES = ['NIMES', 'AVIGNON', 'MONTPELLIER']
const NOM_VILLE: Record<string, string> = {
  NIMES: 'Nîmes',
  AVIGNON: 'Avignon',
  MONTPELLIER: 'Montpellier',
}

/* Jamais le code personnel — même haché — dans les listes */
const CHAMPS_MEMBRE = {
  id: true,
  name: true,
  city: true,
  role: true,
  status: true,
  perms: true,
  createdAt: true,
  _count: { select: { contributions: true, attendances: true } },
} as const

// GET /api/members — liste des membres (avec zawiya, rôle, statut et stats)
export async function GET() {
  try {
    const members = await db.member.findMany({
      orderBy: [{ status: 'asc' }, { city: 'asc' }, { name: 'asc' }],
      select: CHAMPS_MEMBRE,
    })
    return NextResponse.json(members)
  } catch (e) {
    console.error('[api/members] GET :', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/members — le référent ajoute un frère à la main :
// il entre directement (statut actif, sans code — il en posera un
// à son premier passage). Le rôle explicite reste réservé au référent.
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = (body.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Prénom requis' }, { status: 400 })
    const city = VILLES.includes(body.ville ?? body.city) ? (body.ville ?? body.city) : 'NIMES'

    /* Un rôle explicite ne peut être posé que par le référent */
    let role = 'MEMBER'
    if (body.role && body.role !== 'MEMBER') {
      const appelant = await membreAppeleur(req)
      if (!appelant || !peut(appelant.city, appelant.role, 'membres.gerer', appelant.perms)) {
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
      data: { name, city, role, status: 'ACTIVE' },
      select: { id: true, name: true, city: true, role: true, status: true, perms: true, createdAt: true },
    })
    await journaliser({
      kind: 'MEMBER',
      action: 'CREATE',
      label: `${member.name} a rejoint la zawiya de ${NOM_VILLE[city] ?? city}`,
      actor: body.actor || member.name,
    })
    return NextResponse.json(member, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'
import { exiger } from '@/lib/auth-serveur'

type Params = { params: Promise<{ id: string }> }

const VILLES = ['NIMES', 'MONTPELLIER']
const ROLES = ['MEMBER', 'TREASURER', 'REFERENT']

// PATCH /api/members/:id — rôle ou zawiya d'un frère (référent seul)
// Trésorier et référent sont UNIQUES : les nommer démote l'ancien porteur.
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { refus } = await exiger(req, 'membres.gerer')
    if (refus) return refus
    const { id } = await params
    const body = await req.json().catch(() => ({}))

    const data: { name?: string; role?: string; city?: string } = {}
    if (body.name && typeof body.name === 'string') data.name = body.name.trim()
    if (body.role && ROLES.includes(body.role)) data.role = body.role
    if (body.city && VILLES.includes(body.city)) data.city = body.city

    if (body.city && !VILLES.includes(body.city)) {
      return NextResponse.json({ error: 'Zawiya inconnue' }, { status: 400 })
    }

    const cible = await db.member.findUnique({ where: { id } })
    if (!cible) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })

    /* Le prénom doit rester unique dans sa zawiya */
    if (data.name || data.city) {
      const nom = data.name ?? cible.name
      const ville = data.city ?? cible.city
      const conflit = await db.member.findUnique({
        where: { name_city: { name: nom, city: ville } },
      })
      if (conflit && conflit.id !== id) {
        return NextResponse.json(
          { error: `Sidi ${nom} est déjà inscrit dans cette zawiya` },
          { status: 409 }
        )
      }
    }

    /* Charges uniques : nommer remplace l'ancien porteur */
    if (data.role === 'TREASURER' || data.role === 'REFERENT') {
      await db.member.updateMany({
        where: { role: data.role, NOT: { id } },
        data: { role: 'MEMBER' },
      })
    }

    const member = await db.member.update({ where: { id }, data })

    if (data.role && data.role !== cible.role) {
      await journaliser({
        kind: 'MEMBER',
        action: 'UPDATE',
        label:
          data.role === 'TREASURER'
            ? `${member.name} devient trésorier`
            : data.role === 'REFERENT'
              ? `${member.name} devient référent de la zaouia`
              : `${member.name} redevient simple membre`,
        actor: body.actor || null,
      })
    }
    if (data.city && data.city !== cible.city) {
      await journaliser({
        kind: 'MEMBER',
        action: 'UPDATE',
        label: `${member.name} rejoint la zawiya de ${data.city === 'MONTPELLIER' ? 'Montpellier' : 'Nîmes'}`,
        actor: body.actor || null,
      })
    }

    return NextResponse.json(member)
  } catch {
    return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })
  }
}

// DELETE /api/members/:id — retirer un frère (référent seul)
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { refus } = await exiger(req, 'membres.gerer')
    if (refus) return refus
    const { id } = await params
    const membre = await db.member.findUnique({ where: { id } })
    await db.member.delete({ where: { id } })
    await journaliser({
      kind: 'MEMBER',
      action: 'DELETE',
      label: `${membre?.name ?? 'Un frère'} quitte la liste`,
      actor: null,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })
  }
}

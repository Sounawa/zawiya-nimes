import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'
import { exiger } from '@/lib/auth-serveur'
import type { FamilleDroits, Surcharges } from '@/lib/types'

type Params = { params: Promise<{ id: string }> }

const VILLES = ['NIMES', 'AVIGNON', 'MONTPELLIER']
const ROLES = ['MEMBER', 'TREASURER', 'REFERENT']
const FAMILLES: FamilleDroits[] = ['annonces', 'sondages', 'reunions', 'contenus', 'cotisations']

const CHAMPS_MEMBRE = {
  id: true,
  name: true,
  city: true,
  role: true,
  status: true,
  perms: true,
  createdAt: true,
} as const

// PATCH /api/members/:id — rôle, zawiya, droits ou accès d'un frère
// (référent seul). Trésorier et référent restent UNIQUES : les nommer
// démote l'ancien porteur. Le code personnel n'est jamais renvoyé.
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { refus } = await exiger(req, 'membres.gerer')
    if (refus) return refus
    const { id } = await params
    const body = await req.json().catch(() => ({}))

    const data: {
      name?: string
      role?: string
      city?: string
      status?: string
      perms?: string | null
      pin?: string | null
    } = {}
    if (body.name && typeof body.name === 'string') data.name = body.name.trim()
    if (body.role && ROLES.includes(body.role)) data.role = body.role
    if (body.city && VILLES.includes(body.city)) data.city = body.city

    if (body.city && !VILLES.includes(body.city)) {
      return NextResponse.json({ error: 'Zawiya inconnue' }, { status: 400 })
    }

    /* ─── Droits individuels (surcharges) ─── */
    if (body.perms !== undefined) {
      if (body.perms === null) {
        data.perms = null
      } else if (body.perms && typeof body.perms === 'object') {
        const propose = body.perms as Surcharges
        const propre: Surcharges = {}
        for (const f of FAMILLES) {
          if (f in propose) propre[f] = propose[f] === true
        }
        data.perms = Object.keys(propre).length ? JSON.stringify(propre) : null
      }
    }

    /* ─── Accès : valider (ACTIVE) ou révoquer (BLOCKED) ─── */
    if (body.status && ['ACTIVE', 'BLOCKED'].includes(body.status)) {
      data.status = body.status
    }

    /* ─── Réinitialiser le code personnel ─── */
    if (body.resetPin === true) {
      data.pin = null
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

    /* Un frère ne peut pas se révoquer lui-même */
    if (data.status === 'BLOCKED' && (body.actor ?? '').trim() === cible.name) {
      return NextResponse.json(
        { error: 'On ne peut pas révoquer son propre accès.' },
        { status: 400 }
      )
    }

    /* Charges uniques : nommer remplace l'ancien porteur */
    if (data.role === 'TREASURER' || data.role === 'REFERENT') {
      await db.member.updateMany({
        where: { role: data.role, NOT: { id } },
        data: { role: 'MEMBER' },
      })
    }

    const member = await db.member.update({ where: { id }, data, select: CHAMPS_MEMBRE })

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
        label: `${member.name} rejoint la zawiya de ${data.city === 'MONTPELLIER' ? 'Montpellier' : data.city === 'AVIGNON' ? 'Avignon' : 'Nîmes'}`,
        actor: body.actor || null,
      })
    }
    if (data.status && data.status !== cible.status) {
      await journaliser({
        kind: 'MEMBER',
        action: 'UPDATE',
        label:
          data.status === 'ACTIVE'
            ? `L'accès de ${member.name} est ouvert`
            : `L'accès de ${member.name} est révoqué`,
        actor: body.actor || null,
      })
    }
    if (data.perms !== undefined && data.perms !== cible.perms) {
      const nombre = data.perms ? Object.keys(JSON.parse(data.perms)).length : 0
      await journaliser({
        kind: 'MEMBER',
        action: 'UPDATE',
        label: nombre
          ? `Droits particuliers accordés à ${member.name}`
          : `${member.name} retrouve les droits de son groupe`,
        actor: body.actor || null,
      })
    }
    if (data.pin === null) {
      await journaliser({
        kind: 'MEMBER',
        action: 'UPDATE',
        label: `Le code personnel de ${member.name} est réinitialisé`,
        actor: body.actor || null,
      })
    }

    return NextResponse.json(member)
  } catch {
    return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })
  }
}

// DELETE /api/members/:id — retirer un frère (référent seul).
// Ses présences, contributions et votes partent avec lui ; les sondages
// qu'il a créés sont supprimés (createdBy obligatoire).
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { refus } = await exiger(req, 'membres.gerer')
    if (refus) return refus
    const { id } = await params
    const membre = await db.member.findUnique({ where: { id } })
    if (!membre) return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })

    await db.$transaction([
      db.attendance.deleteMany({ where: { memberId: id } }),
      db.contribution.deleteMany({ where: { memberId: id } }),
      db.pollVote.deleteMany({ where: { memberId: id } }),
      db.poll.deleteMany({ where: { createdBy: id } }),
      db.member.delete({ where: { id } }),
    ])
    await journaliser({
      kind: 'MEMBER',
      action: 'DELETE',
      label: `${membre.name} quitte la liste`,
      actor: null,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })
  }
}

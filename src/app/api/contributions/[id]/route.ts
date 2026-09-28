import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'
import { exiger } from '@/lib/auth-serveur'

type Params = { params: Promise<{ id: string }> }

function libelleCategorie(c: string): string {
  return c === 'ZIYARA' ? 'Ziyara' : c === 'DON' ? 'Don' : 'Cotisation'
}

// PATCH /api/contributions/:id
// · corriger une somme → frères de Nîmes
// · confirmer « il a donné » → trésorier ou référent
export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json().catch(() => ({}))
    const droit = body.confirm !== undefined ? 'cotisations.gerer' : 'cotisations.voir'
    const { refus } = await exiger(req, droit)
    if (refus) return refus
    const { id } = await params
    const data: Record<string, unknown> = {}
    if (body.amount !== undefined) {
      const amount = parseFloat(body.amount)
      if (isNaN(amount) || amount <= 0)
        return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
      data.amount = amount
    }
    if (body.category) data.category = body.category
    if (body.note !== undefined) data.note = body.note
    if (body.date) data.date = new Date(body.date)
    // Confirmation du référent cotisations : « la personne a donné »
    if (body.confirm === true) {
      data.confirmedAt = new Date()
      data.confirmedBy = body.actor || body.recordedBy || 'référent'
    } else if (body.confirm === false) {
      data.confirmedAt = null
      data.confirmedBy = null
    }
    const contribution = await db.contribution.update({
      where: { id },
      data,
      include: { member: true },
    })
    await journaliser({
      kind: 'CONTRIBUTION',
      action: 'UPDATE',
      label:
        body.confirm === true
          ? `Somme de ${contribution.member.name} confirmée par le référent`
          : body.confirm === false
            ? `Confirmation retirée à ${contribution.member.name}`
            : `${libelleCategorie(contribution.category)} de ${contribution.member.name} corrigée`,
      actor: body.actor || null,
    })
    return NextResponse.json(contribution)
  } catch {
    return NextResponse.json({ error: 'Contribution introuvable' }, { status: 404 })
  }
}

// DELETE /api/contributions/:id — zawiya de Nîmes
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { refus } = await exiger(req, 'cotisations.voir')
    if (refus) return refus
    const { id } = await params
    let acteur: string | null = null
    try {
      const body = await req.json()
      acteur = body?.actor || null
    } catch {
      /* pas de corps */
    }
    const contribution = await db.contribution.findUnique({
      where: { id },
      include: { member: true },
    })
    await db.contribution.delete({ where: { id } })
    await journaliser({
      kind: 'CONTRIBUTION',
      action: 'DELETE',
      label: `${libelleCategorie(contribution?.category ?? 'COTISATION')} de ${contribution?.member.name ?? 'un frère'} supprimée`,
      actor: acteur,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Contribution introuvable' }, { status: 404 })
  }
}

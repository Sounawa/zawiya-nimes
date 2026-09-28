import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'
import { exiger } from '@/lib/auth-serveur'

// GET /api/contributions — la trésorerie, réservée à la zawiya de Nîmes
export async function GET(req: Request) {
  try {
    const { refus } = await exiger(req, 'cotisations.voir')
    if (refus) return refus
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const where = category ? { category } : {}
    const contributions = await db.contribution.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { member: true },
    })
    const totals = await db.contribution.groupBy({
      by: ['category'],
      _sum: { amount: true },
    })
    const caisse = Object.fromEntries(totals.map((t) => [t.category, t._sum.amount || 0]))
    // La répartition confirmé / en attente se calcule côté client :
    // les contributions arrivent avec confirmedAt / confirmedBy
    return NextResponse.json({
      contributions,
      totals: {
        COTISATION: caisse.COTISATION || 0,
        ZIYARA: caisse.ZIYARA || 0,
        DON: caisse.DON || 0,
        TOTAL: (caisse.COTISATION || 0) + (caisse.ZIYARA || 0) + (caisse.DON || 0),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/contributions — déclarer une somme (zawiya de Nîmes)
export async function POST(req: Request) {
  try {
    const { refus } = await exiger(req, 'cotisations.voir')
    if (refus) return refus
    const body = await req.json()
    if (!body.memberId || !body.amount)
      return NextResponse.json({ error: 'Membre et montant requis' }, { status: 400 })
    const amount = parseFloat(body.amount)
    if (isNaN(amount) || amount <= 0)
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    const category = ['COTISATION', 'ZIYARA', 'DON'].includes(body.category)
      ? body.category
      : 'COTISATION'
    const contribution = await db.contribution.create({
      data: {
        memberId: body.memberId,
        amount,
        category,
        note: body.note || null,
        date: body.date ? new Date(body.date) : new Date(),
        recordedBy: body.recordedBy || null,
        // Une déclaration de participant démarre en attente ; seule une
        // saisie marquée confirmée (référent qui a vu la somme) est validée
        confirmedAt: body.confirmed ? new Date() : null,
        confirmedBy: body.confirmed ? body.recordedBy || 'référent' : null,
      },
      include: { member: true },
    })
    const libelle =
      category === 'ZIYARA' ? 'Ziyara' : category === 'DON' ? 'Don' : 'Cotisation'
    await journaliser({
      kind: 'CONTRIBUTION',
      action: 'CREATE',
      label: `${libelle} de ${contribution.member.name} enregistrée`,
      actor: body.actor || body.recordedBy || null,
    })
    return NextResponse.json(contribution, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/contributions — toutes les contributions (avec totaux)
export async function GET(req: Request) {
  try {
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

// POST /api/contributions — enregistrer une contribution
export async function POST(req: Request) {
  try {
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
      },
      include: { member: true },
    })
    return NextResponse.json(contribution, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

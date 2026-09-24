import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/contributions/:id
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
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
    const contribution = await db.contribution.update({
      where: { id },
      data,
      include: { member: true },
    })
    return NextResponse.json(contribution)
  } catch {
    return NextResponse.json({ error: 'Contribution introuvable' }, { status: 404 })
  }
}

// DELETE /api/contributions/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    await db.contribution.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Contribution introuvable' }, { status: 404 })
  }
}

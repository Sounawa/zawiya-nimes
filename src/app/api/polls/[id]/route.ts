import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// DELETE /api/polls/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    await db.poll.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Sondage introuvable' }, { status: 404 })
  }
}

// PATCH /api/polls/:id — fermer / rouvrir un sondage
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const data: { closesAt?: Date | null; question?: string } = {}
    if (body.closesAt !== undefined)
      data.closesAt = body.closesAt ? new Date(body.closesAt) : null
    if (body.question) data.question = body.question
    const poll = await db.poll.update({ where: { id }, data })
    return NextResponse.json(poll)
  } catch {
    return NextResponse.json({ error: 'Sondage introuvable' }, { status: 404 })
  }
}

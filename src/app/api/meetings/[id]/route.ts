import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/meetings/:id
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const data: Record<string, string | null> = {}
    for (const k of ['title', 'icon', 'city', 'address', 'startTime', 'endTime', 'announcement', 'word'] as const) {
      if (body[k] !== undefined) data[k] = body[k]
    }
    if (body.date) data.date = new Date(body.date).toISOString()
    if (body.program !== undefined) data.program = body.program ? JSON.stringify(body.program) : null
    const meeting = await db.meeting.update({ where: { id }, data })
    return NextResponse.json(meeting)
  } catch {
    return NextResponse.json({ error: 'Réunion introuvable' }, { status: 404 })
  }
}

// DELETE /api/meetings/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    await db.meeting.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Réunion introuvable' }, { status: 404 })
  }
}

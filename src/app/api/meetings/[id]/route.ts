import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'
import { exiger } from '@/lib/auth-serveur'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/meetings/:id — rédiger : frères de Nîmes
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { refus } = await exiger(req, 'reunions.rediger')
    if (refus) return refus
    const { id } = await params
    const body = await req.json()
    const data: Record<string, string | null> = {}
    for (const k of ['title', 'icon', 'city', 'address', 'startTime', 'endTime', 'announcement', 'word'] as const) {
      if (body[k] !== undefined) data[k] = body[k]
    }
    if (body.date) data.date = new Date(body.date).toISOString()
    if (body.program !== undefined) data.program = body.program ? JSON.stringify(body.program) : null
    const meeting = await db.meeting.update({ where: { id }, data })
    await journaliser({
      kind: 'MEETING',
      action: 'UPDATE',
      label: `Réunion « ${meeting.title} » modifiée`,
      actor: body.actor || null,
    })
    return NextResponse.json(meeting)
  } catch {
    return NextResponse.json({ error: 'Réunion introuvable' }, { status: 404 })
  }
}

// DELETE /api/meetings/:id
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id } = await params
    let acteur: string | null = null
    try {
      const body = await req.json()
      acteur = body?.actor || null
    } catch {
      /* pas de corps — acteur inconnu */
    }
    const meeting = await db.meeting.findUnique({ where: { id } })
    await db.meeting.delete({ where: { id } })
    await journaliser({
      kind: 'MEETING',
      action: 'DELETE',
      label: `Réunion « ${meeting?.title ?? id} » supprimée`,
      actor: acteur,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Réunion introuvable' }, { status: 404 })
  }
}

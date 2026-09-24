import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'

type Params = { params: Promise<{ id: string }> }

// DELETE /api/announcements/:id
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { id } = await params
    let acteur: string | null = null
    try {
      const body = await req.json()
      acteur = body?.actor || null
    } catch {
      /* pas de corps */
    }
    const annonce = await db.announcement.findUnique({ where: { id } })
    await db.announcement.delete({ where: { id } })
    await journaliser({
      kind: 'ANNOUNCEMENT',
      action: 'DELETE',
      label: `Annonce supprimée — « ${annonce?.title || annonce?.text.slice(0, 60) || id} »`,
      actor: acteur,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })
  }
}

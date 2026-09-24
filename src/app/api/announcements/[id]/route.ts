import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// DELETE /api/announcements/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    await db.announcement.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })
  }
}

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/members/:id — modifier (nom, rôle)
// Le rôle de trésorier est UNIQUE : le désigner démote l'ancien porteur.
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const data: { name?: string; role?: string } = {}
    if (body.name) data.name = body.name.trim()
    if (body.role) data.role = body.role

    if (data.role === 'TREASURER') {
      // Retirer le rôle à l'ancien trésorier s'il y en a un autre
      await db.member.updateMany({
        where: { role: 'TREASURER', NOT: { id } },
        data: { role: 'ADMIN' },
      })
    }

    const member = await db.member.update({ where: { id }, data })
    return NextResponse.json(member)
  } catch {
    return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })
  }
}

// DELETE /api/members/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    await db.member.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Membre introuvable' }, { status: 404 })
  }
}

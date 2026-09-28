import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'
import { exiger } from '@/lib/auth-serveur'

type Params = { params: Promise<{ id: string }> }

// PATCH /api/announcements/:id — modifier une annonce
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { refus } = await exiger(req, 'annonces.creer')
    if (refus) return refus
    const { id } = await params
    const body = await req.json()
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json({ error: 'Texte requis' }, { status: 400 })
    }
    const annonce = await db.announcement.update({
      where: { id },
      data: {
        title: body.title || null,
        text: body.text,
        color: body.color === 'CORAIL' ? 'CORAIL' : 'VERT',
        date: new Date(),
      },
    })
    await journaliser({
      kind: 'ANNOUNCEMENT',
      action: 'UPDATE',
      label: `Annonce modifiée — « ${annonce.title || annonce.text.slice(0, 60)} »`,
      actor: body.actor || null,
    })
    return NextResponse.json(annonce)
  } catch {
    return NextResponse.json({ error: 'Annonce introuvable' }, { status: 404 })
  }
}

// DELETE /api/announcements/:id — réservé aux frères de Nîmes
export async function DELETE(req: Request, { params }: Params) {
  try {
    const { refus } = await exiger(req, 'annonces.supprimer')
    if (refus) return refus
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

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'

type Params = { params: Promise<{ id: string }> }

/* ─── PATCH /api/content/:id — modifier une entrée (Adhkâr, etc.) ─── */
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.title) data.title = body.title
    if (body.subtitle !== undefined) data.subtitle = body.subtitle || null
    if (body.body !== undefined) data.body = body.body || null
    if (body.url !== undefined) data.url = body.url || null
    if (body.icon !== undefined) data.icon = body.icon || null
    if (body.time !== undefined) data.time = body.time || null
    if (body.order !== undefined) data.order = Number(body.order) || 0
    const item = await db.contentItem.update({ where: { id }, data })
    /* Une réorganisation (ordre seul) n'est pas une action notable —
       seule une vraie modification laisse une trace au journal. */
    const simpleReorg =
      Object.keys(data).length === 1 && 'order' in data
    if (!simpleReorg) {
      await journaliser({
        kind: 'CONTENT',
        action: 'UPDATE',
        label: `Contenu modifié — « ${item.title} »`,
        actor: body.actor || null,
      })
    }
    return NextResponse.json(item)
  } catch {
    return NextResponse.json({ error: 'Contenu introuvable' }, { status: 404 })
  }
}

/* ─── DELETE /api/content/:id — supprimer une entrée ─── */
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
    const item = await db.contentItem.findUnique({ where: { id } })
    await db.contentItem.delete({ where: { id } })
    await journaliser({
      kind: 'CONTENT',
      action: 'DELETE',
      label: `Contenu supprimé — « ${item?.title || id} »`,
      actor: acteur,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Contenu introuvable' }, { status: 404 })
  }
}

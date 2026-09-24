import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'

// POST /api/attendance — basculer présence ("Je viendrai")
export async function POST(req: Request) {
  try {
    const { meetingId, memberId, guests } = await req.json()
    if (!meetingId || !memberId)
      return NextResponse.json({ error: 'meetingId et memberId requis' }, { status: 400 })

    const existing = await db.attendance.findUnique({
      where: { meetingId_memberId: { meetingId, memberId } },
    })

    const membre = await db.member.findUnique({ where: { id: memberId } })
    const reunion = await db.meeting.findUnique({ where: { id: meetingId } })

    if (existing) {
      if (guests !== undefined) {
        const att = await db.attendance.update({
          where: { id: existing.id },
          data: { guests: Math.max(0, parseInt(guests, 10) || 0) },
          include: { member: true },
        })
        return NextResponse.json(att)
      }
      await db.attendance.delete({ where: { id: existing.id } })
      await journaliser({
        kind: 'ATTENDANCE',
        action: 'DESINSCRIRE',
        label: `${membre?.name ?? 'Un frère'} ne viendra plus à « ${reunion?.title ?? 'la réunion'} »`,
        actor: membre?.name || null,
      })
      return NextResponse.json({ removed: true })
    }

    const att = await db.attendance.create({
      data: {
        meetingId,
        memberId,
        guests: guests ? Math.max(0, parseInt(guests, 10) || 0) : 0,
      },
      include: { member: true },
    })
    await journaliser({
      kind: 'ATTENDANCE',
      action: 'INSCRIRE',
      label: `${membre?.name ?? 'Un frère'} viendra à « ${reunion?.title ?? 'la réunion'} »`,
      actor: membre?.name || null,
    })
    return NextResponse.json(att, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/attendance — retirer une présence
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const meetingId = searchParams.get('meetingId')
    const memberId = searchParams.get('memberId')
    if (!meetingId || !memberId)
      return NextResponse.json({ error: 'Paramètres requis' }, { status: 400 })
    await db.attendance.deleteMany({ where: { meetingId, memberId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

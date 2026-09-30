import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { membreAppeleur } from '@/lib/auth-serveur'

/* ═══════════════════════════════════════════════════════════════════
   /api/push/abonnements — le pont entre le téléphone et la zawiya.

   POST : le navigateur s'est abonné au service push (accord de son
   propriétaire donné) et nous confie ses clés. On l'associe au
   frère connecté si l'en-tête est là — pour épargner à l'auteur
   d'une annonce la notification de sa propre publication — et à sa
   zawiya, pour les annonces ciblées.

   DELETE : l'appareil se retire (permission retirée, application
   désinstallée, choix de ne plus être prévenu).

   Un même appareil qui se réabonne remplace sa ligne : l'endpoint
   du service push est unique et immuable par appareil.
   ═══════════════════════════════════════════════════════════════════ */

interface CorpsAbonnement {
  endpoint?: string
  keys?: { p256dh?: string; auth?: string }
}

// POST — enregistrer l'appareil qui veut être prévenu
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CorpsAbonnement
    const endpoint = body.endpoint
    const p256dh = body.keys?.p256dh
    const auth = body.keys?.auth
    if (!endpoint || !p256dh || !auth || typeof endpoint !== 'string') {
      return NextResponse.json({ error: 'Abonnement incomplet' }, { status: 400 })
    }
    if (!endpoint.startsWith('https://')) {
      return NextResponse.json({ error: 'Endpoint invalide' }, { status: 400 })
    }

    /* Le frère connecté depuis cet appareil, s'il se présente */
    const membre = await membreAppeleur(req)

    await db.pushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh,
        auth,
        memberId: membre?.status === 'ACTIVE' ? membre.id : null,
        city: membre?.status === 'ACTIVE' ? membre.city : null,
      },
      update: {
        p256dh,
        auth,
        memberId: membre?.status === 'ACTIVE' ? membre.id : null,
        city: membre?.status === 'ACTIVE' ? membre.city : null,
      },
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE — l'appareil ne veut plus être prévenu
export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { endpoint?: string }
    if (!body.endpoint || typeof body.endpoint !== 'string') {
      return NextResponse.json({ error: 'Endpoint requis' }, { status: 400 })
    }
    await db.pushSubscription.deleteMany({ where: { endpoint: body.endpoint } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

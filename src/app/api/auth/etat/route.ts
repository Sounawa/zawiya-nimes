import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const VILLES = ['NIMES', 'AVIGNON', 'MONTPELLIER']

/* GET /api/auth/etat?name=X&ville=NIMES — l'état d'un prénom à la porte
 * d'entrée, pour adapter l'écran sans dévoiler quoi que ce soit d'autre :
 *   INCONNU    → personne ne porte ce prénom dans cette zawiya
 *   SANS_CODE  → connu, aucun code posé (le premier venu le définit)
 *   PRET       → connu avec code, il faudra le taper
 *   ATTENTE    → inscription faite, en attente de validation
 *   BLOQUE     → accès révoqué par le référent */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const name = (url.searchParams.get('name') ?? '').trim()
    const ville = url.searchParams.get('ville') ?? 'NIMES'

    if (!name || !VILLES.includes(ville)) {
      return NextResponse.json({ etat: 'INCONNU' })
    }

    /* Le prénom est cherché sans égard à la casse : mehdi = Mehdi */
    const deLaVille = await db.member.findMany({
      where: { city: ville },
      select: { name: true, status: true, pin: true },
    })
    const membre = deLaVille.find(
      (m) => m.name.trim().toLowerCase() === name.toLowerCase()
    )

    if (!membre) return NextResponse.json({ etat: 'INCONNU' })
    if (membre.status === 'PENDING') return NextResponse.json({ etat: 'ATTENTE' })
    if (membre.status === 'BLOCKED') return NextResponse.json({ etat: 'BLOQUE' })
    return NextResponse.json({ etat: membre.pin ? 'PRET' : 'SANS_CODE' })
  } catch {
    return NextResponse.json({ etat: 'INCONNU' })
  }
}

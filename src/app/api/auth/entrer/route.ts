import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'
import { hacherCode } from '@/lib/auth-serveur'

const VILLES = ['NIMES', 'AVIGNON', 'MONTPELLIER']
const NOM_VILLE: Record<string, string> = {
  NIMES: 'Nîmes',
  AVIGNON: 'Avignon',
  MONTPELLIER: 'Montpellier',
}

/* Les champs renvoyés au client — jamais le code, même haché */
const CHAMPS_MEMBRE = {
  id: true,
  name: true,
  city: true,
  role: true,
  status: true,
  perms: true,
  createdAt: true,
} as const

/* POST /api/auth/entrer { name, ville, pin } — la porte d'entrée :
 *   · prénom inconnu        → inscription en attente de validation (202)
 *   · prénom sans code      → le code est posé, entrée (200)
 *   · prénom avec code      → vérification du code (200 / 401)
 *   · accès révoqué         → refus (403)
 *   · inscription en attente→ rappel de patience (202) */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = (body.name ?? '').toString().trim()
    const ville = VILLES.includes(body.ville) ? body.ville : 'NIMES'
    const pin = (body.pin ?? '').toString().trim()

    if (!name) return NextResponse.json({ error: 'Prénom requis' }, { status: 400 })
    if (name.length > 40) {
      return NextResponse.json({ error: 'Prénom trop long' }, { status: 400 })
    }
    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json(
        { error: 'Le code personnel compte 4 à 6 chiffres.' },
        { status: 400 }
      )
    }

    const hache = hacherCode(pin, name, ville)
    const existe = await db.member.findUnique({
      where: { name_city: { name, city: ville } },
    })

    /* ─── Prénom inconnu : inscription, en attente du référent ─── */
    if (!existe) {
      await db.member.create({
        data: { name, city: ville, role: 'MEMBER', status: 'PENDING', pin: hache },
      })
      await journaliser({
        kind: 'MEMBER',
        action: 'CREATE',
        label: `${name} demande à rejoindre la zawiya de ${NOM_VILLE[ville]}`,
        actor: name,
      })
      return NextResponse.json(
        {
          attente: true,
          message: `Ta demande est envoyée, Sidi ${name} — le référent va t'ouvrir l'accès.`,
        },
        { status: 202 }
      )
    }

    /* ─── Accès révoqué ─── */
    if (existe.status === 'BLOCKED') {
      return NextResponse.json(
        { bloque: true, error: "Ton accès a été révoqué — contacte le référent de la zaouia." },
        { status: 403 }
      )
    }

    /* ─── Inscription pas encore validée ─── */
    if (existe.status === 'PENDING') {
      return NextResponse.json(
        {
          attente: true,
          error: "Ton inscription attend la validation du référent — repasse dans un instant.",
        },
        { status: 202 }
      )
    }

    /* ─── Premier passage : le frère pose son code ─── */
    if (!existe.pin) {
      const membre = await db.member.update({
        where: { id: existe.id },
        data: { pin: hache },
        select: CHAMPS_MEMBRE,
      })
      return NextResponse.json(membre)
    }

    /* ─── Code à vérifier ─── */
    if (existe.pin !== hache) {
      return NextResponse.json(
        { mauvaisCode: true, error: 'Code incorrect — réessaie.' },
        { status: 401 }
      )
    }

    const membre = await db.member.findUnique({
      where: { id: existe.id },
      select: CHAMPS_MEMBRE,
    })
    return NextResponse.json(membre)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

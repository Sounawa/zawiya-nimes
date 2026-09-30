import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { journaliser } from '@/lib/audit'
import { exiger, membreAppeleur } from '@/lib/auth-serveur'

const VILLES = ['NIMES', 'AVIGNON', 'MONTPELLIER']

/** Nettoie la liste des zawiya destinataires — null = toutes */
function lireDestinataires(cities: unknown): string | null {
  if (!Array.isArray(cities) || !cities.length) return null
  const propres = cities.filter((c) => VILLES.includes(c))
  return propres.length ? JSON.stringify(propres) : null
}

/** Une annonce est-elle destinée à cette zawiya ? (null = toutes) */
function destinataire(annonce: { cities: string | null }, ville: string): boolean {
  if (!annonce.cities) return true
  try {
    const liste = JSON.parse(annonce.cities) as string[]
    return Array.isArray(liste) && liste.includes(ville)
  } catch {
    return true
  }
}

// GET /api/announcements — les frères ne voient que les annonces
// destinées à leur zawiya (ou à toutes les zawiya).
export async function GET(req: Request) {
  try {
    const membre = await membreAppeleur(req)
    const annonces = await db.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    })
    const visibles =
      membre && membre.status === 'ACTIVE'
        ? annonces.filter((a) => destinataire(a, membre.city))
        : annonces
    return NextResponse.json(visibles)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST /api/announcements — la voix de la zawiya, avec son audience :
// toutes les zawiya, ou une sélection (ex. Nîmes + Montpellier).
export async function POST(req: Request) {
  try {
    const { refus } = await exiger(req, 'annonces.creer')
    if (refus) return refus
    const body = await req.json()
    /* Le message est FACULTATIF : le titre seul suffit (ex. « ANNONCE »
       en gros), de même que le message seul — mais pas les deux vides. */
    if (!body.text && !body.title) {
      return NextResponse.json({ error: 'Titre ou message requis' }, { status: 400 })
    }
    const announcement = await db.announcement.create({
      data: {
        title: body.title || null,
        text: body.text || '',
        color: body.color === 'CORAIL' ? 'CORAIL' : 'VERT',
        cities: lireDestinataires(body.cities),
      },
    })
    await journaliser({
      kind: 'ANNOUNCEMENT',
      action: 'CREATE',
      label: `Annonce publiée — « ${announcement.title || announcement.text.slice(0, 60) || 'sans texte'} »`,
      actor: body.actor || null,
    })
    return NextResponse.json(announcement, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

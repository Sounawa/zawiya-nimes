/* Résolution du membre appelant — côté serveur uniquement.
 * Le client envoie l'identifiant du frère connecté dans l'en-tête
 * « x-member-id » ; les routes vérifient ensuite ses droits avec
 * la même matrice que l'interface (src/lib/permissions.ts). */

import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { peut, type Droit } from '@/lib/permissions'

export interface MembreAppeleur {
  id: string
  name: string
  city: string
  role: string
  status: string
  perms: string | null
}

/** Le membre qui appelle — null si l'en-tête est absent ou inconnu */
export async function membreAppeleur(req: Request): Promise<MembreAppeleur | null> {
  const id = req.headers.get('x-member-id')
  if (!id) return null
  try {
    return await db.member.findUnique({ where: { id } })
  } catch {
    return null
  }
}

/** Hachage du code personnel — SHA-256 salé du prénom et de la zawiya */
export function hacherCode(pin: string, name: string, city: string): string {
  return createHash('sha256').update(`${pin}·${name.toLowerCase()}·${city}`).digest('hex')
}

/** Réponse 403 prête à renvoyer, avec le message montré en toast */
export function interdit(droit: Droit): Response {
  const messages: Record<Droit, string> = {
    'annonces.creer': 'Seuls les frères habilités peuvent publier des annonces.',
    'annonces.supprimer': 'Seuls les frères habilités peuvent supprimer des annonces.',
    'sondages.creer': 'Seuls les frères habilités peuvent créer des sondages.',
    'sondages.supprimer': 'Seuls les frères habilités peuvent supprimer des sondages.',
    'reunions.rediger': "Seuls les frères habilités peuvent rédiger pour l'ijtima'.",
    'reunions.supprimer': "Seuls les frères habilités peuvent supprimer un ijtima'.",
    'contenus.editer': 'Seuls les frères habilités peuvent modifier ces contenus.',
    'cotisations.voir': 'La trésorerie est réservée aux frères habilités.',
    'cotisations.gerer': 'Seul le trésorier peut faire cela.',
    'membres.gerer': 'Seul le référent de la zaouia peut gérer les membres.',
    'reglages.gerer': 'Seul le référent de la zaouia peut modifier les réglages.',
  }
  return Response.json({ error: messages[droit] ?? 'Action non permise' }, { status: 403 })
}

/** Garde d'entrée : renvoie la réponse 403 si l'appelant n'a pas le droit,
 *  sinon null et l'appelant (éventuellement null si non identifié).
 *  Les surcharges individuelles (perms) sont prises en compte, et un
 *  accès suspendu ou en attente de validation est refusé. */
export async function exiger(
  req: Request,
  droit: Droit
): Promise<{ membre: MembreAppeleur | null; refus: Response | null }> {
  const membre = await membreAppeleur(req)
  if (membre && membre.status !== 'ACTIVE') {
    return {
      membre,
      refus: Response.json(
        {
          error:
            membre.status === 'BLOCKED'
              ? 'Ton accès a été révoqué — contacte le référent de la zaouia.'
              : 'Ton inscription attend la validation du référent.',
        },
        { status: 403 }
      ),
    }
  }
  if (!membre || !peut(membre.city, membre.role, droit, membre.perms)) {
    return { membre, refus: interdit(droit) }
  }
  return { membre, refus: null }
}

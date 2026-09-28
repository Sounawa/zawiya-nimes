/* Résolution du membre appelant — côté serveur uniquement.
 * Le client envoie l'identifiant du frère connecté dans l'en-tête
 * « x-member-id » ; les routes vérifient ensuite ses droits avec
 * la même matrice que l'interface (src/lib/permissions.ts). */

import { db } from '@/lib/db'
import { peut, type Droit } from '@/lib/permissions'

export interface MembreAppeleur {
  id: string
  name: string
  city: string
  role: string
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

/** Réponse 403 prête à renvoyer, avec le message montré en toast */
export function interdit(droit: Droit): Response {
  const messages: Record<Droit, string> = {
    'annonces.creer': 'Seuls les frères de la zawiya de Nîmes peuvent publier des annonces.',
    'annonces.supprimer': 'Seuls les frères de la zawiya de Nîmes peuvent supprimer des annonces.',
    'sondages.creer': 'Seuls les frères de la zawiya de Nîmes peuvent créer des sondages.',
    'sondages.supprimer': 'Seuls les frères de la zawiya de Nîmes peuvent supprimer des sondages.',
    'reunions.rediger': "Seuls les frères de la zawiya de Nîmes peuvent rédiger pour l'ijtima'.",
    'reunions.supprimer': "Seuls les frères de la zawiya de Nîmes peuvent supprimer un ijtima'.",
    'contenus.editer': 'Seuls les frères de la zawiya de Nîmes peuvent modifier ces contenus.',
    'cotisations.voir': 'La trésorerie est réservée à la zawiya de Nîmes.',
    'cotisations.gerer': 'Seul le référent des cotisations peut faire cela.',
    'membres.gerer': 'Seul le référent de la zaouia peut gérer les membres.',
    'reglages.gerer': 'Seul le référent de la zaouia peut modifier les réglages.',
  }
  return Response.json({ error: messages[droit] ?? 'Action non permise' }, { status: 403 })
}

/** Garde d'entrée : renvoie la réponse 403 si l'appelant n'a pas le droit,
 *  sinon null et l'appelant (éventuellement null si non identifié). */
export async function exiger(
  req: Request,
  droit: Droit
): Promise<{ membre: MembreAppeleur | null; refus: Response | null }> {
  const membre = await membreAppeleur(req)
  if (!membre || !peut(membre.city, membre.role, droit)) {
    return { membre, refus: interdit(droit) }
  }
  return { membre, refus: null }
}

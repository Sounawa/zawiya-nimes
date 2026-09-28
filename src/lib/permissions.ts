/* ═════════════════════════════════════════════════════════════════════
   LES DROITS DE LA ZAWIYA — groupes (villes) × rôles × surcharges

   Le principe est simple :
   · La VILLE donne le périmètre :
       - NIMES               → tout le patrimoine de la zawiya (annonces,
                              sondages, rédaction de l'ijtima', contenus…)
       - AVIGNON, MONTPELLIER → la lecture et la participation (votes,
                              « Je viendrai »), rien de plus
   · Le RÔLE affine :
       - MEMBER    → participe et publie (à Nîmes)
       - TREASURER → gère la trésorerie (confirme les cotisations)
       - REFERENT  → gère la zawiya (membres, rôles, groupes, réglages)
                     et peut tout faire, y compris la trésorerie
   · La SURCHARGE (perms, frère par frère) prend le dessus sur le groupe :
       le référent peut accorder une famille de droits à un frère d'Avignon
       ou de Montpellier, ou la retirer à un frère de Nîmes.

   Un seul frère porte chaque charge : nommer un trésorier ou un
   référent remplace le porteur précédent (unicité en base).
   ═════════════════════════════════════════════════════════════════════ */

import type { FamilleDroits, Role, Surcharges, Ville } from './types'

export type Droit =
  | 'annonces.creer' // publier / modifier une annonce
  | 'annonces.supprimer'
  | 'sondages.creer' // créer / modifier un sondage
  | 'sondages.supprimer'
  | 'reunions.rediger' // rédiger / modifier un ijtima'
  | 'reunions.supprimer'
  | 'contenus.editer' // cartes adhkâr / samâ' / durûs
  | 'cotisations.voir' // voir la section trésorerie (cotisations + ziyara)
  | 'cotisations.gerer' // confirmer les sommes, exporter
  | 'membres.gerer' // rôles, groupes, ajout / suppression
  | 'reglages.gerer' // jours d'ijtima', lieu, réglages de la zaouia

/** À quelle famille de droits appartient un droit — null = hors familles */
function familleDuDroit(droit: Droit): FamilleDroits | null {
  switch (droit) {
    case 'annonces.creer':
    case 'annonces.supprimer':
      return 'annonces'
    case 'sondages.creer':
    case 'sondages.supprimer':
      return 'sondages'
    case 'reunions.rediger':
    case 'reunions.supprimer':
      return 'reunions'
    case 'contenus.editer':
      return 'contenus'
    case 'cotisations.voir':
      return 'cotisations'
    default:
      return null
  }
}

/** Lit les surcharges individuelles — chaîne JSON de la base ou objet */
export function lireSurcharges(perms: string | null | undefined): Surcharges {
  if (!perms) return {}
  try {
    const p = JSON.parse(perms) as Surcharges
    return p && typeof p === 'object' ? p : {}
  } catch {
    return {}
  }
}

/** La matrice — lu ainsi :
 *  peut('NIMES', 'MEMBER', 'sondages.creer')
 *  peut('MONTPELLIER', 'MEMBER', 'annonces.creer', surcharges) */
export function peut(
  ville: string | null | undefined,
  role: string | null | undefined,
  droit: Droit,
  surcharges?: string | Surcharges | null
): boolean {
  const v = (ville ?? 'NIMES') as Ville
  const r = (role ?? 'MEMBER') as Role
  const nimes = v === 'NIMES'

  /* Le référent porte toutes les charges — il peut tout */
  if (r === 'REFERENT') return true

  /* La surcharge du frère (s'il en a une) prime sur son groupe */
  const famille = familleDuDroit(droit)
  if (famille) {
    const s = typeof surcharges === 'string' ? lireSurcharges(surcharges) : (surcharges ?? {})
    if (famille in s) return s[famille] === true
  }

  switch (droit) {
    // Le patrimoine de la zawiya — ouvert aux frères de Nîmes
    case 'annonces.creer':
    case 'annonces.supprimer':
    case 'sondages.creer':
    case 'sondages.supprimer':
    case 'reunions.rediger':
    case 'reunions.supprimer':
    case 'contenus.editer':
    case 'cotisations.voir':
      return nimes || r === 'TREASURER'

    // La trésorerie — le trésorier, quelle que soit sa zawiya
    // (le référent, qui peut tout, est déjà passé ci-dessus)
    case 'cotisations.gerer':
      return r === 'TREASURER'

    // La conduite de la zaouia — le référent seul
    case 'membres.gerer':
    case 'reglages.gerer':
      return false

    default:
      return false
  }
}

/** Vrai si ce rôle est l'une des charges de la zawiya (badge doré) */
export function estCharge(role: string | null | undefined): boolean {
  return role === 'TREASURER' || role === 'REFERENT'
}

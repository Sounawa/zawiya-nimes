/* ═════════════════════════════════════════════════════════════════════
   LES DROITS DE LA ZAWIYA — groupes (villes) × rôles

   Le principe est simple :
   · La VILLE donne le périmètre :
       - NIMES       → tout le patrimoine de la zawiya (annonces,
                       sondages, rédaction de l'ijtima', cotisations…)
       - MONTPELLIER → la lecture et la participation (votes, « Je
                       viendrai »), rien de plus
   · Le RÔLE affine :
       - MEMBER    → participe et publie (à Nîmes)
       - TREASURER → gère la trésorerie (confirme les cotisations)
       - REFERENT  → gère la zawiya (membres, rôles, groupes, réglages)
                     et peut tout faire, y compris la trésorerie

   Un seul frère porte chaque charge : nommer un trésorier ou un
   référent remplace le porteur précédent (unicité en base).
   ═════════════════════════════════════════════════════════════════════ */

import type { Role, Ville } from './types'

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

/** La matrice — lu ainsi : peut('NIMES', 'MEMBER', 'sondages.creer') */
export function peut(ville: string | null | undefined, role: string | null | undefined, droit: Droit): boolean {
  const v = (ville ?? 'NIMES') as Ville
  const r = (role ?? 'MEMBER') as Role
  const nimes = v === 'NIMES'

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
      return nimes

    // La trésorerie — le trésorier (et le référent, qui peut tout)
    case 'cotisations.gerer':
      return nimes && (r === 'TREASURER' || r === 'REFERENT')

    // La conduite de la zaouia — le référent seul
    case 'membres.gerer':
    case 'reglages.gerer':
      return r === 'REFERENT'

    default:
      return false
  }
}

/** Vrai si ce rôle est l'une des charges de la zawiya (badge doré) */
export function estCharge(role: string | null | undefined): boolean {
  return role === 'TREASURER' || role === 'REFERENT'
}

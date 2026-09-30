/* ═══════════════════════════════════════════════════════════════════
   Push — les notifications qui arrivent sur le téléphone, même
   quand la zawiya est fermée.

   Le Web Push est une affaire de trois acteurs :
   • le navigateur du frère, qui a donné son accord et garde une
     paire de clés de chiffrement (p256dh + auth) ;
   • son service push (FCM chez Chrome, Apple chez Safari iOS) ;
   • notre serveur, qui signe chaque message avec la clé privée
     VAPID — c'est ainsi que le service push sait que le message
     vient bien de la zawiya.

   Ici : l'envoi proprement dit. UN SEUL USAGE, conforme à la
   demande de la zawiya : prévenir d'un ijtimâ' quand une ANNONCE
   ou un SONDAGE est publié. Rien d'autre ne pousse — ni les
   votes, ni les réunions, ni les présences.
   ═══════════════════════════════════════════════════════════════════ */

import webpush from 'web-push'
import { db } from '@/lib/db'

/* La paire VAPID est configurée une fois pour toutes (variables
   d'environnement). Sans elle, aucun envoi — la fonction se tait,
   le reste du site continue de vivre. */
let configure = false
function preparer(): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  if (!configure) {
    webpush.setVapidDetails('mailto:zawiya-nimes@netlify.app', pub, priv)
    configure = true
  }
  return true
}

export interface MessagePush {
  /** Titre de la notification (« 📣 Nouvelle annonce ») */
  titre: string
  /** Corps du message (extrait de l'annonce, question du sondage) */
  corps: string
  /** Ouvrir la zawiya au clic — section cible (annonces, sondages) */
  section?: 'annonces' | 'sondages'
}

/** Envoyer une notification push à toute la communauté.
 *
 * @param villesDestinataires — zawiya ciblées par l'annonce
 *   (null = toutes). Les appareils hors de la cible ne reçoivent rien.
 * @param membreExclu — le frère qui vient de publier : ses propres
 *   appareils n'ont pas besoin d'être prévenus.
 *
 * Les erreurs sont silencieuses : une notification qui part mal ne
 * doit jamais faire échouer la publication de l'annonce. Les
 * abonnements périmés (appareil désinstallé, permission retirée)
 * sont nettoyés au passage — réponse 404/410 du service push.
 */
export async function envoyerPush(
  message: MessagePush,
  opts: { villes?: string[] | null; membreExclu?: string | null } = {}
): Promise<void> {
  if (!preparer()) return
  try {
    const abonnements = await db.pushSubscription.findMany()
    const cibles = abonnements.filter((a) => {
      /* L'appareil du publieur n'a pas à être prévenu */
      if (opts.membreExclu && a.memberId === opts.membreExclu) return false
      /* Annonce ciblée : seules les zawiya visées reçoivent.
         Les appareils sans zawiya connue reçoivent tout — prudence
         dans l'autre sens : mieux vaut prévenir que taire. */
      if (opts.villes && opts.villes.length > 0 && a.city) {
        return opts.villes.includes(a.city)
      }
      return true
    })
    if (!cibles.length) return

    const charge = JSON.stringify({
      titre: message.titre,
      corps: message.corps,
      section: message.section ?? 'annonces',
    })

    await Promise.allSettled(
      cibles.map(async (a) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: a.endpoint,
              keys: { p256dh: a.p256dh, auth: a.auth },
            },
            charge,
            { TTL: 24 * 3600, urgency: 'normal' }
          )
        } catch (e) {
          /* Abonnement périmé — le service push le dit lui-même
             (404 Gone, 410) : on retire la ligne, inutile de
             réessayer pendant des mois. */
          const statut = (e as { statusCode?: number }).statusCode
          if (statut === 404 || statut === 410) {
            await db.pushSubscription.delete({ where: { id: a.id } }).catch(() => undefined)
          }
        }
      })
    )
  } catch {
    /* La push ne doit jamais casser la route qui l'appelle */
  }
}

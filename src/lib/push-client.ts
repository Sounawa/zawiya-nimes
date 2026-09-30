/* ═══════════════════════════════════════════════════════════════════
   Push côté frère — s'abonner aux notifications de la zawiya.

   Le parcours, guidé par un geste de l'utilisateur (exigence des
   navigateurs) :
   1. la permission est demandée — « La Zawiya Nîmes souhaite vous
      envoyer des notifications » ;
   2. le service worker s'abonne au service push du navigateur
      (FCM, Apple) avec la clé publique VAPID de la zawiya ;
   3. l'appareil confie ses clés à notre serveur — il saura alors
      le réveiller quand une annonce ou un sondage paraîtra.

   iOS : les notifications ne fonctionnent QUE si l'app est
   installée sur l'écran d'accueil (Safari ≥ 16.4) — on le dit
   au frère plutôt que de le laisser dans le doute.
   ═══════════════════════════════════════════════════════════════════ */

/** Base64 URL → Uint8Array (format exigé par pushManager.subscribe) */
function base64VersUint8(base64: string): Uint8Array {
  const rembourrage = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + rembourrage).replace(/-/g, '+').replace(/_/g, '/')
  const brut = atob(b64)
  const octets = new Uint8Array(brut.length)
  for (let i = 0; i < brut.length; i++) octets[i] = brut.charCodeAt(i)
  return octets
}

/** Ce navigateur sait-il recevoir du push ?
    (service worker + PushManager + Notification — iOS installé) */
export function pushDisponible(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/* iOS ne pousse que pour les apps installées (mode standalone).
   Détection : promesse never-resolve du navigateur iOS + matchMedia
   du mode standalone — heuristique standard des PWA. */
function estIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}
export function estInstalle(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
}
export function iosSansInstallation(): boolean {
  return estIOS() && !estInstalle()
}

/** L'appareil est-il abonné (et la permission accordée) ? */
export async function estAbonnePush(): Promise<boolean> {
  if (!pushDisponible()) return false
  if (Notification.permission !== 'granted') return false
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    return Boolean(sub)
  } catch {
    return false
  }
}

export type ResultatAbonnement =
  | 'abonne'
  | 'refuse'
  | 'non-supporte'
  | 'ios-non-installe'
  | 'erreur'

/** S'abonner aux notifications — déclenché par un clic.
 *  Renvoie le résultat pour que l'interface puisse expliquer. */
export async function abonnerPush(memberId?: string | null): Promise<ResultatAbonnement> {
  if (!pushDisponible()) return 'non-supporte'
  if (iosSansInstallation()) return 'ios-non-installe'

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return 'refuse'

    /* La clé publique de la zawiya, offerte par le serveur */
    const rep = await fetch('/api/push/cle')
    const { cle } = (await rep.json()) as { cle: string | null }
    if (!cle) return 'erreur'

    const reg = await navigator.serviceWorker.ready

    /* Déjà abonné dans ce navigateur ? On renouvelle l'inscription
       côté serveur (le frère a pu se reconnecter sous un autre
       prénom) sans créer de doublon. */
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64VersUint8(cle),
      })
    }

    const envoi = await fetch('/api/push/abonnements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(memberId ? { 'x-member-id': memberId } : {}),
      },
      body: JSON.stringify(sub.toJSON()),
    })
    if (!envoi.ok) return 'erreur'
    return 'abonne'
  } catch {
    return 'erreur'
  }
}

/** Se désabonner — le bouton « Ne plus être prévenu » des réglages. */
export async function desabonnerPush(): Promise<boolean> {
  if (!pushDisponible()) return false
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return true
    await fetch('/api/push/abonnements', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    })
    await sub.unsubscribe()
    return true
  } catch {
    return false
  }
}

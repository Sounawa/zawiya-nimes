/* ═══════════════════════════════════════════════════════════════════
   Notifications navigateur — prévenir même quand l'onglet est en fond.
   API utilisée avec prudence : jamais sur le welcome gate (interaction
   requise), silencieuse si non supportée (iOS Safari…).
   ═══════════════════════════════════════════════════════════════════ */

/** L'API Notification est-elle disponible dans ce navigateur ? */
export function notificationsDisponibles(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/** Permission courante ('default' | 'granted' | 'denied') — '' si non supportée */
export function permissionNotifications(): NotificationPermission | '' {
  return notificationsDisponibles() ? Notification.permission : ''
}

/** Demander la permission (doit être déclenché par un geste utilisateur).
 *  Résout 'unsupported' si l'API n'existe pas. */
export async function demanderPermissionNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsDisponibles()) return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

/** Afficher une notification système — uniquement si la permission est accordée.
 *  Renvoie true si affichée. */
export function notifierNavigateur(titre: string, corps: string): boolean {
  if (!notificationsDisponibles() || Notification.permission !== 'granted') return false
  try {
    const n = new Notification(titre, {
      body: corps,
      icon: '/icone-192.png',
      badge: '/favicon-96.png',
      tag: 'zawiya-nimes', // remplace la précédente au lieu de s'empiler
    })
    /* Clic → ramener l'onglet au premier plan */
    n.onclick = () => {
      window.focus()
      n.close()
    }
    return true
  } catch {
    return false
  }
}

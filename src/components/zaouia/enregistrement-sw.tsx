'use client'

import { useEffect } from 'react'

/* ─── Enregistrement du service worker (app-shell hors-ligne) ───
   Silencieux : si le navigateur ne supporte pas les SW (iOS Safari
   ancien), l'application fonctionne exactement comme avant.
   À chaque visite, on force la vérification de mise à jour : plus
   jamais un aperçu bloqué sur une vieille coquille. */
export function EnregistrementSW() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    const id = window.setTimeout(() => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          /* Vérifie immédiatement une nouvelle version du worker */
          reg.update().catch(() => {})
          /* Et à chaque retour sur l'onglet */
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') reg.update().catch(() => {})
          })
        })
        .catch(() => {
          /* l'app fonctionne sans SW — aucune alerte */
        })
    }, 1500)
    return () => window.clearTimeout(id)
  }, [])
  return null
}

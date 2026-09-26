'use client'

import { useEffect } from 'react'

/* ─── Enregistrement du service worker (app-shell hors-ligne) ───
   Silencieux : si le navigateur ne supporte pas les SW (iOS Safari
   ancien), l'application fonctionne exactement comme avant. */
export function EnregistrementSW() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    const id = window.setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* l'app fonctionne sans SW — aucune alerte */
      })
    }, 1500)
    return () => window.clearTimeout(id)
  }, [])
  return null
}

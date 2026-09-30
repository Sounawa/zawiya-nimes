'use client'

import { useEffect } from 'react'
import { useNav } from '@/lib/store'

/* ─── Enregistrement du service worker (app-shell hors-ligne + push) ───
   Silencieux : si le navigateur ne supporte pas les SW (iOS Safari
   ancien), l'application fonctionne exactement comme avant.

   Le service worker parle aussi à la page : quand un frère clique
   une notification, il demande l'ouverture de la section visée
   (annonces, ou Al-Ijtimâ' pour les sondages) — la page exécute
   et fait défiler jusqu'à elle. */
export function EnregistrementSW() {
  const ouvrir = useNav((s) => s.ouvrir)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    const id = window.setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* l'app fonctionne sans SW — aucune alerte */
      })
    }, 1500)
    return () => window.clearTimeout(id)
  }, [])

  /* ─── Le service worker réveille la page : ouvrir la section ─── */
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    const ecouteur = (event: MessageEvent) => {
      const section = event.data?.ouvrirSection
      if (typeof section === 'string') ouvrir(section)
    }
    navigator.serviceWorker.addEventListener('message', ecouteur)
    return () => navigator.serviceWorker.removeEventListener('message', ecouteur)
  }, [ouvrir])

  return null
}

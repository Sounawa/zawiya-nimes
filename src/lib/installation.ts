'use client'

import { create } from 'zustand'

/* ═══════════════════════════════════════════════════════════════════
   Installer la zawiya (PWA) — hors-ligne, comme une vraie app.

   Le navigateur émet `beforeinstallprompt` quand il juge le site
   digne de l'écran d'accueil (Chrome, Edge, Android…). Cette
   invitation est unique et consommable UNE fois : nous la capturons
   tôt et la gardons précieusement — le bandeau discret peut la
   proposer, mais si le frère l'ignore, les Réglages la proposent
   toujours (« je change d'avis → paramètres »).

   iOS ne connaît pas cet événement : l'installation passe par le
   menu Partager ▸ « Sur l'écran d'accueil » — on le explique.
   ═══════════════════════════════════════════════════════════════════ */

/* L'événement non standardisé du navigateur */
export interface InviteInstallation extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface EtatInstallation {
  /* L'invitation captée — null si le navigateur ne propose pas
     (ou l'a déjà consommée) */
  invite: InviteInstallation | null
  capturer: (invite: InviteInstallation) => void
  oublier: () => void
}

export const useInstallation = create<EtatInstallation>((set) => ({
  invite: null,
  capturer: (invite) => set({ invite }),
  oublier: () => set({ invite: null }),
}))

/* iPhone / iPad (et iPadOS déguisé en Mac) — pas d'invitation
   automatique : le menu Partager est la seule porte. */
export function estIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

/* L'application tourne-t-elle déjà « installée » ? (mode standalone
   de l'écran d'accueil — vraie app, sans barre de navigateur) */
export function estInstallee(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

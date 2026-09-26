'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from './types'

interface UserState {
  /** Prénom saisi à l'entrée — identité locale, comme l'originale */
  name: string | null
  /** Le membre correspondant (résolu côté serveur) */
  memberId: string | null
  role: Role
  /** Notifications activées */
  notifAsked: boolean
  setName: (name: string) => void
  setMember: (id: string, role: Role) => void
  setNotifAsked: (v: boolean) => void
  logout: () => void
}

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      name: null,
      memberId: null,
      role: 'ADMIN',
      notifAsked: false,
      setName: (name) => set({ name }),
      setMember: (memberId, role) => set({ memberId, role }),
      setNotifAsked: (notifAsked) => set({ notifAsked }),
      logout: () => set({ name: null, memberId: null, role: 'ADMIN' }),
    }),
    { name: 'zaouia-user' }
  )
)

/* ─── Navigation inter-sections (recherche globale ⌘K) ─── */
interface NavState {
  /** Section demandée { id, horodatage } — consommée par SectionShell */
  demande: { id: string; horodatage: number } | null
  /** Ouvre (et fait défiler vers) une section de la page */
  ouvrir: (id: string) => void
  effacer: () => void
}

export const useNav = create<NavState>((set) => ({
  demande: null,
  ouvrir: (id) => set({ demande: { id, horodatage: Date.now() } }),
  effacer: () => set({ demande: null }),
}))

/* ─── Zone d'impression (feuille de présence / comptes) ─── */
export type CibleImpression =
  | { kind: 'presence'; meetingId: string }
  | { kind: 'comptes' }
  | { kind: 'bilan' }
  | { kind: 'presences' }

interface PrintState {
  cible: CibleImpression | null
  /** Affiche la feuille puis ouvre le dialogue d'impression du navigateur */
  imprimer: (c: CibleImpression) => void
  effacer: () => void
}

export const usePrint = create<PrintState>((set) => ({
  cible: null,
  imprimer: (cible) => {
    set({ cible })
    // Double requestAnimationFrame : laisser React peindre la feuille cachée
    // avant que window.print() ne fige le rendu.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        try {
          window.print()
        } catch {
          /* certains navigateurs bloquent print() programmatique */
        }
      })
    )
  },
  effacer: () => set({ cible: null }),
}))

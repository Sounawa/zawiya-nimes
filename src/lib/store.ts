'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role } from './types'
import type { LangueAdhkar } from '@/data/adhkar-docs'

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

/* ─── Rappel du prochain ijtimâ' (bandeau) — masquage persistant ─── */
interface RappelState {
  /** IDs des réunions dont le rappel en bandeau a été masqué */
  masques: string[]
  masquer: (id: string) => void
  /** Réaffiche le rappel pour une réunion (ou toutes si null) */
  retablir: (id?: string) => void
}

export const useRappelBandeau = create<RappelState>()(
  persist(
    (set) => ({
      masques: [],
      masquer: (id) =>
        set((s) => ({
          masques: s.masques.includes(id) ? s.masques : [...s.masques, id],
        })),
      retablir: (id) =>
        set((s) => ({
          masques: id ? s.masques.filter((x) => x !== id) : [],
        })),
    }),
    { name: 'zaouia-rappel-bandeau' }
  )
)

/* ─── Préférences de lecture du cahier d'invocations ───
   Police, taille, interligne, couleurs — tout se règle ici,
   enregistré sur l'appareil de chacun. */
export type PoliceLecture = 'cormorant' | 'garamond' | 'crimson'
export type PoliceArabe = 'amiri' | 'scheherazade' | 'naskh'
export type Interligne = 'compact' | 'normal' | 'aere'
export type ThemeLecture = 'ivoire' | 'parchemin' | 'nuit'
export type AccentLecture = 'or' | 'vert' | 'brun'

interface LectureState {
  police: PoliceLecture
  /** police du kitāb arabe — Amiri, Scheherazade ou Naskh */
  policeArabe: PoliceArabe
  /** taille du kitāb arabe (px) — indépendante du cahier */
  tailleArabe: number
  taille: number
  interligne: Interligne
  theme: ThemeLecture
  accent: AccentLecture
  /** langue de lecture des adhkâr — phonétique du cahier ou arabe du kitāb */
  langueAdhkar: LangueAdhkar
  regler: (p: Partial<Omit<LectureState, 'regler'>>) => void
}

export const useLecture = create<LectureState>()(
  persist(
    (set) => ({
      police: 'cormorant',
      policeArabe: 'amiri',
      tailleArabe: 25,
      taille: 19,
      interligne: 'normal',
      theme: 'ivoire',
      accent: 'or',
      langueAdhkar: 'ph',
      regler: (p) => set(p),
    }),
    { name: 'zaouia-lecture' }
  )
)

/* ─── Zone d'impression (feuille de présence / comptes) ─── */
export type CibleImpression =
  | { kind: 'presence'; meetingId: string }
  | { kind: 'comptes' }
  | { kind: 'bilan' }
  | { kind: 'presences' }
  | { kind: 'cahier'; chapitreId: string }
  | { kind: 'kitab'; chapitreId: string }

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

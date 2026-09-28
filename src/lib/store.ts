'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role, Ville } from './types'
import type { LangueAdhkar } from '@/data/adhkar-docs'

interface UserState {
  /** Prénom saisi à l'entrée — identité locale, comme l'originale */
  name: string | null
  /** La zawiya choisie à l'entrée (Nîmes, Avignon ou Montpellier) */
  ville: Ville
  /** Le membre correspondant (résolu côté serveur) */
  memberId: string | null
  role: Role
  /** Surcharges de droits individuelles (JSON) — décidées par le référent */
  perms: string | null
  /** Notifications activées */
  notifAsked: boolean
  setName: (name: string) => void
  setVille: (ville: Ville) => void
  setMember: (id: string, role: Role, ville: Ville, perms?: string | null) => void
  setNotifAsked: (v: boolean) => void
  logout: () => void
}

export const useUser = create<UserState>()(
  persist(
    (set) => ({
      name: null,
      ville: 'NIMES',
      memberId: null,
      role: 'MEMBER',
      perms: null,
      notifAsked: false,
      setName: (name) => set({ name }),
      setVille: (ville) => set({ ville }),
      setMember: (memberId, role, ville, perms = null) =>
        set({ memberId, role, ville, perms }),
      setNotifAsked: (notifAsked) => set({ notifAsked }),
      logout: () =>
        set({ name: null, ville: 'NIMES', memberId: null, role: 'MEMBER', perms: null }),
    }),
    {
      name: 'zaouia-user',
      version: 3,
      /* Les anciens états (rôle ADMIN, sans ville, sans surcharges)
         deviennent membre de Nîmes aux droits par défaut */
      migrate: (persisted) => {
        const ancien = (persisted ?? {}) as Record<string, unknown>
        const ancienRole = ancien.role as string | undefined
        return {
          ...ancien,
          ville: (ancien.ville as Ville | undefined) ?? 'NIMES',
          role: ancienRole === 'ADMIN' ? 'MEMBER' : (ancienRole ?? 'MEMBER'),
          perms: (ancien.perms as string | null | undefined) ?? null,
        } as UserState
      },
    }
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
      policeArabe: 'scheherazade',
      tailleArabe: 25,
      taille: 19,
      interligne: 'normal',
      theme: 'ivoire',
      accent: 'or',
      langueAdhkar: 'ph',
      regler: (p) => set(p),
    }),
    {
      name: 'zaouia-lecture',
      version: 1,
      /* v0 → v1 : Scheherazade devient la police du kitāb partout
         sur le site — les frères qui avaient Amiri d'enregistré
         passent à Scheherazade une fois, puis peuvent revenir. */
      migrate: (persisted: unknown) => {
        const etat = persisted as Record<string, unknown> | undefined
        if (etat && etat.policeArabe === 'amiri') etat.policeArabe = 'scheherazade'
        return etat as unknown as LectureState
      },
    }
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

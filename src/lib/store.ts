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

'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { LogOut, Settings2, UserRound } from 'lucide-react'
import { useUser } from '@/lib/store'
import { dateLongue } from '@/lib/format'
import { Button } from '@/components/ui/button'

interface HeaderBarProps {
  onOpenSettings: () => void
  onOpenProfile: () => void
}

export function HeaderBar({ onOpenSettings, onOpenProfile }: HeaderBarProps) {
  const name = useUser((s) => s.name)
  const role = useUser((s) => s.role)
  const logout = useUser((s) => s.logout)

  return (
    <header className="sticky top-0 z-40 border-b border-[#0b5d42]/10 bg-[#fbf9f4]/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
        {/* Logo + titre */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-3 rounded-2xl p-1 pr-3 transition-colors hover:bg-[#0b5d42]/5"
          aria-label="Profil"
        >
          <motion.div
            whileHover={{ rotate: 6, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-[#0b5d42]/15"
          >
            <Image src="/tariqa.png" alt="Sceau de la zawiya" fill sizes="44px" className="object-contain p-0.5" />
          </motion.div>
          <span className="text-left leading-tight">
            <span className="block text-[15px] font-bold tracking-wide text-[#123c2d]">ZAWIYA</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-[#0b5d42]">
              Nimes
            </span>
          </span>
        </button>

        <div className="flex-1" />

        {/* Utilisateur (+ pastille trésorier) */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenProfile}
          className="h-10 gap-2 rounded-full px-3 text-sm font-semibold text-[#123c2d] hover:bg-[#0b5d42]/8"
        >
          <UserRound className="h-4 w-4 text-[#0b5d42]" />
          <span className="max-w-28 truncate">{name}</span>
          {role === 'TREASURER' && (
            <span className="rounded-full bg-[#c9a24b]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#a3781f]">
              Trésorier
            </span>
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          aria-label="Réglages"
          className="h-10 w-10 rounded-full text-[#0b5d42] hover:bg-[#0b5d42]/8"
        >
          <Settings2 className="h-4.5 w-4.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          aria-label="Changer d'identité"
          className="h-10 w-10 rounded-full text-[#78877d] hover:bg-[#0b5d42]/8"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Ligne spirituelle : la date du jour */}
      <div className="mx-auto max-w-3xl px-4 pb-2">
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-[11px] font-medium uppercase tracking-[0.22em] text-[#8a9188]"
        >
          {dateLongue(new Date())}
          <span className="mx-2 text-[#b8923a]">·</span>
          <span className="text-[#0b5d42]">Nîmes</span>
        </motion.p>
      </div>
    </header>
  )
}

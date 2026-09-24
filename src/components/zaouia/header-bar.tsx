'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Bell, LogOut, Settings2, UserRound } from 'lucide-react'
import { useUser } from '@/lib/store'
import { PRIERES, type Timings } from '@/lib/types'
import { dateLongue, dansXmin } from '@/lib/format'
import { Button } from '@/components/ui/button'

interface HeaderBarProps {
  timings: Timings | undefined
  onOpenSettings: () => void
  onOpenProfile: () => void
}

/** Trouve la prochaine prière à venir */
export function prochainePriere(t: Timings | undefined) {
  if (!t) return null
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  for (const p of PRIERES) {
    if (p.key === 'Chourouq') continue
    const m = t[p.key].match(/^(\d{1,2}):(\d{2})$/)
    if (!m) continue
    const total = parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
    if (total > nowMin) {
      return { nom: p.label, heure: t[p.key], key: p.key }
    }
  }
  return { nom: 'Fajr', heure: t.Fajr, key: 'Fajr' as const }
}

export function HeaderBar({ timings, onOpenSettings, onOpenProfile }: HeaderBarProps) {
  const name = useUser((s) => s.name)
  const logout = useUser((s) => s.logout)
  const prochaine = prochainePriere(timings)
  const relatif = dansXmin(prochaine?.heure ?? null)

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
            <Image src="/tariqa.png" alt="Sceau de la zaouia" fill sizes="44px" className="object-contain p-0.5" />
          </motion.div>
          <span className="text-left leading-tight">
            <span className="block text-[15px] font-bold tracking-wide text-[#123c2d]">ZAOUIA</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-[#0b5d42]">
              St Denis
            </span>
          </span>
        </button>

        <div className="flex-1" />

        {/* Utilisateur */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenProfile}
          className="h-10 gap-2 rounded-full px-3 text-sm font-semibold text-[#123c2d] hover:bg-[#0b5d42]/8"
        >
          <UserRound className="h-4 w-4 text-[#0b5d42]" />
          <span className="max-w-28 truncate">{name}</span>
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

      {/* Barre spirituelle : date + prochaine prière */}
      <div className="mx-auto max-w-3xl px-4 pb-2">
        <motion.p
          key={prochaine?.key}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-[11px] font-medium uppercase tracking-[0.22em] text-[#8a9188]"
        >
          {dateLongue(new Date())}
          {prochaine && (
            <>
              <span className="mx-2 text-[#b8923a]">·</span>
              <span className="text-[#0b5d42]">
                {prochaine.nom} {prochaine.heure}
              </span>
              {relatif && <span className="text-[#b8923a]"> · {relatif}</span>}
            </>
          )}
        </motion.p>
      </div>
    </header>
  )
}

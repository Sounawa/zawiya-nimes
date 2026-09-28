'use client'

import Image from 'next/image'
import { motion, useScroll, useSpring } from 'framer-motion'
import { LogOut, Settings2, UserRound } from 'lucide-react'
import { useUser } from '@/lib/store'
import { dateLongue } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/zaouia/theme-toggle'
import { RechercheGlobale } from '@/components/zaouia/recherche-globale'

interface HeaderBarProps {
  onOpenSettings: () => void
  onOpenProfile: () => void
}

export function HeaderBar({ onOpenSettings, onOpenProfile }: HeaderBarProps) {
  const name = useUser((s) => s.name)
  const role = useUser((s) => s.role)
  const logout = useUser((s) => s.logout)

  /* Fil d'or — progression de lecture sous le bandeau collant */
  const { scrollYProgress } = useScroll()
  const progression = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 })

  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex max-w-3xl items-center gap-1.5 px-3 py-3 sm:gap-3 sm:px-4">
        {/* Logo + titre */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-3 rounded-2xl p-1 pr-1 transition-colors hover:bg-primary/5 sm:pr-3"
          aria-label="Profil"
        >
          <motion.div
            whileHover={{ rotate: 6, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-primary/15"
          >
            <Image src="/tariqa.png" alt="Sceau de la zawiya" fill sizes="44px" className="object-contain p-0.5" />
          </motion.div>
          <span className="hidden text-left leading-tight min-[420px]:block">
            <span className="block text-[15px] font-bold tracking-wide text-encre">ZAWIYA</span>
            <span className="block text-[10.5px] font-semibold uppercase tracking-[0.28em] text-primary">
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
          className="h-10 max-w-[30vw] gap-2 rounded-full px-2.5 text-sm font-semibold text-encre hover:bg-primary/8 sm:max-w-[46vw] sm:px-3"
        >
          <UserRound className="h-4 w-4 shrink-0 text-primary" />
          <span className="max-w-24 truncate">{name}</span>
          {role === 'TREASURER' && (
            <span className="hidden shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold-vif sm:inline-block">
              Trésorier
            </span>
          )}
        </Button>

        <RechercheGlobale />

        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          aria-label="Réglages"
          className="h-9 w-9 shrink-0 rounded-full text-primary hover:bg-primary/8 sm:h-10 sm:w-10"
        >
          <Settings2 className="h-4.5 w-4.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          aria-label="Changer d'identité"
          className="hidden h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:bg-primary/8 sm:inline-flex"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Ligne spirituelle : la date du jour */}
      <div className="mx-auto max-w-3xl px-4 pb-3">
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-[11px] font-medium uppercase tracking-[0.22em] text-brouillard"
        >
          {dateLongue(new Date())}
          <span className="mx-2 text-gold">·</span>
          <span className="text-primary">Nîmes</span>
        </motion.p>
      </div>

      {/* Fil d'or — suit la progression de la page */}
      <motion.span
        aria-hidden
        style={{ scaleX: progression }}
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-primary via-accent to-gold-clair"
      />

      {/* Frise de zellige — la corniche andalouse de l'en-tête */}
      <div aria-hidden className="bande-zellige h-[5px] w-full" />
    </header>
  )
}

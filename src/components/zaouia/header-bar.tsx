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

  /* Fil d'or — progression de lecture au-dessus de la corniche */
  const { scrollYProgress } = useScroll()
  const progression = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 })

  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-background/85 backdrop-blur-lg">
      {/* La sebka — claustras de stuc, née du bord droit, éteinte avant le titre */}
      <div aria-hidden className="sebka pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex max-w-3xl items-center gap-1.5 px-3 py-3 sm:gap-3 sm:px-4">
        {/* Logo — tuile octogonale de zellige, filet d'or emboîté */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-3 rounded-2xl p-1 pr-1 transition-colors hover:bg-primary/5 sm:pr-3"
          aria-label="Profil"
        >
          <motion.div
            whileHover={{ rotate: 6, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="tuile-khatim-sm h-12 w-12 shrink-0 bg-gradient-to-b from-gold-clair via-gold to-gold-vif p-[1.5px] shadow-sm"
          >
            <span className="tuile-khatim-sm relative block h-full w-full bg-white">
              <Image
                src="/tariqa.png"
                alt="Sceau de la zawiya"
                fill
                sizes="48px"
                className="object-contain p-1"
              />
            </span>
          </motion.div>
          <span className="hidden text-left leading-tight min-[420px]:block">
            <span className="block text-[15px] font-bold tracking-wide text-encre">ZAWIYA</span>
            <span className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-primary">
              <span aria-hidden className="text-[7px] text-gold">✦</span>
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

      {/* Ligne spirituelle : la date du jour, entre filets d'or */}
      <div className="relative mx-auto max-w-3xl px-4 pb-3">
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-brouillard"
        >
          <span className="ornement-filet shrink-0 text-gold/70" aria-hidden />
          <span className="shrink-0 text-[8px] text-gold" aria-hidden>
            ✦
          </span>
          <span className="truncate">
            {dateLongue(new Date())}
            <span className="mx-1.5 text-gold">·</span>
            <span className="text-primary">Nîmes</span>
          </span>
          <span className="shrink-0 text-[8px] text-gold" aria-hidden>
            ✦
          </span>
          <span className="ornement-filet shrink-0 text-gold/70" aria-hidden />
        </motion.p>
      </div>

      {/* Fil d'or — suit la progression de la page, posé sur la corniche */}
      <motion.span
        aria-hidden
        style={{ scaleX: progression }}
        className="absolute inset-x-0 bottom-[7px] h-[2px] origin-left bg-gradient-to-r from-primary via-accent to-gold-clair"
      />

      {/* La corniche nasride — merlons pointus, profil des murailles de l'Alhambra */}
      <div aria-hidden className="frise-merlons h-[7px] w-full" />
    </header>
  )
}

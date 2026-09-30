'use client'

import Image from 'next/image'
import { motion, useScroll, useSpring } from 'framer-motion'
import { LogOut, Settings2, UserRound } from 'lucide-react'
import { useUser } from '@/lib/store'
import { useMembers } from '@/lib/api'
import { peut } from '@/lib/permissions'
import { VILLE_LABEL } from '@/lib/types'
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
  const ville = useUser((s) => s.ville)
  const perms = useUser((s) => s.perms)
  const logout = useUser((s) => s.logout)

  /* Les réglages de la zaouia ne regardent que la maison */
  const gereReglages = peut(ville, role, 'reglages.gerer', perms)

  /* Les demandes d'inscription en attente — pastille dorée sur l'engrenage */
  const { data: membres } = useMembers()
  const demandes = (membres ?? []).filter((m) => m.status === 'PENDING').length

  /* Fil d'or — progression de lecture au-dessus de la corniche */
  const { scrollYProgress } = useScroll()
  const progression = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 })

  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-background/85 backdrop-blur-lg">
      {/* La sebka — claustras de stuc, née du bord droit, éteinte avant le titre */}
      <div aria-hidden className="sebka pointer-events-none absolute inset-0" />

      <div className="relative mx-auto flex max-w-3xl items-center gap-1.5 px-3 py-3 sm:gap-3 sm:px-4">
        {/* Logo — cartouche de zellige allongé, la calligraphie de la tariqa */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-3 rounded-2xl p-1 pr-1 transition-colors hover:bg-primary/5 sm:pr-3"
          aria-label="Profil"
        >
          <motion.div
            whileHover={{ scale: 1.06 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="cartouche-khatim h-[58px] w-[72px] shrink-0 bg-gradient-to-b from-gold-clair via-gold to-gold-vif p-[1.5px] shadow-sm sm:h-16 sm:w-20"
          >
            <span className="cartouche-khatim relative block h-full w-full bg-white">
              <Image
                src="/tariqa.png"
                alt="Calligraphie de la zawiya — la Basmala calligraphiée"
                fill
                priority
                sizes="80px"
                className="object-contain p-1"
              />
            </span>
          </motion.div>
          <span className="hidden text-left leading-tight min-[420px]:block">
            <span className="block text-[15px] font-bold tracking-wide text-encre">ZAWIYA</span>
            <span className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-primary">
              <span aria-hidden className="text-[7px] text-gold">✦</span>
              {VILLE_LABEL[ville] ?? 'Nîmes'}
            </span>
          </span>
        </button>

        <div className="flex-1" />

        {/* Utilisateur — le prénom seul s'affiche : la charge de la maison
            reste discrète, rien ne la distingue à l'œil */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenProfile}
          className="h-10 max-w-[30vw] gap-2 rounded-full px-2.5 text-sm font-semibold text-encre hover:bg-primary/8 sm:max-w-[46vw] sm:px-3"
        >
          <UserRound className="h-4 w-4 shrink-0 text-primary" />
          <span className="max-w-24 truncate">{name}</span>
        </Button>

        <RechercheGlobale />

        <ThemeToggle />

        {/* Réglages — réservés au référent de la zaouia */}
        {gereReglages && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            aria-label={demandes ? `Réglages — ${demandes} demande${demandes > 1 ? 's' : ''} d’inscription` : 'Réglages'}
            title={
              demandes
                ? `${demandes} demande${demandes > 1 ? 's' : ''} d’inscription à valider`
                : 'Réglages de la zaouia'
            }
            className="relative h-9 w-9 shrink-0 rounded-full text-primary hover:bg-primary/8 sm:h-10 sm:w-10"
          >
            <Settings2 className="h-4.5 w-4.5" />
            {demandes > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold leading-none text-white shadow-sm"
              >
                {demandes}
              </motion.span>
            )}
          </Button>
        )}

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
            <span className="text-primary">{VILLE_LABEL[ville] ?? 'Nîmes'}</span>
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

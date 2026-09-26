'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'

/** Abonnement vide — sert uniquement à distinguer serveur (false) et client (true). */
const abonnementVide = () => () => {}
const instantanéClient = () => true
const instantanéServeur = () => false

/** Bascule jour / nuit — soleil doré le jour, lune d'argent la nuit. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  /* next-themes ne connaît le thème qu'après hydratation —
     useSyncExternalStore évite tout mismatch sans setState-in-effect. */
  const monte = useSyncExternalStore(abonnementVide, instantanéClient, instantanéServeur)

  if (!monte) {
    return <span className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" aria-hidden />
  }

  const nuit = resolvedTheme === 'dark'

  return (
    <motion.button
      type="button"
      onClick={() => setTheme(nuit ? 'light' : 'dark')}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      aria-label={nuit ? 'Passer en mode jour' : 'Passer en mode nuit'}
      title={nuit ? 'Mode jour' : 'Mode nuit'}
      className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full text-primary transition-colors hover:bg-primary/8 sm:h-10 sm:w-10"
    >
      <motion.span
        key={nuit ? 'lune' : 'soleil'}
        initial={{ rotate: -120, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="grid place-items-center"
      >
        {nuit ? (
          <Moon className="h-4.5 w-4.5 text-accent" />
        ) : (
          <Sun className="h-4.5 w-4.5 text-gold" />
        )}
      </motion.span>
    </motion.button>
  )
}

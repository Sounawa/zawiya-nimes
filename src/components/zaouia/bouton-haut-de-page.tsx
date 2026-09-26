'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

/* ═══════════════════════════════════════════════════════════════════
   Retour en haut — discret, apparaît après avoir défilé (8 sections
   à parcourir). Coin inférieur GAUCHE pour ne pas gêner le FAB Réunion.
   ═══════════════════════════════════════════════════════════════════ */
export function BoutonHautDePage() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const basculer = () => setVisible(window.scrollY > 600)
    basculer()
    window.addEventListener('scroll', basculer, { passive: true })
    return () => window.removeEventListener('scroll', basculer)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Revenir en haut de page"
          className="fixed bottom-5 left-4 z-30 grid h-11 w-11 place-items-center rounded-full border border-gold/40 bg-card/90 text-primary shadow-lg shadow-primary/15 backdrop-blur transition-all hover:border-gold/70 hover:shadow-xl active:scale-90"
        >
          <ArrowUp className="h-4.5 w-4.5" aria-hidden />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

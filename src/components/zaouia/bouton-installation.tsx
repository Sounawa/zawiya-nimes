'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Smartphone, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useInstallation, type InviteInstallation } from '@/lib/installation'

/* ═══════════════════════════════════════════════════════════════════
   Invitation discrète à installer l'application (PWA).
   N'apparaît que si le navigateur propose l'installation —
   jamais sur iOS/Safari, qui gère cela via le menu Partager.

   L'invitation captée est gardée dans le store partagé : si le
   frère ferme le bandeau (✕ ou délai), il pourra toujours installer
   depuis les Réglages — « je change d'avis → paramètres ».
   ═══════════════════════════════════════════════════════════════════ */

const CLE_REFUS = 'zawiya-install-refusee'

export function BoutonInstallation() {
  const invite = useInstallation((s) => s.invite)
  const capturer = useInstallation((s) => s.capturer)
  const oublier = useInstallation((s) => s.oublier)
  const [visible, setVisible] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    /* Discrétion : si l'invitation est ignorée, elle se retire
       d'elle-même (pas de voile permanent sur le contenu). */
    let minuterie: ReturnType<typeof setTimeout> | null = null

    const capter = (e: Event) => {
      e.preventDefault()
      /* L'invitation est mémorisée POUR TOUTE L'APPLICATION :
         ce bandeau, mais aussi les Réglages si le frère referme. */
      capturer(e as InviteInstallation)
      /* Bandeau déjà refusé une fois : ne pas re-proposer ici —
         il reste disponible dans les Réglages. */
      if (localStorage.getItem(CLE_REFUS) === '1') return
      /* Petite pause avant l'apparition — ne pas surprendre */
      setTimeout(() => {
        setVisible(true)
        minuterie = setTimeout(() => setVisible(false), 20000)
      }, 2500)
    }
    const installee = () => {
      setVisible(false)
      oublier()
      toast({
        title: 'Application installée ✦',
        description: 'La zawiya vit désormais sur ton écran d’accueil.',
      })
    }
    window.addEventListener('beforeinstallprompt', capter)
    window.addEventListener('appinstalled', installee)
    return () => {
      window.removeEventListener('beforeinstallprompt', capter)
      window.removeEventListener('appinstalled', installee)
      if (minuterie) clearTimeout(minuterie)
    }
  }, [toast, capturer, oublier])

  if (!invite || !visible) return null

  const installer = async () => {
    try {
      await invite.prompt()
      const { outcome } = await invite.userChoice
      if (outcome === 'accepted') {
        setVisible(false)
      } else {
        refuser()
      }
      /* L'invitation est consommée (usage unique) — les Réglages
         retomberont sur les instructions du navigateur. */
      oublier()
    } catch {
      refuser()
    }
  }

  const refuser = () => {
    localStorage.setItem(CLE_REFUS, '1')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          /* Au-dessus du bouton retour en haut (même coin gauche) */
          className="fixed bottom-20 left-4 z-40 max-w-[85vw] sm:bottom-22 sm:left-6"
        >
          <div className="relative flex items-center gap-3 rounded-2xl border border-gold/40 bg-card/95 py-2.5 pl-4 pr-10 shadow-lg shadow-primary/10 backdrop-blur">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-emerald-deep text-white shadow-md shadow-primary/20">
              <Smartphone className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold leading-tight text-encre">
                Installer la zawiya
              </p>
              <p className="text-[11px] leading-tight text-brouillard">
                Sur ton écran d&rsquo;accueil, comme une vraie app
              </p>
            </div>
            <button
              onClick={installer}
              className="ml-1 shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
            >
              Installer
            </button>
            <button
              onClick={refuser}
              aria-label="Refuser l'installation"
              className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-brouillard transition-colors hover:bg-sand hover:text-secondary-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

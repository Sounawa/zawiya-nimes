'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarPlus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { usePrint, useUser } from '@/lib/store'
import { useMembers } from '@/lib/api'
import { WelcomeGate } from '@/components/zaouia/welcome-gate'
import { HeaderBar } from '@/components/zaouia/header-bar'
import { Annonces } from '@/components/zaouia/annonces'
import { IjtimaSection } from '@/components/zaouia/ijtima-section'
import { NewMeetingDialog } from '@/components/zaouia/new-meeting-dialog'
import { ContentSections } from '@/components/zaouia/content-sections'
import { CotisationSection } from '@/components/zaouia/cotisation-section'
import { ZiyaraSection } from '@/components/zaouia/ziyara-section'
import { SondagesSection } from '@/components/zaouia/sondages-section'
import { AnnuaireSection } from '@/components/zaouia/annuaire-section'
import { SettingsDialog, ProfileDialog } from '@/components/zaouia/settings-dialog'
import { ZoneImpression } from '@/components/zaouia/print-sheet'

export default function Page() {
  const name = useUser((s) => s.name)
  const memberId = useUser((s) => s.memberId)
  const setMember = useUser((s) => s.setMember)
  const cibleImpression = usePrint((s) => s.cible)
  const { data: membres } = useMembers()
  const qc = useQueryClient()

  const [reglagesOuverts, setReglagesOuverts] = useState(false)
  const [profilOuvert, setProfilOuvert] = useState(false)
  const [nouvelleReunion, setNouvelleReunion] = useState(false)

  /* Résoudre le prénom → membre (id + rôle) */
  useEffect(() => {
    if (name && membres) {
      const m = membres.find((x) => x.name === name)
      if (m && m.id !== memberId) {
        setMember(m.id, m.role)
      } else if (!m) {
        // Le prénom n'existe pas encore : le créer
        fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((created) => {
            if (created) {
              setMember(created.id, created.role)
              qc.invalidateQueries({ queryKey: ['members'] })
            }
          })
          .catch(() => {})
      }
    }
  }, [name, membres, memberId, setMember, qc])

  /* Écran d'entrée tant que le prénom n'est pas posé */
  if (!name) {
    return (
      <AnimatePresence mode="wait">
        <WelcomeGate key="gate" />
      </AnimatePresence>
    )
  }

  return (
    <>
    {/* L'app ne disparaît à l'impression que si une feuille précise est demandée */}
    <div
      className={cn(
        'flex min-h-screen flex-col bg-[#fbf9f4]',
        cibleImpression && 'print:hidden'
      )}
    >
      <HeaderBar
        onOpenSettings={() => setReglagesOuverts(true)}
        onOpenProfile={() => setProfilOuvert(true)}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 pb-40 pt-5">
        <Annonces />
        <IjtimaSection />
        <CotisationSection />
        <ZiyaraSection />
        <SondagesSection />
        <AnnuaireSection />
        <ContentSections />
      </main>

      {/* ─── Pied de page ─── */}
      <footer className="mt-auto border-t border-[#0b5d42]/10 bg-white/70 backdrop-blur safe-bottom">
        <div className="mx-auto max-w-3xl px-4 py-4 text-center">
          <div className="bandeau-orne mx-auto mb-3 w-24" aria-hidden />
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#b6b1a0]">
            Zawiya Nimes — {new Date().getFullYear()}
          </p>
          <p className="mt-1.5 text-[10px] text-[#c9a24b]/80" aria-hidden>
            ✦
          </p>
        </div>
      </footer>

      {/* ─── Bouton flottant ＋ Réunion ─── */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Anneau pulsé */}
        <motion.span
          aria-hidden
          className="fab-ring absolute inset-0 rounded-full"
          animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
        />
        <motion.button
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.4 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setNouvelleReunion(true)}
          aria-label="Nouvelle réunion"
          className="relative flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-br from-[#0b5d42] to-[#0b3d2e] pl-5 pr-6 text-white shadow-xl shadow-[#0b5d42]/35 max-sm:h-13 max-sm:w-13 max-sm:justify-center max-sm:pl-0 max-sm:pr-0"
        >
          <CalendarPlus className="h-5 w-5 max-sm:h-6 max-sm:w-6" />
          <span className="text-sm font-semibold tracking-wide max-sm:hidden">Réunion</span>
        </motion.button>
      </div>

      {/* ─── Dialogues ─── */}
      <NewMeetingDialog open={nouvelleReunion} onOpenChange={setNouvelleReunion} />
      <SettingsDialog open={reglagesOuverts} onOpenChange={setReglagesOuverts} />
      <ProfileDialog open={profilOuvert} onOpenChange={setProfilOuvert} />

      {/* Voile d'entrée — transition douce après le splash */}
      <AnimatePresence>{!memberId && null}</AnimatePresence>
    </div>

    {/* ─── Zone d'impression — seule visible à l'impression ─── */}
    <ZoneImpression />
    </>
  )
}

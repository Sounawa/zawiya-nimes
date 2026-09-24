'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarPlus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/lib/store'
import { useMembers, usePrayerTimes } from '@/lib/api'
import { WelcomeGate } from '@/components/zaouia/welcome-gate'
import { HeaderBar } from '@/components/zaouia/header-bar'
import { Annonces } from '@/components/zaouia/annonces'
import { IjtimaSection } from '@/components/zaouia/ijtima-section'
import { NewMeetingDialog } from '@/components/zaouia/new-meeting-dialog'
import { SalatSection } from '@/components/zaouia/salat-section'
import { ContentSections } from '@/components/zaouia/content-sections'
import { CotisationSection } from '@/components/zaouia/cotisation-section'
import { ZiyaraSection } from '@/components/zaouia/ziyara-section'
import { SondagesSection } from '@/components/zaouia/sondages-section'
import { SettingsDialog, ProfileDialog } from '@/components/zaouia/settings-dialog'

export default function Page() {
  const name = useUser((s) => s.name)
  const memberId = useUser((s) => s.memberId)
  const setMember = useUser((s) => s.setMember)
  const { data: timings } = usePrayerTimes('jour')
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
    <div className="flex min-h-screen flex-col bg-[#fbf9f4]">
      <HeaderBar
        timings={timings?.timings}
        onOpenSettings={() => setReglagesOuverts(true)}
        onOpenProfile={() => setProfilOuvert(true)}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 pb-32 pt-5">
        <Annonces />
        <IjtimaSection />
        <SalatSection />
        <CotisationSection />
        <ZiyaraSection />
        <SondagesSection />
        <ContentSections />
      </main>

      {/* ─── Pied de page ─── */}
      <footer className="mt-auto border-t border-[#0b5d42]/10 bg-white/70 backdrop-blur safe-bottom">
        <p className="mx-auto max-w-3xl px-4 py-4 text-center text-[10px] font-medium uppercase tracking-[0.3em] text-[#b6b1a0]">
          Zaouia St Denis — {new Date().getFullYear()}
        </p>
      </footer>

      {/* ─── Bouton flottant ＋ Réunion ─── */}
      <motion.button
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.4 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setNouvelleReunion(true)}
        aria-label="Nouvelle réunion"
        className="fixed bottom-6 right-6 z-40 flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-br from-[#0b5d42] to-[#0b3d2e] pl-5 pr-6 text-white shadow-xl shadow-[#0b5d42]/35"
      >
        <CalendarPlus className="h-5 w-5" />
        <span className="text-sm font-semibold tracking-wide">Réunion</span>
      </motion.button>

      {/* ─── Dialogues ─── */}
      <NewMeetingDialog open={nouvelleReunion} onOpenChange={setNouvelleReunion} />
      <SettingsDialog open={reglagesOuverts} onOpenChange={setReglagesOuverts} />
      <ProfileDialog open={profilOuvert} onOpenChange={setProfilOuvert} />

      {/* Voile d'entrée — transition douce après le splash */}
      <AnimatePresence>{!memberId && null}</AnimatePresence>
    </div>
  )
}

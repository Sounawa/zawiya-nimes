'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarPlus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { usePrint, useUser } from '@/lib/store'
import { useMembers } from '@/lib/api'
import { peut } from '@/lib/permissions'
import { SECTION_TRESORERIE } from '@/lib/config'
import { WelcomeGate } from '@/components/zaouia/welcome-gate'
import { HeaderBar } from '@/components/zaouia/header-bar'
import { Annonces } from '@/components/zaouia/annonces'
import { IjtimaSection } from '@/components/zaouia/ijtima-section'
import { NewMeetingDialog } from '@/components/zaouia/new-meeting-dialog'
import { AdhkarSection, SamaSection } from '@/components/zaouia/adhkar-section'
import { CotisationSection } from '@/components/zaouia/cotisation-section'
import { ZiyaraSection } from '@/components/zaouia/ziyara-section'
import { SettingsDialog, ProfileDialog } from '@/components/zaouia/settings-dialog'
import { ZoneImpression } from '@/components/zaouia/print-sheet'
import { VeilleCommunaute } from '@/components/zaouia/veille-communaute'
import { BandeauProchainIjtima } from '@/components/zaouia/bandeau-prochain-ijtima'
import { BoutonHautDePage } from '@/components/zaouia/bouton-haut-de-page'
import { BoutonInstallation } from '@/components/zaouia/bouton-installation'
import { EnregistrementSW } from '@/components/zaouia/enregistrement-sw'
import { useToast } from '@/hooks/use-toast'
import { VILLE_LABEL } from '@/lib/types'

export default function Page() {
  const name = useUser((s) => s.name)
  const ville = useUser((s) => s.ville)
  const memberId = useUser((s) => s.memberId)
  const role = useUser((s) => s.role)
  const perms = useUser((s) => s.perms)
  const setMember = useUser((s) => s.setMember)
  const logout = useUser((s) => s.logout)
  const cibleImpression = usePrint((s) => s.cible)
  const { data: membres } = useMembers()
  const qc = useQueryClient()
  const { toast } = useToast()

  /* Les droits du frère connecté — groupe (ville) + rôle + surcharges */
  const voirCotisations = peut(ville, role, 'cotisations.voir', perms)
  const redigerReunions = peut(ville, role, 'reunions.rediger', perms)

  const [reglagesOuverts, setReglagesOuverts] = useState(false)
  const [profilOuvert, setProfilOuvert] = useState(false)
  const [nouvelleReunion, setNouvelleReunion] = useState(false)

  /* Résoudre le prénom + la zawiya → membre (id, rôle, droits).
     L'inscription se fait à la porte d'entrée (avec code et validation) :
     ici, on ne crée plus rien — on synchronise, et on sors celui dont
     l'accès a été révoqué ou retiré depuis. */
  useEffect(() => {
    if (!name || !membres) return
    const m = membres.find((x) => x.name === name && x.city === ville)
    if (!m) {
      /* Le frère n'existe plus dans cette zawiya (retiré par le référent) */
      logout()
      toast({
        title: 'Accès fermé',
        description: `Sidi ${name} n'est plus inscrit à la zawiya de ${VILLE_LABEL[ville] ?? ''}.`,
        variant: 'destructive',
      })
      return
    }
    if (m.status === 'BLOCKED' || m.status === 'PENDING') {
      logout()
      toast({
        title: m.status === 'BLOCKED' ? 'Accès révoqué' : 'Inscription en attente',
        description:
          m.status === 'BLOCKED'
            ? 'Le référent a suspendu cet accès — contacte-le pour le rouvrir.'
            : 'Le référent doit d’abord valider ton inscription.',
        variant: 'destructive',
      })
      return
    }
    if (m.id !== memberId || m.role !== role || m.perms !== perms) {
      setMember(m.id, m.role, m.city, m.perms)
    }
  }, [name, ville, membres, memberId, role, perms, setMember, logout, toast])

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
        'flex min-h-screen flex-col bg-background',
        cibleImpression && 'print:hidden'
      )}
    >
      <HeaderBar
        onOpenSettings={() => setReglagesOuverts(true)}
        onOpenProfile={() => setProfilOuvert(true)}
      />

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-9 px-4 pb-40 pt-6">
        <BandeauProchainIjtima />
        <Annonces />
        <IjtimaSection />
        {/* La trésorerie (cotisations + ziyara) — masquée pour le moment.
            Réactivable d'un drapeau, déjà branchée sur le trésorier. */}
        {SECTION_TRESORERIE && voirCotisations && (
          <>
            <CotisationSection />
            <ZiyaraSection />
          </>
        )}
        <AdhkarSection />
        <SamaSection />
      </main>

      {/* ─── Pied de page ─── */}
      <footer className="mt-auto border-t border-primary/10 bg-card/70 backdrop-blur safe-bottom">
        <div className="mx-auto max-w-3xl px-4 py-4 text-center">
          <div className="bandeau-orne mx-auto mb-3 w-24" aria-hidden />
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-brouillard-clair">
            Zawiya Nimes — {new Date().getFullYear()}
          </p>
          <p className="mt-1.5 text-[10px] text-accent/80" aria-hidden>
            ✦
          </p>
        </div>
      </footer>

      {/* ─── Bouton flottant ＋ Réunion — la rédaction est réservée à Nîmes ─── */}
      {redigerReunions && (
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
            className="relative flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-br from-primary to-emerald-deep pl-5 pr-6 text-white shadow-xl shadow-primary/35 max-sm:h-13 max-sm:w-13 max-sm:justify-center max-sm:pl-0 max-sm:pr-0"
          >
            <CalendarPlus className="h-5 w-5 max-sm:h-6 max-sm:w-6" />
            <span className="text-sm font-semibold tracking-wide max-sm:hidden">Réunion</span>
          </motion.button>
        </div>
      )}

      {/* ─── Dialogues ─── */}
      <NewMeetingDialog open={nouvelleReunion} onOpenChange={setNouvelleReunion} />
      <SettingsDialog open={reglagesOuverts} onOpenChange={setReglagesOuverts} />
      <ProfileDialog open={profilOuvert} onOpenChange={setProfilOuvert} />

      {/* Veille — notifications des nouvelles annonces & réunions */}
      <VeilleCommunaute />

      {/* Retour en haut — apparaît après défilement */}
      <BoutonHautDePage />

      {/* Invitation à installer l'application (PWA) — si proposée */}
      <BoutonInstallation />

      {/* Service worker — coquille hors-ligne */}
      <EnregistrementSW />

      {/* Voile d'entrée — transition douce après le splash */}
      <AnimatePresence>{!memberId && null}</AnimatePresence>
    </div>

    {/* ─── Zone d'impression — seule visible à l'impression ─── */}
    <ZoneImpression />
    </>
  )
}

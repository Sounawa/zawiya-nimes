'use client'

import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BellPlus } from 'lucide-react'
import { api, creationsLocales } from '@/lib/api'
import { useUser } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { demanderPermissionNotifications, notifierNavigateur } from '@/lib/notifications'
import type { Announcement, Poll } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════════════
   Veille de la zawiya — prévient en douceur quand une ANNONCE ou un
   SONDAGE est publié (pour prévenir d'un ijtimâ'). Rien d'autre :
   ni les votes, ni les réunions, ni les présences ne notifient.
   Interrogation toutes les 60 s ; la première réponse sert de référence
   (aucune notification au chargement).

   Onglet visible → toast élégant dans l'app.
   Onglet en fond + permission accordée → notification système.
   ═══════════════════════════════════════════════════════════════════ */
export function VeilleCommunaute() {
  const memberId = useUser((s) => s.memberId)
  const notifAsked = useUser((s) => s.notifAsked)
  const setNotifAsked = useUser((s) => s.setNotifAsked)
  const { toast } = useToast()

  const connues = useRef<{ annonces: Set<string>; sondages: Set<string> } | null>(null)

  const { data: annonces } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api<Announcement[]>('/api/announcements'),
    refetchInterval: 60_000,
    /* Continuer même en arrière-plan : c'est tout l'intérêt des
       notifications système quand l'onglet est réduit. */
    refetchIntervalInBackground: true,
    enabled: !!memberId,
  })
  const { data: sondages } = useQuery({
    queryKey: ['polls'],
    queryFn: () => api<Poll[]>('/api/polls'),
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    enabled: !!memberId,
  })

  /* ─── Proposer une fois les notifications système (geste utilisateur requis) ─── */
  useEffect(() => {
    if (!memberId || notifAsked) return
    if (typeof Notification === 'undefined') return

    if (Notification.permission === 'granted' || Notification.permission === 'denied') {
      /* Déjà tranché (autre onglet, autre fois) — ne plus demander */
      setNotifAsked(true)
      return
    }

    const minuteur = setTimeout(() => {
      toast({
        title: 'Rester informé des annonces ?',
        description:
          'Recevoir une notification, même la zawiya ouverte en fond.',
        duration: 12_000, /* le temps de lire et décider */
        /* Fermeture (✕, balayage ou délai écoulé) = choix de ne pas activer — ne plus reposer */
        onOpenChange: (ouvert) => {
          if (!ouvert) setNotifAsked(true)
        },
        action: (
          <button
            onClick={async () => {
              const resultat = await demanderPermissionNotifications()
              setNotifAsked(true)
              toast({
                title:
                  resultat === 'granted'
                    ? '🔔 Notifications activées'
                    : 'Notifications non activées',
                description:
                  resultat === 'granted'
                    ? "Tu seras prévenu des nouvelles annonces et sondages de la zawiya."
                    : 'Pas de souci — les toasts dans l’app restent actifs.',
              })
            }}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm transition-all hover:bg-emerald-deep active:scale-95"
          >
            <BellPlus className="h-3.5 w-3.5" aria-hidden /> Activer
          </button>
        ),
      })
    }, 2500)

    return () => clearTimeout(minuteur)
  }, [memberId, notifAsked, setNotifAsked, toast])

  useEffect(() => {
    if (!annonces || !sondages) return

    /* Premier chargement : mémoriser l'état actuel, ne rien signaler */
    if (!connues.current) {
      connues.current = {
        annonces: new Set(annonces.map((a) => a.id)),
        sondages: new Set(sondages.map((p) => p.id)),
      }
      return
    }

    const enFond = typeof document !== 'undefined' && document.hidden

    /* Nouvelles annonces — toast corail avec extrait du message.
       Celles créées dans cet onglet sont ignorées (toast de succès déjà émis). */
    const nouvellesAnnonces = annonces.filter(
      (a) => !connues.current!.annonces.has(a.id) && !creationsLocales.annonces.has(a.id)
    )
    for (const a of nouvellesAnnonces.slice(0, 3)) {
      const titre = a.title ? `📣 ${a.title}` : '📣 Nouvelle annonce'
      const extrait = a.text
        ? a.text.length > 90
          ? `${a.text.slice(0, 90)}…`
          : a.text
        : a.title || 'Ouvre la zawiya pour la lire'
      if (enFond && notifierNavigateur(titre, extrait)) continue
      toast({ title: titre, description: extrait })
    }

    /* Nouveaux sondages — toast doré (celui de cet onglet est ignoré) */
    const nouveauxSondages = sondages.filter(
      (p) => !connues.current!.sondages.has(p.id) && !creationsLocales.sondages.has(p.id)
    )
    for (const p of nouveauxSondages.slice(0, 3)) {
      const question =
        p.question.length > 90 ? `${p.question.slice(0, 90)}…` : p.question
      const titre = '🗳️ Nouveau sondage'
      if (enFond && notifierNavigateur(titre, question)) continue
      toast({ title: titre, description: question })
    }

    /* Mettre à jour la référence */
    connues.current = {
      annonces: new Set(annonces.map((a) => a.id)),
      sondages: new Set(sondages.map((p) => p.id)),
    }
  }, [annonces, sondages, toast])

  return null
}

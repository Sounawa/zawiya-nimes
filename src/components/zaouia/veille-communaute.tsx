'use client'

import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BellPlus } from 'lucide-react'
import { api, creationsLocales } from '@/lib/api'
import { useUser } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { demanderPermissionNotifications, notifierNavigateur } from '@/lib/notifications'
import type { Announcement, Meeting } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════════════
   Veille de la communauté — prévient en douceur quand une nouvelle
   annonce ou un nouvel ijtimâ' est publié pendant qu'on est dans l'app.
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

  const connues = useRef<{ annonces: Set<string>; reunions: Set<string> } | null>(null)

  const { data: annonces } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api<Announcement[]>('/api/announcements'),
    refetchInterval: 60_000,
    /* Continuer même en arrière-plan : c'est tout l'intérêt des
       notifications système quand l'onglet est réduit. */
    refetchIntervalInBackground: true,
    enabled: !!memberId,
  })
  const { data: reunions } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => api<Meeting[]>('/api/meetings'),
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
                    ? "Tu seras prévenu des nouvelles annonces et ijtimâ'."
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
    if (!annonces || !reunions) return

    /* Premier chargement : mémoriser l'état actuel, ne rien signaler */
    if (!connues.current) {
      connues.current = {
        annonces: new Set(annonces.map((a) => a.id)),
        reunions: new Set(reunions.map((m) => m.id)),
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
      const corps = a.text.length > 90 ? `${a.text.slice(0, 90)}…` : a.text
      if (enFond && notifierNavigateur(titre, corps)) continue
      toast({ title: titre, description: corps })
    }

    /* Nouvelles réunions — toast vert (hors créations locales) */
    const nouvellesReunions = reunions.filter(
      (m) => !connues.current!.reunions.has(m.id) && !creationsLocales.reunions.has(m.id)
    )
    if (nouvellesReunions.length > 0) {
      const m = nouvellesReunions[0]
      const titre = "🕌 Nouvel ijtimâ' programmé"
      const corps =
        nouvellesReunions.length === 1
          ? `${m.title} — ${new Date(m.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}${m.startTime ? ` · ${m.startTime}` : ''}`
          : `${nouvellesReunions.length} nouvelles réunions au calendrier`
      if (!(enFond && notifierNavigateur(titre, corps))) {
        toast({ title: titre, description: corps })
      }
    }

    /* Mettre à jour la référence */
    connues.current = {
      annonces: new Set(annonces.map((a) => a.id)),
      reunions: new Set(reunions.map((m) => m.id)),
    }
  }, [annonces, reunions, toast])

  return null
}

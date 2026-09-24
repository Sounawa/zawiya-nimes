'use client'

import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, creationsLocales } from '@/lib/api'
import { useUser } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import type { Announcement, Meeting } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════════════
   Veille de la communauté — prévient en douceur quand une nouvelle
   annonce ou un nouvel ijtimâ' est publié pendant qu'on est dans l'app.
   Interrogation toutes les 60 s ; la première réponse sert de référence
   (aucune notification au chargement).
   ═══════════════════════════════════════════════════════════════════ */
export function VeilleCommunaute() {
  const memberId = useUser((s) => s.memberId)
  const { toast } = useToast()

  const connues = useRef<{ annonces: Set<string>; reunions: Set<string> } | null>(null)

  const { data: annonces } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api<Announcement[]>('/api/announcements'),
    refetchInterval: 60_000,
    enabled: !!memberId,
  })
  const { data: reunions } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => api<Meeting[]>('/api/meetings'),
    refetchInterval: 60_000,
    enabled: !!memberId,
  })

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

    /* Nouvelles annonces — toast corail avec extrait du message.
       Celles créées dans cet onglet sont ignorées (toast de succès déjà émis). */
    const nouvellesAnnonces = annonces.filter(
      (a) => !connues.current!.annonces.has(a.id) && !creationsLocales.annonces.has(a.id)
    )
    for (const a of nouvellesAnnonces.slice(0, 3)) {
      toast({
        title: a.title ? `📣 ${a.title}` : '📣 Nouvelle annonce',
        description: a.text.length > 90 ? `${a.text.slice(0, 90)}…` : a.text,
      })
    }

    /* Nouvelles réunions — toast vert (hors créations locales) */
    const nouvellesReunions = reunions.filter(
      (m) => !connues.current!.reunions.has(m.id) && !creationsLocales.reunions.has(m.id)
    )
    if (nouvellesReunions.length > 0) {
      const m = nouvellesReunions[0]
      toast({
        title: '🕌 Nouvel ijtimâ\' programmé',
        description:
          nouvellesReunions.length === 1
            ? `${m.title} — ${new Date(m.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}${m.startTime ? ` · ${m.startTime}` : ''}`
            : `${nouvellesReunions.length} nouvelles réunions au calendrier`,
      })
    }

    /* Mettre à jour la référence */
    connues.current = {
      annonces: new Set(annonces.map((a) => a.id)),
      reunions: new Set(reunions.map((m) => m.id)),
    }
  }, [annonces, reunions, toast])

  return null
}

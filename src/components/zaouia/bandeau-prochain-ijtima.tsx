'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, ChevronRight, EyeOff, MapPin, Pencil } from 'lucide-react'
import { useMeetings } from '@/lib/api'
import { useNav, useRappelBandeau, useUser } from '@/lib/store'
import { peut } from '@/lib/permissions'
import { useToast } from '@/hooks/use-toast'
import { NewMeetingDialog } from './new-meeting-dialog'
import type { Meeting } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════════════
   Bandeau « Prochain ijtimâ' » — rappel élégant sous l'en-tête :
   titre, date, lieu, décompte vivant. Cliquer ouvre la section.
   Crayon : modifier la réunion directement. Œil barré : masquer
   le rappel (réaffichable depuis la section Al-Ijtimâ').
   ═══════════════════════════════════════════════════════════════════ */

/** Fusionner la date ISO (minuit UTC) et l'heure « 19:30 » en Date locale */
function dateAvecHeure(iso: string, heure?: string | null): Date {
  const d = new Date(iso)
  if (!heure) return d
  const [h, m] = heure.split(':').map(Number)
  if (Number.isNaN(h)) return d
  d.setHours(h, m || 0, 0, 0)
  return d
}

/** « dans 2 j » · « demain » · « ce soir » · « dans 3 h » · « en cours » */
function libelleDecompte(debut: Date, maintenant: Date): string {
  const diff = debut.getTime() - maintenant.getTime()
  if (diff <= 0) return 'en cours'
  const heures = Math.floor(diff / 3_600_000)
  if (heures < 1) return `dans ${Math.max(1, Math.floor(diff / 60_000))} min`
  if (heures < 24) return `dans ${heures} h`
  const jours = Math.round(diff / 86_400_000)
  if (jours === 1) return 'demain'
  return `dans ${jours} j`
}

export function BandeauProchainIjtima() {
  const { data: meetings } = useMeetings()
  const ouvrir = useNav((s) => s.ouvrir)
  const masques = useRappelBandeau((s) => s.masques)
  const masquer = useRappelBandeau((s) => s.masquer)
  const ville = useUser((s) => s.ville)
  const role = useUser((s) => s.role)
  const perms = useUser((s) => s.perms)
  /* Le crayon du bandeau modifie la réunion — frères de Nîmes */
  const peutRediger = peut(ville, role, 'reunions.rediger', perms)
  const { toast } = useToast()

  /* Dialogue de modification de la réunion rappelée */
  const [editionOuverte, setEditionOuverte] = useState(false)
  const [aModifier, setAModifier] = useState<Meeting | null>(null)

  /* Décompte vivant — re-calculé chaque minute */
  const [maintenant, setMaintenant] = useState<number | null>(null)
  useEffect(() => {
    setMaintenant(Date.now())
    const id = setInterval(() => setMaintenant(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const prochaine = useMemo(() => {
    if (!meetings) return null
    const ref = maintenant ?? Date.now()
    const aVenir = meetings
      .map((m) => ({ m, debut: dateAvecHeure(m.date, m.startTime) }))
      .filter(({ debut }) => debut.getTime() + 3_600_000 > ref) // pas encore finie depuis 1 h
      .sort((a, b) => a.debut.getTime() - b.debut.getTime())
    return aVenir[0] ?? null
  }, [meetings, maintenant])

  /* Rien à annoncer tant que les données ne sont pas là */
  if (!maintenant || !prochaine) return null

  const { m, debut } = prochaine

  /* Le rappel de cette réunion a été masqué — il disparaît,
     réaffichable depuis la section Al-Ijtimâ' */
  if (masques.includes(m.id)) return null

  const aujourdhui = new Date(maintenant)
  aujourdhui.setHours(0, 0, 0, 0)
  const demain = new Date(aujourdhui)
  demain.setDate(demain.getDate() + 1)
  const estAujourdhui = debut >= aujourdhui && debut < demain
  const estDemain = debut >= demain && debut.getTime() < demain.getTime() + 86_400_000

  const jour =
    estAujourdhui
      ? "Aujourd'hui"
      : estDemain
        ? 'Demain'
        : debut.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const ouvrirEdition = () => {
    setAModifier(m)
    setEditionOuverte(true)
  }

  const masquerRappel = () => {
    masquer(m.id)
    toast({
      title: 'Rappel masqué',
      description: `Le rappel « ${m.title} » n'apparaît plus. Réaffichable dans la section Al-Ijtimâ'.`,
    })
  }

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      role="region"
      aria-label={`Rappel — prochaine réunion ${m.title}`}
      className="group relative mx-auto flex w-full max-w-3xl items-stretch gap-0 overflow-hidden rounded-2xl border border-gold/35 bg-gradient-to-r from-feuille via-card to-or-pale shadow-sm transition-all hover:border-gold/60 hover:shadow-[0_8px_24px_-10px_rgba(184,146,58,0.35)]"
    >
      {/* Filigrane ornemental */}
      <span aria-hidden className="pointer-events-none absolute -right-2 -top-4 select-none font-display text-5xl text-accent/10">
        ✦
      </span>

      {/* Zone principale cliquable — ouvre la section */}
      <button
        onClick={() => ouvrir('ijtima')}
        aria-label={`Ouvrir la section Al-Ijtimâ' — prochaine réunion ${m.title}`}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-transform active:scale-[0.99]"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-emerald-deep text-white shadow-md shadow-primary/25">
          <CalendarDays className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-vif">
            Prochain ijtimâ'
            {estAujourdhui && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
              </span>
            )}
          </span>
          <span className="mt-0.5 flex items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-encre">
            <span className="truncate">
              {m.icon ? `${m.icon} ` : ''}{m.title}
            </span>
            {m.city && (
              <span className="hidden items-center gap-0.5 text-xs font-medium text-brouillard sm:inline-flex">
                <MapPin className="h-3 w-3" aria-hidden /> {m.city}
              </span>
            )}
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="text-xs font-bold capitalize text-primary">
            {jour}
            {m.startTime ? ` · ${m.startTime}` : ''}
          </span>
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-vif">
            {libelleDecompte(debut, new Date(maintenant))}
          </span>
        </span>

        <ChevronRight
          className="h-4 w-4 shrink-0 text-gold transition-transform group-hover:translate-x-1"
          aria-hidden
        />
      </button>

      {/* Actions — modifier & masquer le rappel */}
      <div className="flex shrink-0 flex-col justify-center gap-0.5 border-l border-gold/15 py-1 pl-0.5 pr-1.5">
        {peutRediger && (
          <button
            onClick={ouvrirEdition}
            aria-label={`Modifier le rappel — ${m.title}`}
            title="Modifier ce rappel"
            className="rounded-lg p-2 text-brouillard transition-colors hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={masquerRappel}
          aria-label={`Masquer le rappel — ${m.title}`}
          title="Masquer ce rappel"
          className="rounded-lg p-2 text-brouillard transition-colors hover:bg-accent/15 hover:text-gold-vif focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <EyeOff className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>

    {/* Modification de la réunion rappelée — pré-remplie */}
    <NewMeetingDialog
      open={editionOuverte}
      onOpenChange={(v) => {
        setEditionOuverte(v)
        if (!v) setAModifier(null)
      }}
      meeting={aModifier}
    />
    </>
  )
}

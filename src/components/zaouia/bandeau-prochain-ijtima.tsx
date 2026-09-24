'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, ChevronRight, MapPin } from 'lucide-react'
import { useMeetings } from '@/lib/api'
import { useNav } from '@/lib/store'

/* ═══════════════════════════════════════════════════════════════════
   Bandeau « Prochain ijtimâ' » —Slim rappel élégant sous le bandeau :
   titre, date, lieu, décompte vivant. Cliquer ouvre la section.
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

  return (
    <motion.button
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      onClick={() => ouvrir('ijtima')}
      aria-label={`Ouvrir la section Al-Ijtimâ' — prochaine réunion ${m.title}`}
      className="group relative mx-auto flex w-full max-w-3xl items-center gap-3 overflow-hidden rounded-2xl border border-gold/35 bg-gradient-to-r from-feuille via-card to-or-pale px-4 py-3 text-left shadow-sm transition-all hover:border-gold/60 hover:shadow-[0_8px_24px_-10px_rgba(184,146,58,0.35)] active:scale-[0.99]"
    >
      {/* Filigrane ornemental */}
      <span aria-hidden className="pointer-events-none absolute -right-2 -top-4 select-none font-display text-5xl text-accent/10">
        ✦
      </span>

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
    </motion.button>
  )
}

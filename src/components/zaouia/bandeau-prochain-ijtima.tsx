'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, CalendarPlus, ChevronRight, MapPin, Pencil, EyeOff } from 'lucide-react'
import { useMeetings, useSettings } from '@/lib/api'
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

   TOUJOURS UTILE : sans réunion programmée, le bandeau ne disparaît
   pas — il montre le prochain jour d'ijtimâ' des réglages (ex.
   « samedi · 19:30 ») avec sa date calculée. Les frères qui peuvent
   programmer voient un bouton « + » qui ouvre le dialogue de
   création pré-rempli. La zawiya sait toujours quand elle se
   retrouve.
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

/* Les jours configurés portent des labels complets (« Samedi ») */
const NUM_JOUR: Record<string, number> = {
  Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6, Dimanche: 0,
}

/** Le prochain jour d'ijtimâ' actif des réglages, avec son heure —
    base du bandeau quand aucune réunion n'est encore programmée. */
function prochainJourConfigure(jours: { label: string; actif: boolean; heure: string }[]): { label: string; heure: string; d: Date } | null {
  const candidats = jours
    .filter((j) => j.actif && NUM_JOUR[j.label] !== undefined)
    .map((j) => {
      const d = new Date()
      const diff = (NUM_JOUR[j.label] - d.getDay() + 7) % 7 || 7
      d.setDate(d.getDate() + diff)
      const [h, m] = (j.heure || '19:30').split(':').map(Number)
      if (!Number.isNaN(h)) d.setHours(h, m || 0, 0, 0)
      return { label: j.label, heure: j.heure || '19:30', d }
    })
    .sort((a, b) => a.d.getTime() - b.d.getTime())
  return candidats[0] ?? null
}

export function BandeauProchainIjtima() {
  const { data: meetings } = useMeetings()
  const { data: settings } = useSettings()
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

  /* Sans réunion programmée : le prochain jour configuré prend le
     relais — le bandeau reste utile au lieu de disparaître. */
  const prevu = useMemo(
    () => (prochaine ? null : prochainJourConfigure(settings?.ijtima_days?.jours ?? [])),
    [prochaine, settings]
  )

  /* Les données ne sont pas encore là — patience, pas de vide */
  if (!maintenant) return null
  if (!prochaine && !settings) return null

  /* ─── Mode 1 : une réunion est programmée — le rappel habituel ─── */
  if (prochaine) {
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
        className="group relative mx-auto flex w-full max-w-3xl items-stretch gap-0 overflow-hidden rounded-2xl border border-gold/35 bg-gradient-to-r from-feuille via-card to-or-pale shadow-sm transition-all hover:border-gold/60 hover:shadow-[0_8px_24px_-10px_rgba(184,146,58,0.35)] [@media(orientation:landscape)_and_(max-height:540px)]:hidden"
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

  /* ─── Mode 2 : rien de programmé — le jour régulier prend le
     relais. Le bandeau reste : la zawiya sait quand elle se
     retrouve, même avant que la réunion soit créée. ─── */
  if (!prevu) return null
  const debut = prevu.d

  const aujourdhui = new Date(maintenant)
  aujourdhui.setHours(0, 0, 0, 0)
  const demain = new Date(aujourdhui)
  demain.setDate(demain.getDate() + 1)
  const estDemain = debut >= demain && debut.getTime() < demain.getTime() + 86_400_000

  const jour =
    estDemain
      ? 'Demain'
      : debut.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const lieu = settings?.app_config?.ville || 'Nîmes'

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      role="region"
      aria-label={`Prochain ijtimâ' — ${prevu.label.toLowerCase()} ${jour}, à programmer`}
      className="group relative mx-auto flex w-full max-w-3xl items-stretch gap-0 overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-r from-feuille via-card to-feuille shadow-sm transition-all hover:border-primary/45 hover:shadow-[0_8px_24px_-10px_rgba(11,93,66,0.28)] [@media(orientation:landscape)_and_(max-height:540px)]:hidden"
    >
      <span aria-hidden className="pointer-events-none absolute -right-2 -top-4 select-none font-display text-5xl text-primary/8">
        ✦
      </span>

      {/* Le jour régulier — ouvre la section Al-Ijtimâ' */}
      <button
        onClick={() => ouvrir('ijtima')}
        aria-label={`Ouvrir la section Al-Ijtimâ' — ijtimâ' régulier du ${prevu.label.toLowerCase()}`}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-transform active:scale-[0.99]"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/85 to-emerald-deep/85 text-white shadow-md shadow-primary/20">
          <CalendarDays className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
            Prochain ijtimâ'
          </span>
          <span className="mt-0.5 flex items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-encre">
            <span className="truncate">
              Ijtimâ' du {prevu.label.toLowerCase()}
            </span>
            <span className="hidden items-center gap-0.5 text-xs font-medium text-brouillard sm:inline-flex">
              <MapPin className="h-3 w-3" aria-hidden /> {lieu}
            </span>
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="text-xs font-bold capitalize text-primary">
            {jour} · {prevu.heure}
          </span>
          <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary/80">
            à programmer
          </span>
        </span>

        <ChevronRight
          className="h-4 w-4 shrink-0 text-primary/60 transition-transform group-hover:translate-x-1"
          aria-hidden
        />
      </button>

      {/* Programmer la réunion — les frères qui le peuvent */}
      {peutRediger && (
        <div className="flex shrink-0 items-center border-l border-primary/12 py-1 pl-0.5 pr-1.5">
          <button
            onClick={() => {
              setAModifier(null)
              setEditionOuverte(true)
            }}
            aria-label={`Programmer la réunion du ${prevu.label.toLowerCase()}`}
            title="Programmer cette réunion"
            className="rounded-lg p-2 text-brouillard transition-colors hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <CalendarPlus className="h-4 w-4" />
          </button>
        </div>
      )}
    </motion.div>

    {/* Création de la réunion — le dialogue se pré-remplit du jour
        configuré le plus proche (celui du bandeau) */}
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

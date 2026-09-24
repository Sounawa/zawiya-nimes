'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, Printer } from 'lucide-react'
import { useMeetings } from '@/lib/api'
import { usePrint } from '@/lib/store'
import { cn } from '@/lib/utils'
import { dateCourte } from '@/lib/format'
import type { Meeting } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════════════
   Mini-calendrier mensuel des ijtimâ' — vue d'ensemble du mois :
   jours de réunion soulignés d'un sceau vert, prochaine réunion
   cerclée d'or, détail du jour sélectionné juste dessous.
   ═══════════════════════════════════════════════════════════════════ */

const LETTRES_SEMAINE = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/* Clé jour → « 2026-09-24 » pour rapprocher réunions et cellules */
const cleJour = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const MOIS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

export function MiniCalendrier() {
  const { data: meetings } = useMeetings()
  const imprimer = usePrint((s) => s.imprimer)

  const aujourdhui = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  /* Réunions par jour — carte « 2026-09-24 » → [meeting…] */
  const parJour = useMemo(() => {
    const carte = new Map<string, Meeting[]>()
    for (const m of meetings ?? []) {
      const cle = cleJour(new Date(m.date))
      const liste = carte.get(cle) ?? []
      liste.push(m)
      carte.set(cle, liste)
    }
    return carte
  }, [meetings])

  /* La prochaine réunion à venir — sa journée porte un anneau doré */
  const idProchaine = useMemo(() => {
    const aVenir = (meetings ?? [])
      .filter((m) => new Date(m.date) >= aujourdhui)
      .sort((a, b) => a.date.localeCompare(b.date))
    return aVenir[0]?.id
  }, [meetings, aujourdhui])

  /* Mois initial : celui de la prochaine réunion, sinon le mois courant */
  const [curseur, setCurseur] = useState(() => {
    const base =
      (meetings ?? []).find((m) => new Date(m.date) >= aujourdhui) ??
      (meetings ?? []).slice(-1)[0] ??
      null
    const d = base ? new Date(base.date) : new Date()
    return { annee: d.getFullYear(), mois: d.getMonth() }
  })
  const [jourChoisi, setJourChoisi] = useState<string | null>(null)

  /* Grille du mois — lundi en tête, six semaines affichées */
  const cellules = useMemo(() => {
    const premier = new Date(curseur.annee, curseur.mois, 1)
    const decalage = (premier.getDay() + 6) % 7 // lundi = 0
    const total = decalage + new Date(curseur.annee, curseur.mois + 1, 0).getDate()
    return Array.from(
      { length: Math.ceil(total / 7) * 7 },
      (_, i) => new Date(curseur.annee, curseur.mois, i - decalage + 1)
    )
  }, [curseur])

  const moisCourant = curseur.annee === aujourdhui.getFullYear() && curseur.mois === aujourdhui.getMonth()
  const nbReunionsMois = (meetings ?? []).filter((m) => {
    const d = new Date(m.date)
    return d.getFullYear() === curseur.annee && d.getMonth() === curseur.mois
  }).length

  const naviguer = (delta: number) => {
    setJourChoisi(null)
    setCurseur(({ annee, mois }) => {
      const d = new Date(annee, mois + delta, 1)
      return { annee: d.getFullYear(), mois: d.getMonth() }
    })
  }

  const reunionsChoisies = jourChoisi ? (parJour.get(jourChoisi) ?? []) : []

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/12 bg-card p-4 shadow-sm">
      {/* Filigrane ✦ discret dans le coin */}
      <span aria-hidden className="pointer-events-none absolute -right-3 -top-5 select-none font-display text-7xl text-primary/[0.05]">
        ✦
      </span>

      {/* ─── En-tête : mois + navigation ─── */}
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 font-display text-lg font-semibold capitalize text-encre">
          <CalendarDays className="h-4 w-4 text-gold" aria-hidden />
          {MOIS_FR[curseur.mois]} <span className="text-brouillard">{curseur.annee}</span>
        </p>
        <div className="flex items-center gap-1">
          {!moisCourant && (
            <button
              onClick={() => {
                setJourChoisi(null)
                setCurseur({ annee: aujourdhui.getFullYear(), mois: aujourdhui.getMonth() })
              }}
              className="mr-1 rounded-full border border-gold/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-vif transition-all hover:bg-or-pale active:scale-95"
            >
              Aujourd&rsquo;hui
            </button>
          )}
          <button
            onClick={() => naviguer(-1)}
            aria-label="Mois précédent"
            className="grid h-8 w-8 place-items-center rounded-full border border-primary/15 text-brouillard transition-all hover:border-primary/40 hover:text-primary active:scale-95"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => naviguer(1)}
            aria-label="Mois suivant"
            className="grid h-8 w-8 place-items-center rounded-full border border-primary/15 text-brouillard transition-all hover:border-primary/40 hover:text-primary active:scale-95"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── Lettres de semaine ─── */}
      <div className="grid grid-cols-7 gap-1" aria-hidden>
        {LETTRES_SEMAINE.map((l, i) => (
          <p key={i} className="pb-1 text-center text-[10px] font-bold uppercase tracking-wider text-brouillard-clair">
            {l}
          </p>
        ))}
      </div>

      {/* ─── Jours ─── */}
      <div className="grid grid-cols-7 gap-1">
        {cellules.map((d) => {
          const cle = cleJour(d)
          const horsMois = d.getMonth() !== curseur.mois
          const estAujourdhui = cle === cleJour(aujourdhui)
          const reunions = parJour.get(cle) ?? []
          const estPasse = d < aujourdhui
          const estProchaine = reunions.some((m) => m.id === idProchaine)
          const choisi = jourChoisi === cle

          if (horsMois) return <span key={cle} aria-hidden className="aspect-square" />

          return (
            <button
              key={cle}
              onClick={() => reunions.length > 0 && setJourChoisi(choisi ? null : cle)}
              disabled={reunions.length === 0}
              aria-label={
                reunions.length
                  ? `${dateCourte(d)} — ${reunions.map((m) => m.title).join(', ')}`
                  : dateCourte(d)
              }
              aria-pressed={choisi}
              className={cn(
                'relative flex aspect-square select-none flex-col items-center justify-center rounded-lg text-[13px] font-medium tabular-nums transition-all',
                reunions.length === 0 && 'text-secondary-foreground/80',
                reunions.length > 0 &&
                  'cursor-pointer bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 dark:bg-primary/30 dark:text-[#9ed9ba] dark:hover:bg-primary/45',
                estPasse &&
                  reunions.length > 0 &&
                  'bg-sauge/15 text-sauge hover:bg-sauge/25 dark:bg-sauge/20 dark:text-sauge/75 dark:hover:bg-sauge/30',
                estAujourdhui && 'ring-1 ring-primary/60 ring-inset',
                estProchaine && 'ring-2 ring-gold/70 ring-inset',
                choisi && 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
              )}
            >
              {d.getDate()}
              {reunions.length > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    'mt-0.5 text-[9px] leading-none',
                    choisi && 'opacity-90'
                  )}
                >
                  {reunions[0].icon || '🕌'}
                </span>
              )}
              {reunions.length > 1 && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute right-1 top-1 grid h-3.5 w-3.5 place-items-center rounded-full text-[8px] font-bold leading-none',
                    choisi ? 'bg-gold text-white' : 'bg-gold/85 text-white'
                  )}
                >
                  {reunions.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ─── Légende + impression de l'assiduité ─── */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-primary/15 pt-3">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-brouillard">
          <span className="inline-block h-2.5 w-2.5 rounded-[4px] bg-primary/25" aria-hidden />
          {nbReunionsMois} ijtimâ&rsquo; ce mois-ci
        </p>
        <button
          onClick={() => imprimer({ kind: 'presences' })}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/10 hover:shadow-sm active:scale-95"
        >
          <Printer className="h-3 w-3" aria-hidden /> Assiduité des frères
        </button>
      </div>

      {/* ─── Détail du jour choisi ─── */}
      <AnimatePresence initial={false}>
        {reunionsChoisies.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-1.5 rounded-xl bg-feuille p-2">
              <p className="px-1 pb-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-vif">
                {jourChoisi === cleJour(aujourdhui) ? "Aujourd'hui" : dateCourte(reunionsChoisies[0].date)}
              </p>
              {reunionsChoisies.map((m) => {
                const d = new Date(m.date)
                const passee = d < aujourdhui
                const enCours = cleJour(d) === cleJour(aujourdhui) && m.startTime !== null
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-2.5 rounded-lg bg-card px-2.5 py-2 text-sm shadow-sm"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-emerald-deep text-white" aria-hidden>
                      {m.icon || '🕌'}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-encre">{m.title}</span>
                    {m.startTime && (
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-primary">
                        {m.startTime}
                      </span>
                    )}
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                        passee
                          ? 'bg-sand text-brouillard'
                          : enCours
                            ? 'bg-accent/20 text-gold-vif'
                            : 'bg-primary/10 text-primary'
                      )}
                    >
                      {passee ? 'passée' : enCours ? "aujourd'hui" : 'à venir'}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

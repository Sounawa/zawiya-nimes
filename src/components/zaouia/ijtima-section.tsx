'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Clock, Eye, MapPin, Pencil, Printer, Sparkles, Trash2, Users, UserPlus, CalendarPlus } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useNav, usePrint, useRappelBandeau, useUser } from '@/lib/store'
import { peut } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { JOURS_COURTS, parseProgram, type Meeting } from '@/lib/types'
import { cleSemaine, libelleSemaine } from '@/lib/format'
import { NewMeetingDialog } from './new-meeting-dialog'

/* ═══════════════ Carte d'une réunion ═══════════════ */

export function MeetingCard({ meeting, compact, prochaine }: { meeting: Meeting; compact?: boolean; prochaine?: boolean }) {
  const [ouvert, setOuvert] = useState(false)
  const [editionOuverte, setEditionOuverte] = useState(false)
  const memberId = useUser((s) => s.memberId)
  const ville = useUser((s) => s.ville)
  const role = useUser((s) => s.role)
  const perms = useUser((s) => s.perms)
  /* Rédiger l'ijtima' — la plume des frères de Nîmes */
  const peutRediger = peut(ville, role, 'reunions.rediger', perms)
  const imprimer = usePrint((s) => s.imprimer)
  const qc = useQueryClient()

  const d = new Date(meeting.date)
  const programme = parseProgram(meeting)
  const presents = meeting.attendances
  const totalAttendus = presents.length + presents.reduce((s, a) => s + a.guests, 0)
  const totalInvites = presents.reduce((s, a) => s + a.guests, 0)
  const jeViens = presents.find((a) => a.memberId === memberId)

  const toggle = useMutation({
    mutationFn: () =>
      api('/api/attendance', {
        method: 'POST',
        body: JSON.stringify({ meetingId: meeting.id, memberId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  })

  const del = useMutation({
    mutationFn: () => api(`/api/meetings/${meeting.id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  })

  const jourCourt = JOURS_COURTS[d.getDay()]
  const jourNum = d.getDate()
  const aujourdhui = new Date()
  aujourdhui.setHours(0, 0, 0, 0)
  const passee = d < aujourdhui

  return (
    <motion.article
      layout
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-card shadow-[0_2px_12px_-4px_rgba(11,93,66,0.08)] transition-shadow hover:shadow-[0_6px_20px_-6px_rgba(11,93,66,0.18)]',
        jeViens ? 'border-primary/30' : 'border-primary/12',
        prochaine && 'border-gold/40 ring-1 ring-gold/25',
        passee && 'opacity-60 saturate-50'
      )}
    >
      {/* Halo doré discret pour la prochaine réunion */}
      {prochaine && (
        <span aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gold/10 blur-2xl" />
      )}
      {/* Liseré doré si je suis inscrit */}
      {jeViens && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-accent to-primary" />
      )}
      {/* ─── Ligne d'en-tête ─── */}
      <button
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-background"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-emerald-deep text-white shadow-md shadow-primary/20">
          <span className="text-lg leading-none">{meeting.icon || '🕌'}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold">
              {jourCourt} {jourNum}
            </span>
            {jeViens && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary dark:bg-sauge/15 dark:text-sauge">
                ✓ inscrit
              </span>
            )}
            {prochaine && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-vif">
                <Sparkles className="h-3 w-3" aria-hidden /> prochaine
              </span>
            )}
            {passee && (
              <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brouillard">
                passée
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-[16px] font-medium text-encre">
            {meeting.title}
          </span>
          {!compact && (
            <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              {meeting.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {meeting.city}
                </span>
              )}
              {meeting.startTime && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {meeting.startTime}
                  {meeting.endTime ? `–${meeting.endTime}` : ''}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {totalAttendus} attendus
              </span>
              {totalInvites > 0 && (
                <span className="inline-flex items-center gap-1">
                  <UserPlus className="h-3 w-3" />
                  {totalInvites} inv.
                </span>
              )}
            </span>
          )}
        </span>
        <motion.span animate={{ rotate: ouvert ? 180 : 0 }} className="text-brouillard-clair">
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </button>

      {/* ─── Détail dépliable ─── */}
      <AnimatePresence initial={false}>
        {ouvert && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-dashed border-primary/15 px-4 pb-5 pt-4">
              {meeting.announcement && (
                <p className="rounded-xl border border-accent/40 bg-or-pale px-4 py-3 text-sm leading-relaxed text-gold-vif">
                  {meeting.announcement}
                </p>
              )}

              {meeting.address && (
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {meeting.address}
                </p>
              )}

              {/* Programme */}
              {programme.length > 0 && (
                <div className="rounded-xl bg-background p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-brouillard">
                    Programme
                  </p>
                  <ul className="space-y-1.5">
                    {programme.map((l, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-secondary-foreground">
                        <span className="w-12 shrink-0 text-right font-semibold tabular-nums text-primary">
                          {l.time}
                        </span>
                        <span aria-hidden>{l.icon}</span>
                        <span>{l.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Je viendrai + modifier + supprimer */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => memberId && toggle.mutate()}
                  disabled={!memberId}
                  className={
                    jeViens
                      ? 'flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-colors'
                      : 'flex-1 rounded-full border-2 border-primary/70 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5'
                  }
                >
                  {jeViens ? '✓ Je viendrai' : 'Je viendrai'}
                </motion.button>
                {peutRediger && (
                  <button
                    onClick={() => setEditionOuverte(true)}
                    aria-label="Modifier la réunion"
                    title="Modifier la réunion"
                    className="grid h-11 w-11 place-items-center rounded-full border border-gold/40 text-gold transition-all hover:bg-gold/10 hover:border-gold/70"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => imprimer({ kind: 'presence', meetingId: meeting.id })}
                  aria-label="Imprimer la feuille de présence"
                  title="Imprimer la feuille de présence"
                  className="grid h-11 w-11 place-items-center rounded-full border border-primary/30 text-primary transition-all hover:bg-primary/10 hover:border-primary/60"
                >
                  <Printer className="h-4 w-4" />
                </button>
                {peutRediger && (
                  <button
                    onClick={() => del.mutate()}
                    aria-label="Supprimer la réunion"
                    title="Supprimer la réunion"
                    className="grid h-11 w-11 place-items-center rounded-full border border-destructive/25 text-destructive/70 transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Réponse de la communauté — effectifs, sans prénoms :
                  la feuille de présence imprimée tient le détail pour le shaykh */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-background px-3 py-2 text-sm font-medium text-primary">
                  <Users className="h-4 w-4" /> {presents.length} frère{presents.length > 1 ? 's' : ''}
                </span>
                {totalInvites > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-or-pale px-3 py-2 text-sm font-medium text-gold-vif">
                    <UserPlus className="h-4 w-4" /> {totalInvites} invité{totalInvites > 1 ? 's' : ''}
                  </span>
                )}
                <span className="text-xs text-brouillard">{totalAttendus} personnes attendues</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Dialogue de modification ─── */}
      <NewMeetingDialog open={editionOuverte} onOpenChange={setEditionOuverte} meeting={meeting} />
    </motion.article>
  )
}

/* ═══════════════ Section Al-Ijtimâ' groupée par semaine ═══════════════ */

import { useMeetings } from '@/lib/api'
import { SondagesDuIjtima } from './sondages-section'

export function IjtimaSection() {
  const { data: meetings, isLoading } = useMeetings()
  const masques = useRappelBandeau((s) => s.masques)
  const retablir = useRappelBandeau((s) => s.retablir)

  if (isLoading) {
    return (
      <SectionShell titre="Al-Ijtimâ'" compteur="…">
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-sand/60" />
          ))}
        </div>
      </SectionShell>
    )
  }

  // Grouper par semaine
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const groupes = new Map<string, { label: string; actuel: boolean; items: Meeting[] }>()
  for (const m of meetings ?? []) {
    const cle = cleSemaine(m.date)
    const semaineActuelle = cleSemaine(new Date())
    if (!groupes.has(cle)) {
      groupes.set(cle, {
        label: libelleSemaine(m.date),
        actuel: cle === semaineActuelle,
        items: [],
      })
    }
    groupes.get(cle)!.items.push(m)
  }

  const semaines = Array.from(groupes.values()).sort((a, b) =>
    a.actuel ? -1 : b.actuel ? 1 : a.items[0].date.localeCompare(b.items[0].date)
  )

  /* La prochaine réunion à venir (plus proche d'aujourd'hui) — mise en avant dorée */
  const aVenir = (meetings ?? [])
    .filter((m) => new Date(m.date) >= now)
    .sort((a, b) => a.date.localeCompare(b.date))
  const idProchaine = aVenir[0]?.id

  return (
    <SectionShell titre="Al-Ijtimâ'" compteur={`${meetings?.length ?? 0} réunion${(meetings?.length ?? 0) > 1 ? 's' : ''}`} id="ijtima">
      <div className="space-y-5">
        {/* Rappel masqué — possibilité de le réafficher */}
        {idProchaine && masques.includes(idProchaine) && (
          <button
            onClick={() => retablir(idProchaine)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gold/40 bg-or-pale/40 px-4 py-2.5 text-xs font-semibold text-gold-vif transition-colors hover:bg-or-pale/70 active:scale-[0.99]"
          >
            <Eye className="h-4 w-4" aria-hidden />
            Réafficher le rappel du prochain ijtimâ'
          </button>
        )}
        {semaines.map((s) => (
          <div key={s.label}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-brouillard">
                {s.actuel ? 'Cette semaine' : s.label}
              </h3>
              {s.actuel && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" aria-hidden />}
            </div>
            <div className="space-y-3">
              {s.items.map((m) => (
                <MeetingCard key={m.id} meeting={m} prochaine={m.id === idProchaine} />
              ))}
            </div>
          </div>
        ))}
        {!meetings?.length && (
          <p className="rounded-2xl border border-dashed border-primary/20 p-6 text-center text-sm text-brouillard">
            Aucune réunion programmée.
            <br />
            Utilise le bouton <CalendarPlus className="inline h-3.5 w-3.5" /> pour en créer une.
          </p>
        )}

        {/* Les sondages de la communauté — au cœur de l'ijtimâ' */}
        <SondagesDuIjtima />
      </div>
    </SectionShell>
  )
}

/* ═══════════════ Coquille de section pliable ═══════════════ */
export function SectionShell({
  titre,
  compteur,
  children,
  defaultOpen = false,
  id,
}: {
  titre: string
  compteur?: string
  children: React.ReactNode
  defaultOpen?: boolean
  id?: string
}) {
  const [ouvert, setOuvert] = useState(defaultOpen)
  const sectionRef = useRef<HTMLElement | null>(null)

  /* La recherche globale (⌘K) demande l'ouverture d'une section précise :
     abonnement au magasin de navigation — setState appelé dans le rappel
     d'abonnement (motif recommandé), jamais dans le corps d'un effet. */
  useEffect(() => {
    if (!id) return
    return useNav.subscribe((etat) => {
      if (etat.demande && etat.demande.id === id) {
        setOuvert(true)
        // Laisse le contenu s'ouvrir avant de défiler
        requestAnimationFrame(() => {
          sectionRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
        })
      }
    })
  }, [id])

  /* Si l'en-tête de section se retrouve sous le bandeau collant (≈96 px),
     on la fait glider pour qu'elle reste visible et cliquable. */
  const basculer = () => {
    const next = !ouvert
    setOuvert(next)
    if (next && sectionRef.current) {
      const top = sectionRef.current.getBoundingClientRect().top
      if (top < 96) {
        sectionRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }
    }
  }

  return (
    <section id={id} aria-label={titre} ref={sectionRef} className="scroll-mt-24">
      <button
        onClick={basculer}
        aria-expanded={ouvert}
        className={cn(
          'coins-andalous group relative mb-3 flex w-full items-center justify-between overflow-hidden rounded-2xl border border-primary/12 bg-card px-4 py-3 shadow-sm transition-all hover:border-primary/25 hover:shadow-md active:scale-[0.995]',
          ouvert && 'border-primary/25 shadow-md'
        )}
      >
        {/* Constellation khātim — zellige en réserve, côté droit */}
        <span
          aria-hidden
          className="entete-khatim pointer-events-none absolute inset-0"
        />
        {/* Balayage doré sous le titre quand la section est ouverte */}
        <motion.span
          aria-hidden
          initial={false}
          animate={{ scaleX: ouvert ? 1 : 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-x-4 bottom-1 h-px origin-left bg-gradient-to-r from-gold/60 via-accent/45 to-transparent"
        />
        <span className="flex items-center gap-2.5">
          <span className="sceau text-[15px] font-bold uppercase tracking-[0.18em] text-encre">
            {titre}
          </span>
          <span
            className={cn(
              'hidden rounded-full bg-primary/6 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground transition-opacity group-hover:opacity-100 sm:inline-block',
              ouvert ? 'opacity-0' : 'opacity-70'
            )}
          >
            déplier
          </span>
        </span>
        <span className="flex items-center gap-2">
          {compteur && (
            <span className="rounded-full bg-sand px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {compteur}
            </span>
          )}
          <motion.span
            animate={{ rotate: ouvert ? 180 : 0 }}
            className={cn('text-brouillard-clair transition-colors group-hover:text-primary')}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.span>
        </span>
      </button>
      <AnimatePresence initial={false}>
        {ouvert && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-l-2 border-accent/25 pl-2.5 pt-1 sm:pl-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

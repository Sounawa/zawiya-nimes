'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Clock, MapPin, Pencil, Printer, Trash2, Users, UserPlus, CalendarPlus } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { usePrint, useUser } from '@/lib/store'
import { cn } from '@/lib/utils'
import { JOURS_COURTS, parseProgram, type Meeting } from '@/lib/types'
import { cleSemaine, libelleSemaine } from '@/lib/format'
import { NewMeetingDialog } from './new-meeting-dialog'

/* ═══════════════ Carte d'une réunion ═══════════════ */

export function MeetingCard({ meeting, compact }: { meeting: Meeting; compact?: boolean }) {
  const [ouvert, setOuvert] = useState(false)
  const [voirListe, setVoirListe] = useState(false)
  const [voirInvites, setVoirInvites] = useState(false)
  const [editionOuverte, setEditionOuverte] = useState(false)
  const memberId = useUser((s) => s.memberId)
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
        'relative overflow-hidden rounded-2xl border bg-white shadow-[0_2px_12px_-4px_rgba(11,93,66,0.08)] transition-shadow hover:shadow-[0_6px_20px_-6px_rgba(11,93,66,0.18)]',
        jeViens ? 'border-[#0b5d42]/30' : 'border-[#0b5d42]/12',
        passee && 'opacity-60 saturate-50'
      )}
    >
      {/* Liseré doré si je suis inscrit */}
      {jeViens && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#c9a24b] to-[#0b5d42]" />
      )}
      {/* ─── Ligne d'en-tête ─── */}
      <button
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-[#fbf9f4]"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#0b5d42] to-[#0b3d2e] text-white shadow-md shadow-[#0b5d42]/20">
          <span className="text-lg leading-none">{meeting.icon || '🕌'}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#b8923a]">
              {jourCourt} {jourNum}
            </span>
            {jeViens && (
              <span className="rounded-full bg-[#0b5d42]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0b5d42]">
                ✓ inscrit
              </span>
            )}
            {passee && (
              <span className="rounded-full bg-[#efe9dc] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#a09a87]">
                passée
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-[15px] font-semibold text-[#123c2d]">
            {meeting.title}
          </span>
          {!compact && (
            <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#78877d]">
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
        <motion.span animate={{ rotate: ouvert ? 180 : 0 }} className="text-[#b6b1a0]">
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
            <div className="space-y-4 border-t border-dashed border-[#0b5d42]/15 px-4 pb-5 pt-4">
              {meeting.announcement && (
                <p className="rounded-xl border border-[#c9a24b]/40 bg-[#fdf6e7] px-4 py-3 text-sm leading-relaxed text-[#7a5c15]">
                  {meeting.announcement}
                </p>
              )}

              {meeting.address && (
                <p className="flex items-start gap-2 text-sm text-[#5b6b60]">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0b5d42]" />
                  {meeting.address}
                </p>
              )}

              {meeting.word && (
                <p className="font-display text-lg italic text-[#0b5d42]">
                  «&nbsp;{meeting.word}&nbsp;»
                </p>
              )}

              {/* Programme */}
              {programme.length > 0 && (
                <div className="rounded-xl bg-[#fbf9f4] p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#a09a87]">
                    Programme
                  </p>
                  <ul className="space-y-1.5">
                    {programme.map((l, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-[#33453a]">
                        <span className="w-12 shrink-0 text-right font-semibold tabular-nums text-[#0b5d42]">
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
                      ? 'flex-1 rounded-full bg-[#0b5d42] py-3 text-sm font-semibold text-white shadow-md shadow-[#0b5d42]/25 transition-colors'
                      : 'flex-1 rounded-full border-2 border-[#0b5d42]/70 py-3 text-sm font-semibold text-[#0b5d42] transition-colors hover:bg-[#0b5d42]/5'
                  }
                >
                  {jeViens ? '✓ Je viendrai' : 'Je viendrai'}
                </motion.button>
                <button
                  onClick={() => setEditionOuverte(true)}
                  aria-label="Modifier la réunion"
                  title="Modifier la réunion"
                  className="grid h-11 w-11 place-items-center rounded-full border border-[#b8923a]/40 text-[#b8923a] transition-all hover:bg-[#b8923a]/10 hover:border-[#b8923a]/70"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => imprimer({ kind: 'presence', meetingId: meeting.id })}
                  aria-label="Imprimer la feuille de présence"
                  title="Imprimer la feuille de présence"
                  className="grid h-11 w-11 place-items-center rounded-full border border-[#0b5d42]/30 text-[#0b5d42] transition-all hover:bg-[#0b5d42]/10 hover:border-[#0b5d42]/60"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={() => del.mutate()}
                  aria-label="Supprimer la réunion"
                  title="Supprimer la réunion"
                  className="grid h-11 w-11 place-items-center rounded-full border border-[#b3452f]/25 text-[#b3452f]/70 transition-colors hover:bg-[#b3452f]/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Listes attendus / invités */}
              <div className="space-y-2">
                <button
                  onClick={() => setVoirListe((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl bg-[#fbf9f4] px-4 py-2.5 text-sm font-medium text-[#0b5d42] transition-colors hover:bg-[#f2f7f3]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Users className="h-4 w-4" /> {presents.length} attendus
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${voirListe ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {voirListe && (
                    <motion.ul
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden pl-2"
                    >
                      <div className="defile-fin max-h-60 overflow-y-auto rounded-xl border border-[#0b5d42]/10 p-2">
                        {presents.length === 0 && (
                          <li className="px-3 py-2 text-sm text-[#a09a87]">Personne pour l'instant…</li>
                        )}
                        {presents.map((a) => (
                          <li
                            key={a.id}
                            className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm text-[#33453a] hover:bg-[#fbf9f4]"
                          >
                            <span>Sidi {a.member.name}</span>
                            {a.guests > 0 && (
                              <span className="rounded-full bg-[#c9a24b]/15 px-2 py-0.5 text-[11px] font-semibold text-[#8a6d2f]">
                                +{a.guests} invité{a.guests > 1 ? 's' : ''}
                              </span>
                            )}
                          </li>
                        ))}
                      </div>
                    </motion.ul>
                  )}
                </AnimatePresence>

                {totalInvites > 0 && (
                  <>
                    <button
                      onClick={() => setVoirInvites((v) => !v)}
                      className="flex w-full items-center justify-between rounded-xl bg-[#fdf6e7] px-4 py-2.5 text-sm font-medium text-[#a3781f] transition-colors hover:bg-[#f9edd2]"
                    >
                      <span className="inline-flex items-center gap-2">
                        <UserPlus className="h-4 w-4" /> {totalInvites} invités
                      </span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${voirInvites ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {voirInvites && (
                        <motion.ul
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden pl-2"
                        >
                          <div className="rounded-xl border border-[#c9a24b]/20 p-2">
                            {presents
                              .filter((a) => a.guests > 0)
                              .map((a) => (
                                <li
                                  key={a.id}
                                  className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm text-[#7a5c15]"
                                >
                                  <span>de Sidi {a.member.name}</span>
                                  <span className="font-semibold">{a.guests}</span>
                                </li>
                              ))}
                          </div>
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </>
                )}
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

export function IjtimaSection() {
  const { data: meetings, isLoading } = useMeetings()

  if (isLoading) {
    return (
      <SectionShell titre="Al-Ijtimâ'" compteur="…">
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[#efe9dc]/60" />
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

  return (
    <SectionShell titre="Al-Ijtimâ'" compteur={`${meetings?.length ?? 0} réunion${(meetings?.length ?? 0) > 1 ? 's' : ''}`}>
      <div className="space-y-5">
        {semaines.map((s) => (
          <div key={s.label}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#a09a87]">
                {s.actuel ? 'Cette semaine' : s.label}
              </h3>
              {s.actuel && <span className="h-1.5 w-1.5 rounded-full bg-[#0b5d42] animate-pulse" aria-hidden />}
            </div>
            <div className="space-y-3">
              {s.items.map((m) => (
                <MeetingCard key={m.id} meeting={m} />
              ))}
            </div>
          </div>
        ))}
        {!meetings?.length && (
          <p className="rounded-2xl border border-dashed border-[#0b5d42]/20 p-6 text-center text-sm text-[#a09a87]">
            Aucune réunion programmée.
            <br />
            Utilise le bouton <CalendarPlus className="inline h-3.5 w-3.5" /> pour en créer une.
          </p>
        )}
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
  return (
    <section id={id} aria-label={titre} className="scroll-mt-24">
      <button
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        className={cn(
          'group mb-3 flex w-full items-center justify-between rounded-2xl border border-[#0b5d42]/12 bg-white px-4 py-3 shadow-sm transition-all hover:border-[#0b5d42]/25 hover:shadow-md active:scale-[0.995]',
          ouvert && 'border-[#0b5d42]/25'
        )}
      >
        <span className="flex items-center gap-2.5">
          <span className="sceau text-[15px] font-bold uppercase tracking-[0.18em] text-[#123c2d]">
            {titre}
          </span>
          <span
            className={cn(
              'hidden rounded-full bg-[#0b5d42]/6 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#78877d] transition-opacity group-hover:opacity-100 sm:inline-block',
              ouvert ? 'opacity-0' : 'opacity-70'
            )}
          >
            déplier
          </span>
        </span>
        <span className="flex items-center gap-2">
          {compteur && (
            <span className="rounded-full bg-[#efe9dc] px-2.5 py-1 text-[11px] font-semibold text-[#78877d]">
              {compteur}
            </span>
          )}
          <motion.span
            animate={{ rotate: ouvert ? 180 : 0 }}
            className={cn('text-[#b6b1a0] transition-colors group-hover:text-[#0b5d42]', !ouvert && 'chevron-pulse')}
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
            <div className="pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MoonStar, Sunrise, Sun, Sunset, CloudSun, Star } from 'lucide-react'
import { usePrayerTimes } from '@/lib/api'
import { PRIERES, type Timings } from '@/lib/types'
import { dateCourte } from '@/lib/format'
import { SectionShell } from './ijtima-section'
import { cn } from '@/lib/utils'

const ICONES: Record<string, React.ElementType> = {
  Fajr: Star,
  Chourouq: Sunrise,
  Dohr: Sun,
  Asr: CloudSun,
  Maghreb: Sunset,
  Icha: MoonStar,
}

function prochainNom(t: Timings): string | null {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  for (const p of PRIERES) {
    if (p.key === 'Chourouq') continue
    const m = t[p.key].match(/^(\d{1,2}):(\d{2})$/)
    if (!m) continue
    if (parseInt(m[1], 10) * 60 + parseInt(m[2], 10) > nowMin) return p.key
  }
  return null
}

/* ─── Vue du jour ─── */
function VueJour({ t }: { t: Timings }) {
  const prochain = prochainNom(t)
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {PRIERES.map((p) => {
        const Icone = ICONES[p.key]
        const estProchaine = p.key === prochain
        return (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-2xl border p-3.5 text-center transition-colors',
              estProchaine
                ? 'border-[#0b5d42]/40 bg-gradient-to-b from-[#0b5d42] to-[#0b3d2e] text-white shadow-lg shadow-[#0b5d42]/25'
                : p.key === 'Chourouq'
                  ? 'border-[#c9a24b]/25 bg-[#fdf6e7] text-[#7a5c15]'
                  : 'border-[#0b5d42]/12 bg-white text-[#33453a]'
            )}
          >
            <Icone className={cn('h-5 w-5', estProchaine ? 'text-[#e9d9ae]' : 'text-[#0b5d42]')} />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{p.label}</span>
            <span className="text-base font-bold tabular-nums">{t[p.key]}</span>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ─── Vue semaine / mois ─── */
function VueTable({ jours }: { jours: [string, Timings][] }) {
  const now = new Date()
  const aujourdhui = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return (
    <div className="overflow-hidden rounded-2xl border border-[#0b5d42]/12 bg-white">
      <div className="grid grid-cols-7 bg-[#efe9dc] text-center text-[10px] font-bold uppercase tracking-wider text-[#78877d]">
        {PRIERES.map((p) => (
          <span key={p.key} className="py-2">
            {p.label}
          </span>
        ))}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {jours.map((d, idx) => {
          const estAujourdhui = d[0] === aujourdhui
          return (
            <div
              key={d[0]}
              className={cn(
                'grid grid-cols-7 border-t text-center text-sm tabular-nums first:border-t-0',
                idx % 2 ? 'bg-[#fdfcf8]' : 'bg-white',
                estAujourdhui && 'bg-[#0b5d42]/10 font-semibold'
              )}
            >
              {PRIERES.map((p) => (
                <span key={p.key} className="px-1 py-2.5">
                  {d[1][p.key]}
                </span>
              ))}
            </div>
          )
        })}
        {jours.length === 0 && (
          <p className="p-6 text-center text-sm text-[#a09a87]">Heures indisponibles…</p>
        )}
      </div>
    </div>
  )
}

export function SalatSection() {
  const [vue, setVue] = useState<'jour' | 'semaine' | 'mois'>('jour')
  const { data: jour } = usePrayerTimes('jour')
  const { data: semaine } = usePrayerTimes('semaine')
  const { data: mois } = usePrayerTimes('mois')

  const joursSemaine = semaine?.days ? Object.entries(semaine.days) : []
  const joursMois = mois?.days ? Object.entries(mois.days) : []

  return (
    <SectionShell titre="Salât" compteur={jour?.timings ? `Asr ${jour.timings.Asr}` : undefined}>
      <div className="space-y-4">
        {/* Segmenteur Jour / Semaine / Mois */}
        <div className="mx-auto flex w-fit rounded-full border border-[#0b5d42]/15 bg-white p-1 shadow-sm" role="tablist">
          {(['jour', 'semaine', 'mois'] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={vue === v}
              onClick={() => setVue(v)}
              className={cn(
                'relative rounded-full px-5 py-1.5 text-xs font-semibold capitalize transition-colors',
                vue === v ? 'text-white' : 'text-[#78877d] hover:text-[#0b5d42]'
              )}
            >
              {vue === v && (
                <motion.span
                  layoutId="seg-prieres"
                  className="absolute inset-0 rounded-full bg-[#0b5d42]"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{v}</span>
            </button>
          ))}
        </div>

        {vue === 'jour' &&
          (jour?.timings ? <VueJour t={jour.timings} /> : <p className="p-4 text-center text-sm text-[#a09a87]">Chargement des heures…</p>)}
        {vue === 'semaine' && <VueTable jours={joursSemaine} />}
        {vue === 'mois' && <VueTable jours={joursMois} />}

        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-[#b6b1a0]">
          Nîmes · méthode UOIF
        </p>
      </div>
    </SectionShell>
  )
}

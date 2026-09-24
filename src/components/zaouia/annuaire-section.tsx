'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BadgeCheck, Coins, Search, Sparkles, Users, X } from 'lucide-react'
import { useMembers, useContributions, useMeetings } from '@/lib/api'
import { useUser } from '@/lib/store'
import { euros } from '@/lib/format'
import { SectionShell } from './ijtima-section'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Member } from '@/lib/types'

/* ═══════════════ Teinte stable par membre (hash du prénom) ═══════════════ */
function teinteMembre(nom: string): number {
  let h = 0
  for (let i = 0; i < nom.length; i++) h = (h * 31 + nom.charCodeAt(i)) % 360
  return h
}

/* ═══════════════ Carte d'un membre ═══════════════ */
function CarteMembre({
  membre,
  total,
  ziyara,
  presences,
  estTresorier,
  estMoi,
}: {
  membre: Member
  total: number
  ziyara: number
  presences: number
  estTresorier: boolean
  estMoi: boolean
}) {
  const teinte = teinteMembre(membre.name)
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'group relative flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
        estMoi ? 'border-[#b8923a]/45 ring-1 ring-[#c9a24b]/30' : 'border-[#0b5d42]/12 hover:border-[#0b5d42]/25'
      )}
    >
      {/* Avatar — initiale sur teinte dérivée du prénom */}
      <span
        aria-hidden
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white shadow-inner"
        style={{
          background: `linear-gradient(135deg, hsl(${teinte} 32% 38%), hsl(${(teinte + 40) % 360} 30% 26%))`,
        }}
      >
        {membre.name.charAt(0).toUpperCase()}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-[#33453a]">
            Sidi {membre.name}
          </span>
          {estMoi && (
            <span className="rounded-full bg-[#c9a24b]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#a3781f]">
              moi
            </span>
          )}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[#a09a87]">
          <span className="inline-flex items-center gap-1" title="Cotisations & dons">
            <Coins className="h-3 w-3 text-[#0b5d42]/70" />
            <span className="font-semibold tabular-nums text-[#0b5d42]">{euros(total)}</span>
          </span>
          {estTresorier && ziyara > 0 && (
            <span className="inline-flex items-center gap-1" title="Ziyara">
              <Sparkles className="h-3 w-3 text-[#b8923a]" />
              <span className="font-semibold tabular-nums text-[#a3781f]">{euros(ziyara)}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1" title="Présences aux ijtima'">
            <Users className="h-3 w-3 text-[#4a7c6b]" />
            <span className="font-semibold tabular-nums text-[#4a7c6b]">{presences}</span>
            <span className="hidden sm:inline">ijtima{presences !== 1 ? "'s" : ''}</span>
          </span>
        </span>
      </span>

      {/* Badge de rôle */}
      {membre.role === 'TREASURER' ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#b8923a]/12 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#a3781f] ring-1 ring-[#b8923a]/30">
          <BadgeCheck className="h-3 w-3" /> Trésorier
        </span>
      ) : (
        <span className="hidden shrink-0 rounded-full bg-[#0b5d42]/8 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#5b6b60] ring-1 ring-[#0b5d42]/15 sm:inline-block">
          Admin
        </span>
      )}
    </motion.li>
  )
}

/* ═══════════════ Section ANNUAIRE — la communauté ═══════════════ */
export function AnnuaireSection() {
  const { data: membres, isLoading } = useMembers()
  const { data: dataContrib } = useContributions()
  const { data: meetings } = useMeetings()
  const role = useUser((s) => s.role)
  const monId = useUser((s) => s.memberId)

  const [recherche, setRecherche] = useState('')

  // Agrégats par membre : cotisations+dons, ziyara, présences
  const stats = useMemo(() => {
    const m = new Map<string, { caisse: number; ziyara: number; presences: number }>()
    for (const c of dataContrib?.contributions ?? []) {
      const e = m.get(c.memberId) ?? { caisse: 0, ziyara: 0, presences: 0 }
      if (c.category === 'ZIYARA') e.ziyara += c.amount
      else e.caisse += c.amount
      m.set(c.memberId, e)
    }
    for (const mt of meetings ?? []) {
      for (const a of mt.attendances) {
        const e = m.get(a.memberId) ?? { caisse: 0, ziyara: 0, presences: 0 }
        e.presences += 1
        m.set(a.memberId, e)
      }
    }
    return m
  }, [dataContrib, meetings])

  const liste = useMemo(() => {
    const base = (membres ?? []).slice()
    if (!recherche.trim()) return base
    const q = recherche.trim().toLowerCase()
    return base.filter((m) => m.name.toLowerCase().includes(q))
  }, [membres, recherche])

  const nbTotal = membres?.length ?? 0
  const cotisants = new Set(
    (dataContrib?.contributions ?? []).filter((c) => c.category !== 'ZIYARA').map((c) => c.memberId)
  ).size

  return (
    <SectionShell
      titre="Annuaire"
      compteur={nbTotal ? `${nbTotal} frères` : undefined}
      id="annuaire"
    >
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-[#efe9dc]/60" />
      ) : (
        <div className="space-y-4">
          {/* Résumé de la communauté */}
          <div className="relative overflow-hidden rounded-2xl border border-[#0b5d42]/12 bg-gradient-to-br from-white via-[#f6f9f5] to-[#eff5ef] p-4 shadow-sm">
            <div className="pattern-khatim absolute inset-0" aria-hidden />
            <div className="relative flex items-center justify-around py-1 text-center">
              <div>
                <p className="font-display text-2xl font-semibold tabular-nums text-[#123c2d]">{nbTotal}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#a09a87]">Frères</p>
              </div>
              <span aria-hidden className="h-8 w-px bg-[#0b5d42]/15" />
              <div>
                <p className="font-display text-2xl font-semibold tabular-nums text-[#0b5d42]">{cotisants}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#a09a87]">Cotisants</p>
              </div>
              <span aria-hidden className="h-8 w-px bg-[#0b5d42]/15" />
              <div>
                <p className="font-display text-2xl font-semibold tabular-nums text-[#a3781f]">
                  {nbTotal ? Math.round((cotisants / nbTotal) * 100) : 0}%
                </p>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#a09a87]">Participation</p>
              </div>
            </div>
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b6b1a0]" />
            <Input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un frère…"
              aria-label="Rechercher un frère"
              className="rounded-full border-[#0b5d42]/20 bg-white pl-10 pr-10"
            />
            {recherche && (
              <button
                onClick={() => setRecherche('')}
                aria-label="Effacer la recherche"
                className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-[#efe9dc] text-[#78877d] transition-colors hover:bg-[#e4dcc8]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Liste */}
          <ul className="defile-fin max-h-96 space-y-2 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {liste.map((m) => {
                const s = stats.get(m.id) ?? { caisse: 0, ziyara: 0, presences: 0 }
                return (
                  <CarteMembre
                    key={m.id}
                    membre={m}
                    total={s.caisse}
                    ziyara={s.ziyara}
                    presences={s.presences}
                    estTresorier={role === 'TREASURER'}
                    estMoi={m.id === monId}
                  />
                )
              })}
            </AnimatePresence>
            {liste.length === 0 && (
              <li className="rounded-2xl border border-dashed border-[#0b5d42]/20 p-6 text-center text-sm text-[#a09a87]">
                Aucun frère ne correspond à «&nbsp;{recherche}&nbsp;».
              </li>
            )}
          </ul>
        </div>
      )}
    </SectionShell>
  )
}

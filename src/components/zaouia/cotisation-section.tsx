'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Banknote, TrendingUp, Users } from 'lucide-react'
import { useContributions, useMembers } from '@/lib/api'
import { euros } from '@/lib/format'
import { SectionShell } from './ijtima-section'
import { FormulaireContribution, LigneContribution, Compteur, Progression } from './contribution-shared'
import { cn } from '@/lib/utils'

/* ═══════════════ Section COTISATIONS — la caisse ═══════════════ */
export function CotisationSection() {
  const { data, isLoading } = useContributions()

  const [filtre, setFiltre] = useState<'TOUS' | 'COTISATION' | 'DON'>('TOUS')

  const cotisations = data?.contributions ?? []
  const totals = data?.totals

  // Qui a donné quoi (par membre) — hors ziyara, gérée séparément par le trésorier
  const parMembre = useMemo(() => {
    const m = new Map<string, { name: string; total: number; count: number }>()
    for (const c of cotisations) {
      if (c.category === 'ZIYARA') continue
      const e = m.get(c.memberId) ?? { name: c.member.name, total: 0, count: 0 }
      e.total += c.amount
      e.count += 1
      m.set(c.memberId, e)
    }
    return Array.from(m.values()).sort((a, b) => b.total - a.total)
  }, [cotisations])

  const maxMembre = Math.max(0, ...parMembre.map((p) => p.total))

  const listeFiltree = cotisations
    .filter((c) => (filtre === 'TOUS' ? c.category !== 'ZIYARA' : c.category === filtre))
    .slice(0, 30)

  return (
    <SectionShell
      titre="Cotisations"
      compteur={totals ? `${cotisations.filter((c) => c.category !== 'ZIYARA').length} entrées` : undefined}
      id="cotisations"
    >
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-[#efe9dc]/60" />
      ) : (
        <div className="space-y-4">
          {/* Carte caisse */}
          <div className="relative overflow-hidden rounded-2xl border border-[#0b5d42]/15 bg-gradient-to-br from-white via-[#f4f8f4] to-[#eef4ee] p-6 shadow-sm">
            <div className="pattern-lattice absolute inset-0" aria-hidden />
            <div className="relative">
              <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-[#0b5d42]">
                <Banknote className="h-4 w-4" /> La Caisse
              </p>
              <Compteur valeur={totals ? totals.COTISATION + totals.DON : 0} libelle="Cotisations & dons cumulés" />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/80 p-3 text-center ring-1 ring-[#0b5d42]/10">
                  <p className="font-display text-xl font-semibold tabular-nums text-[#0b5d42]">
                    {totals ? euros(totals.COTISATION) : '—'}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#a09a87]">Cotisations</p>
                </div>
                <div className="rounded-xl bg-white/80 p-3 text-center ring-1 ring-[#0b5d42]/10">
                  <p className="font-display text-xl font-semibold tabular-nums text-[#4a7c6b]">
                    {totals ? euros(totals.DON) : '—'}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#a09a87]">Dons</p>
                </div>
              </div>
            </div>
          </div>

          <FormulaireContribution categorieDefaut="COTISATION" categories={['COTISATION', 'DON']} />

          {/* Classement des contributeurs */}
          {parMembre.length > 0 && (
            <div className="rounded-2xl border border-[#0b5d42]/12 bg-white p-4 shadow-sm">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
                <Users className="h-3.5 w-3.5 text-[#0b5d42]" /> Qui a donné
              </p>
              <ul className="space-y-3">
                {parMembre.map((p, i) => (
                  <li key={p.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-[#33453a]">
                        <span className="mr-1.5 inline-grid h-5 w-5 place-items-center rounded-full bg-[#efe9dc] text-[10px] font-bold text-[#78877d]">
                          {i + 1}
                        </span>
                        Sidi {p.name}
                      </span>
                      <span className="font-bold tabular-nums text-[#0b5d42]">{euros(p.total)}</span>
                    </div>
                    <Progression valeur={p.total} max={maxMembre} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Historique */}
          <div className="rounded-2xl border border-[#0b5d42]/12 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
                <TrendingUp className="h-3.5 w-3.5 text-[#0b5d42]" /> Historique
              </p>
              <div className="flex gap-1">
                {(['TOUS', 'COTISATION', 'DON'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFiltre(f)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors',
                      filtre === f
                        ? 'bg-[#0b5d42] text-white'
                        : 'bg-[#efe9dc] text-[#78877d] hover:bg-[#e4dcc8]'
                    )}
                  >
                    {f === 'TOUS' ? 'Tous' : f === 'COTISATION' ? 'Cotis.' : 'Dons'}
                  </button>
                ))}
              </div>
            </div>
            <ul className="max-h-72 divide-y divide-[#f2ede0] overflow-y-auto">
              <AnimatePresence initial={false}>
                {listeFiltree.map((c) => (
                  <LigneContribution
                    key={c.id}
                    id={c.id}
                    membre={c.member.name}
                    montant={c.amount}
                    categorie={c.category}
                    note={c.note}
                    date={c.date}
                    onDeleted={() => {}}
                  />
                ))}
              </AnimatePresence>
              {listeFiltree.length === 0 && (
                <li className="p-4 text-center text-sm text-[#a09a87]">Aucune entrée.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </SectionShell>
  )
}

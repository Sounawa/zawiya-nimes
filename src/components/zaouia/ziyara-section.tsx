'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Gift, HeartHandshake, Lock, Sparkles } from 'lucide-react'
import { useContributions, useMembers } from '@/lib/api'
import { useUser } from '@/lib/store'
import { euros, dateCourte } from '@/lib/format'
import { SectionShell } from './ijtima-section'
import { FormulaireContribution, LigneContribution } from './contribution-shared'

/* ═══════════════ Section ZIYARA — pour le Shaykh ═══════════════
   Réservée au trésorier : lui seul peut voir et modifier les montants. */

export function ZiyaraSection() {
  const role = useUser((s) => s.role)
  const { data, isLoading } = useContributions()
  const { data: membres } = useMembers()

  const toutes = data?.contributions ?? []
  const total = data?.totals.ZIYARA ?? 0

  // Ziyara par membre — calcul automatique dès que l'argent entre dans la colonne
  const parMembre = useMemo(() => {
    const m = new Map<string, { name: string; total: number; count: number; derniere: string }>()
    for (const c of toutes) {
      if (c.category !== 'ZIYARA') continue
      const e = m.get(c.memberId) ?? {
        name: c.member.name,
        total: 0,
        count: 0,
        derniere: c.date,
      }
      e.total += c.amount
      e.count += 1
      if (new Date(c.date) > new Date(e.derniere)) e.derniere = c.date
      m.set(c.memberId, e)
    }
    return Array.from(m.values()).sort((a, b) => b.total - a.total)
  }, [toutes])

  const entreesZiyara = toutes.filter((c) => c.category === 'ZIYARA')
  const participants = parMembre.length
  const nbMembres = membres?.length ?? 0
  const moyenne = participants ? total / participants : 0

  // Section invisible pour les non-trésoriers
  if (role !== 'TREASURER') return null

  return (
    <SectionShell
      titre="Ziyara"
      compteur={`${entreesZiyara.length} entrées`}
      id="ziyara"
    >
      {isLoading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-sand/60" />
      ) : (
        <div className="space-y-4">
          {/* ─── La grande carte dorée : montant pour le Shaykh ─── */}
          <div className="relative overflow-hidden rounded-2xl border border-accent/40 bg-gradient-to-br from-or-pale via-card to-or-moyen p-6 text-center shadow-md shadow-accent/10">
            {/* Halo doré */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(201,162,75,0.22), transparent 70%)',
              }}
            />
            <div className="pattern-arabesque absolute inset-0" aria-hidden />

            <div className="relative">
              <p className="mb-1 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.3em] text-gold-vif">
                <Sparkles className="h-4 w-4" /> Ziyara
              </p>
              <p className="mb-3 font-display text-sm italic text-gold-vif">
                Ce qui sera donné au Shaykh
              </p>

              {/* Montant calculé automatiquement */}
              <motion.p
                key={total}
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                className="text-shimmer font-display text-5xl font-semibold tabular-nums sm:text-6xl"
              >
                {euros(total)}
              </motion.p>

              <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-brouillard-clair">
                <Lock className="h-3 w-3" /> trésorier uniquement · calcul automatique
              </p>

              {/* Statistiques */}
              <div className="mt-5 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-card/85 p-3 text-center ring-1 ring-accent/25">
                  <p className="font-display text-xl font-semibold tabular-nums text-gold-vif">
                    {participants}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brouillard-clair">
                    participants
                  </p>
                </div>
                <div className="rounded-xl bg-card/85 p-3 text-center ring-1 ring-accent/25">
                  <p className="font-display text-xl font-semibold tabular-nums text-gold-vif">
                    {euros(Math.round(moyenne))}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brouillard-clair">
                    moyenne
                  </p>
                </div>
                <div className="rounded-xl bg-card/85 p-3 text-center ring-1 ring-accent/25">
                  <p className="font-display text-xl font-semibold tabular-nums text-gold-vif">
                    {nbMembres ? Math.round((participants / nbMembres) * 100) : 0}%
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-brouillard-clair">
                    des frères
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Ajouter / modifier : le formulaire du trésorier ─── */}
          <FormulaireContribution categorieDefaut="ZIYARA" categories={['ZIYARA']} />

          {/* ─── Toutes les entrées ziyara (modifier le montant ici) ─── */}
          {entreesZiyara.length > 0 && (
            <div className="rounded-2xl border border-accent/25 bg-card p-4 shadow-sm">
              <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-vif">
                <HeartHandshake className="h-3.5 w-3.5" /> Entrées ziyara — cliquer sur le crayon pour modifier un montant
              </p>
              <ul className="defile-fin max-h-72 divide-y divide-or-pale overflow-y-auto">
                {entreesZiyara.map((c, i) => (
                  <LigneContribution
                    key={c.id}
                    id={c.id}
                    index={i}
                    membre={c.member.name}
                    montant={c.amount}
                    categorie={c.category}
                    note={c.note}
                    date={c.date}
                    onDeleted={() => {}}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* ─── Récapitulatif par membre ─── */}
          {parMembre.length > 0 && (
            <div className="rounded-2xl border border-accent/25 bg-card p-4 shadow-sm">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-vif">
                <Gift className="h-3.5 w-3.5" /> Par frère
              </p>
              <ul className="divide-y divide-or-pale">
                {parMembre.map((p) => (
                  <li key={p.name} className="flex items-center justify-between py-2.5">
                    <span className="text-sm font-medium text-secondary-foreground">
                      Sidi {p.name}
                      <span className="ml-2 text-xs text-brouillard-clair">
                        {p.count} fois · dern. {dateCourte(p.derniere)}
                      </span>
                    </span>
                    <span className="rounded-full bg-accent/12 px-3 py-1 text-sm font-bold tabular-nums text-gold-vif">
                      {euros(p.total)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {parMembre.length === 0 && (
            <p className="rounded-2xl border border-dashed border-accent/40 bg-card/60 p-6 text-center text-sm leading-relaxed text-brouillard">
              <Gift className="mx-auto mb-2 h-5 w-5 text-accent" />
              Aucune ziyara pour l'instant.
              <br />
              Dès qu'une contribution entre dans la <strong className="text-gold-vif">colonne ziyara</strong>,
              le montant pour le Shaykh se calcule tout seul.
            </p>
          )}
        </div>
      )}
    </SectionShell>
  )
}

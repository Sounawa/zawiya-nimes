'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Banknote, CalendarDays, CalendarRange, Download, Printer, TrendingUp, Users } from 'lucide-react'
import { useContributions } from '@/lib/api'
import { usePrint, useUser } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { euros } from '@/lib/format'
import { SectionShell } from './ijtima-section'
import { FormulaireContribution, LigneContribution, Compteur, Progression } from './contribution-shared'
import { cn } from '@/lib/utils'
import type { Contribution } from '@/lib/types'

/* ═══════════════ Export CSV — réservé au trésorier (respecte le filtre de période) ═══════════════ */
function exporterCSV(
  contributions: Contribution[],
  totalCaisse: number,
  totalZiyara: number,
  periode?: { cle: string; label: string } | null
) {
  const suffixe = periode ? `-${periode.cle}` : ''
  const entete = periode
    ? [`Comptes de la Zawiya Nîmes — ${periode.label}`]
    : [`Comptes de la Zawiya Nîmes — toutes périodes`]
  const lignes = [
    ...entete,
    'Date;Frère;Catégorie;Montant (€);Note;Enregistré par',
    ...contributions
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((c) =>
        [
          new Date(c.date).toLocaleDateString('fr-FR'),
          c.member.name,
          c.category === 'COTISATION' ? 'Cotisation' : c.category === 'ZIYARA' ? 'Ziyara' : 'Don',
          String(c.amount).replace('.', ','),
          (c.note ?? '').replace(/[;\n]/g, ' '),
          c.recordedBy ?? '',
        ].join(';')
      ),
    '',
    `TOTAL CAISSE (cotisations & dons);;${String(totalCaisse).replace('.', ',')}`,
    periode ? '' : `TOTAL ZIYARA;;${String(totalZiyara).replace('.', ',')}`,
  ]
  // BOM UTF-8 pour qu'Excel affiche correctement les accents
  const blob = new Blob(['\uFEFF' + lignes.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `comptes-zawiya-nimes${suffixe}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/* ═══════════════ Export CSV du bilan annuel — trésorier (assemblée) ═══════════════ */
function exporterBilanCSV(contributions: Contribution[]) {
  if (!contributions.length) return
  const annee = new Date(contributions[0].date).getFullYear()
  const deLAnnee = contributions.filter((c) => new Date(c.date).getFullYear() === annee)

  /* Décomposition mensuelle */
  const parMois = new Map<string, { cotisation: number; don: number; ziyara: number }>()
  for (const c of deLAnnee) {
    const cle = c.date.substring(0, 7)
    const b = parMois.get(cle) ?? { cotisation: 0, don: 0, ziyara: 0 }
    if (c.category === 'COTISATION') b.cotisation += c.amount
    else if (c.category === 'DON') b.don += c.amount
    else b.ziyara += c.amount
    parMois.set(cle, b)
  }

  /* Top contributeurs — caisse */
  const parFrere = new Map<string, number>()
  for (const c of deLAnnee) {
    if (c.category === 'ZIYARA') continue
    parFrere.set(c.member.name, (parFrere.get(c.member.name) ?? 0) + c.amount)
  }
  const top = Array.from(parFrere.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)

  const caisse = deLAnnee
    .filter((c) => c.category !== 'ZIYARA')
    .reduce((s, c) => s + c.amount, 0)
  const ziyara = deLAnnee
    .filter((c) => c.category === 'ZIYARA')
    .reduce((s, c) => s + c.amount, 0)

  const e = (n: number) => String(n).replace('.', ',')
  const lignes = [
    `Bilan annuel de la Zawiya Nîmes — ${annee}`,
    '',
    'CHIFFRES CLÉS',
    `Caisse (cotisations & dons);${e(caisse)}`,
    `Ziyara (pour le Shaykh);${e(ziyara)}`,
    `Total;${e(caisse + ziyara)}`,
    `Entrées;${deLAnnee.length}`,
    '',
    'TRÉSORERIE MOIS PAR MOIS',
    'Mois;Cotisations;Dons;Caisse;Ziyara;Total',
    ...Array.from(parMois.entries())
      .sort()
      .map(([cle, b]) => {
        const [a, m] = cle.split('-')
        const d = new Date(Number(a), Number(m) - 1, 1)
        const label = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(d)
        return [
          label,
          e(b.cotisation),
          e(b.don),
          e(b.cotisation + b.don),
          e(b.ziyara),
          e(b.cotisation + b.don + b.ziyara),
        ].join(';')
      }),
    '',
    'PRINCIPAUX CONTRIBUTEURS — CAISSE',
    'Frère;Montant',
    ...top.map(([nom, montant]) => `${nom};${e(montant)}`),
  ]

  const blob = new Blob(['\uFEFF' + lignes.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bilan-annuel-zawiya-nimes-${annee}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/* ═══════════════ Graphe mensuel animé — évolution de la caisse ═══════════════ */
function GrapheMensuel({ cotisations }: { cotisations: { amount: number; category: string; date: string }[] }) {
  // Regrouper par mois sur les 6 derniers mois (hors ziyara — trésorerie commune)
  const mois = useMemo(() => {
    const maintenant = new Date()
    const buckets: { cle: string; label: string; annee: number; total: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1)
      buckets.push({
        cle: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d),
        annee: d.getFullYear(),
        total: 0,
      })
    }
    const index = new Map(buckets.map((b) => [b.cle, b]))
    for (const c of cotisations) {
      if (c.category === 'ZIYARA') continue
      const cle = c.date.substring(0, 7)
      const b = index.get(cle)
      if (b) b.total += c.amount
    }
    return buckets
  }, [cotisations])

  const max = Math.max(0, ...mois.map((m) => m.total))
  const dernier = mois[mois.length - 1]
  const precedent = mois[mois.length - 2]
  const tendance =
    dernier && precedent && precedent.total > 0
      ? Math.round(((dernier.total - precedent.total) / precedent.total) * 100)
      : null

  return (
    <div className="rounded-2xl border border-primary/12 bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <CalendarRange className="h-3.5 w-3.5 text-primary" /> Évolution — 6 mois
        </p>
        {tendance !== null && tendance !== 0 && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
              tendance > 0
                ? 'bg-primary/10 text-primary'
                : 'bg-destructive/10 text-destructive'
            )}
          >
            {tendance > 0 ? '▲' : '▼'} {Math.abs(tendance)}%
          </span>
        )}
      </div>
      <div className="flex h-28 items-end justify-between gap-2">
        {mois.map((m, i) => {
          const pct = max > 0 ? Math.max(4, Math.round((m.total / max) * 100)) : 4
          const estCourant = i === mois.length - 1
          return (
            <div key={m.cle} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-[9px] font-bold tabular-nums text-brouillard">
                {m.total > 0 ? euros(m.total).replace('€', '').trim() : '—'}
              </span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'w-full max-w-10 rounded-t-lg',
                  estCourant
                    ? 'bg-gradient-to-t from-primary to-sauge shadow-md shadow-primary/20'
                    : 'bg-gradient-to-t from-accent/70 to-gold-clair/80'
                )}
                title={`${m.label} ${m.annee} — ${euros(m.total)}`}
              />
              <span
                className={cn(
                  'text-[10px] font-semibold capitalize',
                  estCourant ? 'text-primary' : 'text-brouillard-clair'
                )}
              >
                {m.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════ Section COTISATIONS — la caisse ═══════════════ */
export function CotisationSection() {
  const { data, isLoading } = useContributions()
  const role = useUser((s) => s.role)
  const imprimer = usePrint((s) => s.imprimer)
  const { toast } = useToast()

  const [filtre, setFiltre] = useState<'TOUS' | 'COTISATION' | 'DON'>('TOUS')
  const [periode, setPeriode] = useState<string>('TOUTES')

  const cotisations = data?.contributions ?? []
  const totals = data?.totals

  // Mois disponibles (ayant au moins une entrée, hors ziyara) — du plus récent au plus ancien
  const moisDisponibles = useMemo(() => {
    const s = new Set<string>()
    for (const c of cotisations) {
      if (c.category === 'ZIYARA') continue
      s.add(c.date.substring(0, 7))
    }
    return Array.from(s)
      .sort()
      .reverse()
      .map((cle) => {
        const [a, m] = cle.split('-')
        const d = new Date(Number(a), Number(m) - 1, 1)
        return {
          cle,
          label: new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(d),
          court: new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' }).format(d),
        }
      })
  }, [cotisations])

  const periodeSelectionnee = moisDisponibles.find((m) => m.cle === periode) ?? null

  // Entrées visibles : filtre catégorie (hors ziyara) + filtre période
  const cotisationsVisibles = useMemo(
    () =>
      cotisations.filter((c) => {
        if (c.category === 'ZIYARA') return false
        if (filtre !== 'TOUS' && c.category !== filtre) return false
        if (periodeSelectionnee && !c.date.startsWith(periodeSelectionnee.cle)) return false
        return true
      }),
    [cotisations, filtre, periodeSelectionnee]
  )

  // Totaux de la période sélectionnée (pour l'export et l'en-tête d'historique)
  const totalPeriode = useMemo(
    () => cotisationsVisibles.reduce((somme, c) => somme + c.amount, 0),
    [cotisationsVisibles]
  )

  // Qui a donné quoi (par membre) — hors ziyara, gérée séparément par le trésorier
  // (respecte la période sélectionnée : le classement reflète le mois affiché)
  const parMembre = useMemo(() => {
    const m = new Map<string, { name: string; total: number; count: number }>()
    for (const c of cotisationsVisibles) {
      const e = m.get(c.memberId) ?? { name: c.member.name, total: 0, count: 0 }
      e.total += c.amount
      e.count += 1
      m.set(c.memberId, e)
    }
    return Array.from(m.values()).sort((a, b) => b.total - a.total)
  }, [cotisationsVisibles])

  const maxMembre = Math.max(0, ...parMembre.map((p) => p.total))

  const listeFiltree = cotisationsVisibles.slice(0, 30)

  return (
    <SectionShell
      titre="Cotisations"
      compteur={totals ? `${cotisations.filter((c) => c.category !== 'ZIYARA').length} entrées` : undefined}
      id="cotisations"
    >
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-sand/60" />
      ) : (
        <div className="space-y-4">
          {/* Carte caisse */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-card via-feuille to-feuille p-6 shadow-sm">
            <div className="pattern-lattice absolute inset-0" aria-hidden />
            <div className="relative">
              <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
                <Banknote className="h-4 w-4" /> La Caisse
              </p>
              <Compteur valeur={totals ? totals.COTISATION + totals.DON : 0} libelle="Cotisations & dons cumulés" />
              {role === 'TREASURER' && totals && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      exporterCSV(
                        periodeSelectionnee ? cotisationsVisibles : cotisations,
                        periodeSelectionnee ? totalPeriode : totals.COTISATION + totals.DON,
                        totals.ZIYARA,
                        periodeSelectionnee
                      )
                      toast({
                        title: 'Export CSV prêt',
                        description: periodeSelectionnee
                          ? `${cotisationsVisibles.length} entrées — ${periodeSelectionnee.label} (${euros(totalPeriode)})`
                          : `${cotisations.length} entrées — caisse ${euros(totals.COTISATION + totals.DON)}`,
                      })
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/45 bg-card/70 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-gold-vif transition-all hover:bg-or-pale hover:shadow-md active:scale-[0.98]"
                  >
                    <Download className="h-3.5 w-3.5" /> CSV{periodeSelectionnee ? ' · période' : ''}
                  </button>
                  <button
                    onClick={() => imprimer({ kind: 'comptes' })}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 bg-card/70 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-primary transition-all hover:bg-feuille hover:shadow-md active:scale-[0.98]"
                  >
                    <Printer className="h-3.5 w-3.5" /> Imprimer / PDF
                  </button>
                </div>
              )}
              {role === 'TREASURER' && totals && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => imprimer({ kind: 'bilan' })}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-sauge/50 bg-card/70 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-sauge transition-all hover:bg-feuille hover:shadow-md active:scale-[0.98]"
                  >
                    <CalendarRange className="h-3.5 w-3.5" /> Bilan annuel
                  </button>
                  <button
                    onClick={() => {
                      exporterBilanCSV(cotisations)
                      toast({
                        title: 'Bilan annuel exporté',
                        description: `CSV prêt pour l'assemblée générale`,
                      })
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-sauge/50 bg-card/70 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-sauge transition-all hover:bg-feuille hover:shadow-md active:scale-[0.98]"
                  >
                    <Download className="h-3.5 w-3.5" /> Bilan CSV
                  </button>
                </div>
              )}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-card/80 p-3 text-center ring-1 ring-primary/10">
                  <p className="font-display text-xl font-semibold tabular-nums text-primary">
                    {totals ? euros(totals.COTISATION) : '—'}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brouillard">Cotisations</p>
                </div>
                <div className="rounded-xl bg-card/80 p-3 text-center ring-1 ring-primary/10">
                  <p className="font-display text-xl font-semibold tabular-nums text-sauge">
                    {totals ? euros(totals.DON) : '—'}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brouillard">Dons</p>
                </div>
              </div>
            </div>
          </div>

          <FormulaireContribution categorieDefaut="COTISATION" categories={['COTISATION', 'DON']} />

          {/* Évolution mensuelle de la caisse */}
          {cotisations.length > 0 && <GrapheMensuel cotisations={cotisations} />}

          {/* Classement des contributeurs */}
          {parMembre.length > 0 && (
            <div className="rounded-2xl border border-primary/12 bg-card p-4 shadow-sm">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                <Users className="h-3.5 w-3.5 text-primary" /> Qui a donné
              </p>
              <ul className="space-y-3">
                {parMembre.map((p, i) => (
                  <li key={p.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-secondary-foreground">
                        <span className="mr-1.5 inline-grid h-5 w-5 place-items-center rounded-full bg-sand text-[10px] font-bold text-muted-foreground">
                          {i + 1}
                        </span>
                        Sidi {p.name}
                      </span>
                      <span className="font-bold tabular-nums text-primary">{euros(p.total)}</span>
                    </div>
                    <Progression valeur={p.total} max={maxMembre} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Historique — filtrable par catégorie et par mois */}
          <div className="rounded-2xl border border-primary/12 bg-card p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-primary" /> Historique
                <span className="rounded-full bg-sand px-2 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                  {cotisationsVisibles.length} · {euros(totalPeriode)}
                </span>
              </p>
              <div className="flex gap-1">
                {(['TOUS', 'COTISATION', 'DON'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFiltre(f)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors',
                      filtre === f
                        ? 'bg-primary text-white'
                        : 'bg-sand text-muted-foreground hover:bg-sable-vif'
                    )}
                  >
                    {f === 'TOUS' ? 'Tous' : f === 'COTISATION' ? 'Cotis.' : 'Dons'}
                  </button>
                ))}
              </div>
            </div>

            {/* Pastilles de période — le CSV du trésorier suit la sélection */}
            {moisDisponibles.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-brouillard" aria-hidden />
                <button
                  onClick={() => setPeriode('TOUTES')}
                  aria-pressed={periode === 'TOUTES'}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors',
                    periode === 'TOUTES'
                      ? 'bg-gold text-white shadow-sm dark:text-accent-foreground'
                      : 'bg-sand text-brouillard hover:bg-sable-vif'
                  )}
                >
                  Toutes
                </button>
                {moisDisponibles.map((m) => (
                  <button
                    key={m.cle}
                    onClick={() => setPeriode(m.cle)}
                    aria-pressed={periode === m.cle}
                    title={m.label}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[10px] font-bold capitalize tracking-wider transition-colors',
                      periode === m.cle
                        ? 'bg-gold text-white shadow-sm dark:text-accent-foreground'
                        : 'bg-sand text-brouillard hover:bg-sable-vif'
                    )}
                  >
                    {m.court}
                  </button>
                ))}
                {role === 'TREASURER' && periodeSelectionnee && (
                  <span className="ml-1 hidden text-[10px] italic text-brouillard sm:inline">
                    l'export CSV suivra cette période
                  </span>
                )}
              </div>
            )}

            <ul className="defile-fin max-h-72 divide-y divide-sand overflow-y-auto">
              <AnimatePresence initial={false}>
                {listeFiltree.map((c, i) => (
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
              </AnimatePresence>
              {listeFiltree.length === 0 && (
                <li className="p-4 text-center text-sm text-brouillard">Aucune entrée sur cette période.</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </SectionShell>
  )
}

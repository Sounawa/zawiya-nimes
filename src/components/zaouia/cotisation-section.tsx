'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Banknote, Coins, Gift, HandCoins, Plus, Trash2, TrendingUp, Users } from 'lucide-react'
import { useContributions, useCreateContribution, useDeleteContribution, useMembers } from '@/lib/api'
import { useUser } from '@/lib/store'
import { euros, dateCourte } from '@/lib/format'
import { SectionShell } from './ijtima-section'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { key: 'COTISATION', label: 'Cotisation', icone: Coins },
  { key: 'ZIYARA', label: 'Ziyara', icone: Gift },
  { key: 'DON', label: 'Don', icone: HandCoins },
] as const

/* ═══════════════ Grand compteur animé ═══════════════ */
function Compteur({ valeur, libelle }: { valeur: number; libelle: string }) {
  const chiffres = euros(valeur)
  return (
    <div className="text-center">
      <motion.p
        key={chiffres}
        initial={{ opacity: 0, y: 8, filter: 'blur(3px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.4 }}
        className="font-display text-4xl font-semibold tabular-nums text-[#123c2d] sm:text-5xl"
      >
        {chiffres}
      </motion.p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#a09a87]">
        {libelle}
      </p>
    </div>
  )
}

/* ═══════════════ Barre de progression dorée ═══════════════ */
function Progression({ valeur, max }: { valeur: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((valeur / max) * 100)) : 0
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#efe9dc]">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full bg-gradient-to-r from-[#c9a24b] to-[#e2c98a]"
      />
    </div>
  )
}

/* ═══════════════ Formulaire d'ajout ═══════════════ */
function FormulaireContribution({ categorieDefaut }: { categorieDefaut: 'COTISATION' | 'ZIYARA' }) {
  const { data: membres } = useMembers()
  const create = useCreateContribution()
  const name = useUser((s) => s.name)
  const { toast } = useToast()

  const [membre, setMembre] = useState('')
  const [montant, setMontant] = useState('')
  const [categorie, setCategorie] = useState<string>(categorieDefaut)
  const [note, setNote] = useState('')

  const membresPossibles = useMemo(() => {
    if (!membres) return []
    const sansNom = (name && membres.find((m) => m.name === name)) || null
    return sansNom ? [sansNom, ...membres.filter((m) => m.id !== sansNom.id)] : membres
  }, [membres, name])

  const enregistrer = () => {
    const m = parseFloat(montant.replace(',', '.'))
    if (!membre || !m || m <= 0) {
      toast({
        title: 'Champs incomplets',
        description: 'Choisis un frère et un montant valide.',
        variant: 'destructive',
      })
      return
    }
    create.mutate(
      {
        memberId: membre,
        amount: m,
        category: categorie,
        note: note.trim() || null,
        recordedBy: name,
      },
      {
        onSuccess: (c) => {
          toast({
            title: 'Contribution enregistrée',
            description: `${euros(c.amount)} — ${c.member.name} (${c.category.toLowerCase()})`,
          })
          setMontant('')
          setNote('')
        },
        onError: () => toast({ title: 'Échec de l\u2019enregistrement', variant: 'destructive' }),
      }
    )
  }

  return (
    <div className="rounded-2xl border border-[#0b5d42]/12 bg-white p-4 shadow-sm">
      <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
        <Plus className="h-3.5 w-3.5 text-[#0b5d42]" /> Nouvelle entrée
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-[#5b6b60]">Frère</Label>
          <Select value={membre} onValueChange={setMembre}>
            <SelectTrigger className="rounded-xl border-[#0b5d42]/25 bg-white">
              <SelectValue placeholder="Choisir…" />
            </SelectTrigger>
            <SelectContent>
              {membresPossibles.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  Sidi {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-[#5b6b60]">Montant (€)</Label>
          <Input
            inputMode="decimal"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="20"
            className="rounded-xl border-[#0b5d42]/25 bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-[#5b6b60]">Colonne</Label>
          <div className="flex rounded-full border border-[#0b5d42]/20 bg-[#fbf9f4] p-0.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCategorie(c.key)}
                className={cn(
                  'relative flex-1 rounded-full px-2 py-1.5 text-xs font-semibold transition-colors',
                  categorie === c.key ? 'text-white' : 'text-[#78877d] hover:text-[#0b5d42]'
                )}
              >
                {categorie === c.key && (
                  <motion.span
                    layoutId={`seg-contrib-${categorieDefaut}`}
                    className="absolute inset-0 rounded-full bg-[#0b5d42]"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-[#5b6b60]">Note (facultatif)</Label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="mois de…"
            className="rounded-xl border-[#0b5d42]/25 bg-white"
          />
        </div>
      </div>
      <Button
        onClick={enregistrer}
        disabled={create.isPending}
        className="mt-3 w-full rounded-full bg-[#0b5d42] text-white hover:bg-[#0b3d2e]"
      >
        {create.isPending ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </div>
  )
}

/* ═══════════════ Ligne de contribution ═══════════════ */
function LigneContribution({
  id,
  membre,
  montant,
  categorie,
  note,
  date,
  onDeleted,
}: {
  id: string
  membre: string
  montant: number
  categorie: string
  note: string | null
  date: string
  onDeleted: () => void
}) {
  const del = useDeleteContribution()
  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -30 }}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[#fbf9f4]"
    >
      <span
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold',
          categorie === 'ZIYARA'
            ? 'bg-[#c9a24b]/15 text-[#a3781f]'
            : categorie === 'DON'
              ? 'bg-[#4a7c6b]/15 text-[#2f4d3e]'
              : 'bg-[#0b5d42]/10 text-[#0b5d42]'
        )}
        title={categorie}
      >
        {categorie === 'ZIYARA' ? <Gift className="h-4 w-4" /> : categorie === 'DON' ? <HandCoins className="h-4 w-4" /> : <Coins className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[#33453a]">
          Sidi {membre}
        </span>
        <span className="block text-xs text-[#a09a87]">
          {dateCourte(date)}
          {note ? ` · ${note}` : ''}
        </span>
      </span>
      <span className="text-sm font-bold tabular-nums text-[#0b5d42]">{euros(montant)}</span>
      <button
        onClick={() => del.mutate(id, { onSuccess: onDeleted })}
        aria-label="Supprimer"
        className="rounded-full p-1.5 text-[#b6b1a0] transition-colors hover:bg-[#b3452f]/10 hover:text-[#b3452f]"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.li>
  )
}

/* ═══════════════ Section COTISATIONS — la caisse ═══════════════ */
export function CotisationSection() {
  const { data, isLoading } = useContributions()
  const { data: membres } = useMembers()
  const [filtre, setFiltre] = useState<'TOUS' | 'COTISATION' | 'DON'>('TOUS')

  const cotisations = data?.contributions ?? []
  const totals = data?.totals

  // Qui a donné quoi (par membre)
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
      compteur={totals ? `${cotisations.length} entrées` : undefined}
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

          <FormulaireContribution categorieDefaut="COTISATION" />

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

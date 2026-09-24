'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Coins, Gift, HandCoins, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useCreateContribution, useDeleteContribution, useMembers, useUpdateContribution } from '@/lib/api'
import { useUser } from '@/lib/store'
import { euros, dateCourte } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { ContributionCategory } from '@/lib/types'

export const CATEGORIES: {
  key: ContributionCategory
  label: string
  icone: React.ElementType
}[] = [
  { key: 'COTISATION', label: 'Cotisation', icone: Coins },
  { key: 'ZIYARA', label: 'Ziyara', icone: Gift },
  { key: 'DON', label: 'Don', icone: HandCoins },
]

/* ═══════════════ Formulaire d'ajout d'une contribution ═══════════════ */
export function FormulaireContribution({
  categorieDefaut,
  categories,
}: {
  categorieDefaut: ContributionCategory
  categories: ContributionCategory[]
}) {
  const { data: membres } = useMembers()
  const create = useCreateContribution()
  const name = useUser((s) => s.name)
  const { toast } = useToast()

  const [membre, setMembre] = useState('')
  const [montant, setMontant] = useState('')
  const [categorie, setCategorie] = useState<string>(categorieDefaut)
  const [note, setNote] = useState('')

  const membresPossibles = (() => {
    if (!membres) return []
    const moi = (name && membres.find((m) => m.name === name)) || null
    return moi ? [moi, ...membres.filter((m) => m.id !== moi.id)] : membres
  })()

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
        onError: () => toast({ title: 'Échec de l’enregistrement', variant: 'destructive' }),
      }
    )
  }

  const colonnes = CATEGORIES.filter((c) => categories.includes(c.key))

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
            onKeyDown={(e) => e.key === 'Enter' && enregistrer()}
            placeholder="20"
            className="rounded-xl border-[#0b5d42]/25 bg-white"
          />
        </div>
        {colonnes.length > 1 && (
          <div className="space-y-1.5">
            <Label className="text-xs text-[#5b6b60]">Colonne</Label>
            <div className="flex rounded-full border border-[#0b5d42]/20 bg-[#fbf9f4] p-0.5">
              {colonnes.map((c) => (
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
        )}
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

/* ═══════════════ Ligne de contribution (avec édition du montant) ═══════════════ */
export function LigneContribution({
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
  const update = useUpdateContribution()
  const { toast } = useToast()
  const [edition, setEdition] = useState(false)
  const [nouveauMontant, setNouveauMontant] = useState(String(montant))

  const validerEdition = () => {
    const m = parseFloat(nouveauMontant.replace(',', '.'))
    if (!m || m <= 0) {
      toast({ title: 'Montant invalide', variant: 'destructive' })
      return
    }
    update.mutate(
      { id, amount: m },
      {
        onSuccess: (c) => {
          toast({ title: 'Montant modifié', description: `${euros(m)} — Sidi ${c.member.name}` })
          setEdition(false)
        },
      }
    )
  }

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

      {edition ? (
        <span className="flex items-center gap-1.5">
          <Input
            inputMode="decimal"
            value={nouveauMontant}
            onChange={(e) => setNouveauMontant(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && validerEdition()}
            autoFocus
            className="h-9 w-24 rounded-lg border-[#c9a24b]/50 bg-white text-sm tabular-nums"
            aria-label="Nouveau montant"
          />
          <button
            onClick={validerEdition}
            disabled={update.isPending}
            aria-label="Valider le montant"
            className="grid h-8 w-8 place-items-center rounded-full bg-[#0b5d42] text-white transition-transform hover:scale-105"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setEdition(false)
              setNouveauMontant(String(montant))
            }}
            aria-label="Annuler"
            className="grid h-8 w-8 place-items-center rounded-full bg-[#efe9dc] text-[#78877d] transition-transform hover:scale-105"
          >
            <X className="h-4 w-4" />
          </button>
        </span>
      ) : (
        <>
          <span className="text-sm font-bold tabular-nums text-[#0b5d42]">{euros(montant)}</span>
          <button
            onClick={() => setEdition(true)}
            aria-label="Modifier le montant"
            className="rounded-full p-1.5 text-[#b6b1a0] transition-colors hover:bg-[#0b5d42]/10 hover:text-[#0b5d42]"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => del.mutate(id, { onSuccess: onDeleted })}
            aria-label="Supprimer"
            className="rounded-full p-1.5 text-[#b6b1a0] transition-colors hover:bg-[#b3452f]/10 hover:text-[#b3452f]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </>
      )}
    </motion.li>
  )
}

/* ═══════════════ Compteur animé ═══════════════ */
export function Compteur({ valeur, libelle }: { valeur: number; libelle: string }) {
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
export function Progression({ valeur, max }: { valeur: number; max: number }) {
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

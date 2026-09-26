'use client'

import { useEffect, useRef, useState } from 'react'
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

  // « Moi » présélectionné — la plupart des saisies concernent le frère qui enregistre
  const moiId = membresPossibles[0]?.id
  const membreEffectif = membre || moiId || ''

  const enregistrer = () => {
    const m = parseFloat(montant.replace(',', '.'))
    if (!membreEffectif || !m || m <= 0) {
      toast({
        title: 'Champs incomplets',
        description: 'Choisis un frère et un montant valide.',
        variant: 'destructive',
      })
      return
    }
    create.mutate(
      {
        memberId: membreEffectif,
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
    <div className="rounded-2xl border border-primary/12 bg-card p-4 shadow-sm">
      <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        <Plus className="h-3.5 w-3.5 text-primary" /> Nouvelle entrée
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Frère</Label>
          <Select value={membreEffectif} onValueChange={setMembre}>
            <SelectTrigger className="rounded-xl border-primary/25 bg-card">
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
          <Label className="text-xs text-muted-foreground">Montant (€)</Label>
          <Input
            inputMode="decimal"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enregistrer()}
            placeholder="20"
            aria-label="Montant en euros"
            className="rounded-xl border-primary/25 bg-card"
          />
        </div>
        {colonnes.length > 1 && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Colonne</Label>
            <div className="flex rounded-full border border-primary/20 bg-background p-0.5">
              {colonnes.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategorie(c.key)}
                  className={cn(
                    'relative flex-1 rounded-full px-2 py-1.5 text-xs font-semibold transition-colors',
                    categorie === c.key ? 'text-white' : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  {categorie === c.key && (
                    <motion.span
                      layoutId={`seg-contrib-${categorieDefaut}`}
                      className="absolute inset-0 rounded-full bg-primary"
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
          <Label className="text-xs text-muted-foreground">Note (facultatif)</Label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="mois de…"
            className="rounded-xl border-primary/25 bg-card"
          />
        </div>
      </div>
      <Button
        onClick={enregistrer}
        disabled={create.isPending}
        className="mt-3 w-full rounded-full bg-primary text-white hover:bg-emerald-deep"
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
  index = 0,
  onDeleted,
}: {
  id: string
  membre: string
  montant: number
  categorie: string
  note: string | null
  date: string
  index?: number
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
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.045, 0.6), ease: 'easeOut' }}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-background"
    >
      <span
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold',
          categorie === 'ZIYARA'
            ? 'bg-accent/15 text-gold-vif'
            : categorie === 'DON'
              ? 'bg-sauge/15 text-forest'
              : 'bg-primary/10 text-primary'
        )}
        title={categorie}
      >
        {categorie === 'ZIYARA' ? <Gift className="h-4 w-4" /> : categorie === 'DON' ? <HandCoins className="h-4 w-4" /> : <Coins className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-secondary-foreground">
          Sidi {membre}
        </span>
        <span className="block text-xs text-brouillard">
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
            className="h-9 w-24 rounded-lg border-accent/50 bg-card text-sm tabular-nums"
            aria-label="Nouveau montant"
          />
          <button
            onClick={validerEdition}
            disabled={update.isPending}
            aria-label="Valider le montant"
            className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white transition-transform hover:scale-105"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setEdition(false)
              setNouveauMontant(String(montant))
            }}
            aria-label="Annuler"
            className="grid h-8 w-8 place-items-center rounded-full bg-sand text-muted-foreground transition-transform hover:scale-105"
          >
            <X className="h-4 w-4" />
          </button>
        </span>
      ) : (
        <>
          <span className="text-sm font-bold tabular-nums text-primary">{euros(montant)}</span>
          <button
            onClick={() => setEdition(true)}
            aria-label="Modifier le montant"
            className="rounded-full p-2 text-brouillard transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => del.mutate(id, { onSuccess: onDeleted })}
            aria-label="Supprimer"
            className="rounded-full p-2 text-brouillard transition-colors hover:bg-destructive/10 hover:text-destructive"
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
  const [affiche, setAffiche] = useState(0)
  // Référentiel de la valeur affichée — sert de point de départ au décompte
  const afficheRef = useRef(0)

  useEffect(() => {
    const depart = afficheRef.current
    const arrivee = valeur
    const duree = 900
    const debut = performance.now()
    let raf = 0
    const pas = (t: number) => {
      const p = Math.min(1, (t - debut) / duree)
      // easeOutExpo — départ vif, arrivée douce
      const e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      const v = Math.round((depart + (arrivee - depart) * e) * 100) / 100
      afficheRef.current = v
      setAffiche(v)
      if (p < 1) raf = requestAnimationFrame(pas)
    }
    raf = requestAnimationFrame(pas)
    return () => cancelAnimationFrame(raf)
  }, [valeur])

  return (
    <div className="text-center">
      <p className="font-display text-4xl font-semibold tabular-nums text-encre sm:text-5xl">
        {euros(affiche)}
      </p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-brouillard">
        {libelle}
      </p>
    </div>
  )
}

/* ═══════════════ Barre de progression dorée ═══════════════ */
export function Progression({ valeur, max }: { valeur: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((valeur / max) * 100)) : 0
  return (
    <div className="h-2 overflow-hidden rounded-full bg-sand">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full bg-gradient-to-r from-accent to-gold-clair"
      />
    </div>
  )
}

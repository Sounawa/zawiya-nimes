'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BadgeCheck, Check, Clock3, Coins, Gift, HandCoins, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  useConfirmContribution,
  useContributions,
  useCreateContribution,
  useDeleteContribution,
  useMembers,
  useUpdateContribution,
} from '@/lib/api'
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
import type { Contribution, ContributionCategory } from '@/lib/types'

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
  confirme,
  onDeleted,
}: {
  id: string
  membre: string
  montant: number
  categorie: string
  note: string | null
  date: string
  index?: number
  confirme?: boolean | null // undefined = sans objet (ziyara)
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
          {confirme === true && (
            <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
              <BadgeCheck className="h-2.5 w-2.5" /> reçu
            </span>
          )}
          {confirme === false && (
            <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-gold/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-gold-vif">
              <Clock3 className="h-2.5 w-2.5" /> à confirmer
            </span>
          )}
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

/* ═══════════════════════════════════════════════════════════════
   MA COTISATION — chaque participant déclare la somme qu'il a mise.

   Nouveau modèle voulu par la zawiya : plus personne ne saisit pour
   les autres. Chacun déclare ce qu'il a mis dans la caisse ; le
   référent cotisations voit la liste et confirme.
   ═══════════════════════════════════════════════════════════════ */
const JETONS_MONTANT = [5, 10, 20, 50]

export function MaCotisation() {
  const { data: membres } = useMembers()
  const { data } = useContributions()
  const create = useCreateContribution()
  const name = useUser((s) => s.name)
  const { toast } = useToast()

  const [montant, setMontant] = useState('')
  const [categorie, setCategorie] = useState<'COTISATION' | 'DON'>('COTISATION')
  const [note, setNote] = useState('')

  const moi = useMemo(() => membres?.find((m) => m.name === name) ?? null, [membres, name])

  const maintenant = new Date()
  const cleMois = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`
  const moisLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(maintenant)

  const mesEntrees = useMemo(
    () =>
      (data?.contributions ?? []).filter(
        (c) => c.memberId === moi?.id && c.category !== 'ZIYARA' && c.date.startsWith(cleMois)
      ),
    [data, moi?.id, cleMois]
  )
  const monTotal = mesEntrees.reduce((s, c) => s + c.amount, 0)
  const monAttente = mesEntrees.filter((c) => !c.confirmedAt).reduce((s, c) => s + c.amount, 0)

  const declarer = () => {
    if (!moi) {
      toast({
        title: 'Prénom inconnu',
        description: 'Ton prénom ne figure pas dans l’annuaire — choisis-le dans les réglages.',
        variant: 'destructive',
      })
      return
    }
    const m = parseFloat(montant.replace(',', '.'))
    if (!m || m <= 0) {
      toast({ title: 'Montant invalide', description: 'Indique la somme que tu as mise.', variant: 'destructive' })
      return
    }
    create.mutate(
      {
        memberId: moi.id,
        amount: m,
        category: categorie,
        note: note.trim() || null,
        recordedBy: name,
      },
      {
        onSuccess: (c) => {
          toast({
            title: 'Somme déclarée',
            description: `${euros(c.amount)} — le référent cotisations la confirmera`,
          })
          setMontant('')
          setNote('')
        },
        onError: () => toast({ title: 'Échec de la déclaration', variant: 'destructive' }),
      }
    )
  }

  return (
    <div className="coins-andalous relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-feuille to-feuille p-5 shadow-sm">
      <div className="filigrane-khatim absolute inset-0" aria-hidden />
      <div className="relative">
        <p className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
          <HandCoins className="h-4 w-4" /> Ma cotisation
        </p>
        <p className="mb-4 text-xs text-brouillard">
          Indique la somme que tu as mise dans la caisse — le référent cotisations la confirmera.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Combien as-tu mis ? (€)</Label>
            <Input
              inputMode="decimal"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && declarer()}
              placeholder="20"
              aria-label="La somme mise en euros"
              className="rounded-xl border-primary/25 bg-card text-base font-semibold"
            />
            <div className="flex gap-1.5 pt-0.5">
              {JETONS_MONTANT.map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => setMontant(String(j))}
                  aria-label={`Déclarer ${j} euros`}
                  className={cn(
                    'tuile-khatim-sm flex-1 p-[1.5px] transition-all active:scale-95',
                    montant === String(j) ? 'bg-primary' : 'bg-gold/45 hover:bg-gold/75'
                  )}
                >
                  <span
                    className={cn(
                      'tuile-khatim-sm block py-1.5 text-xs font-bold tabular-nums',
                      montant === String(j) ? 'bg-primary text-white' : 'bg-card/85 text-gold-vif'
                    )}
                  >
                    {j}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">C'est quoi ?</Label>
            <div className="flex rounded-full border border-primary/20 bg-background p-0.5">
              {(['COTISATION', 'DON'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategorie(c)}
                  className={cn(
                    'relative flex-1 rounded-full px-2 py-1.5 text-xs font-semibold transition-colors',
                    categorie === c ? 'text-white' : 'text-muted-foreground hover:text-primary'
                  )}
                >
                  {categorie === c && (
                    <motion.span
                      layoutId="seg-ma-cotisation"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{c === 'COTISATION' ? 'Cotisation' : 'Don'}</span>
                </button>
              ))}
            </div>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (facultatif)"
              className="rounded-xl border-primary/25 bg-card"
            />
          </div>
        </div>

        <Button
          onClick={declarer}
          disabled={create.isPending}
          className="mt-3 w-full rounded-full bg-primary text-white hover:bg-emerald-deep"
        >
          {create.isPending ? 'Déclaration…' : 'Déclarer ma somme'}
        </Button>

        {mesEntrees.length > 0 && (
          <div className="mt-4 border-t border-primary/10 pt-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brouillard">
              Tes sommes de {moisLabel} · {euros(monTotal)}
              {monAttente > 0 && ` · ${euros(monAttente)} à confirmer`}
            </p>
            <ul className="space-y-1.5">
              {mesEntrees.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg bg-card/70 px-3 py-1.5 text-sm">
                  <span className="min-w-0 text-secondary-foreground">
                    <span className="font-bold tabular-nums">{euros(c.amount)}</span>
                    <span className="ml-2 text-xs text-brouillard">
                      {dateCourte(c.date)}
                      {c.note ? ` · ${c.note}` : ''}
                    </span>
                  </span>
                  {c.confirmedAt ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                      <BadgeCheck className="h-3.5 w-3.5" /> reçu
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-gold-vif">
                      <Clock3 className="h-3.5 w-3.5" /> en attente
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   LE REGISTRE DU RÉFÉRENT — la liste des cotisants, à confirmer.

   Le référent cotisations (le trésorier) coche « il a donné » : toutes
   les sommes en attente du frère passent à « reçues ». Un nouveau clic
   retire la confirmation (erreur de saisie, par exemple).

   La confirmation est désormais RÉSERVÉE au trésorier — et au
   référent de la zaouia, qui peut tout faire. La liste des
   cotisants reste visible aux frères de Nîmes.
   ═══════════════════════════════════════════════════════════════ */
const RESERVER_AU_TRESORIER = true

export function RegistreReferent({
  periode,
  periodeSelectionnee,
  moisDisponibles,
  onPeriodeChange,
  role,
}: {
  periode: string
  periodeSelectionnee: { cle: string; label: string } | null
  moisDisponibles: { cle: string; label: string; court: string }[]
  onPeriodeChange: (cle: string) => void
  role: string
}) {
  const { data } = useContributions()
  const { data: membres } = useMembers()
  const confirm = useConfirmContribution()
  const name = useUser((s) => s.name)
  const { toast } = useToast()

  /* Trésorier — ou référent, qui porte toutes les charges */
  const peutConfirmer = !RESERVER_AU_TRESORIER || role === 'TREASURER' || role === 'REFERENT'

  const entrees = useMemo(
    () =>
      (data?.contributions ?? []).filter(
        (c) =>
          c.category !== 'ZIYARA' &&
          (!periodeSelectionnee || c.date.startsWith(periodeSelectionnee.cle))
      ),
    [data, periodeSelectionnee]
  )

  const parMembre = useMemo(() => {
    const m = new Map<string, { id: string; name: string; entrees: Contribution[]; total: number }>()
    for (const c of entrees) {
      const e = m.get(c.memberId) ?? { id: c.memberId, name: c.member.name, entrees: [], total: 0 }
      e.entrees.push(c)
      e.total += c.amount
      m.set(c.memberId, e)
    }
    return Array.from(m.values()).sort((a, b) => b.total - a.total)
  }, [entrees])

  const nbConfirmes = entrees.filter((c) => c.confirmedAt).length
  const nbAttente = entrees.length - nbConfirmes
  const totalConfirme = entrees.filter((c) => c.confirmedAt).reduce((s, c) => s + c.amount, 0)
  const totalAttente = entrees.filter((c) => !c.confirmedAt).reduce((s, c) => s + c.amount, 0)
  const sansDeclaration = Math.max(0, (membres?.length ?? 0) - parMembre.length)

  const confirmerMembre = (m: { name: string; entrees: Contribution[] }) => {
    const aConfirmer = m.entrees.filter((c) => !c.confirmedAt)
    if (!aConfirmer.length) return
    Promise.all(
      aConfirmer.map((c) => confirm.mutateAsync({ id: c.id, confirm: true, actor: name ?? undefined }))
    )
      .then(() =>
        toast({
          title: `${m.name} a donné`,
          description: `${aConfirmer.length} somme${aConfirmer.length > 1 ? 's' : ''} confirmée${aConfirmer.length > 1 ? 's' : ''}`,
        })
      )
      .catch(() => toast({ title: 'Échec de la confirmation', variant: 'destructive' }))
  }

  const retirerMembre = (m: { name: string; entrees: Contribution[] }) => {
    const confirmees = m.entrees.filter((c) => c.confirmedAt)
    Promise.all(
      confirmees.map((c) => confirm.mutateAsync({ id: c.id, confirm: false, actor: name ?? undefined }))
    )
      .then(() => toast({ title: 'Confirmation retirée', description: `Sommes de ${m.name} de nouveau en attente` }))
      .catch(() => toast({ title: 'Échec', variant: 'destructive' }))
  }

  return (
    <div className="rounded-2xl border border-primary/12 bg-card p-4 shadow-sm">
      <p className="mb-1 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        <BadgeCheck className="h-3.5 w-3.5 text-primary" /> Le registre du référent
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold tabular-nums text-primary">
          {nbConfirmes} reçu{nbConfirmes > 1 ? 's' : ''}
        </span>
        {nbAttente > 0 && (
          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold tabular-nums text-gold-vif">
            {nbAttente} à confirmer
          </span>
        )}
      </p>
      <p className="mb-3 text-[11px] italic text-brouillard">
        {periodeSelectionnee ? periodeSelectionnee.label : 'Toutes périodes'} — {euros(totalConfirme)} confirmés
        {totalAttente > 0 ? ` · ${euros(totalAttente)} en attente` : ''}
        {!RESERVER_AU_TRESORIER
          ? ' · ouvert à tous pour le moment'
          : !peutConfirmer && ' · la confirmation revient au trésorier'}
      </p>

      {/* Pastilles de période — le registre suit la sélection */}
      {moisDisponibles.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => onPeriodeChange('TOUTES')}
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
              onClick={() => onPeriodeChange(m.cle)}
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
        </div>
      )}

      <ul className="defile-fin max-h-96 space-y-2 overflow-y-auto pr-0.5">
        {parMembre.map((m) => {
          const toutConfirme = m.entrees.length > 0 && m.entrees.every((c) => c.confirmedAt)
          return (
            <li key={m.id} className="rounded-xl border border-primary/8 bg-background/40 p-3">
              <div className="flex items-center gap-2.5">
                <span className="pastille-arche grid h-9 w-9 shrink-0 place-items-center bg-sand text-xs font-bold text-muted-foreground">
                  {m.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-secondary-foreground">
                    Sidi {m.name}
                  </span>
                  <span className="block text-[10px] text-brouillard">
                    {m.entrees.length} somme{m.entrees.length > 1 ? 's' : ''}
                    {toutConfirme ? ' · tout est reçu' : ' · en attente'}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-primary">{euros(m.total)}</span>
                {peutConfirmer &&
                  (toutConfirme ? (
                    <button
                      onClick={() => retirerMembre(m)}
                      title="Retirer la confirmation"
                      aria-label={`Retirer la confirmation de ${m.name}`}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition-all hover:scale-105 hover:bg-primary/15"
                    >
                      <BadgeCheck className="h-4.5 w-4.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => confirmerMembre(m)}
                      aria-label={`Confirmer que ${m.name} a donné`}
                      className="tuile-khatim-sm shrink-0 bg-gold/55 p-[1.5px] transition-all hover:bg-gold active:scale-95"
                    >
                      <span className="tuile-khatim-sm flex items-center gap-1.5 bg-or-pale px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-gold-vif">
                        <Check className="h-3.5 w-3.5" /> Il a donné
                      </span>
                    </button>
                  ))}
              </div>
              <ul className="mt-2 space-y-1 border-t border-primary/8 pt-1.5">
                {m.entrees.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-xs text-brouillard">
                    <span className="truncate">
                      {dateCourte(c.date)}
                      {c.note ? ` · ${c.note}` : ''}
                    </span>
                    <span className="ml-2 flex shrink-0 items-center gap-1.5">
                      <span className="font-semibold tabular-nums">{euros(c.amount)}</span>
                      {c.confirmedAt ? (
                        <BadgeCheck className="h-3 w-3 text-primary" aria-label="Confirmé" />
                      ) : (
                        <Clock3 className="h-3 w-3 text-gold-vif" aria-label="En attente" />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>
      {parMembre.length === 0 && (
        <p className="p-3 text-center text-sm text-brouillard">Aucune somme déclarée sur cette période.</p>
      )}
      {sansDeclaration > 0 && parMembre.length > 0 && (
        <p className="mt-2 text-center text-[11px] italic text-brouillard">
          {sansDeclaration} frère{sansDeclaration > 1 ? 's' : ''} n'ont encore rien déclaré
        </p>
      )}
    </div>
  )
}

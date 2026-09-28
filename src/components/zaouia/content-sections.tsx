'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowUp, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  useContent,
  useCreateContent,
  useDeleteContent,
  useReorderContent,
  useUpdateContent,
} from '@/lib/api'
import { useUser } from '@/lib/store'
import { peut } from '@/lib/permissions'
import type { ContentItem } from '@/lib/types'
import { SectionShell } from './ijtima-section'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

/* ═══════════════ Contenus éditables — Adhkâr, Qur'ân, Samâ', Durûs ═══════════════ */

const ICONES = ['✦', '📖', '📿', '🕌', '🌙', '🌿', '⭐', '💫', '🕊️', '🎵', '💧', '❤️']

/* ─── Dialogue d'édition — création ou modification d'une entrée ─── */
function ContentDialog({
  open,
  onOpenChange,
  item,
  section,
  libelle,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Entrée à modifier — null = création */
  item: ContentItem | null
  /** Section cible (ADHKAR, QURAN, SAMA, DURUS) */
  section: string
  /** Libellé humain, ex. « dhikr » */
  libelle: string
  onSaved: (titre: string, edition: boolean) => void
}) {
  const create = useCreateContent()
  const update = useUpdateContent()
  const { toast } = useToast()

  const edition = item !== null

  const [titre, setTitre] = useState('')
  const [sousTitre, setSousTitre] = useState('')
  const [icone, setIcone] = useState('✦')
  const [moment, setMoment] = useState('')
  const [texte, setTexte] = useState('')
  const [lien, setLien] = useState('')

  /* Pré-remplir pendant le rendu (motif React officiel — cf. NewMeetingDialog) */
  const [prerempli, setPrerempli] = useState(false)
  if (open && !prerempli) {
    if (edition && item) {
      setTitre(item.title)
      setSousTitre(item.subtitle ?? '')
      setIcone(item.icon || '✦')
      setMoment(item.time ?? '')
      setTexte(item.body ?? '')
      setLien(item.url ?? '')
    } else {
      setTitre('')
      setSousTitre('')
      setIcone('✦')
      setMoment('')
      setTexte('')
      setLien('')
    }
    setPrerempli(true)
  }

  /* À la fermeture, autoriser le prochain pré-remplissage */
  const changer = (v: boolean) => {
    if (!v) setPrerempli(false)
    onOpenChange(v)
  }

  const publier = () => {
    if (!titre.trim()) {
      toast({
        title: 'Champ manquant',
        description: 'Le titre est nécessaire.',
        variant: 'destructive',
      })
      return
    }
    const payload = {
      section,
      title: titre.trim(),
      subtitle: sousTitre.trim() || null,
      icon: icone,
      time: moment.trim() || null,
      body: texte.trim() || null,
      url: lien.trim() || null,
    }
    if (edition && item) {
      update.mutate(
        { id: item.id, ...payload },
        {
          onSuccess: () => {
            onSaved(titre.trim(), true)
            changer(false)
          },
          onError: () => toast({ title: 'Échec de la modification', variant: 'destructive' }),
        }
      )
      return
    }
    create.mutate(payload, {
      onSuccess: () => {
        onSaved(titre.trim(), false)
        changer(false)
      },
      onError: () => toast({ title: "Échec de l'ajout", variant: 'destructive' }),
    })
  }

  return (
    <Dialog open={open} onOpenChange={changer}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto rounded-3xl border-primary/15 bg-ivoire p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-encre">
            {edition && <Pencil className="h-5 w-5 text-gold" />}
            {edition ? 'Modifier le contenu' : `Nouveau ${libelle}`}
          </DialogTitle>
          <DialogDescription>
            {edition
              ? 'Ajuste le titre, la description, le lien — tout est modifiable.'
              : 'Il apparaîtra immédiatement dans la section, au bout de la liste.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Titre + icône */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Titre
            </Label>
            <div className="flex gap-2">
              <Input
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Hizb al-Bahr…"
                className="rounded-xl border-primary/25 bg-card"
              />
              <div className="grid shrink-0 grid-cols-4 gap-0.5 rounded-xl border border-primary/25 bg-card p-1">
                {ICONES.slice(0, 4).map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcone(ic)}
                    aria-label={`Icône ${ic}`}
                    className={cn(
                      'rounded-lg p-0.5 text-base',
                      icone === ic
                        ? 'bg-primary/12'
                        : 'opacity-50 transition-opacity hover:opacity-100'
                    )}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {ICONES.slice(4).map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcone(ic)}
                  aria-label={`Icône ${ic}`}
                  className={cn(
                    'rounded-lg p-0.5 text-base',
                    icone === ic
                      ? 'bg-primary/12'
                      : 'opacity-50 transition-opacity hover:opacity-100'
                  )}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Sous-titre <span className="normal-case text-brouillard-clair">(italique)</span>
              </Label>
              <Input
                value={sousTitre}
                onChange={(e) => setSousTitre(e.target.value)}
                placeholder="Litanie de l'océan…"
                className="rounded-xl border-primary/25 bg-card"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Moment
              </Label>
              <Input
                value={moment}
                onChange={(e) => setMoment(e.target.value)}
                placeholder="Après Maghreb…"
                className="rounded-xl border-primary/25 bg-card"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Description
            </Label>
            <Textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              rows={3}
              placeholder="Précisions, invocations d'ouverture…"
              className="rounded-xl border-primary/25 bg-card"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Lien « Écouter » <span className="normal-case text-brouillard-clair">(YouTube, facultatif)</span>
            </Label>
            <Input
              value={lien}
              onChange={(e) => setLien(e.target.value)}
              placeholder="https://…"
              type="url"
              className="rounded-xl border-primary/25 bg-card"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="ghost"
            onClick={() => changer(false)}
            className="rounded-full text-muted-foreground"
          >
            Annuler
          </Button>
          <Button
            onClick={publier}
            disabled={create.isPending || update.isPending}
            className="rounded-full bg-primary px-8 text-white hover:bg-emerald-deep"
          >
            {edition
              ? update.isPending
                ? 'Enregistrement…'
                : 'Enregistrer'
              : create.isPending
                ? 'Ajout…'
                : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Une carte de contenu — éditable : modifier, supprimer, déplacer ─── */
function CarteContenu({
  item,
  index,
  total,
  onEdit,
  onMove,
  onDelete,
}: {
  item: ContentItem
  index: number
  total: number
  onEdit: () => void
  onMove: (sens: -1 | 1) => void
  onDelete: () => void
}) {
  const ville = useUser((s) => s.ville)
  const role = useUser((s) => s.role)
  const perms = useUser((s) => s.perms)
  /* Les contenus de la zawiya — édités par les frères de Nîmes */
  const peutEditer = peut(ville, role, 'contenus.editer', perms)

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl border border-primary/12 bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/25 hover:shadow-lg"
    >
      {/* Liseré doré discret qui s'illumine au survol */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-gold/50 via-accent/40 to-transparent transition-transform duration-500 group-hover:scale-x-100"
      />
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-background text-xl ring-1 ring-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/6">
          {item.icon || '✦'}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-encre">{item.title}</h3>
          {item.subtitle && (
            <p className="text-xs italic text-muted-foreground">{item.subtitle}</p>
          )}
          {item.time && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
              {item.time}
            </p>
          )}
          {item.body && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2 text-xs font-semibold text-primary underline-offset-4 transition-colors hover:text-gold-vif hover:underline"
            >
              <span
                aria-hidden
                className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-[8px] transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-primary group-hover:text-white"
              >
                ▶
              </span>
              Écouter
            </a>
          )}
        </div>

        {/* Actions — cibles tactiles larges sur mobile, compactes au survol desktop */}
        {peutEditer && (
          <div className="flex shrink-0 flex-col items-center gap-0.5 opacity-60 transition-opacity duration-200 group-hover:opacity-100">
          <div className="flex">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Modifier « ${item.title} »`}
              className="grid h-9 w-9 place-items-center rounded-lg text-brouillard transition-colors hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-7 sm:w-7"
            >
              <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Supprimer « ${item.title} »`}
              className="grid h-9 w-9 place-items-center rounded-lg text-brouillard transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-destructive/40 sm:h-7 sm:w-7"
            >
              <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          </div>
          {total > 1 && (
            <div className="flex">
              <button
                type="button"
                onClick={() => onMove(-1)}
                disabled={index === 0}
                aria-label={`Monter « ${item.title} »`}
                className="grid h-8 w-9 place-items-center rounded-lg text-brouillard-clair transition-colors hover:bg-gold/15 hover:text-gold-vif focus-visible:ring-2 focus-visible:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-0 sm:h-6 sm:w-7"
              >
                <ArrowUp className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
              </button>
              <button
                type="button"
                onClick={() => onMove(1)}
                disabled={index === total - 1}
                aria-label={`Descendre « ${item.title} »`}
                className="grid h-8 w-9 place-items-center rounded-lg text-brouillard-clair transition-colors hover:bg-gold/15 hover:text-gold-vif focus-visible:ring-2 focus-visible:ring-gold/40 disabled:cursor-not-allowed disabled:opacity-0 sm:h-6 sm:w-7"
              >
                <ArrowDown className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
              </button>
            </div>
          )}
          </div>
        )}
      </div>
    </motion.article>
  )
}

/* ─── Une section de contenus complète (liste + CRUD + dialogue) ───
   sansCoquille : rend le contenu nu, sans l'en-tête de section —
   quand une section parente fournit déjà la coquille (Qur'ân…) */
export function SectionContenu({
  titre,
  id,
  section,
  libelle,
  defaultOpen = false,
  sansCoquille = false,
}: {
  titre: string
  id: string
  section: string
  /** Libellé d'un élément, ex. « contenu » — utilisé dans les phrases */
  libelle: string
  defaultOpen?: boolean
  sansCoquille?: boolean
}) {
  const { data, isLoading } = useContent(section)
  const remove = useDeleteContent()
  const reorder = useReorderContent()
  const { toast } = useToast()
  const ville = useUser((s) => s.ville)
  const role = useUser((s) => s.role)
  const perms = useUser((s) => s.perms)
  /* Les contenus de la zawiya — édités par les frères de Nîmes */
  const peutEditer = peut(ville, role, 'contenus.editer', perms)

  const [dialogOuvert, setDialogOuvert] = useState(false)
  const [edition, setEdition] = useState<ContentItem | null>(null)

  const items = data ?? []

  /** Déplacer une entrée — ré-indexe toute la liste (ordres seedés à 0) */
  const deplacer = (index: number, sens: -1 | 1) => {
    const cible = index + sens
    if (cible < 0 || cible >= items.length) return
    const liste = items.slice()
    const [deplace] = liste.splice(index, 1)
    liste.splice(cible, 0, deplace)
    const changements = liste
      .map((it, i) => ({ id: it.id, order: i, orderAvant: it.order }))
      .filter((c) => c.order !== c.orderAvant)
    if (changements.length) reorder.mutate(changements)
  }

  const supprimer = (item: ContentItem) => {
    remove.mutate(item.id, {
      onSuccess: () =>
        toast({
          title: 'Contenu supprimé',
          description: `« ${item.title} » a été retiré.`,
        }),
      onError: () => toast({ title: 'Échec de la suppression', variant: 'destructive' }),
    })
  }

  const corps = isLoading ? (
    <div className="space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-sand/60" />
      ))}
    </div>
  ) : (
    <div className="space-y-3">
      {/* Ajout — les frères de Nîmes enrichissent les contenus */}
      {peutEditer && (
        <button
          type="button"
          onClick={() => {
            setEdition(null)
            setDialogOuvert(true)
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gold/45 bg-or-pale/40 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-gold-vif transition-all hover:border-gold/70 hover:bg-or-pale/70 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-gold/40 active:scale-[0.99]"
        >
          <Plus className="h-4 w-4" /> Ajouter
        </button>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => (
          <CarteContenu
            key={item.id}
            item={item}
            index={i}
            total={items.length}
            onEdit={() => {
              setEdition(item)
              setDialogOuvert(true)
            }}
            onMove={(sens) => deplacer(i, sens)}
            onDelete={() => supprimer(item)}
          />
        ))}
        {!items.length && (
          <p className="rounded-2xl border border-dashed border-primary/20 p-6 text-center text-sm text-brouillard sm:col-span-2">
            <Sparkles className="mx-auto mb-2 h-5 w-5 text-gold" />
            Rien pour le moment ✦
          </p>
        )}
      </div>
    </div>
  )

  const coquille = (
    <>
      {corps}

      <ContentDialog
        open={dialogOuvert}
        onOpenChange={setDialogOuvert}
        item={edition}
        section={section}
        libelle={libelle}
        onSaved={(titreSauve, etaitEdition) =>
          toast({
            title: etaitEdition ? 'Contenu modifié' : 'Contenu ajouté',
            description: `« ${titreSauve} » — la section est à jour.`,
          })
        }
      />
    </>
  )

  /* Nu — quand la section parente fournit déjà la coquille */
  if (sansCoquille) return <div className="mt-5">{coquille}</div>

  return (
    <SectionShell
      titre={titre}
      compteur={data ? `${data.length}` : undefined}
      defaultOpen={defaultOpen}
      id={id}
    >
      {coquille}
    </SectionShell>
  )
}

/* ─── Les sections de contenus spirituels ───
   (les adhkâr et le cahier de wadhifa ont leur propre lecteur —
   cf. adhkar-section.tsx) */
export function ContentSections() {
  return (
    <>
      <SectionContenu titre="Samâ'" id="sama" section="SAMA" libelle="samâ'" />
    </>
  )
}

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Pencil, Plus, X } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Announcement } from '@/lib/types'
import { useCreateAnnouncement, useUpdateAnnouncement } from '@/lib/api'
import { dateCourte } from '@/lib/format'
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
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

function api<T>(url: string, init?: RequestInit): Promise<T> {
  return fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  }).then((r) => {
    if (!r.ok) throw new Error('Erreur réseau')
    return r.json()
  })
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: () => api<Announcement[]>('/api/announcements'),
  })
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api(`/api/announcements/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  })
}

/* ═══════════════ Une carte d'annonce ═══════════════ */
function CarteAnnonce({
  a,
  index,
  onModifier,
}: {
  a: Announcement
  index: number
  onModifier: (a: Announcement) => void
}) {
  const del = useDeleteAnnouncement()

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ delay: index * 0.08, duration: 0.45 }}
      className={
        a.color === 'VERT'
          ? 'group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-feuille p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-10px_rgba(11,93,66,0.28)]'
          : 'group relative overflow-hidden rounded-2xl border border-accent/35 bg-gradient-to-br from-card to-or-pale p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-10px_rgba(184,146,58,0.32)]'
      }
    >
      {/* Filigrane ornemental — étoile 8 branches en coin */}
      <span
        aria-hidden
        className={
          a.color === 'VERT'
            ? 'pointer-events-none absolute -right-3 -top-3 select-none font-display text-6xl text-primary/6'
            : 'pointer-events-none absolute -right-3 -top-3 select-none font-display text-6xl text-accent/10'
        }
      >
        ✦
      </span>
      {/* Liseré latéral */}
      <span
        aria-hidden
        className={
          a.color === 'VERT'
            ? 'absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary to-sauge'
            : 'absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-accent to-gold-clair'
        }
      />
      <div className="flex items-start gap-3 pl-2">
        <span
          className={
            a.color === 'VERT'
              ? 'mt-1.5 block h-2 w-2 rotate-45 bg-primary'
              : 'mt-1.5 block h-2 w-2 rounded-full bg-accent'
          }
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          {a.title && (
            <h2
              className={
                a.color === 'VERT'
                  ? 'text-[13px] font-bold uppercase tracking-[0.18em] text-primary'
                  : 'text-[13px] font-bold uppercase tracking-[0.18em] text-gold-vif'
              }
            >
              {a.title}
            </h2>
          )}
          <p className="mt-1 whitespace-pre-line font-display text-[17px] leading-relaxed text-secondary-foreground">
            {a.text}
          </p>
          <p className="mt-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-brouillard-clair">
            {dateCourte(a.createdAt)}
            {a.date !== a.createdAt && (
              <span className="rounded-full bg-primary/8 px-1.5 py-px normal-case tracking-normal text-brouillard">
                · modifiée le {dateCourte(a.date)}
              </span>
            )}
          </p>
        </div>

        {/* Actions — modifier & supprimer, révélées au survol */}
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={() => onModifier(a)}
            aria-label="Modifier l'annonce"
            title="Modifier l'annonce"
            className="rounded-full p-2 text-brouillard-clair opacity-0 transition-all hover:bg-primary/10 hover:text-primary focus-visible:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => del.mutate(a.id)}
            aria-label="Supprimer l'annonce"
            title="Supprimer l'annonce"
            className="rounded-full p-2 text-brouillard-clair opacity-0 transition-all hover:bg-black/5 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 max-sm:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.article>
  )
}

/* ═══════════════ Section Annonces + création + édition ═══════════════ */
export function Annonces() {
  const { data: annonces } = useAnnouncements()
  const [dialogOuvert, setDialogOuvert] = useState(false)
  const [edition, setEdition] = useState<Announcement | null>(null)

  const ouvrirCreation = () => {
    setEdition(null)
    setDialogOuvert(true)
  }
  const ouvrirEdition = (a: Announcement) => {
    setEdition(a)
    setDialogOuvert(true)
  }
  const fermerDialog = (v: boolean) => {
    setDialogOuvert(v)
    if (!v) setEdition(null)
  }

  return (
    <section id="annonces" aria-label="Annonces" className="scroll-mt-24 space-y-3">
      {/* Ligne d'en-tête avec bouton de création */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-primary">
            Voix de la zawiya
          </p>
          <h2 className="mt-1 font-display text-2xl font-medium text-foreground">Annonces</h2>
        </div>
        <button
          onClick={ouvrirCreation}
          className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary ring-1 ring-primary/20 transition-all hover:bg-primary/8 hover:shadow-sm active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" /> Annonce
        </button>
      </div>

      {/* Cartes */}
      {(annonces ?? []).map((a, i) => (
        <CarteAnnonce key={a.id} a={a} index={i} onModifier={ouvrirEdition} />
      ))}

      {/* État vide */}
      {annonces && !annonces.length && (
        <button
          onClick={ouvrirCreation}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/30 bg-card/50 p-5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
        >
          <Megaphone className="h-4 w-4" /> Publier une annonce pour la communauté
        </button>
      )}

      <AnnonceDialog
        open={dialogOuvert}
        onOpenChange={fermerDialog}
        annonce={edition}
      />
    </section>
  )
}

/* ═══════════════ Dialogue création / modification ═══════════════ */
function AnnonceDialog({
  open,
  onOpenChange,
  annonce = null,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Annonce à modifier — null = création */
  annonce?: Announcement | null
}) {
  const create = useCreateAnnouncement()
  const update = useUpdateAnnouncement()
  const { toast } = useToast()

  const edition = annonce !== null
  const enCours = edition ? update : create

  const [titre, setTitre] = useState('')
  const [texte, setTexte] = useState('')
  const [couleur, setCouleur] = useState<'VERT' | 'CORAIL'>('VERT')

  /* Pré-remplir pendant le rendu (motif React officiel) :
     — édition : champs depuis l'annonce existante
     — création : champs vides */
  const [prerempli, setPrerempli] = useState(false)
  if (open && !prerempli) {
    if (edition && annonce) {
      setTitre(annonce.title ?? '')
      setTexte(annonce.text)
      setCouleur(annonce.color)
    } else {
      setTitre('')
      setTexte('')
      setCouleur('VERT')
    }
    setPrerempli(true)
  }
  if (!open && prerempli) setPrerempli(false)

  const enregistrer = () => {
    if (!texte.trim()) {
      toast({ title: 'Texte requis', description: 'Écris le message de l’annonce.', variant: 'destructive' })
      return
    }
    const payload = {
      title: titre.trim() || undefined,
      text: texte.trim(),
      color: couleur,
    }
    if (edition && annonce) {
      update.mutate(
        { id: annonce.id, ...payload },
        {
          onSuccess: () => {
            toast({ title: 'Annonce modifiée', description: 'Les changements sont en ligne.' })
            onOpenChange(false)
          },
          onError: () => toast({ title: 'Échec de la modification', variant: 'destructive' }),
        }
      )
      return
    }
    create.mutate(payload, {
      onSuccess: () => {
        toast({ title: 'Annonce publiée', description: 'Elle apparaît en tête de la page.' })
        onOpenChange(false)
      },
      onError: () => toast({ title: 'Échec de la publication', variant: 'destructive' }),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-primary/15 bg-ivoire p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-encre">
            {edition ? (
              <>
                <Pencil className="h-5 w-5 text-primary" /> Modifier l’annonce
              </>
            ) : (
              <>
                <Megaphone className="h-5 w-5 text-primary" /> Nouvelle annonce
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {edition
              ? 'Ajuste le message — la communauté voit la version mise à jour.'
              : "Le message s'affichera en tête de la page pour toute la communauté."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Titre <span className="normal-case text-brouillard-clair">(facultatif)</span>
            </Label>
            <Input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="ANNONCE"
              className="rounded-xl border-primary/25 bg-card"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Message
            </Label>
            <Textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              rows={4}
              placeholder="Sadaqa exceptionnelle samedi prochain…"
              className="rounded-xl border-primary/25 bg-card"
            />
          </div>

          {/* Choix de la couleur avec aperçu */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Couleur
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {(['VERT', 'CORAIL'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCouleur(c)}
                  aria-pressed={couleur === c}
                  className={cn(
                    'rounded-xl border-2 p-3 text-left transition-all',
                    couleur === c
                      ? c === 'VERT'
                        ? 'border-primary shadow-md shadow-primary/15'
                        : 'border-accent shadow-md shadow-accent/15'
                      : 'border-transparent ring-1 ring-primary/12 hover:ring-primary/30'
                  )}
                >
                  <span
                    className={cn(
                      'mb-1.5 block h-1.5 w-10 rounded-full',
                      c === 'VERT'
                        ? 'bg-gradient-to-r from-primary to-sauge'
                        : 'bg-gradient-to-r from-accent to-gold-clair'
                    )}
                  />
                  <span className="text-xs font-bold text-secondary-foreground">
                    {c === 'VERT' ? 'Vert — information' : 'Or — annonce importante'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Aperçu en direct */}
          {texte.trim() && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'relative overflow-hidden rounded-2xl p-4 shadow-sm',
                couleur === 'VERT'
                  ? 'border border-primary/20 bg-gradient-to-br from-card to-feuille'
                  : 'border border-accent/35 bg-gradient-to-br from-card to-or-pale'
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'absolute inset-y-0 left-0 w-1',
                  couleur === 'VERT'
                    ? 'bg-gradient-to-b from-primary to-sauge'
                    : 'bg-gradient-to-b from-accent to-gold-clair'
                )}
              />
              <p className="pl-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brouillard-clair">
                Aperçu
              </p>
              {titre.trim() && (
                <p
                  className={cn(
                    'pl-2 text-[13px] font-bold uppercase tracking-[0.18em]',
                    couleur === 'VERT' ? 'text-primary' : 'text-gold-vif'
                  )}
                >
                  {titre}
                </p>
              )}
              <p className="pl-2 font-display text-[16px] leading-relaxed text-secondary-foreground">
                {texte}
              </p>
            </motion.div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-muted-foreground"
          >
            Annuler
          </Button>
          <Button
            onClick={enregistrer}
            disabled={enCours.isPending}
            className="rounded-full bg-primary px-8 text-white hover:bg-emerald-deep"
          >
            {enCours.isPending
              ? edition
                ? 'Enregistrement…'
                : 'Publication…'
              : edition
                ? 'Enregistrer'
                : 'Publier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

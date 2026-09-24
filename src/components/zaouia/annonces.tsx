'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Megaphone, Plus, X } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Announcement } from '@/lib/types'
import { useCreateAnnouncement } from '@/lib/api'
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
function CarteAnnonce({ a, index }: { a: Announcement; index: number }) {
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
          ? 'group relative overflow-hidden rounded-2xl border border-[#0b5d42]/20 bg-gradient-to-br from-white to-[#f2f7f3] p-5 shadow-sm'
          : 'group relative overflow-hidden rounded-2xl border border-[#c9a24b]/35 bg-gradient-to-br from-white to-[#faf3e3] p-5 shadow-sm'
      }
    >
      {/* Liseré latéral */}
      <span
        aria-hidden
        className={
          a.color === 'VERT'
            ? 'absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#0b5d42] to-[#4a7c6b]'
            : 'absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#c9a24b] to-[#e2c98a]'
        }
      />
      <div className="flex items-start gap-3 pl-2">
        <span
          className={
            a.color === 'VERT'
              ? 'mt-1.5 block h-2 w-2 rotate-45 bg-[#0b5d42]'
              : 'mt-1.5 block h-2 w-2 rounded-full bg-[#c9a24b]'
          }
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          {a.title && (
            <h2
              className={
                a.color === 'VERT'
                  ? 'text-[13px] font-bold uppercase tracking-[0.18em] text-[#0b5d42]'
                  : 'text-[13px] font-bold uppercase tracking-[0.18em] text-[#a3781f]'
              }
            >
              {a.title}
            </h2>
          )}
          <p className="mt-1 whitespace-pre-line font-display text-[17px] leading-relaxed text-[#33453a]">
            {a.text}
          </p>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b6b1a0]">
            {dateCourte(a.createdAt)}
          </p>
        </div>
        <button
          onClick={() => del.mutate(a.id)}
          aria-label="Supprimer l'annonce"
          className="rounded-full p-1.5 text-[#b6b1a0] opacity-0 transition-all hover:bg-black/5 hover:text-[#b3452f] focus-visible:opacity-100 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.article>
  )
}

/* ═══════════════ Section Annonces + création ═══════════════ */
export function Annonces() {
  const { data: annonces } = useAnnouncements()
  const [dialogOuvert, setDialogOuvert] = useState(false)

  return (
    <section aria-label="Annonces" className="space-y-3">
      {/* Ligne d'en-tête avec bouton de création */}
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-[#0b5d42]">
          <Megaphone className="h-4 w-4" /> Annonces
        </p>
        <button
          onClick={() => setDialogOuvert(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0b5d42] ring-1 ring-[#0b5d42]/20 transition-all hover:bg-[#0b5d42]/8 hover:shadow-sm active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" /> Annonce
        </button>
      </div>

      {/* Cartes */}
      {(annonces ?? []).map((a, i) => (
        <CarteAnnonce key={a.id} a={a} index={i} />
      ))}

      {/* État vide */}
      {annonces && !annonces.length && (
        <button
          onClick={() => setDialogOuvert(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#0b5d42]/30 bg-white/50 p-5 text-sm font-semibold text-[#0b5d42] transition-colors hover:bg-[#0b5d42]/5"
        >
          <Megaphone className="h-4 w-4" /> Publier une annonce pour la communauté
        </button>
      )}

      <NouvelleAnnonceDialog open={dialogOuvert} onOpenChange={setDialogOuvert} />
    </section>
  )
}

/* ═══════════════ Dialogue de création ═══════════════ */
function NouvelleAnnonceDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const create = useCreateAnnouncement()
  const { toast } = useToast()

  const [titre, setTitre] = useState('')
  const [texte, setTexte] = useState('')
  const [couleur, setCouleur] = useState<'VERT' | 'CORAIL'>('VERT')

  const publier = () => {
    if (!texte.trim()) {
      toast({ title: 'Texte requis', description: 'Écris le message de l’annonce.', variant: 'destructive' })
      return
    }
    create.mutate(
      {
        title: titre.trim() || undefined,
        text: texte.trim(),
        color: couleur,
      },
      {
        onSuccess: () => {
          toast({ title: 'Annonce publiée', description: 'Elle apparaît en tête de la page.' })
          setTitre('')
          setTexte('')
          setCouleur('VERT')
          onOpenChange(false)
        },
        onError: () => toast({ title: 'Échec de la publication', variant: 'destructive' }),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-[#0b5d42]/15 bg-[#fdfcf8] p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-[#123c2d]">
            <Megaphone className="h-5 w-5 text-[#0b5d42]" /> Nouvelle annonce
          </DialogTitle>
          <DialogDescription>
            Le message s'affichera en tête de la page pour toute la communauté.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
              Titre <span className="normal-case text-[#b6b1a0]">(facultatif)</span>
            </Label>
            <Input
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="ANNONCE"
              className="rounded-xl border-[#0b5d42]/25 bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
              Message
            </Label>
            <Textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              rows={4}
              placeholder="Sadaqa exceptionnelle samedi prochain…"
              className="rounded-xl border-[#0b5d42]/25 bg-white"
            />
          </div>

          {/* Choix de la couleur avec aperçu */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
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
                        ? 'border-[#0b5d42] shadow-md shadow-[#0b5d42]/15'
                        : 'border-[#c9a24b] shadow-md shadow-[#c9a24b]/15'
                      : 'border-transparent ring-1 ring-[#0b5d42]/12 hover:ring-[#0b5d42]/30'
                  )}
                >
                  <span
                    className={cn(
                      'mb-1.5 block h-1.5 w-10 rounded-full',
                      c === 'VERT'
                        ? 'bg-gradient-to-r from-[#0b5d42] to-[#4a7c6b]'
                        : 'bg-gradient-to-r from-[#c9a24b] to-[#e2c98a]'
                    )}
                  />
                  <span className="text-xs font-bold text-[#33453a]">
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
                  ? 'border border-[#0b5d42]/20 bg-gradient-to-br from-white to-[#f2f7f3]'
                  : 'border border-[#c9a24b]/35 bg-gradient-to-br from-white to-[#faf3e3]'
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'absolute inset-y-0 left-0 w-1',
                  couleur === 'VERT'
                    ? 'bg-gradient-to-b from-[#0b5d42] to-[#4a7c6b]'
                    : 'bg-gradient-to-b from-[#c9a24b] to-[#e2c98a]'
                )}
              />
              <p className="pl-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b6b1a0]">
                Aperçu
              </p>
              {titre.trim() && (
                <p
                  className={cn(
                    'pl-2 text-[13px] font-bold uppercase tracking-[0.18em]',
                    couleur === 'VERT' ? 'text-[#0b5d42]' : 'text-[#a3781f]'
                  )}
                >
                  {titre}
                </p>
              )}
              <p className="pl-2 font-display text-[16px] leading-relaxed text-[#33453a]">
                {texte}
              </p>
            </motion.div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-[#78877d]"
          >
            Annuler
          </Button>
          <Button
            onClick={publier}
            disabled={create.isPending}
            className="rounded-full bg-[#0b5d42] px-8 text-white hover:bg-[#0b3d2e]"
          >
            {create.isPending ? 'Publication…' : 'Publier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

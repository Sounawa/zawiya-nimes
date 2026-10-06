'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  MapPin,
  Pencil,
  Plus,
  Wallet,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useSaveSetting, useSettings } from '@/lib/api'
import { SECTION_TRESORERIE } from '@/lib/config'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  estInstallee,
  estIOS,
  useInstallation,
} from '@/lib/installation'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

/* ═══════════════ Réglages : jours d'ijtima + frères + accès ═══════════════ */
export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { data: settings } = useSettings()
  const saveSetting = useSaveSetting()
  const qc = useQueryClient()
  const { toast } = useToast()

  const joursDefaut: { label: string; actif: boolean; heure: string }[] =
    settings?.ijtima_days?.jours ?? []
  const [joursEdites, setJoursEdites] = useState<{
    label: string
    actif: boolean
    heure: string
  }[] | null>(null)
  const jours = joursEdites ?? joursDefaut
  const setJours = setJoursEdites

  /* ─── Lieu des ijtima' ─── */
  const configDefaut = settings?.app_config ?? { nom: 'Nimes', ville: 'Nîmes', lieu: '' }
  const [lieuEdite, setLieuEdite] = useState<{ ville: string; adresse: string } | null>(null)
  const lieu = lieuEdite ?? { ville: configDefaut.ville, adresse: configDefaut.lieu ?? '' }

  const enregistrerLieu = () => {
    saveSetting.mutate(
      {
        key: 'app_config',
        value: {
          nom: configDefaut.nom || 'Nimes',
          ville: lieu.ville.trim() || 'Nîmes',
          lieu: lieu.adresse.trim(),
        },
      },
      {
        onSuccess: () =>
          toast({
            title: 'Lieu enregistré',
            description: 'Les nouvelles réunions utiliseront ce lieu par défaut.',
          }),
      }
    )
  }

  const majJour = (i: number, patch: Partial<{ actif: boolean; heure: string }>) =>
    setJours((js) => (js ?? joursDefaut).map((j, k) => (k === i ? { ...j, ...patch } : j)))

  const ajouterJour = () => {
    const absent = JOURS.find((j) => !jours.some((x) => x.label === j))
    if (absent) setJours((js) => [...(js ?? joursDefaut), { label: absent, actif: true, heure: '19:30' }])
  }

  const retirerJour = (i: number) =>
    setJours((js) => (js ?? joursDefaut).filter((_, k) => k !== i))

  const enregistrerJours = () => {
    saveSetting.mutate(
      { key: 'ijtima_days', value: { jours } },
      {
        onSuccess: () =>
          toast({
            title: 'Jours enregistrés',
            description: 'Les nouveaux ijtima\u2018 sont pris en compte.',
          }),
      }
    )
  }

  /* ─── Membres : la conduite des frères n'est plus affichée —
      les prénoms ont été retirés de l'application. ─── */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto rounded-3xl border-primary/15 bg-ivoire p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-encre">
            Réglages de la zaouia
          </DialogTitle>
          <DialogDescription>
            Lieu et jours des ijtima' — du ressort du référent.
          </DialogDescription>
        </DialogHeader>

        {/* ─── Lieu des ijtima' ─── */}
        <section aria-label="Lieu des ijtima" className="space-y-3">
          <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            <MapPin className="h-4 w-4" /> Lieu des ijtima'
          </h3>
          <div className="space-y-3 rounded-2xl border border-primary/12 bg-card p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ville</Label>
                <Input
                  value={lieu.ville}
                  onChange={(e) => setLieuEdite({ ...lieu, ville: e.target.value })}
                  placeholder="Nîmes"
                  className="rounded-xl border-primary/25 bg-card"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Adresse</Label>
                <Input
                  value={lieu.adresse}
                  onChange={(e) => setLieuEdite({ ...lieu, adresse: e.target.value })}
                  placeholder="Rue, numéro, sonnette…"
                  className="rounded-xl border-primary/25 bg-card"
                />
              </div>
            </div>
            <Button
              size="sm"
              onClick={enregistrerLieu}
              disabled={saveSetting.isPending}
              className="rounded-full bg-primary text-white hover:bg-emerald-deep"
            >
              Enregistrer le lieu
            </Button>
          </div>
        </section>

        {/* ─── Jours d'ijtima' ─── */}
        <section aria-label="Jours d'ijtima" className="space-y-3">
          <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            <CalendarDays className="h-4 w-4" /> Jours des ijtima'
          </h3>
          <div className="rounded-2xl border border-primary/12 bg-card p-4 shadow-sm">
            <ul className="space-y-2.5">
              {jours.map((j, i) => (
                <motion.li
                  layout
                  key={j.label}
                  className="flex items-center gap-3 rounded-xl bg-background px-3 py-2"
                >
                  <Switch
                    checked={j.actif}
                    onCheckedChange={(v) => majJour(i, { actif: v })}
                    aria-label={`${j.label} ${j.actif ? 'actif' : 'inactif'}`}
                  />
                  <span className={cn('flex-1 text-sm font-medium', j.actif ? 'text-secondary-foreground' : 'text-brouillard-clair line-through')}>
                    {j.label}
                  </span>
                  <Input
                    type="time"
                    value={j.heure}
                    onChange={(e) => majJour(i, { heure: e.target.value })}
                    className="w-28 rounded-lg border-primary/25 bg-card text-sm"
                  />
                  <button
                    onClick={() => retirerJour(i)}
                    aria-label={`Retirer ${j.label}`}
                    className="rounded-full p-2 text-brouillard-clair hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Plus className="h-3.5 w-3.5 rotate-45" />
                  </button>
                </motion.li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={ajouterJour}
                className="gap-1.5 rounded-full border-dashed border-primary/40 text-primary"
              >
                <Plus className="h-3.5 w-3.5" /> Jour
              </Button>
              <Button
                size="sm"
                onClick={enregistrerJours}
                disabled={saveSetting.isPending}
                className="ml-auto rounded-full bg-primary text-white hover:bg-emerald-deep"
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </section>

        {/* ─── Trésorerie : note (section masquée pour le moment) ─── */}
        {SECTION_TRESORERIE && (
          <section aria-label="Trésorerie" className="space-y-2">
            <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
              <Wallet className="h-4 w-4" /> Trésorerie
            </h3>
            <p className="rounded-xl bg-or-pale px-3 py-2 text-xs leading-relaxed text-gold-vif">
              La section <strong>Ziyara</strong> (montant donné au Shaykh) n'est visible et modifiable que
              par le trésorier — ou par le référent, qui porte toutes les charges.
            </p>
          </section>
        )}
      </DialogContent>

    </Dialog>
  )
}

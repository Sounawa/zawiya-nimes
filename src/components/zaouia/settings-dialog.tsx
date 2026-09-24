'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, CalendarDays, MapPin, Plus, Shield, UserRound, Wallet } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, useMembers, useSaveSetting, useSettings } from '@/lib/api'
import { useUser } from '@/lib/store'
import type { Member } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

/* ═══════════════ Réglages : jours d'ijtima + rôles ═══════════════ */
export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { data: settings } = useSettings()
  const { data: membres } = useMembers()
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
  const [nouveauNom, setNouveauNom] = useState('')

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

  /* ─── Rôles ─── */
  const majRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api(`/api/members/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] })
    },
  })

  const ajouterMembre = useMutation({
    mutationFn: (name: string) =>
      api('/api/members', { method: 'POST', body: JSON.stringify({ name, role: 'ADMIN' }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] })
      toast({ title: 'Membre ajouté', description: `Sidi ${nouveauNom} a rejoint la communauté.` })
      setNouveauNom('')
    },
    onError: () => toast({ title: 'Impossible d\u2019ajouter', variant: 'destructive' }),
  })

  const tresorier = (membres ?? []).find((m) => m.role === 'TREASURER')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto rounded-3xl border-primary/15 bg-ivoire p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-encre">
            Réglages de la zaouia
          </DialogTitle>
          <DialogDescription>
            Jours d'ijtima, rôles et trésorerie — ouverts à toute la communauté.
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

        {/* ─── Rôles ─── */}
        <section aria-label="Rôles" className="space-y-3">
          <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            <Shield className="h-4 w-4" /> Rôles de la communauté
          </h3>
          <p className="rounded-xl bg-sand/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            Tout le monde a les droits d'administration par défaut.
            Un seul frère peut porter le rôle de <strong className="text-gold-vif">trésorier</strong> —
            c'est lui qui gère l'argent (cotisations & ziyara).
          </p>
          <div className="defile-fin max-h-64 overflow-y-auto rounded-2xl border border-primary/12 bg-card p-2 shadow-sm">
            {(membres ?? []).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 hover:bg-background"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-secondary-foreground">
                  <UserRound className="h-3.5 w-3.5 text-primary/50" />
                  Sidi {m.name}
                  {m.role === 'TREASURER' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-gold-vif">
                      <Wallet className="h-3 w-3" /> Trésorier
                    </span>
                  )}
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() =>
                      majRole.mutate({
                        id: m.id,
                        role: m.role === 'TREASURER' ? 'ADMIN' : 'TREASURER',
                      })
                    }
                    className={cn(
                      'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors',
                      m.role === 'TREASURER'
                        ? 'bg-accent text-white dark:text-accent-foreground'
                        : 'bg-sand text-muted-foreground hover:bg-accent/20 hover:text-gold-vif'
                    )}
                    title={
                      tresorier && m.role !== 'TREASURER'
                        ? `Remplacer ${tresorier.name} comme trésorier`
                        : 'Donner le rôle de trésorier'
                    }
                  >
                    Trésorier
                  </button>
                  <button
                    onClick={() => majRole.mutate({ id: m.id, role: 'ADMIN' })}
                    disabled={m.role === 'ADMIN'}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors',
                      m.role === 'ADMIN'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-sand text-muted-foreground hover:bg-primary/10 hover:text-primary'
                    )}
                  >
                    <BadgeCheck className="h-3 w-3" /> Admin
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Ajouter un membre */}
          <div className="flex gap-2">
            <Input
              value={nouveauNom}
              onChange={(e) => setNouveauNom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nouveauNom.trim()) ajouterMembre.mutate(nouveauNom.trim())
              }}
              placeholder="Nouveau frère…"
              className="rounded-xl border-primary/25 bg-card"
            />
            <Button
              onClick={() => nouveauNom.trim() && ajouterMembre.mutate(nouveauNom.trim())}
              disabled={ajouterMembre.isPending}
              className="shrink-0 rounded-xl bg-primary text-white hover:bg-emerald-deep"
            >
              <Plus className="mr-1 h-4 w-4" /> Ajouter
            </Button>
          </div>
        </section>

        {/* ─── Trésorerie : note ─── */}
        <section aria-label="Trésorerie" className="space-y-2">
          <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            <Wallet className="h-4 w-4" /> Trésorerie
          </h3>
          <p className="rounded-xl bg-or-pale px-3 py-2 text-xs leading-relaxed text-gold-vif">
            La section <strong>Ziyara</strong> (montant donné au Shaykh) n'est visible et modifiable que par le trésorier —
            c'est lui qui règle les montants depuis sa section dorée.
          </p>
        </section>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════════ Profil : « Je suis… » ═══════════════ */
export function ProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const name = useUser((s) => s.name)
  const role = useUser((s) => s.role)
  const setName = useUser((s) => s.setName)
  const setMember = useUser((s) => s.setMember)
  const logout = useUser((s) => s.logout)
  const { data: membres } = useMembers()
  const { toast } = useToast()
  const [choixManuel, setChoixManuel] = useState<string | null>(null)
  const choix = choixManuel ?? name ?? ''

  const monMembre: Member | undefined = (membres ?? []).find((m) => m.name === name)

  const valider = () => {
    const v = choix.trim()
    if (!v) return
    if (monMembre && monMembre.name === v) {
      setMember(monMembre.id, monMembre.role)
      onOpenChange(false)
      return
    }
    // Nouveau prénom : créer le membre puis entrer
    fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: v }),
    })
      .then(async (r) => {
        if (r.ok) {
          const m = (await r.json()) as Member
          setName(v)
          setMember(m.id, m.role)
          toast({ title: `Marhaban bik, Sidi ${v}` })
          onOpenChange(false)
        } else {
          const err = await r.json()
          toast({ title: err.error ?? 'Erreur', variant: 'destructive' })
        }
      })
      .catch(() => toast({ title: 'Erreur réseau', variant: 'destructive' }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl border-primary/15 bg-ivoire p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-encre">Je suis…</DialogTitle>
          <DialogDescription>
            {monMembre
              ? `Sidi ${monMembre.name} — ${monMembre.role === 'TREASURER' ? 'trésorier de la zaouia' : 'administrateur'}`
              : 'Choisis ton prénom pour entrer dans la zaouia.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              Prénom
            </Label>
            <div className="relative">
              <input
                value={choix}
                onChange={(e) => setChoixManuel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && valider()}
                list="prenoms-zaouia"
                placeholder="Ton prénom…"
                className="w-full rounded-full border border-primary/25 bg-card py-3 pl-5 pr-5 text-center text-lg text-encre outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <datalist id="prenoms-zaouia">
                {(membres ?? []).map((m) => (
                  <option key={m.id} value={m.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Suggestions rapides */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {(membres ?? [])
              .slice(0, 8)
              .map((m) => (
                <button
                  key={m.id}
                  onClick={() => setChoixManuel(m.name)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                    choix === m.name
                      ? 'bg-primary text-white'
                      : 'bg-card text-primary ring-1 ring-primary/15 hover:bg-primary/5'
                  )}
                >
                  Sidi {m.name}
                </button>
              ))}
          </div>

          <Button
            onClick={valider}
            className="w-full rounded-full bg-primary py-3 text-white hover:bg-emerald-deep"
          >
            {monMembre ? 'Mettre à jour' : 'Entrer'}
          </Button>

          {monMembre && (
            <Button
              variant="ghost"
              onClick={() => {
                logout()
                onOpenChange(false)
              }}
              className="w-full rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Changer d'identité
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

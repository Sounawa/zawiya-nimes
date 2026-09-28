'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BadgeCheck, CalendarDays, MapPin, Plus, Shield, UserRound, Wallet } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, useMembers, useSaveSetting, useSettings } from '@/lib/api'
import { useUser } from '@/lib/store'
import { peut } from '@/lib/permissions'
import { ROLE_LABEL, VILLE_LABEL, type Member, type Ville } from '@/lib/types'
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

  /* ─── Membres : rôles & groupes ─── */
  const majMembre = useMutation({
    mutationFn: ({ id, ...data }: { id: string; role?: string; city?: string }) =>
      api(`/api/members/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] })
    },
  })

  const [villeAjout, setVilleAjout] = useState<Ville>('NIMES')

  const ajouterMembre = useMutation({
    mutationFn: (name: string) =>
      api('/api/members', {
        method: 'POST',
        body: JSON.stringify({ name, ville: villeAjout, role: 'MEMBER' }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] })
      toast({
        title: 'Membre ajouté',
        description: `Sidi ${nouveauNom} a rejoint la zawiya de ${VILLE_LABEL[villeAjout]}.`,
      })
      setNouveauNom('')
    },
    onError: () => toast({ title: 'Impossible d\u2019ajouter', variant: 'destructive' }),
  })

  const tresorier = (membres ?? []).find((m) => m.role === 'TREASURER')
  const referent = (membres ?? []).find((m) => m.role === 'REFERENT')

  /* Basculer la zawiya d'un frère — Nîmes ↔ Montpellier */
  const basculerVille = (m: Member) => {
    const autre: Ville = m.city === 'NIMES' ? 'MONTPELLIER' : 'NIMES'
    majMembre.mutate({ id: m.id, city: autre })
    toast({
      title: `${m.name} → ${VILLE_LABEL[autre]}`,
      description:
        autre === 'MONTPELLIER'
          ? 'Il ne verra plus la trésorerie ni les outils de publication.'
          : 'Il retrouve tous les droits des frères de Nîmes.',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto rounded-3xl border-primary/15 bg-ivoire p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-encre">
            Réglages de la zaouia
          </DialogTitle>
          <DialogDescription>
            Jours d'ijtima et conduite des frères — du ressort du référent.
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

        {/* ─── Membres : rôles & groupes ─── */}
        <section aria-label="Membres" className="space-y-3">
          <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            <Shield className="h-4 w-4" /> Frères de la zaouia
          </h3>
          <p className="rounded-xl bg-sand/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            Chaque frère porte un <strong>groupe</strong> (sa zawiya) et un <strong>rôle</strong> :
            les frères de <strong className="text-primary">Nîmes</strong> publient les annonces, sondages et ijtima' ;
            ceux de <strong className="text-gold-vif">Montpellier</strong> lisent et participent.
            Un seul porte la <strong className="text-gold-vif">trésorerie</strong>, un seul la conduite de
            la zaouia (<strong className="text-primary">référent</strong>) — les nommer remplace le porteur précédent.
          </p>
          <div className="defile-fin max-h-72 overflow-y-auto rounded-2xl border border-primary/12 bg-card p-2 shadow-sm">
            {(membres ?? []).map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 rounded-xl px-3 py-2 hover:bg-background"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-secondary-foreground">
                  <UserRound className="h-3.5 w-3.5 shrink-0 text-primary/50" />
                  <span className="truncate">Sidi {m.name}</span>
                  <button
                    onClick={() => basculerVille(m)}
                    title={
                      m.city === 'NIMES'
                        ? 'Basculer vers la zawiya de Montpellier'
                        : 'Rendre à la zawiya de Nîmes'
                    }
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors',
                      m.city === 'NIMES'
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : 'bg-accent/15 text-gold-vif hover:bg-accent/25'
                    )}
                  >
                    {VILLE_LABEL[m.city] ?? m.city}
                  </button>
                </span>
                <div className="flex shrink-0 gap-1.5">
                  {(
                    [
                      { role: 'MEMBER', label: 'Membre' },
                      { role: 'TREASURER', label: 'Trésorier' },
                      { role: 'REFERENT', label: 'Référent' },
                    ] as { role: string; label: string }[]
                  ).map((r) => (
                    <button
                      key={r.role}
                      onClick={() => majMembre.mutate({ id: m.id, role: r.role })}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors',
                        m.role === r.role
                          ? r.role === 'REFERENT'
                            ? 'bg-primary text-white'
                            : r.role === 'TREASURER'
                              ? 'bg-accent text-white dark:text-accent-foreground'
                              : 'bg-primary/10 text-primary'
                          : 'bg-sand text-muted-foreground hover:bg-primary/10 hover:text-primary'
                      )}
                      title={
                        r.role === 'TREASURER' && m.role !== 'TREASURER' && tresorier
                          ? `Remplacer ${tresorier.name} comme trésorier`
                          : r.role === 'REFERENT' && m.role !== 'REFERENT' && referent
                            ? `Remplacer ${referent.name} comme référent`
                            : r.label
                      }
                    >
                      {r.role === 'TREASURER' && <Wallet className="mr-1 inline h-3 w-3" />}
                      {r.role === 'REFERENT' && <BadgeCheck className="mr-1 inline h-3 w-3" />}
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Ajouter un frère — dans sa zawiya */}
          <div className="space-y-2">
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
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brouillard">
                Zawiya
              </span>
              <div className="flex gap-1.5">
                {(['NIMES', 'MONTPELLIER'] as Ville[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVilleAjout(v)}
                    className={cn(
                      'rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors',
                      villeAjout === v
                        ? 'bg-primary text-white'
                        : 'bg-sand text-muted-foreground hover:bg-primary/10 hover:text-primary'
                    )}
                  >
                    {VILLE_LABEL[v]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Trésorerie : note ─── */}
        <section aria-label="Trésorerie" className="space-y-2">
          <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            <Wallet className="h-4 w-4" /> Trésorerie
          </h3>
          <p className="rounded-xl bg-or-pale px-3 py-2 text-xs leading-relaxed text-gold-vif">
            La section <strong>Ziyara</strong> (montant donné au Shaykh) n'est visible et modifiable que
            par le trésorier — ou par le référent, qui porte toutes les charges.
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
  const ville = useUser((s) => s.ville)
  const setName = useUser((s) => s.setName)
  const setMember = useUser((s) => s.setMember)
  const logout = useUser((s) => s.logout)
  const { data: membres } = useMembers()
  const { toast } = useToast()
  const [choixManuel, setChoixManuel] = useState<string | null>(null)
  const choix = choixManuel ?? name ?? ''

  /* Les frères de MA zawiya — on y cherche, on y inscrit */
  const freresVille = (membres ?? []).filter((m) => m.city === ville)
  const monMembre: Member | undefined = freresVille.find((m) => m.name === name)

  const valider = () => {
    const v = choix.trim()
    if (!v) return
    if (monMembre && monMembre.name === v) {
      setMember(monMembre.id, monMembre.role, monMembre.city)
      onOpenChange(false)
      return
    }
    // Nouveau prénom : s'inscrire dans sa zawiya
    fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: v, ville }),
    })
      .then(async (r) => {
        if (r.ok) {
          const m = (await r.json()) as Member
          setName(v)
          setMember(m.id, m.role, m.city)
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
              ? `Sidi ${monMembre.name} — ${ROLE_LABEL[monMembre.role] ?? 'membre'} de la zawiya de ${VILLE_LABEL[monMembre.city] ?? 'Nîmes'}`
              : `Choisis ton prénom pour entrer dans la zawiya de ${VILLE_LABEL[ville] ?? 'Nîmes'}.`}
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
                {freresVille.map((m) => (
                  <option key={m.id} value={m.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Suggestions rapides — les frères de sa zawiya */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {freresVille.slice(0, 8).map((m) => (
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

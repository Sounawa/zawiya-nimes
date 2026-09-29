'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BadgeCheck,
  Ban,
  CalendarDays,
  Check,
  Hourglass,
  KeyRound,
  MapPin,
  Plus,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
  UserRoundPlus,
  Wallet,
  X,
} from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, useMembers, useSaveSetting, useSettings } from '@/lib/api'
import { useUser } from '@/lib/store'
import { peut, lireSurcharges } from '@/lib/permissions'
import { SECTION_TRESORERIE } from '@/lib/config'
import {
  FAMILLES_DROITS,
  ROLE_LABEL,
  STATUT_LABEL,
  VILLE_LABEL,
  VILLES,
  type FamilleDroits,
  type Member,
  type Surcharges,
  type Ville,
} from '@/lib/types'
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
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

/* Cycle des zawiya : Nîmes → Avignon → Montpellier → Nîmes */
const CYCLE_VILLE: Record<string, Ville> = {
  NIMES: 'AVIGNON',
  AVIGNON: 'MONTPELLIER',
  MONTPELLIER: 'NIMES',
}

/** Le droit du groupe, sans surcharge — pour distinguer défaut et particulier */
const DROIT_DE_LA_FAMILLE: Record<FamilleDroits, Parameters<typeof peut>[2]> = {
  annonces: 'annonces.creer',
  sondages: 'sondages.creer',
  reunions: 'reunions.rediger',
  contenus: 'contenus.editer',
  cotisations: 'cotisations.voir',
}

/* ═══════════════ Réglages : jours d'ijtima + frères + accès ═══════════════ */
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
  const [villeAjout, setVilleAjout] = useState<Ville>('NIMES')
  const [membreDroits, setMembreDroits] = useState<Member | null>(null)
  /* Confirmation avant suppression définitive d'un frère */
  const [aSupprimer, setASupprimer] = useState<Member | null>(null)

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

  /* ─── Membres : rôles, groupes, droits, accès ─── */
  const majMembre = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      role?: string
      city?: string
      status?: string
      perms?: Record<string, boolean> | null
      resetPin?: boolean
    }) => api(`/api/members/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] })
    },
  })

  const retirerMembre = useMutation({
    mutationFn: (id: string) =>
      api(`/api/members/${id}`, { method: 'DELETE', body: JSON.stringify({}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] })
    },
  })

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
        description: `Sidi ${nouveauNom} a rejoint la zawiya de ${VILLE_LABEL[villeAjout]}. Il posera son code à son premier passage.`,
      })
      setNouveauNom('')
    },
    onError: () => toast({ title: 'Impossible d\u2019ajouter', variant: 'destructive' }),
  })

  const referent = (membres ?? []).find((m) => m.role === 'REFERENT')
  const demandes = (membres ?? []).filter((m) => m.status === 'PENDING')
  const actifs = (membres ?? []).filter((m) => m.status !== 'PENDING')

  /* Basculer la zawiya d'un frère — Nîmes → Avignon → Montpellier */
  const basculerVille = (m: Member) => {
    const autre = CYCLE_VILLE[m.city] ?? 'NIMES'
    majMembre.mutate({ id: m.id, city: autre })
    toast({
      title: `${m.name} → ${VILLE_LABEL[autre]}`,
      description:
        autre === 'NIMES'
          ? 'Il retrouve tous les droits des frères de Nîmes.'
          : `Il passe en lecture et participation, comme Avignon et Montpellier — ses droits particuliers restent.`,
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

        {/* ─── Demandes d'inscription ─── */}
        {demandes.length > 0 && (
          <section aria-label="Demandes d'inscription" className="space-y-3">
            <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-gold-vif">
              <UserRoundPlus className="h-4 w-4" /> Demandes d'inscription
              <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-gold-vif">
                {demandes.length}
              </span>
            </h3>
            <p className="rounded-xl bg-or-pale px-3 py-2 text-xs leading-relaxed text-gold-vif">
              Ces frères ont renseigné leur prénom et leur code à la porte d'entrée —
              ouvre-leur l'accès, ou décline la demande.
            </p>
            <div className="defile-fin max-h-52 space-y-1.5 overflow-y-auto rounded-2xl border border-accent/25 bg-card p-2 shadow-sm">
              {demandes.map((m) => (
                <motion.div
                  layout
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-or-pale/60 px-3 py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-secondary-foreground">
                    <Hourglass className="h-3.5 w-3.5 shrink-0 text-gold-vif" />
                    <span className="truncate">Sidi {m.name}</span>
                    <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-vif">
                      {VILLE_LABEL[m.city] ?? m.city}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1.5">
                    <Button
                      size="sm"
                      onClick={() =>
                        majMembre.mutate(
                          { id: m.id, status: 'ACTIVE' },
                          {
                            onSuccess: () =>
                              toast({
                                title: `Accès ouvert à Sidi ${m.name}`,
                                description: 'Il peut entrer avec son code personnel.',
                              }),
                          }
                        )
                      }
                      className="h-8 gap-1 rounded-full bg-primary px-3 text-[11px] text-white hover:bg-emerald-deep"
                    >
                      <Check className="h-3.5 w-3.5" /> Valider
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        retirerMembre.mutate(m.id, {
                          onSuccess: () =>
                            toast({ title: `Demande de Sidi ${m.name} déclinée` }),
                        })
                      }
                      className="h-8 gap-1 rounded-full border-destructive/30 px-3 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" /> Décliner
                    </Button>
                  </span>
                </motion.div>
              ))}
            </div>
          </section>
        )}

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

        {/* ─── Membres : rôles, groupes, droits, accès ─── */}
        <section aria-label="Membres" className="space-y-3">
          <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
            <Shield className="h-4 w-4" /> Frères de la zaouia
          </h3>
          <p className="rounded-xl bg-sand/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            Chaque frère porte un <strong>groupe</strong> (sa zawiya), un <strong>rôle</strong> et
            d'éventuels <strong>droits particuliers</strong> : les frères de{' '}
            <strong className="text-primary">Nîmes</strong> publient les annonces, sondages et
            ijtima' ; ceux d'<strong className="text-gold-vif">Avignon</strong> et de{' '}
            <strong className="text-gold-vif">Montpellier</strong> lisent et participent. Le bouton{' '}
            <SlidersHorizontal className="inline h-3 w-3" /> accorde ou retire un droit précis à
            n'importe quel frère.
          </p>
          <div className="defile-fin max-h-80 space-y-1 overflow-y-auto rounded-2xl border border-primary/12 bg-card p-2 shadow-sm">
            {actifs.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex flex-col gap-1.5 rounded-xl px-3 py-2 transition-colors hover:bg-background',
                  m.status === 'BLOCKED' && 'opacity-75'
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-secondary-foreground">
                    <UserRound className="h-3.5 w-3.5 shrink-0 text-primary/50" />
                    <span className="truncate">Sidi {m.name}</span>
                    <button
                      onClick={() => basculerVille(m)}
                      title={`Basculer vers ${VILLE_LABEL[CYCLE_VILLE[m.city] ?? 'NIMES']} — ${m.city === 'NIMES' ? 'il passera en lecture et participation' : 'il retrouvera les droits de Nîmes'}`}
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors',
                        m.city === 'NIMES'
                          ? 'bg-primary/10 text-primary hover:bg-primary/20'
                          : 'bg-accent/15 text-gold-vif hover:bg-accent/25'
                      )}
                    >
                      {VILLE_LABEL[m.city] ?? m.city}
                    </button>
                    {lireSurcharges(m.perms) &&
                      Object.keys(lireSurcharges(m.perms)).length > 0 && (
                        <span
                          title="Ce frère porte des droits particuliers"
                          className="shrink-0 rounded-full bg-primary/12 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary"
                        >
                          <SlidersHorizontal className="mr-0.5 inline h-2.5 w-2.5" />
                          droits
                        </span>
                      )}
                    {m.status === 'BLOCKED' && (
                      <span className="shrink-0 rounded-full bg-destructive/12 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-destructive">
                        {STATUT_LABEL[m.status]}
                      </span>
                    )}
                  </span>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
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
                          r.role === 'TREASURER' && m.role !== 'TREASURER'
                            ? `Nommer trésorier (remplace l'actuel)`
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

                {/* Ligne d'accès : droits particuliers, code, révocation */}
                <div className="flex flex-wrap items-center gap-1.5 pl-6">
                  <button
                    onClick={() => setMembreDroits(m)}
                    className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    title="Accorder ou retirer des droits précis à ce frère"
                  >
                    <SlidersHorizontal className="h-3 w-3" /> Droits
                  </button>
                  <button
                    onClick={() =>
                      majMembre.mutate(
                        { id: m.id, resetPin: true },
                        {
                          onSuccess: () =>
                            toast({
                              title: `Code de Sidi ${m.name} réinitialisé`,
                              description: 'Il en choisira un nouveau à sa prochaine entrée.',
                            }),
                        }
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    title="Réinitialiser son code personnel — utile s'il change de téléphone ou l'oublie"
                  >
                    <KeyRound className="h-3 w-3" /> Code
                  </button>
                  {m.status === 'BLOCKED' ? (
                    <button
                      onClick={() =>
                        majMembre.mutate(
                          { id: m.id, status: 'ACTIVE' },
                          {
                            onSuccess: () =>
                              toast({
                                title: `Accès de Sidi ${m.name} rétabli`,
                                description: 'Il entre à nouveau avec son code personnel.',
                              }),
                          }
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
                      title="Rétablir son accès"
                    >
                      <ShieldCheck className="h-3 w-3" /> Rétablir
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        majMembre.mutate(
                          { id: m.id, status: 'BLOCKED' },
                          {
                            onSuccess: () =>
                              toast({
                                title: `Accès de Sidi ${m.name} révoqué`,
                                description: 'Il ne pourra plus entrer avec son code.',
                              }),
                          }
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Révoquer son accès — s'il quitte la zaouia ou perd son téléphone"
                    >
                      <Ban className="h-3 w-3" /> Révoquer
                    </button>
                  )}
                  <button
                    onClick={() => setASupprimer(m)}
                    className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Retirer Sidi de la liste — ses présences et contributions partent avec lui"
                  >
                    <Trash2 className="h-3 w-3" /> Supprimer
                  </button>
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
              <div className="flex flex-wrap gap-1.5">
                {VILLES.map((v) => (
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

      {/* Dialogue des droits particuliers d'un frère */}
      <DroitsDialog
        membre={membreDroits}
        onOpenChange={(v) => !v && setMembreDroits(null)}
      />

      {/* Confirmation avant de supprimer définitivement un frère */}
      {aSupprimer && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-encre/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-destructive/20 bg-ivoire p-6 shadow-2xl">
            <h3 className="font-display text-xl text-encre">Retirer Sidi {aSupprimer.name} ?</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Il disparaît de la liste des frères — avec ses présences, contributions et
              votes. Cette action est définitive.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setASupprimer(null)}
                className="rounded-full"
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={() =>
                  retirerMembre.mutate(aSupprimer.id, {
                    onSuccess: () => {
                      toast({
                        title: `Sidi ${aSupprimer.name} a quitté la liste`,
                        description: 'Ses données ont été retirées.',
                      })
                      setASupprimer(null)
                    },
                    onError: () =>
                      toast({
                        title: 'Suppression impossible',
                        variant: 'destructive',
                      }),
                  })
                }
                disabled={retirerMembre.isPending}
                className="rounded-full"
              >
                <Trash2 className="mr-1 h-4 w-4" /> Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  )
}

/* ═══════════════ Droits particuliers d'un frère ═══════════════ */
function DroitsDialog({
  membre,
  onOpenChange,
}: {
  membre: Member | null
  onOpenChange: (v: boolean) => void
}) {
  const qc = useQueryClient()
  const { toast } = useToast()
  const open = membre !== null

  const majMembre = useMutation({
    mutationFn: ({ id, perms }: { id: string; perms: Record<string, boolean> | null }) =>
      api(`/api/members/${id}`, { method: 'PATCH', body: JSON.stringify({ perms }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['members'] })
    },
  })

  /* État local des surcharges — synchronisé à l'ouverture */
  const [surcharges, setSurcharges] = useState<Surcharges>({})
  const [initialise, setInitialise] = useState(false)
  if (open && !initialise && membre) {
    setSurcharges(lireSurcharges(membre.perms))
    setInitialise(true)
  }
  if (!open && initialise) setInitialise(false)

  if (!membre) return null

  const appliquer = (nouvelles: Surcharges) => {
    setSurcharges(nouvelles)
    majMembre.mutate(
      { id: membre.id, perms: Object.keys(nouvelles).length ? nouvelles : null },
      {
        onError: () =>
          toast({
            title: 'Impossible d’enregistrer',
            description: 'Réessaie dans un instant.',
            variant: 'destructive',
          }),
      }
    )
  }

  const basculer = (famille: FamilleDroits, valeur: boolean) => {
    const defaut = peut(membre.city, 'MEMBER', DROIT_DE_LA_FAMILLE[famille])
    const nouvelles = { ...surcharges }
    if (valeur === defaut) {
      /* Retour au droit du groupe — la surcharge disparaît */
      delete nouvelles[famille]
    } else {
      nouvelles[famille] = valeur
    }
    appliquer(nouvelles)
  }

  const nombreSurcharges = Object.keys(surcharges).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border-primary/15 bg-ivoire p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-encre">
            <SlidersHorizontal className="h-5 w-5 text-primary" /> Droits de Sidi {membre.name}
          </DialogTitle>
          <DialogDescription>
            {VILLE_LABEL[membre.city] ?? membre.city} · {ROLE_LABEL[membre.role] ?? 'Membre'} —
            accorde ou retire des droits précis, au-dessus de ceux de son groupe.
          </DialogDescription>
        </DialogHeader>

        {membre.role === 'REFERENT' ? (
          <p className="rounded-xl bg-sand/60 px-3 py-3 text-sm leading-relaxed text-muted-foreground">
            Le référent porte toutes les charges de la zaouia — il peut déjà tout faire.
          </p>
        ) : (
          <div className="space-y-2">
            {FAMILLES_DROITS.map((f) => {
              const defaut = peut(membre.city, 'MEMBER', DROIT_DE_LA_FAMILLE[f.id])
              const particuliere = f.id in surcharges
              const effective = particuliere
                ? surcharges[f.id] === true
                : peut(membre.city, membre.role, DROIT_DE_LA_FAMILLE[f.id], surcharges)
              return (
                <div
                  key={f.id}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors',
                    particuliere
                      ? effective
                        ? 'border-primary/30 bg-primary/6'
                        : 'border-accent/35 bg-or-pale/70'
                      : 'border-primary/10 bg-card'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-secondary-foreground">{f.label}</p>
                    <p className="text-[11px] leading-snug text-brouillard">{f.detail}</p>
                    <p
                      className={cn(
                        'mt-1 text-[10px] font-bold uppercase tracking-wider',
                        particuliere
                          ? effective
                            ? 'text-primary'
                            : 'text-gold-vif'
                          : 'text-brouillard-clair'
                      )}
                    >
                      {particuliere
                        ? effective
                          ? 'droit particulier accordé'
                          : 'droit retiré (particulier)'
                        : `droit du groupe — ${defaut ? 'oui' : 'non'}`}
                    </p>
                  </div>
                  <Switch
                    checked={effective}
                    onCheckedChange={(v) => basculer(f.id, v)}
                    aria-label={`${f.label} — ${effective ? 'accordé' : 'refusé'}`}
                  />
                </div>
              )
            })}

            {nombreSurcharges > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => appliquer({})}
                className="w-full rounded-full border-dashed border-primary/40 text-primary"
              >
                Revenir aux droits du groupe
              </Button>
            )}
            <p className="text-center text-[10px] leading-relaxed text-brouillard-clair">
              Un interrupteur sur sa position de groupe fait disparaître le réglage particulier.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full rounded-full bg-primary text-white hover:bg-emerald-deep"
          >
            Terminé
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════════ Profil : « Je suis… » — avec code personnel ═══════════════ */
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
  const [erreur, setErreur] = useState<string | null>(null)
  const choix = choixManuel ?? name ?? ''

  /* Les frères de MA zawiya — on y cherche, on y entre */
  const freresVille = (membres ?? []).filter((m) => m.city === ville && m.status === 'ACTIVE')
  const monMembre: Member | undefined = freresVille.find((m) => m.name === name)
  const cestMoi = monMembre !== undefined && choix.trim() === monMembre.name

  const valider = () => {
    const v = choix.trim()
    if (!v) return

    /* Rester soi-même — rien à faire */
    if (cestMoi) {
      onOpenChange(false)
      return
    }

    /* La porte est ouverte : on entre sans code — la sécurité
       reviendra avec les champs de la porte d'entrée. */
    const frere = freresVille.find((m) => m.name === v)
    if (!frere) {
      setErreur('Ce prénom n’est pas inscrit à la zawiya.')
      return
    }
    setName(frere.name)
    setMember(frere.id, frere.role, frere.city, frere.perms)
    setChoixManuel(null)
    setErreur(null)
    toast({ title: `Marhaban bik, Sidi ${frere.name}` })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl border-primary/15 bg-ivoire p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-encre">Je suis…</DialogTitle>
          <DialogDescription>
            {monMembre
              ? `Sidi ${monMembre.name} — ${ROLE_LABEL[monMembre.role] ?? 'membre'} de la zawiya de ${VILLE_LABEL[monMembre.city] ?? 'Nîmes'}`
              : `Indique ton prénom pour la zawiya de ${VILLE_LABEL[ville] ?? 'Nîmes'}.`}
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

          {/* La porte est ouverte — aucun code n’est demandé */}
          {erreur && (
            <p role="alert" className="text-center text-xs font-medium text-gold-vif">
              {erreur}
            </p>
          )}

          <Button
            onClick={valider}
            disabled={!choix.trim()}
            className="w-full rounded-full bg-primary py-3 text-white hover:bg-emerald-deep"
          >
            {cestMoi ? 'Fermer' : 'Entrer'}
          </Button>

          {monMembre && (
            <Button
              variant="ghost"
              onClick={() => {
                logout()
                setChoixManuel(null)
                setErreur(null)
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

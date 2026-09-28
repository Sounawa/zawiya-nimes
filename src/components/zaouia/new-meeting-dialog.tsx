'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, ListPlus, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateMeeting, useUpdateMeeting, useSettings } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { JOURS_COMPLETS, parseProgram, type Meeting, type ProgramLine } from '@/lib/types'
import { cn } from '@/lib/utils'

/* Deux modèles, pas un de plus : l'ijtima' du soir, ou la sadaqa. */
const MODELES = [
  { nom: "Al-Ijtimâ'", icon: '🕌', duree: '19:30' },
  { nom: 'Sadaqa', icon: '🍽️', duree: '19:30' },
]

/* Les moments du programme — le menu déroulant de la réunion.
   Dans l'ordre du soir, tel que la zawiya les vit. */
const MOMENTS: { label: string; icon: string }[] = [
  { label: 'Salât al-Maghreb', icon: '🕌' },
  { label: 'Salât al-Isha', icon: '🌙' },
  { label: 'Taqwiya', icon: '📖' },
  { label: 'Wadhifa', icon: '📿' },
  { label: 'Latif ibn Hajar', icon: '🤲' },
]

/** Le moment connu porte son icône ; un mot inconnu garde la mosquée */
function iconeDe(label: string): string {
  return MOMENTS.find((m) => m.label.toLowerCase() === label.toLowerCase())?.icon ?? '🕌'
}

const NUM_JOUR: Record<string, number> = {
  Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6, Dimanche: 0,
}

export function NewMeetingDialog({
  open,
  onOpenChange,
  meeting = null,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  /** Réunion à modifier — null = création */
  meeting?: Meeting | null
}) {
  const create = useCreateMeeting()
  const update = useUpdateMeeting()
  const { data: settings } = useSettings()
  const { toast } = useToast()

  const edition = meeting !== null

  // Réglages des jours d'ijtima + lieu par défaut
  const jours = settings?.ijtima_days?.jours ?? []
  const lieuDefaut = settings?.app_config?.lieu ?? ''
  const villeDefaut = settings?.app_config?.ville || 'Nîmes'

  const [modele, setModele] = useState<string>(MODELES[0].nom)
  const [ville, setVille] = useState('')
  const [date, setDate] = useState('')
  const [jourChoisi, setJourChoisi] = useState<string>('')
  const [titre, setTitre] = useState<string>(MODELES[0].nom)
  const [icon, setIcon] = useState<string>(MODELES[0].icon)
  const [adresse, setAdresse] = useState('')
  const [debut, setDebut] = useState('19:30')
  const [fin, setFin] = useState('22:15')
  const [annonce, setAnnonce] = useState('')
  /* Le programme : inclus par défaut, la personne choisit de le mettre ou pas */
  const [avecProgramme, setAvecProgramme] = useState(true)
  const [programme, setProgramme] = useState<ProgramLine[]>(
    MOMENTS.map((m) => ({ time: '', label: m.label, icon: m.icon }))
  )

  /* Pré-remplir pendant le rendu (motif React officiel) :
     — édition : champs depuis la réunion existante
     — création : jour d'ijtima actif le plus proche + lieu enregistré */
  const [prerempli, setPrerempli] = useState(false)
  if (open && !prerempli) {
    if (edition && meeting) {
      const d = new Date(meeting.date)
      setVille(meeting.city ?? '')
      setAdresse(meeting.address ?? '')
      setDate(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      )
      setJourChoisi(JOURS_COMPLETS[(d.getDay() + 6) % 7])
      setTitre(meeting.title)
      setIcon(meeting.icon ?? '🕌')
      setDebut(meeting.startTime ?? '19:30')
      setFin(meeting.endTime ?? '22:15')
      setAnnonce(meeting.announcement ?? '')
      const prog = parseProgram(meeting)
      setProgramme(
        prog.length
          ? prog.map((l) => ({ ...l, icon: l.icon || iconeDe(l.label) }))
          : MOMENTS.map((m) => ({ time: '', label: m.label, icon: m.icon }))
      )
      setAvecProgramme(prog.length > 0)
      /* Le modèle reconnu, sinon une réunion d'un autre nom */
      setModele(MODELES.find((m) => m.nom === meeting.title)?.nom ?? '— autre —')
    } else {
      setVille(villeDefaut)
      setAdresse(lieuDefaut)
      const prochains = jours
        .filter((j) => j.actif && NUM_JOUR[j.label] !== undefined)
        .map((j) => {
          const d = new Date()
          const diff = (NUM_JOUR[j.label] - d.getDay() + 7) % 7 || 7
          d.setDate(d.getDate() + diff)
          return { label: j.label, heure: j.heure, d }
        })
        .sort((a, b) => a.d.getTime() - b.d.getTime())
      if (prochains[0]) {
        const p = prochains[0]
        const d = p.d
        setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
        setJourChoisi(p.label)
        setDebut(p.heure || '19:30')
      }
    }
    setPrerempli(true)
  }

  /** Choisir un jour de la semaine → prochaine date + heure des réglages */
  const choisirJour = (label: string) => {
    setJourChoisi(label)
    const num = NUM_JOUR[label]
    if (num === undefined) return
    const d = new Date()
    const diff = (num - d.getDay() + 7) % 7 || 7
    d.setDate(d.getDate() + diff)
    setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    const regl = jours.find((j) => j.label === label)
    if (regl?.heure) setDebut(regl.heure)
  }

  const appliquerModele = (nom: string) => {
    setModele(nom)
    const m = MODELES.find((x) => x.nom === nom)
    if (m) {
      setTitre(m.nom)
      setIcon(m.icon)
      setDebut(m.duree)
    }
  }

  const ajouterMoment = (label: string) => {
    const moment = MOMENTS.find((m) => m.label === label)
    if (!moment) return
    setProgramme((p) =>
      p.some((l) => l.label.toLowerCase() === label.toLowerCase())
        ? p
        : [...p, { time: '', label: moment.label, icon: moment.icon }]
    )
  }

  const majLigne = (i: number, patch: Partial<ProgramLine>) =>
    setProgramme((p) => p.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  const retirerLigne = (i: number) =>
    setProgramme((p) => p.filter((_, j) => j !== i))

  const publier = () => {
    if (!titre.trim() || !date) {
      toast({
        title: 'Champs manquants',
        description: 'Le jour (ou la date) est nécessaire.',
        variant: 'destructive',
      })
      return
    }
    const programmePropre: ProgramLine[] = avecProgramme
      ? programme
          .filter((l) => l.label.trim())
          .map((l) => ({ time: l.time || '—', label: l.label.trim(), icon: l.icon }))
      : []
    const payload = {
      title: titre.trim(),
      icon,
      city: ville.trim() || null,
      address: adresse.trim() || null,
      date,
      startTime: debut || null,
      endTime: fin || null,
      announcement: annonce.trim() || null,
      word: null,
      program: programmePropre.length ? programmePropre : null,
    }
    if (edition && meeting) {
      update.mutate(
        { id: meeting.id, ...payload },
        {
          onSuccess: () => {
            toast({ title: 'Réunion modifiée', description: `${titre} — ${date}` })
            onOpenChange(false)
            reset()
          },
          onError: () =>
            toast({ title: 'Échec de la modification', variant: 'destructive' }),
        }
      )
      return
    }
    create.mutate(
      payload,
      {
        onSuccess: () => {
          toast({ title: 'Réunion publiée', description: `${titre} — ${date}` })
          onOpenChange(false)
          reset()
        },
        onError: () =>
          toast({ title: 'Échec de la publication', variant: 'destructive' }),
      }
    )
  }

  const reset = () => {
    setModele(MODELES[0].nom)
    setTitre(MODELES[0].nom)
    setIcon(MODELES[0].icon)
    setAnnonce('')
    setAvecProgramme(true)
    setProgramme(MOMENTS.map((m) => ({ time: '', label: m.label, icon: m.icon })))
    setJourChoisi('')
    setPrerempli(false)
  }

  // Les jours de la semaine, dans l'ordre — ceux des réglages marqués « · »
  const joursReglages = jours.filter((j) => j.actif).map((j) => j.label)
  const tousLesJours = JOURS_COMPLETS

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto rounded-3xl border-primary/15 bg-ivoire p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-encre">
            {edition && <Pencil className="h-5 w-5 text-gold" />}
            {edition ? 'Modifier la réunion' : 'Nouvelle réunion'}
          </DialogTitle>
          <DialogDescription>
            {edition
              ? 'Ajuste le jour, le lieu, le programme — tout est modifiable.'
              : 'Choisis le modèle et le jour — le programme est prêt.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ─── Le modèle : Al-Ijtimâ' ou Sadaqa ─── */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Modèle
            </Label>
            <Select value={modele} onValueChange={appliquerModele}>
              <SelectTrigger className="rounded-xl border-primary/25 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELES.map((m) => (
                  <SelectItem key={m.nom} value={m.nom}>
                    {m.icon} {m.nom}
                  </SelectItem>
                ))}
                {modele === '— autre —' && (
                  <SelectItem value="— autre —">— autre —</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* ─── Le jour : pastilles dans l'ordre de la semaine ─── */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> Jour de la semaine
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {tousLesJours.map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => choisirJour(j)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                    jourChoisi === j
                      ? 'bg-primary text-white shadow-md shadow-primary/25'
                      : joursReglages.includes(j)
                        ? 'bg-primary/8 text-primary ring-1 ring-primary/25 hover:bg-primary/15'
                        : 'bg-card text-muted-foreground ring-1 ring-primary/12 hover:bg-primary/5'
                  )}
                  title={joursReglages.includes(j) ? 'Jour configuré dans les réglages' : undefined}
                >
                  {j}
                  {joursReglages.includes(j) && jourChoisi !== j && ' ·'}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-brouillard-clair">
              Les jours marqués «&nbsp;·&nbsp;» sont ceux des réglages — la date est calculée automatiquement.
            </p>
          </div>

          {/* ─── Le lieu : ville + adresse + date précise ─── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Ville
              </Label>
              <Input value={ville} onChange={(e) => setVille(e.target.value)} className="rounded-xl border-primary/25 bg-card" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Date précise</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border-primary/25 bg-card" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Adresse du lieu</Label>
            <Input
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Rue, numéro, sonnette…"
              className="rounded-xl border-primary/25 bg-card"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Début</Label>
              <Input type="time" value={debut} onChange={(e) => setDebut(e.target.value)} className="rounded-xl border-primary/25 bg-card" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Fin</Label>
              <Input type="time" value={fin} onChange={(e) => setFin(e.target.value)} className="rounded-xl border-primary/25 bg-card" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Annonce du jour <span className="normal-case text-brouillard-clair">(facultatif — corail)</span>
            </Label>
            <Textarea value={annonce} onChange={(e) => setAnnonce(e.target.value)} rows={2} className="rounded-xl border-accent/40 bg-ivoire" />
          </div>

          {/* ─── Le programme : inclus par défaut, au choix ─── */}
          <div className="space-y-2.5 rounded-2xl border border-primary/15 bg-card/60 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Programme
                </Label>
                <p className="mt-0.5 text-[10.5px] text-brouillard">
                  {avecProgramme
                    ? 'Il figurera dans la réunion — retire les moments inutiles.'
                    : 'La réunion paraîtra sans programme.'}
                </p>
              </div>
              <Switch
                checked={avecProgramme}
                onCheckedChange={setAvecProgramme}
                aria-label="Inclure le programme"
              />
            </div>

            {avecProgramme && (
              <>
                {programme.length > 0 && (
                  <ul className="space-y-1.5">
                    {programme.map((l, i) => (
                      <motion.li
                        key={`${l.label}-${i}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Input
                          type="time"
                          value={l.time}
                          onChange={(e) => majLigne(i, { time: e.target.value })}
                          className="w-28 rounded-xl border-primary/25 bg-card"
                          aria-label="Heure du moment"
                        />
                        <span aria-hidden className="w-6 shrink-0 text-center text-lg">
                          {l.icon}
                        </span>
                        <Input
                          value={l.label}
                          onChange={(e) => majLigne(i, { label: e.target.value })}
                          className="flex-1 rounded-xl border-primary/25 bg-card"
                        />
                        <button
                          type="button"
                          onClick={() => retirerLigne(i)}
                          aria-label={`Retirer ${l.label}`}
                          className="rounded-full p-2 text-destructive/60 hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                )}

                {/* Le menu déroulant des moments */}
                <Select onValueChange={ajouterMoment}>
                  <SelectTrigger className="w-full rounded-xl border-dashed border-primary/40 bg-card text-primary">
                    <span className="flex items-center gap-1.5 text-[12.5px] font-semibold">
                      <ListPlus className="h-3.5 w-3.5" /> Ajouter un moment au programme
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {MOMENTS.map((m) => (
                      <SelectItem key={m.label} value={m.label}>
                        {m.icon} {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!programme.length && (
                  <p className="text-[10.5px] text-brouillard-clair">
                    Plus aucun moment — ajoutes-en un, ou éteins le programme.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full text-muted-foreground">
            Annuler
          </Button>
          <Button
            onClick={publier}
            disabled={create.isPending || update.isPending}
            className="rounded-full bg-primary px-8 text-white hover:bg-emerald-deep"
          >
            {edition
              ? update.isPending ? 'Enregistrement…' : 'Enregistrer les modifications'
              : create.isPending ? 'Publication…' : 'Publier'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

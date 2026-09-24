'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
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

const MODELES = [
  { nom: "Al-Ijtimâ' du samedi", icon: '🕌', duree: '19:30' },
  { nom: 'Latîf al-Kabîr', icon: '✦', duree: '19:30' },
  { nom: 'Wadhifa du lundi', icon: '📖', duree: '20:00' },
  { nom: "Sadaqa de l'Ijtimâ'", icon: '🍽️', duree: '19:30' },
]

const ICONES = ['🕌', '✦', '📖', '🍽️', '🎵', '🌙', '🌿', '⭐', '💫', '🕊️']

const NUM_JOUR: Record<string, number> = {
  Dimanche: 0, Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6,
}

interface Ligne {
  time: string
  label: string
  icon: string
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

  const [modele, setModele] = useState<string>('— aucun —')
  const [ville, setVille] = useState('')
  const [date, setDate] = useState('')
  const [jourChoisi, setJourChoisi] = useState<string>('')
  const [titre, setTitre] = useState('')
  const [icon, setIcon] = useState('🕌')
  const [adresse, setAdresse] = useState('')
  const [debut, setDebut] = useState('19:30')
  const [fin, setFin] = useState('22:15')
  const [annonce, setAnnonce] = useState('')
  const [mot, setMot] = useState('')
  const [invites, setInvites] = useState('')
  const [programme, setProgramme] = useState<Ligne[]>([])

  /* Pré-remplir pendant le rendu (motif React officiel) :
     — édition : champs depuis la réunion existante
     — création : jour d'ijtima actif le plus proche + lieu enregistré dans les réglages */
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
      setMot(meeting.word ?? '')
      setProgramme(parseProgram(meeting))
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
    if (nom === '— aucun —') return
    const m = MODELES.find((x) => x.nom === nom)
    if (m) {
      setTitre(m.nom)
      setIcon(m.icon)
      setDebut(m.duree)
    }
  }

  const ajouterLigne = () => setProgramme((p) => [...p, { time: '', label: '', icon: '🕌' }])
  const majLigne = (i: number, patch: Partial<Ligne>) =>
    setProgramme((p) => p.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  const retirerLigne = (i: number) =>
    setProgramme((p) => p.filter((_, j) => j !== i))

  const publier = () => {
    if (!titre.trim() || !date) {
      toast({
        title: 'Champs manquants',
        description: 'Le titre et le jour (ou la date) sont nécessaires.',
        variant: 'destructive',
      })
      return
    }
    const programmePropre: ProgramLine[] = programme
      .filter((l) => l.label.trim())
      .map((l) => ({ time: l.time || '—', label: l.label.trim(), icon: l.icon }))
    const payload = {
      title: titre.trim(),
      icon,
      city: ville.trim() || null,
      address: adresse.trim() || null,
      date,
      startTime: debut || null,
      endTime: fin || null,
      announcement: annonce.trim() || null,
      word: mot.trim() || null,
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
    setModele('— aucun —')
    setTitre('')
    setAnnonce('')
    setMot('')
    setInvites('')
    setProgramme([])
    setJourChoisi('')
    setPrerempli(false)
  }

  // Jours des réglages d'abord (actifs marqués), puis les autres
  const joursReglages = jours.filter((j) => j.actif).map((j) => j.label)
  const tousLesJours = [
    ...joursReglages,
    ...JOURS_COMPLETS.filter((j) => !joursReglages.includes(j)),
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto rounded-3xl border-[#0b5d42]/15 bg-[#fdfcf8] p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl text-[#123c2d]">
            {edition && <Pencil className="h-5 w-5 text-[#b8923a]" />}
            {edition ? 'Modifier la réunion' : 'Nouvelle réunion'}
          </DialogTitle>
          <DialogDescription>
            {edition
              ? 'Ajuste le jour, le lieu, le programme — tout est modifiable.'
              : 'Choisis le jour et le lieu — un modèle préremplit le reste.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Modèle — création seule */}
          {!edition && (
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
              Modèle
            </Label>
            <Select value={modele} onValueChange={appliquerModele}>
              <SelectTrigger className="rounded-xl border-[#0b5d42]/25 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="— aucun —">— aucun —</SelectItem>
                {MODELES.map((m) => (
                  <SelectItem key={m.nom} value={m.nom}>
                    {m.icon} {m.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          )}

          {/* ─── Le jour : pastilles rapides ─── */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
              <CalendarDays className="h-3.5 w-3.5" /> Jour de l'ijtima
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
                      ? 'bg-[#0b5d42] text-white shadow-md shadow-[#0b5d42]/25'
                      : joursReglages.includes(j)
                        ? 'bg-[#0b5d42]/8 text-[#0b5d42] ring-1 ring-[#0b5d42]/25 hover:bg-[#0b5d42]/15'
                        : 'bg-white text-[#78877d] ring-1 ring-[#0b5d42]/12 hover:bg-[#0b5d42]/5'
                  )}
                  title={joursReglages.includes(j) ? 'Jour configuré dans les réglages' : undefined}
                >
                  {j}
                  {joursReglages.includes(j) && jourChoisi !== j && ' ·'}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#b6b1a0]">
              Les jours marqués «&nbsp;·&nbsp;» sont ceux des réglages — la date est calculée automatiquement.
            </p>
          </div>

          {/* ─── Le lieu : ville + adresse ─── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
                <MapPin className="h-3.5 w-3.5" /> Ville
              </Label>
              <Input value={ville} onChange={(e) => setVille(e.target.value)} className="rounded-xl border-[#0b5d42]/25 bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">Date précise</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border-[#0b5d42]/25 bg-white" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">Adresse du lieu</Label>
            <Input
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Rue, numéro, sonnette…"
              className="rounded-xl border-[#0b5d42]/25 bg-white"
            />
          </div>

          {/* Objet */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
              Objet de l'ishtima
            </Label>
            <div className="flex gap-2">
              <Input
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Al-Ijtimâ' du samedi…"
                className="rounded-xl border-[#0b5d42]/25 bg-white"
              />
              <div className="flex shrink-0 items-center gap-1 rounded-xl border border-[#0b5d42]/25 bg-white px-2">
                {ICONES.slice(0, 5).map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    aria-label={`Icône ${ic}`}
                    className={
                      icon === ic
                        ? 'rounded-lg bg-[#0b5d42]/12 p-1 text-lg'
                        : 'rounded-lg p-1 text-lg opacity-50 transition-opacity hover:opacity-100'
                    }
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {ICONES.slice(5).map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  aria-label={`Icône ${ic}`}
                  className={
                    icon === ic
                      ? 'rounded-lg bg-[#0b5d42]/12 p-1 text-lg'
                      : 'rounded-lg p-1 text-lg opacity-50 transition-opacity hover:opacity-100'
                  }
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">Début</Label>
              <Input type="time" value={debut} onChange={(e) => setDebut(e.target.value)} className="rounded-xl border-[#0b5d42]/25 bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">Fin</Label>
              <Input type="time" value={fin} onChange={(e) => setFin(e.target.value)} className="rounded-xl border-[#0b5d42]/25 bg-white" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
              Annonce du jour <span className="normal-case text-[#b6b1a0]">(facultatif — corail)</span>
            </Label>
            <Textarea value={annonce} onChange={(e) => setAnnonce(e.target.value)} rows={2} className="rounded-xl border-[#c9a24b]/40 bg-[#fdfcf8]" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
              Le mot <span className="normal-case text-[#b6b1a0]">(facultatif)</span>
            </Label>
            <Input value={mot} onChange={(e) => setMot(e.target.value)} className="rounded-xl border-[#0b5d42]/25 bg-white" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
              Invités <span className="normal-case text-[#b6b1a0]">(un par ligne — « Lyon - 5 » = 5)</span>
            </Label>
            <Textarea value={invites} onChange={(e) => setInvites(e.target.value)} rows={2} placeholder={'Lyon - 5 foqaras\nSi Mustapha'} className="rounded-xl border-[#0b5d42]/25 bg-white" />
          </div>

          {/* Programme */}
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">Programme</Label>
            {programme.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
                <Input
                  type="time"
                  value={l.time}
                  onChange={(e) => majLigne(i, { time: e.target.value })}
                  className="w-28 rounded-xl border-[#0b5d42]/25 bg-white"
                />
                <Input
                  value={l.icon}
                  onChange={(e) => majLigne(i, { icon: e.target.value })}
                  className="w-14 rounded-xl border-[#0b5d42]/25 bg-white text-center"
                  aria-label="Icône"
                />
                <Input
                  value={l.label}
                  onChange={(e) => majLigne(i, { label: e.target.value })}
                  placeholder="Salât al-Maghreb…"
                  className="flex-1 rounded-xl border-[#0b5d42]/25 bg-white"
                />
                <button
                  type="button"
                  onClick={() => retirerLigne(i)}
                  aria-label="Retirer la ligne"
                  className="rounded-full p-2 text-[#b3452f]/60 hover:bg-[#b3452f]/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={ajouterLigne}
              className="gap-1.5 rounded-full border-dashed border-[#0b5d42]/40 text-[#0b5d42] hover:bg-[#0b5d42]/5"
            >
              <Plus className="h-3.5 w-3.5" /> Ajouter une ligne
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full text-[#78877d]">
            Annuler
          </Button>
          <Button
            onClick={publier}
            disabled={create.isPending || update.isPending}
            className="rounded-full bg-[#0b5d42] px-8 text-white hover:bg-[#0b3d2e]"
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

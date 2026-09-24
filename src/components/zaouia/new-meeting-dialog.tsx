'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
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
import { useCreateMeeting, useSettings } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { ProgramLine } from '@/lib/types'

const MODELES = [
  { nom: "Al-Ijtimâ' du samedi", icon: '🕌', duree: '19:30' },
  { nom: 'Latîf al-Kabîr', icon: '✦', duree: '19:30' },
  { nom: 'Wadhifa du lundi', icon: '📖', duree: '20:00' },
  { nom: "Sadaqa de l'Ijtimâ'", icon: '🍽️', duree: '19:30' },
]

const ICONES = ['🕌', '✦', '📖', '🍽️', '🎵', '🌙', '🌿', '⭐', '💫', '🕊️']

interface Ligne {
  time: string
  label: string
  icon: string
}

export function NewMeetingDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const create = useCreateMeeting()
  const { data: settings } = useSettings()
  const { toast } = useToast()

  // Réglages des jours d'ijtima
  const jours = settings?.ijtima_days?.jours ?? []

  const [modele, setModele] = useState<string>('— aucun —')
  const [ville, setVille] = useState('Saint-Denis')
  const [date, setDate] = useState('')
  const [titre, setTitre] = useState('')
  const [icon, setIcon] = useState('🕌')
  const [adresse, setAdresse] = useState(
    '28 rue Fontaine St Denis — Sonnette : El Fath'
  )
  const [debut, setDebut] = useState('19:30')
  const [fin, setFin] = useState('22:15')
  const [annonce, setAnnonce] = useState('')
  const [mot, setMot] = useState('')
  const [invites, setInvites] = useState('')
  const [programme, setProgramme] = useState<Ligne[]>([])

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

  // Pré-remplir pendant le rendu (motif React officiel) avec le prochain jour d'ijtima actif
  const [datePréremplie, setDatePréremplie] = useState(false)
  if (open && !datePréremplie && jours.length) {
    const prochains = jours
      .map((j) => {
        const num = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'].indexOf(
          j.label.toLowerCase()
        )
        if (num < 0 || !j.actif) return null
        const d = new Date()
        const diff = (num - d.getDay() + 7) % 7 || 7
        d.setDate(d.getDate() + diff)
        return d
      })
      .filter(Boolean)
      .sort((a, b) => a!.getTime() - b!.getTime()) as Date[]
    if (prochains[0]) {
      const d = prochains[0]
      setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
    setDatePréremplie(true)
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
        description: 'Le titre et la date sont nécessaires.',
        variant: 'destructive',
      })
      return
    }
    const programmePropre: ProgramLine[] = programme
      .filter((l) => l.label.trim())
      .map((l) => ({ time: l.time || '—', label: l.label.trim(), icon: l.icon }))
    const inv = invites
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join(' · ')
    create.mutate(
      {
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
      },
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
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-lg overflow-y-auto rounded-3xl border-[#0b5d42]/15 bg-[#fdfcf8] p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#123c2d]">
            Nouvelle réunion
          </DialogTitle>
          <DialogDescription>
            Choisis un modèle pour tout préremplir.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Modèle */}
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">Ville</Label>
              <Input value={ville} onChange={(e) => setVille(e.target.value)} className="rounded-xl border-[#0b5d42]/25 bg-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl border-[#0b5d42]/25 bg-white" />
            </div>
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

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#78877d]">Adresse</Label>
            <Input value={adresse} onChange={(e) => setAdresse(e.target.value)} className="rounded-xl border-[#0b5d42]/25 bg-white" />
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

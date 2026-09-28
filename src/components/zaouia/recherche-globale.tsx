'use client'

import { useEffect, useMemo, useState } from 'react'
import { useNav } from '@/lib/store'
import {
  useAnnouncements,
  useContent,
  useMeetings,
  usePolls,
} from '@/lib/api'
import { dateCourte, libelleSemaine } from '@/lib/format'
import { CHAPITRES_CAHIER } from '@/data/cahier'
import { CHAPITRES_ARABES } from '@/data/adhkar-docs'
import { useDemandeLecture } from './adhkar-section'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  BookOpenText,
  CalendarDays,
  Megaphone,
  Music,
  Search,
  Vote,
} from 'lucide-react'

/** Recherche globale — ⌘K / Ctrl+K, ou le bouton loupe du bandeau.
 *  Parcourt réunions, annonces, pratiques du cahier de wadhifa
 *  (phonétique et arabe) et sondages, puis conduit à la section. */

/** Retire les diacritiques de translittération : « Nâṣirî » → « nasiri ».
 *  Permet de trouver un chapitre sans taper les accents. */
function sansDiacritiques(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f\u064b-\u0652]/g, '')
    .normalize('NFC')
    .toLowerCase()
}
export function RechercheGlobale() {
  const [ouvert, setOuvert] = useState(false)
  const ouvrirSection = useNav((s) => s.ouvrir)

  const { data: meetings } = useMeetings()
  const { data: annonces } = useAnnouncements()
  const { data: sama } = useContent('SAMA')
  const { data: polls } = usePolls()

  /* Raccourci clavier ⌘K / Ctrl+K */
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOuvert((v) => !v)
      }
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [])

  /** Ouvre la section visée — les annonces n'ont pas de coquille pliable. */
  const allerA = (id: string) => {
    setOuvert(false)
    if (id === 'annonces') {
      requestAnimationFrame(() => {
        document.getElementById('annonces')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      })
    } else {
      ouvrirSection(id)
    }
  }

  /* Libellés pré-calculés (tri par date pour les réunions) */
  const reunionsTriees = useMemo(
    () => [...(meetings ?? [])].sort((a, b) => +new Date(a.date) - +new Date(b.date)),
    [meetings]
  )

  return (
    <>
      {/* Bouton loupe du bandeau — accessible au clavier et au doigt */}
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label="Rechercher (⌘K)"
        title="Rechercher (⌘K)"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary transition-colors hover:bg-primary/8 sm:h-10 sm:w-10"
      >
        <Search className="h-4.5 w-4.5" />
      </button>

      <CommandDialog
        open={ouvert}
        onOpenChange={setOuvert}
        title="Recherche dans la zawiya"
        description="Réunions, annonces, pratiques du wadhifa et sondages"
        className="sm:max-w-lg"
      >
        <CommandInput placeholder="Rechercher une réunion, une pratique, une annonce…" />
        <CommandList className="max-h-[65vh]">
          <CommandEmpty>Aucun résultat.</CommandEmpty>

          {/* ─── Réunions ─── */}
          {reunionsTriees.length > 0 && (
            <CommandGroup heading="Réunions">
              {reunionsTriees.map((m) => (
                <CommandItem
                  key={m.id}
                  value={`${m.title} ${m.city ?? ''} ${libelleSemaine(new Date(m.date))}`}
                  onSelect={() => allerA('ijtima')}
                  className="gap-3"
                >
                  <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{m.title}</span>
                    {m.city && (
                      <span className="ml-1.5 text-xs text-muted-foreground">· {m.city}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-gold">
                    {dateCourte(m.date)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* ─── Annonces ─── */}
          {(annonces?.length ?? 0) > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Annonces">
                {annonces!.map((a) => (
                  <CommandItem
                    key={a.id}
                    value={`${a.title ?? ''} ${a.text}`}
                    onSelect={() => allerA('annonces')}
                    className="gap-3"
                  >
                    <Megaphone className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-sm">{a.text}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* ─── Cahier de Wadhifa — pratiques en phonétique ─── */}
          <>
            <CommandSeparator />
            <CommandGroup heading="Cahier de Wadhifa — phonétique">
              {CHAPITRES_CAHIER.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`cahier ${sansDiacritiques(c.titre + ' ' + c.texte.slice(0, 300))}`}
                  onSelect={() => {
                    useDemandeLecture.getState().demander('kitab', c.id, 'ph')
                    allerA('adhkar')
                  }}
                  className="gap-3"
                >
                  <BookOpenText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{c.titre}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      · p. {c.debut}–{c.fin}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>

          {/* ─── Cahier de Wadhifa — pratiques en arabe (kitāb) ─── */}
          <>
            <CommandSeparator />
            <CommandGroup heading="Cahier de Wadhifa — كتاب الأذكار">
              {CHAPITRES_ARABES.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`kitab ${sansDiacritiques(c.translit).replace(/-/g, ' ')} ${sansDiacritiques(c.titreAr).replace(/-/g, ' ')} ${c.titreAr}`}
                  onSelect={() => {
                    useDemandeLecture.getState().demander('kitab', c.id, 'ar')
                    allerA('adhkar')
                  }}
                  className="gap-3"
                >
                  <BookOpenText className="h-4 w-4 shrink-0 text-gold" />
                  <span className="min-w-0 flex-1 truncate">
                    <span dir="rtl" className="font-arabic font-medium">{c.titreAr}</span>
                    <span className="ml-1.5 text-xs text-muted-foreground">{c.translit} · p. {c.debut}–{c.fin}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>

          {/* ─── Samâ' ─── */}
          {(sama?.length ?? 0) > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Samâ'">
                {sama!.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.title} ${c.subtitle ?? ''} ${c.body ?? ''}`}
                    onSelect={() => allerA('sama')}
                    className="gap-3"
                  >
                    <Music className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium">{c.title}</span>
                      {c.time && (
                        <span className="ml-1.5 text-xs text-muted-foreground">· {c.time}</span>
                      )}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* ─── Sondages ─── */}
          {(polls?.length ?? 0) > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Sondages">
                {polls!.map((p) => (
                  <CommandItem
                    key={p.id}
                    value={p.question}
                    onSelect={() => allerA('ijtima')}
                    className="gap-3"
                  >
                    <Vote className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-sm">{p.question}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}

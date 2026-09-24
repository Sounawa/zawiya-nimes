'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNav } from '@/lib/store'
import {
  useAnnouncements,
  useContent,
  useMeetings,
  useMembers,
  usePolls,
} from '@/lib/api'
import { dateCourte, libelleSemaine } from '@/lib/format'
import type { ContentItem } from '@/lib/types'
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
  UserRound,
  Vote,
  type LucideIcon,
} from 'lucide-react'

/** Recherche globale — ⌘K / Ctrl+K, ou le bouton loupe du bandeau.
 *  Parcourt réunions, frères, annonces, adhkâr et sondages,
 *  puis conduit à la section correspondante. */
export function RechercheGlobale() {
  const [ouvert, setOuvert] = useState(false)
  const ouvrirSection = useNav((s) => s.ouvrir)

  const { data: meetings } = useMeetings()
  const { data: membres } = useMembers()
  const { data: annonces } = useAnnouncements()
  const { data: adhkars } = useContent('ADHKAR')
  const { data: quran } = useContent('QURAN')
  const { data: sama } = useContent('SAMA')
  const { data: durus } = useContent('DURUS')
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
        description="Réunions, frères, annonces, adhkâr et sondages"
        className="sm:max-w-lg"
      >
        <CommandInput placeholder="Rechercher une réunion, un frère, une annonce…" />
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

          {/* ─── Frères ─── */}
          {(membres?.length ?? 0) > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Frères">
                {membres!.slice(0, 40).map((m) => (
                  <CommandItem
                    key={m.id}
                    value={`${m.name} frère ${m.role === 'TREASURER' ? 'trésorier' : ''}`}
                    onSelect={() => allerA('annuaire')}
                    className="gap-3"
                  >
                    <UserRound className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate font-medium">{m.name}</span>
                    {m.role === 'TREASURER' && (
                      <span className="shrink-0 rounded-full bg-accent/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold-vif">
                        Trésorier
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
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

          {/* ─── Adhkâr ─── */}
          {(adhkars?.length ?? 0) > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Adhkâr">
                {adhkars!.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.title} ${c.subtitle ?? ''} ${c.body ?? ''}`}
                    onSelect={() => allerA('adhkar')}
                    className="gap-3"
                  >
                    <BookOpenText className="h-4 w-4 shrink-0 text-primary" />
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

          {/* ─── Autres contenus spirituels — Qur'ân, Samâ', Durûs ─── */}
          {([
            { titre: "Qur'ân", donnees: quran, cible: 'quran', icone: BookOpenText },
            { titre: "Samâ'", donnees: sama, cible: 'sama', icone: Music },
            { titre: 'Durûs', donnees: durus, cible: 'durus', icone: BookOpenText },
          ] as { titre: string; donnees?: ContentItem[]; cible: string; icone: LucideIcon }[]).map(
            ({ titre, donnees, cible, icone: Icone }) =>
              (donnees?.length ?? 0) > 0 && (
                <Fragment key={cible}>
                  <CommandSeparator />
                  <CommandGroup heading={titre}>
                    {donnees!.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={`${c.title} ${c.subtitle ?? ''} ${c.body ?? ''}`}
                        onSelect={() => allerA(cible)}
                        className="gap-3"
                      >
                        <Icone className="h-4 w-4 shrink-0 text-primary" />
                        <span className="min-w-0 flex-1 truncate">
                          <span className="font-medium">{c.title}</span>
                          {c.time && (
                            <span className="ml-1.5 text-xs text-muted-foreground">· {c.time}</span>
                          )}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Fragment>
              )
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
                    onSelect={() => allerA('sondages')}
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

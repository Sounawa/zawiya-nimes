'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  Coins,
  Download,
  Megaphone,
  Settings2,
  ScrollText,
  UserRoundPlus,
  Users,
  Vote,
  type LucideIcon,
} from 'lucide-react'
import { useAudit } from '@/lib/api'
import { cn } from '@/lib/utils'
import { libelleJour, tempsRelatif } from '@/lib/format'
import type { AuditAction, AuditEntry, AuditKind } from '@/lib/types'
import { SectionShell } from './ijtima-section'
import { useToast } from '@/hooks/use-toast'

/* ─── Libellés des natures d'action (pour les filtres & l'export) ─── */
const LIBELLES: Record<AuditKind, string> = {
  MEETING: 'Réunions',
  CONTRIBUTION: 'Cotisations',
  ANNOUNCEMENT: 'Annonces',
  POLL: 'Sondages',
  MEMBER: 'Membres',
  ATTENDANCE: 'Présences',
  SETTING: 'Réglages',
}

/* ─── Icônes & teintes par nature d'action ─── */
const ICONES: Record<AuditKind, LucideIcon> = {
  MEETING: CalendarDays,
  CONTRIBUTION: Coins,
  ANNOUNCEMENT: Megaphone,
  POLL: Vote,
  MEMBER: UserRoundPlus,
  ATTENDANCE: Users,
  SETTING: Settings2,
}

const TENUES: Record<
  AuditKind,
  { fond: string; icone: string }
> = {
  MEETING: { fond: 'bg-primary/10', icone: 'text-primary' },
  CONTRIBUTION: { fond: 'bg-accent/15', icone: 'text-gold-vif' },
  ANNOUNCEMENT: { fond: 'bg-destructive/10', icone: 'text-destructive' },
  POLL: { fond: 'bg-sauge/15', icone: 'text-sauge' },
  MEMBER: { fond: 'bg-primary/10', icone: 'text-primary' },
  ATTENDANCE: { fond: 'bg-sauge/15', icone: 'text-sauge' },
  SETTING: { fond: 'bg-sand', icone: 'text-brouillard' },
}

const VERBES: Record<AuditAction, string> = {
  CREATE: 'ajouté',
  UPDATE: 'modifié',
  DELETE: 'supprimé',
  INSCRIRE: 'inscription',
  DESINSCRIRE: 'désistement',
  VOTE: 'vote',
}

/** Une ligne du journal — pastille, libellé, auteur, temps relatif. */
function LigneJournal({ entree, index }: { entree: AuditEntry; index: number }) {
  const Icone = ICONES[entree.kind] ?? ScrollText
  const tenue = TENUES[entree.kind] ?? TENUES.SETTING
  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.3 }}
      className="flex items-start gap-3 py-2.5"
    >
      <span
        className={cn(
          'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full',
          tenue.fond
        )}
        aria-hidden
      >
        <Icone className={cn('h-4 w-4', tenue.icone)} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-secondary-foreground">
          {entree.label}
          {entree.actor && (
            <span className="text-brouillard"> — par {entree.actor}</span>
          )}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-brouillard-clair">
          <span className="rounded-full bg-sand px-1.5 py-px normal-case tracking-normal">
            {VERBES[entree.action] ?? entree.action.toLowerCase()}
          </span>
          {tempsRelatif(entree.createdAt)}
        </p>
      </div>
    </motion.li>
  )
}

/** Export CSV du journal — historique complet, lisible dans Excel */
function exporterJournalCSV(entrees: AuditEntry[]) {
  const lignes = [
    'Journal de la Zawiya Nîmes',
    'Date;Heure;Nature;Action;Libellé;Auteur',
    ...entrees
      .slice()
      .reverse()
      .map((e) =>
        [
          new Date(e.createdAt).toLocaleDateString('fr-FR'),
          new Date(e.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          LIBELLES[e.kind] ?? e.kind,
          VERBES[e.action] ?? e.action.toLowerCase(),
          e.label.replace(/[;\n]/g, ' '),
          e.actor ?? '',
        ].join(';')
      ),
  ]
  const blob = new Blob(['\uFEFF' + lignes.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `journal-zawiya-nimes-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Le journal de la zawiya — chaque action laisse une trace. */
export function HistoriqueSection() {
  const { data: entrees, isLoading } = useAudit()
  const [filtre, setFiltre] = useState<AuditKind | 'tout'>('tout')
  const { toast } = useToast()

  /* Natures effectivement présentes dans le journal */
  const natures = useMemo(() => {
    if (!entrees) return [] as AuditKind[]
    return Array.from(new Set(entrees.map((e) => e.kind)))
  }, [entrees])

  const entreesFiltrees = useMemo(
    () => (entrees ?? []).filter((e) => filtre === 'tout' || e.kind === filtre),
    [entrees, filtre]
  )

  /* Regroupement par jour : Aujourd'hui / Hier / date longue */
  const groupes = useMemo(() => {
    if (!entreesFiltrees.length) return []
    const carte = new Map<string, AuditEntry[]>()
    for (const e of entreesFiltrees) {
      const cle = libelleJour(e.createdAt)
      const liste = carte.get(cle) ?? []
      liste.push(e)
      carte.set(cle, liste)
    }
    return Array.from(carte.entries())
  }, [entreesFiltrees])

  return (
    <SectionShell
      titre="Historique"
      compteur={entrees ? `${entrees.length} actions` : undefined}
      id="historique"
    >
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="h-8 w-8 animate-pulse rounded-full bg-sand/70" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 animate-pulse rounded-full bg-sand/70" />
                <div className="h-2 w-1/4 animate-pulse rounded-full bg-sand/50" />
              </div>
            </div>
          ))}
        </div>
      ) : !entrees?.length ? (
        <p className="rounded-2xl border border-dashed border-primary/20 p-6 text-center text-sm text-brouillard">
          Le journal est encore vide.
          <br />
          Les actions de la communauté apparaîtront ici au fil du temps.
        </p>
      ) : (
        <div className="rounded-2xl border border-primary/10 bg-card p-4 shadow-sm">
          {/* Filtres par nature + export CSV */}
          {natures.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrer le journal">
              <button
                onClick={() => setFiltre('tout')}
                aria-pressed={filtre === 'tout'}
                className={cn(
                  'rounded-full px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95',
                  filtre === 'tout'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-sand/60 text-brouillard hover:bg-sand hover:text-secondary-foreground'
                )}
              >
                Tout · {entrees.length}
              </button>
              {natures.map((k) => {
                const Icone = ICONES[k] ?? ScrollText
                return (
                  <button
                    key={k}
                    onClick={() => setFiltre(filtre === k ? 'tout' : k)}
                    aria-pressed={filtre === k}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95',
                      filtre === k
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-sand/60 text-brouillard hover:bg-sand hover:text-secondary-foreground'
                    )}
                  >
                    <Icone className="h-3 w-3" aria-hidden />
                    {LIBELLES[k] ?? k} · {entrees.filter((e) => e.kind === k).length}
                  </button>
                )
              })}
              <button
                onClick={() => {
                  exporterJournalCSV(entreesFiltrees)
                  toast({
                    title: 'Journal exporté',
                    description: `${entreesFiltrees.length} actions — ${filtre === 'tout' ? 'toutes natures' : LIBELLES[filtre].toLowerCase()}`,
                  })
                }}
                aria-label="Exporter le journal en CSV"
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-gold/45 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gold-vif transition-all hover:bg-or-pale hover:shadow-sm active:scale-95"
              >
                <Download className="h-3 w-3" aria-hidden /> CSV
              </button>
            </div>
          )}
          {entreesFiltrees.length === 0 ? (
            <p className="py-8 text-center text-sm text-brouillard">
              Aucune action de cette nature pour l'instant.
            </p>
          ) : (
            <ul className="defile-fin max-h-96 divide-y divide-border/60 overflow-y-auto pr-1">
              {groupes.map(([jour, liste]) => (
                <li key={jour}>
                  <p className="sticky top-0 z-10 bg-card/95 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-gold-vif backdrop-blur">
                    {jour}
                  </p>
                  <ul>
                    {liste.map((e, i) => (
                      <LigneJournal key={e.id} entree={e} index={i} />
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 border-t border-border/60 pt-2.5 text-center text-[10px] uppercase tracking-[0.25em] text-brouillard-clair">
            ✦ Les 80 dernières actions de la zawiya ✦
          </p>
        </div>
      )}
    </SectionShell>
  )
}

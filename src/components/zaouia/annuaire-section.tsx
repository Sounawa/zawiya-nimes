'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDownWideNarrow,
  BadgeCheck,
  CalendarHeart,
  Coins,
  Flame,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useMembers, useContributions, useMeetings } from '@/lib/api'
import { useUser } from '@/lib/store'
import { euros } from '@/lib/format'
import { SectionShell } from './ijtima-section'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Member } from '@/lib/types'

/* ═══════════════ Teinte stable par membre (hash du prénom) ═══════════════ */
function teinteMembre(nom: string): number {
  let h = 0
  for (let i = 0; i < nom.length; i++) h = (h * 31 + nom.charCodeAt(i)) % 360
  return h
}

/* ═══════════════ Régularité aux ijtima' — libellé + teinte ═══════════════ */
function regularite(taux: number, presences: number) {
  if (presences === 0) return { label: 'jamais inscrit', classe: 'bg-sand text-brouillard' }
  if (taux >= 80) return { label: 'assidu', classe: 'bg-primary/12 text-primary' }
  if (taux >= 40) return { label: 'régulier', classe: 'bg-sauge/12 text-forest' }
  return { label: 'occasionnel', classe: 'bg-accent/18 text-gold-vif' }
}

type Tri = 'NOM' | 'CAISSE' | 'PRESENCES'

/* ═══════════════ Carte d'un membre ═══════════════ */
function CarteMembre({
  membre,
  total,
  ziyara,
  presences,
  nbReunions,
  derniereActivite,
  estTresorier,
  estMoi,
  index,
}: {
  membre: Member
  total: number
  ziyara: number
  presences: number
  nbReunions: number
  derniereActivite: string | null
  estTresorier: boolean
  estMoi: boolean
  index: number
}) {
  const teinte = teinteMembre(membre.name)
  const taux = nbReunions > 0 ? Math.round((presences / nbReunions) * 100) : 0
  const reg = regularite(taux, presences)
  const membreDepuis = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(
    new Date(membre.createdAt)
  )

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      className={cn(
        'group relative flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
        estMoi ? 'border-gold/45 ring-1 ring-accent/30' : 'border-primary/12 hover:border-primary/25'
      )}
    >
      {/* Avatar — initiale sur teinte dérivée du prénom */}
      <span className="relative shrink-0">
        <span
          aria-hidden
          className="grid h-11 w-11 place-items-center rounded-full text-sm font-bold text-white shadow-inner"
          style={{
            background: `linear-gradient(135deg, hsl(${teinte} 32% 38%), hsl(${(teinte + 40) % 360} 30% 26%))`,
          }}
        >
          {membre.name.charAt(0).toUpperCase()}
        </span>
        {/* Pastille de régularité sur l'avatar */}
        {taux >= 80 && presences > 0 && (
          <span
            aria-hidden
            title="Assidu aux ijtima'"
            className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-card shadow-sm ring-1 ring-primary/20"
          >
            <Flame className="h-2.5 w-2.5 text-gold" />
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-secondary-foreground">
            Sidi {membre.name}
          </span>
          {estMoi && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold-vif">
              moi
            </span>
          )}
          <span className="ml-auto hidden shrink-0 sm:inline-block" title={`Membre depuis ${membreDepuis}`}>
            <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider', reg.classe)}>
              {reg.label}
            </span>
          </span>
        </span>

        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-brouillard">
          <span className="inline-flex items-center gap-1" title="Cotisations & dons">
            <Coins className="h-3 w-3 text-primary/70" />
            <span className="font-semibold tabular-nums text-primary">{euros(total)}</span>
          </span>
          {estTresorier && ziyara > 0 && (
            <span className="inline-flex items-center gap-1" title="Ziyara">
              <Sparkles className="h-3 w-3 text-gold" />
              <span className="font-semibold tabular-nums text-gold-vif">{euros(ziyara)}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1" title="Inscriptions aux ijtima'">
            <Users className="h-3 w-3 text-sauge" />
            <span className="font-semibold tabular-nums text-sauge">{presences}</span>
            <span className="hidden sm:inline">ijtima{presences !== 1 ? "'s" : ''}</span>
          </span>
          {derniereActivite && (
            <span className="inline-flex items-center gap-1" title="Dernière contribution enregistrée">
              <CalendarHeart className="h-3 w-3 text-brouillard-clair" />
              <span className="hidden sm:inline">dern.</span> {derniereActivite}
            </span>
          )}
        </span>

        {/* Mini-barre d'assiduité — proportionalité douce, dorée */}
        <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-sand">
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: `${taux}%` }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className={cn(
              'block h-full rounded-full',
              taux >= 80
                ? 'bg-gradient-to-r from-primary to-sauge'
                : taux >= 40
                  ? 'bg-gradient-to-r from-sauge to-sauge-clair'
                  : 'bg-gradient-to-r from-accent to-gold-clair'
            )}
          />
        </span>
      </span>

      {/* Badge de rôle */}
      {membre.role === 'TREASURER' ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold/12 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-gold-vif ring-1 ring-gold/30">
          <BadgeCheck className="h-3 w-3" /> Trésorier
        </span>
      ) : (
        <span className="hidden shrink-0 rounded-full bg-primary/8 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground ring-1 ring-primary/15 sm:inline-block">
          Admin
        </span>
      )}
    </motion.li>
  )
}

/* ═══════════════ Section ANNUAIRE — la communauté ═══════════════ */
export function AnnuaireSection() {
  const { data: membres, isLoading } = useMembers()
  const { data: dataContrib } = useContributions()
  const { data: meetings } = useMeetings()
  const role = useUser((s) => s.role)
  const monId = useUser((s) => s.memberId)

  const [recherche, setRecherche] = useState('')
  const [tri, setTri] = useState<Tri>('NOM')

  // Agrégats par membre : cotisations+dons, ziyara, présences, dernière activité
  const stats = useMemo(() => {
    const m = new Map<string, { caisse: number; ziyara: number; presences: number; derniere: string | null }>()
    for (const c of dataContrib?.contributions ?? []) {
      const e = m.get(c.memberId) ?? { caisse: 0, ziyara: 0, presences: 0, derniere: null }
      if (c.category === 'ZIYARA') e.ziyara += c.amount
      else e.caisse += c.amount
      if (!e.derniere || c.date > e.derniere) e.derniere = c.date
      m.set(c.memberId, e)
    }
    for (const mt of meetings ?? []) {
      for (const a of mt.attendances) {
        const e = m.get(a.memberId) ?? { caisse: 0, ziyara: 0, presences: 0, derniere: null }
        e.presences += 1
        m.set(a.memberId, e)
      }
    }
    return m
  }, [dataContrib, meetings])

  const nbReunions = meetings?.length ?? 0

  const liste = useMemo(() => {
    let base = (membres ?? []).slice()
    if (recherche.trim()) {
      const q = recherche.trim().toLowerCase()
      base = base.filter((m) => m.name.toLowerCase().includes(q))
    }
    if (tri === 'CAISSE') {
      base.sort((a, b) => (stats.get(b.id)?.caisse ?? 0) - (stats.get(a.id)?.caisse ?? 0))
    } else if (tri === 'PRESENCES') {
      base.sort((a, b) => (stats.get(b.id)?.presences ?? 0) - (stats.get(a.id)?.presences ?? 0))
    } else {
      base.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    }
    return base
  }, [membres, recherche, tri, stats])

  const nbTotal = membres?.length ?? 0
  const cotisants = new Set(
    (dataContrib?.contributions ?? []).filter((c) => c.category !== 'ZIYARA').map((c) => c.memberId)
  ).size
  const inscrits = new Set((meetings ?? []).flatMap((mt) => mt.attendances.map((a) => a.memberId))).size

  const TRIS: { cle: Tri; label: string }[] = [
    { cle: 'NOM', label: 'Prénom' },
    { cle: 'CAISSE', label: 'Caisse' },
    { cle: 'PRESENCES', label: 'Présences' },
  ]

  return (
    <SectionShell
      titre="Annuaire"
      compteur={nbTotal ? `${nbTotal} frères` : undefined}
      id="annuaire"
    >
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-24 animate-pulse rounded-2xl bg-sand/60" />
          <div className="h-12 animate-pulse rounded-2xl bg-sand/40" />
          <div className="h-64 animate-pulse rounded-2xl bg-sand/30" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Résumé de la communauté */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/12 bg-gradient-to-br from-card via-feuille to-feuille p-4 shadow-sm">
            <div className="pattern-khatim absolute inset-0" aria-hidden />
            <div className="relative grid grid-cols-2 items-center py-1 text-center sm:grid-cols-4">
              <div>
                <p className="font-display text-2xl font-semibold tabular-nums text-encre">{nbTotal}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-brouillard">Frères</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold tabular-nums text-primary">{cotisants}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-brouillard">Cotisants</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold tabular-nums text-sauge">{inscrits}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-brouillard">Inscrits</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold tabular-nums text-gold-vif">
                  {nbTotal ? Math.round((cotisants / nbTotal) * 100) : 0}%
                </p>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-brouillard">Participation</p>
              </div>
            </div>
          </div>

          {/* Recherche + tri */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brouillard-clair" />
              <Input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher un frère…"
                aria-label="Rechercher un frère"
                className="rounded-full border-primary/20 bg-card pl-10 pr-10"
              />
              {recherche && (
                <button
                  onClick={() => setRecherche('')}
                  aria-label="Effacer la recherche"
                  className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-sand text-muted-foreground transition-colors hover:bg-sable-vif"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div
              className="flex items-center gap-1.5 rounded-full border border-primary/15 bg-card p-1 shadow-sm"
              role="group"
              aria-label="Trier l'annuaire"
            >
              <ArrowDownWideNarrow className="ml-1.5 h-3.5 w-3.5 shrink-0 text-brouillard" aria-hidden />
              {TRIS.map((t) => (
                <button
                  key={t.cle}
                  onClick={() => setTri(t.cle)}
                  aria-pressed={tri === t.cle}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors',
                    tri === t.cle
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-primary/8 hover:text-primary'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Légende de régularité */}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[10px] text-brouillard">
            <span className="font-semibold uppercase tracking-[0.18em] text-brouillard-clair">Assiduité :</span>
            {[
              { label: 'assidu ≥ 80%', classe: 'bg-primary/12 text-primary' },
              { label: 'régulier ≥ 40%', classe: 'bg-sauge/12 text-forest' },
              { label: 'occasionnel', classe: 'bg-accent/18 text-gold-vif' },
            ].map((l) => (
              <span key={l.label} className={cn('rounded-full px-2 py-0.5 font-bold', l.classe)}>
                {l.label}
              </span>
            ))}
            <span className="hidden sm:inline">· {nbReunions} réunion{nbReunions !== 1 ? 's' : ''} au calendrier</span>
          </p>

          {/* Liste */}
          <ul className="defile-fin max-h-96 space-y-2 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {liste.map((m, i) => {
                const s = stats.get(m.id) ?? { caisse: 0, ziyara: 0, presences: 0, derniere: null }
                return (
                  <CarteMembre
                    key={m.id}
                    membre={m}
                    total={s.caisse}
                    ziyara={s.ziyara}
                    presences={s.presences}
                    nbReunions={nbReunions}
                    derniereActivite={
                      s.derniere
                        ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(s.derniere))
                        : null
                    }
                    estTresorier={role === 'TREASURER'}
                    estMoi={m.id === monId}
                    index={i}
                  />
                )
              })}
            </AnimatePresence>
            {liste.length === 0 && (
              <li className="rounded-2xl border border-dashed border-primary/20 p-6 text-center text-sm text-brouillard">
                Aucun frère ne correspond à «&nbsp;{recherche}&nbsp;».
              </li>
            )}
          </ul>
        </div>
      )}
    </SectionShell>
  )
}

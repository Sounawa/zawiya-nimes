'use client'

import { create } from 'zustand'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Printer,
  Settings2,
} from 'lucide-react'
import { CHAPITRES_CAHIER } from '@/data/cahier'
import { useLecture, usePrint, type PoliceLecture, type Interligne, type ThemeLecture, type AccentLecture } from '@/lib/store'
import { SectionShell } from './ijtima-section'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════════════════
   CAHIER D'INVOCATIONS — la transcription phonétique intégrale du
   cahier de la zawiya (32 chapitres, 135 pages d'origine).
   Police, taille, interligne et couleurs réglables à volonté.
   ═══════════════════════════════════════════════════════════════════ */

/* Demande externe de chapitre (recherche globale ⌘K) */
interface DemandeChapitreState {
  chapitre: string | null
  demander: (id: string) => void
  consommer: () => void
}
export const useDemandeChapitre = create<DemandeChapitreState>((set) => ({
  chapitre: null,
  demander: (chapitre) => set({ chapitre }),
  consommer: () => set({ chapitre: null }),
}))

const POLICES: { id: PoliceLecture; nom: string; css: string }[] = [
  { id: 'cormorant', nom: 'Cormorant', css: 'var(--font-display)' },
  { id: 'garamond', nom: 'EB Garamond', css: 'var(--font-livre2)' },
  { id: 'crimson', nom: 'Crimson', css: 'var(--font-livre3)' },
]

const INTERLIGNES: { id: Interligne; nom: string; valeur: number }[] = [
  { id: 'compact', nom: 'Compact', valeur: 1.5 },
  { id: 'normal', nom: 'Normal', valeur: 1.8 },
  { id: 'aere', nom: 'Aéré', valeur: 2.2 },
]

const THEMES: {
  id: ThemeLecture
  nom: string
  fond: string
  texte: string
  cadre: string
}[] = [
  { id: 'ivoire', nom: 'Ivoire', fond: 'bg-[#fbf8f1]', texte: 'text-[#2d2a24]', cadre: 'border-[#e4dcc8]' },
  { id: 'parchemin', nom: 'Parchemin', fond: 'bg-[#f3e9d5]', texte: 'text-[#43382a]', cadre: 'border-[#d8c8a4]' },
  { id: 'nuit', nom: 'Nuit', fond: 'bg-[#14201a]', texte: 'text-[#d7e4d9]', cadre: 'border-[#2c4a3a]' },
]

const ACCENTS: { id: AccentLecture; nom: string; couleur: string }[] = [
  { id: 'or', nom: 'Or', couleur: '#b8923a' },
  { id: 'vert', nom: 'Vert', couleur: '#0b5d42' },
  { id: 'brun', nom: 'Brun', couleur: '#8a5a2e' },
]

/* ─── Une ligne du texte, avec versets ﴾ ﴿ et répétitions « x N » mises en relief ─── */
function LigneInvocation({ ligne, accent }: { ligne: string; accent: string }) {
  /* Répétition en fin de ligne : « x 100 », « x 1H30 »… */
  const m = ligne.match(/^(.*?)(\s*[x×]\s*[\dHh '’]+)$/u)
  if (m && m[2].trim()) {
    return (
      <span className="block">
        {m[1]}
        <span
          className="mx-1 inline-block rounded-md px-2 py-0.5 align-middle text-[0.72em] font-bold tracking-wide"
          style={{ color: accent, backgroundColor: `${accent}18` }}
        >
          {m[2].trim()}
        </span>
      </span>
    )
  }
  return <span className="block">{ligne || '\u00A0'}</span>
}

/* ─── Le texte d'un chapitre, rendu ligne à ligne ─── */
function TexteChapitre({ texte, accent }: { texte: string; accent: string }) {
  return (
    <div>
      {texte.split('\n').map((ligne, i) => (
        <LigneInvocation key={i} ligne={ligne} accent={accent} />
      ))}
    </div>
  )
}

/* ─── La barre de réglages de lecture ─── */
function BarreReglages() {
  const l = useLecture()
  const [ouverte, setOuverte] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOuverte((o) => !o)}
        aria-expanded={ouverte}
        aria-label="Réglages de lecture"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gold/35 bg-or-pale/50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-vif transition-all hover:border-gold/60 hover:bg-or-pale/80 active:scale-[0.99]"
      >
        <Settings2 className="h-3.5 w-3.5" /> Lecture
      </button>

      {ouverte && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 space-y-3.5 rounded-2xl border border-primary/15 bg-card p-4 shadow-md"
        >
          {/* Police */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brouillard">Police</span>
            <div className="flex gap-1">
              {POLICES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => l.regler({ police: p.id })}
                  aria-pressed={l.police === p.id}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm transition-all',
                    l.police === p.id
                      ? 'bg-primary/12 font-semibold text-primary ring-1 ring-primary/30'
                      : 'text-brouillard hover:bg-primary/6'
                  )}
                  style={{ fontFamily: p.css }}
                >
                  {p.nom}
                </button>
              ))}
            </div>
          </div>

          {/* Taille */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brouillard">Taille</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => l.regler({ taille: Math.max(14, l.taille - 1) })}
                aria-label="Réduire la taille du texte"
                className="grid h-8 w-8 place-items-center rounded-lg text-brouillard transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-xs font-semibold text-secondary-foreground">{l.taille} px</span>
              <button
                type="button"
                onClick={() => l.regler({ taille: Math.min(30, l.taille + 1) })}
                aria-label="Agrandir la taille du texte"
                className="grid h-8 w-8 place-items-center rounded-lg text-brouillard transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Interligne */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brouillard">Interligne</span>
            <div className="flex gap-1">
              {INTERLIGNES.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => l.regler({ interligne: i.id })}
                  aria-pressed={l.interligne === i.id}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs transition-all',
                    l.interligne === i.id
                      ? 'bg-primary/12 font-semibold text-primary ring-1 ring-primary/30'
                      : 'text-brouillard hover:bg-primary/6'
                  )}
                >
                  {i.nom}
                </button>
              ))}
            </div>
          </div>

          {/* Couleur de fond */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brouillard">Fond</span>
            <div className="flex gap-1.5">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => l.regler({ theme: t.id })}
                  aria-pressed={l.theme === t.id}
                  aria-label={`Thème ${t.nom}`}
                  className={cn(
                    'h-8 w-8 rounded-lg border-2 transition-transform hover:scale-105',
                    l.theme === t.id ? 'ring-2 ring-gold ring-offset-1' : '',
                    t.fond,
                    t.cadre
                  )}
                />
              ))}
            </div>
          </div>

          {/* Couleur d'accent (titres, ornement) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brouillard">Accent</span>
            <div className="flex gap-1.5">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => l.regler({ accent: a.id })}
                  aria-pressed={l.accent === a.id}
                  aria-label={`Accent ${a.nom}`}
                  className={cn(
                    'h-8 w-8 rounded-lg border border-black/10 transition-transform hover:scale-105',
                    l.accent === a.id ? 'ring-2 ring-gold ring-offset-1' : ''
                  )}
                  style={{ backgroundColor: a.couleur }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

/* ─── La section complète ─── */
export function CahierInvocations() {
  const l = useLecture()
  const imprimer = usePrint((s) => s.imprimer)
  const [index, setIndex] = useState(0)

  /* La recherche globale demande un chapitre précis */
  const demande = useDemandeChapitre((s) => s.chapitre)
  const consommer = useDemandeChapitre((s) => s.consommer)
  if (demande) {
    const i = CHAPITRES_CAHIER.findIndex((c) => c.id === demande)
    if (i >= 0) setIndex(i)
    consommer()
  }

  const chapitre = CHAPITRES_CAHIER[index]

  const police = useMemo(
    () => POLICES.find((p) => p.id === l.police) ?? POLICES[0],
    [l.police]
  )
  const interligne = useMemo(
    () => INTERLIGNES.find((i) => i.id === l.interligne) ?? INTERLIGNES[1],
    [l.interligne]
  )
  const theme = useMemo(() => THEMES.find((t) => t.id === l.theme) ?? THEMES[0], [l.theme])
  const accent = useMemo(
    () => ACCENTS.find((a) => a.id === l.accent) ?? ACCENTS[0],
    [l.accent]
  )

  const chapitreSuivant = () => setIndex((i) => Math.min(CHAPITRES_CAHIER.length - 1, i + 1))
  const chapitrePrecedent = () => setIndex((i) => Math.max(0, i - 1))

  return (
    <SectionShell
      titre="Cahier d'invocations"
      compteur={`${CHAPITRES_CAHIER.length} invocations · phonétique`}
      id="cahier"
      defaultOpen={false}
    >
      <div className="space-y-3">
        {/* Barre de réglages + impression */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <BarreReglages />
          </div>
          <button
            type="button"
            onClick={() => imprimer({ kind: 'cahier', chapitreId: chapitre.id })}
            className="flex items-center justify-center gap-2 rounded-2xl border border-primary/25 bg-card px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary transition-all hover:bg-primary/8 hover:shadow-sm active:scale-[0.99]"
          >
            <Printer className="h-3.5 w-3.5" /> Imprimer
          </button>
        </div>

        {/* Navigation entre chapitres — bandeau défilant */}
        <div className="relative">
          <div
            className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-mince"
            role="tablist"
            aria-label="Chapitres du cahier"
          >
            {CHAPITRES_CAHIER.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                onClick={() => setIndex(i)}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-xs transition-all active:scale-95',
                  i === index
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'bg-card text-brouillard ring-1 ring-primary/15 hover:bg-primary/6 hover:text-primary'
                )}
              >
                {c.titre}
              </button>
            ))}
          </div>
        </div>

        {/* Le chapitre courant */}
        <motion.article
          key={chapitre.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={cn(
            'relative overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-8',
            theme.fond,
            theme.texte,
            theme.cadre
          )}
        >
          {/* Filigrane ornemental */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-2 -top-6 select-none text-7xl opacity-[0.07]"
            style={{ color: accent.couleur }}
          >
            ✦
          </span>

          {/* En-tête du chapitre */}
          <header className="mb-5 text-center">
            <h3
              className="text-[22px] font-semibold leading-tight"
              style={{ fontFamily: police.css, color: accent.couleur }}
            >
              {chapitre.titre}
            </h3>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.25em] opacity-50">
              cahier p. {chapitre.debut}–{chapitre.fin}
            </p>
            <div
              className="mx-auto mt-3 h-px w-24"
              style={{ backgroundColor: accent.couleur, opacity: 0.4 }}
              aria-hidden
            />
          </header>

          {/* Le texte sacré */}
          <div
            className="cahier-texte"
            style={{
              fontFamily: police.css,
              fontSize: `${l.taille}px`,
              lineHeight: interligne.valeur,
            }}
          >
            <TexteChapitre texte={chapitre.texte} accent={accent.couleur} />
          </div>

          {/* Pied de chapitre */}
          <footer className="mt-6 flex items-center justify-between border-t pt-4" style={{ borderColor: `${accent.couleur}30` }}>
            <button
              type="button"
              onClick={chapitrePrecedent}
              disabled={index === 0}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95',
                index === 0
                  ? 'cursor-not-allowed opacity-30'
                  : 'hover:bg-black/5'
              )}
              style={{ color: accent.couleur }}
            >
              <ChevronLeft className="h-4 w-4" />
              {index > 0 ? CHAPITRES_CAHIER[index - 1].titre : 'Début'}
            </button>
            <span className="text-[11px] font-semibold opacity-40">
              {index + 1} / {CHAPITRES_CAHIER.length}
            </span>
            <button
              type="button"
              onClick={chapitreSuivant}
              disabled={index === CHAPITRES_CAHIER.length - 1}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95',
                index === CHAPITRES_CAHIER.length - 1
                  ? 'cursor-not-allowed opacity-30'
                  : 'hover:bg-black/5'
              )}
              style={{ color: accent.couleur }}
            >
              {index < CHAPITRES_CAHIER.length - 1 ? CHAPITRES_CAHIER[index + 1].titre : 'Fin'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </footer>
        </motion.article>

        {/* Note de fidélité */}
        <p className="flex items-center justify-center gap-1.5 text-center text-[10px] uppercase tracking-[0.2em] text-brouillard-clair">
          <BookOpenText className="h-3 w-3" aria-hidden />
          transcription intégrale du cahier de la zawiya — voir le kitāb arabe pour l'original
        </p>
      </div>
    </SectionShell>
  )
}

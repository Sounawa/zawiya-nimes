'use client'

import { create } from 'zustand'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { CHAPITRES_KITAB, PAGES_KITAB } from '@/data/kitab'
import { SectionShell } from './ijtima-section'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════════════════
   KITĀB AL-ADHKĀR — كتاب الأذكار
   Le recueil arabe original de la zawiya, page à page. Les scans
   sont servis tels quels : le texte sacré reste celui du livre.
   ═══════════════════════════════════════════════════════════════════ */

/* Demande externe de page (recherche globale ⌘K) */
interface DemandePageState {
  page: number | null
  demander: (p: number) => void
  consommer: () => void
}
export const useDemandePage = create<DemandePageState>((set) => ({
  page: null,
  demander: (page) => set({ page }),
  consommer: () => set({ page: null }),
}))

function pageSrc(p: number) {
  return `/kitab/p-${String(p).padStart(2, '0')}.png`
}

/** Le chapitre auquel appartient une page donnée */
function chapitreDeLaPage(p: number) {
  return CHAPITRES_KITAB.find((c) => p >= c.debut && p <= c.fin) ?? null
}

/* ─── La page courante, encadrée avec ses commandes ─── */
function PageKitab({
  page,
  onPage,
  onZoom,
}: {
  page: number
  onPage: (p: number) => void
  onZoom: () => void
}) {
  const chapitre = chapitreDeLaPage(page)

  return (
    <motion.figure
      key={page}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="relative mx-auto w-full max-w-[540px]"
    >
      {/* Cadre ornemental du livre */}
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-b from-or-pale/60 via-card to-or-pale/40 p-2.5 shadow-md sm:p-3">
        <button
          type="button"
          onClick={onZoom}
          aria-label={`Agrandir la page ${page}`}
          className="group relative block w-full overflow-hidden rounded-lg ring-1 ring-primary/10"
        >
          <img
            src={pageSrc(page)}
            alt={`Kitāb al-Adhkār — page ${page}${chapitre ? ` (${chapitre.translit})` : ''}`}
            className="block w-full bg-white"
            loading="eager"
            draggable={false}
          />
          <span className="absolute inset-0 bg-primary/0 transition-colors group-hover:bg-primary/5" aria-hidden />
          <span
            className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-primary opacity-70 shadow-sm transition-opacity group-hover:opacity-100"
            aria-hidden
          >
            <Maximize2 className="h-4 w-4" />
          </span>
        </button>
      </div>

      {/* Légende + commandes de feuilletage */}
      <figcaption className="mt-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label="Page précédente"
          className="grid h-10 w-10 place-items-center rounded-full border border-primary/20 bg-card text-primary transition-all hover:bg-primary/10 active:scale-90 disabled:opacity-30 disabled:hover:bg-card"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="min-w-0 text-center">
          {chapitre && (
            <p dir="rtl" className="truncate font-arabic text-[17px] leading-snug text-encre">
              {chapitre.titreAr}
            </p>
          )}
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brouillard">
            {chapitre ? chapitre.translit : 'sommaire'} · p. {page} / {PAGES_KITAB}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onPage(Math.min(PAGES_KITAB, page + 1))}
          disabled={page >= PAGES_KITAB}
          aria-label="Page suivante"
          className="grid h-10 w-10 place-items-center rounded-full border border-primary/20 bg-card text-primary transition-all hover:bg-primary/10 active:scale-90 disabled:opacity-30 disabled:hover:bg-card"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </figcaption>
    </motion.figure>
  )
}

/* ─── La section complète ─── */
export function KitabAlAdhkar() {
  const [page, setPage] = useState(4) // commence à la première sûra
  const [zoom, setZoom] = useState(false)
  const chapitreCourant = useMemo(() => chapitreDeLaPage(page), [page])

  /* La recherche globale demande une page précise */
  const demande = useDemandePage((s) => s.page)
  const consommer = useDemandePage((s) => s.consommer)
  if (demande) {
    setPage(Math.min(PAGES_KITAB, Math.max(1, demande)))
    consommer()
  }

  /* Clavier : ← / → feulettent (flèches inversées : lecture de droite à gauche) */
  useEffect(() => {
    if (!zoom) return
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(false)
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [zoom])

  const allerPage = useCallback((p: number) => {
    setPage(Math.min(PAGES_KITAB, Math.max(1, p)))
  }, [])

  return (
    <SectionShell
      titre="Kitāb al-Adhkār"
      compteur={`كتاب الأذكار · ${PAGES_KITAB} pages`}
      id="kitab"
      defaultOpen={false}
    >
      <div className="space-y-3">
        {/* Navigation par chapitre — bandeau défilant */}
        <div
          className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-mince"
          role="tablist"
          aria-label="Chapitres du kitāb"
        >
          {CHAPITRES_KITAB.map((c) => {
            const actif = chapitreCourant?.id === c.id
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={actif}
                onClick={() => allerPage(c.debut)}
                title={c.translit}
                className={cn(
                  'shrink-0 rounded-full px-3.5 py-1.5 transition-all active:scale-95',
                  actif
                    ? 'bg-primary text-white shadow-sm shadow-primary/30'
                    : 'bg-card text-brouillard ring-1 ring-primary/15 hover:bg-primary/6 hover:text-primary'
                )}
              >
                <span dir="rtl" className="font-arabic text-sm">{c.titreAr}</span>
              </button>
            );
          })}
        </div>

        {/* La page courante */}
        <PageKitab page={page} onPage={allerPage} onZoom={() => setZoom(true)} />

        {/* Note de fidélité */}
        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-brouillard-clair">
          le livre original de la zawiya, reproduit fidèlement — page à page
        </p>
      </div>

      {/* ─── Vue agrandie — la page en pleine hauteur ─── */}
      {zoom && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-ivory/97 backdrop-blur-sm dark:bg-ivory/97"
          role="dialog"
          aria-modal="true"
          aria-label={`Page ${page} agrandie`}
          onClick={() => setZoom(false)}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <p className="min-w-0 truncate text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {chapitreCourant ? `${chapitreCourant.translit} — p. ${page}` : `p. ${page}`}
            </p>
            <button
              type="button"
              onClick={() => setZoom(false)}
              aria-label="Fermer la vue agrandie"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white shadow-md transition-transform hover:scale-105 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-3 pb-6">
            <img
              src={pageSrc(page)}
              alt={`Kitāb al-Adhkār — page ${page} agrandie`}
              className="mx-auto block w-full max-w-[900px] rounded-lg bg-white shadow-xl"
              draggable={false}
            />
          </div>
        </div>
      )}
    </SectionShell>
  )
}

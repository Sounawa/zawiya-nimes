'use client'

import { create } from 'zustand'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileDown,
  List,
  Minus,
  Plus,
  Printer,
  Type,
  X,
} from 'lucide-react'
import {
  DOCUMENTS_ADHKAR,
  chapitresDuDoc,
  pdfDuDoc,
  type ChapitreLecture,
  type DocAdhkar,
  type LangueAdhkar,
} from '@/data/adhkar-docs'
import {
  useLecture,
  usePrint,
  type PoliceArabe,
  type PoliceLecture,
  type Interligne,
  type ThemeLecture,
  type AccentLecture,
} from '@/lib/store'
import { SectionShell } from './ijtima-section'
import { LecteurPdf } from './lecteur-pdf'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════════════════
   ADHKÂR — la présentation du site original : une liste de neuf
   documents, lisible en phonétique ou en arabe. Chaque pièce
   s'ouvre dans un lecteur plein écran qui garde l'écran allumé
   pendant la lecture, avec police, taille et couleurs réglables.
   ═══════════════════════════════════════════════════════════════════ */

/* ─── Demande externe (recherche globale ⌘K) ─── */
interface DemandeLectureState {
  demande: { docId: string; chapitreId?: string; langue?: LangueAdhkar } | null
  demander: (docId: string, chapitreId?: string, langue?: LangueAdhkar) => void
  consommer: () => void
}
export const useDemandeLecture = create<DemandeLectureState>((set) => ({
  demande: null,
  demander: (docId, chapitreId, langue) => set({ demande: { docId, chapitreId, langue } }),
  consommer: () => set({ demande: null }),
}))

/* ─── Les réglages de lecture (listes partagées cahier / kitāb) ─── */
const POLICES_PH: { id: PoliceLecture; nom: string; css: string }[] = [
  { id: 'cormorant', nom: 'Cormorant', css: 'var(--font-display)' },
  { id: 'garamond', nom: 'EB Garamond', css: 'var(--font-livre2)' },
  { id: 'crimson', nom: 'Crimson', css: 'var(--font-livre3)' },
]
const POLICES_AR: { id: PoliceArabe; nom: string; css: string }[] = [
  { id: 'amiri', nom: 'أميري', css: 'var(--font-arabic)' },
  { id: 'scheherazade', nom: 'شهرزاد', css: 'var(--font-arabic2)' },
  { id: 'naskh', nom: 'نسخ', css: 'var(--font-arabic3)' },
]
const INTERLIGNES: { id: Interligne; nom: string; valeur: number }[] = [
  { id: 'compact', nom: 'Compact', valeur: 1.6 },
  { id: 'normal', nom: 'Normal', valeur: 1.9 },
  { id: 'aere', nom: 'Aéré', valeur: 2.3 },
]
const THEMES: { id: ThemeLecture; nom: string; fond: string; texte: string; cadre: string }[] = [
  { id: 'ivoire', nom: 'Ivoire', fond: 'bg-[#fbf8f1]', texte: 'text-[#2d2a24]', cadre: 'border-[#e4dcc8]' },
  { id: 'parchemin', nom: 'Parchemin', fond: 'bg-[#f3e9d5]', texte: 'text-[#43382a]', cadre: 'border-[#d8c8a4]' },
  { id: 'nuit', nom: 'Nuit', fond: 'bg-[#14201a]', texte: 'text-[#d7e4d9]', cadre: 'border-[#2c4a3a]' },
]
const ACCENTS: { id: AccentLecture; nom: string; couleur: string }[] = [
  { id: 'or', nom: 'Or', couleur: '#b8923a' },
  { id: 'vert', nom: 'Vert', couleur: '#0b5d42' },
  { id: 'brun', nom: 'Brun', couleur: '#8a5a2e' },
]

/* ─── Une ligne du texte, répétitions « x 100 » / « × ١٠٠ » en badge ─── */
function LigneInvocation({ ligne, accent }: { ligne: string; accent: string }) {
  const m = ligne.match(/^(.*?)(\s*[×x]\s*[٠-٩\dHh '’]+)$/u)
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

/* ═══ LE LECTEUR PLEIN ÉCRAN ═══════════════════════════════════════ */

interface LecteurProps {
  doc: DocAdhkar
  langue: LangueAdhkar
  chapitreInitial?: string
  onFermer: () => void
}

function LecteurAdhkar({ doc, langue, chapitreInitial, onFermer }: LecteurProps) {
  const l = useLecture()
  const imprimer = usePrint((s) => s.imprimer)

  /* Le diwân de samâ‘ (398 chants) n'entre pas dans le fil principal :
     il se charge paresseusement à l'ouverture du document. */
  const estSama = doc.id === 'sama' && langue === 'ph'
  const [samaTexte, setSamaTexte] = useState<ChapitreLecture[] | null>(null)
  useEffect(() => {
    if (doc.id !== 'sama' || langue !== 'ph') return
    let annule = false
    import('@/data/sama-chants').then((m) => {
      if (!annule) setSamaTexte(m.CHAPITRES_SAMA)
    })
    return () => {
      annule = true
    }
  }, [doc.id, langue])

  const chapitres = useMemo(
    () => (doc.id === 'sama' && langue === 'ph' ? samaTexte ?? [] : chapitresDuDoc(doc, langue)),
    [doc, langue, samaTexte]
  )
  const pdf = pdfDuDoc(doc, langue)
  const conteneurRef = useRef<HTMLDivElement | null>(null)
  const cartesRef = useRef<(HTMLElement | null)[]>([])

  const [indexActif, setIndexActif] = useState(() => {
    const i = chapitreInitial ? chapitres.findIndex((c) => c.id === chapitreInitial) : -1
    return i >= 0 ? i : 0
  })
  const [reglagesOuverts, setReglagesOuverts] = useState(false)
  const [sommaireOuvert, setSommaireOuvert] = useState(false)
  const [progression, setProgression] = useState(0)
  const [scrolle, setScrolle] = useState(false)

  const arabe = langue === 'ar'
  /* Vue du lecteur : le TEXTE RÉÉCRIT d'abord — encre sur porcelaine,
     polices et couleurs réglables, évolutif. La page numérisée reste
     disponible pour lire le livre imprimé à l'identique. La recherche ⌘K
     ouvre directement le texte au chapitre demandé. */
  const aLesDeux = Boolean(pdf) && chapitres.length > 0
  const [vue, setVue] = useState<'doc' | 'texte'>(
    chapitreInitial || !pdf || chapitres.length > 0 || estSama ? 'texte' : 'doc'
  )
  const vueDoc = vue === 'doc' && Boolean(pdf)
  const theme = THEMES.find((t) => t.id === l.theme) ?? THEMES[0]
  const accent = ACCENTS.find((a) => a.id === l.accent) ?? ACCENTS[0]
  const police = arabe
    ? POLICES_AR.find((p) => p.id === l.policeArabe) ?? POLICES_AR[0]
    : POLICES_PH.find((p) => p.id === l.police) ?? POLICES_PH[0]
  const taille = arabe ? l.tailleArabe : l.taille

  /* ─── L'écran ne s'éteint pas pendant qu'on lit ───
     Un frère qui récite ne touche pas son téléphone pendant de
     longues minutes. Le verrou d'écran est demandé à l'ouverture,
     rendu si la page passe à l'arrière-plan, et relâché après un
     quart d'heure sans le moindre geste — un téléphone oublié
     écran allumé chauffe. Tout échec est muet. */
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let verrou: WakeLockSentinel | null = null
    let minuteur: number | undefined
    const REPOS = 15 * 60 * 1000

    const demander = async () => {
      try {
        verrou = await navigator.wakeLock.request('screen')
      } catch {
        /* appareil qui ne sait pas faire : on lit comme avant */
      }
    }
    const relacher = () => {
      verrou?.release().catch(() => undefined)
      verrou = null
    }
    const toucher = () => {
      window.clearTimeout(minuteur)
      minuteur = window.setTimeout(relacher, REPOS)
    }
    const surVisibilite = () => {
      if (document.visibilityState === 'visible') {
        demander()
        toucher()
      } else {
        relacher()
      }
    }
    demander()
    toucher()
    document.addEventListener('visibilitychange', surVisibilite)
    window.addEventListener('pointerdown', toucher, { passive: true })
    return () => {
      relacher()
      window.clearTimeout(minuteur)
      document.removeEventListener('visibilitychange', surVisibilite)
      window.removeEventListener('pointerdown', toucher)
    }
  }, [])

  /* ─── Le corps de la page ne défile pas derrière le lecteur ─── */
  useEffect(() => {
    const deplacement = window.scrollY
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      window.scrollTo(0, deplacement)
    }
  }, [])

  /* ─── Échap ferme le lecteur ─── */
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [onFermer])

  /* ─── Progression de la lecture + affichage du bouton revenir ─── */
  useEffect(() => {
    const el = conteneurRef.current
    if (!el) return
    const surScroll = () => {
      const reste = el.scrollHeight - el.clientHeight
      setProgression(reste > 0 ? Math.min(1, el.scrollTop / reste) : 0)
      setScrolle(el.scrollTop > 260)
    }
    el.addEventListener('scroll', surScroll, { passive: true })
    surScroll()
    return () => el.removeEventListener('scroll', surScroll)
  }, [vueDoc])

  /* ─── Positionner au chapitre demandé à l'ouverture ───
     (le diwân arrive un instant après : on replace alors) */
  useEffect(() => {
    const el = conteneurRef.current
    if (!el) return
    if (chapitreInitial) {
      const i = chapitres.findIndex((c) => c.id === chapitreInitial)
      const cible = i >= 0 ? cartesRef.current[i] : null
      if (cible) {
        el.scrollTo({ top: cible.offsetTop - el.offsetTop - 8 })
        return
      }
    }
    el.scrollTo({ top: 0 })
  }, [chapitreInitial, langue, doc.id, chapitres.length])

  const allerAuChapitre = useCallback(
    (i: number) => {
      const cible = cartesRef.current[i]
      if (cible) {
        conteneurRef.current?.scrollTo({
          top: cible.offsetTop - (conteneurRef.current?.offsetTop ?? 0) - 8,
          behavior: 'smooth',
        })
      }
    },
    []
  )

  /* ─── Le chapitre visible suit le défilement ─── */
  useEffect(() => {
    if (chapitres.length < 2) return
    const el = conteneurRef.current
    if (!el) return
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.i)
            if (!Number.isNaN(i)) setIndexActif(i)
          }
        }
      },
      { root: el, rootMargin: '-15% 0px -60% 0px', threshold: 0 }
    )
    cartesRef.current.forEach((c) => c && observateur.observe(c))
    return () => observateur.disconnect()
  }, [chapitres.length, langue, doc.id])

  const titre = arabe ? doc.titreAr : doc.titreFr

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      /* mb-0 : parade contre les space-y-* d'un ancêtre (Tailwind v4
          pose margin-block-end sur :not(:last-child)) — un lecteur plein
          écran ne doit jamais recevoir de marge, où qu'il vive */
      className="fixed inset-0 z-[90] mb-0 flex flex-col bg-background grain-papier"
      role="dialog"
      aria-modal="true"
      aria-label={`Lecteur — ${titre}`}
    >
      {/* ─── La barre du haut : titre, sommaire, réglages, fermeture ─── */}
      <header className="relative z-10 flex-none border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90">
        <div
          className="flex items-center gap-1 px-2.5"
          style={{ paddingTop: 'calc(10px + env(safe-area-inset-top))', paddingBottom: 10 }}
        >
          {/* Réglages de lecture — le texte seulement */}
          {!vueDoc && (
            <button
              type="button"
              onClick={() => {
                setReglagesOuverts((o) => !o)
                setSommaireOuvert(false)
              }}
              aria-expanded={reglagesOuverts}
              aria-label="Réglages de lecture"
              className={cn(
                'grid h-9 w-9 place-items-center rounded-full transition-colors duration-200',
                reglagesOuverts
                  ? 'bg-muted text-foreground'
                  : 'text-brouillard hover:bg-muted/60 hover:text-foreground'
              )}
            >
              <Type className="h-4.5 w-4.5" />
            </button>
          )}

          {/* Sommaire des chapitres */}
          {!vueDoc && chapitres.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setSommaireOuvert((o) => !o)
                setReglagesOuverts(false)
              }}
              aria-expanded={sommaireOuvert}
              aria-label="Sommaire du document"
              className={cn(
                'grid h-9 w-9 place-items-center rounded-full transition-colors duration-200',
                sommaireOuvert
                  ? 'bg-muted text-foreground'
                  : 'text-brouillard hover:bg-muted/60 hover:text-foreground'
              )}
            >
              <List className="h-4.5 w-4.5" />
            </button>
          )}

          {/* Le titre, centré — le nom de la pièce */}
          <h2
            className={cn(
              'min-w-0 flex-1 truncate text-center text-[16px] font-medium text-encre',
              arabe && 'font-arabic text-[19px]'
            )}
            dir={arabe ? 'rtl' : undefined}
            title={titre}
          >
            {titre}
          </h2>

          {/* Fermeture */}
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer le lecteur"
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-brouillard transition-colors duration-200 hover:bg-muted/60 hover:text-foreground active:bg-muted"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Filet de progression de la lecture */}
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-border" aria-hidden>
          <div
            className="h-full bg-primary transition-[width] duration-150"
            style={{ width: `${Math.round(progression * 100)}%` }}
          />
        </div>

        {/* Bascule Texte / Numérisé — le texte réécrit d'abord (encre
            sur porcelaine), ou le livre imprimé à l'identique */}
        {aLesDeux && (
          <div className="flex justify-center gap-1.5 border-t border-border py-1.5">
            <button
              type="button"
              onClick={() => {
                setVue('texte')
                setReglagesOuverts(false)
                setSommaireOuvert(false)
              }}
              aria-pressed={!vueDoc}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-200 active:scale-[0.98]',
                !vueDoc
                  ? 'bg-primary text-primary-foreground'
                  : 'text-brouillard hover:bg-muted/60 hover:text-foreground'
              )}
            >
              <Type className="h-3.5 w-3.5" /> Texte
            </button>
            <button
              type="button"
              onClick={() => {
                setVue('doc')
                setReglagesOuverts(false)
                setSommaireOuvert(false)
              }}
              aria-pressed={vueDoc}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-200 active:scale-[0.98]',
                vueDoc
                  ? 'bg-primary text-primary-foreground'
                  : 'text-brouillard hover:bg-muted/60 hover:text-foreground'
              )}
            >
              <BookOpen className="h-3.5 w-3.5" /> Numérisé
            </button>
          </div>
        )}

        {/* ─── Panneau des réglages de lecture ─── */}
        <AnimatePresence>
          {reglagesOuverts && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 border-t border-border bg-card px-4 py-4">
                {/* Police */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-brouillard">Police</span>
                  <div className="flex gap-1">
                    {(arabe ? POLICES_AR : POLICES_PH).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          l.regler(arabe ? { policeArabe: p.id as PoliceArabe } : { police: p.id as PoliceLecture })
                        }
                        aria-pressed={(arabe ? l.policeArabe : l.police) === p.id}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 transition-colors duration-200',
                          arabe ? 'font-arabic text-base' : 'text-sm',
                          (arabe ? l.policeArabe : l.police) === p.id
                            ? 'border-primary/30 bg-primary/10 font-medium text-primary'
                            : 'border-transparent text-brouillard hover:bg-muted/60'
                        )}
                        style={{ fontFamily: p.css }}
                      >
                        {p.nom}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Taille */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-brouillard">Taille</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        l.regler(arabe ? { tailleArabe: Math.max(17, l.tailleArabe - 1) } : { taille: Math.max(14, l.taille - 1) })
                      }
                      aria-label="Réduire la taille du texte"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border text-brouillard transition-colors duration-200 hover:bg-muted/60 hover:text-foreground"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center text-xs font-semibold text-secondary-foreground">{taille} px</span>
                    <button
                      type="button"
                      onClick={() =>
                        l.regler(arabe ? { tailleArabe: Math.min(42, l.tailleArabe + 1) } : { taille: Math.min(30, l.taille + 1) })
                      }
                      aria-label="Agrandir la taille du texte"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border text-brouillard transition-colors duration-200 hover:bg-muted/60 hover:text-foreground"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Interligne */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-brouillard">Interligne</span>
                  <div className="flex gap-1">
                    {INTERLIGNES.map((i) => (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => l.regler({ interligne: i.id })}
                        aria-pressed={l.interligne === i.id}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-xs transition-colors duration-200',
                          l.interligne === i.id
                            ? 'border-primary/30 bg-primary/10 font-medium text-primary'
                            : 'border-transparent text-brouillard hover:bg-muted/60'
                        )}
                      >
                        {i.nom}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  {/* Fond de lecture */}
                  <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.3em] text-brouillard">Fond</span>
                  <div className="flex gap-1.5">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => l.regler({ theme: t.id })}
                        aria-pressed={l.theme === t.id}
                        aria-label={`Fond ${t.nom}`}
                        className={cn(
                          'h-7 w-7 rounded-lg border transition-transform hover:scale-105',
                          l.theme === t.id && 'ring-2 ring-primary ring-offset-1',
                          t.fond,
                          t.cadre
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  {/* Accent */}
                  <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.3em] text-brouillard">Accent</span>
                  <div className="flex gap-1.5">
                    {ACCENTS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => l.regler({ accent: a.id })}
                        aria-pressed={l.accent === a.id}
                        aria-label={`Accent ${a.nom}`}
                        className={cn(
                          'h-7 w-7 rounded-lg border border-black/10 transition-transform hover:scale-105',
                          l.accent === a.id && 'ring-2 ring-primary ring-offset-1'
                        )}
                        style={{ backgroundColor: a.couleur }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Sommaire des chapitres ─── */}
        <AnimatePresence>
          {sommaireOuvert && chapitres.length > 1 && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
              aria-label="Sommaire"
            >
              <div
                className={cn(
                  'max-h-[45vh] space-y-1 overflow-y-auto border-t border-border bg-card p-2 scrollbar-mince'
                )}
              >
                {chapitres.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      allerAuChapitre(i)
                      setSommaireOuvert(false)
                    }}
                    className={cn(
                      'flex w-full items-baseline justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors duration-200',
                      i === indexActif ? 'bg-primary/10 text-primary' : 'text-encre hover:bg-muted/60'
                    )}
                  >
                    <span className={cn('min-w-0 flex-1 truncate text-sm', arabe && 'font-arabic text-right text-[16px]')}>
                      {c.titre}
                    </span>
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-brouillard">
                      {i + 1} / {chapitres.length}
                    </span>
                  </button>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* ─── Le corps du lecteur ─── */}
      {vueDoc && pdf ? (
        /* Le document original, rendu page à page sur canvas par pdf.js —
           le lecteur natif de Chrome étant bloqué dans les iframes
           imbriquées (aperçu, PWA), nous dessinons les pages nous-mêmes :
           la mise en page exacte du livre imprimé, défilement continu */
        <LecteurPdf src={pdf} titre={titre} onFermer={onFermer} />
      ) : (
        /* Le texte : chaque chapitre est une page posée sur le fond */
        <div
          ref={conteneurRef}
          className="scrollbar-mince min-h-0 flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div
            className={cn(
              'mx-auto flex w-full max-w-[760px] flex-col items-stretch gap-3 px-2.5 pb-[calc(110px+env(safe-area-inset-bottom))] pt-3 sm:px-4'
            )}
          >
            {estSama && !samaTexte && (
              /* le diwân arrive : un instant de patience */
              <div className="flex flex-col items-center gap-3 py-20 text-brouillard">
                <span
                  aria-hidden
                  className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary"
                />
                <span className="text-[11px] font-medium uppercase tracking-[0.25em]">
                  ouverture du diwân…
                </span>
              </div>
            )}
            {chapitres.map((c, i) => (
              <article
                key={c.id}
                data-i={i}
                ref={(el) => {
                  cartesRef.current[i] = el
                }}
                dir={arabe ? 'rtl' : undefined}
                lang={arabe ? 'ar' : undefined}
                className={cn(
                  'grain-papier relative overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-7',
                  theme.fond,
                  theme.texte,
                  theme.cadre
                )}
              >
                {/* En-tête du chapitre */}
                <header className="mb-5 text-center">
                  <h3
                    className={cn('leading-tight', arabe ? 'font-arabic text-[30px] font-semibold leading-snug' : 'text-[22px] font-semibold')}
                    style={{ fontFamily: police.css, color: accent.couleur }}
                  >
                    {c.titre}
                  </h3>
                  <p
                    className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.22em] opacity-50"
                    dir={arabe ? 'ltr' : undefined}
                  >
                    {c.sousTitre}
                  </p>
                  <div
                    className="mx-auto mt-3 h-px w-24"
                    style={{ backgroundColor: accent.couleur, opacity: 0.4 }}
                    aria-hidden
                  />
                </header>

                {/* Le texte sacré */}
                <div
                  className={cn(!arabe && 'cahier-texte', arabe && 'kitab-texte text-right')}
                  style={{
                    fontFamily: police.css,
                    fontSize: `${taille}px`,
                    lineHeight: (INTERLIGNES.find((x) => x.id === l.interligne) ?? INTERLIGNES[1]).valeur,
                  }}
                >
                  {c.texte.split('\n').map((ligne, j) => (
                    <LigneInvocation key={j} ligne={ligne} accent={accent.couleur} />
                  ))}
                </div>

                {/* Imprimer ce chapitre — pas pour le diwân, qui
                    s'imprime depuis sa page numérisée */}
                {!estSama && (
                  <footer className="mt-6 flex justify-center border-t pt-4" style={{ borderColor: `${accent.couleur}30` }}>
                    <button
                      type="button"
                      onClick={() =>
                        imprimer({ kind: arabe ? 'kitab' : 'cahier', chapitreId: c.id })
                      }
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] transition-all active:scale-95"
                      style={{ color: accent.couleur }}
                    >
                      <Printer className="h-3.5 w-3.5" /> Imprimer ce chapitre
                    </button>
                  </footer>
                )}
              </article>
            ))}

            {/* La fin du document — pas pendant l'ouverture du diwân */}
            {!(estSama && !samaTexte) && (
              <p className="py-2 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-brouillard">
                · fin du document ·
              </p>
            )}
          </div>

          {/* ─── La barre flottante du bas : revenir + feuilletage ─── */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
            style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}
          >
            <div
              className={cn(
                'pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-card/90 p-1.5 shadow-lg backdrop-blur transition-all duration-200',
                scrolle ? 'translate-y-0 opacity-100' : 'translate-y-0 opacity-100'
              )}
            >
              <button
                type="button"
                onClick={onFermer}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-medium text-brouillard transition-colors duration-200 hover:bg-muted/60 hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" /> revenir
              </button>

              {chapitres.length > 1 && (
                <>
                  <span className="h-5 w-px bg-border" aria-hidden />
                  <button
                    type="button"
                    onClick={() => allerAuChapitre(Math.max(0, indexActif - 1))}
                    disabled={indexActif === 0}
                    aria-label="Chapitre précédent"
                    className={cn(
                      'grid h-10 w-10 place-items-center rounded-full transition-colors duration-200',
                      indexActif === 0
                        ? 'cursor-not-allowed text-brouillard/40'
                        : 'text-brouillard hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <ChevronLeft className="h-4.5 w-4.5 rotate-180" />
                  </button>
                  <span className="min-w-[3.2em] text-center text-[11px] font-medium tabular-nums text-brouillard">
                    {indexActif + 1} / {chapitres.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => allerAuChapitre(Math.min(chapitres.length - 1, indexActif + 1))}
                    disabled={indexActif === chapitres.length - 1}
                    aria-label="Chapitre suivant"
                    className={cn(
                      'grid h-10 w-10 place-items-center rounded-full transition-colors duration-200',
                      indexActif === chapitres.length - 1
                        ? 'cursor-not-allowed text-brouillard/40'
                        : 'text-brouillard hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

/* ═══ LA SECTION ADHKÂR ═════════════════════════════════════════════ */

export function AdhkarSection() {
  const l = useLecture()
  const langue = l.langueAdhkar
  const arabe = langue === 'ar'

  const [lecteur, setLecteur] = useState<{ doc: DocAdhkar; chapitre?: string } | null>(null)

  /* La recherche globale (⌘K) demande un document précis :
     le lecteur s'ouvre par l'état dérivé pendant le rendu (motif
     documenté React, sans effet de bord externe à ce stade), et les
     mises à jour des stores externes — langue de lecture consommée,
     demande consommée — se font après coup, dans l'effet. */
  const demande = useDemandeLecture((s) => s.demande)
  const [traitee, setTraitee] = useState<{ docId?: string; chapitreId?: string } | null>(null)
  if (demande && (traitee?.docId !== demande.docId || traitee?.chapitreId !== demande.chapitreId)) {
    const doc = DOCUMENTS_ADHKAR.find((d) => d.id === demande.docId)
    setTraitee({ docId: demande.docId, chapitreId: demande.chapitreId })
    if (doc) {
      setLecteur({ doc, chapitre: demande.chapitreId })
    }
  }
  useEffect(() => {
    if (!demande) return
    if (demande.langue && demande.langue !== langue) {
      l.regler({ langueAdhkar: demande.langue })
    }
    useDemandeLecture.getState().consommer()
  }, [demande])

  return (
    <SectionShell
      titre="Adhkâr"
      compteur="9 documents · phonétique & arabe"
      id="adhkar"
      defaultOpen={false}
    >
      <div className="space-y-3">
        {/* ─── La bascule de langue — phonétique ou arabe ─── */}
        <div
          className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-card p-1"
          role="group"
          aria-label="Langue de lecture"
        >
          <button
            type="button"
            onClick={() => l.regler({ langueAdhkar: 'ph' })}
            aria-pressed={!arabe}
            className={cn(
              'rounded-xl px-4 py-2.5 text-[13px] font-medium uppercase tracking-[0.14em] transition-colors duration-200 active:scale-[0.98]',
              !arabe
                ? 'bg-primary text-primary-foreground'
                : 'text-brouillard hover:bg-muted/60 hover:text-primary'
            )}
          >
            Phonétique
          </button>
          <button
            type="button"
            onClick={() => l.regler({ langueAdhkar: 'ar' })}
            aria-pressed={arabe}
            dir="rtl"
            className={cn(
              'rounded-xl px-4 py-2.5 font-arabic text-[17px] font-medium transition-colors duration-200 active:scale-[0.98]',
              arabe
                ? 'bg-primary text-primary-foreground'
                : 'text-brouillard hover:bg-muted/60 hover:text-primary'
            )}
          >
            عربي
          </button>
        </div>

        {/* ─── Les neuf documents — une pièce, une porte ─── */}
        <div className="space-y-2" role="list">
          {DOCUMENTS_ADHKAR.map((doc, i) => {
            const titre = arabe ? doc.titreAr : doc.titreFr
            const detail = arabe ? doc.detailAr : doc.detailFr
            const nbChapitres = (arabe ? doc.ar?.length : doc.ph?.length) ?? 0
            const estPdf = Boolean(arabe ? doc.pdfAr : doc.pdfPh)
            return (
              <motion.button
                key={doc.id}
                type="button"
                role="listitem"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.25) }}
                onClick={() => setLecteur({ doc })}
                dir={arabe ? 'rtl' : undefined}
                className={cn(
                  'carte-precieuse group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 hover:border-primary/30 active:scale-[0.995]',
                  arabe && 'text-right'
                )}
              >
                {/* Pastille du document */}
                <span
                  aria-hidden
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-feuille text-[13px] font-medium text-primary transition-colors duration-200 group-hover:bg-lin-clair"
                >
                  {i + 1}
                </span>

                {/* Le nom de la pièce — jamais coupé */}
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block truncate font-display text-[17px] font-medium text-encre',
                      arabe && 'font-arabic text-[18px]'
                    )}
                  >
                    {titre}
                  </span>
                  {/* Détail + badge « morceaux » en flex : jamais collés,
                      jamais rognés — le bidi ne mélange plus les nombres */}
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-brouillard">
                    <span className="min-w-0 flex-1 truncate">
                      {estPdf ? (
                        <span className="inline-flex items-center gap-1">
                          <FileDown className="h-3 w-3" aria-hidden /> {detail}
                        </span>
                      ) : (
                        detail
                      )}
                    </span>
                    {nbChapitres > 1 && (
                      <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider text-brouillard">
                        {nbChapitres} morceaux
                      </span>
                    )}
                  </span>
                </span>

                {/* Le chevron : on ouvre */}
                <span
                  aria-hidden
                  className={cn(
                    'shrink-0 text-[17px] leading-none text-brouillard transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary',
                    arabe && 'rotate-180'
                  )}
                >
                  ›
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* Note de fidélité */}
        <p className="flex items-center justify-center gap-1.5 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-brouillard">
          <img src="/icons/tasbih.svg" alt="" aria-hidden className="h-3.5 w-3.5" />
          phonétique du cahier de la zawiya · arabe en riwāyat warsh
        </p>
      </div>

      {/* ─── Le lecteur plein écran ─── */}
      <AnimatePresence>
        {lecteur && (
          <LecteurAdhkar
            key={`${lecteur.doc.id}-${langue}-${lecteur.chapitre ?? 'tête'}`}
            doc={lecteur.doc}
            langue={langue}
            chapitreInitial={lecteur.chapitre}
            onFermer={() => setLecteur(null)}
          />
        )}
      </AnimatePresence>
    </SectionShell>
  )
}

'use client'

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { create } from 'zustand'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen,
  ChevronDown,
  FileDown,
  List,
  Minus,
  MoveUpRight,
  Music,
  Plus,
  Type,
  X,
} from 'lucide-react'
import {
  DOCUMENTS_ADHKAR,
  GROUPES_WADHIFA,
  ORDRE_LECTURE_ARABE,
  chapitresDuDoc,
  chiffresArabes,
  chiffresLatins,
  pdfDuDoc,
  pratiqueDuRenvoi,
  type ChapitreLecture,
  type DocAdhkar,
  type GroupeWadhifa,
  type LangueAdhkar,
} from '@/data/adhkar-docs'
import {
  useLecture,
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
  { id: 'scheherazade', nom: 'شهرزاد', css: 'var(--font-arabic)' },
  { id: 'amiri', nom: 'أميري', css: 'var(--font-arabic2)' },
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

/* ─── Les renvois de pages — des liens, pas des chiffres morts ───
   Le cahier imprimé renvoie ses pratiques les unes aux autres :
   « Sûrat (36) Yâ-Sîn → p. 7 » en phonétique, « سُورَةُ يس ← ص ٧ »
   dans le kitāb. À l'écran, la page devient un lien qui mène
   directement à la pratique visée. */
export interface RenvoiLecture {
  /** la page imprimée visée et le texte avant le renvoi (le titre) :
      l'index de la pratique dans le lecteur, ou −1 */
  cible: (livre: 'ph' | 'ar', page: number, titreAvant: string) => number
  /** y aller */
  aller: (i: number) => void
}

/* « → p. 7 » (cahier phonétique) ou « ← ص ٧ » (kitāb arabe) */
const RENVOI_PAGE = /(→\s*p\.\s*(\d+)|←\s*ص\s*([٠-٩]+))/g
/* la ligne ENTIÈRE est un renvoi : « Sûrat Yâ-Sîn → p. 7 » */
const RENVOI_SEUL = /^\s*([^\n]{1,90}?)\s*(→\s*p\.\s*(\d+)|←\s*ص\s*([٠-٩]+))\s*$/

function LigneInvocation({
  ligne,
  accent,
  renvoi,
}: {
  ligne: string
  accent: string
  renvoi?: RenvoiLecture
}) {
  /* 1. La ligne entière est un renvoi — le titre souligné, la page
        en médaillon pointillé : tout est cliquable */
  const seul = renvoi ? ligne.match(RENVOI_SEUL) : null
  if (seul) {
    const livre: 'ph' | 'ar' = seul[3] !== undefined ? 'ph' : 'ar'
    const page = seul[3] !== undefined ? Number(seul[3]) : chiffresLatins(seul[4])
    const i = renvoi.cible(livre, page, seul[1])
    if (i >= 0) {
      return (
        <button
          type="button"
          onClick={() => renvoi.aller(i)}
          title="Aller directement à cette pratique"
          className="lien-renvoi my-0.5 inline-flex flex-wrap items-baseline gap-x-1.5 py-0.5 text-start align-baseline active:scale-[0.985]"
          style={{ color: accent }}
        >
          {seul[1] && (
            <span className="underline decoration-dotted decoration-1 underline-offset-[3px] opacity-90">
              {seul[1]}
            </span>
          )}
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed px-2 py-px text-[0.72em] font-bold"
            style={{ borderColor: `${accent}80`, backgroundColor: `${accent}14` }}
          >
            {seul[2]}
            <MoveUpRight className="h-[1.05em] w-[1.05em] rtl:-scale-x-100" aria-hidden />
          </span>
        </button>
      )
    }
  }

  /* 2. Un renvoi au milieu d'une ligne plus longue : le segment
        « → p. 49 » seul devient le lien */
  if (renvoi) {
    const rencontres = [...ligne.matchAll(RENVOI_PAGE)]
    if (rencontres.length) {
      const parties: ReactNode[] = []
      let curseur = 0
      rencontres.forEach((m, j) => {
        const debut = m.index ?? 0
        if (debut > curseur) {
          parties.push(<Fragment key={`t${j}`}>{ligne.slice(curseur, debut)}</Fragment>)
        }
        const livre: 'ph' | 'ar' = m[2] !== undefined ? 'ph' : 'ar'
        const page = m[2] !== undefined ? Number(m[2]) : chiffresLatins(m[3])
        const i = renvoi.cible(livre, page, ligne.slice(0, debut))
        if (i < 0) {
          parties.push(<Fragment key={`r${j}`}>{m[0]}</Fragment>)
        } else {
          parties.push(
            <button
              key={`r${j}`}
              type="button"
              onClick={() => renvoi.aller(i)}
              title="Aller directement à cette pratique"
              className="lien-renvoi mx-0.5 inline-flex items-baseline gap-1 rounded-md px-1.5 py-px align-baseline text-[0.78em] font-bold active:scale-[0.96]"
              style={{ color: accent, backgroundColor: `${accent}14` }}
            >
              {m[0]}
              <MoveUpRight className="h-[1.05em] w-[1.05em] rtl:-scale-x-100" aria-hidden />
            </button>,
          )
        }
        curseur = debut + m[0].length
      })
      if (curseur < ligne.length) {
        parties.push(<Fragment key="fin">{ligne.slice(curseur)}</Fragment>)
      }
      return <span className="block">{parties}</span>
    }
  }

  /* 3. Les répétitions « x 100 » / « × ١٠٠ » en badge */
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

/* ─── La bascule andalouse — deux tuiles de zellige ───
   Plus d'onglets en pilule : chaque choix est une tuile à huit
   pans (khātim), l'active posée sur un filet d'or, l'autre en
   porcelaine — un souffle d'Al-Andalus dans la lecture. */
function BasculeAndalouse<T extends string>({
  valeur,
  choix,
  onChange,
  libelle,
  taille = 'md',
}: {
  valeur: T
  choix: { id: T; label: string; rtl?: boolean }[]
  onChange: (v: T) => void
  libelle: string
  taille?: 'md' | 'sm'
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1" role="group" aria-label={libelle}>
      {choix.map((c, i) => {
        const actif = c.id === valeur
        return (
          <Fragment key={c.id}>
            {i > 0 && (
              <span aria-hidden className="select-none px-0.5 text-[9px] text-gold/70">
                ✦
              </span>
            )}
            <span className="tuile-focus inline-block">
              <button
                type="button"
                onClick={() => onChange(c.id)}
                aria-pressed={actif}
                dir={c.rtl ? 'rtl' : undefined}
                className={cn(
                  'tuile-khatim relative block transition-transform duration-200 active:scale-[0.96]',
                  taille === 'md' ? 'px-6 py-2.5' : 'px-4 py-1.5'
                )}
              >
                {/* Le filet d'or de la tuile */}
                <span
                  aria-hidden
                  className={cn(
                    'tuile-khatim absolute inset-0 transition-opacity duration-300',
                    actif
                      ? 'bg-gradient-to-br from-gold via-accent to-gold-vif opacity-100'
                      : 'bg-gold/60 opacity-80'
                  )}
                />
                {/* La plaque : vert profond ou porcelaine */}
                <span
                  className={cn(
                    'tuile-khatim relative m-[1.5px] flex items-center justify-center transition-colors duration-200',
                    taille === 'md'
                      ? c.rtl
                        ? 'px-4 py-1.5 font-arabic text-[17px]'
                        : 'px-4 py-1.5 text-[12.5px] font-semibold uppercase tracking-[0.14em]'
                      : c.rtl
                        ? 'px-3 py-0.5 font-arabic text-[15px]'
                        : 'px-3 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.13em]',
                    actif
                      ? 'bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
                      : 'bg-card text-brouillard hover:bg-feuille hover:text-primary'
                  )}
                >
                  {c.label}
                </span>
              </button>
            </span>
          </Fragment>
        )
      })}
    </div>
  )
}

/* ─── Un vers de qaṣīda — deux hémistiches pleine largeur ───
   Le Nasiri ou la Munfarija n'est plus une colonne étroite
   alignée à droite : chaque distique s'étale en deux colonnes
   comme dans le kitāb imprimé, le séparateur ۞ au centre.
   Sur téléphone en portrait, le vers ENTIER tient sur une
   ligne : la taille se resserre d'elle-même pour que le vers
   le plus long ne déborde jamais — mesuré au pixel près,
   quelle que soit la police ou la taille choisies. */
function VersPoeme({
  ligne,
  accent,
  taille,
  police,
}: {
  ligne: string
  accent: string
  /** la taille de lecture choisie — re-mesure le vers si elle change */
  taille: number
  /** la police de lecture choisie — re-mesure le vers si elle change */
  police: string
}) {
  const coupe = ligne.split('۞')
  if (coupe.length !== 2) {
    return <LigneInvocation ligne={ligne} accent={accent} />
  }
  return (
    <VersDeuxShatr
      shatrDroite={coupe[0].trim()}
      shatrGauche={coupe[1].trim()}
      accent={accent}
      taille={taille}
      police={police}
    />
  )
}

/* Le vers à deux hémistiches — monté seulement quand le ۞ sépare */
function VersDeuxShatr({
  shatrDroite,
  shatrGauche,
  accent,
  taille,
  police,
}: {
  shatrDroite: string
  shatrGauche: string
  accent: string
  taille: number
  police: string
}) {
  const ref = useRef<HTMLSpanElement | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const ajuster = () => {
      /* D'abord rendre la taille choisie par le frère */
      el.style.fontSize = ''
      /* Hors du mode une-ligne (tablette, paysage : deux colonnes
         du kitāb), la taille choisie s'applique telle quelle */
      if (getComputedStyle(el).display !== 'flex') return
      const shatrs = el.querySelectorAll('.poesie-shatr')
      const fasl = el.querySelector('.poesie-fasl')
      if (shatrs.length !== 2 || !fasl) return

      /* Largeur naturelle du vers entier, nowrap */
      const gap =
        2 * (parseFloat(getComputedStyle(el).columnGap) || 0) || 0
      const nat =
        shatrs[0].getBoundingClientRect().width +
        shatrs[1].getBoundingClientRect().width +
        fasl.getBoundingClientRect().width +
        gap
      const dispo = el.clientWidth
      if (nat <= dispo + 1 || nat === 0) return

      /* Resserrer juste ce qu'il faut — jamais au-dessous de 11 px.
         Deux pixels de grâce : les largeurs mesurées sont arrondies
         au quart de pixel près par le moteur de rendu. */
      const heritee = parseFloat(getComputedStyle(el).fontSize)
      el.style.fontSize = `${Math.max(11, Math.floor((heritee * (dispo - 2)) / nat))}px`
    }

    ajuster()
    /* La fenêtre bouge (rotation, redimensionnement) : re-mesurer */
    const ro = new ResizeObserver(ajuster)
    ro.observe(el)
    return () => ro.disconnect()
  }, [shatrDroite, shatrGauche, taille, police])

  return (
    <span ref={ref} className="poesie-vers">
      <span className="poesie-shatr">{shatrDroite}</span>
      <span aria-hidden className="poesie-fasl" style={{ color: accent }}>
        ۞
      </span>
      <span className="poesie-shatr">{shatrGauche}</span>
    </span>
  )
}

/* ─── Le paragraphage du cahier phonétique ───
   Le cahier imprimé est une colonne étroite : l'extraction garde
   des lignes courtes coupées au milieu des phrases. On rejoint
   les lignes d'un même bloc (séparé par une ligne vide) et on
   coupe après les renvois « → p. » et les répétitions « x 100 » —
   le texte coule alors sur toute la largeur, justifié comme un
   livre, au lieu de rester collé à gauche. */
function paragrapher(texte: string): string[] {
  const paras: string[] = []
  let courant: string[] = []
  const flush = () => {
    if (courant.length) {
      paras.push(courant.join(' ').replace(/\s+/g, ' ').trim())
      courant = []
    }
  }
  for (const brute of texte.split('\n')) {
    const t = brute.trim()
    if (!t) {
      flush()
      continue
    }
    courant.push(t)
    /* Fin logique de paragraphe : renvoi de page, ou répétition badgée */
    if (/→\s*p\.|→\s*ص|[×x]\s*[٠-٩\d][٠-٩\dHh '’]*$/.test(t)) flush()
  }
  flush()
  return paras
}

/* Une entrée du lecteur — chapitre dans sa langue EFFECTIVE :
   les pratiques du cahier sans version dans la langue demandée
   se lisent dans l'autre langue, sans jamais disparaître. */
interface EntreeLecture extends ChapitreLecture {
  langue: LangueAdhkar
  /** la pratique n'existe pas dans la langue demandée — repli */
  repli?: boolean
  groupe?: GroupeWadhifa
  /** la pratique du cahier de wadhifa — cible des renvois de pages */
  idPratique?: string
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

  /* Les entrées du lecteur : pratiques structurées (cahier de
     wadhifa) ou chapitres plats (autres documents). Chaque entrée
     porte sa langue effective — le sommaire ne change jamais quand
     on bascule phonétique ⇄ عربي, la pratique lue reste en place.
     ORDRE : en phonétique, l'ordre du cahier imprimé ; en arabe,
     l'ORDRE DU KITĀB IMPRIMÉ (k01 p.4 → k21 p.65), où s'insèrent
     à leur place du cahier les pratiques absentes du kitāb — le
     Mujarrad reste entre Muwaḥḥad et Kabîr, les dhikrs restent
     collés à la Mashîshiyya : ce qui est ensemble dans un livre
     reste ensemble, dans l'ordre. */
  const entrees = useMemo<EntreeLecture[]>(() => {
    if (doc.pratiques) {
      const converties = doc.pratiques
        .map((p): EntreeLecture | null => {
          const prefere = p[langue]
          const autre = langue === 'ph' ? p.ar : p.ph
          const c = prefere ?? autre
          if (!c) return null
          return {
            ...c,
            langue: prefere ? langue : langue === 'ph' ? 'ar' : 'ph',
            repli: !prefere,
            groupe: p.groupe,
            idPratique: p.id,
          }
        })
        .filter((e): e is EntreeLecture => e !== null)
      if (langue !== 'ar') return converties
      const position = (e: EntreeLecture) => {
        const i = ORDRE_LECTURE_ARABE.indexOf(e.idPratique ?? e.id)
        return i >= 0 ? i : ORDRE_LECTURE_ARABE.length
      }
      return [...converties].sort((a, b) => position(a) - position(b))
    }
    if (doc.id === 'sama' && langue === 'ph') {
      return (samaTexte ?? []).map((c) => ({ ...c, langue: 'ph' as const }))
    }
    return chapitresDuDoc(doc, langue).map((c) => ({ ...c, langue }))
  }, [doc, langue, samaTexte])
  const chapitres = entrees
  const pdf = pdfDuDoc(doc, langue)
  const conteneurRef = useRef<HTMLDivElement | null>(null)
  const cartesRef = useRef<(HTMLElement | null)[]>([])

  const [indexActif, setIndexActif] = useState(() => {
    const i = chapitreInitial ? entrees.findIndex((c) => c.id === chapitreInitial) : -1
    return i >= 0 ? i : 0
  })
  const [reglagesOuverts, setReglagesOuverts] = useState(false)
  const [sommaireOuvert, setSommaireOuvert] = useState(false)
  /* La carte sommaire du cahier — dépliée à l'ouverture, refermée
     si la recherche ⌘K demande directement une pratique. */
  const [sommaireCarte, setSommaireCarte] = useState(!chapitreInitial)
  const [progression, setProgression] = useState(0)

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

  /* ─── Progression de la lecture ─── */
  useEffect(() => {
    const el = conteneurRef.current
    if (!el) return
    const surScroll = () => {
      const reste = el.scrollHeight - el.clientHeight
      setProgression(reste > 0 ? Math.min(1, el.scrollTop / reste) : 0)
    }
    el.addEventListener('scroll', surScroll, { passive: true })
    surScroll()
    return () => el.removeEventListener('scroll', surScroll)
  }, [vueDoc])

  /* ─── Positionner au chapitre demandé à l'ouverture ───
     (le diwân arrive un instant après : on replace alors)
     « langue » n'est PAS une dépendance : basculer phonétique ⇄ عربي
     ne doit jamais replacer la lecture. En arabe l'ordre change
     (celui du kitāb) : on mémorise la pratique lue AVANT le
     réordonnancement et on y revient juste après — la pratique
     reste sous les yeux, seule l'ordre du sommaire change. */
  const idAvantBascule = useRef<string | null>(null)
  useEffect(() => {
    if (langue === 'ar') {
      /* capture AVANT réordonnancement : indexActif pointe encore
         dans l'ancien ordre — on prend l'id depuis le DOM visible */
      const cartes = cartesRef.current
      const conteneur = conteneurRef.current
      if (conteneur && cartes.length) {
        const haut = conteneur.scrollTop + conteneur.clientHeight * 0.25
        let meilleure: HTMLElement | null = null
        for (const c of cartes) {
          if (!c) continue
          if (c.offsetTop <= haut) meilleure = c
          else break
        }
        idAvantBascule.current = meilleure?.dataset.idPratique ?? null
      }
    }
    const idAGarder = idAvantBascule.current
    const minuteur = window.setTimeout(() => {
      if (langue === 'ar' && idAGarder) {
        const i = chapitres.findIndex((c) => c.id === idAGarder)
        const cible = i >= 0 ? cartesRef.current[i] : null
        cible?.scrollIntoView({ block: 'start' })
      }
    }, 60)
    return () => window.clearTimeout(minuteur)
  }, [langue])

  useEffect(() => {
    const el = conteneurRef.current
    if (!el) return
    if (chapitreInitial) {
      const i = chapitres.findIndex((c) => c.id === chapitreInitial)
      const cible = i >= 0 ? cartesRef.current[i] : null
      if (cible) {
        cible.scrollIntoView({ block: 'start' })
        return
      }
    }
    el.scrollTo({ top: 0 })
  }, [chapitreInitial, doc.id, chapitres.length])

  /* Ancre robuste : scrollIntoView + marge de défilement — le
     navigateur mesure lui-même la position réelle, quel que soit
     l'état de l'en-tête ou des panneaux déroulés au-dessus. */
  const allerAuChapitre = useCallback((i: number) => {
    const cible = cartesRef.current[i]
    if (cible) cible.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  /* Les renvois « → p. 7 » / « ← ص ٧ » deviennent des liens : la page
     imprimée désigne une pratique du cahier ou du kitāb, on y mène
     directement — dans la langue courante. */
  const renvoi = useMemo<RenvoiLecture>(
    () => ({
      cible: (livre, page, titreAvant) => {
        const id = pratiqueDuRenvoi(livre, page, titreAvant)
        if (!id) return -1
        return chapitres.findIndex((e) => e.idPratique === id)
      },
      aller: (i) => {
        if (i >= 0) allerAuChapitre(i)
      },
    }),
    [chapitres, allerAuChapitre],
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
          className="flex items-center gap-1 px-2.5 pt-[calc(10px+env(safe-area-inset-top))] pb-2.5 [@media(orientation:landscape)_and_(max-height:540px)]:pt-[3px]! [@media(orientation:landscape)_and_(max-height:540px)]:pb-1!"
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
                if (doc.pratiques) {
                  /* Le cahier de wadhifa : le sommaire est la carte en tête */
                  setSommaireCarte((o) => !o)
                  conteneurRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                } else {
                  setSommaireOuvert((o) => !o)
                }
                setReglagesOuverts(false)
              }}
              aria-expanded={sommaireOuvert || (doc.pratiques && sommaireCarte)}
              aria-label="Sommaire du document"
              className={cn(
                'grid h-9 w-9 place-items-center rounded-full transition-colors duration-200',
                sommaireOuvert || (doc.pratiques && sommaireCarte)
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
            sur porcelaine), ou le livre imprimé à l'identique — en
            tuiles de zellige */}
        {aLesDeux && (
          <div className="flex justify-center border-t border-border py-2 [@media(orientation:landscape)_and_(max-height:540px)]:py-0.5!">
            <BasculeAndalouse
              libelle="Vue du document"
              taille="sm"
              valeur={vueDoc ? 'doc' : 'texte'}
              choix={[
                { id: 'texte', label: 'Texte' },
                { id: 'doc', label: 'Numérisé' },
              ]}
              onChange={(v) => {
                setVue(v)
                setReglagesOuverts(false)
                setSommaireOuvert(false)
              }}
            />
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

        {/* ─── Sommaire des chapitres (documents plats) ─── */}
        <AnimatePresence>
          {sommaireOuvert && !doc.pratiques && chapitres.length > 1 && (
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
              'mx-auto flex w-full max-w-[840px] flex-col items-stretch gap-3 px-3 pb-[calc(110px+env(safe-area-inset-bottom))] pt-3 sm:px-5 [@media(orientation:landscape)_and_(max-height:540px)]:pb-[calc(24px+env(safe-area-inset-bottom))]! [@media(orientation:landscape)_and_(max-height:540px)]:gap-2!'
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

            {/* ─── Le sommaire hypertexte du cahier de wadhifa ───
                une entrée = une pratique ; cliquer y va directement */}
            {doc.pratiques && (
              <nav
                aria-label="Sommaire des pratiques"
                className={cn(
                  'grain-papier poesie-page relative overflow-hidden rounded-2xl border p-5 shadow-sm sm:p-6',
                  theme.fond,
                  theme.texte,
                  theme.cadre
                )}
              >
                <button
                  type="button"
                  onClick={() => setSommaireCarte((o) => !o)}
                  aria-expanded={sommaireCarte}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <span className="flex min-w-0 items-baseline gap-2">
                    <List
                      className="h-4 w-4 shrink-0 self-center"
                      style={{ color: accent.couleur }}
                      aria-hidden
                    />
                    <span
                      className="text-[16px] font-semibold"
                      style={{ color: accent.couleur }}
                    >
                      Sommaire
                    </span>
                    <span className="text-[9.5px] font-medium uppercase tracking-[0.2em] opacity-60">
                      {entrees.length} pratiques
                    </span>
                  </span>
                  <motion.span
                    animate={{ rotate: sommaireCarte ? 180 : 0 }}
                    className="shrink-0 opacity-60"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                </button>
                <p className="mt-0.5 pl-6 text-[10.5px] italic opacity-55">
                  Clique sur une pratique pour y accéder directement.
                </p>
                <AnimatePresence initial={false}>
                  {sommaireCarte && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-4">
                        {arabe && doc.pratiques ? (
                          /* En arabe : LE LIVRE, dans l'ordre du kitāb imprimé —
                             une liste continue, ce qui est ensemble dans le
                             livre reste ensemble. La page du livre est portée
                             par chaque entrée (p. 4 → 65). */
                          <div>
                            <div
                              className="mb-1.5 flex items-baseline gap-2 border-b pb-1"
                              style={{ borderColor: `${accent.couleur}30` }}
                            >
                              <span
                                aria-hidden
                                className="text-[8px] leading-none"
                                style={{ color: accent.couleur }}
                              >
                                ✦
                              </span>
                              <h4
                                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                                style={{ color: accent.couleur }}
                              >
                                Ordre du kitāb
                              </h4>
                              <span
                                className="font-arabic text-[12px] opacity-50"
                                dir="rtl"
                                lang="ar"
                              >
                                كتاب الأذكار
                              </span>
                            </div>
                            <ul className="space-y-0.5">
                              {entrees.map((e, i) => (
                                <li key={e.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSommaireCarte(false)
                                      window.setTimeout(() => allerAuChapitre(i), 400)
                                    }}
                                    className="group relative flex w-full items-baseline justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left transition-transform active:scale-[0.995]"
                                  >
                                    <span
                                      aria-hidden
                                      className="pointer-events-none absolute inset-0 rounded-lg bg-current opacity-0 transition-opacity duration-200 group-hover:opacity-[0.05] group-focus-visible:opacity-[0.05]"
                                    />
                                    <span className="min-w-0 flex-1 truncate text-[13.5px]">
                                      <span className="mr-1.5 inline-block min-w-[30px] shrink-0 text-right text-[10px] font-bold tabular-nums opacity-45" dir="ltr">
                                        {e.debut > 0
                                          ? e.langue === 'ar'
                                            ? `ص ${chiffresArabes(e.debut)}`
                                            : `p. ${e.debut}`
                                          : i + 1}
                                      </span>
                                      <span
                                        dir={e.langue === 'ar' ? 'rtl' : undefined}
                                        lang={e.langue === 'ar' ? 'ar' : undefined}
                                        className={cn(
                                          e.langue === 'ar' && 'font-arabic text-[15.5px]'
                                        )}
                                      >
                                        {e.titre}
                                      </span>
                                      {e.repli && (
                                        <span
                                          className="ml-1.5 inline-block rounded-full border px-1.5 py-0.5 align-middle text-[8.5px] font-bold uppercase tracking-wider opacity-55"
                                          style={{ borderColor: `${accent.couleur}40` }}
                                        >
                                          phonétique
                                        </span>
                                      )}
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                        GROUPES_WADHIFA.map((g) => {
                          const items = entrees
                            .map((e, i) => ({ e, i }))
                            .filter(({ e }) => e.groupe === g.id)
                          if (!items.length) return null
                          return (
                            <div key={g.id}>
                              <div
                                className="mb-1.5 flex items-baseline gap-2 border-b pb-1"
                                style={{ borderColor: `${accent.couleur}30` }}
                              >
                                <span
                                  aria-hidden
                                  className="text-[8px] leading-none"
                                  style={{ color: accent.couleur }}
                                >
                                  ✦
                                </span>
                                <h4
                                  className="text-[10px] font-bold uppercase tracking-[0.22em]"
                                  style={{ color: accent.couleur }}
                                >
                                  {g.titre}
                                </h4>
                                <span
                                  className="font-arabic text-[12px] opacity-50"
                                  dir="rtl"
                                  lang="ar"
                                >
                                  {g.titreAr}
                                </span>
                              </div>
                              <ul className="space-y-0.5">
                                {items.map(({ e, i }) => (
                                  <li key={e.id}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSommaireCarte(false)
                                        /* La fermeture de la carte (0,32 s) change la
                                           hauteur au-dessus de la cible : on laisse
                                           l'animation se terminer avant de mesurer,
                                           sinon le point d'arrivée glisse trop haut. */
                                        window.setTimeout(() => allerAuChapitre(i), 400)
                                      }}
                                      className="group relative flex w-full items-baseline justify-between gap-3 rounded-lg px-2.5 py-1.5 text-left transition-transform active:scale-[0.995]"
                                    >
                                      <span
                                        aria-hidden
                                        className="pointer-events-none absolute inset-0 rounded-lg bg-current opacity-0 transition-opacity duration-200 group-hover:opacity-[0.05] group-focus-visible:opacity-[0.05]"
                                      />
                                      <span className="min-w-0 flex-1 truncate text-[13.5px]">
                                        <span className="mr-1.5 inline-block min-w-[30px] shrink-0 text-right text-[10px] font-bold tabular-nums opacity-45" dir="ltr">
                                          {e.debut > 0
                                            ? e.langue === 'ar'
                                              ? `ص ${chiffresArabes(e.debut)}`
                                              : `p. ${e.debut}`
                                            : i + 1}
                                        </span>
                                        <span
                                          dir={e.langue === 'ar' ? 'rtl' : undefined}
                                          lang={e.langue === 'ar' ? 'ar' : undefined}
                                          className={cn(
                                            e.langue === 'ar' && 'font-arabic text-[15.5px]'
                                          )}
                                        >
                                          {e.titre}
                                        </span>
                                        {e.repli && (
                                          <span
                                            className="ml-1.5 inline-block rounded-full border px-1.5 py-0.5 align-middle text-[8.5px] font-bold uppercase tracking-wider opacity-55"
                                            style={{ borderColor: `${accent.couleur}40` }}
                                          >
                                            {e.langue === 'ar' ? 'arabe' : 'phonétique'}
                                          </span>
                                        )}
                                      </span>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </nav>
            )}

            {chapitres.map((c, i) => {
              /* La langue de CETTE pratique — l'arabe du kitāb ou la
                 phonétique du cahier — réglages de lecture adaptés */
              const arabeC = c.langue === 'ar'
              const policeC = arabeC
                ? POLICES_AR.find((p) => p.id === l.policeArabe) ?? POLICES_AR[0]
                : POLICES_PH.find((p) => p.id === l.police) ?? POLICES_PH[0]
              const tailleC = arabeC ? l.tailleArabe : l.taille
              return (
                <article
                key={c.id}
                data-i={i}
                data-id-pratique={c.id}
                ref={(el) => {
                  cartesRef.current[i] = el
                }}
                dir={arabeC ? 'rtl' : undefined}
                lang={arabeC ? 'ar' : undefined}
                className={cn(
                  'grain-papier poesie-page relative scroll-mt-3 overflow-hidden rounded-2xl border p-4 shadow-sm sm:p-7 [@media(orientation:landscape)_and_(max-height:540px)]:p-4!',
                  theme.fond,
                  theme.texte,
                  theme.cadre
                )}
              >
                {/* En-tête du chapitre — un souffle de mihrab */}
                <header className="mb-5 text-center [@media(orientation:landscape)_and_(max-height:540px)]:mb-2!">
                  <span
                    aria-hidden
                    className="ornement-mihrab mb-2 flex items-center justify-center gap-2 [@media(orientation:landscape)_and_(max-height:540px)]:mb-0.5!"
                    style={{ color: accent.couleur }}
                  >
                    <span className="ornement-filet" />
                    <span className="text-[0.62em]">✦</span>
                    <span className="ornement-filet" />
                  </span>
                  <h3
                    className={cn('leading-tight', arabeC ? 'font-arabic text-[30px] font-semibold leading-snug [@media(orientation:landscape)_and_(max-height:540px)]:text-[19px]!' : 'text-[22px] font-semibold [@media(orientation:landscape)_and_(max-height:540px)]:text-[15px]!')}
                    style={{ fontFamily: policeC.css, color: accent.couleur }}
                  >
                    {c.titre}
                  </h3>
                  {c.sousTitre ? (
                    <p
                      className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.22em] opacity-50"
                      dir={arabeC ? 'ltr' : undefined}
                    >
                      {c.sousTitre}
                    </p>
                  ) : null}
                  {/* La page du livre imprimé — le repère du livre papier :
                      on sait toujours où l'on en est, et les renvois
                      « ← ص ٧ » y répondent */}
                  {c.debut > 0 && (
                    <p className="mt-2.5" dir="ltr">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[10.5px] font-semibold tracking-[0.05em] [@media(orientation:landscape)_and_(max-height:540px)]:mt-1! [@media(orientation:landscape)_and_(max-height:540px)]:text-[9px]!"
                        style={{
                          borderColor: `${accent.couleur}4d`,
                          color: accent.couleur,
                          backgroundColor: `${accent.couleur}0d`,
                        }}
                      >
                        <BookOpen className="h-3 w-3 opacity-70" aria-hidden />
                        {arabeC ? (
                          <span dir="rtl" lang="ar" className="font-arabic text-[12px] tracking-normal">
                            {`ص ${chiffresArabes(c.debut)}${c.fin > c.debut ? ` – ${chiffresArabes(c.fin)}` : ''}`}
                          </span>
                        ) : (
                          <span className="tabular-nums">
                            {`p. ${c.debut}${c.fin > c.debut ? ` – ${c.fin}` : ''}`}
                          </span>
                        )}
                      </span>
                    </p>
                  )}
                  {/* La pratique n'existe pas dans la langue demandée —
                      on la lit dans l'autre, avec une mention discrète */}
                  {c.repli && (
                    <p className="mt-1 text-[10px] italic opacity-55">
                      {arabeC
                        ? 'texte arabe du kitāb — pas de transcription dans le cahier'
                        : 'transcription du cahier — pas de version arabe dans le kitāb'}
                    </p>
                  )}
                  <div
                    className="mx-auto mt-3 h-px w-24"
                    style={{ backgroundColor: accent.couleur, opacity: 0.4 }}
                    aria-hidden
                  />
                </header>

                {/* Le texte sacré — phonétique rejointe en paragraphes
                    coulant sur toute la largeur ; arabe verset à verset ;
                    qaṣīda en distiques deux colonnes pleine largeur */}
                <div
                  className={cn(
                    'text-justify',
                    arabeC ? 'kitab-texte' : 'cahier-texte'
                  )}
                  style={{
                    fontFamily: policeC.css,
                    fontSize: `${tailleC}px`,
                    lineHeight: (INTERLIGNES.find((x) => x.id === l.interligne) ?? INTERLIGNES[1]).valeur,
                  }}
                >
                  {(c.langue === 'ph' && doc.id !== 'sama'
                    ? paragrapher(c.texte)
                    : c.texte.split('\n')
                  ).map((ligne, j) =>
                    arabeC && c.poesie ? (
                      <VersPoeme
                        key={j}
                        ligne={ligne}
                        accent={accent.couleur}
                        taille={tailleC}
                        police={policeC.id}
                      />
                    ) : (
                      <LigneInvocation key={j} ligne={ligne} accent={accent.couleur} renvoi={renvoi} />
                    )
                  )}
                </div>
              </article>
              )
            })}

            {/* La fin du document — pas pendant l'ouverture du diwân */}
            {!(estSama && !samaTexte) && (
              <p className="py-2 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-brouillard">
                · fin du document ·
              </p>
            )}
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
      compteur="10 documents · phonétique & arabe"
      id="adhkar"
      defaultOpen={false}
    >
      <div className="space-y-3">
        {/* ─── La bascule de langue — tuiles de zellige, plus de pilule ─── */}
        <div className="rounded-2xl border border-border bg-card px-3 py-3.5">
          <BasculeAndalouse
            libelle="Langue de lecture"
            valeur={langue}
            choix={[
              { id: 'ph' as const, label: 'Phonétique' },
              { id: 'ar' as const, label: 'عَرَبِي', rtl: true },
            ]}
            onChange={(v) => l.regler({ langueAdhkar: v })}
          />
        </div>

        {/* ─── Les dix documents — une pièce, une porte ───
            (le cahier de samâ' a sa propre section plus bas) */}
        <div className="space-y-2">
          {DOCUMENTS_ADHKAR.filter((d) => d.id !== 'sama').map((doc, i) => {
            const titre = arabe ? doc.titreAr : doc.titreFr
            const detail = arabe ? doc.detailAr : doc.detailFr
            const nbChapitres = doc.pratiques?.length ?? (arabe ? doc.ar?.length : doc.ph?.length) ?? 0
            const estPdf = Boolean(arabe ? doc.pdfAr : doc.pdfPh)
            /* Le document n'existe pas dans la langue de lecture
               (Mulk n'est qu'en arabe) — un badge l'annonce, et le
               lecteur s'ouvrira dans la langue disponible. */
            const arabeSeul = langue === 'ph' && !doc.ph && Boolean(doc.ar)
            return (
              <motion.button
                key={doc.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.25) }}
                onClick={() => setLecteur({ doc })}
                dir={arabe ? 'rtl' : undefined}
                className={cn(
                  'carte-precieuse coins-andalous group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 hover:border-primary/30 active:scale-[0.995]',
                  arabe && 'text-right'
                )}
              >
                {/* Pastille du document — arche de mihrab */}
                <span
                  aria-hidden
                  className="pastille-arche grid h-9 w-8 shrink-0 place-items-center border border-border bg-feuille text-[13px] font-medium text-primary transition-colors duration-200 group-hover:bg-lin-clair"
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
                  {(detail || nbChapitres > 1 || arabeSeul) && (
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-brouillard">
                    {detail && (
                    <span className="min-w-0 flex-1 truncate">
                      {estPdf ? (
                        <span className="inline-flex items-center gap-1">
                          <FileDown className="h-3 w-3" aria-hidden /> {detail}
                        </span>
                      ) : (
                        detail
                      )}
                    </span>
                    )}
                    {nbChapitres > 1 && (
                      <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider text-brouillard">
                        {nbChapitres} {doc.pratiques ? 'pratiques' : 'morceaux'}
                      </span>
                    )}
                    {arabeSeul && (
                      <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 font-arabic text-[11px] leading-none text-brouillard">
                        عربي
                      </span>
                    )}
                  </span>
                  )}
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
            /* Pas de « langue » dans la clé : le lecteur ne se remonte
               pas à la bascule phonétique ⇄ عربي — le nombre d'entrées
               ne change pas (pratiques unifiées), la pratique lue et
               la position de lecture restent exactement en place. */
            key={`${lecteur.doc.id}-${lecteur.chapitre ?? 'tête'}`}
            doc={lecteur.doc}
            /* Surat al-Mulk n'existe qu'en arabe (pas de phonétique
               dans le cahier) : son lecteur s'ouvre dans la langue
               disponible plutôt qu'en page vide. */
            langue={
              langue === 'ph' && !lecteur.doc.ph && lecteur.doc.ar
                ? 'ar'
                : langue === 'ar' && !lecteur.doc.ar && lecteur.doc.ph
                  ? 'ph'
                  : langue
            }
            chapitreInitial={lecteur.chapitre}
            onFermer={() => setLecteur(null)}
          />
        )}
      </AnimatePresence>
    </SectionShell>
  )
}

/* ═══ LA SECTION SAMÂ' — le cahier de samâ', et rien d'autre ══════════
   Le diwân complet de la hadra : 398 chants réécrits en phonétique
   (le texte coule, la police se règle), ou le livre numérisé page à
   page. Une seule porte, celle du cahier. */
export function SamaSection() {
  const l = useLecture()
  const langue = l.langueAdhkar
  const arabe = langue === 'ar'

  const [lecteur, setLecteur] = useState<DocAdhkar | null>(null)
  const doc = useMemo(() => DOCUMENTS_ADHKAR.find((d) => d.id === 'sama'), [])

  return (
    <SectionShell
      titre="Samâ'"
      compteur="le cahier · 398 chants"
      id="sama"
      defaultOpen={false}
    >
      <motion.button
        type="button"
        onClick={() => doc && setLecteur(doc)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        whileTap={{ scale: 0.985 }}
        className={cn(
          'carte-precieuse coins-andalous group relative flex w-full flex-col items-center overflow-hidden px-6 py-9 text-center transition-all duration-200 hover:border-primary/30 hover:shadow-md',
          arabe && 'text-right'
        )}
      >
        {/* Filigrane khātim — zellige en réserve */}
        <span aria-hidden className="filigrane-khatim pointer-events-none absolute inset-0" />

        {/* La pastille — un mihrab pour la musique */}
        <span
          aria-hidden
          className="pastille-arche relative grid h-12 w-11 place-items-center border border-gold/40 bg-or-pale text-gold-vif transition-transform duration-300 group-hover:scale-105"
        >
          <Music className="h-5 w-5" />
        </span>

        <span
          className={cn(
            'relative mt-3.5 font-display text-[21px] font-semibold text-encre',
            arabe && 'font-arabic text-[22px]'
          )}
          dir={arabe ? 'rtl' : undefined}
        >
          {arabe ? 'ديوان السماع' : "Cahier de Samâ'"}
        </span>
        <span
          className="relative mt-1 font-arabic text-[16px] text-primary/80"
          dir="rtl"
          lang="ar"
        >
          {arabe ? 'كتاب السماع' : 'دِيوَانُ السَّمَاع'}
        </span>
        <p className="relative mt-3 max-w-[42ch] text-[12px] leading-relaxed text-brouillard">
          {arabe
            ? '٢٢٢ صفحة من كتاب السماع، صفحة بصفحة'
            : 'Le diwân complet réécrit — 398 chants en phonétique — et le livre numérisé en arabe.'}
        </p>

        <span className="btn-precieux relative mt-5 px-7 py-2.5 text-[11.5px] font-bold uppercase tracking-[0.16em]">
          {arabe ? 'افتح الكتاب' : 'Ouvrir le cahier'}
        </span>
      </motion.button>

      {/* ─── Le lecteur plein écran ─── */}
      <AnimatePresence>
        {lecteur && (
          <LecteurAdhkar
            key="sama"
            doc={lecteur}
            langue={langue}
            onFermer={() => setLecteur(null)}
          />
        )}
      </AnimatePresence>
    </SectionShell>
  )
}

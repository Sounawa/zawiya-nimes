'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  Loader2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════════════════
   LECTEUR PDF — pdf.js rendu sur canvas.

   Pourquoi : le lecteur PDF natif de Chrome est bloqué dans les
   iframes imbriquées (panneau d'aperçu, PWA…) — « bloqué par
   Chrome ». Rendre nous-mêmes les pages sur <canvas> fonctionne
   partout, et nous donne les commandes : page, zoom, fluidité.

   Défilement continu, chaque page n'est rendue qu'à l'approche
   (IntersectionObserver) et libérée quand elle s'éloigne — un
   cahier de 135 pages ou un muṣḥaf de 240 se feuillète sans
   charger la mémoire.

   LE PAPIER DE LA MAISON : les pages numérisées arrivent avec
   leur papier propre — crème, beige, parfois marron selon le
   scan. À chaque page rendue, le lecteur mesure ce ton et le
   ramène EXACTEMENT au fond de l'application : porcelaine le
   jour, nuit la nuit, l'encre suivant la même gamme. Une seule
   teinte de papier partout, celle du site.
   ═══════════════════════════════════════════════════════════════════ */

/* ─── La gamme chromatique du site, lue dans le thème courant ─── */
interface Gamme {
  fond: [number, number, number]
  encre: [number, number, number]
}

function hexa(s: string, defaut: [number, number, number]): [number, number, number] {
  const v = s.trim().replace('#', '')
  if (/^[0-9a-f]{6}$/i.test(v)) {
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
  }
  return defaut
}

function lireGamme(): Gamme {
  const cs = getComputedStyle(document.documentElement)
  return {
    fond: hexa(cs.getPropertyValue('--background'), [246, 244, 239]),
    encre: hexa(cs.getPropertyValue('--encre'), [32, 41, 35]),
  }
}

/* ─── Recolorer une page rendue : papier du scan → papier du site.

   Modèle : un scan est une encre posée sur un papier. Pour chaque
   canal on estime la « réflectance » (valeur ÷ papier mesuré), puis
   on la rejoue entre l'encre du site et le fond du site :

   out = encre + (fond − encre) × réflectance^γ

   · le papier (réflectance 1) devient le fond exact de l'app —
     porcelaine le jour, nuit la nuit ;
   · l'encre des scans garde sa profondeur (γ = 1,25 la affermit
     sur la porcelaine et l'éclaircit sur la nuit) ;
   · les enluminures gardent leur teinte : chaque canal glisse
     indépendamment dans la gamme de la maison.

   Le ton du papier est mesuré par page — le pic dominant des
   hautes lumières, échantillonné — car il varie d'un cahier à
   l'autre, et parfois d'une page à l'autre. Une page sans papier
   clair lisible (couverture sombre…) reste intacte. */
function assortirAuFond(toile: HTMLCanvasElement, g: Gamme) {
  const w = toile.width
  const h = toile.height
  if (!w || !h) return
  const ctx = toile.getContext('2d', { willReadFrequently: true })
  if (!ctx) return
  const image = ctx.getImageData(0, 0, w, h)
  const d = image.data

  /* 1. Le pic des hautes lumières — le papier, échantillonné */
  const pas = Math.max(1, Math.round(Math.sqrt((w * h) / 42000)))
  const hist = new Uint32Array(256)
  let echantillons = 0
  for (let y = 0; y < h; y += pas) {
    for (let x = 0; x < w; x += pas) {
      const o = (y * w + x) * 4
      hist[(0.2126 * d[o] + 0.7152 * d[o + 1] + 0.0722 * d[o + 2]) | 0]++
      echantillons++
    }
  }
  let pic = -1
  let masse = 0
  for (let l = 252; l >= 90; l--) {
    if (hist[l] > masse) {
      masse = hist[l]
      pic = l
    }
  }
  /* trop peu de papier clair : page laissée telle quelle */
  if (pic < 90 || masse < echantillons * 0.08) return

  /* La nuance exacte du papier : moyenne RGB autour du pic */
  let sr = 0
  let sg = 0
  let sb = 0
  let n = 0
  for (let y = 0; y < h; y += pas) {
    for (let x = 0; x < w; x += pas) {
      const o = (y * w + x) * 4
      const l = (0.2126 * d[o] + 0.7152 * d[o + 1] + 0.0722 * d[o + 2]) | 0
      if (Math.abs(l - pic) <= 2) {
        sr += d[o]
        sg += d[o + 1]
        sb += d[o + 2]
        n++
      }
    }
  }
  if (n === 0) return
  const papier: [number, number, number] = [sr / n, sg / n, sb / n]

  /* 2. Trois tables de correspondance — le scan glisse dans la
     gamme du site, canal par canal */
  const tables = ([0, 1, 2] as const).map((c) => {
    const t = new Uint8ClampedArray(256)
    const p = Math.max(4, papier[c])
    for (let v = 0; v < 256; v++) {
      const refl = Math.min(1, v / p) ** 1.25
      t[v] = g.encre[c] + (g.fond[c] - g.encre[c]) * refl
    }
    return t
  })
  const [tr, tg, tb] = tables
  for (let o = 0; o < d.length; o += 4) {
    d[o] = tr[d[o]]
    d[o + 1] = tg[d[o + 1]]
    d[o + 2] = tb[d[o + 2]]
  }
  ctx.putImageData(image, 0, 0)
}

type ModulePdfjs = typeof import('pdfjs-dist')

let modulePdfjs: ModulePdfjs | null = null
async function chargerPdfjs(): Promise<ModulePdfjs> {
  if (!modulePdfjs) {
    const m = await import('pdfjs-dist')
    m.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    modulePdfjs = m
  }
  return modulePdfjs
}

interface PagePdf {
  /* Dimensions en unités PDF (point 1:1) — pour l'aspect */
  l: number
  h: number
}

const ZOOMS = [1, 1.3, 1.7, 2.2] as const

export function LecteurPdf({
  src,
  titre,
  onFermer,
}: {
  src: string
  titre: string
  onFermer: () => void
}) {
  const conteneurRef = useRef<HTMLDivElement>(null)
  const docRef = useRef<Awaited<ReturnType<ModulePdfjs['getDocument']>['promise']> | null>(null)
  const tacheRef = useRef<ReturnType<ModulePdfjs['getDocument']> | null>(null)
  const gabaritsRef = useRef<(HTMLDivElement | null)[]>([])
  const toilesRef = useRef<(HTMLCanvasElement | null)[]>([])
  const rendusRef = useRef<Set<number>>(new Set())
  const largeurRef = useRef(0)
  const zoomRef = useRef(1)
  const enFileRef = useRef<Set<number>>(new Set())

  const [pret, setPret] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [nbPages, setNbPages] = useState(0)
  const [aspect, setAspect] = useState(1 / 1.414)
  const [pageActive, setPageActive] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [renduFini, setRenduFini] = useState(false)

  /* La gamme du site (fond + encre), suivie en direct : le jour
     porcelaine et encre verte, la nuit fond nuit et encre claire.
     Les pages déjà rendues se ré-encrent quand le thème bascule. */
  const [gamme, setGamme] = useState<Gamme>(() => lireGamme())
  const gammeRef = useRef(gamme)
  gammeRef.current = gamme
  useEffect(() => {
    const obs = new MutationObserver(() => setGamme(lireGamme()))
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme'],
    })
    return () => obs.disconnect()
  }, [])

  zoomRef.current = zoom

  /* ─── Rendre une page sur sa toile ─── */
  const rendre = useCallback(async (num: number) => {
    const doc = docRef.current
    if (!doc || rendusRef.current.has(num) || enFileRef.current.has(num)) return
    enFileRef.current.add(num)
    try {
      const page = await doc.getPage(num)
      const base = page.getViewport({ scale: 1 })
      /* La largeur d'affichage réelle du gabarit (cap 900 px, zoom
         compris) — l'échelle suit la page affichée, jamais le conteneur */
      const gabarit = gabaritsRef.current[num - 1]
      const affichage = gabarit ? gabarit.clientWidth : largeurRef.current
      if (affichage < 10) {
        rendusRef.current.delete(num)
        return
      }
      const echelle = affichage / base.width
      const viewport = page.getViewport({ scale: echelle })
      const toile = toilesRef.current[num - 1]
      if (!toile) {
        rendusRef.current.delete(num)
        return
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      toile.width = Math.floor(viewport.width * dpr)
      toile.height = Math.floor(viewport.height * dpr)
      /* Contexte créé avant pdf.js, en lecture fréquente : la
         mesure du papier puis le ré-encrage s'y font sans heurt */
      toile.getContext('2d', { willReadFrequently: true })
      const tache = page.render({
        canvas: toile,
        viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
      })
      try {
        await tache.promise
        /* Le papier du scan devient le papier de la maison */
        assortirAuFond(toile, gammeRef.current)
        rendusRef.current.add(num)
        setRenduFini(true)
      } catch {
        /* rendu annulé (page sortie de vue, zoom changé) — réessayable */
      }
    } catch {
      /* page introuvable pour l'instant : réessayable */
    } finally {
      enFileRef.current.delete(num)
    }
  }, [])

  /* ─── Libérer une toile lointaine ─── */
  const liberer = useCallback((num: number) => {
    const toile = toilesRef.current[num - 1]
    if (toile && rendusRef.current.has(num)) {
      toile.width = 0
      toile.height = 0
      rendusRef.current.delete(num)
    }
  }, [])

  /* ─── Charger le document ─── */
  useEffect(() => {
    let annule = false
    setPret(false)
    setErreur(null)
    setNbPages(0)
    setPageActive(1)
    rendusRef.current.clear()
    ;(async () => {
      try {
        const pdfjs = await chargerPdfjs()
        const tache = pdfjs.getDocument({
          url: src,
          cMapUrl: '/pdfjs-cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/pdfjs-standard-fonts/',
        })
        tacheRef.current = tache
        const doc = await tache.promise
        if (annule) {
          tache.destroy()
          return
        }
        docRef.current = doc
        setNbPages(doc.numPages)
        /* L'aspect de la première page sert de gabarit aux autres */
        const p1 = await doc.getPage(1)
        const v1 = p1.getViewport({ scale: 1 })
        if (!annule) {
          setAspect(v1.width / v1.height)
          setPret(true)
        }
      } catch {
        if (!annule) setErreur('Le document n’a pas pu être ouvert.')
      }
    })()
    return () => {
      annule = true
      docRef.current = null
      tacheRef.current?.destroy().catch(() => undefined)
      tacheRef.current = null
    }
  }, [src])

  /* ─── Observer l'approche des pages (chargement paresseux) ─── */
  useEffect(() => {
    if (!pret || !nbPages) return
    const conteneur = conteneurRef.current
    if (!conteneur) return

    const io = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          const num = Number((e.target as HTMLElement).dataset.page)
          if (e.isIntersecting) rendre(num)
          /* les pages très éloignées rendent leurs toile */
          else if (
            !e.isIntersecting &&
            Math.abs(num - pageActive) > 3
          )
            liberer(num)
        }
      },
      { root: conteneur, rootMargin: '120% 0px' }
    )
    for (const g of gabaritsRef.current) {
      if (g) io.observe(g)
    }
    const ioActif = io
    return () => ioActif.disconnect()
  }, [pret, nbPages, rendre, liberer, pageActive, zoom])

  /* ─── Largeur du conteneur (ajustement à la largeur) ─── */
  useEffect(() => {
    const conteneur = conteneurRef.current
    if (!conteneur) return
    const ro = new ResizeObserver(() => {
      const l = conteneur.clientWidth
      if (l > 0 && Math.abs(l - largeurRef.current) > 2) {
        largeurRef.current = l
        rendusRef.current.clear()
        for (let i = 1; i <= nbPages; i++) {
          enFileRef.current.delete(i)
          liberer(i)
        }
        /* re-rendre les pages visibles */
        for (const g of gabaritsRef.current) {
          if (!g) continue
          const r = g.getBoundingClientRect()
          const c = conteneur.getBoundingClientRect()
          if (r.bottom > c.top - c.height && r.top < c.bottom + c.height) {
            rendre(Number(g.dataset.page))
          }
        }
      } else if (l > 0) {
        largeurRef.current = l
      }
    })
    ro.observe(conteneur)
    return () => ro.disconnect()
  }, [nbPages, rendre, liberer])

  /* ─── Zoom ou thème changé : tout re-rendre à la nouvelle gamme ─── */
  useEffect(() => {
    if (!pret) return
    rendusRef.current.clear()
    for (let i = 1; i <= nbPages; i++) {
      enFileRef.current.delete(i)
      liberer(i)
    }
    for (const g of gabaritsRef.current) {
      if (!g) continue
      const r = g.getBoundingClientRect()
      const c = conteneurRef.current?.getBoundingClientRect()
      if (c && r.bottom > c.top - c.height && r.top < c.bottom + c.height) {
        rendre(Number(g.dataset.page))
      }
    }
  }, [zoom, gamme, pret, nbPages, rendre, liberer])

  /* ─── Suivre la page active au défilement ─── */
  useEffect(() => {
    const conteneur = conteneurRef.current
    if (!conteneur || !nbPages) return
    let cadre = 0
    const surDefile = () => {
      cancelAnimationFrame(cadre)
      cadre = requestAnimationFrame(() => {
        const c = conteneur.getBoundingClientRect()
        const centre = c.top + c.height / 2
        let actif = 1
        let meilleur = Infinity
        for (const g of gabaritsRef.current) {
          if (!g) continue
          const r = g.getBoundingClientRect()
          const d = Math.abs((r.top + r.bottom) / 2 - centre)
          if (d < meilleur) {
            meilleur = d
            actif = Number(g.dataset.page)
          }
        }
        setPageActive(actif)
        /* Pendant un défilement programmatique (‹ ›), ne pas laisser
           le suivi écraser la destination — la grâce est d'une seconde */
        if (performance.now() - derniereNavRef.current > 1000) {
          demandeeRef.current = actif
        }
      })
    }
    conteneur.addEventListener('scroll', surDefile, { passive: true })
    return () => {
      conteneur.removeEventListener('scroll', surDefile)
      cancelAnimationFrame(cadre)
    }
  }, [nbPages, pret])

  /* ─── Navigation : aller à une page ───
     Défilement animé MAISON, retargetable : Chrome ignore les
     scrollIntoView smooth appelés pendant un défilement en cours —
     des clics rapides sur ‹ › se perdaient. Ici, chaque clic met à
     jour la cible de l'animation en cours : on glisse toujours
     vers la dernière page demandée. */
  const demandeeRef = useRef(1)
  const derniereNavRef = useRef(0)
  const animRef = useRef<number | null>(null)
  const cibleScrollRef = useRef<number | null>(null)

  const stopperAnimation = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
      cibleScrollRef.current = null
    }
  }, [])

  const animerVers = useCallback((cible: number) => {
    const conteneur = conteneurRef.current
    if (!conteneur) return
    cibleScrollRef.current = cible
    if (animRef.current !== null) return /* l'animation en cours se retarget */
    const pas = () => {
      const c = conteneurRef.current
      if (!c || cibleScrollRef.current === null) {
        animRef.current = null
        return
      }
      const t = cibleScrollRef.current
      const reste = t - c.scrollTop
      if (Math.abs(reste) < 1.2) {
        c.scrollTop = t
        animRef.current = null
        cibleScrollRef.current = null
        return
      }
      /* approche douce, ~350 ms de glissement */
      c.scrollTop = c.scrollTop + reste * 0.22
      animRef.current = requestAnimationFrame(pas)
    }
    animRef.current = requestAnimationFrame(pas)
  }, [])

  const allerA = useCallback((num: number) => {
    const conteneur = conteneurRef.current
    const cible = Math.min(Math.max(1, num), nbPages || 1)
    const g = gabaritsRef.current[cible - 1]
    if (!g || !conteneur) return
    demandeeRef.current = cible
    derniereNavRef.current = performance.now()
    const delta = g.getBoundingClientRect().top - conteneur.getBoundingClientRect().top
    conteneur.scrollLeft = 0
    animerVers(Math.max(0, conteneur.scrollTop + delta))
    setPageActive(cible)
  }, [nbPages, animerVers])

  /* L'utilisateur reprend la main : son défilement gagne */
  useEffect(() => {
    const conteneur = conteneurRef.current
    if (!conteneur) return
    const prendre = () => {
      if (cibleScrollRef.current !== null && Math.abs(conteneur.scrollTop - cibleScrollRef.current) > 3) {
        stopperAnimation()
      }
    }
    conteneur.addEventListener('wheel', prendre, { passive: true })
    conteneur.addEventListener('touchmove', prendre, { passive: true })
    return () => {
      conteneur.removeEventListener('wheel', prendre)
      conteneur.removeEventListener('touchmove', prendre)
    }
  }, [stopperAnimation])

  /* Nettoyage de l'animation au démontage */
  useEffect(() => () => stopperAnimation(), [stopperAnimation])

  /* Page suivante / précédente — depuis la dernière demande */
  const pageSuivante = useCallback(() => allerA(demandeeRef.current + 1), [allerA])
  const pagePrecedente = useCallback(() => allerA(demandeeRef.current - 1), [allerA])

  const page = (n: number) => (
    <div
      key={n}
      data-page={n}
      ref={(el) => {
        gabaritsRef.current[n - 1] = el
      }}
      className="relative w-full shrink-0"
      style={{ maxWidth: zoom > 1 ? 'none' : 'min(100%, 900px)' }}
      role="document"
      aria-label={`Page ${n} sur ${nbPages || '…'}`}
    >
      <div
        className="relative w-full overflow-hidden rounded-lg border border-border shadow-sm"
        style={{ aspectRatio: String(aspect) }}
      >
        {/* La toile — le papier recoloré au fond du site */}
        <canvas
          ref={(el) => {
            toilesRef.current[n - 1] = el
          }}
          className="absolute inset-0 h-full w-full"
          style={{ imageRendering: 'auto' }}
        />
        {/* Squelette tant que la page n'est pas rendue */}
        <div
          data-squelette={n}
          className="pointer-events-none absolute inset-0 grid place-items-center bg-muted/70"
        >
          <Loader2 className="h-6 w-6 animate-spin text-brouillard/50" aria-hidden />
        </div>
      </div>
      <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium tabular-nums tracking-[0.2em] text-brouillard/70">
        {n}
      </span>
    </div>
  )

  /* ─── Masque les squelettes des pages rendues ─── */
  useEffect(() => {
    const masquer = () => {
      for (let n = 1; n <= nbPages; n++) {
        const squelette = gabaritsRef.current[n - 1]?.querySelector('[data-squelette]')
        if (squelette) (squelette as HTMLElement).style.opacity = rendusRef.current.has(n) ? '0' : '1'
      }
    }
    const minuteur = setInterval(masquer, 400)
    return () => clearInterval(minuteur)
  }, [nbPages])

  /* ─── Erreur : ouvrir en grand reste possible ─── */
  if (erreur) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="max-w-sm text-sm text-brouillard">{erreur}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onFermer}
            className="rounded-full border border-border px-4 py-2 text-[12.5px] font-medium text-brouillard transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <ChevronLeft className="mr-1 inline h-4 w-4" /> revenir
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[12.5px] font-medium text-primary-foreground transition-[filter] hover:brightness-110"
          >
            <FileDown className="h-4 w-4" /> Ouvrir en grand
          </a>
        </div>
      </div>
    )
  }

  return (
    /* Le fond du lecteur EST le fond du site — porcelaine le jour,
       nuit la nuit ; les pages, recolorées, s'y posent sans couture */
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      {/* Le corps : les pages en défilement continu */}
      <div
        ref={conteneurRef}
        className="defile-fin min-h-0 flex-1 overflow-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
        aria-label={titre}
      >
        <div
          className="flex flex-col items-center gap-7"
          style={{
            width: `${zoom * 100}%`,
            minWidth: '100%',
            paddingTop: 16,
            paddingLeft: 'max(10px, env(safe-area-inset-left))',
            paddingRight: 'max(10px, env(safe-area-inset-right))',
            paddingBottom: 'calc(96px + env(safe-area-inset-bottom))',
          }}
        >
          {!pret || !nbPages ? (
            /* Le temps d'ouvrir le livre */
            <div className="w-full" style={{ maxWidth: 'min(100%, 900px)' }}>
              <div
                className="relative w-full overflow-hidden rounded-lg border border-border bg-muted/70 shadow-sm"
                style={{ aspectRatio: String(aspect) }}
              >
                <div className="absolute inset-0 grid place-items-center">
                  <Loader2 className="h-7 w-7 animate-spin text-brouillard/50" aria-hidden />
                </div>
              </div>
            </div>
          ) : (
            Array.from({ length: nbPages }, (_, i) => page(i + 1))
          )}
        </div>
      </div>

      {/* La barre flottante : revenir · page · zoom · ouvrir en grand */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
        style={{ paddingBottom: 'calc(14px + env(safe-area-inset-bottom))' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-border bg-card/92 p-1.5 shadow-lg backdrop-blur"
        >
          <button
            type="button"
            onClick={onFermer}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-medium text-brouillard transition-colors duration-200 hover:bg-muted/60 hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden min-[420px]:inline">revenir</span>
          </button>

          <span className="h-5 w-px bg-border" aria-hidden />

          {/* Pages : ‹ 12 / 135 › */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={pagePrecedente}
              disabled={pageActive <= 1}
              aria-label="Page précédente"
              className="grid h-8 w-8 place-items-center rounded-full text-brouillard transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[4.5rem] text-center text-[12px] font-medium tabular-nums text-encre">
              {pageActive} / {nbPages || '…'}
            </span>
            <button
              type="button"
              onClick={pageSuivante}
              disabled={!nbPages || pageActive >= nbPages}
              aria-label="Page suivante"
              className="grid h-8 w-8 place-items-center rounded-full text-brouillard transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <span className="h-5 w-px bg-border" aria-hidden />

          {/* Zoom */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => ZOOMS[Math.max(0, ZOOMS.indexOf(z as (typeof ZOOMS)[number]) - 1)])}
              aria-label="Réduire"
              className="grid h-8 w-8 place-items-center rounded-full text-brouillard transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(z as (typeof ZOOMS)[number]) + 1)])}
              aria-label="Agrandir"
              className="grid h-8 w-8 place-items-center rounded-full text-brouillard transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <span className="hidden h-5 w-px bg-border min-[420px]:block" aria-hidden />

          {/* Le PDF original dans un onglet — repli toujours possible */}
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-medium text-primary transition-colors duration-200 hover:bg-primary/10 min-[420px]:flex"
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Ouvrir en grand</span>
          </a>
        </motion.div>
      </div>

      {/* Indicateur d'ouverture du livre */}
      {(!pret || !renduFini) && (
        <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-border bg-card/90 px-3.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.22em] text-brouillard shadow-sm backdrop-blur">
          ouverture du document…
        </div>
      )}
    </div>
  )
}

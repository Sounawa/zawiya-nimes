'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, X } from 'lucide-react'
import { SectionShell } from './ijtima-section'
import { SectionContenu } from './content-sections'
import { LecteurPdf } from './lecteur-pdf'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════════════════
   QUR'ÂN — le Coran en riwāyat Warsh 'an Nâfi' al-Madanī, comme sur
   le site de la zawiya : quatre volumes d'ahzâb, servis tels quels
   (la mise en page exacte du muṣḥaf), puis les lectures et hizbs
   ajoutés par les frères.
   ═══════════════════════════════════════════════════════════════════ */

const VOLUMES: { id: string; titreAr: string; titreFr: string; detail: string; pdf: string }[] = [
  {
    id: 'warsh-1',
    titreAr: 'الأحزاب ١–١٥',
    titreFr: 'Coran · Warsh',
    detail: 'du Fâtiha aux premiers ahzâb de Sûrat al-Ahzâb',
    pdf: '/quran/coran-warsh-hizb-1-15.pdf',
  },
  {
    id: 'warsh-2',
    titreAr: 'الأحزاب ١٦–٣٠',
    titreFr: 'Coran · Warsh',
    detail: 'de Yâ-Sîn aux derniers ahzâb — le juzʾ du cahier',
    pdf: '/quran/coran-warsh-hizb-16-30.pdf',
  },
  {
    id: 'warsh-3',
    titreAr: 'الأحزاب ٣١–٤٥',
    titreFr: 'Coran · Warsh',
    detail: 'de Sûrat al-Aḥqâf à la fin de la Fâtiha des ahzâb',
    pdf: '/quran/coran-warsh-hizb-31-45.pdf',
  },
  {
    id: 'warsh-4',
    titreAr: 'الأحزاب ٤٦–٦٠',
    titreFr: 'Coran · Warsh',
    detail: "de Sûrat al-Aḥqâf à an-Nās — l'achèvement",
    pdf: '/quran/coran-warsh-hizb-46-60.pdf',
  },
]

/* ─── Le lecteur du muṣḥaf — le PDF servi tel quel ─── */
function LecteurCoran({
  volume,
  onFermer,
}: {
  volume: (typeof VOLUMES)[number]
  onFermer: () => void
}) {
  /* L'écran reste allumé pendant la récitation — relâché après un
     quart d'heure sans le moindre geste. Tout échec est muet. */
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

  /* Le corps de la page ne défile pas derrière le lecteur */
  useEffect(() => {
    const deplacement = window.scrollY
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      window.scrollTo(0, deplacement)
    }
  }, [])

  /* Échap ferme */
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [onFermer])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[90] flex flex-col bg-background grain-papier"
      role="dialog"
      aria-modal="true"
      aria-label={`Lecteur — ${volume.titreAr}`}
    >
      <header className="flex-none border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90">
        <div
          className="flex items-center gap-1 px-2.5"
          style={{ paddingTop: 'calc(10px + env(safe-area-inset-top))', paddingBottom: 10 }}
        >
          <span className="grid h-9 w-9 place-items-center rounded-full border border-border bg-feuille text-primary" aria-hidden>
            <BookOpen className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1 px-2" dir="rtl">
            <h2 className="truncate text-center font-arabic text-[19px] font-medium text-encre" title={volume.titreAr}>
              القراٰن الكريم · {volume.titreAr}
            </h2>
            <p className="text-center text-[9.5px] font-medium uppercase tracking-[0.3em] text-brouillard" dir="ltr">
              riwāyat Warsh ʿan Nāfiʿ
            </p>
          </div>
          <button
            type="button"
            onClick={onFermer}
            aria-label="Fermer le lecteur"
            className="grid h-9 w-9 place-items-center rounded-full border border-border text-brouillard transition-colors duration-200 hover:bg-muted/60 hover:text-foreground active:bg-muted"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      </header>

      {/* Le muṣḥaf, rendu page à page sur canvas — le lecteur natif de
          Chrome est bloqué dans les iframes imbriquées, pdf.js dessine
          lui-même les pages : même muṣḥaf, partout */}
      <LecteurPdf src={volume.pdf} titre={`Coran Warsh — ${volume.titreAr}`} onFermer={onFermer} />
    </motion.div>
  )
}

/* ─── La section QUR'ÂN : les quatre volumes + les contenus des frères ─── */
export function QuranSection() {
  const [volumeOuvert, setVolumeOuvert] = useState<(typeof VOLUMES)[number] | null>(null)

  return (
    <>
      <SectionShell titre="Qur'ân" id="quran" compteur="4 volumes">
        {/* Les quatre volumes du muṣḥaf Warsh — comme sur le site de la zawiya */}
        <div className="mb-5">
          <p className="mb-2.5 text-center text-[10px] font-medium uppercase tracking-[0.3em] text-brouillard">
            القرآن الكريم · riwāyat Warsh ʿan Nāfiʿ
          </p>
          <div className="space-y-2" role="list">
            {VOLUMES.map((v, i) => (
              <motion.button
                key={v.id}
                type="button"
                role="listitem"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.2) }}
                onClick={() => setVolumeOuvert(v)}
                dir="rtl"
                className="carte-precieuse group flex w-full items-center gap-3 px-4 py-3.5 text-right transition-all duration-200 hover:border-primary/30 active:scale-[0.995]"
              >
                <span
                  aria-hidden
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-feuille font-display text-[15px] font-medium text-primary transition-colors duration-200 group-hover:bg-lin-clair"
                >
                  {['١', '٢', '٣', '٤'][i]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-arabic text-[18px] font-semibold text-encre">
                    الأحزاب {v.titreAr.replace('الأحزاب ', '')}
                  </span>
                  <span className="mt-0.5 block truncate text-right text-[11.5px] text-brouillard" dir="ltr">
                    {v.detail}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="shrink-0 rotate-180 text-[17px] leading-none text-brouillard transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:text-primary"
                >
                  ›
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Les lectures et hizbs ajoutés par les frères */}
        <SectionContenu titre="" id="quran-contenus" section="QURAN" libelle="lectures du Qur'ân" sansCoquille />
      </SectionShell>

      <AnimatePresence>
        {volumeOuvert && (
          <LecteurCoran key={volumeOuvert.id} volume={volumeOuvert} onFermer={() => setVolumeOuvert(null)} />
        )}
      </AnimatePresence>
    </>
  )
}

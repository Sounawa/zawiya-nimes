'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useUser } from '@/lib/store'
import { ThemeToggle } from '@/components/zaouia/theme-toggle'
import { VILLE_LABEL, type Ville } from '@/lib/types'

/** PRNG arithmétique pur (mulberry32) — strictement identique serveur/client,
 *  contrairement à Math.sin dont la précision varie selon le moteur JS. */
function mulberry32(graine: number) {
  return () => {
    graine |= 0
    graine = (graine + 0x6d2b79f5) | 0
    let t = Math.imul(graine ^ (graine >>> 15), 1 | graine)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Particules de lumière dorée qui montent autour du logo */
function Particules() {
  const particules = Array.from({ length: 14 }, (_, i) => {
    const rnd = mulberry32(42 + i * 7)
    return {
      id: i,
      left: 8 + rnd() * 84,
      size: 4 + rnd() * 7,
      delay: rnd() * 4,
      duree: 3.2 + rnd() * 2.6,
    }
  })
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {particules.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            bottom: '12%',
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duree}s`,
          }}
        />
      ))}
    </div>
  )
}

/** Étoiles scintillantes dans le ciel de la page d'accueil */
function Etoiles() {
  const etoiles = Array.from({ length: 18 }, (_, i) => {
    const rnd = mulberry32(7 + i * 13)
    return {
      id: i,
      top: 4 + rnd() * 88,
      left: 3 + rnd() * 94,
      size: 1.5 + rnd() * 2.5,
      delay: rnd() * 5,
      duree: 2.4 + rnd() * 3.2,
    }
  })
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {etoiles.map((e) => (
        <span
          key={e.id}
          className="etoile"
          style={{
            top: `${e.top}%`,
            left: `${e.left}%`,
            width: e.size,
            height: e.size,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.duree}s`,
          }}
        />
      ))}
    </div>
  )
}

/** Rayons de lumière dorés qui tournent lentement derrière la calligraphie.
 *  Cercle parfait — remplis le parent centré, l'ellipse est évitée
 *  (un ovale en rotation donnerait un balancement disgracieux). */
function RayonsLumiere() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none h-full w-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      style={{
        background:
          'conic-gradient(from 0deg, transparent 0deg, rgba(201,162,75,0.10) 12deg, transparent 24deg, transparent 60deg, rgba(201,162,75,0.07) 72deg, transparent 84deg, transparent 150deg, rgba(11,93,66,0.08) 162deg, transparent 174deg, transparent 240deg, rgba(201,162,75,0.09) 252deg, transparent 264deg, transparent 320deg, rgba(11,93,66,0.06) 332deg, transparent 344deg)',
        borderRadius: '9999px',
        WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 72%)',
        maskImage: 'radial-gradient(circle, black 30%, transparent 72%)',
      }}
    />
  )
}

/** Le titre « ZAWIYA » révélé lettre par lettre avec un reflet doré */
function TitreLettres() {
  const lettres = 'ZAWIYA'.split('')
  return (
    <span className="block font-display text-5xl font-semibold tracking-[0.18em] text-encre sm:text-6xl" aria-label="Zawiya">
      {lettres.map((l, i) => (
        <motion.span
          key={i}
          className="text-shimmer inline-block"
          initial={{ opacity: 0, y: 26, rotateX: -70, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }}
          transition={{ delay: 0.55 + i * 0.09, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        >
          {l}
        </motion.span>
      ))}
    </span>
  )
}

/* ─── L'état d'un prénom à la porte ───
   VERIFIE  : on ne sait pas encore (prénom trop court ou en vérification)
   INCONNU  : personne ne porte ce prénom dans cette zawiya
   SANS_CODE: connu sans code — le premier passage le pose
   PRET     : connu avec code — il faut le taper
   ATTENTE  : inscription faite, validation du référent en cours
   BLOQUE   : accès révoqué par le référent */
type EtatPorte = 'VERIFIE' | 'INCONNU' | 'SANS_CODE' | 'PRET' | 'ATTENTE' | 'BLOQUE'

const ZAWIYAS: { id: Ville; label: string; sub: string }[] = [
  { id: 'NIMES', label: 'Nîmes', sub: 'la maison-mère' },
  { id: 'AVIGNON', label: 'Avignon', sub: 'le groupe frère' },
  { id: 'MONTPELLIER', label: 'Montpellier', sub: 'le groupe frère' },
]

export function WelcomeGate() {
  const setName = useUser((s) => s.setName)
  const setVille = useUser((s) => s.setVille)
  const setMember = useUser((s) => s.setMember)
  const qc = useQueryClient()

  const [value, setValue] = useState('')
  /* La zawiya persistée de l'appareil, lue sans écart d'hydratation :
     le serveur ne rend que Nîmes (son seul instantané), la vraie zawiya
     arrive à l'hydratation ; le choix d'une tuile prend la main dès le
     premier clic et prime sur ce qui est persisté. */
  const [villeChoisie, setVilleChoisie] = useState<Ville | null>(null)
  const villeDAppareil = useSyncExternalStore(
    useUser.subscribe,
    () => useUser.getState().ville,
    () => 'NIMES' as Ville
  )
  const ville = villeChoisie ?? villeDAppareil
  const [code, setCode] = useState('')
  const [etat, setEtat] = useState<EtatPorte>('VERIFIE')
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [heure, setHeure] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const tick = () =>
      setHeure(new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date()))
    tick()
    const t = setInterval(tick, 10_000)
    return () => clearInterval(t)
  }, [])

  /* L'état du prénom dans la zawiya choisie — debounced, discret */
  useEffect(() => {
    const v = value.trim()
    setErreur(null)
    if (v.length < 2) {
      setEtat('VERIFIE')
      return
    }
    const t = setTimeout(() => {
      fetch(`/api/auth/etat?name=${encodeURIComponent(v)}&ville=${ville}`)
        .then((r) => r.json())
        .then((d: { etat?: EtatPorte }) => setEtat(d?.etat ?? 'INCONNU'))
        .catch(() => setEtat('VERIFIE'))
    }, 350)
    return () => clearTimeout(t)
  }, [value, ville])

  /* Vérifier à nouveau — après validation du référent */
  const reverifier = () => {
    const v = value.trim()
    if (!v) return
    fetch(`/api/auth/etat?name=${encodeURIComponent(v)}&ville=${ville}`)
      .then((r) => r.json())
      .then((d: { etat?: EtatPorte }) => setEtat(d?.etat ?? 'INCONNU'))
      .catch(() => {})
  }

  const entrer = async () => {
    const v = value.trim()
    if (!v || envoi) return
    setErreur(null)
    setEnvoi(true)
    try {
      const r = await fetch('/api/auth/entrer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: v, ville, pin: code.trim() }),
      })
      const d = await r.json()
      /* Entré — le frère passe la porte */
      if (r.ok && d?.id) {
        setVille(ville)
        setName(v)
        setMember(d.id, d.role, d.city, d.perms)
        qc.invalidateQueries({ queryKey: ['members'] })
        return
      }
      /* Inscription enregistrée, validation en cours */
      if (d?.attente) {
        setEtat('ATTENTE')
        return
      }
      /* Code incorrect, accès révoqué, champs invalides… */
      if (d?.mauvaisCode) setCode('')
      setErreur(d?.error ?? 'Impossible d’entrer — réessaie.')
    } catch {
      setErreur('Erreur réseau — réessaie.')
    } finally {
      setEnvoi(false)
    }
  }

  /* ─── Écran d'attente : la demande est envoyée, le référent valide ─── */
  if (etat === 'ATTENTE') {
    return (
      <motion.div
        className="fixed inset-0 z-50 flex min-h-screen flex-col items-center overflow-y-auto bg-background px-6 py-8"
        exit={{ opacity: 0, scale: 1.04 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <div className="pattern-arabesque absolute inset-0" aria-hidden />
        <Etoiles />
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 70% 45% at 50% 38%, rgba(201,162,75,0.14), transparent 70%)',
          }}
        />
        <div className="relative z-10 flex w-full max-w-md flex-col items-center my-auto pt-6 sm:pt-10">
          {/* Sablier doré */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="halo-dore relative mb-7 grid h-28 w-28 place-items-center rounded-full bg-white shadow-[0_20px_60px_-15px_rgba(11,93,66,0.35)] ring-1 ring-primary/10"
          >
            <motion.svg
              viewBox="0 0 24 24"
              className="h-12 w-12 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{ rotate: [0, 0, 180, 180, 360, 360] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden
            >
              <path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
            </motion.svg>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="text-center font-display text-3xl font-medium text-encre"
          >
            Inscription enregistrée
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-4 max-w-xs text-center font-display text-lg italic leading-relaxed text-muted-foreground"
          >
            Marhaban bik, Sidi {value.trim()}. Le référent de la zawiya de{' '}
            {VILLE_LABEL[ville]} va ouvrir ton accès — repasse dans un instant.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="mt-9 flex w-full flex-col gap-2"
          >
            <button
              onClick={reverifier}
              className="w-full rounded-full bg-primary py-3.5 text-sm font-bold uppercase tracking-[0.15em] text-white shadow-md shadow-primary/25 transition-all hover:bg-emerald-deep active:scale-95"
            >
              J’ai été validé — actualiser
            </button>
            <button
              onClick={() => {
                setEtat('VERIFIE')
                setValue('')
                setCode('')
              }}
              className="w-full rounded-full py-3 text-xs font-semibold uppercase tracking-[0.2em] text-brouillard transition-colors hover:text-primary"
            >
              Changer de prénom
            </button>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 mt-8 text-xs tracking-widest text-brouillard"
        >
          {heure ? `${heure} · ${VILLE_LABEL[ville]}` : VILLE_LABEL[ville]}
        </motion.p>
      </motion.div>
    )
  }

  /* Libellé du champ code selon l'état du prénom */
  const libelleCode =
    etat === 'PRET'
      ? 'Ton code personnel'
      : etat === 'SANS_CODE'
        ? 'Choisis ton code'
        : 'Choisis un code'
  const aideCode =
    etat === 'PRET'
      ? 'Les 4 à 6 chiffres choisis à ton premier passage.'
      : '4 à 6 chiffres — ils ouvriront l’application à chaque visite.'
  const peutSoumettre =
    value.trim().length >= 1 && /^\d{4,6}$/.test(code.trim()) && etat !== 'BLOQUE'

  return (
    <motion.div
      className="fixed inset-0 z-50 flex min-h-screen flex-col items-center overflow-y-auto bg-background px-6 py-8"
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {/* Motif arabisant + ciel étoilé en fond */}
      <div className="pattern-arabesque absolute inset-0" aria-hidden />
      <Etoiles />

      {/* Bascule jour / nuit — discrète, sous l'ornement d'angle */}
      <div className="absolute right-3 top-24 z-20 sm:right-4">
        <ThemeToggle />
      </div>
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 70% 45% at 50% 38%, rgba(201,162,75,0.14), transparent 70%)',
        }}
      />

      {/* Ornements d'angle */}
      <svg aria-hidden className="absolute left-4 top-4 h-16 w-16 text-primary/15" viewBox="0 0 64 64" fill="none">
        <path d="M2 62V22C2 10 10 2 22 2h40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="10" cy="54" r="3" fill="currentColor" />
      </svg>
      <svg aria-hidden className="absolute right-4 top-4 h-16 w-16 rotate-90 text-primary/15" viewBox="0 0 64 64" fill="none">
        <path d="M2 62V22C2 10 10 2 22 2h40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="10" cy="54" r="3" fill="currentColor" />
      </svg>
      <svg aria-hidden className="absolute bottom-4 left-4 h-16 w-16 -rotate-90 text-primary/15" viewBox="0 0 64 64" fill="none">
        <path d="M2 62V22C2 10 10 2 22 2h40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="10" cy="54" r="3" fill="currentColor" />
      </svg>
      <svg aria-hidden className="absolute bottom-4 right-4 h-16 w-16 rotate-180 text-primary/15" viewBox="0 0 64 64" fill="none">
        <path d="M2 62V22C2 10 10 2 22 2h40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="10" cy="54" r="3" fill="currentColor" />
      </svg>

        {/* La calligraphie de la tariqa, posée un peu plus bas dans la composition */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center my-auto pt-6 sm:pt-10">
        {/* ─── L'emblème calligraphié ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-7"
        >
          <Particules />
          {/* Rayons de lumière tournants — cercle centré derrière la calligraphie */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[23rem] w-[23rem] -translate-x-1/2 -translate-y-1/2 sm:h-[26rem] sm:w-[26rem]"
          >
            <RayonsLumiere />
          </div>
          {/* Anneau pointillé doré — cercle centré, tourne lentement */}
          <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
            <motion.div
              className="h-[21rem] w-[21rem] rounded-full border border-dashed border-gold/40 sm:h-[24rem] sm:w-[24rem]"
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          {/* Anneau ovale qui respire — épouse la calligraphie */}
          <motion.div
            className="absolute -inset-x-10 -inset-y-8 rounded-[999px] border border-primary/20"
            animate={{ scale: [1, 1.045, 1], opacity: [0.45, 0.85, 0.45] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          />
          {/* Plaque de nuit — la lune d'ivoire porte la calligraphie verte.
              Le jour, la calligraphie flotte sur le papier crème ; la nuit,
              l'ivoire plein la garde lisible (le vert sur le vert-noir
              s'éteindrait, un voile translucide pire encore : sa lueur
              égalerait presque celle des lettres). */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-7 -inset-y-6 hidden rounded-[999px] bg-gradient-to-b from-[#faf8f1] to-[#ece5d3] shadow-[0_18px_50px_-12px_rgba(0,0,0,0.5)] ring-1 ring-gold/25 dark:block"
          />
          {/* La calligraphie — fond transparent, elle flotte sur le papier */}
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, 1.5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-72 sm:w-80"
          >
            <Image
              src="/tariqa.png"
              alt="Calligraphie de la zawiya — la Basmala calligraphiée"
              width={520}
              height={413}
              priority
              sizes="(min-width: 640px) 320px, 288px"
              className="h-auto w-full drop-shadow-[0_14px_28px_rgba(11,93,66,0.22)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
            />
          </motion.div>
          {/* Étoile à 8 branches tournante — le petit sceau d'or */}
          <motion.svg
            className="absolute -right-2 top-2 h-8 w-8 text-gold"
            viewBox="0 0 24 24"
            fill="currentColor"
            animate={{ rotate: 360 }}
            transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
            aria-hidden
          >
            <path d="M12 0l2.4 7.2L22 4.8l-4.8 7.2L24 12l-6.8 0l4.8 7.2-7.6-2.4L12 24l-2.4-7.2L2 19.2 6.8 12 0 12l6.8 0L2 4.8l7.6 2.4z" opacity="0.85" />
          </motion.svg>
        </motion.div>

        {/* ─── Titre ─── */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          className="text-center"
        >
          <TitreLettres />
          <motion.span
            initial={{ opacity: 0, letterSpacing: '0.8em' }}
            animate={{ opacity: 1, letterSpacing: '0.42em' }}
            transition={{ delay: 1.25, duration: 0.9, ease: 'easeOut' }}
            className="mt-1 block font-display text-2xl font-medium text-primary sm:text-3xl"
          >
            {(VILLE_LABEL[ville] ?? ville).toUpperCase()}
          </motion.span>
        </motion.h1>

        {/* Séparateur orné */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1.5, duration: 0.7 }}
          aria-hidden
          className="mt-5 flex items-center gap-3"
        >
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-accent/60" />
          <motion.span
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="text-gold"
          >
            ✦
          </motion.span>
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-accent/60" />
        </motion.div>

        {/* ─── Citation ─── */}
        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-6 max-w-xs text-center"
        >
          <p className="font-display text-lg italic leading-relaxed text-muted-foreground">
            «&nbsp;Nous sommes tous issus de la même lumière.&nbsp;»
          </p>
          <cite className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.3em] text-gold not-italic">
            Sidi Hamza
          </cite>
        </motion.blockquote>

        {/* ─── Choix de la zawiya (3 groupes) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-9 w-full"
        >
          <label
            className="mb-2 block text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground"
          >
            Ta zawiya
          </label>
          <div
            role="radiogroup"
            aria-label="Ta zawiya"
            className="relative mx-auto flex w-full items-stretch gap-1 rounded-2xl border border-primary/25 bg-card/90 p-1.5 shadow-inner shadow-primary/5 backdrop-blur sm:rounded-full"
          >
            {ZAWIYAS.map((z) => {
              const actif = ville === z.id
              return (
                <button
                  key={z.id}
                  type="button"
                  role="radio"
                  aria-checked={actif}
                  onClick={() => setVilleChoisie(z.id)}
                  className="relative flex-1 rounded-full px-2 py-2.5 text-center transition-all duration-300 sm:px-3"
                >
                  {actif && (
                    <motion.span
                      layoutId="zawiya-choisie"
                      className="absolute inset-0 rounded-full bg-primary shadow-md shadow-primary/25"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative block">
                    <span
                      className={
                        'block text-[13px] font-semibold sm:text-sm ' +
                        (actif ? 'text-white' : 'text-secondary-foreground')
                      }
                    >
                      {z.label}
                    </span>
                    <span
                      className={
                        'mt-0.5 block text-[8px] uppercase tracking-[0.15em] sm:text-[9px] sm:tracking-[0.2em] ' +
                        (actif ? 'text-white/70' : 'text-brouillard')
                      }
                    >
                      {z.sub}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* ─── Champ prénom ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-5 w-full"
        >
          <label
            htmlFor="prenom"
            className="mb-2 block text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground"
          >
            Prénom
          </label>
          <div className="relative">
            <input
              id="prenom"
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && /^\d{4,6}$/.test(code)) codeRef.current?.focus()
              }}
              placeholder="Ton prénom…"
              autoComplete="given-name"
              className="w-full rounded-full border border-primary/25 bg-card/90 py-4 pl-6 pr-6 text-center text-lg text-encre shadow-inner shadow-primary/5 outline-none backdrop-blur transition-all placeholder:text-brouillard/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            {etat === 'PRET' && (
              <span
                className="absolute right-5 top-1/2 -translate-y-1/2 text-primary"
                title="Prénom connu — le code personnel ouvre la porte"
                aria-label="Prénom connu"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                </svg>
              </span>
            )}
          </div>
        </motion.div>

        {/* ─── Code personnel ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-4 w-full"
        >
          <label
            htmlFor="code"
            className="mb-2 block text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground"
          >
            {libelleCode}
          </label>
          <div className="relative">
            <input
              id="code"
              ref={codeRef}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && peutSoumettre && entrer()}
              placeholder="••••"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              aria-label={libelleCode}
              className={cn(
                'w-full rounded-full border bg-card/90 py-3.5 text-center text-xl tracking-[0.6em] text-encre shadow-inner shadow-primary/5 outline-none backdrop-blur transition-all placeholder:tracking-[0.4em] placeholder:text-brouillard/50 focus:ring-4 focus:ring-primary/10',
                erreur || etat === 'BLOQUE'
                  ? 'border-accent focus:border-accent'
                  : 'border-primary/25 focus:border-primary'
              )}
            />
            <motion.button
              onClick={entrer}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              disabled={!peutSoumettre || envoi}
              aria-label="Entrer"
              className="absolute right-1.5 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full text-primary-foreground transition-all disabled:border disabled:border-border disabled:bg-card/60 disabled:text-brouillard enabled:bg-primary enabled:shadow-md enabled:shadow-primary/25"
            >
              {envoi ? (
                <motion.span
                  className="block h-5 w-5 rounded-full border-2 border-white/40 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  aria-hidden
                />
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </motion.button>
          </div>
          <AnimatePresence>
            {(erreur || etat === 'BLOQUE') && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="alert"
                className="mt-2.5 text-center text-xs font-medium text-gold-vif"
              >
                {erreur ??
                  'Cet accès a été révoqué — contacte le référent de la zaouia.'}
              </motion.p>
            )}
            {!erreur && etat !== 'BLOQUE' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-2.5 text-center text-[11px] leading-relaxed text-brouillard"
              >
                {aideCode}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ─── Heure discrète ─── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-7 text-xs tracking-widest text-brouillard"
        >
          {heure ? `${heure} · ${VILLE_LABEL[ville]}` : VILLE_LABEL[ville]}
        </motion.p>
      </div>

      {/* Vague décorative du bas */}
      <svg
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 w-full text-primary/[0.05]"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path d="M0 60 C240 110 480 10 720 60 C960 110 1200 10 1440 60 L1440 120 L0 120 Z" fill="currentColor" />
      </svg>
    </motion.div>
  )
}

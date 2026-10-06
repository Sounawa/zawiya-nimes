'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/lib/store'
import { api, useMembers } from '@/lib/api'
import { ThemeToggle } from '@/components/zaouia/theme-toggle'
import { VILLE_LABEL, type Member, type Ville } from '@/lib/types'

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

/* ═════════════════════════════════════════════════════════════════════
   LA PORTE DE LA ZAWIYA — celui qui entre écrit son prénom :
   · prénom déjà inscrit (avec ou sans majuscule : mehdi = Mehdi)
     → il entre sous ce nom, avec les droits de la maison ;
   · prénom inconnu → il entre au registre de la maison et entre
     comme simple membre ;
   · accès révoqué → la porte reste fermée pour ce prénom.

   Les routes /api/auth/* restent en place, intactes : le jour où la
   porte sécurisée revient (code personnel), il suffira de réinstaller
   les champs (l'ancienne version vit dans l'historique git).
   ═════════════════════════════════════════════════════════════════════ */
export function WelcomeGate() {
  const setName = useUser((s) => s.setName)
  const setVille = useUser((s) => s.setVille)
  const setMember = useUser((s) => s.setMember)
  const qc = useQueryClient()
  const { data: membres, isPending, isError } = useMembers()

  /* L'entrée se fait toujours à la maison-mère */
  const ville: Ville = 'NIMES'

  /* Un prénom est reconnu sans égard à la casse — mehdi, Mehdi ou
     MEHDI désignent le même frère du registre. */
  const trouverMembre = (brut: string, liste?: Member[]) =>
    (liste ?? membres ?? []).find(
      (m) => m.city === ville && m.name.trim().toLowerCase() === brut.toLowerCase()
    )

  const [passage, setPassage] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [heure, setHeure] = useState('')
  /* Le prénom de celui qui entre — écrit sur la première page,
     comme à la porte de la zawiya. */
  const [prenom, setPrenom] = useState('')
  const champPrenom = useRef<HTMLInputElement | null>(null)

  /* Le curseur attend le prénom dès que la maison est prête */
  useEffect(() => {
    if (!isPending) champPrenom.current?.focus()
  }, [isPending])

  useEffect(() => {
    const tick = () =>
      setHeure(
        new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date())
      )
    tick()
    const t = setInterval(tick, 10_000)
    return () => clearInterval(t)
  }, [])

  /* Entrer — sous le prénom écrit, reconnu sans égard à la casse.
     Un prénom inconnu entre au registre de la maison (simple membre). */
  const entrer = async () => {
    const v = prenom.trim()
    if (!v || passage || isPending) return
    setPassage(true)
    setErreur(null)
    try {
      let membre = trouverMembre(v)

      /* Prénom inconnu : il entre au registre de la maison */
      if (!membre) {
        const r = await fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: v, ville }),
        })
        if (r.ok) {
          membre = (await r.json()) as Member
        } else if (r.status === 409) {
          /* Inscrit entre-temps, peut-être sous une autre casse :
             on relit le registre et on cherche à nouveau */
          const relus = await qc.fetchQuery({
            queryKey: ['members'],
            queryFn: () => api<Member[]>('/api/members'),
          })
          membre = trouverMembre(v, relus)
        }
      }

      if (!membre) throw new Error('registre')

      if (membre.status === 'BLOCKED') {
        setErreur('Ce prénom ne peut plus entrer — demande à la maison de rouvrir l’accès.')
        setPassage(false)
        return
      }
      if (membre.status === 'PENDING') {
        setErreur('Ton inscription attend la validation de la maison.')
        setPassage(false)
        return
      }

      /* Le registre est relu AVANT d'ouvrir la session : la garde de
         la page doit déjà voir le nouveau frère, sinon elle le
         prendrait pour un intrus et refermerait la porte sur lui. */
      await qc.invalidateQueries({ queryKey: ['members'] })

      /* Le prénom du registre fait foi — l'orthographe y est la sienne */
      setVille(membre.city)
      setName(membre.name)
      setMember(membre.id, membre.role, membre.city, membre.perms)
    } catch {
      setErreur('La porte ne répond pas — vérifie ta connexion.')
      setPassage(false)
    }
  }

  return (
    <motion.div
      className="porte-conteneur fixed inset-0 z-50 flex min-h-dvh flex-col items-center overflow-y-auto bg-background px-6 py-8"
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
      <div className="porte-colonne relative z-10 flex w-full max-w-md flex-col items-center my-auto pt-6 sm:pt-10">
        {/* ─── L'emblème calligraphié ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="porte-embleme relative mb-7"
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
            className="porte-logo relative w-72 sm:w-80"
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

        {/* ─── LE PRÉNOM DE CELUI QUI ENTRE, PUIS LE BOUTON ─── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="porte-entree mt-8 flex w-full flex-col items-center"
        >
          {/* Le prénom — la porte demande qui entre */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.55 }}
            className="w-full max-w-[280px]"
          >
            <label htmlFor="prenom-entree" className="sr-only">
              Ton prénom
            </label>
            <div className="relative">
              <input
                id="prenom-entree"
                ref={champPrenom}
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') entrer()
                }}
                placeholder="Ton prénom…"
                autoComplete="given-name"
                maxLength={30}
                className="w-full rounded-full border border-gold/35 bg-card/80 py-3 pl-5 pr-11 text-center text-[15px] font-medium text-encre placeholder:text-brouillard/70 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gold/60"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
            </div>
          </motion.div>
          <div className="relative mt-4">
            {/* Halo qui respire derrière le bouton */}
            <motion.span
              aria-hidden
              className="absolute -inset-2 rounded-full bg-primary/30 blur-xl"
              animate={{ opacity: [0.45, 0.8, 0.45], scale: [0.97, 1.05, 0.97] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.button
              onClick={entrer}
              disabled={!prenom.trim() || isPending || passage}
              whileHover={prenom.trim() ? { scale: 1.045 } : undefined}
              whileTap={prenom.trim() ? { scale: 0.955 } : undefined}
              aria-label="Entrer dans la zawiya"
              suppressHydrationWarning
              className="group relative flex w-[250px] max-w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-br from-primary to-emerald-deep py-4 pl-6 pr-5 text-white shadow-xl shadow-primary/35 ring-1 ring-gold/40 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {/* Reflet doré qui balaie le bouton */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-1/4 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                animate={{ x: ['-160%', '520%'] }}
                transition={{
                  duration: 3.6,
                  repeat: Infinity,
                  repeatDelay: 1.4,
                  delay: 1.2,
                  ease: 'easeInOut',
                }}
              />
              <span className="pl-2 font-display text-sm font-bold uppercase tracking-[0.35em]">
                {isPending || passage ? 'Un instant…' : 'Entrer'}
              </span>
              {isPending || passage ? (
                <motion.span
                  className="block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  aria-hidden
                />
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </motion.button>
          </div>
          {(erreur || isError) && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="mt-3 text-center text-xs font-medium text-gold-vif"
            >
              {erreur ?? 'La porte ne répond pas — vérifie ta connexion.'}
            </motion.p>
          )}
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

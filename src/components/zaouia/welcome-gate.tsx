'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useUser } from '@/lib/store'

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

/** Rayons de lumière dorés qui tournent lentement derrière le sceau */
function RayonsLumiere() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute -inset-16 sm:-inset-20"
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
    <span className="block font-display text-5xl font-semibold tracking-[0.18em] text-[#123c2d] sm:text-6xl" aria-label="Zawiya">
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

export function WelcomeGate() {
  const setName = useUser((s) => s.setName)
  const [value, setValue] = useState('')
  const [heure, setHeure] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const tick = () =>
      setHeure(new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date()))
    tick()
    const t = setInterval(tick, 10_000)
    return () => clearInterval(t)
  }, [])

  const entrer = () => {
    const v = value.trim()
    if (v) setName(v)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex min-h-screen flex-col items-center overflow-y-auto bg-[#fbf9f4] px-6 py-8"
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {/* Motif arabisant + ciel étoilé en fond */}
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

      {/* Ornements d'angle */}
      <svg aria-hidden className="absolute left-4 top-4 h-16 w-16 text-[#0b5d42]/15" viewBox="0 0 64 64" fill="none">
        <path d="M2 62V22C2 10 10 2 22 2h40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="10" cy="54" r="3" fill="currentColor" />
      </svg>
      <svg aria-hidden className="absolute right-4 top-4 h-16 w-16 rotate-90 text-[#0b5d42]/15" viewBox="0 0 64 64" fill="none">
        <path d="M2 62V22C2 10 10 2 22 2h40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="10" cy="54" r="3" fill="currentColor" />
      </svg>
      <svg aria-hidden className="absolute bottom-4 left-4 h-16 w-16 -rotate-90 text-[#0b5d42]/15" viewBox="0 0 64 64" fill="none">
        <path d="M2 62V22C2 10 10 2 22 2h40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="10" cy="54" r="3" fill="currentColor" />
      </svg>
      <svg aria-hidden className="absolute bottom-4 right-4 h-16 w-16 rotate-180 text-[#0b5d42]/15" viewBox="0 0 64 64" fill="none">
        <path d="M2 62V22C2 10 10 2 22 2h40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="10" cy="54" r="3" fill="currentColor" />
      </svg>

      {/* Le logo placé un peu plus bas dans la composition */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center my-auto pt-6 sm:pt-10">
        {/* ─── Le sceau animé ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-8"
        >
          <Particules />
          {/* Rayons de lumière tournants */}
          <RayonsLumiere />
          {/* Anneaux concentriques */}
          <motion.div
            className="absolute -inset-8 rounded-full"
            style={{ border: '1px solid rgba(11,93,66,0.18)' }}
            animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden
          />
          <motion.div
            className="absolute -inset-14 rounded-full"
            style={{ border: '1px dashed rgba(184,146,58,0.28)' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            aria-hidden
          />
          {/* Sceau du logo */}
          <div className="halo-dore relative grid h-40 w-40 place-items-center rounded-full bg-white shadow-[0_20px_60px_-15px_rgba(11,93,66,0.35)] ring-1 ring-[#0b5d42]/10 sm:h-48 sm:w-48">
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative h-32 w-32 sm:h-40 sm:w-40"
            >
              <Image
                src="/tariqa.png"
                alt="Sceau de la zawiya de Nîmes"
                fill
                priority
                sizes="192px"
                className="object-contain"
              />
            </motion.div>
            {/* Étoile à 8 branches tournante */}
            <motion.svg
              className="absolute -right-1 -top-1 h-8 w-8 text-[#b8923a]"
              viewBox="0 0 24 24"
              fill="currentColor"
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
              aria-hidden
            >
              <path d="M12 0l2.4 7.2L22 4.8l-4.8 7.2L24 12l-6.8 0l4.8 7.2-7.6-2.4L12 24l-2.4-7.2L2 19.2 6.8 12 0 12l6.8 0L2 4.8l7.6 2.4z" opacity="0.85" />
            </motion.svg>
          </div>
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
            className="mt-1 block font-display text-2xl font-medium text-[#0b5d42] sm:text-3xl"
          >
            NIMES
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
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#c9a24b]/60" />
          <motion.span
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="text-[#b8923a]"
          >
            ✦
          </motion.span>
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#c9a24b]/60" />
        </motion.div>

        {/* ─── Citation ─── */}
        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-6 max-w-xs text-center"
        >
          <p className="font-display text-lg italic leading-relaxed text-[#5b6b60]">
            «&nbsp;Nous sommes tous issus de la même lumière.&nbsp;»
          </p>
          <cite className="mt-2 block text-[11px] font-semibold uppercase tracking-[0.3em] text-[#b8923a] not-italic">
            Sidi Hamza
          </cite>
        </motion.blockquote>

        {/* ─── Champ prénom ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-10 w-full"
        >
          <label
            htmlFor="prenom"
            className="mb-2 block text-center text-[10px] font-semibold uppercase tracking-[0.35em] text-[#78877d]"
          >
            Prénom
          </label>
          <div className="relative">
            <input
              id="prenom"
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && entrer()}
              placeholder="Ton prénom…"
              autoComplete="given-name"
              className="w-full rounded-full border border-[#0b5d42]/25 bg-white/90 py-4 pl-6 pr-24 text-center text-lg text-[#123c2d] shadow-inner shadow-[#0b5d42]/5 outline-none backdrop-blur transition-all placeholder:text-[#b6b1a0] focus:border-[#0b5d42] focus:ring-4 focus:ring-[#0b5d42]/10"
            />
            <motion.button
              onClick={entrer}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              disabled={!value.trim()}
              aria-label="Entrer"
              className="absolute right-1.5 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-gradient-to-br from-[#0b5d42] to-[#0b3d2e] text-white shadow-lg shadow-[#0b5d42]/30 transition-opacity disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </motion.button>
          </div>
        </motion.div>

        {/* ─── Heure discrète ─── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="mt-8 text-xs tracking-widest text-[#a09a87]"
        >
          {heure ? `${heure} · Nîmes` : 'Nîmes'}
        </motion.p>
      </div>

      {/* Vague décorative du bas */}
      <svg
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 w-full text-[#0b5d42]/[0.05]"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path d="M0 60 C240 110 480 10 720 60 C960 110 1200 10 1440 60 L1440 120 L0 120 Z" fill="currentColor" />
      </svg>
    </motion.div>
  )
}

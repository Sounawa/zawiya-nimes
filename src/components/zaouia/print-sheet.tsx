'use client'

import { useEffect } from 'react'
import { useContributions, useMeetings, useMembers } from '@/lib/api'
import { useLecture, usePrint } from '@/lib/store'
import { dateLongue, euros } from '@/lib/format'
import { parseProgram } from '@/lib/types'
import { CHAPITRES_CAHIER } from '@/data/cahier'
import { CHAPITRES_ARABES } from '@/data/adhkar-docs'

/* ═══════════════════════════════════════════════════════════════════
   Zone d'impression — cachée à l'écran, seule visible à l'impression.
   L'application (page.tsx) porte « print:hidden », cette zone porte
   « hidden print:block » : le navigateur n'imprime que la feuille.
   ═══════════════════════════════════════════════════════════════════ */
export function ZoneImpression() {
  const cible = usePrint((s) => s.cible)
  const effacer = usePrint((s) => s.effacer)

  /* Après le dialogue d'impression, vider la zone */
  useEffect(() => {
    if (!cible) return
    const vider = () => effacer()
    window.addEventListener('afterprint', vider)
    return () => window.removeEventListener('afterprint', vider)
  }, [cible, effacer])

  if (!cible) return null

  return (
    <div
      id="zone-impression"
      className="hidden bg-white px-2 text-[#1d2b24] print:block"
      aria-hidden
    >
      {cible.kind === 'presence' ? (
        <FeuillePresence meetingId={cible.meetingId} />
      ) : cible.kind === 'comptes' ? (
        <ComptesImprimables />
      ) : cible.kind === 'presences' ? (
        <StatsPresences />
      ) : cible.kind === 'cahier' ? (
        <FeuilleCahier chapitreId={cible.chapitreId} />
      ) : cible.kind === 'kitab' ? (
        <FeuilleKitab chapitreId={cible.chapitreId} />
      ) : (
        <BilanAnnuel />
      )}
    </div>
  )
}

/* ─── En-tête commun aux feuilles ─── */
function EnteteFeuille(sousTitre: string) {
  return (
    <header className="mb-5 border-b-2 border-[#0b5d42] pb-3 text-center">
      <p className="font-display text-2xl font-bold tracking-[0.28em] text-[#0b5d42]">
        ZAWIYA NIMES
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#78877d]">
        ✦ {sousTitre} ✦
      </p>
    </header>
  )
}

/* ─── Pied commun ─── */
function PiedFeuille() {
  return (
    <footer className="mt-6 border-t border-dashed border-[#b6b1a0] pt-2 text-center text-[9px] uppercase tracking-[0.2em] text-[#a09a87]">
      Zawiya Nimes — imprimé le{' '}
      {new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}
    </footer>
  )
}

/* ═══════════════ Chapitre du cahier d'invocations ═══════════════ */
function FeuilleCahier({ chapitreId }: { chapitreId: string }) {
  const l = useLecture()
  const chapitre = CHAPITRES_CAHIER.find((c) => c.id === chapitreId)
  if (!chapitre) return null

  const policesImpression: Record<string, string> = {
    cormorant: 'var(--font-display), Georgia, serif',
    garamond: 'var(--font-livre2), Georgia, serif',
    crimson: 'var(--font-livre3), Georgia, serif',
  }

  return (
    <div className="page p-[9mm]">
      {EnteteFeuille(`Cahier d'invocations — ${chapitre.titre}`)}
      <p className="mb-4 text-center text-[10px] uppercase tracking-[0.25em] text-[#78877d]">
        cahier de la zawiya · p. {chapitre.debut}–{chapitre.fin}
      </p>
      <div
        style={{
          fontFamily: policesImpression[l.police],
          fontSize: `${l.taille}px`,
          lineHeight: l.interligne === 'compact' ? 1.5 : l.interligne === 'aere' ? 2.2 : 1.8,
        }}
      >
        {chapitre.texte.split('\n').map((ligne, i) => {
          const m = ligne.match(/^(.*?)(\s*[x×]\s*[\dHh '\u2019]+)$/u)
          if (m && m[2].trim()) {
            return (
              <p key={i} className="whitespace-pre-wrap">
                {m[1]}
                <span className="font-bold">{m[2].trim()}</span>
              </p>
            )
          }
          return (
            <p key={i} className="whitespace-pre-wrap">
              {ligne || '\u00A0'}
            </p>
          )
        })}
      </div>
      <PiedFeuille />
    </div>
  )
}

/* ═══════════════ Chapitre du kitāb arabe — كتاب الأذكار ═══════════════ */
function FeuilleKitab({ chapitreId }: { chapitreId: string }) {
  const l = useLecture()
  const chapitre = CHAPITRES_ARABES.find((c) => c.id === chapitreId)
  if (!chapitre) return null

  const policesImpression: Record<string, string> = {
    scheherazade: 'var(--font-arabic), serif',
    amiri: 'var(--font-arabic2), serif',
    naskh: 'var(--font-arabic3), serif',
  }

  return (
    <div className="page p-[9mm]" dir="rtl" lang="ar">
      {EnteteFeuille('Kitāb al-Adhkār — كتاب الأذكار')}
      <p className="mb-4 text-center font-arabic text-[13px] text-[#43382a]">
        {chapitre.titreAr} · {chapitre.translit} · ص {chapitre.debut}–{chapitre.fin}
      </p>
      <div
        className="text-right"
        style={{
          fontFamily: policesImpression[l.policeArabe],
          fontSize: `${Math.min(l.tailleArabe, 24)}px`,
          lineHeight: l.interligne === 'compact' ? 1.7 : l.interligne === 'aere' ? 2.4 : 2.1,
        }}
      >
        {chapitre.texte.split('\n').map((ligne, i) => {
          const m = ligne.match(/^(.*?)(\s*[×x]\s*[٠-٩\dHh '’]+)$/u)
          if (m && m[2].trim()) {
            return (
              <p key={i} className="whitespace-pre-wrap">
                {m[1]}
                <span className="font-bold">{m[2].trim()}</span>
              </p>
            )
          }
          return (
            <p key={i} className="whitespace-pre-wrap">
              {ligne || '\u00A0'}
            </p>
          )
        })}
      </div>
      <PiedFeuille />
    </div>
  )
}

/* ═══════════════ Feuille de présence — pour le Shaykh ═══════════════ */
function FeuillePresence({ meetingId }: { meetingId: string }) {
  const { data: meetings } = useMeetings()
  const meeting = (meetings ?? []).find((m) => m.id === meetingId)

  if (!meeting) {
    return (
      <p className="p-8 text-center text-sm text-[#78877d]">Réunion introuvable…</p>
    )
  }

  const programme = parseProgram(meeting)
  const presents = meeting.attendances
  const totalInvites = presents.reduce((s, a) => s + a.guests, 0)
  const total = presents.length + totalInvites

  return (
    <div className="mx-auto max-w-[170mm]">
      {EnteteFeuille('Feuille de présence')}

      {/* Bloc réunion */}
      <div className="mb-5 text-center">
        <h1 className="font-display text-xl font-semibold text-[#123c2d]">
          {meeting.icon ? `${meeting.icon} ` : ''}{meeting.title}
        </h1>
        <p className="mt-1 text-sm capitalize text-[#33453a]">
          {dateLongue(meeting.date)}
          {meeting.startTime && ` · ${meeting.startTime}${meeting.endTime ? `–${meeting.endTime}` : ''}`}
        </p>
        {(meeting.city || meeting.address) && (
          <p className="text-xs text-[#78877d]">
            {meeting.city}
            {meeting.address ? ` — ${meeting.address}` : ''}
          </p>
        )}
      </div>

      {/* Résumé */}
      <div className="mb-5 flex justify-center gap-6 text-center text-xs">
        <p>
          <span className="font-display text-lg font-bold text-[#0b5d42]">{presents.length}</span>
          <br />frères attendus
        </p>
        <p>
          <span className="font-display text-lg font-bold text-[#b8923a]">{totalInvites}</span>
          <br />invités
        </p>
        <p>
          <span className="font-display text-lg font-bold text-[#123c2d]">{total}</span>
          <br />personnes
        </p>
      </div>

      {/* Programme */}
      {programme.length > 0 && (
        <div className="mb-5 rounded border border-[#e4ddcc] p-3">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-[#a09a87]">
            Programme
          </p>
          <ul className="space-y-0.5">
            {programme.map((l, i) => (
              <li key={i} className="flex gap-3 text-xs text-[#33453a]">
                <span className="w-12 shrink-0 text-right font-semibold tabular-nums text-[#0b5d42]">
                  {l.time}
                </span>
                <span>{l.icon} {l.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tableau des présences */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#f4f8f4] text-left text-[10px] uppercase tracking-widest text-[#0b5d42]">
            <th className="w-8 border border-[#c9d6cc] px-2 py-1.5 text-center font-bold">#</th>
            <th className="border border-[#c9d6cc] px-3 py-1.5 font-bold">Nom</th>
            <th className="w-16 border border-[#c9d6cc] px-2 py-1.5 text-center font-bold">Invités</th>
            <th className="border border-[#c9d6cc] px-3 py-1.5 font-bold">Signature</th>
          </tr>
        </thead>
        <tbody>
          {presents.map((a, i) => (
            <tr key={a.id}>
              <td className="border border-[#dde5de] px-2 py-2 text-center text-xs text-[#78877d]">
                {i + 1}
              </td>
              <td className="border border-[#dde5de] px-3 py-2 font-medium">
                Sidi {a.member.name}
              </td>
              <td className="border border-[#dde5de] px-2 py-2 text-center text-xs tabular-nums">
                {a.guests > 0 ? `+${a.guests}` : '—'}
              </td>
              <td className="border border-[#dde5de] px-3 py-2">
                <span className="block h-5" />
              </td>
            </tr>
          ))}
          {/* Rangées vides — les présences du jour, à la main */}
          {Array.from({ length: Math.max(4, 14 - presents.length) }).map((_, i) => (
            <tr key={`vide-${i}`}>
              <td className="border border-[#dde5de] px-2 py-2 text-center text-xs text-[#c9d6cc]">
                {presents.length + i + 1}
              </td>
              <td className="border border-[#dde5de] px-3 py-2">
                <span className="block h-5" />
              </td>
              <td className="border border-[#dde5de] px-2 py-2" />
              <td className="border border-[#dde5de] px-3 py-2" />
            </tr>
          ))}
          <tr className="bg-[#f4f8f4] font-semibold">
            <td colSpan={2} className="border border-[#c9d6cc] px-3 py-2 text-right text-xs uppercase tracking-wider">
              Total attendu
            </td>
            <td className="border border-[#c9d6cc] px-2 py-2 text-center tabular-nums">{total}</td>
            <td className="border border-[#c9d6cc]" />
          </tr>
        </tbody>
      </table>

      <PiedFeuille />
    </div>
  )
}

/* ═══════════════ Comptes imprimables — pour le trésorier ═══════════════ */
function ComptesImprimables() {
  const { data } = useContributions()
  const contributions = data?.contributions ?? []
  const totals = data?.totals

  if (!totals) {
    return <p className="p-8 text-center text-sm text-[#78877d]">Comptes indisponibles…</p>
  }

  const caisse = totals.COTISATION + totals.DON
  const triees = contributions
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
  const libelle = (c: string) =>
    c === 'COTISATION' ? 'Cotisation' : c === 'ZIYARA' ? 'Ziyara' : 'Don'

  return (
    <div className="mx-auto max-w-[175mm]">
      {EnteteFeuille('Comptes de la zaouia')}

      {/* Totaux */}
      <div className="mb-5 grid grid-cols-3 gap-3 text-center">
        <div className="rounded border-2 border-[#0b5d42] p-3">
          <p className="font-display text-2xl font-bold tabular-nums text-[#0b5d42]">
            {euros(caisse)}
          </p>
          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
            La Caisse
          </p>
          <p className="text-[9px] text-[#a09a87]">
            cotisations {euros(totals.COTISATION)} + dons {euros(totals.DON)}
          </p>
        </div>
        <div className="rounded border-2 border-[#b8923a] p-3">
          <p className="font-display text-2xl font-bold tabular-nums text-[#8a6d2f]">
            {euros(totals.ZIYARA)}
          </p>
          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
            Ziyara — pour le Shaykh
          </p>
          <p className="text-[9px] text-[#a09a87]">calculée automatiquement</p>
        </div>
        <div className="rounded border-2 border-[#123c2d] bg-[#f4f8f4] p-3">
          <p className="font-display text-2xl font-bold tabular-nums text-[#123c2d]">
            {euros(caisse + totals.ZIYARA)}
          </p>
          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#78877d]">
            Total général
          </p>
          <p className="text-[9px] text-[#a09a87]">{triees.length} entrées</p>
        </div>
      </div>

      {/* Journal */}
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-[#f4f8f4] text-left text-[10px] uppercase tracking-widest text-[#0b5d42]">
            <th className="border border-[#c9d6cc] px-2 py-1.5 font-bold">Date</th>
            <th className="border border-[#c9d6cc] px-3 py-1.5 font-bold">Frère</th>
            <th className="border border-[#c9d6cc] px-3 py-1.5 font-bold">Catégorie</th>
            <th className="w-24 border border-[#c9d6cc] px-2 py-1.5 text-right font-bold">Montant</th>
            <th className="border border-[#c9d6cc] px-3 py-1.5 font-bold">Note</th>
          </tr>
        </thead>
        <tbody>
          {triees.map((c) => (
            <tr key={c.id}>
              <td className="border border-[#dde5de] px-2 py-1.5 tabular-nums text-[#78877d]">
                {new Date(c.date).toLocaleDateString('fr-FR')}
              </td>
              <td className="border border-[#dde5de] px-3 py-1.5 font-medium">Sidi {c.member.name}</td>
              <td className="border border-[#dde5de] px-3 py-1.5">
                <span
                  className={
                    c.category === 'ZIYARA'
                      ? 'font-semibold text-[#8a6d2f]'
                      : c.category === 'DON'
                        ? 'font-semibold text-[#4a7c6b]'
                        : 'text-[#33453a]'
                  }
                >
                  {libelle(c.category)}
                </span>
              </td>
              <td className="border border-[#dde5de] px-2 py-1.5 text-right font-semibold tabular-nums">
                {euros(c.amount)}
              </td>
              <td className="border border-[#dde5de] px-3 py-1.5 text-[#78877d]">{c.note ?? ''}</td>
            </tr>
          ))}
          <tr className="bg-[#f4f8f4] font-bold">
            <td colSpan={3} className="border border-[#c9d6cc] px-3 py-2 text-right uppercase tracking-wider">
              Total caisse (cotisations & dons)
            </td>
            <td className="border border-[#c9d6cc] px-2 py-2 text-right tabular-nums text-[#0b5d42]">
              {euros(caisse)}
            </td>
            <td className="border border-[#c9d6cc]" />
          </tr>
          <tr className="bg-[#fdf6e7] font-bold">
            <td colSpan={3} className="border border-[#c9d6cc] px-3 py-2 text-right uppercase tracking-wider">
              Total ziyara — pour le Shaykh
            </td>
            <td className="border border-[#c9d6cc] px-2 py-2 text-right tabular-nums text-[#8a6d2f]">
              {euros(totals.ZIYARA)}
            </td>
            <td className="border border-[#c9d6cc]" />
          </tr>
        </tbody>
      </table>

      {/* Signature */}
      <div className="mt-8 flex justify-end">
        <div className="w-56 text-center text-[10px] uppercase tracking-[0.2em] text-[#78877d]">
          <p>Le trésorier</p>
          <p className="mt-8 border-t border-[#b6b1a0] pt-1" />
        </div>
      </div>

      <PiedFeuille />
    </div>
  )
}

/* ═══════════════ Bilan annuel — pour l'assemblée générale ═══════════════ */
function BilanAnnuel() {
  const { data } = useContributions()
  const { data: meetings } = useMeetings()
  const contributions = data?.contributions ?? []

  if (!data?.totals) {
    return <p className="p-8 text-center text-sm text-[#78877d]">Comptes indisponibles…</p>
  }

  /* Année du bilan : celle de l'entrée la plus récente */
  const annee = contributions.length
    ? new Date(contributions[0].date).getFullYear()
    : new Date().getFullYear()

  const deLAnnee = contributions.filter(
    (c) => new Date(c.date).getFullYear() === annee
  )
  const meetingsAnnee = (meetings ?? []).filter(
    (m) => new Date(m.date).getFullYear() === annee
  )

  /* Décomposition mensuelle */
  const MOIS = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ]
  const parMois = MOIS.map((label, i) => {
    const duMois = deLAnnee.filter(
      (c) => new Date(c.date).getMonth() === i
    )
    const cotisation = duMois
      .filter((c) => c.category === 'COTISATION')
      .reduce((s, c) => s + c.amount, 0)
    const don = duMois
      .filter((c) => c.category === 'DON')
      .reduce((s, c) => s + c.amount, 0)
    const ziyara = duMois
      .filter((c) => c.category === 'ZIYARA')
      .reduce((s, c) => s + c.amount, 0)
    return { label, cotisation, don, ziyara, caisse: cotisation + don }
  }).filter((m) => m.caisse > 0 || m.ziyara > 0)

  const caisseAnnee = parMois.reduce((s, m) => s + m.caisse, 0)
  const ziyaraAnnee = parMois.reduce((s, m) => s + m.ziyara, 0)
  const meetingsAvecPresence = meetingsAnnee.filter((m) => m.attendances.length > 0)
  const totalAttendus = meetingsAvecPresence.reduce(
    (s, m) => s + m.attendances.length + m.attendances.reduce((s2, a) => s2 + a.guests, 0),
    0
  )
  const moyennePresence = meetingsAvecPresence.length
    ? Math.round(totalAttendus / meetingsAvecPresence.length)
    : 0
  const plusGrand = meetingsAvecPresence.slice().sort(
    (a, b) =>
      b.attendances.length +
      b.attendances.reduce((s, x) => s + x.guests, 0) -
      (a.attendances.length + a.attendances.reduce((s, x) => s + x.guests, 0))
  )[0]

  /* Top contributeurs de l'année (caisse) */
  const parFrere = new Map<string, number>()
  for (const c of deLAnnee) {
    if (c.category === 'ZIYARA') continue
    parFrere.set(c.member.name, (parFrere.get(c.member.name) ?? 0) + c.amount)
  }
  const top = Array.from(parFrere.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxTop = top[0]?.[1] ?? 1

  return (
    <div className="mx-auto max-w-[175mm]">
      {EnteteFeuille(`Bilan annuel — ${annee}`)}

      {/* Chiffres clés */}
      <div className="mb-5 grid grid-cols-4 gap-2 text-center">
        <div className="rounded border-2 border-[#0b5d42] p-2.5">
          <p className="font-display text-xl font-bold tabular-nums text-[#0b5d42]">
            {euros(caisseAnnee)}
          </p>
          <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-[#78877d]">
            Caisse
          </p>
        </div>
        <div className="rounded border-2 border-[#b8923a] p-2.5">
          <p className="font-display text-xl font-bold tabular-nums text-[#8a6d2f]">
            {euros(ziyaraAnnee)}
          </p>
          <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-[#78877d]">
            Ziyara
          </p>
        </div>
        <div className="rounded border-2 border-[#4a7c6b] p-2.5">
          <p className="font-display text-xl font-bold tabular-nums text-[#4a7c6b]">
            {meetingsAnnee.length}
          </p>
          <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-[#78877d]">
            Ijtimâ'
          </p>
        </div>
        <div className="rounded border-2 border-[#123c2d] bg-[#f4f8f4] p-2.5">
          <p className="font-display text-xl font-bold tabular-nums text-[#123c2d]">
            {moyennePresence}
          </p>
          <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-[#78877d]">
            Présence moy.
          </p>
        </div>
      </div>

      {/* Tableau mensuel */}
      <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-[#a09a87]">
        Trésorerie mois par mois
      </p>
      <table className="mb-5 w-full border-collapse text-xs">
        <thead>
          <tr className="bg-[#f4f8f4] text-left text-[10px] uppercase tracking-widest text-[#0b5d42]">
            <th className="border border-[#c9d6cc] px-2 py-1.5 font-bold">Mois</th>
            <th className="border border-[#c9d6cc] px-2 py-1.5 text-right font-bold">Cotisations</th>
            <th className="border border-[#c9d6cc] px-2 py-1.5 text-right font-bold">Dons</th>
            <th className="border border-[#c9d6cc] px-2 py-1.5 text-right font-bold">Caisse</th>
            <th className="border border-[#c9d6cc] px-2 py-1.5 text-right font-bold">Ziyara</th>
            <th className="border border-[#c9d6cc] px-2 py-1.5 text-right font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {parMois.map((m) => (
            <tr key={m.label}>
              <td className="border border-[#dde5de] px-2 py-1.5 font-medium capitalize">{m.label}</td>
              <td className="border border-[#dde5de] px-2 py-1.5 text-right tabular-nums">
                {m.cotisation ? euros(m.cotisation) : '—'}
              </td>
              <td className="border border-[#dde5de] px-2 py-1.5 text-right tabular-nums">
                {m.don ? euros(m.don) : '—'}
              </td>
              <td className="border border-[#dde5de] px-2 py-1.5 text-right font-semibold tabular-nums">
                {m.caisse ? euros(m.caisse) : '—'}
              </td>
              <td className="border border-[#dde5de] px-2 py-1.5 text-right tabular-nums text-[#8a6d2f]">
                {m.ziyara ? euros(m.ziyara) : '—'}
              </td>
              <td className="border border-[#dde5de] px-2 py-1.5 text-right font-bold tabular-nums">
                {euros(m.caisse + m.ziyara)}
              </td>
            </tr>
          ))}
          <tr className="bg-[#f4f8f4] font-bold">
            <td className="border border-[#c9d6cc] px-2 py-2 uppercase tracking-wider">Total {annee}</td>
            <td className="border border-[#c9d6cc] px-2 py-2 text-right tabular-nums" colSpan={2} />
            <td className="border border-[#c9d6cc] px-2 py-2 text-right tabular-nums text-[#0b5d42]">
              {euros(caisseAnnee)}
            </td>
            <td className="border border-[#c9d6cc] px-2 py-2 text-right tabular-nums text-[#8a6d2f]">
              {euros(ziyaraAnnee)}
            </td>
            <td className="border border-[#c9d6cc] px-2 py-2 text-right tabular-nums">
              {euros(caisseAnnee + ziyaraAnnee)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Vie de la communauté */}
      <div className="mb-5 grid grid-cols-2 gap-3 print:[break-inside:avoid]">
        <div className="rounded border border-[#e4ddcc] p-3">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-[#a09a87]">
            Vie de la communauté
          </p>
          <ul className="space-y-1 text-xs text-[#33453a]">
            <li>
              <span className="font-semibold">{meetingsAnnee.length}</span> ijtimâ' au calendrier
            </li>
            <li>
              <span className="font-semibold">{totalAttendus}</span> présences cumulées (frères + invités)
            </li>
            {plusGrand && (
              <li>
                Plus suivi : <span className="font-semibold">{plusGrand.title}</span> (
                {plusGrand.attendances.length + plusGrand.attendances.reduce((s, a) => s + a.guests, 0)}{' '}
                personnes)
              </li>
            )}
          </ul>
        </div>
        <div className="rounded border border-[#e4ddcc] p-3">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-[#a09a87]">
            Principaux contributeurs — caisse
          </p>
          <ul className="space-y-1">
            {top.map(([nom, montant], i) => (
              <li key={nom} className="flex items-center gap-2 text-xs">
                <span className="w-4 text-right font-bold text-[#b8923a]">{i + 1}.</span>
                <span className="w-28 shrink-0 truncate font-medium text-[#33453a]">{nom}</span>
                <span
                  className="h-2 rounded-full bg-[#0b5d42]"
                  style={{ width: `${Math.max(6, Math.round((montant / maxTop) * 90))}px` }}
                />
                <span className="ml-auto font-semibold tabular-nums text-[#123c2d]">
                  {euros(montant)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <PiedFeuille />
    </div>
  )
}

/* ═══════════════ Assiduité des frères — statistiques par membre ═══════════════ */
function StatsPresences() {
  const { data: members } = useMembers()
  const { data: meetings } = useMeetings()

  if (!members || !meetings) {
    return <p className="p-8 text-center text-sm text-[#78877d]">Statistiques indisponibles…</p>
  }

  const totalReunions = meetings.length

  /* Par frère : ijtimâ' suivis, invités amenés, dernière présence */
  const lignes = members
    .map((m) => {
      const mesPresences = meetings.flatMap((r) =>
        r.attendances.filter((a) => a.memberId === m.id)
      )
      const ijtimas = mesPresences.length
      const invites = mesPresences.reduce((s, a) => s + a.guests, 0)
      const derniere = mesPresences.length
        ? new Date(
            Math.max(
              ...meetings
                .filter((r) => r.attendances.some((a) => a.memberId === m.id))
                .map((r) => new Date(r.date).getTime())
            )
          )
        : null
      return { nom: m.name, ijtimas, invites, derniere }
    })
    .sort((a, b) => b.ijtimas - a.ijtimas || a.nom.localeCompare(b.nom))

  const participants = lignes.filter((l) => l.ijtimas > 0)
  const totalPresences = participants.reduce((s, l) => s + l.ijtimas, 0)
  const totalInvites = participants.reduce((s, l) => s + l.invites, 0)
  const assiduiteMoyenne = totalReunions
    ? Math.round((totalPresences / (totalReunions * members.length)) * 100)
    : 0

  return (
    <div className="mx-auto max-w-[175mm]">
      {EnteteFeuille('Assiduité des frères')}

      {/* Chiffres clés */}
      <div className="mb-5 grid grid-cols-4 gap-2 text-center">
        <div className="rounded border-2 border-[#0b5d42] p-2.5">
          <p className="font-display text-xl font-bold tabular-nums text-[#0b5d42]">
            {totalReunions}
          </p>
          <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-[#78877d]">
            Ijtimâ&rsquo; au calendrier
          </p>
        </div>
        <div className="rounded border-2 border-[#4a7c6b] p-2.5">
          <p className="font-display text-xl font-bold tabular-nums text-[#4a7c6b]">
            {participants.length}/{members.length}
          </p>
          <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-[#78877d]">
            Frères participants
          </p>
        </div>
        <div className="rounded border-2 border-[#b8923a] p-2.5">
          <p className="font-display text-xl font-bold tabular-nums text-[#8a6d2f]">
            {totalInvites}
          </p>
          <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-[#78877d]">
            Invités amenés
          </p>
        </div>
        <div className="rounded border-2 border-[#123c2d] bg-[#f4f8f4] p-2.5">
          <p className="font-display text-xl font-bold tabular-nums text-[#123c2d]">
            {assiduiteMoyenne} %
          </p>
          <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-[#78877d]">
            Assiduité moyenne
          </p>
        </div>
      </div>

      {/* Tableau par frère */}
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-[#f4f8f4] text-left text-[10px] uppercase tracking-widest text-[#0b5d42]">
            <th className="w-8 border border-[#c9d6cc] px-2 py-1.5 text-center font-bold">#</th>
            <th className="border border-[#c9d6cc] px-3 py-1.5 font-bold">Frère</th>
            <th className="w-16 border border-[#c9d6cc] px-2 py-1.5 text-center font-bold">Ijtimâ&rsquo;</th>
            <th className="w-16 border border-[#c9d6cc] px-2 py-1.5 text-center font-bold">Invités</th>
            <th className="border border-[#c9d6cc] px-3 py-1.5 font-bold">Assiduité</th>
            <th className="w-24 border border-[#c9d6cc] px-2 py-1.5 text-center font-bold">Dernière</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, i) => {
            const taux = totalReunions ? Math.round((l.ijtimas / totalReunions) * 100) : 0
            return (
              <tr key={l.nom}>
                <td className="border border-[#dde5de] px-2 py-1.5 text-center text-[10px] text-[#78877d]">
                  {i + 1}
                </td>
                <td className="border border-[#dde5de] px-3 py-1.5 font-medium">Sidi {l.nom}</td>
                <td className="border border-[#dde5de] px-2 py-1.5 text-center font-semibold tabular-nums">
                  {l.ijtimas || '—'}
                </td>
                <td className="border border-[#dde5de] px-2 py-1.5 text-center tabular-nums text-[#8a6d2f]">
                  {l.invites || '—'}
                </td>
                <td className="border border-[#dde5de] px-3 py-1.5">
                  <span className="flex items-center gap-2">
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#e4ddcc]">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${taux}%`,
                          background:
                            taux >= 66
                              ? '#0b5d42'
                              : taux >= 33
                                ? '#4a7c6b'
                                : '#b8923a',
                        }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right font-semibold tabular-nums text-[#33453a]">
                      {taux} %
                    </span>
                  </span>
                </td>
                <td className="border border-[#dde5de] px-2 py-1.5 text-center tabular-nums text-[#78877d]">
                  {l.derniere ? l.derniere.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
                </td>
              </tr>
            )
          })}
          <tr className="bg-[#f4f8f4] font-bold">
            <td colSpan={2} className="border border-[#c9d6cc] px-3 py-2 text-right uppercase tracking-wider">
              Total — {totalReunions} réunion{totalReunions > 1 ? 's' : ''}
            </td>
            <td className="border border-[#c9d6cc] px-2 py-2 text-center tabular-nums text-[#0b5d42]">
              {totalPresences}
            </td>
            <td className="border border-[#c9d6cc] px-2 py-2 text-center tabular-nums text-[#8a6d2f]">
              {totalInvites}
            </td>
            <td className="border border-[#c9d6cc] px-2 py-2 text-center tabular-nums">
              {assiduiteMoyenne} %
            </td>
            <td className="border border-[#c9d6cc]" />
          </tr>
        </tbody>
      </table>

      {/* Note + signature */}
      <p className="mt-3 text-[9px] italic leading-relaxed text-[#a09a87]">
        L&rsquo;assiduité compte les inscriptions « Je viendrai » — elle reflète la réponse des frères,
        pas leur présence effective du jour. La vérification se fait sur les feuilles de présence signées.
      </p>
      <div className="mt-6 flex justify-end">
        <div className="w-56 text-center text-[10px] uppercase tracking-[0.2em] text-[#78877d]">
          <p>Visé par le Shaykh</p>
          <p className="mt-8 border-t border-[#b6b1a0] pt-1" />
        </div>
      </div>

      <PiedFeuille />
    </div>
  )
}

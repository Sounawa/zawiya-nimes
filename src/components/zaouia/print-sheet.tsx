'use client'

import { useEffect } from 'react'
import { useContributions, useMeetings } from '@/lib/api'
import { usePrint } from '@/lib/store'
import { dateLongue, euros } from '@/lib/format'
import { parseProgram } from '@/lib/types'

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
      ) : (
        <ComptesImprimables />
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

import { NextResponse } from 'next/server'
import https from 'https'
import dns from 'dns'

/**
 * Heures de prière pour Nîmes (30), France.
 * Source : Aladhan API — méthode 12 (UOIF : Union des Organisations Islamiques de France).
 * Cache mémoire local (une requête réseau par jour maximum).
 * NB : fetch() global préfère l'IPv6 qui n'est pas joignable ici — on force
 * l'IPv4 via le module https de Node (option family: 4).
 */

type DayTimings = {
  Fajr: string
  Chourouq: string
  Dohr: string
  Asr: string
  Maghreb: string
  Icha: string
}

const LAT = 43.8367
const LNG = 4.3601
const METHOD = 12

const cache = new Map<string, DayTimings>()

function keyOf(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function clean(t: string): string {
  return (t || '').substring(0, 5)
}

/** GET JSON via https en IPv4 avec timeout */
function getJson(url: string, timeoutMs = 8000): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { family: 4, timeout: timeoutMs, headers: { accept: 'application/json' } },
      (res) => {
        if (res.statusCode !== 200) {
          req.destroy()
          reject(new Error('HTTP ' + res.statusCode))
          return
        }
        let raw = ''
        res.on('data', (c: Buffer) => (raw += c.toString()))
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw))
          } catch {
            reject(new Error('JSON invalide'))
          }
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('timeout'))
    })
  })
}

async function fetchDay(y: number, m: number, d: number): Promise<DayTimings | null> {
  const k = keyOf(y, m, d)
  if (cache.has(k)) return cache.get(k)!
  try {
    dns.setDefaultResultOrder?.('ipv4first')
    const json = (await getJson(
      `https://api.aladhan.com/v1/timings/${d}-${m}-${y}?latitude=${LAT}&longitude=${LNG}&method=${METHOD}`
    )) as { data?: { timings?: Record<string, string> } }
    const t = json?.data?.timings
    if (!t) throw new Error('pas de timings')
    const day: DayTimings = {
      Fajr: clean(t.Fajr),
      Chourouq: clean(t.Sunrise),
      Dohr: clean(t.Dhuhr),
      Asr: clean(t.Asr),
      Maghreb: clean(t.Maghrib),
      Icha: clean(t.Isha),
    }
    cache.set(k, day)
    return day
  } catch {
    return null
  }
}

const FALLBACK: DayTimings = {
  Fajr: '06:20',
  Chourouq: '07:35',
  Dohr: '13:45',
  Asr: '17:00',
  Maghreb: '19:45',
  Icha: '20:55',
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const scope = searchParams.get('scope') || 'jour' // jour | semaine | mois
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const d = now.getDate()

  if (scope === 'jour') {
    const day = (await fetchDay(y, m, d)) || FALLBACK
    return NextResponse.json({ date: keyOf(y, m, d), timings: day })
  }

  if (scope === 'semaine') {
    const days: Record<string, DayTimings> = {}
    const jobs: Promise<void>[] = []
    for (let i = 0; i < 7; i++) {
      const dt = new Date(now)
      dt.setDate(d + i)
      jobs.push(
        fetchDay(dt.getFullYear(), dt.getMonth() + 1, dt.getDate()).then((t) => {
          if (t) days[keyOf(dt.getFullYear(), dt.getMonth() + 1, dt.getDate())] = t
        })
      )
    }
    await Promise.all(jobs)
    return NextResponse.json({ date: keyOf(y, m, d), days })
  }

  // mois
  const days: Record<string, DayTimings> = {}
  const last = new Date(y, m, 0).getDate()
  const jobs: Promise<void>[] = []
  for (let i = 1; i <= last; i++) {
    jobs.push(
      fetchDay(y, m, i).then((t) => {
        if (t) days[keyOf(y, m, i)] = t
      })
    )
  }
  await Promise.all(jobs)
  return NextResponse.json({ date: keyOf(y, m, d), days })
}

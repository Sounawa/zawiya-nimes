// Petites aides de formatage — tout en français

export function euros(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

export function dateLongue(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

export function dateCourte(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(date)
}

/** « Semaine du 22 au 28 septembre » */
export function libelleSemaine(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const lundi = new Date(date)
  const jour = (date.getDay() + 6) % 7
  lundi.setDate(date.getDate() - jour)
  const dimanche = new Date(lundi)
  dimanche.setDate(lundi.getDate() + 6)
  const f = new Intl.DateTimeFormat('fr-FR', { day: 'numeric' })
  const fm = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
  return `Semaine du ${f.format(lundi)} au ${fm.format(dimanche)}`
}

/** Clé ISO du lundi de la semaine */
export function cleSemaine(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const lundi = new Date(date)
  const jour = (date.getDay() + 6) % 7
  lundi.setDate(date.getDate() - jour)
  lundi.setHours(0, 0, 0, 0)
  return lundi.toISOString().substring(0, 10)
}

/** « 19:30 » → minutes depuis minuit ; null si absent */
export function hVersMin(h: string | null): number | null {
  if (!h) return null
  const m = h.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
}

/** « dans 33 min » / « dans 2 h » relatif à maintenant */
export function dansXmin(h: string | null): string | null {
  const total = hVersMin(h)
  if (total === null) return null
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  let diff = total - nowMin
  if (diff < 0) diff += 24 * 60
  if (diff === 0) return "maintenant"
  if (diff < 60) return `dans ${diff} min`
  const heures = Math.floor(diff / 60)
  const m = diff % 60
  return m ? `dans ${heures} h ${m}` : `dans ${heures} h`
}

/** « il y a 5 min » / « il y a 2 h » / « hier » / date — pour le journal */
export function tempsRelatif(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const diff = Date.now() - date.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const jours = Math.floor(h / 24)
  if (jours === 1) return 'hier'
  if (jours < 7) return `il y a ${jours} j`
  return dateCourte(date)
}

/** « Aujourd'hui » / « Hier » / « jeudi 24 septembre » — regroupement du journal */
export function libelleJour(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const jour = new Date()
  jour.setHours(0, 0, 0, 0)
  const veille = new Date(jour)
  veille.setDate(jour.getDate() - 1)
  if (date >= jour) return "Aujourd'hui"
  if (date >= veille) return 'Hier'
  return dateLongue(date)
}

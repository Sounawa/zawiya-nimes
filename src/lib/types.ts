// Types partagés de l'application Zawiya Nimes

/* ─── Groupes & rôles ───
   Ville  : la zawiya du frère — NIMES (droits complets) ou
            AVIGNON / MONTPELLIER (lecture + participation)
   Rôle   : MEMBER (participe) < TREASURER (trésorerie) < REFERENT (gère tout)
   Statut : ACTIVE (validé) | PENDING (demande d'inscription) | BLOCKED (révoqué) */
export type Ville = 'NIMES' | 'AVIGNON' | 'MONTPELLIER'
export type Role = 'REFERENT' | 'TREASURER' | 'MEMBER'
export type StatutMembre = 'ACTIVE' | 'PENDING' | 'BLOCKED'

/** Libellés affichables */
export const VILLE_LABEL: Record<string, string> = {
  NIMES: 'Nîmes',
  AVIGNON: 'Avignon',
  MONTPELLIER: 'Montpellier',
}

export const VILLES: Ville[] = ['NIMES', 'AVIGNON', 'MONTPELLIER']

export const ROLE_LABEL: Record<string, string> = {
  MEMBER: 'Membre',
  TREASURER: 'Trésorier',
  REFERENT: 'Référent',
}

export const STATUT_LABEL: Record<string, string> = {
  ACTIVE: 'Actif',
  PENDING: 'En attente',
  BLOCKED: 'Révoqué',
}

export interface Member {
  id: string
  name: string
  city: Ville
  role: Role
  status: StatutMembre
  /** Surcharges de droits — JSON {annonces?,sondages?,reunions?,contenus?,cotisations?} */
  perms: string | null
  createdAt: string
  _count?: { contributions: number; attendances: number }
}

/* ─── Familles de droits (surcharges individuelles) ───
   Le référent peut accorder ou retirer une famille de droits à n'importe
   quel frère, au-dessus des droits par défaut de son groupe. */
export type FamilleDroits = 'annonces' | 'sondages' | 'reunions' | 'contenus' | 'cotisations'

export type Surcharges = Partial<Record<FamilleDroits, boolean>>

export const FAMILLES_DROITS: { id: FamilleDroits; label: string; detail: string }[] = [
  { id: 'annonces', label: 'Annonces', detail: 'Publier et corriger les annonces' },
  { id: 'sondages', label: 'Sondages', detail: 'Créer des sondages pour les frères' },
  { id: 'reunions', label: 'Ijtima’', detail: "Rédiger les réunions de la semaine" },
  { id: 'contenus', label: 'Contenus', detail: "Éditer adhkâr, samâ' et durûs" },
  { id: 'cotisations', label: 'Trésorerie', detail: 'Voir les cotisations (section masquée pour l’instant)' },
]

export interface ProgramLine {
  time: string
  label: string
  icon: string
}

export interface Meeting {
  id: string
  title: string
  icon: string | null
  city: string | null
  address: string | null
  date: string
  startTime: string | null
  endTime: string | null
  announcement: string | null
  word: string | null
  program: string | null
  createdAt: string
  attendances: Attendance[]
  polls?: Poll[]
}

export interface Attendance {
  id: string
  meetingId: string
  memberId: string
  guests: number
  note: string | null
  createdAt: string
  member: Member
}

export type ContributionCategory = 'COTISATION' | 'ZIYARA' | 'DON'

export interface Contribution {
  id: string
  memberId: string
  member: Member
  amount: number
  category: ContributionCategory
  date: string
  note: string | null
  recordedBy: string | null
  confirmedAt: string | null // null = déclarée, en attente du référent
  confirmedBy: string | null
  createdAt: string
}

export interface ContributionTotals {
  COTISATION: number
  ZIYARA: number
  DON: number
  TOTAL: number
}

export interface Announcement {
  id: string
  title: string | null
  text: string
  color: 'VERT' | 'CORAIL'
  /** JSON ["NIMES","MONTPELLIER"] — null = toutes les zawiya */
  cities: string | null
  date: string
  createdAt: string
}

/** Les zawiya destinataires d'une annonce — null = toutes */
export function parseCities(a: Announcement): Ville[] | null {
  if (!a.cities) return null
  try {
    const liste = JSON.parse(a.cities) as string[]
    return Array.isArray(liste) && liste.length ? (liste as Ville[]) : null
  } catch {
    return null
  }
}

/** Libellé compact de l'audience — « toutes » ou « Nîmes · Montpellier » */
export function labelAudience(a: Announcement): string {
  const villes = parseCities(a)
  return villes ? villes.map((v) => VILLE_LABEL[v] ?? v).join(' · ') : 'toutes les zawiya'
}

export interface ContentItem {
  id: string
  section: 'ADHKAR' | 'QURAN' | 'SAMA' | 'DURUS'
  title: string
  subtitle: string | null
  body: string | null
  url: string | null
  icon: string | null
  time: string | null
  order: number
  createdAt: string
}

export interface PollVote {
  id: string
  pollId: string
  memberId: string
  choice: string
  /** réponse « venue » : 1 = seul, 2–5 = accompagné ; 0 = sans objet */
  personnes: number
  member: Member
}

export interface Poll {
  id: string
  question: string
  meetingId: string | null
  meeting?: Meeting | null
  options: string | null
  multiple: boolean
  closesAt: string | null
  createdBy: string | null
  creator?: Member | null
  createdAt: string
  votes: PollVote[]
}

export interface IjtimaDay {
  label: string
  actif: boolean
  heure: string
}

/* ─── Journal de la zawiya ─── */
export type AuditKind =
  | 'MEETING'
  | 'CONTRIBUTION'
  | 'ANNOUNCEMENT'
  | 'POLL'
  | 'MEMBER'
  | 'ATTENDANCE'
  | 'SETTING'
  | 'CONTENT'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'INSCRIRE'
  | 'DESINSCRIRE'
  | 'VOTE'

export interface AuditEntry {
  id: string
  kind: AuditKind
  action: AuditAction
  label: string
  actor: string | null
  createdAt: string
}

export interface AppSettings {
  ijtima_days?: { jours: IjtimaDay[] }
  app_config?: { nom: string; ville: string; lieu: string }
}

export const JOURS_SEMAINE = [
  'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi',
]

export const JOURS_COMPLETS = [
  'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche',
]

export const JOURS_COURTS: Record<number, string> = {
  0: 'DIM', 1: 'LUN', 2: 'MAR', 3: 'MER', 4: 'JEU', 5: 'VEN', 6: 'SAM',
}

export function parseProgram(m: Meeting): ProgramLine[] {
  if (!m.program) return []
  try {
    return JSON.parse(m.program)
  } catch {
    return []
  }
}

export function parsePollOptions(p: Poll): string[] {
  if (!p.options) return []
  try {
    return JSON.parse(p.options)
  } catch {
    return []
  }
}

/* ─── Heures de prière (Aladhan, méthode UOIF) ─── */
export type Timings = {
  Fajr: string
  Chourouq: string
  Dohr: string
  Asr: string
  Maghreb: string
  Icha: string
}

export const PRIERES: { key: keyof Timings; label: string }[] = [
  { key: 'Fajr', label: 'Fajr' },
  { key: 'Chourouq', label: 'Chourouq' },
  { key: 'Dohr', label: 'Dohr' },
  { key: 'Asr', label: 'Asr' },
  { key: 'Maghreb', label: 'Maghreb' },
  { key: 'Icha', label: 'Icha' },
]

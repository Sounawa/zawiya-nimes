// Types partagés de l'application Zawiya Nimes

export type Role = 'ADMIN' | 'TREASURER' | 'MEMBER'

export interface Member {
  id: string
  name: string
  role: Role
  createdAt: string
  _count?: { contributions: number; attendances: number }
}

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
  date: string
  createdAt: string
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

import { db } from '@/lib/db'

/* ─── Journal de la zawiya ──────────────────────────────────────────
   Chaque action notable (réunion, contribution, annonce, sondage,
   inscription, membre, réglage) laisse une trace consultable par tous. */

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

/** Enregistre une entrée au journal — ne bloque jamais la requête
 *  principale en cas d'échec d'écriture (best effort). */
export async function journaliser(params: {
  kind: AuditKind
  action: AuditAction
  label: string
  actor?: string | null
}) {
  try {
    await db.auditLog.create({
      data: {
        kind: params.kind,
        action: params.action,
        label: params.label.slice(0, 180),
        actor: params.actor?.slice(0, 60) || null,
      },
    })
  } catch {
    // Le journal ne doit jamais faire échouer l'action principale
  }
}

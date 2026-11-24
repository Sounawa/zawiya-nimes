/* Exporte TOUTES les données de la zawiya (SQLite locale) vers un JSON
   unique, prêt à être importé dans Turso le jour du déploiement Netlify.
   Usage : bun scripts/export-donnees.ts
   Sortie : scripts/tmp-export/donnees-zawiya.json (à garder hors Git). */
import { db } from '../src/lib/db'
import { mkdirSync, writeFileSync } from 'fs'

async function main() {
  const [membres, annonces, reunions, sondages, votes, presences, contributions, reglages] =
    await Promise.all([
      db.member.findMany(),
      db.announcement.findMany(),
      db.meeting.findMany(),
      db.poll.findMany(),
      db.pollVote.findMany(),
      db.attendance.findMany(),
      db.contribution.findMany(),
      db.setting.findMany(),
    ])

  const donnees = {
    exporteLe: new Date().toISOString(),
    compte: {
      membres: membres.length,
      annonces: annonces.length,
      reunions: reunions.length,
      sondages: sondages.length,
      votes: votes.length,
      presences: presences.length,
      contributions: contributions.length,
      reglages: reglages.length,
    },
    tables: { membres, annonces, reunions, sondages, votes, presences, contributions, reglages },
  }

  mkdirSync('scripts/tmp-export', { recursive: true })
  writeFileSync(
    'scripts/tmp-export/donnees-zawiya.json',
    JSON.stringify(donnees, null, 2),
    'utf8'
  )
  console.log('✓ Export écrit :', JSON.stringify(donnees.compte))
}

main()
  .catch((e) => {
    console.error('✗ Échec export :', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())

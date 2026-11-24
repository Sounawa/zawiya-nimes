/* Applique le DDL du schéma Prisma sur la base Turso distante,
   puis crée Mehdi (référent) et les réglages par défaut.
   Usage : TURSO_URL / TURSO_TOKEN dans .env.turso, ou en dur ci-dessous via l'env */
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'

const url = process.env.TURSO_URL!
const token = process.env.TURSO_TOKEN!

async function main() {
  const c = createClient({ url, authToken: token })

  /* 1. Schéma — exécution bloc par bloc */
  const sql = readFileSync('scripts/turso-schema.sql', 'utf8')
  const blocs = sql
    .split(';')
    .map((b) => b.trim())
    .filter(Boolean)
  for (const b of blocs) {
    await c.execute(b)
  }
  console.log(`✓ ${blocs.length} blocs DDL appliqués`)

  /* 2. Mehdi référent — id stable, même forme cuid que le local */
  await c.execute({
    sql: `INSERT INTO Member (id, name, city, role, status, createdAt) VALUES (?, 'Mehdi', 'NIMES', 'REFERENT', 'ACTIVE', ?)
          ON CONFLICT(id) DO NOTHING`,
    args: ['clzturso00mehdireferent00', new Date().toISOString()],
  })

  /* 3. Réglages par défaut (comme le seed local) */
  const reglages: [string, string][] = [
    [
      'app_config',
      JSON.stringify({ nom: 'Nimes', ville: 'Nîmes', lieu: '' }),
    ],
    [
      'ijtima_days',
      JSON.stringify({
        jours: [
          { label: 'Vendredi', actif: true, heure: '19:30' },
          { label: 'Dimanche', actif: true, heure: '10:30' },
        ],
      }),
    ],
  ]
  for (const [key, value] of reglages) {
    await c.execute({
      sql: `INSERT INTO Setting (key, value) VALUES (?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      args: [key, value],
    })
  }

  /* 4. Vérification */
  const tables = await c.execute(
    `SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`
  )
  const membres = await c.execute('SELECT name, role, city FROM Member')
  console.log(
    '✓ Tables :',
    tables.rows.map((r) => r.name).join(', ')
  )
  console.log(
    '✓ Membres :',
    JSON.stringify(membres.rows.map((r) => ({ nom: r.name, role: r.role, ville: r.city })))
  )
}

main().catch((e) => {
  console.error('✗ Échec :', e.message)
  process.exit(1)
})

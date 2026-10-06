/* Migration unique — groupes & rôles (round 17)
 * - Tous les membres existants appartiennent à la zawiya de Nîmes
 * - Le référent (trésorier d'hier) garde tous les droits de gestion
 *   (membres, rôles, trésorerie) — un seul porte la trésorerie.
 * - Tous les anciens ADMIN deviennent simple MEMBRE de Nîmes. */
import { db } from '../src/lib/db'

async function main() {
  const membres = await db.member.findMany()
  for (const m of membres) {
    const role = m.role === 'ADMIN' ? 'MEMBER' : m.role // le référent garde son rôle en base
    await db.member.update({
      where: { id: m.id },
      data: { city: 'NIMES', role },
    })
    console.log(`${m.name.padEnd(14)} ${m.role.padEnd(10)} → ${role}`)
  }
  const referents = await db.member.count({ where: { role: 'REFERENT' } })
  console.log(`\nRéférents : ${referents} · Membres migrés : ${membres.length}`)
}

main().finally(() => db.$disconnect())

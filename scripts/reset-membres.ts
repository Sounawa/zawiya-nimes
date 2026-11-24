/* Efface tous les membres (et leurs données liées), puis crée Mehdi
   comme RÉFÉRENT de Nîmes — l'administrateur de la zaouia.
   Usage : bun scripts/reset-membres.ts */
import { db } from '../src/lib/db'

async function main() {
  const avant = await db.member.count()
  await db.$transaction([
    db.attendance.deleteMany({}),
    db.contribution.deleteMany({}),
    db.pollVote.deleteMany({}),
    db.poll.deleteMany({}),
    db.member.deleteMany({}),
  ])

  const mehdi = await db.member.create({
    data: { name: 'Mehdi', city: 'NIMES', role: 'REFERENT', status: 'ACTIVE' },
    select: { id: true, name: true, city: true, role: true, status: true },
  })
  console.log(`✓ ${avant} membres effacés — Mehdi créé :`, JSON.stringify(mehdi))
}

main()
  .catch((e) => {
    console.error('✗ Échec :', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())

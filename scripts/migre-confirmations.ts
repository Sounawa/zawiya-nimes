/* Migration ponctuelle — les contributions existantes avaient été saisies
   par le trésorier qui avait vu les sommes : elles deviennent « confirmées ».
   (Exécuter une seule fois : bun scripts/migre-confirmations.ts) */
import { db } from '../src/lib/db'

async function main() {
  const anciennes = await db.contribution.findMany({ where: { confirmedAt: null } })
  for (const c of anciennes) {
    await db.contribution.update({
      where: { id: c.id },
      data: {
        confirmedAt: c.createdAt,
        confirmedBy: c.recordedBy ?? 'Trésorier',
      },
    })
  }
  console.log(`✓ ${anciennes.length} contributions marquées confirmées`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())

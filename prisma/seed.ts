import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function dansJours(n: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return d
}

async function main() {
  console.log('→ Nettoyage…')
  await db.pollVote.deleteMany()
  await db.poll.deleteMany()
  await db.attendance.deleteMany()
  await db.contribution.deleteMany()
  await db.meeting.deleteMany()
  await db.announcement.deleteMany()
  await db.contentItem.deleteMany()
  await db.member.deleteMany()
  await db.setting.deleteMany()
  await db.auditLog.deleteMany()

  /* Le registre de la maison : Mehdi seul, référent de la zaouia.
     Sa charge reste discrète — l'interface ne l'affiche jamais ;
     chacun entre ensuite sous son propre prénom (reconnu avec ou
     sans majuscule) et rejoint le registre comme simple membre. */
  console.log('→ Registre…')
  await db.member.create({
    data: { name: 'Mehdi', city: 'NIMES', role: 'REFERENT', status: 'ACTIVE' },
  })

  console.log('→ Annonces…')
  await db.announcement.create({
    data: {
      title: '-JEUDI- LATÎF AL-KABÎR',
      text: '« Si les foqaras savaient la valeur de ce Latif, ils traverseraient les mers à la nage pour venir le faire » Sidi Hamza',
      color: 'VERT',
    },
  })

  console.log('→ Réunions…')
  await db.meeting.create({
    data: {
      title: 'Latîf al-Kabîr',
      icon: '✦',
      city: 'Nîmes',
      address: null,
      date: dansJours(0),
      startTime: '19:30',
      endTime: '22:15',
      word: 'Latîf al-Kabîr',
      program: JSON.stringify([
        { time: '19:30', label: 'Salât al-Maghreb', icon: '🕌' },
        { time: '20:00', label: 'Wadhifa', icon: '📖' },
        { time: '20:30', label: 'Latîf al-Kabîr', icon: '🎧' },
        { time: '21:30', label: 'Salât al-Ichâ', icon: '🕌' },
        { time: '22:00', label: 'Repas', icon: '🍽️' },
      ]),
    },
  })
  await db.meeting.create({
    data: {
      title: "Al-Ijtimâ' - Sadaqa",
      icon: '🕌',
      city: 'Nîmes',
      address: null,
      date: dansJours(2),
      startTime: '19:30',
      endTime: '00:00',
      program: JSON.stringify([
        { time: '19:30', label: 'Salât al-Maghreb', icon: '🕌' },
        { time: '20:15', label: "Samâ'", icon: '🎶' },
        { time: '21:30', label: 'Salât al-Ichâ', icon: '🕌' },
        { time: '22:00', label: 'Sadaqa - Repas', icon: '🍽️' },
      ]),
    },
  })

  console.log('→ Contenus…')
  const adhkar = [
    { t: 'Wadhifa', s: 'La wadhifa journalière de la Tariqa', time: 'Après Salât al-Maghreb', icon: '📖', body: "Récitation quotidienne de la wadhifa de la tariqa Boutchichiya, en collectif à la zawiya ou individuellement." },
    { t: 'Latîf al-Kabîr', s: 'La grande invocation du Jeudi', time: 'Jeudi soir', icon: '✦', body: "Le Latîf se récite collectivement chaque jeudi soir après Salât al-Ichâ, en présence du Shaykh ou de son représentant." },
    { t: 'Hizb al-Bahr', s: "L'oraison de la mer", time: 'Vendredi matin', icon: '🌊', body: "L'Hizb al-Bahr est récité le vendredi avant Salât al-Dohr." },
    { t: 'Dhikr du matin', s: 'Adhkâr après Fajr', time: 'Chaque matin', icon: '🌅', body: "Adhkâr du matin selon l'enseignement de la tariqa." },
    { t: 'Dhikr du soir', s: 'Adhkâr après Asr', time: 'Chaque soir', icon: '🌙', body: "Adhkâr du soir selon l'enseignement de la tariqa." },
    { t: 'Istighfâr collectif', s: '100× Astaghfiru Llâh', time: 'Avant Samâ’', icon: '💫', body: "Cent demandes de pardon récitées ensemble avant la séance de samâ'." },
  ]
  for (const a of adhkar) {
    await db.contentItem.create({
      data: { section: 'ADHKAR', title: a.t, subtitle: a.s, body: a.body, time: a.time, icon: a.icon },
    })
  }

  console.log('→ Réglages…')
  await db.setting.create({
    data: {
      key: 'ijtima_days',
      value: JSON.stringify({
        jours: [
          { label: 'Lundi', actif: true, heure: '20:00' },
          { label: 'Jeudi', actif: true, heure: '19:30' },
          { label: 'Samedi', actif: true, heure: '19:30' },
        ],
      }),
    },
  })
  await db.setting.create({
    data: { key: 'app_config', value: JSON.stringify({ nom: 'Nimes', ville: 'Nîmes', lieu: '' }) },
  })

  console.log('✓ Seed terminé')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())

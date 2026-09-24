import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const MEMBRES = [
  'Abde', 'Adam', 'Ayoub', 'Badr', 'BRAHIM', 'El Hadji', 'Fotana',
  'Ghafir', 'Moaade', 'Mohamed', 'Monsef', 'Mostafa', 'Mustafa',
  'Nabil', 'Rahhal', 'Samy', 'Sidi Youssef',
]

function jour(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function dansJours(n: number) {
  const d = jour(new Date())
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

  console.log('→ Membres…')
  const members = [] as { id: string; name: string }[]
  for (const name of MEMBRES) {
    const m = await db.member.create({ data: { name, role: 'ADMIN' } })
    members.push(m)
  }

  console.log('→ Annonces…')
  await db.announcement.create({
    data: {
      title: '-JEUDI- LATÎF AL-KABÎR',
      text: '« Si les foqaras savaient la valeur de ce Latif, ils traverseraient les mers à la nage pour venir le faire » Sidi Hamza',
      color: 'VERT',
    },
  })
  await db.announcement.create({
    data: {
      title: 'ANNONCE',
      text: "Samedi prochain - Sadaqa exceptionnelle honorée par la présence de Sidi Abd Al Haq ainsi que nos frères de Lyon et de Bruxelles. N'oubliez pas de vous inscrire !",
      color: 'CORAIL',
    },
  })

  console.log('→ Réunions…')
  const jeudi = await db.meeting.create({
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
  const samedi = await db.meeting.create({
    data: {
      title: "Al-Ijtimâ' - Sadaqa",
      icon: '🕌',
      city: 'Nîmes',
      address: null,
      date: dansJours(2),
      startTime: '19:30',
      endTime: '00:00',
      announcement: "Sadaqa exceptionnelle honorée par la présence de Sidi Abd Al Haq ainsi que nos frères de Lyon et de Bruxelles.",
      program: JSON.stringify([
        { time: '19:30', label: 'Salât al-Maghreb', icon: '🕌' },
        { time: '20:15', label: "Samâ'", icon: '🎶' },
        { time: '21:30', label: 'Salât al-Ichâ', icon: '🕌' },
        { time: '22:00', label: 'Sadaqa - Repas', icon: '🍽️' },
      ]),
    },
  })
  const lundi = await db.meeting.create({
    data: {
      title: 'Wadhifa du lundi',
      icon: '📖',
      city: 'Nîmes',
      date: dansJours(4),
      startTime: '20:00',
      endTime: '21:30',
      program: JSON.stringify([
        { time: '20:00', label: 'Wadhifa', icon: '📖' },
        { time: '21:00', label: 'Dou\u2019our', icon: '🗣️' },
      ]),
    },
  })

  console.log('→ Présences…')
  const presentsJeudi = members.slice(0, 17)
  for (let i = 0; i < presentsJeudi.length; i++) {
    await db.attendance.create({
      data: {
        meetingId: jeudi.id,
        memberId: presentsJeudi[i].id,
        guests: i % 6 === 0 ? 1 : 0,
      },
    })
  }
  const presentsSamedi = members.slice(0, 15)
  for (let i = 0; i < presentsSamedi.length; i++) {
    await db.attendance.create({
      data: {
        meetingId: samedi.id,
        memberId: presentsSamedi[i].id,
        guests: i % 4 === 0 ? 2 : 0,
      },
    })
  }
  for (let i = 0; i < 8; i++) {
    await db.attendance.create({
      data: { meetingId: lundi.id, memberId: members[i].id },
    })
  }

  console.log('→ Contributions…')
  const cotisations = [
    [0, 30], [1, 25], [2, 20], [3, 50], [4, 30], [5, 25], [6, 20],
    [7, 30], [8, 15], [9, 40], [10, 25], [11, 20], [12, 30], [13, 25],
    [14, 15], [15, 20], [16, 25],
  ]
  for (const [idx, amount] of cotisations) {
    await db.contribution.create({
      data: {
        memberId: members[idx].id,
        amount,
        category: 'COTISATION',
        note: 'Cotisation mensuelle',
        recordedBy: members[idx].name,
      },
    })
  }
  const ziyaras = [
    [0, 10], [3, 20], [9, 15], [4, 10], [6, 5], [11, 10], [7, 5],
  ]
  for (const [idx, amount] of ziyaras) {
    await db.contribution.create({
      data: {
        memberId: members[idx].id,
        amount,
        category: 'ZIYARA',
        note: 'Ziyara pour le Shaykh',
        recordedBy: members[idx].name,
      },
    })
  }

  console.log('→ Sondage…')
  const poll = await db.poll.create({
    data: {
      question: "Qui vient à l'Ijtimâ' de samedi ?",
      meetingId: samedi.id,
      options: JSON.stringify(["Je viens", "Je ne viens pas", "Inch'Allah"]),
      createdBy: members[0].id,
    },
  })
  for (let i = 0; i < 10; i++) {
    await db.pollVote.create({
      data: {
        pollId: poll.id,
        memberId: members[i].id,
        choice: i < 7 ? 'Je viens' : 'Inch\u2019Allah',
      },
    })
  }

  console.log('→ Contenus…')
  const adhkar = [
    { t: 'Wadhifa', s: 'La wadhifa journalière de la Tariqa', time: 'Après Salât al-Maghreb', icon: '📖', body: "Récitation quotidienne de la wadhifa de la tariqa Boutchichiya, en collectif à la zawiya ou individuellement." },
    { t: 'Latîf al-Kabîr', s: 'La grande invocation du Jeudi', time: 'Jeudi soir', icon: '✦', body: "Le Latîf se récite collectivement chaque jeudi soir après Salât al-Ichâ, en présence du Shaykh ou de son représentant." },
    { t: 'Hizb al-Bahr', s: "L'oraison de la mer", time: 'Vendredi matin', icon: '🌊', body: "L'Hizb al-Bahr est récité le vendredi avant Salât al-Dohr." },
    { t: 'Dhikr du matin', s: 'Adhkâr après Fajr', time: 'Chaque matin', icon: '🌅', body: "Adhkâr du matin selon l'enseignement de la tariqa." },
    { t: 'Dhikr du soir', s: 'Adhkâr après Asr', time: 'Chaque soir', icon: '🌙', body: "Adhkâr du soir selon l'enseignement de la tariqa." },
    { t: 'Istighfâr collectif', s: '100× Astaghfiru Llâh', time: 'Avant Samâ\u2019', icon: '💫', body: "Cent demandes de pardon récitées ensemble avant la séance de samâ'." },
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

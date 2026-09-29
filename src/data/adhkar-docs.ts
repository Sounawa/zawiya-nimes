/* ═══════════════════════════════════════════════════════════════════
   ADHKÂR DE LA ZAWIYA — la présentation des invocations du site
   original : neuf pièces d'origine + Surat al-Fath (onglet 9) et
   Surat al-Mulk (onglet 10), sections à part. Chaque pièce ouvre en
   phonétique ou en arabe. Le cahier de wadhifa est organisé en
   PRATIQUES : chaque pratique garde sa version phonétique (cahier
   imprimé) et/ou sa version arabe (kitāb imprimé, Coran en riwāyat
   Warsh) — plus aucun chapitre ne se perd en changeant de langue.
   ═══════════════════════════════════════════════════════════════════ */

import { CHAPITRES_CAHIER } from './cahier'
import { PARTIE_1_ARABE } from './kitab-arabe'
import { PARTIE_2_ARABE } from './kitab-arabe-2'

export type LangueAdhkar = 'ph' | 'ar'

/* ─── Un chapitre à lire dans le lecteur, quelle que soit sa source ─── */
export interface ChapitreLecture {
  id: string
  /** titre dans la langue de lecture */
  titre: string
  /** sous-titre : translittération, ou indication de contexte */
  sousTitre: string
  /** pages du livre imprimé */
  debut: number
  fin: number
  texte: string
  /** qaṣīda en vers — distiques « ۞ » étalés en deux colonnes */
  poesie?: boolean
}

export interface DocAdhkar {
  id: string
  /** titre affiché en mode phonétique */
  titreFr: string
  /** titre affiché en mode عربي */
  titreAr: string
  /** ligne de détail sous le titre (phonétique) */
  detailFr: string
  /** ligne de détail sous le titre (arabe) */
  detailAr: string
  /** chapitres en phonétique — absent si PDF seulement */
  ph?: ChapitreLecture[]
  /** chapitres en arabe — absent si PDF seulement */
  ar?: ChapitreLecture[]
  /** PDF servis tels quels (samā') : chemin public */
  pdfPh?: string
  pdfAr?: string
  /** pratiques structurées (cahier de wadhifa) — lecteur à sommaire */
  pratiques?: PratiqueWadhifa[]
}

/* Les 21 chapitres arabes, rassemblés */
export const CHAPITRES_ARABES = [...PARTIE_1_ARABE, ...PARTIE_2_ARABE]

/* L'ORDRE DU LIVRE IMPRIMÉ — les identifiants des chapitres arabes
   triés par leur page d'ouverture dans le kitāb (p. 4 → 65). */
export const ORDRE_KITAB: string[] = [...CHAPITRES_ARABES]
  .sort((a, b) => a.debut - b.debut)
  .map((c) => c.id)

/* L'ORDRE DE LECTURE EN ARABE — celui du kitāb imprimé, page par
   page (k01 p.4 → k21 p.65), où s'insèrent à leur place du cahier
   les pratiques qui n'existent que dans le cahier phonétique :
   le Mujarrad entre Muwaḥḥad et Kabîr (comme les quatre Laṭîf du
   cahier), les dhikrs avant la Mashîshiyya, la Zajr juste après,
   les annexes en fin de livre. Ce qui est ensemble dans un livre
   reste ensemble à l'écran — aucun pratique ne traîne en fin de
   liste, détachée de ses sœurs. */
export const ORDRE_LECTURE_ARABE: string[] = [
  'w-yasin', // k01 · p.4
  'w-fath', // k02 · p.9
  'w-waqia', // k03 · p.13
  'w-mulk', // k04 · p.16
  'w-wadhifa', // k05 · p.19
  'w-avant-fajr', // k06 · p.23
  'w-subh', // k07 · p.26
  'w-nachr', // cahier ch15 — entre Ṣubḥ et Voyage
  'w-voyage', // k08 · p.28
  'w-taqwiyya', // k09 · p.31
  'w-iftitah', // k10 · p.32
  'w-khatm-silka', // k11 · p.33
  'w-fidya', // k12 · p.39
  'w-latif-hajar', // k13 · p.41
  'w-latif-muwahhad', // k14 · p.43
  'w-latif-mujarrad', // cahier ch09 — entre Muwaḥḥad et Kabîr
  'w-latif-kabir', // k15 · p.47
  'w-khatm-dalail', // k16 · p.49
  'w-nasiri', // k17 · p.55
  'w-munfarija', // k18 · p.59
  'w-ala-latif', // k19 · p.62
  'w-mukhlisin', // cahier ch20 — dhikrs, avant la Mashîshiyya
  'w-dhikr-nachr', // cahier ch21
  'w-ijtim-jeunes', // cahier ch22
  'w-ghayth', // cahier ch23
  'w-faraj', // cahier ch24
  'w-nom-divin', // cahier ch25
  'w-mashishiyya', // k20 · p.63
  'w-zajr-mashishiyya', // cahier ch27 — juste après la Mashîshiyya
  'w-salat-nabi', // k21 · p.65
  'w-hizb-nasr', // cahier ch28 — annexes
  'w-burda', // cahier ch29
  'w-adhkar-khassa', // cahier ch30
  'w-reginale', // cahier ch31
  'w-grille', // cahier ch32
]

/* Helpers de conversion vers le format du lecteur — les renvois de
   pages imprimées ne servent plus à rien à l'écran : on les retire. */
function depuisCahier(ids: string[]): ChapitreLecture[] {
  return ids
    .map((id) => CHAPITRES_CAHIER.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({
      id: c.id,
      titre: c.titre,
      sousTitre: '',
      debut: c.debut,
      fin: c.fin,
      texte: c.texte,
    }))
}

function depuisKitab(ids: string[]): ChapitreLecture[] {
  return ids
    .map((id) => CHAPITRES_ARABES.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({
      id: c.id,
      titre: c.titreAr,
      sousTitre: c.translit,
      debut: c.debut,
      fin: c.fin,
      texte: c.texte,
      poesie: c.poesie,
    }))
}

/* ─── Le Jazr — pièce d'une page, texte réel extrait du document original ─── */
const JAZR_PHONETIQUE: ChapitreLecture[] = [
  {
    id: 'jazr',
    titre: 'Zajr',
    sousTitre: 'le désaveu de la force propre — tawassul',
    debut: 1,
    fin: 1,
    texte: `Allâhumma innî tabarra’tu min ḥawlî wa quwwatî
wa ayqantu bi-ḥawlika wa quwwatika
fa-arinî ‘ajâ-iba luṭfika
wa gharâ-iba ḥikmatika
bi-ḥaqqi sayyidinâ wa mawlânâ Muḥammadin
ṣallâ Llâhu wa sallama ‘alayhi wa ‘alâ âlihi wa ṣaḥbihi

Ô Allah, je me suis désavoué de ma propre force et puissance, et j’ai acquis la certitude de Ta force et de Ta puissance. Montre-moi les merveilles de Ta bienveillance et les prodiges de Ta sagesse, par le droit de notre seigneur et maître Muḥammad, que la paix et la bénédiction d’Allah soient sur lui, sur sa famille et ses compagnons.`,
  },
]

const JAZR_ARABE: ChapitreLecture[] = [
  {
    id: 'jazr-ar',
    titre: 'الزَّجْرُ',
    sousTitre: 'تبرؤ من الحول والقوة — بالتوسل',
    debut: 1,
    fin: 1,
    texte: `اللَّهُمَّ إِنِّي تَبَرَّأْتُ مِنْ حَوْلِي وَقُوَّتِي ۞ وَأَيْقَنْتُ بِحَوْلِكَ وَقُوَّتِكَ ۞ فَأَرِنِي عَجَائِبَ لُطْفِكَ ۞ وَغَرَائِبَ حِكْمَتِكَ ۞ بِحَقِّ سَيِّدِنَا وَمَوْلَانَا مُحَمَّدٍ صَلَّى اللهُ وَسَلَّمَ عَلَيْهِ وَعَلَىٰ آلِهِ وَصَحْبِهِ`,
  },
]

/* Le Jazr arabe, sous la forme du kitāb (pour l'impression) */
export const JAZR_KITAB = {
  id: 'jazr-ar',
  titreAr: 'الزَّجْرُ',
  translit: 'Zajr',
  debut: 1,
  fin: 1,
  texte: JAZR_ARABE[0].texte,
}

/* Le Jazr phonétique, sous la forme du cahier (pour l'impression) */
export const JAZR_CAHIER = {
  id: 'jazr',
  titre: 'Zajr',
  debut: 1,
  fin: 1,
  texte: JAZR_PHONETIQUE[0].texte,
}

/* ═══ Les pratiques du cahier de wadhifa ═════════════════════════════
   Chaque pratique existe dans le cahier phonétique (p. du cahier)
   et/ou dans le kitāb arabe (ص du livre) — la même liste sert aux
   deux langues : basculer phonétique ⇄ عربي ne change plus ni le
   sommaire ni la pratique en cours de lecture.
   L'ORDRE SUIT LE CAHIER IMPRIMÉ (ch01 → ch12 d'abord, sans rien
   intercaler) ; les pièces qui n'existent que dans le kitāb
   (Mulk, A-lâ Laṭîf, Ṣalât 'alâ an-Nabî) viennent APRÈS la
   séquence du cahier — elles ne coupent jamais la wadhifa. */

export type GroupeWadhifa = 'quotidien' | 'moments' | 'sceaux' | 'dhikr' | 'salawat' | 'annexes'

export const GROUPES_WADHIFA: { id: GroupeWadhifa; titre: string; titreAr: string }[] = [
  { id: 'quotidien', titre: 'Le Wadhifa quotidien', titreAr: 'الوَظِيفَة اليَوْمِيَّة' },
  { id: 'moments', titre: 'Les Waẓîfa des moments', titreAr: 'وَظَائِف الأَوْقَات' },
  { id: 'sceaux', titre: 'Ouvertures & sceaux', titreAr: 'الافْتِتَاح والخَتْم' },
  { id: 'dhikr', titre: 'Dhikr & prières du cahier', titreAr: 'أَذْكَار وأَدْعِيَة' },
  { id: 'salawat', titre: 'Les Ṣalawât', titreAr: 'الصَّلَوَات' },
  { id: 'annexes', titre: 'Annexes du cahier', titreAr: 'مَلَاحِق' },
]

export interface PratiqueWadhifa {
  /** identifiant canonique de la pratique */
  id: string
  groupe: GroupeWadhifa
  /** version phonétique (cahier imprimé) */
  ph?: ChapitreLecture
  /** version arabe (kitāb imprimé) */
  ar?: ChapitreLecture
}

export const PRATIQUES_WADHIFA: PratiqueWadhifa[] = [
  /* ── Le Wadhifa quotidien — l'ordre exact du cahier imprimé ── */
  { id: 'w-taqwiyya', groupe: 'quotidien', ph: cahier('ch01-attaqwiyya'), ar: kitab('k09') },
  { id: 'w-yasin', groupe: 'quotidien', ph: cahier('ch02-sratysn'), ar: kitab('k01') },
  { id: 'w-wadhifa', groupe: 'quotidien', ph: cahier('ch03-alwafa'), ar: kitab('k05') },
  { id: 'w-waqia', groupe: 'quotidien', ph: cahier('ch04-sratalwqia'), ar: kitab('k03') },
  { id: 'w-nasiri', groupe: 'quotidien', ph: cahier('ch05-adduannir'), ar: kitab('k17') },
  { id: 'w-munfarija', groupe: 'quotidien', ph: cahier('ch06-qadatalmunfarija'), ar: kitab('k18') },
  { id: 'w-latif-hajar', groupe: 'quotidien', ph: cahier('ch07-lafibnajar'), ar: kitab('k13') },
  { id: 'w-latif-muwahhad', groupe: 'quotidien', ph: cahier('ch08-lafalmuwaad'), ar: kitab('k14') },
  { id: 'w-latif-mujarrad', groupe: 'quotidien', ph: cahier('ch09-lafalmujarrad') },
  { id: 'w-latif-kabir', groupe: 'quotidien', ph: cahier('ch10-lafalkabr'), ar: kitab('k15') },
  { id: 'w-fidya', groupe: 'quotidien', ph: cahier('ch11-alfidya'), ar: kitab('k12') },
  { id: 'w-fath', groupe: 'quotidien', ph: cahier('ch12-sratalfat'), ar: kitab('k02') },
  /* Pièces du kitāb seul — APRÈS la séquence du cahier,
     pour ne jamais couper la wadhifa */
  { id: 'w-mulk', groupe: 'quotidien', ar: kitab('k04') },
  { id: 'w-ala-latif', groupe: 'quotidien', ar: kitab('k19') },
  /* ── Les Waẓîfa des moments ── */
  { id: 'w-avant-fajr', groupe: 'moments', ph: cahier('ch13-wafaavantlefajr'), ar: kitab('k06') },
  { id: 'w-subh', groupe: 'moments', ph: cahier('ch14-wafaaub'), ar: kitab('k07') },
  { id: 'w-nachr', groupe: 'moments', ph: cahier('ch15-wafatannachr') },
  { id: 'w-voyage', groupe: 'moments', ph: cahier('ch16-wafadevoyage'), ar: kitab('k08') },
  /* ── Ouvertures & sceaux ── */
  { id: 'w-iftitah', groupe: 'sceaux', ph: cahier('ch17-iftitassilkaiftitd'), ar: kitab('k10') },
  { id: 'w-khatm-dalail', groupe: 'sceaux', ph: cahier('ch19-khatmdalilalkhayrt'), ar: kitab('k16') },
  { id: 'w-khatm-silka', groupe: 'sceaux', ph: cahier('ch18-khatmassilka'), ar: kitab('k11') },
  /* ── Dhikr & prières du cahier ── */
  { id: 'w-mukhlisin', groupe: 'dhikr', ph: cahier('ch20-dhikralmukhlin') },
  { id: 'w-dhikr-nachr', groupe: 'dhikr', ph: cahier('ch21-dhikrannachr') },
  { id: 'w-ijtim-jeunes', groupe: 'dhikr', ph: cahier('ch22-ijtimdesjeunes') },
  { id: 'w-ghayth', groupe: 'dhikr', ph: cahier('ch23-dhikralghayth') },
  { id: 'w-faraj', groupe: 'dhikr', ph: cahier('ch24-dhikralfaraj') },
  { id: 'w-nom-divin', groupe: 'dhikr', ph: cahier('ch25-qadatnomdivin') },
  /* ── Les Ṣalawât ── */
  { id: 'w-mashishiyya', groupe: 'salawat', ph: cahier('ch26-aaltalmashshiyya'), ar: kitab('k20') },
  { id: 'w-zajr-mashishiyya', groupe: 'salawat', ph: cahier('ch27-zajralmashshiyya') },
  { id: 'w-salat-nabi', groupe: 'salawat', ar: kitab('k21') },
  /* ── Annexes du cahier ── */
  { id: 'w-hizb-nasr', groupe: 'annexes', ph: cahier('ch28-izbannar') },
  { id: 'w-burda', groupe: 'annexes', ph: cahier('ch29-alburda') },
  { id: 'w-adhkar-khassa', groupe: 'annexes', ph: cahier('ch30-adhkrkha') },
  { id: 'w-reginale', groupe: 'annexes', ph: cahier('ch31-programmedelargina') },
  { id: 'w-grille', groupe: 'annexes', ph: cahier('ch32-grilledetranscript') },
]

/* Helpers internes — chapitre du cahier / du kitāb par identifiant */
function cahier(id: string): ChapitreLecture | undefined {
  const c = CHAPITRES_CAHIER.find((x) => x.id === id)
  return c ? { id: c.id, titre: c.titre, sousTitre: '', debut: c.debut, fin: c.fin, texte: c.texte } : undefined
}
function kitab(id: string): ChapitreLecture | undefined {
  const c = CHAPITRES_ARABES.find((x) => x.id === id)
  return c
    ? { id: c.id, titre: c.titreAr, sousTitre: c.translit, debut: c.debut, fin: c.fin, texte: c.texte, poesie: c.poesie }
    : undefined
}

/* ═══ Les documents de la zawiya ════════════════════════════════════
   Les neuf pièces du site original (cahier de wadhifa, Yā-Sīn, Nasirî,
   Wāqi‘a, Laṭîf, Zajr, samâ‘, Mashîshiyya, Dalâ’il) puis, en sections
   à part demandées par la zawiya : Surat al-Fatḥ en 9ᵉ position et
   Surat al-Mulk en 10ᵉ — le cahier de samâ‘ a sa propre section en bas
   de page, il est filtré de la liste numérotée. */
export const DOCUMENTS_ADHKAR: DocAdhkar[] = [
  {
    id: 'kitab',
    titreFr: 'Cahier de Wadhifa',
    titreAr: 'كتاب الأذكار',
    detailFr: '35 pratiques · phonétique & arabe · sommaire',
    detailAr: '٣٥ فصلًا · صوتي وعربي',
    pdfPh: '/adhkar/cahier-wadhifa.pdf',
    pdfAr: '/adhkar/kitab-arabe.pdf',
    ph: depuisCahier([
      'ch01-attaqwiyya',
      'ch02-sratysn',
      'ch03-alwafa',
      'ch04-sratalwqia',
      'ch05-adduannir',
      'ch06-qadatalmunfarija',
      'ch07-lafibnajar',
      'ch08-lafalmuwaad',
      'ch09-lafalmujarrad',
      'ch10-lafalkabr',
      'ch11-alfidya',
      'ch12-sratalfat',
      'ch13-wafaavantlefajr',
      'ch14-wafaaub',
      'ch15-wafatannachr',
      'ch16-wafadevoyage',
      'ch17-iftitassilkaiftitd',
      'ch18-khatmassilka',
      'ch19-khatmdalilalkhayrt',
      'ch20-dhikralmukhlin',
      'ch21-dhikrannachr',
      'ch22-ijtimdesjeunes',
      'ch23-dhikralghayth',
      'ch24-dhikralfaraj',
      'ch25-qadatnomdivin',
      'ch26-aaltalmashshiyya',
      'ch27-zajralmashshiyya',
      'ch28-izbannar',
      'ch29-alburda',
      'ch30-adhkrkha',
      'ch31-programmedelargina',
      'ch32-grilledetranscript',
    ]),
    ar: depuisKitab([
      'k01',
      'k02',
      'k03',
      'k04',
      'k05',
      'k06',
      'k07',
      'k08',
      'k09',
      'k10',
      'k11',
      'k12',
      'k13',
      'k14',
      'k15',
      'k16',
      'k17',
      'k18',
      'k19',
      'k20',
      'k21',
    ]),
    pratiques: PRATIQUES_WADHIFA,
  },
  {
    id: 'yasin',
    titreFr: 'Surat Ya-Sin',
    titreAr: 'سورة يس',
    detailFr: 'la sourate du cœur du Coran',
    detailAr: 'قلب القرآن',
    pdfPh: '/adhkar/yasin-ph.pdf',
    pdfAr: '/adhkar/yasin-ar.pdf',
    ph: depuisCahier(['ch02-sratysn']),
    ar: depuisKitab(['k01']),
  },
  {
    id: 'nasiri',
    titreFr: 'Dua Nasiri-Al Munfarijah',
    titreAr: 'الدعاء الناصري وقصيدة المنفرجة',
    detailFr: 'le du‘â’ du secours et la qaṣîda du délivrement',
    detailAr: 'دعاء الناصري وقصيدة المنفرجة',
    pdfPh: '/adhkar/nasiri-ph.pdf',
    pdfAr: '/adhkar/nasiri-ar.pdf',
    ph: depuisCahier(['ch05-adduannir', 'ch06-qadatalmunfarija']),
    ar: depuisKitab(['k17', 'k18']),
  },
  {
    id: 'waqia',
    titreFr: "Surat al-Waqi'a",
    titreAr: 'سورة الواقعة',
    detailFr: "l'inéluctable",
    detailAr: 'الواقعة الكبرى',
    pdfPh: '/adhkar/waqia-ph.pdf',
    pdfAr: '/adhkar/waqia-ar.pdf',
    ph: depuisCahier(['ch04-sratalwqia']),
    ar: depuisKitab(['k03']),
  },
  {
    id: 'latif',
    titreFr: 'Al-Latif ibn Hajar',
    titreAr: 'اللطيف ابن حجر',
    detailFr: 'istighfâr, zajr, répétitions du Laṭîf — puis l’ensemble à voix haute',
    detailAr: 'الاستغفار والزجر وتكرار اللطيف',
    pdfPh: '/adhkar/latif.pdf',
    pdfAr: '/adhkar/latif.pdf',
    ph: depuisCahier(['ch07-lafibnajar']),
    ar: depuisKitab(['k13']),
  },
  {
    id: 'jazr',
    titreFr: 'Jazr',
    titreAr: 'الزَّجْرُ',
    detailFr: 'le désaveu de la force propre',
    detailAr: 'الزَّجْرُ',
    pdfPh: '/adhkar/jazr.pdf',
    pdfAr: '/adhkar/jazr.pdf',
    ph: JAZR_PHONETIQUE,
    ar: JAZR_ARABE,
  },
  {
    id: 'sama',
    titreFr: 'Cahier de Sama',
    titreAr: 'ديوان السماع',
    detailFr: 'le diwân complet réécrit · 398 chants',
    detailAr: 'ديوان السماع · ٢٢٢ صفحة',
    pdfPh: '/adhkar/cahier-de-sama.pdf',
    pdfAr: '/adhkar/diwan-as-sama.pdf',
  },
  {
    id: 'mashishiyya',
    titreFr: 'Salat al-Mashishiyyah',
    titreAr: 'الصلاة المشيشية',
    detailFr: 'la ṣalât de Sîdî ‘Abd as-Salâm ibn Mashîsh',
    detailAr: 'الصلاة المشيشية',
    pdfPh: '/adhkar/mashishiyya.pdf',
    pdfAr: '/adhkar/mashishiyya.pdf',
    ph: depuisCahier(['ch26-aaltalmashshiyya', 'ch27-zajralmashshiyya']),
    ar: depuisKitab(['k20']),
  },
  {
    id: 'dalail',
    titreFr: 'Dalail al-Khayrat',
    titreAr: 'دلايل الخيرات',
    detailFr: 'l’ouverture et le sceau des Dalâ’il',
    detailAr: 'الافتتاح والختم',
    pdfPh: '/adhkar/dalail.pdf',
    pdfAr: '/adhkar/dalail.pdf',
    ph: depuisCahier(['ch17-iftitassilkaiftitd', 'ch19-khatmdalilalkhayrt']),
    ar: depuisKitab(['k16']),
  },
  /* ── Les deux sections à part, demandées par la zawiya —
     onglets 9 et 10, après les pièces du site original ── */
  {
    id: 'fath',
    titreFr: 'Surat al-Fath',
    titreAr: 'سُورَةُ الفَتْح',
    detailFr: "l'ouverture de la victoire — riwāyat Warsh",
    detailAr: 'سورة الفتح',
    ph: depuisCahier(['ch12-sratalfat']),
    ar: depuisKitab(['k02']),
  },
  {
    id: 'mulk',
    titreFr: 'Surat al-Mulk',
    titreAr: 'سُورَةُ المُلْك',
    detailFr: 'la royauté — riwāyat Warsh',
    detailAr: 'سورة الملك',
    ar: depuisKitab(['k04']),
  },
]

/** Le document portant cet identifiant, s'il existe */
export function trouverDoc(id: string): DocAdhkar | undefined {
  return DOCUMENTS_ADHKAR.find((d) => d.id === id)
}

/** Les chapitres d'un document dans la langue demandée (vide si PDF) */
export function chapitresDuDoc(doc: DocAdhkar, langue: LangueAdhkar): ChapitreLecture[] {
  return langue === 'ph' ? doc.ph ?? [] : doc.ar ?? []
}

/** Le PDF d'un document dans la langue demandée (undefined si texte) */
export function pdfDuDoc(doc: DocAdhkar, langue: LangueAdhkar): string | undefined {
  return langue === 'ph' ? doc.pdfPh : doc.pdfAr
}

/** Retire les diacritiques de translittération ET les signes arabes :
    « Nâṣirî » → « nasiri », « الناصري » → « الناصري » sans vocalisation. */
export function sansDiacritiquesAdhkar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f\u064b-\u0652\u0670]/g, '')
    .normalize('NFC')
    .toLowerCase()
}

/* ═══ Les renvois de pages, liens du lecteur ═════════════════════════
   Le cahier imprimé renvoie ses pratiques les unes aux autres :
   « Sûrat (36) Yâ si~n → p. 7 » en phonétique, « سُورَةُ يس ← ص ٧ »
   dans le kitāb arabe. À l'écran, la page est un lien : il mène
   directement à la pratique visée, dans la langue courante. */

/** Un titre arabe dépouillé de ce qui l'orne : diacritiques,
    parenthèses « (٣٦) », séparateurs — pour reconnaître
    « سُورَةُ الْفَتْح (٤٨) » dans le titre « سُورَةُ الفَتْح ». */
function normaliserTitreAr(s: string): string {
  return s
    .replace(/[\u064b-\u0652\u0670\u0640]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[۞٭«»﴾﴿:،.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Les chiffres arabes du kitāb (٧) redevenus latins (7). */
export function chiffresLatins(s: string): number {
  return Number(s.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))))
}

/** Les chiffres latins (4) en chiffres du kitāb (٤). */
export function chiffresArabes(n: number): string {
  return String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}

/** La pratique visée par un renvoi de page — par le titre arabe
    d'abord (la page du cahier n'est pas celle du kitāb : le renvoi
    « سُورَةُ الْفَتْح ← ص ٤٩ » de la Waẓîfa aṣ-Ṣubḥ compte les pages
    du CAHIER, seul le titre désigne la bonne pièce), puis par la
    page imprimée du livre correspondant. Renvoie l'identifiant de
    la PRATIQUE (stable d'une langue à l'autre), ou null. */
export function pratiqueDuRenvoi(
  livre: LangueAdhkar,
  page: number,
  titreAvant?: string,
): string | null {
  let idChapitre: string | null = null

  if (livre === 'ar') {
    const cherche = titreAvant ? normaliserTitreAr(titreAvant) : ''
    if (cherche) {
      const k = CHAPITRES_ARABES.find((c) => normaliserTitreAr(c.titreAr) === cherche)
      if (k) idChapitre = k.id
    }
    if (!idChapitre) {
      const k = CHAPITRES_ARABES.find((c) => c.debut <= page && page <= c.fin)
      if (k) idChapitre = k.id
    }
  } else {
    const c = CHAPITRES_CAHIER.find((x) => x.debut <= page && page <= x.fin)
    if (c) idChapitre = c.id
  }

  if (!idChapitre) return null
  const p = PRATIQUES_WADHIFA.find(
    (x) => x.ph?.id === idChapitre || x.ar?.id === idChapitre,
  )
  return p ? p.id : idChapitre
}

/* ═══════════════════════════════════════════════════════════════════
   LES NUMÉROS DE VERSETS DU KITĀB — أرقام الآيات
   Le kitāb imprimé sépare les versets par le ۞ mais n'imprime pas
   leur numéro : à l'écran, chaque verset porte désormais le sien,
   en chiffres du muṣḥaf, pour suivre la récitation — et chaque
   citation courte porte sa référence (sourate : versets).

   PRINCIPE — pour chaque chapitre du kitāb arabe, la règle de
   chaque BLOC coranique (ligne commençant par ﴿), dans l'ordre
   d'apparition :
   · number  → premier verset du bloc : les versets se numbered
     ۞ après ۞, de ce numéro en avant (récitations suivies —
     Yā-Sīn, al-Fatḥ, al-Wāqi‘a, al-Mulk, Ṭā-Hā, Fātiḥa,
     courtes sourates du khatm…) ;
   · string  → référence « sourate : versets » en badge discret
     à la fin de la citation (kursī, taslīyāt, versets isolés) ;
   · null    → pas de numéro (formules, ﴿قُلِ اللهُ﴾, basmala seule).

   SOURCES — riwāyat Warsh 'an Nāfi‘ (muṣḥaf maghrébin), comptes
   verset par verset vérifiés sur le texte du kitāb ET sur le
   kitāb imprimé lui-même, qui NUMÉROTE ses versets en médaillons
   (round 35 : al-Mulk = 31 versets — قالوا بلى قد جاءنا نذير
   verset à part, division warshienne confirmée au scan p.17 ;
   ouverture de la Baqara = 7 versets — لَا رَيْبَ séparé de فِيهِ
   هُدٗ, scan p.33 ; al-Wāqi‘a = 96, scan p.15). Yā-Sīn 83
   (12+20+18+20+13), al-Fatḥ 29 (10+19), Ṭā-Hā 135
   (16+25+14+22+21+37). Les numéros des sourates suivent la
   numérotation du muṣḥaf (Fātiḥa 1, Baqara 2, an-Nisā' 4,
   al-An‘ām 6, al-Anfāl 8, Ṭā-Hā 20, as-Sajda 32, al-Aḥzāb 33,
   Fāṭir 35, Yā-Sīn 36, aṣ-Ṣāffāt 37, Ghāfir 40, ash-Sharḥ 94,
   Muḥammad 47, al-Fatḥ 48, al-Ḥadīd 57, al-Mujādala 58,
   al-Mulk 67, Nūḥ 71, al-Burūj 85, al-A‘lā 87).
   ═══════════════════════════════════════════════════════════════════ */

export type RegleVersets = number | string | null

export const NUMEROS_VERSETS: Record<string, RegleVersets[]> = {
  /* k01 — Yā-Sīn : 5 plans + les taslīyāt (aṣ-Ṣāffāt 37:180-182) */
  k01: [1, 13, 33, 51, 71, '٣٧ : ١٨٠-١٨٢'],

  /* k02 — al-Fatḥ : 48:1-10 puis 48:11-29, puis les taslīyāt */
  k02: [1, 11, '٣٧ : ١٨٠-١٨٢'],

  /* k03 — al-Wāqi‘a : 96 versets d'un trait (le sceau taslīyāt a
     été remplacé par le renvoi vers la Waẓîfa) */
  k03: [1],

  /* k04 — al-Mulk : 31 versets (division warshienne), puis les taslīyāt */
  k04: [1, '٣٧ : ١٨٠-١٨٢'],

  /* k05 — الوَظِيفَة : Fātiḥa ×10 numérotée, citations en référence */
  k05: [
    1, // الفاتحة × ١٠
    '٣٧ : ١٨٠-١٨٢', // سبحان ربك
    '٤٢ : ١٩', // الله لطيف بعباده
    '٦ : ١٠٣', // لا تدركه الأبصار
    '٦ : ٦٣-٦٤', // قل من ينجيكم
    '٣٧ : ١٨٠-١٨٢', // سبحان ربك
    '٤٧ : ١٩', // فاعلم أنه لا إله إلا الله
    '٨ : ٤٠', // نعم المولى ونعم النصير
    null, // قل الله
    '٤٠ : ٦٥', // لا إله إلا هو فادعوه
    '٣٧ : ١٨٠-١٨٢', // سبحان ربك (après la ṣalāt nūriyya)
    '٩٤ : ٥-٦', // فإن مع العسر يسرا × ١٠٠
    '٣٧ : ١٨٠-١٨٢', // سبحان ربك
  ],

  /* k06 — Waẓîfa avant le Fajr */
  k06: [
    1, // الفاتحة × ١٠
    '٣٧ : ١٨٠-١٨٢',
    '٤٢ : ١٩',
    '٦ : ١٠٣',
    '٦ : ٦٣-٦٤',
    '٣٧ : ١٨٠-١٨٢',
    null, // قل الله
    null, // la basmala seule
    '٣٦ : ٥٨', // سلام قولا من رب رحيم × ١٠٠
    '٢ : ٢٥٥', // آية الكرسي × ٣
    '٣٧ : ١٨٠-١٨٢',
  ],

  /* k07 — Waẓîfa aṣ-Ṣubḥ */
  k07: [
    '٥٨ : ٢١', // إن الله قوي عزيز (fin du verset)
    '٢ : ٢٥٥', // آية الكرسي × ٧
    '٤٨ : ٢٩', // محمد رسول الله (verset entier) × ١
    '٣٧ : ١٨٠-١٨٢',
    '٣٧ : ١٨٠-١٨٢',
    '٣٧ : ١٨٠-١٨٢',
  ],

  /* k08 — Waẓîfa de voyage */
  k08: [
    1, // الفاتحة × ٧
    '٢ : ٢٥٥', // آية الكرسي × ٧
    '٩ : ١٢٨-١٢٩', // لقد جاءكم رسول
    1, // الإخلاص × ٧
    1, // الفلق
    1, // الناس
    '٤٢ : ١٩', // الله لطيف بعباده
  ],

  /* k09 — التَّقْوِيَة */
  k09: ['٧٣ : ٢٠', '٤٧ : ١٩', null, '٣٧ : ١٨٠-١٨٢', '٣٧ : ١٨٠-١٨٢'],

  /* k10 — افْتِتَاحُ السِّلْكَة */
  k10: [1, 1, '٣٣ : ٥٦'],

  /* k11 — خَتْمُ السِّلْكَة : Quraych → Nās, Fātiḥa, Baqara,
     Āmana r-Rasūl (2:285-286), taslīyāt */
  k11: [
    1, // قريش
    1, // الماعون
    1, // الكوثر
    1, // الكافرون
    1, // النصر
    1, // المسد
    1, // الإخلاص
    1, // الفلق
    1, // الناس
    1, // الفاتحة
    1, // البقرة 1-5
    '٢ : ٢٨٥-٢٨٦', // آمن الرسول
    '٣٧ : ١٨٠-١٨٢',
  ],

  /* k12 — الفِدْيَة */
  k12: ['٤٨ : ٢٩', '٣٧ : ١٨٠-١٨٢'],

  /* k13 — اللَّطِيفُ ابْنُ حَجَر */
  k13: ['٧٣ : ٢٠', '٣٧ : ١٨٠-١٨٢'],

  /* k14 — اللَّطِيفُ المُوَحَّد */
  k14: ['٧٣ : ٢٠', '٣٧ : ١٨٠-١٨٢', '٢ : ٢٨٥-٢٨٦', '٣٧ : ١٨٠-١٨٢', '٣٧ : ١٨٠-١٨٢'],

  /* k15 — اللَّطِيفُ الكَبِير : le ﴿يجيب المضطر﴾ est NOYÉ dans
     le Zajr 2 (citation en ligne) — aucun bloc à part */
  k15: [],

  /* k16 — دَلَائِلُ الخَيْرَات */
  k16: ['٣٣ : ٥٦'],

  /* k17, k18 — qaṣīda : pas de versets coraniques */
  k17: [],
  k18: [],

  /* k19 — أَلَا يَا لَطِيفُ : le ﴿يجيب المضطر﴾ est en ligne */
  k19: [],

  /* k20 — الصَّلَاةُ المَشِيشِيَّة */
  k20: ['٣٣ : ٥٦', '٢٨ : ٨٥', '٣٧ : ١٨٠-١٨٢'],

  /* k21 — الصَّلَاةُ عَلَى النَّبِيّ : la liste الآيات */
  k21: [
    '٤٨ : ١',
    '٨ : ٣٠',
    '٧١ : ١٠-١٢',
    '٢٦ : ٨٠',
    '١٧ : ٨١',
    '٤٧ : ٧',
    '٤٧ : ٧',
    '٣٠ : ٤٧',
    '٥ : ٦٧',
    '٣٦ : ٥٨',
    '٨٥ : ٢٠-٢٢',
  ],

  /* k22 — Ṭā-Hā : 6 plans de la sourate + les taslīyāt */
  k22: [1, 17, 42, 56, 78, 99, '٣٧ : ١٨٠-١٨٢'],
}

/** La règle du n-ième bloc coranique (ligne ﴿…﴾) d'un chapitre. */
export function regleDuBloc(chapitreId: string, indexBloc: number): RegleVersets | undefined {
  return NUMEROS_VERSETS[chapitreId]?.[indexBloc]
}

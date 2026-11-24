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
    '٩٤ : ٥-٦', // فإن مع العسر يسرا × ٥٠ — dernier bloc : la Waẓîfa
    // s'achève ici sur l'imprimé (p. 44), sans taslīyāt finale
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

  /* ─── Chapitres du cahier phonétique — le modèle du kitāb appliqué :
     mêmes médaillons de versets, mêmes références (riwāyat Warsh) ─── */

  /* ch01 — At-Taqwiyya */
  'ch01-attaqwiyya': ['٧٣ : ٢٠', '٤٧ : ١٩', null, '٣٧ : ١٨٠-١٨٢'],

  /* ch02 — Yâ-Sîn : 5 plans + les taslīyāt */
  'ch02-sratysn': [1, 13, 33, 51, 71, '٣٧ : ١٨٠-١٨٢'],

  /* ch03 — Waẓîfa mâ bayna l-‘Ishâ’ayn (miroir du k05) */
  'ch03-alwafa': [1, '٣٧ : ١٨٠-١٨٢', '٤٢ : ١٩', '٦ : ١٠٣', '٦ : ٦٣-٦٤', '٣٧ : ١٨٠-١٨٢',
    '٤٧ : ١٩', '٨ : ٤٠', null, '٤٠ : ٦٥', '٣٧ : ١٨٠-١٨٢', '٩٤ : ٥-٦'],

  /* ch04 — Wâqi‘a : 96 versets d'un trait */
  'ch04-sratalwqia': [1],

  /* ch07 — Laṭîf Ibn Ḥajar */
  'ch07-lafibnajar': ['٧٣ : ٢٠', '٣٧ : ١٨٠-١٨٢'],

  /* ch08 — Laṭîf al-Muwaḥḥad */
  'ch08-lafalmuwaad': ['٧٣ : ٢٠', '٣٧ : ١٨٠-١٨٢', '٢ : ٢٨٥-٢٨٦', '٣٧ : ١٨٠-١٨٢', '٣٧ : ١٨٠-١٨٢'],

  /* ch09 — Laṭîf al-Mujarrad : citation du Zajr en ligne, taslīyāt seule */
  'ch09-lafalmujarrad': ['٣٧ : ١٨٠-١٨٢'],

  /* ch10 — Laṭîf al-Kabîr : citations en ligne */
  'ch10-lafalkabr': [],

  /* ch11 — Al-Fidya */
  'ch11-alfidya': ['٤٨ : ٢٩', '٣٧ : ١٨٠-١٨٢'],

  /* ch12 — al-Fatḥ : 2 plans + taslīyāt */
  'ch12-sratalfat': [1, 11, '٣٧ : ١٨٠-١٨٢'],

  /* ch13 — Waẓîfa avant le Fajr (miroir du k06) */
  'ch13-wafaavantlefajr': [1, '٣٧ : ١٨٠-١٨٢', '٤٢ : ١٩', '٦ : ١٠٣', '٦ : ٦٣-٦٤', '٣٧ : ١٨٠-١٨٢',
    null, null, '٣٦ : ٥٨', '٢ : ٢٥٥', '٣٧ : ١٨٠-١٨٢'],

  /* ch14 — Waẓîfa aṣ-Ṣubḥ (miroir du k07) */
  'ch14-wafaaub': ['٥٨ : ٢١', '٢ : ٢٥٥', '٤٨ : ٢٩', '٣٧ : ١٨٠-١٨٢', '٣٧ : ١٨٠-١٨٢', '٣٧ : ١٨٠-١٨٢'],

  /* ch15 — Waẓîfat an-Nachr (miroir du k05) */
  'ch15-wafatannachr': [1, '٣٧ : ١٨٠-١٨٢', '٤٢ : ١٩', '٦ : ١٠٣', '٦ : ٦٣-٦٤', '٣٧ : ١٨٠-١٨٢',
    '٤٧ : ١٩', '٨ : ٤٠', null, '٤٠ : ٦٥', '٣٧ : ١٨٠-١٨٢', '٩٤ : ٥-٦'],

  /* ch16 — Waẓîfa de voyage (miroir du k08) */
  'ch16-wafadevoyage': [1, '٢ : ٢٥٥', '٩ : ١٢٨-١٢٩', 1, 1, 1, '٤٢ : ١٩'],

  /* ch17 — Iftitâḥ as-Silka + Dalâ'il */
  'ch17-iftitassilkaiftitd': [1, 1, '٣٣ : ٥٦'],

  /* ch18 — Khatm as-Silka (miroir du k11) */
  'ch18-khatmassilka': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, '٢ : ٢٨٥-٢٨٦', '٣٧ : ١٨٠-١٨٢'],

  /* ch20 — Dhikr al-Mukhliṣîn : Ḥadîd 57:1-6, Mâ-ida 5:67, Burûj 85:20-22 */
  'ch20-dhikralmukhlin': ['٥٧ : ١-٦', '٥ : ٦٧', '٨٥ : ٢٠-٢٢', '٣٧ : ١٨٠-١٨٢'],

  /* ch21 — Dhikr an-Nachr */
  'ch21-dhikrannachr': [1, '٣٧ : ١٨٠-١٨٢', '٤٧ : ١٩'],

  /* ch22 — Ijtimâ‘ des jeunes */
  'ch22-ijtimdesjeunes': [1, '٣٧ : ١٨٠-١٨٢', '٤٧ : ١٩'],

  /* ch23 — Dhikr al-Ghayth : Muzzammil 73:20, Nûḥ 71:10-12 */
  'ch23-dhikralghayth': ['٧٣ : ٢٠', '٧١ : ١٠-١٢'],

  /* ch24 — Dhikr al-Faraj : Baqara 2:155-157, Anbiyâ 21:83-84, Luqmân 31:16-17,
     Taghâbun 64:11, Âl ‘Imrân 3:54, Muḥammad 47:7, Rûm 30:47 */
  'ch24-dhikralfaraj': ['٢ : ١٥٥-١٥٧', '٢١ : ٨٣-٨٤', '٣١ : ١٦-١٧', '٦٤ : ١١', '٣ : ٥٤', '٤٧ : ٧', '٣٠ : ٤٧'],

  /* ch25 — Qaṣîdat nom divin : A‘râf 7:180 */
  'ch25-qadatnomdivin': ['٧ : ١٨٠'],

  /* ch26 — Ṣalât al-Mashîshiyya : Aḥzâb 33:56, Ḥashr 28:85, Kahf 18:10 */
  'ch26-aaltalmashshiyya': ['٣٣ : ٥٦', '٢٨ : ٨٥', '١٨ : ١٠', '٣٧ : ١٨٠-١٨٢'],

  /* ch28 — Ḥizbu an-Naṣr : citations mêlées au du'â', Burûj 85:20-22 repéré */
  'ch28-izbannar': [null, '٨٥ : ٢٠-٢٢', null],

  /* ch30 — Adhkâr khâṣṣa : Fatḥ 48:1, Âl ‘Imrân 3:54, Nûḥ 71:10-12, Shu‘arâ 26:80,
     Isrâ 17:81, Muḥammad 47:7 ×3, Rûm 30:47, Mâ-ida 5:67, Yâ-Sîn 36:58, Burûj 85:20-22 */
  'ch30-adhkrkha': ['٤٨ : ١', '٣ : ٥٤', '٧١ : ١٠-١٢', '٢٦ : ٨٠', '١٧ : ٨١', '٤٧ : ٧', '٤٧ : ٧',
    '٤٧ : ٧', '٣٠ : ٤٧', '٥ : ٦٧', '٣٦ : ٥٨', '٨٥ : ٢٠-٢٢'],

  /* ch31 — Programme de l'argina : Ibrâhîm 14:7 */
  'ch31-programmedelargina': ['١٤ : ٧'],

  /* ch33 — al-Mulk (miroir du k04) */
  'ch33-sratmulk': [1, '٣٧ : ١٨٠-١٨٢'],

  /* ch34 — Ṭâ-Hâ : 6 plans + les taslīyāt (miroir du k22) */
  'ch34-srattaha': [1, 17, 42, 56, 78, 99, '٣٧ : ١٨٠-١٨٢'],
}


/** La règle du n-ième bloc coranique (ligne ﴿…﴾) d'un chapitre. */
export function regleDuBloc(chapitreId: string, indexBloc: number): RegleVersets | undefined {
  return NUMEROS_VERSETS[chapitreId]?.[indexBloc]
}

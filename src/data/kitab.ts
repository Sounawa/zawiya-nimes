/* ═══════════════════════════════════════════════════════════════════
   KITĀB AL-ADHKĀR — كتاب الأذكار
   Le recueil en arabe de la zawiya (65 pages). Chaque chapitre
   désigne les pages scannées du livre original, servies telles
   quelles — le texte sacré reste celui du livre imprimé.
   ═══════════════════════════════════════════════════════════════════ */

export interface ChapitreKitab {
  id: string
  /** titre arabe — tel qu'imprimé */
  titreAr: string
  /** translittération latine pour la navigation */
  translit: string
  /** pages du livre scanné (1–65) */
  debut: number
  fin: number
}

export const CHAPITRES_KITAB: ChapitreKitab[] = [
  { id: 'k01', titreAr: 'سُورَةُ يس', translit: 'Sûrat Yâ-Sîn', debut: 4, fin: 8 },
  { id: 'k02', titreAr: 'سُورَةُ الفَتْح', translit: 'Sûrat al-Fatḥ', debut: 9, fin: 12 },
  { id: 'k03', titreAr: 'سُورَةُ الوَاقِعَة', translit: 'Sûrat al-Wâqi‘a', debut: 13, fin: 15 },
  { id: 'k04', titreAr: 'سُورَةُ المُلْك', translit: 'Sûrat al-Mulk', debut: 16, fin: 18 },
  { id: 'k05', titreAr: 'الوَظِيفَة', translit: 'La Waẓîfa', debut: 19, fin: 22 },
  { id: 'k06', titreAr: 'وَظِيفَةُ قَبْلَ الفَجْر', translit: 'Waẓîfa avant le Fajr', debut: 23, fin: 25 },
  { id: 'k07', titreAr: 'وَظِيفَةُ الصُّبْح', translit: 'Waẓîfa aṣ-Ṣubḥ', debut: 26, fin: 27 },
  { id: 'k08', titreAr: 'وَظِيفَةُ السَّفَر', translit: 'Waẓîfa de voyage', debut: 28, fin: 30 },
  { id: 'k09', titreAr: 'التَّقْوِيَة', translit: 'At-Taqwiyya', debut: 31, fin: 31 },
  { id: 'k10', titreAr: 'افتِتَاحُ السِّلْكَة', translit: 'Iftitâḥ as-Silka', debut: 32, fin: 32 },
  { id: 'k11', titreAr: 'خَتْمُ السِّلْكَة', translit: 'Khatm as-Silka', debut: 33, fin: 38 },
  { id: 'k12', titreAr: 'الفِدْيَة', translit: 'Al-Fidya', debut: 39, fin: 40 },
  { id: 'k13', titreAr: 'اللَّطِيفُ ابْنُ حَجَر', translit: 'Laṭîf Ibn Ḥajar', debut: 41, fin: 42 },
  { id: 'k14', titreAr: 'اللَّطِيفُ المُوَحَّد', translit: 'Laṭîf al-Muwaḥḥad', debut: 43, fin: 46 },
  { id: 'k15', titreAr: 'اللَّطِيفُ الكَبِير', translit: 'Laṭîf al-Kabîr', debut: 47, fin: 48 },
  { id: 'k16', titreAr: 'دَلَائِلُ الخَيْرَات', translit: 'Dalâ’il al-Khayrât', debut: 49, fin: 54 },
  { id: 'k17', titreAr: 'الدُّعَاءُ النَّاصِرِي', translit: 'Ad-Du‘â’ an-Nâṣirî', debut: 55, fin: 58 },
  { id: 'k18', titreAr: 'قَصِيدَةُ المُنْفَرِجَة', translit: 'Qaṣîdat al-Munfarija', debut: 59, fin: 61 },
  { id: 'k19', titreAr: 'أَلَا يَا لَطِيفُ', translit: 'A-lâ Yâ Laṭîf', debut: 62, fin: 62 },
  { id: 'k20', titreAr: 'الصَّلَاةُ المَشِيشِيَّة', translit: 'Aṣ-Ṣalât al-Mashîshiyya', debut: 63, fin: 64 },
  { id: 'k21', titreAr: 'الصَّلَاةُ عَلَى النَّبِيّ', translit: 'Aṣ-Ṣalât ‘alâ an-Nabî', debut: 65, fin: 65 },
]

/** Nombre total de pages scannées */
export const PAGES_KITAB = 65

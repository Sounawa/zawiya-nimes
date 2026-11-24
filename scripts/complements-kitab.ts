/* Compléments arabes du kitāb imprimé (audit du 06/10) :
   pieces confirmées par OCR 300dpi + VLM + miroir phonétique.
   Exécuter : bun run scripts/complements-kitab.ts */
import { readFileSync, writeFileSync } from 'fs'

const SADAQA_ADAD = `صَدَقَ اللهُ الْعَظِيمُ وَبَلَّغَ رَسُولُهُ الْمُصْطَفَى الْكَرِيمْ ۞ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ وَنَحْنُ عَلَي ذَٰلِكَ مِنَ اَ۬لشَّاهِدِينَ وَبِهِۦ مُومِنُونَ وَمُصَدِّقُونْ ۞ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ الْعَلِيِّ الْعَظِيمْ ۞ اللهُمَّ اغْفِرْ لَنَا ۞ وَارْحَمْنَا ۞ وَارْحَمْ وَالِدِينَا ۞ وَارْحَمْ مَوْتَانَا ۞ وَارْحَمْ مَنْ عَلَّمَنَا ۞ وَارْحَمْ مَنْ سَبَقَنَا بِالْإِيمَانِ وَارْحَمْ بِفَضْلِكَ جَمِيعَ الْمُسْلِمِينَ وَالْمُسْلِمَاتِ يَا أَرْحَمَ الرَّاحِمِينَ يَا رَبَّ الْعَالَمِينْ ۞ اللهُمَّ اجْعَلْنَا مِنْ شُهَدَاءِ الْحَقِّ الْقَائِمِينَ بِالْقِسْطْ ۞ إِنَّ اللهَ وَمَلَائِكَتَهُۥ يُصَلُّونَ عَلَي اَ۬لنَّبِيّْ ۞ يَا أَيُّهَا اَ۬لذِينَ ءَامَنُوا۟ صَلُّوا۟ عَلَيْهِۦ وَسَلِّمُوا۟ تَسْلِيماٗ ۞ صَلَّى اللهُ عَلَيْهِ وَعَلَى آلِهِ وَصَحْبِهِ وَسَلَّمَ تَسْلِيمْ ۞ اللهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ عَبْدِكَ وَنَبِيِّكَ وَرَسُولِكَ النَّبِيِّ الْأُمِّيِّ وَعَلَى آلِهِ وَصَحْبِهِ وَسَلِّمْ تَسْلِيمًا × ٣ عَدَدَ خَلْقِكَ وَرِضَا نَفْسِكَ وَزِينَةَ عَرْشِكَ وَمِدَادَ كَلِمَاتِكْ ۞ وَرَضِيَ اللهُ تَعَالَىٰ عَنْ سَادَاتِنَا أَصْحَابِ رَسُولِ اللهِ أَجْمَعِينْ ۞`

const SUBHANA = `﴾ سُبْحَانَ رَبِّكَ رَبِّ اَ۬لْعِزَّةِ عَمَّا يَصِفُونَ ۞ وَسَلَامٌ عَلَي اَ۬لْمُرْسَلِينَ ۞ وَالْحَمْدُ لِلَّهِ رَبِّ اَ۬لْعَٰلَمِينَ ﴿`

const JAMALIYYA = `دُعَاء — الصَّلَاةُ الْجَمَالِيَّة
اللهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ الَّذِي مَلَأْتَ قَلْبَهُ مِنْ جَلَالِكْ ۞ وَعَيْنَهُ مِنْ جَمَالِكْ ۞ فَأَصْبَحَ فَرِحٗا مُؤَيَّدٗا مَنْصُورْ ۞ وَعَلَى آلِهِ وَصَحْبِهِ وَسَلِّمْ تَسْلِيمْ ۞ وَالْحَمْدُ لِلَّهِ عَلَى ذَلِكْ`

const REF_JAMALIYYA = `دُعَاء — الصَّلَاةُ الْجَمَالِيَّة`

let src = readFileSync('src/data/kitab-arabe.ts', 'utf8')
const orig = src

/* ─── k05 : la fin complète du kitāb imprimé (ص21-22) ─── */
const K05_FIN = `وَعَلَى آلِهِ وَصَحْبِهِ وَسَلِّمْ تَسْلِيمْ × ٣٠`
const K05_SUITE = `وَعَلَى آلِهِ وَصَحْبِهِ وَسَلِّمْ تَسْلِيمْ × ٣٠

${SADAQA_ADAD}

${SUBHANA}

الدُّعَاءُ النَّاصِرِيُّ ← ص ٥٥
قَصِيدَةُ الْمُنْفَرِجَة ← ص ٥٩

﴾ فَإِنَّ مَعَ اَ۬لْعُسْرِ يُسْرٗا ۞ إِنَّ مَعَ اَ۬لْعُسْرِ يُسْرْ ﴿ × ١٠٠

${JAMALIYYA}

${SUBHANA}`
if (!src.includes(K05_FIN)) throw new Error('k05 : ancre introuvable')
if (src.includes('الدُّعَاءُ النَّاصِرِيُّ ← ص ٥٥\nقَصِيدَةُ الْمُنْفَرِجَة ← ص ٥٩')) {
  console.log('k05 : compléments déjà présents — ignoré')
} else {
  /* l'ancre apparaît aussi dans k14 (muwaḥḥad) ? non : k14 finit sur سبحان —
     on remplace uniquement la PREMIÈRE occurrence (celle de k05) */
  const i = src.indexOf(K05_FIN)
  src = src.slice(0, i) + K05_SUITE + src.slice(i + K05_FIN.length)
  console.log('k05 : sceau Ṣadaqa + salawât + renvois + ﴾فإن مع العسر﴿ + الجمالية ajoutés')
}

/* ─── k06 : le renvoi du'â' seul (bas de ص25) ─── */
const K06_FIN = `﴾ سُبْحَانَ رَبِّكَ رَبِّ اَ۬لْعِزَّةِ عَمَّا يَصِفُونَ ۞ وَسَلَامٌ عَلَي اَ۬لْمُرْسَلِينَ ۞ وَالْحَمْدُ لِلَّهِ رَبِّ اَ۬لْعَٰلَمِينَ ﴿

ءَايَةُ الْكُرْسِيِّ`
// k06 se termine par le sceau ; on ajoute le renvoi après le DERNIER sceau du chapitre k06
// (k06 est le seul chapitre dont le texte finit par "ءَايَةُ الْكُرْسِيِّ" en début de bloc final inversé)
const iK6 = src.indexOf(`    id: 'k06',`)
const iK7 = src.indexOf(`    id: 'k07',`)
let zone6 = src.slice(iK6, iK7)
if (zone6.includes(REF_JAMALIYYA)) {
  console.log('k06 : déjà présent — ignoré')
} else {
  const fin6 = `وَهُوَ اَ۬لْعَلِيُّ اَ۬لْعَظِيمُ ﴿ × ٣

﴾ سُبْحَانَ رَبِّكَ رَبِّ اَ۬لْعِزَّةِ عَمَّا يَصِفُونَ ۞ وَسَلَامٌ عَلَي اَ۬لْمُرْسَلِينَ ۞ وَالْحَمْدُ لِلَّهِ رَبِّ اَ۬لْعَٰلَمِينَ ﴿`
  if (!zone6.includes(fin6)) throw new Error('k06 : fin introuvable')
  zone6 = zone6.replace(fin6, fin6 + '\n\n' + REF_JAMALIYYA)
  src = src.slice(0, iK6) + zone6 + src.slice(iK7)
  console.log('k06 : renvoi du‘â’ الجمالية ajouté')
}

/* ─── k09 : renvoi المنفرجة + renvoi du'â' (bas de ص31) ─── */
const iK9 = src.indexOf(`    id: 'k09',`)
const iK10 = src.indexOf(`    id: 'k10',`)
let zone9 = src.slice(iK9, iK10)
if (zone9.includes(REF_JAMALIYYA)) {
  console.log('k09 : déjà présent — ignoré')
} else {
  const fin9 = `سَيِّدُنَا مُحَمَّدٌ رَسُولُ اللهْ ۞ صَلَّى اللهُ عَلَيْهِ وَعَلَىٰ آلِهِ وَصَحْبِهِ وَسَلَّمَ تَسْلِيمْ

﴾ سُبْحَانَ رَبِّكَ رَبِّ اَ۬لْعِزَّةِ عَمَّا يَصِفُونَ ۞ وَسَلَامٌ عَلَي اَ۬لْمُرْسَلِينَ ۞ وَالْحَمْدُ لِلَّهِ رَبِّ اَ۬لْعَٰلَمِينَ ﴿`
  if (!zone9.includes(fin9)) throw new Error('k09 : fin introuvable')
  zone9 = zone9.replace(
    fin9,
    fin9 + `\n\nقَصِيدَةُ الْمُنْفَرِجَة ← ص ٥٩\n\n${REF_JAMALIYYA}`,
  )
  src = src.slice(0, iK9) + zone9 + src.slice(iK10)
  console.log('k09 : renvoi المنفرجة + du‘â’ الجمالية ajoutés')
}

/* ─── k11 : renvoi ختم دلائل الخيرات (bas de ص38) ─── */
const iK11 = src.indexOf(`    id: 'k11',`)
const iK12 = src.indexOf(`    id: 'k12',`)
let zone11 = src.slice(iK11, iK12)
if (zone11.includes('خَتْمُ دَلَائِلِ الْخَيْرَات ← ص ٤٩')) {
  console.log('k11 : déjà présent — ignoré')
} else {
  const fin11 = `وَرَضِيَ اللهُ تَعَالَىٰ عَنْ سَادَاتِنَا أَصْحَابِ رَسُولِ اللهِ أَجْمَعِينْ ۞

﴾ سُبْحَانَ رَبِّكَ رَبِّ اَ۬لْعِزَّةِ عَمَّا يَصِفُونَ ۞ وَسَلَامٌ عَلَي اَ۬لْمُرْسَلِينَ ۞ وَالْحَمْدُ لِلَّهِ رَبِّ اَ۬لْعَٰلَمِينَ ﴿`
  if (!zone11.includes(fin11)) throw new Error('k11 : fin introuvable')
  zone11 = zone11.replace(
    fin11,
    fin11 + '\n\nخَتْمُ دَلَائِلِ الْخَيْرَات ← ص ٤٩',
  )
  src = src.slice(0, iK11) + zone11 + src.slice(iK12)
  console.log('k11 : renvoi ختم دلائل الخيرات ajouté')
}

/* ─── k13 : salawât + renvois du kitāb (ص42) — dans kitab-arabe-2.ts ─── */
let src2 = readFileSync('src/data/kitab-arabe-2.ts', 'utf8')
const orig2 = src2
const iK13 = src2.indexOf(`    id: 'k13',`)
const iK14 = src2.indexOf(`    id: 'k14',`)
let zone13 = src2.slice(iK13, iK14)
if (zone13.includes('الدُّعَاءُ النَّاصِرِيُّ ← ص ٥٥')) {
  console.log('k13 : déjà présent — ignoré')
} else {
  const avant13 = `إِنَّكَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرْ × ٧٠

جَمَاعِيًّا بِصَوْتٍ عَالْ
سُورَةُ يس ← ص ٧`
  const apres13 = `إِنَّكَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرْ
وَصَلَّى اللهُ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَىٰ آلِهِ وَصَحْبِهِ وَسَلِّمَ تَسْلِيمْ × ٧٠

جَمَاعِيًّا بِصَوْتٍ عَالْ
سُورَةُ يس ← ص ٤
خَتْمُ دَلَائِلِ الْخَيْرَات ← ص ٤٩
قَصِيدَةُ الْمُنْفَرِجَة ← ص ٥٩
الدُّعَاءُ النَّاصِرِيُّ ← ص ٥٥`
  if (!zone13.includes(avant13)) throw new Error('k13 : ancre introuvable')
  zone13 = zone13.replace(avant13, apres13)
  src2 = src2.slice(0, iK13) + zone13 + src2.slice(iK14)
  console.log('k13 : salawât ×٧٠ + renvois (يس ص٤، ختم ص٤٩، منفرجة ص٥٩، ناصري ص٥٥) ajoutés')
}

/* ─── k14 : renvoi du'â' (bas de ص46, parallèle ch08 phonétique) — fichier 2 ─── */
const iK14b = src2.indexOf(`    id: 'k14',`)
const iK15 = src2.indexOf(`    id: 'k15',`)
let zone14 = src2.slice(iK14b, iK15)
if (zone14.includes(REF_JAMALIYYA)) {
  console.log('k14 : déjà présent — ignoré')
} else {
  const fin14 = `أَنتَ مَوْلَانَا فَاَ۪نصُرْنَا عَلَي اَ۬لْقَوْمِ اَ۬لْكَافِرِينَ ﴿

﴾ سُبْحَانَ رَبِّكَ رَبِّ اَ۬لْعِزَّةِ عَمَّا يَصِفُونَ ۞ وَسَلَامٌ عَلَي اَ۬لْمُرْسَلِينَ ۞ وَالْحَمْدُ لِلَّهِ رَبِّ اَ۬لْعَٰلَمِينَ ﴿`
  if (!zone14.includes(fin14)) throw new Error('k14 : fin introuvable')
  zone14 = zone14.replace(fin14, fin14 + '\n\n' + REF_JAMALIYYA)
  src2 = src2.slice(0, iK14b) + zone14 + src2.slice(iK15)
  console.log('k14 : renvoi du‘â’ الجمالية ajouté')
}

if (src !== orig) {
  writeFileSync('src/data/kitab-arabe.ts', src)
  console.log('✓ kitab-arabe.ts mis à jour')
} else {
  console.log('(kitab-arabe.ts inchangé)')
}
if (src2 !== orig2) {
  writeFileSync('src/data/kitab-arabe-2.ts', src2)
  console.log('✓ kitab-arabe-2.ts mis à jour')
} else {
  console.log('(kitab-arabe-2.ts inchangé)')
}

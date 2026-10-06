/* ═══════════════════════════════════════════════════════════════════
   ADHKÂR DE LA ZAWIYA — la présentation des invocations du site
   original : neuf pièces d'origine + Surat al-Fath (onglet 9),
   Surat al-Mulk (onglet 10) et Surat Tâ Hâ (onglet 11), sections
   à part. Chaque pièce ouvre en phonétique ou en arabe. Le cahier
   de wadhifa est organisé en PRATIQUES : chaque pratique garde sa
   version phonétique (cahier imprimé — ou transcription Warsh écrite
   pour la zawiya : Mulk ch33, Tâ Hâ ch34) et/ou sa version arabe
   (kitāb imprimé, Coran en riwāyat Warsh) — plus aucun chapitre ne
   se perd en changeant de langue.
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
      poesie: c.poesie,
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

/* ─── Les onglets à part : LE DOCUMENT, RIEN D'AUTRE ───
   Le cahier et le kitāb impriment après chaque pièce la séquence de
   la wadhifa quotidienne : khatm « Ṣadaqa llâh… », du'â', renvois
   vers les pièces suivantes, « fa-inna ma'a al-'usri yusrân » ×100,
   Ṣalât al-Jamâliyya, sceau ﴿ Subḥâna rabbika… ﴾. Cette séquence
   appartient à la wadhifa — pas à la pièce. L'onglet d'une sourate
   ou d'un poème ne montre QUE la pièce : du ta'awwudh au dernier
   verset. Le cahier de wadhifa, lui, garde le texte imprimé entier. */
function epures(chapitres: ChapitreLecture[], borne: string): ChapitreLecture[] {
  return chapitres.map((c) => {
    const i = c.texte.indexOf(borne)
    return { ...c, texte: (i > 0 ? c.texte.slice(0, i) : c.texte).trimEnd() }
  })
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


/* ─── Surat Ṭā-Hā — le texte Warsh du cahier d'ijtimā' de la zawiya
   (134 versets, orthographe du mushaf maghrébin : اَ۬ wasla, ۦ petit
   yā, ٞ petit wāw Warsh, فِے, nūn lues, waqf ۖ ۗ ۘ ۙ ۚ) ─── */
const TAHA_ARABE: ChapitreLecture[] = [
  {
    id: 'taha-ar',
    titre: 'سُورَةُ طٰهٰ',
    sousTitre: "Tā-Hā — riwāyat Warsh · cahier d'ijtimā'",
    debut: 0,
    fin: 0,
    texte: `أَعُوذُ بِاللهِ مِنَ الشَّيْطَٰنِ الرَّجِيمِ
بِسْمِ اللهِ اَ۬لرَّحْمَٰنِ اَ۬لرَّحِيمِ

﴿ طَه۪ۖ مَآ أَنزَلْنَا عَلَيْكَ اَ۬لْقُرْءَانَ لِتَشْق۪يٰٓ ۞ إِلَّا تَذْكِرَةٗ لِّمَنْ يَّخْش۪يٰۖ ۞ تَنزِيلاٗ مِّمَّنْ خَلَقَ اَ۬لَارْضَ وَالسَّمَٰوَٰتِ اِ۬لْعُلَيۖ ۞ اَ۬لرَّحْمَٰنُ عَلَي اَ۬لْعَرْشِ اِ۪سْتَو۪يٰۖ ۞ لَهُۥ مَا فِے اِ۬لسَّمَٰوَٰتِ وَمَا فِے اِ۬لَارْضِ وَمَا بَيْنَهُمَا وَمَا تَحْتَ اَ۬لثَّر۪يٰۖ ۞ وَإِن تَجْهَرْ بِالْقَوْلِ فَإِنَّهُۥ يَعْلَمُ اُ۬لسِّرَّ وَأَخْفَيۖ ۞ اَ۬للَّهُ لَآ إِلَٰهَ إِلَّا هُوَۖ لَهُ اُ۬لَاسْمَآءُ اُ۬لْحُسْن۪يٰۖ ۞ وَهَلَ اَت۪يٰكَ حَدِيثُ مُوس۪يٰٓ ۞ إِذْ ر۪ء۪ا نَاراٗ فَقَالَ لِأَهْلِهِ اِ۟مْكُثُوٓاْ إِنِّيَ ءَانَسْتُ نَاراٗ لَّعَلِّيَ ءَاتِيكُم مِّنْهَا بِقَبَسٍ اَوَ اَجِدُ عَلَي اَ۬لنّ۪ارِ هُديٗۖ ۞ فَلَمَّآ أَت۪يٰهَا نُودِيَ يَٰمُوس۪يٰٓ ۞ إِنِّيَ أَنَا رَبُّكَ فَاخْلَعْ نَعْلَيْكَ إِنَّكَ بِالْوَادِ اِ۬لْمُقَدَّسِ طُو۪يٰۖ ۞ وَأَنَا اَ۪خْتَرْتُكَ فَاسْتَمِعْ لِمَا يُوح۪يٰٓ ۞ إِنَّنِيَ أَنَا اَ۬للَّهُ لَآ إِلَٰهَ إِلَّآ أَنَا فَاعْبُدْنِے وَأَقِمِ اِ۬لصَّلَوٰةَ لِذِكْرِيَۖ ۞ إِنَّ اَ۬لسَّاعَةَ ءَاتِيَةٌ اَكَادُ أُخْفِيهَا لِتُجْز۪يٰ كُلُّ نَفْسِۢ بِمَا تَسْع۪يٰۖ ۞ فَلَا يَصُدَّنَّكَ عَنْهَا مَن لَّا يُومِنُ بِهَا وَاتَّبَعَ هَو۪يٰهُ فَتَرْد۪يٰۖ ۞ وَمَا تِلْكَ بِيَمِينِكَ يَٰمُوس۪يٰۖ ۞ قَالَ هِيَ عَصَايَ أَتَوَكَّؤُاْ عَلَيْهَا وَأَهُشُّ بِهَا عَلَيٰ غَنَمِے وَلِيَ فِيهَا مَـَٔارِبُ أُخْر۪يٰۖ ۞ قَالَ أَلْقِهَا يَٰمُوس۪يٰۖ ۞ فَأَلْق۪يٰهَا فَإِذَا هِيَ حَيَّةٞ تَسْع۪يٰۖ ۞ قَالَ خُذْهَا وَلَا تَخَفْ سَنُعِيدُهَا سِيرَتَهَا اَ۬لُاول۪يٰۖ ۞ وَاضْمُمْ يَدَكَ إِلَيٰ جَنَاحِكَ تَخْرُجْ بَيْضَآءَ مِنْ غَيْرِ سُوٓءٍ اٰيَةً ا۟خْر۪يٰ ۞ لِنُرِيَكَ مِنَ اٰيَٰتِنَا اَ۬لْكُبْرَيۖ ۞ اَ۪ذْهَبِ اِلَيٰ فِرْعَوْنَ إِنَّهُۥ طَغ۪يٰۖ ۞ قَالَ رَبِّ اِ۪شْرَحْ لِے صَدْرِے ۞ وَيَسِّرْ لِيَ أَمْرِے ۞ وَاحْلُلْ عُقْدَةٗ مِّن لِّسَانِے ۞ يَفْقَهُواْ قَوْلِے ۞ وَاجْعَل لِّے وَزِيراٗ مِّنَ اَهْلِے ۞ هَٰرُونَ أَخِےۖ ۞ اِ۟شْدُدْ بِهِۦٓ أَزْرِے ۞ وَأَشْرِكْهُ فِےٓ أَمْرِے ۞ كَےْ نُسَبِّحَكَ كَثِيراٗ ۞ وَنَذْكُرَكَ كَثِيراً ۞ اِنَّكَ كُنتَ بِنَا بَصِيراٗۖ ۞قَالَ قَدُ ا۟وتِيتَ سُؤْلَكَ يَٰمُوس۪يٰۖ ۞ وَلَقَدْ مَنَنَّا عَلَيْكَ مَرَّةً ا۟خْر۪يٰٓ ۞ إِذَ اَوْحَيْنَآ إِلَيٰٓ أُمِّكَ مَا يُوح۪يٰٓ ۞ أَنِ اِ۪قْذِفِيهِ فِے اِ۬لتَّابُوتِ فَاقْذِفِيهِ فِے اِ۬لْيَمِّ فَلْيُلْقِهِ اِ۬لْيَمُّ بِالسَّاحِلِ يَاخُذْهُ عَدُوّٞ لِّے وَعَدُوّٞ لَّهُۥۖ وَأَلْقَيْتُ عَلَيْكَ مَحَبَّةٗ مِّنِّے ۞ وَلِتُصْنَعَ عَلَيٰ عَيْنِيَ ۞ إِذْ تَمْشِےٓ أُخْتُكَ فَتَقُولُ هَلَ اَدُلُّكُمْ عَلَيٰ مَنْ يَّكْفُلُهُۥۖ فَرَجَعْنَٰكَ إِلَيٰٓ أُمِّكَ كَےْ تَقَرَّ عَيْنُهَا وَلَا تَحْزَنَۖ وَقَتَلْتَ نَفْساٗ فَنَجَّيْنَٰكَ مِنَ اَ۬لْغَمِّ وَفَتَنَّٰكَ فُتُوناٗۖ فَلَبِثْتَ سِنِينَ فِےٓ أَهْلِ مَدْيَنَ ثُمَّ جِئْتَ عَلَيٰ قَدَرٖ يَٰمُوس۪يٰۖ ۞ وَاصْطَنَعْتُكَ لِنَفْسِيَۖ اَ۪ذْهَبَ اَنتَ وَأَخُوكَ بِـَٔايَٰتِے وَلَا تَنِيَا فِے ذِكْرِيَۖ ۞ اَ۪ذْهَبَآ إِلَيٰ فِرْعَوْنَ إِنَّهُۥ طَغ۪يٰ ۞ فَقُولَا لَهُۥ قَوْلاٗ لَّيِّناٗ لَّعَلَّهُۥ يَتَذَكَّرُ أَوْ يَخْش۪يٰۖ ۞ قَالَا رَبَّنَآ إِنَّنَا نَخَافُ أَنْ يَّفْرُطَ عَلَيْنَآ أَوَ اَنْ يَّطْغ۪يٰۖ ۞ قَالَ لَا تَخَافَآ إِنَّنِے مَعَكُمَآ أَسْمَعُ وَأَر۪يٰۖ ۞ فَاتِيَٰهُ فَقُولَآ إِنَّا رَسُولَا رَبِّكَ فَأَرْسِلْ مَعَنَا بَنِےٓ إِسْرَآءِيلَ وَلَا تُعَذِّبْهُمْ قَدْ جِئْنَٰكَ بِـَٔايَةٖ مِّن رَّبِّكَۖ وَالسَّلَٰمُ عَلَيٰ مَنِ اِ۪تَّبَعَ اَ۬لْهُد۪يٰٓۖ ۞ إِنَّا قَدُ ا۟وحِيَ إِلَيْنَآ أَنَّ اَ۬لْعَذَابَ عَلَيٰ مَن كَذَّبَ وَتَوَلّ۪يٰۖ ۞ قَالَ فَمَن رَّبُّكُمَا يَٰمُوس۪يٰۖ ۞ قَالَ رَبُّنَا اَ۬لذِےٓ أَعْط۪يٰ كُلَّ شَےْءٍ خَلْقَهُۥ ثُمَّ هَد۪يٰۖ ۞ قَالَ فَمَا بَالُ اُ۬لْقُرُونِ اِ۬لُاول۪يٰۖ ۞ قَالَ عِلْمُهَا عِندَ رَبِّے فِے كِتَٰبٖۖ لَّا يَضِلُّ رَبِّے وَلَا يَنسَيۖ ۞ اَ۬لذِے جَعَلَ لَكُمُ اُ۬لَارْضَ مِهَٰداٗ وَسَلَكَ لَكُمْ فِيهَا سُبُلاٗ وَأَنزَلَ مِنَ اَ۬لسَّمَآءِ مَآءٗ فَأَخْرَجْنَا بِهِۦٓ أَزْوَٰجاٗ مِّن نَّبَاتٖ شَتّ۪يٰۖ ۞ كُلُواْ وَارْعَوَاْ اَنْعَٰمَكُمُۥٓۖ إِنَّ فِے ذَٰلِكَ لَأٓيَٰتٖ لِّأُوْلِے اِ۬لنُّه۪يٰۖ ۞مِنْهَا خَلَقْنَٰكُمْ وَفِيهَا نُعِيدُكُمْ وَمِنْهَا نُخْرِجُكُمْ تَارَةً ا۟خْر۪يٰۖ ۞ وَلَقَدَ اَرَيْنَٰهُ ءَايَٰتِنَا كُلَّهَا فَكَذَّبَ وَأَب۪يٰۖ ۞ قَالَ أَجِئْتَنَا لِتُخْرِجَنَا مِنَ اَرْضِنَا بِسِحْرِكَ يَٰمُوس۪يٰ ۞ فَلَنَاتِيَنَّكَ بِسِحْرٖ مِّثْلِهِۦ فَاجْعَلْ بَيْنَنَا وَبَيْنَكَ مَوْعِداٗ لَّا نُخْلِفُهُۥ نَحْنُ وَلَآ أَنتَ مَكَاناٗ سِويٗۖ ۞ قَالَ مَوْعِدُكُمْ يَوْمُ اُ۬لزِّينَةِ وَأَنْ يُّحْشَرَ اَ۬لنَّاسُ ضُحيٗۖ ۞ فَتَوَلّ۪يٰ فِرْعَوْنُ فَجَمَعَ كَيْدَهُۥ ثُمَّ أَت۪يٰۖ ۞ قَالَ لَهُم مُّوس۪يٰ وَيْلَكُمْ لَا تَفْتَرُواْ عَلَي اَ۬للَّهِ كَذِباٗ فَيَسْحَتَكُم بِعَذَابٖۖ وَقَدْ خَابَ مَنِ اِ۪فْتَر۪يٰۖ ۞ فَتَنَٰزَعُوٓاْ أَمْرَهُم بَيْنَهُمْ وَأَسَرُّواْ اُ۬لنَّجْو۪يٰۖ ۞ قَالُوٓاْ إِنَّ هَٰذَٰنِ لَسَٰحِرَٰنِ يُرِيدَٰنِ أَنْ يُّخْرِجَٰكُم مِّنَ اَرْضِكُم بِسِحْرِهِمَا وَيَذْهَبَا بِطَرِيقَتِكُمُ اُ۬لْمُثْل۪يٰۖ ۞ فَأَجْمِعُواْ كَيْدَكُمْ ثُمَّ اَ۪يتُواْ صَفّاٗۖ وَقَدَ اَفْلَحَ اَ۬لْيَوْمَ مَنِ اِ۪سْتَعْل۪يٰۖ ۞ قَالُواْ يَٰمُوس۪يٰٓ إِمَّآ أَن تُلْقِيَ وَإِمَّآ أَن نَّكُونَ أَوَّلَ مَنَ اَلْق۪يٰۖ ۞ قَالَ بَلَ اَلْقُواْۖ فَإِذَا حِبَالُهُمْ وَعِصِيُّهُمْ يُخَيَّلُ إِلَيْهِ مِن سِحْرِهِمُۥٓ أَنَّهَا تَسْع۪يٰۖ ۞ فَأَوْجَسَ فِے نَفْسِهِۦ خِيفَةٗ مُّوس۪يٰۖ ۞ قُلْنَا لَا تَخَفِ اِنَّكَ أَنتَ اَ۬لَاعْل۪يٰۖ ۞ وَأَلْقِ مَا فِے يَمِينِكَ تَلَقَّفْ مَا صَنَعُوٓاْۖ إِنَّمَا صَنَعُواْ كَيْدُ سَٰحِرٖۖ وَلَا يُفْلِحُ اُ۬لسَّاحِرُ حَيْثُ أَت۪يٰۖ ۞ فَأُلْقِيَ اَ۬لسَّحَرَةُ سُجَّداٗ قَالُوٓاْ ءَامَنَّا بِرَبِّ هَٰرُونَ وَمُوس۪يٰۖ ۞ قَالَ ءَاٰ۬مَنتُمْ لَهُۥ قَبْلَ أَنَ اٰذَنَ لَكُمُۥٓ إِنَّهُۥ لَكَبِيرُكُمُ اُ۬لذِے عَلَّمَكُمُ اُ۬لسِّحْرَۖ فَلَأُقَطِّعَنَّ أَيْدِيَكُمْ وَأَرْجُلَكُم مِّنْ خِلَٰفٖ وَلَأُصَلِّبَنَّكُمْ فِے جُذُوعِ اِ۬لنَّخْلِ وَلَتَعْلَمُنَّ أَيُّنَآ أَشَدُّ عَذَاباٗ وَأَبْق۪يٰۖ ۞قَالُواْ لَن نُّوثِرَكَ عَلَيٰ مَا جَآءَنَا مِنَ اَ۬لْبَيِّنَٰتِ وَالذِے فَطَرَنَاۖ فَاقْضِ مَآ أَنتَ قَاضٍۖ اِنَّمَا تَقْضِے هَٰذِهِ اِ۬لْحَيَوٰةَ اَ۬لدُّنْي۪آۖ ۞ إِنَّآ ءَامَنَّا بِرَبِّنَا لِيَغْفِرَ لَنَا خَطَٰيٰ۪نَا وَمَآ أَكْرَهْتَنَا عَلَيْهِ مِنَ اَ۬لسِّحْرِۖ وَاللَّهُ خَيْرٞ وَأَبْق۪يٰٓۖ ۞ إِنَّهُۥ مَنْ يَّاتِ رَبَّهُۥ مُجْرِماٗ فَإِنَّ لَهُۥ جَهَنَّمَ لَا يَمُوتُ فِيهَا وَلَا يَحْي۪يٰۖ ۞ وَمَنْ يَّاتِهِۦ مُومِناٗ قَدْ عَمِلَ اَ۬لصَّٰلِحَٰتِ فَأُوْلَٰٓئِكَ لَهُمُ اُ۬لدَّرَجَٰتُ اُ۬لْعُل۪يٰۖ ۞ جَنَّٰتُ عَدْنٖ تَجْرِے مِن تَحْتِهَا اَ۬لَانْهَٰرُ خَٰلِدِينَ فِيهَاۖ وَذَٰلِكَ جَزَآءُ مَن تَزَكّ۪يٰۖ ۞ وَلَقَدَ اَوْحَيْنَآ إِلَيٰ مُوس۪يٰٓ أَنِ اِ۪سْرِ بِعِبَادِے فَاضْرِبْ لَهُمْ طَرِيقاٗ فِے اِ۬لْبَحْرِ يَبَساٗ لَّا تَخَٰفُ دَرَكاٗ وَلَا تَخْش۪يٰۖ ۞ فَأَتْبَعَهُمْ فِرْعَوْنُ بِجُنُودِهِۦ فَغَشِيَهُم مِّنَ اَ۬لْيَمِّ مَا غَشِيَهُمْۖ وَأَضَلَّ فِرْعَوْنُ قَوْمَهُۥ وَمَا هَد۪يٰۖ ۞ يَٰبَنِےٓ إِسْرَآءِيلَ قَدَ اَنجَيْنَٰكُم مِّنْ عَدُوِّكُمْ وَوَٰعَدْنَٰكُمْ جَانِبَ اَ۬لطُّورِ اِ۬لَايْمَنَ وَنَزَّلْنَا عَلَيْكُمُ اُ۬لْمَنَّ وَالسَّلْو۪يٰۖ ۞ كُلُواْ مِن طَيِّبَٰتِ مَا رَزَقْنَٰكُمْ وَلَا تَطْغَوْاْ فِيهِ فَيَحِلَّ عَلَيْكُمْ غَضَبِےۖ وَمَنْ يَّحْلِلْ عَلَيْهِ غَضَبِے فَقَدْ هَو۪يٰۖ ۞ وَإِنِّے لَغَفَّارٞ لِّمَن تَابَ وَءَامَنَ وَعَمِلَ صَٰلِحاٗ ثُمَّ اَ۪هْتَد۪يٰۖ ۞وَمَآ أَعْجَلَكَ عَن قَوْمِكَ يَٰمُوس۪يٰۖ ۞ قَالَ هُمُۥٓ أُوْلَآءِ عَلَيٰٓ أَثَرِے وَعَجِلْتُ إِلَيْكَ رَبِّ لِتَرْض۪يٰۖ ۞ قَالَ فَإِنَّا قَدْ فَتَنَّا قَوْمَكَ مِنۢ بَعْدِكَ وَأَضَلَّهُمُ اُ۬لسَّامِرِيُّۖ ۞ فَرَجَعَ مُوس۪يٰٓ إِلَيٰ قَوْمِهِۦ غَضْبَٰنَ أَسِفاٗۖ قَالَ يَٰقَوْمِ أَلَمْ يَعِدْكُمْ رَبُّكُمْ وَعْداً حَسَناًۖ ۞ اَفَطَالَ عَلَيْكُمُ اُ۬لْعَهْدُ أَمَ اَرَدتُّمُۥٓ أَنْ يَّحِلَّ عَلَيْكُمْ غَضَبٞ مِّن رَّبِّكُمْ فَأَخْلَفْتُم مَّوْعِدِےۖ ۞ قَالُواْ مَآ أَخْلَفْنَا مَوْعِدَكَ بِمَلْكِنَا وَلَٰكِنَّا حُمِّلْنَآ أَوْزَاراٗ مِّن زِينَةِ اِ۬لْقَوْمِ فَقَذَفْنَٰهَا فَكَذَٰلِكَ أَلْقَي اَ۬لسَّامِرِيُّۖ فَأَخْرَجَ لَهُمْ عِجْلاٗ جَسَداٗ لَّهُۥ خُوَارٞ فَقَالُواْ هَٰذَآ إِلَٰهُكُمْ وَإِلَٰهُ مُوس۪يٰ فَنَسِيَۖ ۞ أَفَلَا يَرَوْنَ أَلَّا يَرْجِعُ إِلَيْهِمْ قَوْلاٗ ۞ وَلَا يَمْلِكُ لَهُمْ ضَرّاٗ وَلَا نَفْعاٗۖ ۞ وَلَقَدْ قَالَ لَهُمْ هَٰرُونُ مِن قَبْلُ يَٰقَوْمِ إِنَّمَا فُتِنتُم بِهِۦۖ وَإِنَّ رَبَّكُمُ اُ۬لرَّحْمَٰنُ فَاتَّبِعُونِے وَأَطِيعُوٓاْ أَمْرِےۖ ۞ قَالُواْ لَن نَّبْرَحَ عَلَيْهِ عَٰكِفِينَ حَتَّيٰ يَرْجِعَ إِلَيْنَا مُوس۪يٰۖ ۞ قَالَ يَٰهَٰرُونُ مَا مَنَعَكَ إِذْ رَأَيْتَهُمْ ضَلُّوٓاْ أَلَّا تَتَّبِعَنِۦٓ أَفَعَصَيْتَ أَمْرِےۖ ۞ قَالَ يَبْنَؤُمَّ لَا تَاخُذْ بِلِحْيَتِے وَلَا بِرَأْسِيَ إِنِّے خَشِيتُ أَن تَقُولَ فَرَّقْتَ بَيْنَ بَنِےٓ إِسْرَآءِيلَ وَلَمْ تَرْقُبْ قَوْلِےۖ ۞ قَالَ فَمَا خَطْبُكَ يَٰسَٰمِرِيُّۖ ۞ قَالَ بَصُرْتُ بِمَا لَمْ يَبْصُرُواْ بِهِۦ فَقَبَضْتُ قَبْضَةٗ مِّنَ اَثَرِ اِ۬لرَّسُولِ فَنَبَذْتُهَا وَكَذَٰلِكَ سَوَّلَتْ لِے نَفْسِےۖ ۞قَالَ فَاذْهَبْ فَإِنَّ لَكَ فِے اِ۬لْحَيَوٰةِ أَن تَقُولَ لَا مِسَاسَۖ وَإِنَّ لَكَ مَوْعِداٗ لَّن تُخْلَفَهُۥۖ وَانظُرِ اِلَيٰٓ إِلَٰهِكَ اَ۬لذِے ظَلْتَ عَلَيْهِ عَاكِفاٗۖ لَّنُحَرِّقَنَّهُۥ ثُمَّ لَنَنسِفَنَّهُۥ فِے اِ۬لْيَمِّ نَسْفاًۖ ۞ اِنَّمَآ إِلَٰهُكُمُ اُ۬للَّهُ اُ۬لذِے لَآ إِلَٰهَ إِلَّا هُوَۖ وَسِعَ كُلَّ شَےْءٍ عِلْماٗۖ ۞ كَذَٰلِكَ نَقُصُّ عَلَيْكَ مِنَ اَنۢبَآءِ مَا قَدْ سَبَقَۖ وَقَدَ اٰتَيْنَٰكَ مِن لَّدُنَّا ذِكْراٗۖ ۞ مَّنَ اَعْرَضَ عَنْهُ فَإِنَّهُۥ يَحْمِلُ يَوْمَ اَ۬لْقِيَٰمَةِ وِزْراً ۞ خَٰلِدِينَ فِيهِۖ وَسَآءَ لَهُمْ يَوْمَ اَ۬لْقِيَٰمَةِ حِمْلاٗۖ ۞ يَوْمَ يُنفَخُ فِے اِ۬لصُّورِ وَنَحْشُرُ اُ۬لْمُجْرِمِينَ يَوْمَئِذٖ زُرْقاٗ ۞ يَتَخَٰفَتُونَ بَيْنَهُمُۥٓ إِن لَّبِثْتُمُۥٓ إِلَّا عَشْراٗۖ ۞ نَّحْنُ أَعْلَمُ بِمَا يَقُولُونَ إِذْ يَقُولُ أَمْثَلُهُمْ طَرِيقَةً اِن لَّبِثْتُمُۥٓ إِلَّا يَوْماٗۖ ۞ وَيَسْـَٔلُونَكَ عَنِ اِ۬لْجِبَالِ فَقُلْ يَنسِفُهَا رَبِّے نَسْفاٗ ۞ فَيَذَرُهَا قَاعاٗ صَفْصَفاٗ لَّا تَر۪يٰ فِيهَا عِوَجاٗ وَلَآ أَمْتاٗۖ ۞ يَوْمَئِذٖ يَتَّبِعُونَ اَ۬لدَّاعِيَ لَا عِوَجَ لَهُۥۖ وَخَشَعَتِ اِ۬لَاصْوَاتُ لِلرَّحْمَٰنِ فَلَا تَسْمَعُ إِلَّا هَمْساٗۖ ۞ يَوْمَئِذٖ لَّا تَنفَعُ اُ۬لشَفَٰعَةُ إِلَّا مَنَ اَذِنَ لَهُ اُ۬لرَّحْمَٰنُ وَرَضِيَ لَهُۥ قَوْلاٗۖ ۞ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِهِۦ عِلْماٗۖ ۞وَعَنَتِ اِ۬لْوُجُوهُ لِلْحَيِّ اِ۬لْقَيُّومِۖ وَقَدْ خَابَ مَنْ حَمَلَ ظُلْماٗۖ ۞ وَمَنْ يَّعْمَلْ مِنَ اَ۬لصَّٰلِحَٰتِ وَهُوَ مُومِنٞ فَلَا يَخَافُ ظُلْماٗ وَلَا هَضْماٗۖ ۞ وَكَذَٰلِكَ أَنزَلْنَٰهُ قُرْءَاناً عَرَبِيّاٗ وَصَرَّفْنَا فِيهِ مِنَ اَ۬لْوَعِيدِ لَعَلَّهُمْ يَتَّقُونَ أَوْ يُحْدِثُ لَهُمْ ذِكْراٗۖ ۞ فَتَعَٰلَي اَ۬للَّهُ اُ۬لْمَلِكُ اُ۬لْحَقُّۖ وَلَا تَعْجَلْ بِالْقُرْءَانِ مِن قَبْلِ أَنْ يُّقْض۪يٰٓ إِلَيْكَ وَحْيُهُۥۖ وَقُل رَّبِّ زِدْنِے عِلْماٗۖ ۞ وَلَقَدْ عَهِدْنَآ إِلَيٰٓ ءَادَمَ مِن قَبْلُ فَنَسِيَ وَلَمْ نَجِدْ لَهُۥ عَزْماٗۖ ۞ وَإِذْ قُلْنَا لِلْمَلَٰٓئِكَةِ اِ۟سْجُدُواْ لِأٓدَمَ فَسَجَدُوٓاْ إِلَّآ إِبْلِيسَ أَب۪يٰۖ ۞ فَقُلْنَا يَٰٓـَٔادَمُ إِنَّ هَٰذَا عَدُوّٞ لَّكَ وَلِزَوْجِكَ فَلَا يُخْرِجَنَّكُمَا مِنَ اَ۬لْجَنَّةِ فَتَشْق۪يٰٓۖ ۞ إِنَّ لَكَ أَلَّا تَجُوعَ فِيهَا وَلَا تَعْر۪يٰۖ ۞ وَإِنَّكَ لَا تَظْمَؤُاْ فِيهَا وَلَا تَضْح۪يٰۖ ۞ فَوَسْوَسَ إِلَيْهِ اِ۬لشَّيْطَٰنُ قَالَ يَٰٓـَٔادَمُ هَلَ اَدُلُّكَ عَلَيٰ شَجَرَةِ اِ۬لْخُلْدِ وَمُلْكٖ لَّا يَبْل۪يٰۖ ۞ فَأَكَلَا مِنْهَا فَبَدَتْ لَهُمَا سَوْءَٰتُهُمَا وَطَفِقَا يَخْصِفَٰنِ عَلَيْهِمَا مِنْ وَّرَقِ اِ۬لْجَنَّةِۖ وَعَص۪يٰٓ ءَادَمُ رَبَّهُۥ فَغَو۪يٰۖ ۞ ثُمَّ اَ۪جْتَبٰ۪هُ رَبُّهُۥ فَتَابَ عَلَيْهِ وَهَد۪يٰۖ ۞ قَالَ اَ۪هْبِطَا مِنْهَا جَمِيعاَۢۖ بَعْضُكُمْ لِبَعْضٍ عَدُوّٞۖ فَإِمَّا يَاتِيَنَّكُم مِّنِّے هُديٗ ۞ فَمَنِ اِ۪تَّبَعَ هُد۪ايَ فَلَا يَضِلُّ وَلَا يَشْق۪يٰۖ ۞ وَمَنَ اَعْرَضَ عَن ذِكْرِے فَإِنَّ لَهُۥ مَعِيشَةٗ ضَنكاٗ وَنَحْشُرُهُۥ يَوْمَ اَ۬لْقِيَٰمَةِ أَعْم۪يٰۖ ۞ قَالَ رَبِّ لِمَ حَشَرْتَنِيَ أَعْم۪يٰ وَقَدْ كُنتُ بَصِيراٗۖ ۞قَالَ كَذَٰلِكَ أَتَتْكَ ءَايَٰتُنَا فَنَسِيتَهَاۖ وَكَذَٰلِكَ اَ۬لْيَوْمَ تُنس۪يٰۖ ۞ وَكَذَٰلِكَ نَجْزِے مَنَ اَسْرَفَ وَلَمْ يُومِنۢ بِـَٔايَٰتِ رَبِّهِۦۖ وَلَعَذَابُ اُ۬لَاخِرَةِ أَشَدُّ وَأَبْق۪يٰٓۖ ۞ أَفَلَمْ يَهْدِ لَهُمْ كَمَ اَهْلَكْنَا قَبْلَهُم مِّنَ اَ۬لْقُرُونِ يَمْشُونَ فِے مَسَٰكِنِهِمُۥٓۖ إِنَّ فِے ذَٰلِكَ لَأٓيَٰتٖ لِّأُوْلِے اِ۬لنُّه۪يٰۖ ۞ وَلَوْلَا كَلِمَةٞ سَبَقَتْ مِن رَّبِّكَ لَكَانَ لِزَاماٗ وَأَجَلٞ مُّسَمّيٗۖ ۞ فَاصْبِرْ عَلَيٰ مَا يَقُولُونَ وَسَبِّحْ بِحَمْدِ رَبِّكَ قَبْلَ طُلُوعِ اِ۬لشَّمْسِ وَقَبْلَ غُرُوبِهَاۖ وَمِنَ اٰنَآءِےْ اِ۬ليْلِ فَسَبِّحْ وَأَطْرَافَ اَ۬لنَّه۪ارِ لَعَلَّكَ تَرْض۪يٰۖ ۞ وَلَا تَمُدَّنَّ عَيْنَيْكَ إِلَيٰ مَا مَتَّعْنَا بِهِۦٓ أَزْوَٰجاٗ مِّنْهُمْ زَهْرَةَ اَ۬لْحَيَوٰةِ اِ۬لدُّنْي۪ا ۞ لِنَفْتِنَهُمْ فِيهِۖ وَرِزْقُ رَبِّكَ خَيْرٞ وَأَبْق۪يٰۖ ۞ وَامُرَ اَهْلَكَ بِالصَّلَوٰةِ وَاصْطَبِرْ عَلَيْهَاۖ لَا نَسْـَٔلُكَ رِزْقاٗ نَّحْنُ نَرْزُقُكَۖ وَالْعَٰقِبَةُ لِلتَّقْو۪يٰۖ ۞ وَقَالُواْ لَوْلَا يَاتِينَا بِـَٔايَةٖ مِّن رَّبِّهِۦٓۖ أَوَلَمْ تَاتِهِم بَيِّنَةُ مَا فِے اِ۬لصُّحُفِ اِ۬لُاول۪يٰۖ ۞ وَلَوَ اَنَّآ أَهْلَكْنَٰهُم بِعَذَابٖ مِّن قَبْلِهِۦ لَقَالُواْ رَبَّنَا لَوْلَآ أَرْسَلْتَ إِلَيْنَا رَسُولاٗ فَنَتَّبِعَ ءَايَٰتِكَ مِن قَبْلِ أَن نَّذِلَّ وَنَخْز۪يٰۖ ۞ قُلْ كُلّٞ مُّتَرَبِّصٞ فَتَرَبَّصُواْۖ فَسَتَعْلَمُونَ مَنَ اَصْحَٰبُ اُ۬لصِّرَٰطِ اِ۬لسَّوِيِّ وَمَنِ اِ۪هْتَدَيۖ ۞ ﴾

﴿ سُبْحَانَ رَبِّكَ رَبِّ الْعِزَّةِ عَمَّا يَصِفُونَ ۞ وَسَلَامٌ عَلَى الْمُرْسَلِينَ ۞ وَالْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴾`,
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
  { id: 'w-mulk', groupe: 'quotidien', ph: cahier('ch33-sratmulk'), ar: kitab('k04') },
  { id: 'w-taha', groupe: 'quotidien', ph: cahier('ch34-srattaha'), ar: kitab('k22') },
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
  return c
    ? { id: c.id, titre: c.titre, sousTitre: '', debut: c.debut, fin: c.fin, texte: c.texte, poesie: c.poesie }
    : undefined
}
function kitab(id: string): ChapitreLecture | undefined {
  const c = CHAPITRES_ARABES.find((x) => x.id === id)
  return c
    ? { id: c.id, titre: c.titreAr, sousTitre: c.translit, debut: c.debut, fin: c.fin, texte: c.texte, poesie: c.poesie }
    : undefined
}

/* ═══ Les documents de la zawiya ════════════════════════════════════
   Les pièces du site original — le cahier de wadhifa d'abord (1),
   puis les sourates et poèmes à part, CHACUN DANS SON ONGLET : la
   pièce et rien d'autre (les séquences de la wadhifa qui suivent
   l'imprimé — khatm, du'â', renvois, ×100, Ṣalât al-Jamâliyya —
   restent dans le cahier de wadhifa). Ordre demandé par la zawiya :
   Yâ-Sîn (2), la Wāqi'a (3), le Nasirî et la Munfarija (4), le
   Laṭîf (5), le Zajr (6), la Mashîshiyya (7), les Dalâ'il (8), puis
   Al-Fatḥ en 9ᵉ position et Al-Mulk en 10ᵉ, Ṭā-Hā en 11ᵉ — le cahier
   de samâ‘ a sa propre section en bas de page, il est filtré de la
   liste numérotée. */
export const DOCUMENTS_ADHKAR: DocAdhkar[] = [
  {
    id: 'kitab',
    titreFr: 'Cahier de Wadhifa',
    titreAr: 'كتاب الأذكار',
    detailFr: '36 pratiques · phonétique & arabe · sommaire',
    detailAr: '٣٦ فصلًا · صوتي وعربي',
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
    ph: epures(depuisCahier(['ch02-sratysn']), '﴿Subḥâna rabbika'),
    ar: epures(depuisKitab(['k01']), '﴿ سُبْحَانَ رَبِّك'),
  },
  {
    id: 'waqia',
    titreFr: "Surat al-Waqi'a",
    titreAr: 'سورة الواقعة',
    detailFr: "l'inéluctable",
    detailAr: 'الواقعة الكبرى',
    pdfPh: '/adhkar/waqia-ph.pdf',
    pdfAr: '/adhkar/waqia-ar.pdf',
    ph: epures(depuisCahier(['ch04-sratalwqia']), 'Ṣadaqa llâhul'),
    ar: epures(depuisKitab(['k03']), 'صَدَقَ اللهُ'),
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
    ar: [
      ...depuisKitab(['k17']),
      ...epures(depuisKitab(['k18']), '﴿ فَإِنَّ مَعَ الْعُسْرِ'),
    ],
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
    ph: [
      ...depuisCahier(['ch17-iftitassilkaiftitd']),
      ...epures(depuisCahier(['ch19-khatmdalilalkhayrt']), 'Du‘â- an Nâṣiriy'),
    ],
    ar: epures(depuisKitab(['k16']), 'الدُّعَاءُ النَّاصِرِيُّ ←'),
  },
  /* ── Les trois sections à part, demandées par la zawiya —
     onglets 9, 10 et 11, après les pièces du site original ── */
  {
    id: 'fath',
    titreFr: 'Surat al-Fath',
    titreAr: 'سُورَةُ الفَتْح',
    detailFr: "l'ouverture de la victoire — riwāyat Warsh",
    detailAr: 'سورة الفتح',
    ph: epures(depuisCahier(['ch12-sratalfat']), '﴿Subḥâna rabbika'),
    ar: epures(depuisKitab(['k02']), '﴿ سُبْحَانَ رَبِّك'),
  },
  {
    id: 'mulk',
    titreFr: 'Surat al-Mulk',
    titreAr: 'سُورَةُ المُلْك',
    detailFr: 'la royauté — riwāyat Warsh',
    detailAr: 'سورة الملك',
    ph: depuisCahier(['ch33-sratmulk']),
    ar: depuisKitab(['k04']),
  },
  {
    id: 'taha',
    titreFr: 'Surat Tâ Hâ',
    titreAr: 'سُورَةُ طه',
    detailFr: "la sourate du commandement — riwāyat Warsh",
    detailAr: 'سورة طه',
    ph: depuisCahier(['ch34-srattaha']),
    ar: depuisKitab(['k22']),
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
    .replace(/[۞٭«»﴿﴾:،.]/g, ' ')
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

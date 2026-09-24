# Worklog — Zaouia St Denis (Clone amélioré)

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Exploration du site original https://zaouia-st-denis.netlify.app/ et planification du clone

Work Log:
- Lu le site original via page_reader + agent-browser (navigation, clics, formulaires)
- Structure identifiée :
  - Écran d'entrée : logo calligraphie + "ZAOUIA ST DENIS" + citation Sidi Hamza + champ prénom
  - Header : logo tariqa.png (85x74), titre, user + notifications
  - Barre date + prochaine prière + compte à rebours (ASR 17:00 · dans X min)
  - Annonces : cartes vertes (Latîf al-Kabîr) et corail/rouge (ANNONCE)
  - AL-IJTIMÂ' : événements groupés par semaine (JEU 24 Latîf al-Kabîr 19:30–22:15 · 20 attendus · 3 inv.)
    - Détail événement : bouton "Je viendrai", "N attendus ▸" (liste "Sidi X"), "N invités ▸"
  - ADHKÂR, SALÂT (Jour/Semaine/Mois + heures Fajr/Chourouq/Dohr/Asr/Maghreb/Icha), QUR'ÂN, SAMÂ', DURÛS
  - FAB : ＋ Réunion / ＋ Semaine
  - Formulaire Nouvelle réunion : Modèle (Lundi, Jeudi, samedi, Samedi Sadaqa), Ville, Date, Objet, Icône, Adresse, Début, Fin, Annonce du jour, Le mot, Invités, Programme, Annuler/Publier
- Membres originaux observés : Sidi Abde, Adam, Ayoub, Badr, BRAHIM, El Hadji, Fotana, Ghafir, Moaade, Mohamed, Monsef, Mostafa, Mustafa, Nabil, Rahhal, Samy, Sidi Youssef
- Logo original tariqa.png copié dans /public/tariqa.png et /public/logo.png (placeholder — le fichier téléchargement.png de l'utilisateur n'est PAS arrivé dans /upload/)
- config.js original : nom "St Denis", ville Saint-Denis, lieu 28 rue Fontaine St Denis, Supabase backend (remplacé par Prisma+SQLite ici)

Stage Summary:
- App originale = SPA noire/vert émeraude avec backend Supabase. Le clone sera en Next.js 16 + Prisma + thème clair (fond blanc demandé), nouvelles couleurs (vert profond + or), logo animé en page d'accueil, + sections Cotisation, Ziyara (calcul auto), Sondages, rôles (tous admin + trésorier unique).
- Prochaines étapes : schéma Prisma, API, UI complète.

---
Task ID: 2
Agent: main (Z.ai Code)
Task: Développement complet du clone Zaouia St Denis (backend + frontend)

Work Log:
- Schéma Prisma : Member (rôles ADMIN/TREASURER), Meeting, Attendance, Contribution (COTISATION/ZIYARA/DON), Poll, PollVote, Announcement, ContentItem (ADHKAR/QURAN/SAMA/DURUS), Setting (ijtima_days configurable)
- Seed : 17 membres (Abde, Adam, Ayoub, Badr, BRAHIM, El Hadji, Fotana, Ghafir, Moaade, Mohamed, Monsef, Mostafa, Mustafa, Nabil, Rahhal, Samy, Sidi Youssef), 2 annonces, 3 réunions, présences, 24 contributions (17 cotisations + 7 ziyara), 1 sondage, contenus Adhkâr/Qur'ân/Samâ'/Durûs, réglages
- API : /api/members (rôle TRÉSORIER unique auto-démoté), /api/meetings, /api/attendance (toggle Je viendrai), /api/contributions (totaux calculés serveur), /api/polls + vote (bascule/annule), /api/announcements, /api/content, /api/settings, /api/prayer-times (Aladhan API méthode UOIF, IPv4 forcé via https family:4, cache mémoire, fallback)
- Frontend : WelcomeGate (logo tariqa.png animé : halo doré, anneaux, particules PRNG mulberry32 pour éviter mismatch d'hydratation — Math.sin n'est PAS portable entre moteurs JS), HeaderBar (date + prochaine prière + countdown), Annonces (vert/corail sur blanc), IjtimaSection (groupée par semaine, Je viendrai, listes attendus/invités, programme), NewMeetingDialog (modèles, icônes, programme, invités), SalatSection (Jour/Semaine/Mois, vraies heures), ContentSections (Adhkâr 6, Qur'ân 4, Samâ' 3, Durûs 4), CotisationSection (caisse totale, formulaire, classement contributeurs avec barres, historique filtrable), ZiyaraSection (montant pour le Shaykh calculé automatiquement, stats participants/moyenne/pourcentage), SondagesSection (vote avec barres %, voir qui a voté), SettingsDialog (jours d'ijtima' éditables avec switches + heures, rôles trésorier unique + admin par défaut, ajout membres), ProfileDialog (Je suis… avec suggestions)
- Palette : fond crème #fbf9f4 + blanc, vert profond #0b5d42, or #b8923a/#c9a24b — FONDS DE DOCUMENTS BLANCS (demande explicite), plus de marron/taupe
- Sticky footer ✓, responsive mobile 390px ✓, FAB Réunion ✓
- Corrections : Prisma Cascade/SetNull capitalisés, relation PollCreator complète, icône lucide Coin→Coins, hydratation particules (mulberry32), setState-in-effect refactorés (état dérivé), fetch Aladhan IPv4

Stage Summary:
- Application complète vérifiée via agent-browser : entrée prénom → page principale, toutes sections dépliables, vote bascule (7→8 constant 10), ajout contribution ZIYARA → recalcul auto 75€→90€→8 participants, publication réunion (4 réunions), sauvegarde jours ijtima (Lundi désactivé), trésorier unique (Abde), footer sticky bottom 843.75/844, responsive OK, zéro erreur console/hydratation, lint 0 erreur
- Logo : le fichier téléchargement.png de l'utilisateur n'est PAS arrivé dans /home/z/my-project/upload/ (dossier vide) → logo original tariqa.png utilisé en placeholder, remplacable dans /public/tariqa.png
- Prochaines phases possibles : notifications push, mode sombre, édition/suppression annonces, statistiques graphiques, export PDF des comptes

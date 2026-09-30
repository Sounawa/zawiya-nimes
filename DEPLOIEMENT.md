# Déploiement — Zawiya Nîmes

> **Où en est-on ?** Le site est terminé et fonctionnel dans l'environnement de
> développement. Pour le mettre en ligne (comme l'était
> `zaouia-st-denis.netlify.app`), il faut deux choses : un dépôt GitHub et un
> hébergement. Ce document explique la marche à suivre, pas à pas.

---

## 1. Pourquoi ce n'est pas encore fait

Les tokens (GitHub, Netlify) envoyés dans une conversation précédente **ont été
perdus** : cette conversation est arrivée à bout de contexte, et l'environnement
a été réinitialisé entre-temps. Seul le code (sauvegardé, versionné, testé) a
survécu — les secrets, eux, ne passent pas d'une session à l'autre.

> ⚠️ **Sécurité — à faire tout de suite :** les tokens d'hier dorment dans une
> conversation morte. Va les **révoquer** :
> - GitHub : Settings → Developer settings → Personal access tokens → supprimer
> - Netlify : User settings → Applications → révoquer

---

## 2. Ce que je te demande (5 minutes, sans rien installer)

### Étape A — Créer le dépôt GitHub (vide)

1. Connecte-toi sur [github.com](https://github.com) (crée un compte si besoin)
2. Clique **+** en haut à droite → **New repository**
3. Nom : `zawiya-nimes` — Visibilité : **Private** (recommandé)
4. **NE COCHE RIEN** (pas de README, pas de .gitignore, pas de licence — le
   dépôt doit rester vide)
5. **Create repository**

### Étape B — Créer le token

1. GitHub → photo de profil → **Settings**
2. Tout en bas : **Developer settings**
3. **Personal access tokens → Tokens (classic)** → **Generate new token (classic)**
4. Note : `deploiement-zawiya` — Expiration : `30 days`
5. Coche **uniquement** : `repo`
6. **Generate token** → copie la chaîne `ghp_…` (tu ne la reverras plus affichée)

### Étape C — Envoie-moi dans le chat

```
Utilisateur GitHub : <ton-pseudo>
Dépôt : zawiya-nimes
Token  : ghp_xxxxxxxxxxxxxxxxxxxx
```

Je lance alors le script `scripts/publier-github.sh` et le code part sur
GitHub. **Révoque le token juste après** (Settings → Developer settings →
supprimer `deploiement-zawiya`).

> 💡 Tu peux aussi le faire toi-même sans rien me donner :
> ```bash
> ./scripts/publier-github.sh ghp_xxx <ton-pseudo> zawiya-nimes
> ```

---

## 3. Ce qui a été préparé (déjà fait, côté projet)

- ✅ **Nettoyage sécurité du dépôt git** : la base des membres (`db/custom.db`),
  les codes de test, le fichier `.env`, les captures QA et les sources
  téléchargées (PDF du kitāb…) sont **exclus du suivi git** — ils ne partiront
  jamais sur GitHub. Ils restent présents sur le disque de développement.
- ✅ **Script de publication** : `scripts/publier-github.sh` (connexion, push,
  retrait automatique du token de la config git).
- ✅ Ce guide.

---

## 4. Mettre le site EN LIGNE — choisir l'hébergement

⚠️ **Point technique important** : l'application utilise une base **SQLite**
(fichier local, où vivent les membres, réunions, présences, cotisations). Les
hébergeurs « serverless » gratuits (Netlify, Vercel) **effacent les fichiers à
chaque redémarrage** → le registre des frères disparaîtrait. Trois options :

| Option | Coût | Avantages | Inconvénients |
|---|---|---|---|
| **A. Petit serveur (VPS OVH/Hetzner)** | ~4-7 €/mois | Tout marche tel quel, données fiables, nom de domaine possible (zawiya-nimes.fr) | Il faut payer un abonnement |
| **B. Migration Supabase + Netlify/Vercel** | Gratuit | Gratuit pour toujours, c'est ce qu'utilisait le site original St-Denis | Il faut que je migre la base (quelques heures de travail, rien à payer) |
| **C. Rester sur le panneau de prévisualisation** | Gratuit | Zéro travail, tout est déjà là | Pas d'adresse publique à partager aux frères |

**Ma recommandation : Option B** — crée un compte gratuit sur
[supabase.com](https://supabase.com), envoie-moi l'URL du projet + la clé
`service_role` (Settings → API), je migre la base et je déploie sur Netlify
avec l'adresse que tu choisiras.

---

## 5. Checklist finale

- [ ] Révoquer les tokens d'hier
- [ ] Créer le dépôt GitHub vide (privé)
- [ ] Créer le token `repo` (30 jours)
- [ ] Envoyer pseudo + dépôt + token dans le chat → **je pousse le code**
- [ ] Choisir l'hébergeur (A / B / C)
- [ ] (Option B) Créer le compte Supabase et m'envoyer les clés

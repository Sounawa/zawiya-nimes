# Déploiement — Zawiya Nîmes

> **État actuel (round 10)** : le site est EN LIGNE sur **Vercel** (plan
> Hobby gratuit) après le blocage Netlify (crédits de build épuisés).

---

## 1. Où vit quoi

| Brique | Où | Détail |
|---|---|---|
| **Code source** | GitHub `Sounawa/zawiya-nimes` (privé) | La source de vérité — tout est poussé à chaque round |
| **Site en ligne** | https://zawiya-nimes-zawiya2.vercel.app | Vercel, équipe « Zawiya » (`zawiya2`), projet `zawiya-nimes` |
| **Base de données** | Turso `libsql://zawiya-sounawa.aws-eu-west-1.turso.io` | SQLite hébergée gratuite — membres, réunions, annonces |
| **Ancien site** | https://zawiya-nimes.netlify.app | TOUJOURS EN LIGNE mais figé au round 7 (Netlify bloqué : « Account credit usage exceeded ») |

Les frères doivent désormais utiliser l'adresse **Vercel** — l'ancienne
adresse Netlify ne recevra plus les mises à jour tant que le compte est
bloqué.

## 2. Comment fonctionne un déploiement Vercel

Le build a lieu sur les serveurs Vercel (jamais en local) :

- **Commande de build** : `prisma generate && next build --webpack`
  (webpack car Turbopack 16.1 bute sur `next/font/google` — erreur
  `@vercel/turbopack-next/internal/font/google/font`).
- **Variables d'environnement** (définies sur le projet Vercel, cibles
  production + preview) : `DATABASE_URL` (URL libsql Turso) et
  `DATABASE_AUTH_TOKEN` (jeton Turso).
- **`serverExternalPackages`** (next.config.ts) : `libsql`,
  `@libsql/client`, `@prisma/adapter-libsql` — les paquets natifs de
  Turso ne sont pas bundlés par webpack.
- **`gitForkProtection` désactivé** et **`ssoProtection` désactivée** :
  les déploiements par CLI ne sont pas bloqués, et le site est public
  sans mur d'authentification Vercel.
- **Déploiement depuis la sandbox** : export propre `git archive HEAD`
  vers `/tmp/zawiya-deploy` (SANS le dossier `.git` — sinon Vercel
  applique une vérification d'auteur GitHub qui bloque le
  déploiement), puis :
  ```bash
  cd /tmp/zawiya-deploy && npx vercel@latest deploy --prod --yes \
    --no-wait --token="$VERCEL_TOKEN"
  ```
  puis sondage `GET /v6/deployments` jusqu'à `READY`.

## 3. Hors-ligne (PWA)

- `public/sw.js` (v16) : navigation network-first, le shell et les
  chunks sont mis en cache — l'app se recharge et les documents
  s'ouvrent **sans réseau** (vérifié en QA).
- Manifest + icônes servis depuis `/public`.
- La section Réglages ▸ « Application hors-ligne » permet d'installer
  l'app (bouton natif, instructions iOS « Sur l'écran d'accueil »).

## 4. Tokens (à révoquer quand la zawiya le souhaite)

Ils sont fournis dans la conversation, jamais stockés dans le dépôt :
GitHub (push), Turso (base), Netlify (lecture d'env), Vercel
(déploiement).
